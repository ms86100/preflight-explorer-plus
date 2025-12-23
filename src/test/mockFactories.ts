/**
 * @fileoverview Shared mock factory functions for Supabase client tests.
 * @module test/mockFactories
 * 
 * @description
 * Provides reusable mock factory functions to reduce code duplication
 * across test files. These factories create mock objects that simulate
 * Supabase query builder chains.
 */

import { vi } from 'vitest';

// ============================================================================
// Types
// ============================================================================

export interface MockResolvedValue<T = unknown> {
  data: T;
  error: unknown;
}

export interface MockErrorValue {
  error: unknown;
}

// ============================================================================
// Select Mock Factories
// ============================================================================

/**
 * Creates a mock for: supabase.from().select().eq().order()
 */
export function createSelectEqOrderMock<T = unknown>(resolvedValue: MockResolvedValue<T>) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue(resolvedValue),
      }),
    }),
  };
}

/**
 * Creates a mock for: supabase.from().select().eq()
 */
export function createSelectEqMock<T = unknown>(resolvedValue: MockResolvedValue<T>) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(resolvedValue),
    }),
  };
}

/**
 * Creates a mock for: supabase.from().select().eq().single()
 */
export function createSelectEqSingleMock<T = unknown>(resolvedValue: MockResolvedValue<T>) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(resolvedValue),
      }),
    }),
  };
}

/**
 * Creates a mock for: supabase.from().select().eq().eq().maybeSingle()
 */
export function createSelectEqEqMaybeSingleMock<T = unknown>(resolvedValue: MockResolvedValue<T>) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
        }),
      }),
    }),
  };
}

/**
 * Creates a mock for: supabase.from().select().in()
 */
export function createSelectInMock<T = unknown>(resolvedValue: MockResolvedValue<T>) {
  return {
    select: vi.fn().mockReturnValue({
      in: vi.fn().mockResolvedValue(resolvedValue),
    }),
  };
}

/**
 * Creates a mock for: supabase.from().select().order().order()
 */
export function createSelectOrderOrderMock<T = unknown>(resolvedValue: MockResolvedValue<T>) {
  return {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue(resolvedValue),
      }),
    }),
  };
}

/**
 * Creates a mock for: supabase.from().select().order()
 */
export function createSelectOrderMock<T = unknown>(resolvedValue: MockResolvedValue<T>) {
  return {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue(resolvedValue),
    }),
  };
}

// ============================================================================
// Insert Mock Factories
// ============================================================================

/**
 * Creates a mock for: supabase.from().insert().select().single()
 */
export function createInsertSelectSingleMock<T = unknown>(resolvedValue: MockResolvedValue<T>) {
  return {
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(resolvedValue),
      }),
    }),
  };
}

/**
 * Creates a mock for: supabase.from().insert()
 */
export function createInsertMock(resolvedValue: MockErrorValue) {
  return {
    insert: vi.fn().mockResolvedValue(resolvedValue),
  };
}

// ============================================================================
// Update Mock Factories
// ============================================================================

/**
 * Creates a mock for: supabase.from().update().eq().select().single()
 */
export function createUpdateEqSelectSingleMock<T = unknown>(resolvedValue: MockResolvedValue<T>) {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(resolvedValue),
        }),
      }),
    }),
  };
}

/**
 * Creates a mock for: supabase.from().update().eq()
 */
export function createUpdateEqMock(resolvedValue: MockErrorValue) {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(resolvedValue),
    }),
  };
}

// ============================================================================
// Delete Mock Factories
// ============================================================================

/**
 * Creates a mock for: supabase.from().delete().eq()
 */
export function createDeleteEqMock(resolvedValue: MockErrorValue) {
  return {
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(resolvedValue),
    }),
  };
}

/**
 * Creates a mock for: supabase.from().delete().eq().eq()
 */
export function createDeleteEqEqMock(resolvedValue: MockErrorValue) {
  return {
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(resolvedValue),
      }),
    }),
  };
}

// ============================================================================
// Composite Mock Factories
// ============================================================================

/**
 * Creates a comprehensive default mock for supabase.from() that handles most query patterns.
 * Use this as the base mock and override specific calls as needed.
 */
export function createDefaultFromMock() {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  };
}

/**
 * Creates a mock Supabase client object with from() and rpc() methods.
 */
export function createMockSupabaseClient() {
  return {
    from: vi.fn(() => createDefaultFromMock()),
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-uuid' } } })),
    },
  };
}
