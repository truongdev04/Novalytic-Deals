import { describe, expect, it } from "vitest";
import { pickSeededBlock, pickSeededLine } from "./template";

// resolveStoreContent chạy hai lần cho cùng một trang (generateMetadata và
// body), và chạy lại mỗi lần ISR revalidate. Nếu chọn ngẫu nhiên thì meta
// description mâu thuẫn nội dung trang, và payload đổi byte -> Vercel tính
// ISR Write Unit cho mọi lần revalidate.
describe("pickSeeded* là tất định", () => {
  const lines = "A\nB\nC\nD";
  const blocks = "Khối một\n\nKhối hai\n\nKhối ba";

  it("cùng seed luôn cho cùng kết quả", () => {
    expect(pickSeededLine(lines, "store-1")).toBe(pickSeededLine(lines, "store-1"));
    expect(pickSeededBlock(blocks, "store-1")).toBe(pickSeededBlock(blocks, "store-1"));
  });

  it("phân bổ khác nhau giữa các seed", () => {
    const picks = new Set(
      ["a", "b", "c", "d", "e", "f", "g", "h"].map((s) => pickSeededLine(lines, s))
    );
    expect(picks.size).toBeGreaterThan(1);
  });

  it("chỉ trả về ứng viên hợp lệ", () => {
    for (const seed of ["x", "y", "z"]) {
      expect(["A", "B", "C", "D"]).toContain(pickSeededLine(lines, seed));
    }
  });

  it("template rỗng trả về undefined", () => {
    expect(pickSeededLine(undefined, "s")).toBeUndefined();
    expect(pickSeededBlock("", "s")).toBeUndefined();
  });
});
