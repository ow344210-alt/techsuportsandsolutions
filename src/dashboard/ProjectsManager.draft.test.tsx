import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { ThemeContext } from "../context/ThemeContext.types";
import type { ThemeContextType } from "../context/ThemeContext.types";
import type { Project, ProjectPayload } from "../lib/projects";

const { swalFire } = vi.hoisted(() => ({ swalFire: vi.fn() }));
const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("sweetalert2", () => ({ default: { fire: swalFire } }));
vi.mock("react-hot-toast", () => ({
  default: { success: toastSuccess, error: toastError, info: vi.fn(), warning: vi.fn() },
}));
vi.mock("../lib/projects", () => ({
  fetchAllProjects: vi.fn(),
  deleteProject: vi.fn(),
  updateProject: vi.fn(),
  createProject: vi.fn(),
  uploadProjectImage: vi.fn(),
  deleteProjectImage: vi.fn(),
  swapProjectOrder: vi.fn(),
}));

import ProjectsManager from "./ProjectsManager";
import { fetchAllProjects, createProject } from "../lib/projects";

const CREATE_KEY = "admin-project-create-draft";

const themeValue: ThemeContextType = {
  theme: "dark",
  toggleTheme: vi.fn(),
  setTheme: vi.fn(),
};

const project = {
  id: "proj-1",
  title: "Project Alpha",
  description: "A test project",
  category: "Web Development",
  technologies: [],
  image_url: null,
  live_url: null,
  github_url: null,
  status: "Draft",
  is_active: true,
  order_index: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
} as Project;

const DRAFT_VALUES: ProjectPayload = {
  title: "Draft Title",
  description: "Draft description",
  category: "Web Development",
  technologies: ["React"],
  image_url: null,
  live_url: null,
  github_url: null,
  status: "Draft",
  is_active: true,
};

function seedDraft(values: ProjectPayload = DRAFT_VALUES) {
  window.localStorage.setItem(
    CREATE_KEY,
    JSON.stringify({ values, updatedAt: "2026-08-05T10:00:00.000Z", version: 1 }),
  );
}

function renderManager() {
  return render(
    <ThemeContext.Provider value={themeValue}>
      <ProjectsManager />
    </ThemeContext.Provider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  swalFire.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
  vi.mocked(fetchAllProjects).mockReset();
  vi.mocked(fetchAllProjects).mockResolvedValue([project]);
  vi.mocked(createProject).mockReset();
});

describe("ProjectsManager draft persistence", () => {
  it("restores a stored create draft into the add form and shows a toast", async () => {
    seedDraft();
    renderManager();
    await screen.findByText("Project Alpha");

    fireEvent.click(screen.getByRole("button", { name: /add project/i }));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Unsaved draft restored."));
    const form = screen.getByRole("heading", { name: /add project/i }).closest("form") as HTMLFormElement;
    const titleInput = within(form).getAllByRole("textbox")[0] as HTMLInputElement;
    expect(titleInput.value).toBe("Draft Title");
  });

  it("clears the draft after a successful create submit", async () => {
    seedDraft();
    const created = {
      ...DRAFT_VALUES,
      id: "proj-new",
      order_index: 1,
      created_at: "2026-08-06T00:00:00Z",
      updated_at: "2026-08-06T00:00:00Z",
    };
    vi.mocked(createProject).mockResolvedValue(created as Project);
    renderManager();
    await screen.findByText("Project Alpha");

    fireEvent.click(screen.getByRole("button", { name: /add project/i }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Unsaved draft restored."));

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(createProject).toHaveBeenCalled());
    expect(window.localStorage.getItem(CREATE_KEY)).toBeNull();
  });

  it("keeps the draft when the form is cancelled without saving", async () => {
    seedDraft();
    renderManager();
    await screen.findByText("Project Alpha");

    fireEvent.click(screen.getByRole("button", { name: /add project/i }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Unsaved draft restored."));

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(window.localStorage.getItem(CREATE_KEY)).not.toBeNull();
  });
});
