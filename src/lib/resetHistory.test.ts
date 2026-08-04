import { afterEach, describe, expect, it, vi } from "vitest";
import { resetHistoryAndNavigate } from "./resetHistory";

const originalGo = window.history.go;
const originalState = Object.getOwnPropertyDescriptor(window.history, "state");

function setHistoryState(idx: number | undefined) {
  Object.defineProperty(window.history, "state", {
    configurable: true,
    get: () => (idx === undefined ? null : { idx }),
  });
}

describe("resetHistoryAndNavigate", () => {
  afterEach(() => {
    window.history.go = originalGo;
    if (originalState) {
      Object.defineProperty(window.history, "state", originalState);
    }
    vi.useRealTimers();
  });

  it("navigates immediately when there is no router index", () => {
    setHistoryState(undefined);
    const navigate = vi.fn();

    resetHistoryAndNavigate(navigate, "/login");

    expect(navigate).toHaveBeenCalledExactlyOnceWith("/login");
  });

  it("navigates immediately when the router index is 0", () => {
    setHistoryState(0);
    const navigate = vi.fn();

    resetHistoryAndNavigate(navigate, "/login");

    expect(navigate).toHaveBeenCalledExactlyOnceWith("/login");
  });

  it("goes back to the first entry, then navigates once popstate fires", () => {
    vi.useFakeTimers();
    setHistoryState(3);
    const go = vi.fn(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    window.history.go = go;
    const navigate = vi.fn();

    resetHistoryAndNavigate(navigate, "/login");

    expect(go).toHaveBeenCalledWith(-3);
    expect(navigate).toHaveBeenCalledExactlyOnceWith("/login");
    vi.advanceTimersByTime(500);
    expect(navigate).toHaveBeenCalledExactlyOnceWith("/login");
  });

  it("removes the popstate listener and timer once settled", () => {
    vi.useFakeTimers();
    setHistoryState(1);
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    const go = vi.fn(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    window.history.go = go;
    const navigate = vi.fn();

    resetHistoryAndNavigate(navigate, "/login");

    expect(removeEventListener).toHaveBeenCalledWith("popstate", expect.any(Function));
    vi.advanceTimersByTime(100);
    expect(navigate).toHaveBeenCalledExactlyOnceWith("/login");
  });

  it("navigates via the fallback timer when no popstate fires", () => {
    vi.useFakeTimers();
    setHistoryState(2);
    window.history.go = vi.fn();
    const navigate = vi.fn();

    resetHistoryAndNavigate(navigate, "/login");

    expect(navigate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(99);
    expect(navigate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(navigate).toHaveBeenCalledExactlyOnceWith("/login");
  });
});
