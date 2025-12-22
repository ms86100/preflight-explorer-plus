/**
 * @fileoverview Utility functions for the Vertex Work Platform.
 * @module lib/utils
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names into a single string, merging Tailwind CSS classes intelligently.
 * 
 * This function uses `clsx` for conditional class name construction and `tailwind-merge`
 * to handle conflicting Tailwind CSS utility classes (e.g., merging `p-2` and `p-4` into `p-4`).
 * 
 * @param inputs - An array of class values (strings, objects, arrays, or falsy values)
 * @returns A merged string of class names with Tailwind conflicts resolved
 * 
 * @example
 * ```typescript
 * // Basic usage
 * cn('px-2 py-1', 'bg-red-500')
 * // Returns: 'px-2 py-1 bg-red-500'
 * 
 * // With conditional classes
 * cn('btn', isActive && 'btn-active', { 'btn-disabled': isDisabled })
 * // Returns: 'btn btn-active' (if isActive is true and isDisabled is false)
 * 
 * // Merging conflicting Tailwind classes
 * cn('p-2', 'p-4')
 * // Returns: 'p-4' (later class wins)
 * ```
 * 
 * @see {@link https://github.com/lukeed/clsx} clsx documentation
 * @see {@link https://github.com/dcastil/tailwind-merge} tailwind-merge documentation
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
