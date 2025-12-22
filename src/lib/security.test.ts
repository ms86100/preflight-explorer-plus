/**
 * @fileoverview Unit tests for security utilities.
 * @module lib/security.test
 */

import { describe, it, expect } from "vitest";
import {
  sanitizeInput,
  escapeHtml,
  encodeUrlParam,
  validateUrl,
  maskSensitiveData,
  validateEmail,
  validateUuid,
  validateLength,
  validateSearchQuery,
  INPUT_LIMITS,
  emailSchema,
  passwordSchema,
  projectKeySchema,
} from "./security";

describe("sanitizeInput", () => {
  it("should remove script tags", () => {
    const input = '<script>alert("xss")</script>Hello';
    expect(sanitizeInput(input)).toBe("Hello");
  });

  it("should remove javascript: protocol", () => {
    const input = 'Click javascript:alert(1) here';
    expect(sanitizeInput(input)).toBe("Click alert(1) here");
  });

  it("should remove event handlers", () => {
    const input = '<img onerror="alert(1)" src="x">';
    expect(sanitizeInput(input)).toBe('<img ="alert(1)" src="x">');
  });

  it("should remove null bytes", () => {
    const input = "Hello\0World";
    expect(sanitizeInput(input)).toBe("HelloWorld");
  });

  it("should trim whitespace", () => {
    const input = "  Hello World  ";
    expect(sanitizeInput(input)).toBe("Hello World");
  });

  it("should return empty string for non-string input", () => {
    expect(sanitizeInput(null as unknown as string)).toBe("");
    expect(sanitizeInput(undefined as unknown as string)).toBe("");
    expect(sanitizeInput(123 as unknown as string)).toBe("");
  });
});

describe("escapeHtml", () => {
  it("should escape HTML entities", () => {
    const input = '<b>Hello</b> & "world"';
    expect(escapeHtml(input)).toBe("&lt;b&gt;Hello&lt;&#x2F;b&gt; &amp; &quot;world&quot;");
  });

  it("should escape single quotes", () => {
    const input = "It's a test";
    expect(escapeHtml(input)).toBe("It&#x27;s a test");
  });

  it("should return empty string for non-string input", () => {
    expect(escapeHtml(null as unknown as string)).toBe("");
  });
});

describe("encodeUrlParam", () => {
  it("should encode special characters", () => {
    const input = "hello world & more";
    expect(encodeUrlParam(input)).toBe("hello%20world%20%26%20more");
  });

  it("should return empty string for non-string input", () => {
    expect(encodeUrlParam(null as unknown as string)).toBe("");
  });
});

describe("validateUrl", () => {
  it("should accept valid HTTPS URLs", () => {
    expect(validateUrl("https://example.com")).toBe("https://example.com/");
  });

  it("should accept valid HTTP URLs", () => {
    expect(validateUrl("http://example.com/path")).toBe("http://example.com/path");
  });

  it("should reject javascript: protocol", () => {
    expect(validateUrl("javascript:alert(1)")).toBeNull();
  });

  it("should reject data: protocol", () => {
    expect(validateUrl("data:text/html,<script>")).toBeNull();
  });

  it("should reject URLs exceeding max length", () => {
    const longUrl = "https://example.com/" + "a".repeat(INPUT_LIMITS.URL);
    expect(validateUrl(longUrl)).toBeNull();
  });

  it("should return null for invalid URLs", () => {
    expect(validateUrl("not-a-url")).toBeNull();
  });
});

describe("maskSensitiveData", () => {
  it("should mask password fields", () => {
    const data = { email: "user@test.com", password: "secret123" };
    const masked = maskSensitiveData(data);
    expect(masked.email).toBe("user@test.com");
    expect(masked.password).toBe("[REDACTED]");
  });

  it("should mask token fields", () => {
    const data = { accessToken: "abc123", refreshToken: "xyz789" };
    const masked = maskSensitiveData(data);
    expect(masked.accessToken).toBe("[REDACTED]");
    expect(masked.refreshToken).toBe("[REDACTED]");
  });

  it("should mask nested sensitive data", () => {
    const data = { user: { email: "test@test.com", apiKey: "secret" } };
    const masked = maskSensitiveData(data);
    expect((masked.user as Record<string, unknown>).email).toBe("test@test.com");
    expect((masked.user as Record<string, unknown>).apiKey).toBe("[REDACTED]");
  });

  it("should handle null input", () => {
    expect(maskSensitiveData(null as unknown as Record<string, unknown>)).toBeNull();
  });
});

describe("validateEmail", () => {
  it("should accept valid emails", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("user.name+tag@example.co.uk")).toBe(true);
  });

  it("should reject invalid emails", () => {
    expect(validateEmail("not-an-email")).toBe(false);
    expect(validateEmail("missing@domain")).toBe(false);
    expect(validateEmail("@nodomain.com")).toBe(false);
  });
});

describe("validateUuid", () => {
  it("should accept valid UUIDs", () => {
    expect(validateUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("should reject invalid UUIDs", () => {
    expect(validateUuid("not-a-uuid")).toBe(false);
    expect(validateUuid("550e8400-e29b-41d4")).toBe(false);
  });
});

describe("validateLength", () => {
  it("should return true for strings within limit", () => {
    expect(validateLength("hello", 10)).toBe(true);
  });

  it("should return false for strings exceeding limit", () => {
    expect(validateLength("hello world", 5)).toBe(false);
  });

  it("should return false for non-strings", () => {
    expect(validateLength(123 as unknown as string, 10)).toBe(false);
  });
});

describe("validateSearchQuery", () => {
  it("should sanitize and return valid queries", () => {
    expect(validateSearchQuery("find this")).toBe("find this");
  });

  it("should remove SQL injection attempts", () => {
    expect(validateSearchQuery("search'; DROP TABLE--")).toBe("search DROP TABLE");
  });

  it("should limit query length", () => {
    const longQuery = "a".repeat(300);
    expect(validateSearchQuery(longQuery).length).toBe(INPUT_LIMITS.SEARCH);
  });

  it("should return empty string for non-string input", () => {
    expect(validateSearchQuery(null as unknown as string)).toBe("");
  });
});

describe("Zod Schemas", () => {
  describe("emailSchema", () => {
    it("should transform email to lowercase", () => {
      const result = emailSchema.safeParse("User@Example.COM");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("user@example.com");
      }
    });

    it("should reject empty strings", () => {
      const result = emailSchema.safeParse("");
      expect(result.success).toBe(false);
    });
  });

  describe("passwordSchema", () => {
    it("should accept valid passwords", () => {
      const result = passwordSchema.safeParse("password123");
      expect(result.success).toBe(true);
    });

    it("should reject short passwords", () => {
      const result = passwordSchema.safeParse("short");
      expect(result.success).toBe(false);
    });
  });

  describe("projectKeySchema", () => {
    it("should transform to uppercase", () => {
      const result = projectKeySchema.safeParse("proj");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("PROJ");
      }
    });

    it("should reject keys with special characters", () => {
      const result = projectKeySchema.safeParse("PROJ-1");
      expect(result.success).toBe(false);
    });

    it("should reject keys starting with numbers", () => {
      const result = projectKeySchema.safeParse("1PROJ");
      expect(result.success).toBe(false);
    });
  });
});
