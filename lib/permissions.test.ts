import { describe, expect, it } from "vitest";
import { canAccess, firstAccessiblePath, getRequiredPermission } from "./permissions";

describe("Dashboard permission", () => {
  it("gates the /admin landing page on the `dashboard` permission", () => {
    expect(getRequiredPermission("/admin")).toBe("dashboard");
    expect(canAccess("EDITOR", ["dashboard"], "/admin")).toBe(true);
    expect(canAccess("EDITOR", ["stores"], "/admin")).toBe(false);
    expect(canAccess("ADMIN", [], "/admin")).toBe(true);
  });

  it("still fails unmapped /admin/* routes closed", () => {
    expect(getRequiredPermission("/admin/whatever")).toBe("ADMIN_ONLY");
    expect(canAccess("EDITOR", ["dashboard"], "/admin/whatever")).toBe(false);
  });

  it("keeps /admin/login open", () => {
    expect(getRequiredPermission("/admin/login")).toBeNull();
  });
});

describe("firstAccessiblePath", () => {
  it("sends an admin to the dashboard", () => {
    expect(firstAccessiblePath("ADMIN", [])).toBe("/admin");
  });

  it("sends an editor with the dashboard permission to the dashboard", () => {
    expect(firstAccessiblePath("EDITOR", ["dashboard", "stores"])).toBe("/admin");
  });

  it("sends an editor without dashboard to their first section", () => {
    expect(firstAccessiblePath("EDITOR", ["reviews"])).toBe("/admin/reviews");
    expect(firstAccessiblePath("EDITOR", ["stores", "coupons"])).toBe("/admin/stores");
  });

  it("falls back to the login page when nothing is granted", () => {
    expect(firstAccessiblePath("EDITOR", [])).toBe("/admin/login");
  });
});
