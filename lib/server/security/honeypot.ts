// A hidden form field named "website" that real users never fill in.
// Bots that auto-fill every field trip this — treat submission as fake
// but respond as if it succeeded (don't reveal detection to the caller).
export function isHoneypotTripped(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
