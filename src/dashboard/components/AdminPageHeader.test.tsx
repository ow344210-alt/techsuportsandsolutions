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
