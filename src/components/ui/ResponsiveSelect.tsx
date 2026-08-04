import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.types";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ResponsiveSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  ariaLabel?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  maxHeight?: number;
}

const EDGE_MARGIN = 12;
const GAP = 6;
const DEFAULT_MAX_HEIGHT = 320;
const MIN_PANEL_HEIGHT = 160;
const MIN_TRIGGER_HEIGHT = 44;

let currentPanel: { id: string; close: () => void } | null = null;

const ResponsiveSelect = forwardRef<HTMLDivElement, ResponsiveSelectProps>(
  (props, ref) => {
    const { value, onChange, options, placeholder, label, ariaLabel, id, disabled = false, required = false, error, className, maxHeight } = props;

    const { theme } = useTheme();
    const isDarkTheme = theme === "dark";

    const rootRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const typeaheadRef = useRef({ buffer: "", timestamp: 0 });

    const setRootRef = useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    const generatedId = useId();
    const panelId = `${generatedId}-listbox`;
    const labelId = `${generatedId}-label`;
    const buttonId = id || `${generatedId}-button`;

    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [position, setPosition] = useState<{
      top: number;
      left: number;
      maxHeight: number;
      width?: number;
    } | null>(null);

    const activeOptionId = useCallback((index: number) => `${panelId}-option-${index}`, [panelId]);

    const closePanel = useCallback(() => {
      if (currentPanel?.id === buttonId) {
        currentPanel = null;
      }
      setOpen(false);
      setPosition(null);
    }, [buttonId]);

    const openPanel = useCallback(() => {
      currentPanel?.close();
      currentPanel = { id: buttonId, close: closePanel };
      setOpen(true);
    }, [buttonId, closePanel]);

    const updatePosition = useCallback(() => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      const rect = trigger.getBoundingClientRect();
      const panelWidth = panel.offsetWidth || rect.width;
      const naturalHeight = panel.offsetHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const spaceBelow = viewportHeight - rect.bottom - EDGE_MARGIN;
      const spaceAbove = rect.top - EDGE_MARGIN;

      const fitsBelow = spaceBelow >= naturalHeight;
      const fitsAbove = spaceAbove >= naturalHeight;
      const placeBelow = fitsBelow || (!fitsAbove && spaceBelow >= spaceAbove);

      const cap = Math.max(MIN_PANEL_HEIGHT, maxHeight ?? DEFAULT_MAX_HEIGHT);
      const available = placeBelow ? spaceBelow : spaceAbove;
      const panelMaxHeight = Math.max(MIN_PANEL_HEIGHT, Math.min(available - GAP, cap));
      const effectiveHeight = Math.min(naturalHeight, panelMaxHeight);
      const top = placeBelow ? rect.bottom + GAP : rect.top - GAP - effectiveHeight;

      let left = rect.left;
      if (left + panelWidth > viewportWidth - EDGE_MARGIN) {
        left = viewportWidth - panelWidth - EDGE_MARGIN;
      }
      if (left < EDGE_MARGIN) {
        left = EDGE_MARGIN;
      }

      setPosition({
        top,
        left,
        maxHeight: panelMaxHeight,
        width: panelWidth,
      });
    }, [maxHeight]);

    useLayoutEffect(() => {
      if (!open) return;
      updatePosition();
    }, [open, updatePosition]);

    useEffect(() => {
      if (!open) return;

      const reposition = () => updatePosition();
      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target as Node;
        if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
        closePanel();
      };

      window.addEventListener("resize", reposition);
      window.addEventListener("orientationchange", reposition);
      window.addEventListener("scroll", reposition, { capture: true, passive: true });
      document.addEventListener("pointerdown", handlePointerDown);

      return () => {
        window.removeEventListener("resize", reposition);
        window.removeEventListener("orientationchange", reposition);
        window.removeEventListener("scroll", reposition, { capture: true });
        document.removeEventListener("pointerdown", handlePointerDown);
      };
    }, [open, updatePosition, closePanel]);

    useEffect(() => {
      if (!open || activeIndex < 0) return;
      const element = document.getElementById(activeOptionId(activeIndex));
      element?.scrollIntoView?.({ block: "nearest" });
    }, [open, activeIndex, panelId, activeOptionId]);

    useEffect(() => {
      return () => {
        if (currentPanel?.id === buttonId) {
          currentPanel = null;
        }
      };
    }, [buttonId]);

    const openAndActivate = useCallback(() => {
      const index = options.findIndex((option) => option.value === value);
      setActiveIndex(index >= 0 ? index : 0);
      openPanel();
    }, [options, value, openPanel]);

    const closeAndRestore = useCallback(() => {
      closePanel();
      triggerRef.current?.focus();
    }, [closePanel]);

    const selectOption = useCallback(
      (index: number) => {
        const option = options[index];
        if (!option || option.disabled) return;
        onChange(option.value);
        closeAndRestore();
      },
      [options, onChange, closeAndRestore],
    );

    const moveActive = useCallback(
      (direction: "down" | "up") => {
        setActiveIndex((previous) => {
          const length = options.length;
          if (length === 0) return previous;
          const step = direction === "down" ? 1 : -1;
          let next = previous + step;
          for (let i = 0; i < length; i += 1) {
            const candidate = ((next % length) + length) % length;
            if (!options[candidate].disabled) return candidate;
            next += step;
          }
          return previous;
        });
      },
      [options],
    );

    const handleTypeahead = useCallback(
      (key: string) => {
        const now = Date.now();
        if (now - typeaheadRef.current.timestamp > 500) {
          typeaheadRef.current.buffer = "";
        }
        typeaheadRef.current.buffer += key.toLowerCase();
        typeaheadRef.current.timestamp = now;
        const buffer = typeaheadRef.current.buffer;
        const match = options.findIndex(
          (option) => !option.disabled && option.label.toLowerCase().startsWith(buffer),
        );
        if (match >= 0) setActiveIndex(match);
      },
      [options],
    );

    const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;

      if (open) {
        switch (event.key) {
          case "Escape":
            event.preventDefault();
            closeAndRestore();
            return;
          case "ArrowDown":
            event.preventDefault();
            moveActive("down");
            return;
          case "ArrowUp":
            event.preventDefault();
            moveActive("up");
            return;
          case "Home":
            event.preventDefault();
            setActiveIndex(options.findIndex((option) => !option.disabled));
            return;
          case "End":
            event.preventDefault();
            setActiveIndex(options.map((option) => !option.disabled).lastIndexOf(true));
            return;
          case "Enter":
          case " ":
            event.preventDefault();
            if (activeIndex >= 0) selectOption(activeIndex);
            return;
          case "Tab":
            closePanel();
            return;
          default:
            break;
        }
      } else {
        switch (event.key) {
          case "Enter":
          case " ":
          case "ArrowDown":
          case "ArrowUp":
          case "Home":
          case "End":
            event.preventDefault();
            openAndActivate();
            return;
          default:
            break;
        }
      }

      if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (!open) {
          openAndActivate();
        }
        handleTypeahead(event.key);
      }
    };

    const handleTriggerClick = () => {
      if (disabled) return;
      if (open) {
        closePanel();
        return;
      }
      openAndActivate();
    };

    const selectedLabel = options.find((option) => option.value === value)?.label;
    const hasError = Boolean(error);

    const triggerClassName = [
      "flex min-h-11 w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm outline-none transition",
      isDarkTheme
        ? "border-white/10 bg-slate-950 text-white focus:border-violet-500"
        : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500",
      disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-violet-400/60",
      hasError ? "border-red-500/80 focus:border-red-500/80" : "",
      className || "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div ref={setRootRef} className="w-full">
        {label ? (
          <label id={labelId} className="mb-1.5 block text-sm font-medium">
            {label}
            {required ? <span className="ml-1 text-red-400">*</span> : null}
          </label>
        ) : null}

        <button
          ref={triggerRef}
          type="button"
          id={buttonId}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-activedescendant={open && activeIndex >= 0 ? activeOptionId(activeIndex) : undefined}
          aria-invalid={hasError || undefined}
          aria-disabled={disabled || undefined}
          aria-labelledby={label ? labelId : undefined}
          aria-label={!label ? ariaLabel || selectedLabel || placeholder || "Select" : undefined}
          disabled={disabled}
          onKeyDown={handleTriggerKeyDown}
          onClick={handleTriggerClick}
          className={triggerClassName}
          style={{ minHeight: MIN_TRIGGER_HEIGHT }}
        >
          <span className={`truncate ${selectedLabel ? "" : "opacity-60"}`}>
            {selectedLabel ?? placeholder ?? "Select..."}
          </span>
          <ChevronDown
            size={18}
            className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {error ? (
          <p className="mt-1.5 text-xs text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        {open && typeof document !== "undefined"
          ? createPortal(
              <div
                ref={panelRef}
                role="listbox"
                id={panelId}
                aria-labelledby={label ? labelId : undefined}
                aria-label={!label ? ariaLabel || undefined : undefined}
                className={`fixed z-[60] overflow-y-auto rounded-xl border py-1 shadow-2xl outline-none ${
                  isDarkTheme ? "border-white/10 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-900"
                }`}
                style={{
                  top: position?.top ?? 0,
                  left: position?.left ?? EDGE_MARGIN,
                  width: position?.width,
                  maxHeight: position?.maxHeight ?? DEFAULT_MAX_HEIGHT,
                  maxWidth: "calc(100vw - 24px)",
                  visibility: position ? "visible" : "hidden",
                }}
              >
                {options.map((option, index) => {
                  const active = index === activeIndex;
                  const selected = option.value === value;
                  return (
                    <div
                      key={option.value}
                      role="option"
                      id={activeOptionId(index)}
                      aria-selected={selected}
                      aria-disabled={option.disabled || undefined}
                      onPointerDown={(event) => {
                        if (option.disabled) {
                          event.preventDefault();
                          return;
                        }
                        event.preventDefault();
                        selectOption(index);
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors ${
                        active
                          ? isDarkTheme
                            ? "bg-violet-500/15 text-white"
                            : "bg-violet-50 text-violet-700"
                          : isDarkTheme
                            ? "text-slate-300 hover:bg-white/5"
                            : "text-slate-700 hover:bg-slate-100"
                      } ${selected && !active ? (isDarkTheme ? "text-white" : "text-violet-700") : ""} ${
                        option.disabled ? "cursor-not-allowed opacity-50" : ""
                      }`}
                    >
                      <span className="truncate">{option.label}</span>
                      {selected ? <Check size={16} className="shrink-0" /> : null}
                    </div>
                  );
                })}
              </div>,
              document.body,
            )
          : null}
      </div>
    );
  },
);

ResponsiveSelect.displayName = "ResponsiveSelect";

export default ResponsiveSelect;
