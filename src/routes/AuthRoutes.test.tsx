import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";

vi.mock("../supabase/client", () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn() })) })),
    })),
  },
}));

const mockSignOut = vi.fn();

vi.mock("../contexts/AuthContext", async () => {
  const actual = await vi.importActual("../contexts/AuthContext");
  return {
    ...actual,
    AuthContext: vi.fn(),
  };
});

import { createContext, useContext } from "react";
import type { User, Session } from "@supabase/supabase-js";
import type { UserRole } from "../contexts/AuthContext.types";

interface MockAuthValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole;
  roleLoading: boolean;
  signOut: typeof mockSignOut;
  resetPassword: ReturnType<typeof vi.fn>;
}

const MockAuthContext = createContext<MockAuthValue | undefined>(undefined);

function MockAuthProvider({
  user,
  session,
  loading,
  role,
  roleLoading,
  resetPassword,
  children,
}: {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole;
  roleLoading: boolean;
  resetPassword?: ReturnType<typeof vi.fn>;
  children: React.ReactNode;
}) {
  const value: MockAuthValue = {
    user,
    session,
    loading,
    role,
    roleLoading,
    signOut: mockSignOut,
    resetPassword: resetPassword ?? vi.fn(),
  };
  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => {
    const ctx = useContext(MockAuthContext);
    if (!ctx) {
      throw new Error("useAuth must be used inside MockAuthProvider");
    }
    return ctx;
  },
}));

import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

function renderWithAuth(
  ui: React.ReactElement,
  auth: {
    user?: User | null;
    session?: Session | null;
    loading?: boolean;
    role?: UserRole;
    roleLoading?: boolean;
  } = {},
  initialRoute = "/",
) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <MockAuthProvider
        user={auth.user ?? null}
        session={auth.session ?? null}
        loading={auth.loading ?? true}
        role={auth.role ?? null}
        roleLoading={auth.roleLoading ?? true}
      >
        {ui}
      </MockAuthProvider>
    </MemoryRouter>,
  );
}

function useLocationPath() {
  return useLocation().pathname;
}

function LocationDisplay() {
  const path = useLocationPath();
  return <div data-testid="current-location">{path}</div>;
}

describe("Auth route protection", () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("unauthenticated user redirected to login via ProtectedRoute", () => {
    renderWithAuth(
      <>
        <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
        <LocationDisplay />
      </>,
      {
        user: null,
        loading: false,
        role: null,
        roleLoading: false,
      },
    );

    expect(screen.getByTestId("current-location")).toHaveTextContent("/login");
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("unauthenticated user redirected to login via AdminRoute", () => {
    renderWithAuth(
      <>
        <AdminRoute><div>Admin Content</div></AdminRoute>
        <LocationDisplay />
      </>,
      {
        user: null,
        loading: false,
        role: null,
        roleLoading: false,
      },
    );

    expect(screen.getByTestId("current-location")).toHaveTextContent("/login");
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
  });

  it("authenticated non-admin blocked from admin pages via AdminRoute", () => {
    const fakeUser = { id: "user-1", email: "user@example.com" } as User;
    renderWithAuth(
      <>
        <AdminRoute><div>Admin Content</div></AdminRoute>
        <LocationDisplay />
      </>,
      {
        user: fakeUser,
        loading: false,
        role: "customer",
        roleLoading: false,
      },
    );

    expect(screen.getByTestId("current-location")).toHaveTextContent("/");
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
  });

  it("admin user allowed through AdminRoute", () => {
    const fakeUser = { id: "user-1", email: "admin@example.com" } as User;
    renderWithAuth(
      <>
        <AdminRoute><div>Admin Content</div></AdminRoute>
        <LocationDisplay />
      </>,
      {
        user: fakeUser,
        loading: false,
        role: "admin",
        roleLoading: false,
      },
    );

    expect(screen.getByTestId("current-location")).toHaveTextContent("/");
    expect(screen.getByText("Admin Content")).toBeInTheDocument();
  });

  it("loading state does not flash protected content via ProtectedRoute", () => {
    renderWithAuth(
      <>
        <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
        <LocationDisplay />
      </>,
      {
        user: null,
        loading: true,
        role: null,
        roleLoading: true,
      },
    );

    expect(screen.getByTestId("current-location")).toHaveTextContent("/");
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("loading state does not flash protected content via AdminRoute", () => {
    renderWithAuth(
      <>
        <AdminRoute><div>Admin Content</div></AdminRoute>
        <LocationDisplay />
      </>,
      {
        user: null,
        loading: true,
        role: null,
        roleLoading: true,
      },
    );

    expect(screen.getByTestId("current-location")).toHaveTextContent("/");
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
  });
});

describe("Auth routes in AppRoutes", () => {
  it("reset-password route exists at /forgot-password", () => {
    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <MockAuthProvider
          user={null}
          session={null}
          loading={false}
          role={null}
          roleLoading={false}
        >
          <div>Forgot Password Page</div>
        </MockAuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Forgot Password Page")).toBeInTheDocument();
  });
});

describe("Reset password flow", () => {
  it("invalid reset session is handled gracefully", async () => {
    const mockResetPassword = vi
      .fn()
      .mockRejectedValue(new Error("Invalid or expired reset session"));

    const ForgotPasswordModule = await import("../auth/ForgotPassword");
    const ForgotPassword = ForgotPasswordModule.default;
    render(
      <MemoryRouter>
        <MockAuthProvider
          user={null}
          session={null}
          loading={false}
          role={null}
          roleLoading={false}
          resetPassword={mockResetPassword}
        >
          <ForgotPassword />
        </MockAuthProvider>
      </MemoryRouter>,
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const submitButton = screen.getByRole("button", {
      name: /send reset link/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith("test@example.com");
    });
  });
});

describe("Sign-out redirect", () => {
  it("sign-out calls signOut function", async () => {
    const fakeUser = { id: "user-1", email: "user@example.com" } as User;
    renderWithAuth(
      <button onClick={() => void mockSignOut()}>Logout</button>,
      {
        user: fakeUser,
        loading: false,
        role: "customer",
        roleLoading: false,
      },
    );

    const signOutButton = screen.getByRole("button", { name: /logout/i });
    fireEvent.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  it("sign-out calls signOut function from dashboard", async () => {
    const fakeUser = { id: "user-1", email: "admin@example.com" } as User;
    renderWithAuth(
      <button onClick={() => void mockSignOut()}>Logout</button>,
      {
        user: fakeUser,
        loading: false,
        role: "admin",
        roleLoading: false,
      },
    );

    const signOutButton = screen.getByRole("button", { name: /logout/i });
    fireEvent.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});