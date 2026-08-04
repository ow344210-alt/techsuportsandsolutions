import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeContext } from "../context/ThemeContext.types";
import type { ThemeContextType } from "../context/ThemeContext.types";

const { swalFire } = vi.hoisted(() => ({ swalFire: vi.fn() }));
const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("sweetalert2", () => ({ default: { fire: swalFire } }));
vi.mock("react-hot-toast", () => ({
  default: { success: toastSuccess, error: toastError, info: vi.fn(), warning: vi.fn() },
}));
vi.mock("../lib/userManagement", () => ({
  fetchAllUsers: vi.fn(),
  updateUserRole: vi.fn(),
  setUserDisabled: vi.fn(),
}));
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "admin-1", email: "admin@test.com" } }),
}));

import UserManagement from "./UserManagement";
import { fetchAllUsers, updateUserRole, setUserDisabled } from "../lib/userManagement";
import type { ManagedUser } from "../lib/userManagement";

const themeValue: ThemeContextType = {
  theme: "dark",
  toggleTheme: vi.fn(),
  setTheme: vi.fn(),
};

const customerUser = {
  id: "user-1",
  email: "jane@test.com",
  role: "customer",
  is_disabled: false,
  created_at: "2026-01-01T00:00:00Z",
} as ManagedUser;

function renderManager() {
  return render(
    <ThemeContext.Provider value={themeValue}>
      <UserManagement />
    </ThemeContext.Provider>,
  );
}

beforeEach(() => {
  swalFire.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
  vi.mocked(fetchAllUsers).mockReset();
  vi.mocked(updateUserRole).mockReset();
  vi.mocked(setUserDisabled).mockReset();
  vi.mocked(fetchAllUsers).mockResolvedValue([customerUser]);
  vi.mocked(updateUserRole).mockResolvedValue(undefined);
  vi.mocked(setUserDisabled).mockResolvedValue(undefined);
});

describe("UserManagement role and status controls", () => {
  it("promotes a customer to admin through the confirm dialog", async () => {
    swalFire.mockResolvedValue({ isConfirmed: true });
    renderManager();

    await screen.findByText("jane@test.com");
    expect(screen.getByText("Customer")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /make admin/i }));

    await waitFor(() =>
      expect(swalFire).toHaveBeenCalledWith(
        expect.objectContaining({ confirmButtonText: "Make Admin" }),
      ),
    );
    await waitFor(() => expect(updateUserRole).toHaveBeenCalledWith("user-1", "admin"));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Admin role updated successfully."),
    );
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.queryByText("Customer")).not.toBeInTheDocument();
  });

  it("does not change the role when the confirm dialog is cancelled", async () => {
    swalFire.mockResolvedValue({ isConfirmed: false });
    renderManager();

    await screen.findByText("jane@test.com");
    fireEvent.click(screen.getByRole("button", { name: /make admin/i }));

    await waitFor(() => expect(swalFire).toHaveBeenCalled());
    expect(updateUserRole).not.toHaveBeenCalled();
    expect(screen.getByText("Customer")).toBeInTheDocument();
  });

  it("shows an error toast and keeps the role when the API call fails", async () => {
    swalFire.mockResolvedValue({ isConfirmed: true });
    vi.mocked(updateUserRole).mockRejectedValue(new Error("DB failure"));
    renderManager();

    await screen.findByText("jane@test.com");
    fireEvent.click(screen.getByRole("button", { name: /make admin/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Something went wrong. Please try again."));
    expect(screen.getByText("Customer")).toBeInTheDocument();
  });

  it("disables an account through the confirm dialog", async () => {
    swalFire.mockResolvedValue({ isConfirmed: true });
    renderManager();

    await screen.findByText("jane@test.com");
    fireEvent.click(screen.getByRole("button", { name: /disable/i }));

    await waitFor(() => expect(setUserDisabled).toHaveBeenCalledWith("user-1", true));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Account disabled successfully."),
    );
    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });

  it("re-enables a disabled account", async () => {
    const disabledUser = { ...customerUser, is_disabled: true };
    vi.mocked(fetchAllUsers).mockResolvedValue([disabledUser]);
    swalFire.mockResolvedValue({ isConfirmed: true });
    renderManager();

    await screen.findByText("jane@test.com");
    expect(screen.getByText("Disabled")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /enable/i }));

    await waitFor(() => expect(setUserDisabled).toHaveBeenCalledWith("user-1", false));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Account enabled successfully."),
    );
    expect(screen.queryByText("Disabled")).not.toBeInTheDocument();
  });
});
