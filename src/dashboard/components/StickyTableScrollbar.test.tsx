import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import type { RefObject } from "react";
import StickyTableScrollbar from "./StickyTableScrollbar";

class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

interface Metrics {
  scrollWidth: number;
  clientWidth: number;
  top: number;
  bottom: number;
}

function applyMetrics(element: HTMLElement, metrics: Metrics) {
  Object.defineProperty(element, "scrollWidth", {
    configurable: true,
    value: metrics.scrollWidth,
  });
  Object.defineProperty(element, "clientWidth", {
    configurable: true,
    value: metrics.clientWidth,
  });
  Object.defineProperty(element, "scrollLeft", {
    configurable: true,
    value: 0,
    writable: true,
  });
  Object.defineProperty(element, "getBoundingClientRect", {
    configurable: true,
    value: vi.fn(() => ({
      top: metrics.top,
      bottom: metrics.bottom,
      left: 0,
      right: metrics.clientWidth,
      width: metrics.clientWidth,
      height: 100,
    })),
  });
}

function setup(metrics: Metrics) {
  const scrollerRef = createRef<HTMLDivElement>();
  const scroller = document.createElement("div");
  applyMetrics(scroller, metrics);
  scrollerRef.current = scroller;

  render(
    <StickyTableScrollbar
      scrollerRef={scrollerRef as RefObject<HTMLDivElement | null>}
    />,
  );

  return { scroller };
}

beforeEach(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
    ResizeObserverStub;
});

describe("StickyTableScrollbar late mount", () => {
  it("initializes when the scroller mounts after the component (async table load)", async () => {
    const callbacks: Array<() => void> = [];
    class CapturingResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      constructor(callback: () => void) {
        callbacks.push(callback);
      }
    }
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
      CapturingResizeObserver;

    const scrollerRef = createRef<HTMLDivElement>();
    render(
      <StickyTableScrollbar
        scrollerRef={scrollerRef as RefObject<HTMLDivElement | null>}
      />,
    );

    const bar = screen.getByTestId("sticky-scrollbar");
    expect(bar.style.display).toBe("none");

    const scroller = document.createElement("div");
    applyMetrics(scroller, {
      scrollWidth: 600,
      clientWidth: 200,
      top: 0,
      bottom: window.innerHeight + 400,
    });
    scrollerRef.current = scroller;

    callbacks.forEach((callback) => callback());

    await waitFor(() => {
      expect(bar.style.display).not.toBe("none");
    });
  });
});

describe("StickyTableScrollbar visibility", () => {
  it("shows the sticky bar when the table overflows and its own scrollbar is below the viewport", async () => {
    setup({
      scrollWidth: 600,
      clientWidth: 200,
      top: 0,
      bottom: window.innerHeight + 400,
    });

    const bar = screen.getByTestId("sticky-scrollbar");
    await waitFor(() => {
      expect(bar.style.display).not.toBe("none");
    });
  });

  it("hides when the table's own scrollbar is already visible", async () => {
    setup({
      scrollWidth: 600,
      clientWidth: 200,
      top: 0,
      bottom: window.innerHeight - 100,
    });

    const bar = screen.getByTestId("sticky-scrollbar");
    await waitFor(() => {
      expect(bar.style.display).toBe("none");
    });
  });

  it("hides when there is no horizontal overflow", async () => {
    setup({
      scrollWidth: 200,
      clientWidth: 200,
      top: 0,
      bottom: window.innerHeight + 400,
    });

    const bar = screen.getByTestId("sticky-scrollbar");
    await waitFor(() => {
      expect(bar.style.display).toBe("none");
    });
  });

  it("hides when the table is scrolled out of view", async () => {
    setup({
      scrollWidth: 600,
      clientWidth: 200,
      top: window.innerHeight + 200,
      bottom: window.innerHeight + 400,
    });

    const bar = screen.getByTestId("sticky-scrollbar");
    await waitFor(() => {
      expect(bar.style.display).toBe("none");
    });
  });
});

describe("StickyTableScrollbar synchronization", () => {
  it("moves the thumb when the real scroller scrolls", async () => {
    const { scroller } = setup({
      scrollWidth: 600,
      clientWidth: 200,
      top: 0,
      bottom: window.innerHeight + 400,
    });

    const bar = screen.getByTestId("sticky-scrollbar");
    await waitFor(() => {
      expect(bar.style.display).not.toBe("none");
    });

    Object.defineProperty(scroller, "scrollLeft", {
      configurable: true,
      value: 300,
      writable: true,
    });
    fireEvent.scroll(scroller);

    const thumb = screen.getByTestId("sticky-scrollbar-thumb");
    await waitFor(() => {
      expect(parseFloat(thumb.style.marginLeft)).toBeGreaterThan(0);
    });
  });

  it("scrolls the real scroller when the thumb is dragged", async () => {
    const { scroller } = setup({
      scrollWidth: 600,
      clientWidth: 200,
      top: 0,
      bottom: window.innerHeight + 400,
    });

    const bar = screen.getByTestId("sticky-scrollbar");
    await waitFor(() => {
      expect(bar.style.display).not.toBe("none");
    });

    const track = screen.getByTestId("sticky-scrollbar-track");
    applyMetrics(track, {
      scrollWidth: 600,
      clientWidth: 200,
      top: 0,
      bottom: 12,
    });

    fireEvent.pointerDown(track, { clientX: 100, pointerId: 1 });

    // ratio = 100 / 200 = 0.5 → scrollLeft = 0.5 * (600 - 200)
    expect(scroller.scrollLeft).toBe(200);
  });
});
