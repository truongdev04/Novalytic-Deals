import { describe, expect, it } from "vitest";
import { isHoneypotTripped } from "./honeypot";

describe("isHoneypotTripped", () => {
  it("is false when the field is empty", () => {
    expect(isHoneypotTripped("")).toBe(false);
  });

  it("is false when the field is undefined", () => {
    expect(isHoneypotTripped(undefined)).toBe(false);
  });

  it("is false when the field is only whitespace", () => {
    expect(isHoneypotTripped("   ")).toBe(false);
  });

  it("is true when a bot fills in the hidden field", () => {
    expect(isHoneypotTripped("http://spam.example")).toBe(true);
  });

  it("is false for non-string values", () => {
    expect(isHoneypotTripped(123)).toBe(false);
    expect(isHoneypotTripped(null)).toBe(false);
  });
});
