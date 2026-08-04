import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeContext } from "../../context/ThemeContext.types";
import type { ThemeContextType } from "../../context/ThemeContext.types";
import ResponsiveSelect from "./ResponsiveSelect";

const themeValue: ThemeContextType = {
  theme: "dark",
  toggleTheme: vi.fn(),
  setTheme: vi.fn(),
};

function renderSelect(props?: Partial<React.ComponentProps<typeof ResponsiveSelect>>) {
  const onChange = vi.fn();
  const utils = render(
    <ThemeContext.Provider value={themeValue}>
      <ResponsiveSelect
        value="one"
        onChange={onChange}
        options={[
          { value: "one", label: "Option One" },
          { value: "two", label: "Option Two" },
          { value: "three", label: "Option Three" },
        ]}
        {...props}
      />
    </ThemeContext.Provider>,
  );
  return { onChange, ...utils };
}

function openListbox() {
  fireEvent.click(screen.getByRole("combobox"));
}

describe("ResponsiveSelect", () => {
  it("renders the current selected value on the trigger", () => {
    renderSelect();
    expect(screen.getByRole("combobox")).toHaveTextContent("Option One");
  });

  it("renders a placeholder when nothing is selected", () => {
    renderSelect({ value: "", placeholder: "Select a value" });
    expect(screen.getByRole("combobox")).toHaveTextContent("Select a value");
  });

  it("opens the panel and renders every provided option", () => {
    renderSelect();
    openListbox();

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(screen.getByRole("option", { name: "Option One" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Option Two" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Option Three" })).toBeInTheDocument();
  });

  it("selecting an option calls onChange with the unchanged original value", () => {
    const { onChange } = renderSelect();
    openListbox();

    fireEvent.pointerDown(screen.getByRole("option", { name: "Option Two" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("two");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on Escape and keeps focus on the trigger", () => {
    renderSelect();
    openListbox();

    const trigger = screen.getByRole("combobox");
    fireEvent.keyDown(trigger, { key: "Escape" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on outside click", () => {
    renderSelect();
    openListbox();

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("supports ArrowDown + Enter keyboard selection", () => {
    const { onChange } = renderSelect();
    const trigger = screen.getByRole("combobox");

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("two");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("exposes the selected option with aria-selected", () => {
    renderSelect();
    openListbox();

    const selected = screen.getByRole("option", { name: "Option One" });
    const others = screen.getAllByRole("option").filter((option) => option !== selected);

    expect(selected).toHaveAttribute("aria-selected", "true");
    others.forEach((option) => expect(option).toHaveAttribute("aria-selected", "false"));
  });

  it("exposes ARIA combobox semantics on the trigger", () => {
    renderSelect({ ariaLabel: "Status filter" });

    const trigger = screen.getByRole("combobox", { name: "Status filter" });
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    openListbox();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls");
  });

  it("respects the disabled state and does not open", () => {
    renderSelect({ disabled: true });
    const trigger = screen.getByRole("combobox");

    expect(trigger).toBeDisabled();
    fireEvent.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not select a disabled option", () => {
    const { onChange } = renderSelect({
      options: [
        { value: "a", label: "Alpha" },
        { value: "b", label: "Beta", disabled: true },
      ],
    });
    openListbox();

    fireEvent.pointerDown(screen.getByRole("option", { name: "Beta" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("keeps long option labels structurally safe", () => {
    const longLabel =
      "A very long status label that must stay inside the panel and never force the page wider than the viewport";
    renderSelect({
      options: [
        { value: "a", label: "Short" },
        { value: "b", label: longLabel },
      ],
    });
    openListbox();

    const panel = screen.getByRole("listbox");
    expect(panel.style.maxWidth).toBe("calc(100vw - 24px)");
    expect(panel.style.maxHeight).toBe("320px");

    const option = screen.getByRole("option", { name: longLabel });
    const label = option.querySelector("span");
    expect(label?.className).toContain("truncate");
  });

  it("applies responsive viewport constraints to the panel", () => {
    renderSelect();
    openListbox();

    const panel = screen.getByRole("listbox");
    expect(panel).toHaveClass("fixed");
    expect(panel).toHaveClass("overflow-y-auto");
    expect(panel.style.maxWidth).toBe("calc(100vw - 24px)");
    expect(panel.style.maxHeight).toBeTruthy();
  });

  it("keeps the trigger fully responsive and touch friendly", () => {
    renderSelect();
    const trigger = screen.getByRole("combobox");

    expect(trigger.className).toContain("w-full");
    expect(trigger.className).toContain("min-w-0");
    expect(trigger.className).toContain("max-w-full");
    expect(trigger.style.minHeight).toBe("44px");

    const chevron = trigger.querySelector("svg");
    expect(chevron?.getAttribute("class")).toContain("shrink-0");
  });

  it("removes the portal panel on unmount and never leaves orphans", () => {
    const { unmount } = renderSelect();
    openListbox();

    expect(document.body.querySelector('[role="listbox"]')).not.toBeNull();

    unmount();
    expect(document.body.querySelector('[role="listbox"]')).toBeNull();
  });

  it("only keeps one panel open at a time across instances", async () => {
    const user = userEvent.setup();

    render(
      <ThemeContext.Provider value={themeValue}>
        <ResponsiveSelect
          value=""
          onChange={vi.fn()}
          options={[{ value: "a", label: "First A" }, { value: "b", label: "First B" }]}
        />
        <ResponsiveSelect
          value=""
          onChange={vi.fn()}
          options={[{ value: "x", label: "Second X" }, { value: "y", label: "Second Y" }]}
        />
      </ThemeContext.Provider>,
    );

    const triggers = screen.getAllByRole("combobox", { name: "Select" });
    expect(triggers).toHaveLength(2);
    fireEvent.click(triggers[0]);
    expect(screen.getAllByRole("listbox")).toHaveLength(1);

    await user.click(triggers[1]);

    expect(screen.getAllByRole("listbox")).toHaveLength(1);
    expect(screen.getByRole("option", { name: "Second X" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "First A" })).not.toBeInTheDocument();
  });
});
