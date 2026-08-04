import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeContext } from "../../context/ThemeContext.types";
import type { ThemeContextType } from "../../context/ThemeContext.types";
import AdminPageHeader from "./AdminPageHeader";

const themeValue: ThemeContextType = {
  theme: "dark",
  toggleTheme: vi.fn(),
  setTheme: vi.fn(),
};

function renderHeader(props: {
  actionLabel?: string;
  onAction?: () => void;
  extra?: ReactNode;
  badge?: ReactNode;
}) {
  return render(
    <ThemeContext.Provider value={themeValue}>
      <AdminPageHeader title="Page Title" subtitle="A subtitle." {...props} />
    </ThemeContext.Provider>,
  );
}

describe("AdminPageHeader action button", () => {
  it("renders the action button with the shared no-wrap responsive classes", () => {
    renderHeader({ actionLabel: "Add FAQ", onAction: () => {} });

    const button = screen.getByRole("button", { name: "Add FAQ" });

    expect(button.className).toContain("inline-flex");
    expect(button.className).toContain("items-center");
    expect(button.className).toContain("justify-center");
    expect(button.className).toContain("gap-2");
    expect(button.className).toContain("whitespace-nowrap");
    expect(button.className).toContain("shrink-0");
    expect(button.className).toContain("min-h-11");
    expect(button.className).toContain("w-full");
    expect(button.className).toContain("sm:w-auto");
    expect(button.className).toContain("sm:min-w-[120px]");
    expect(button.className).not.toMatch(/(^|\s)w-\[|(^|\s)max-w-\[/);
  });

  it("does not add narrow fixed-width classes to the button", () => {
    renderHeader({ actionLabel: "New Section", onAction: () => {} });

    const button = screen.getByRole("button", { name: "New Section" });
    expect(button.className).not.toContain("w-40");
    expect(button.className).not.toContain("w-32");
    expect(button.className).not.toContain("max-w-");
  });

  it("invokes onAction when clicked", () => {
    const onAction = vi.fn();
    renderHeader({ actionLabel: "Add FAQ", onAction });

    fireEvent.click(screen.getByRole("button", { name: "Add FAQ" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});

describe("AdminPageHeader badge", () => {
  it("renders the badge beside the title in a flex-wrap row, outside the description", () => {
    renderHeader({
      badge: <span data-testid="live-badge">Live</span>,
      actionLabel: "Add FAQ",
      onAction: () => {},
    });

    const title = screen.getByRole("heading", { name: "Page Title" });
    const badge = screen.getByTestId("live-badge");
    const description = screen.getByText("A subtitle.");

    const headingRow = badge.closest("div[class*='flex']")!;
    expect(headingRow.className).toContain("flex-wrap");
    expect(headingRow.className).toContain("items-center");
    expect(headingRow.className).toContain("gap-3");
    expect(headingRow.contains(title)).toBe(true);
    expect(badge.parentElement?.className).toContain("shrink-0");

    expect(headingRow.contains(description)).toBe(false);
    expect(title.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("AdminPageHeader controls column", () => {
  it("allows extra controls and the action button to wrap as a group", () => {
    renderHeader({
      actionLabel: "New Section",
      onAction: () => {},
      extra: <div data-testid="page-selector">Home page</div>,
    });

    const button = screen.getByRole("button", { name: "New Section" });
    const controls = button.closest("div[class*='flex']");

    expect(controls).not.toBeNull();
    expect(controls!.className).toContain("flex-col");
    expect(controls!.className).toContain("sm:flex-row");
    expect(controls!.className).toContain("sm:flex-wrap");
    expect(controls!.className).toContain("min-w-0");
  });

  it("renders extra content before the action button", () => {
    renderHeader({
      actionLabel: "Add FAQ",
      onAction: () => {},
      extra: <div data-testid="page-selector">Home page</div>,
    });

    const selector = screen.getByTestId("page-selector");
    const button = screen.getByRole("button", { name: "Add FAQ" });
    const controls = button.closest("div[class*='flex']")!;

    expect(controls.contains(selector)).toBe(true);
    expect(selector.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
