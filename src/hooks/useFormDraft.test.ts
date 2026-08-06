import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useFormDraft } from "./useFormDraft";
import type { FormDraft, UseFormDraftOptions } from "./useFormDraft";

interface TestForm {
  title: string;
  imageUrl: string | null;
}

const CREATE_KEY = "admin-project-create-draft";
const EDIT_KEY = "admin-project-edit-draft-proj-1";

const EMPTY: TestForm = { title: "", imageUrl: null };

function draftOf(title: string, updatedAt = "2026-08-05T10:00:00.000Z", version = 1) {
  return JSON.stringify({ values: { title, imageUrl: null }, updatedAt, version });
}

let options: UseFormDraftOptions<TestForm>;
let onRestore: (values: TestForm, draft: FormDraft<TestForm>) => void;

function render() {
  return renderHook(() => useFormDraft(options));
}

beforeEach(() => {
  window.localStorage.clear();
  onRestore = vi.fn();
  options = {
    formName: "project",
    values: EMPTY,
    active: false,
    debounceMs: 50,
    onRestore,
  };
});

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("useFormDraft saving", () => {
  it("persists a debounced draft once the user edits the form", async () => {
    const { result, rerender } = render();
    act(() => {
      options = { ...options, active: true };
      rerender();
    });
    act(() => {
      options = { ...options, values: { title: "Hello", imageUrl: null } };
      rerender();
    });
    await waitFor(() => {
      const saved = window.localStorage.getItem(CREATE_KEY);
      expect(saved).not.toBeNull();
      expect(JSON.parse(saved!).values.title).toBe("Hello");
      expect(JSON.parse(saved!).version).toBe(1);
    });
    expect(result.current.hasDraft).toBe(false);
  });

  it("does not save an untouched form", async () => {
    const { rerender } = render();
    act(() => {
      options = { ...options, active: true };
      rerender();
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(window.localStorage.getItem(CREATE_KEY)).toBeNull();
  });

  it("does not save when the form is closed, and keeps a saved draft", async () => {
    const { rerender } = render();
    act(() => {
      options = { ...options, active: true };
      rerender();
    });
    act(() => {
      options = { ...options, values: { title: "WIP", imageUrl: null } };
      rerender();
    });
    await waitFor(() => expect(window.localStorage.getItem(CREATE_KEY)).not.toBeNull());
    act(() => {
      options = { ...options, active: false };
      rerender();
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(JSON.parse(window.localStorage.getItem(CREATE_KEY)!).values.title).toBe("WIP");
  });

  it("increments the version on subsequent saves", async () => {
    const { rerender } = render();
    act(() => {
      options = { ...options, active: true };
      rerender();
    });
    act(() => {
      options = { ...options, values: { title: "A", imageUrl: null } };
      rerender();
    });
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(CREATE_KEY)!).version).toBe(1));
    act(() => {
      options = { ...options, values: { title: "AB", imageUrl: null } };
      rerender();
    });
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(CREATE_KEY)!).version).toBe(2));
  });
});

describe("useFormDraft restoring", () => {
  it("auto-restores a stored draft when the form opens", async () => {
    window.localStorage.setItem(CREATE_KEY, draftOf("Saved"));
    const { result, rerender } = render();
    act(() => {
      options = { ...options, active: true };
      rerender();
    });
    await waitFor(() => expect(onRestore).toHaveBeenCalledTimes(1));
    expect(onRestore).toHaveBeenCalledWith(
      { title: "Saved", imageUrl: null },
      expect.objectContaining({ version: 1 }),
    );
    expect(result.current.hasDraft).toBe(true);
    expect(result.current.restored).toBe(true);
  });

  it("restores only once even across re-renders", async () => {
    window.localStorage.setItem(CREATE_KEY, draftOf("Saved"));
    const { rerender } = render();
    act(() => {
      options = { ...options, active: true };
      rerender();
    });
    await waitFor(() => expect(onRestore).toHaveBeenCalledTimes(1));
    act(() => {
      rerender();
      rerender();
    });
    await waitFor(() => expect(onRestore).toHaveBeenCalledTimes(1));
  });

  it("uses separate keys for create and edit forms", async () => {
    window.localStorage.setItem(EDIT_KEY, draftOf("Edit Draft"));
    const { rerender } = render();
    act(() => {
      options = { ...options, active: true, id: "proj-1", values: { title: "Record", imageUrl: null } };
      rerender();
    });
    await waitFor(() => expect(onRestore).toHaveBeenCalledTimes(1));
    expect(onRestore).toHaveBeenCalledWith({ title: "Edit Draft", imageUrl: null }, expect.anything());
    expect(window.localStorage.getItem(CREATE_KEY)).toBeNull();
  });

  it("ignores and removes a corrupted draft", async () => {
    window.localStorage.setItem(CREATE_KEY, "{not-json");
    const { rerender } = render();
    act(() => {
      options = { ...options, active: true };
      rerender();
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(onRestore).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(CREATE_KEY)).toBeNull();
  });

  it("ignores and removes a draft with an invalid shape", async () => {
    window.localStorage.setItem(CREATE_KEY, JSON.stringify({ foo: "bar" }));
    const { rerender } = render();
    act(() => {
      options = { ...options, active: true };
      rerender();
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(onRestore).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(CREATE_KEY)).toBeNull();
  });

  it("flags an edit conflict when the record is newer than the draft", async () => {
    window.localStorage.setItem(
      EDIT_KEY,
      draftOf("Old", "2026-08-05T10:00:00.000Z"),
    );
    const { result, rerender } = render();
    act(() => {
      options = {
        ...options,
        active: true,
        id: "proj-1",
        recordUpdatedAt: "2026-08-05T12:00:00.000Z",
      };
      rerender();
    });
    await waitFor(() => expect(onRestore).toHaveBeenCalledTimes(1));
    expect(result.current.isConflict).toBe(true);
  });

  it("does not flag a conflict when the record is older than the draft", async () => {
    window.localStorage.setItem(
      EDIT_KEY,
      draftOf("Newer", "2026-08-05T12:00:00.000Z"),
    );
    const { result, rerender } = render();
    act(() => {
      options = {
        ...options,
        active: true,
        id: "proj-1",
        recordUpdatedAt: "2026-08-05T10:00:00.000Z",
      };
      rerender();
    });
    await waitFor(() => expect(onRestore).toHaveBeenCalledTimes(1));
    expect(result.current.isConflict).toBe(false);
  });
});

describe("useFormDraft clearing", () => {
  it("clears the draft on demand", async () => {
    window.localStorage.setItem(CREATE_KEY, draftOf("Saved"));
    const { result, rerender } = render();
    act(() => {
      options = { ...options, active: true };
      rerender();
    });
    await waitFor(() => expect(result.current.hasDraft).toBe(true));
    act(() => result.current.clear());
    expect(window.localStorage.getItem(CREATE_KEY)).toBeNull();
    expect(result.current.hasDraft).toBe(false);
  });

  it("does not re-restore after being cleared and kept open", async () => {
    window.localStorage.setItem(CREATE_KEY, draftOf("Saved"));
    const { result, rerender } = render();
    act(() => {
      options = { ...options, active: true };
      rerender();
    });
    await waitFor(() => expect(onRestore).toHaveBeenCalledTimes(1));
    act(() => result.current.clear());
    act(() => {
      rerender();
    });
    expect(onRestore).toHaveBeenCalledTimes(1);
  });
});

describe("useFormDraft image values", () => {
  it("stores URL-only image fields", async () => {
    const { rerender } = render();
    act(() => {
      options = { ...options, active: true };
      rerender();
    });
    act(() => {
      options = { ...options, values: { title: "X", imageUrl: "https://cdn.example/a.webp" } };
      rerender();
    });
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem(CREATE_KEY)!);
      expect(saved.values.imageUrl).toBe("https://cdn.example/a.webp");
      expect(saved.values).not.toEqual(expect.objectContaining({ file: expect.anything() }));
    });
  });
});
