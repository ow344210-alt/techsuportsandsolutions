import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeContext } from "../context/ThemeContext.types";
import type { ThemeContextType } from "../context/ThemeContext.types";
import type { Project } from "../lib/projects";

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
import { fetchAllProjects, deleteProject } from "../lib/projects";

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

function renderManager() {
  return render(
    <ThemeContext.Provider value={themeValue}>
      <ProjectsManager />
    </ThemeContext.Provider>,
  );
}

beforeEach(() => {
  swalFire.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
  vi.mocked(fetchAllProjects).mockReset();
  vi.mocked(fetchAllProjects).mockResolvedValue([project]);
  vi.mocked(deleteProject).mockReset();
  vi.mocked(deleteProject).mockResolvedValue(undefined);
});

describe("ProjectsManager delete confirmation", () => {
  it("deletes the project and shows a success toast when confirmed", async () => {
    swalFire.mockResolvedValue({ isConfirmed: true });
    renderManager();

    await screen.findByText("Project Alpha");
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => expect(deleteProject).toHaveBeenCalledWith("proj-1", null));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Project deleted successfully."),
    );
    expect(screen.queryByText("Project Alpha")).not.toBeInTheDocument();
  });

  it("does not delete the project when the dialog is cancelled", async () => {
    swalFire.mockResolvedValue({ isConfirmed: false });
    renderManager();

    await screen.findByText("Project Alpha");
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => expect(swalFire).toHaveBeenCalled());
    expect(deleteProject).not.toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
  });

  it("shows an error toast, keeps the project, and resets deleting state on failure", async () => {
    swalFire.mockResolvedValue({ isConfirmed: true });
    vi.mocked(deleteProject).mockRejectedValue(new Error("DB failure"));
    renderManager();

    await screen.findByText("Project Alpha");
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("DB failure"));
    expect(screen.getByText("Project Alpha")).toBeInTheDocument();

    await waitFor(() => {
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      expect(deleteButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.every((b) => !(b as HTMLButtonElement).disabled)).toBe(true);
    });
  });
});

describe("ProjectsManager category filter and add form", () => {
  it("renders the category dropdown with all unchanged options", async () => {
    renderManager();
    await screen.findByText("Project Alpha");

    fireEvent.click(screen.getByRole("combobox", { name: "All Categories" }));

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(10);
    expect(screen.getByRole("option", { name: "All Categories" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Web Development" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Mobile App" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Software Solution" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Digital Marketing" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Automation" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "IT Consulting" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "E-Commerce" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "SaaS" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Other" })).toBeInTheDocument();
  });

  it("filters projects by category and resets back to All", async () => {
    renderManager();
    await screen.findByText("Project Alpha");

    fireEvent.click(screen.getByRole("combobox", { name: "All Categories" }));
    fireEvent.pointerDown(screen.getByRole("option", { name: "Mobile App" }));

    expect(screen.queryByText("Project Alpha")).not.toBeInTheDocument();
    expect(screen.getByText("No projects found.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("combobox", { name: "Mobile App" }));
    fireEvent.pointerDown(screen.getByRole("option", { name: "All Categories" }));

    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
  });

  it("renders the add form dropdowns with exact category and status options", async () => {
    renderManager();
    await screen.findByText("Project Alpha");

    fireEvent.click(screen.getByRole("button", { name: /add project/i }));

    expect(screen.getAllByRole("combobox")).toHaveLength(3);

    fireEvent.click(screen.getByRole("combobox", { name: "Web Development" }));
    expect(screen.getAllByRole("option")).toHaveLength(9);
    expect(screen.queryByRole("option", { name: "All Categories" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Mobile App" })).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("combobox", { name: "Web Development" }), { key: "Escape" });

    fireEvent.click(screen.getByRole("combobox", { name: "Draft" }));
    expect(screen.getByRole("option", { name: "Draft" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Published" })).toBeInTheDocument();
  });
});
