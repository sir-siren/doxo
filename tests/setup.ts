import { JSDOM } from "jsdom";

if (typeof globalThis.document === "undefined") {
    const dom = new JSDOM("<!doctype html><html><body></body></html>", {
        url: "http://localhost/",
        pretendToBeVisual: true,
    });
    globalThis.window = dom.window as unknown as Window & typeof globalThis;
    globalThis.document = dom.window.document;
    globalThis.navigator = dom.window.navigator;
    globalThis.HTMLElement = dom.window.HTMLElement;
    globalThis.SVGElement = dom.window.SVGElement;
    globalThis.Node = dom.window.Node;
    globalThis.Event = dom.window.Event;
    globalThis.CustomEvent = dom.window.CustomEvent;
    globalThis.MouseEvent = dom.window.MouseEvent;
    globalThis.KeyboardEvent = dom.window.KeyboardEvent;
    globalThis.requestAnimationFrame = (callback) =>
        setTimeout(callback, 0) as unknown as number;
    globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}

class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver =
        ResizeObserverStub as unknown as typeof ResizeObserver;
}
