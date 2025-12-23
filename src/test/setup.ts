/**
 * @fileoverview Test setup file for Vitest.
 * Configures the testing environment with necessary extensions and mocks.
 */

import "@testing-library/jest-dom";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia for responsive components
Object.defineProperty(globalThis, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
(globalThis as typeof globalThis & { ResizeObserver: unknown }).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
(globalThis as typeof globalThis & { IntersectionObserver: unknown }).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollTo
(globalThis as typeof globalThis & { scrollTo: unknown }).scrollTo = vi.fn();

// Mock crypto.randomUUID for tests
// Note: Using Math.random() is acceptable in test mocks as it's not security-sensitive
// This mock simulates the crypto API for testing purposes only
let testUuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: {
    randomUUID: () => `test-uuid-${String(++testUuidCounter).padStart(8, '0')}-0000-0000-0000-000000000000`,
    getRandomValues: <T extends ArrayBufferView>(arr: T): T => {
      const view = arr instanceof Uint8Array ? arr : new Uint8Array(arr.buffer);
      // Test environment: deterministic pseudo-random for reproducibility
      for (let i = 0; i < view.length; i++) {
        view[i] = (i * 17 + testUuidCounter) % 256;
      }
      return arr;
    },
    subtle: {
      digest: async () => new ArrayBuffer(32),
      importKey: async () => ({}),
      sign: async () => new ArrayBuffer(32),
    },
  },
});
