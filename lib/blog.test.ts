import { describe, expect, it } from "vitest";
import { parseBlogSections } from "./blog";

describe("parseBlogSections", () => {
  it("keeps content before the first '## ' heading as a leading section", () => {
    const sections = parseBlogSections(
      "<p>Intro paragraph</p><p>## 1. First section</p><p>Section body</p>"
    );
    expect(sections).toHaveLength(2);
    expect(sections[0]).toMatchObject({ id: "", heading: "", bodyHtml: "<p>Intro paragraph</p>" });
    expect(sections[1].heading).toBe("1. First section");
    expect(sections[1].bodyHtml).toBe("<p>Section body</p>");
  });

  it("returns the whole body as one leading section when there is no '## ' heading", () => {
    const sections = parseBlogSections("<p>Just some text.</p><p>And more.</p>");
    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBe("");
    expect(sections[0].bodyHtml).toBe("<p>Just some text.</p><p>And more.</p>");
  });

  it("adds no leading section when the body opens with a '## ' heading", () => {
    const sections = parseBlogSections("<p>## 1. First section</p><p>Body</p>");
    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBe("1. First section");
  });

  it("ignores an empty leading block such as a horizontal rule", () => {
    const sections = parseBlogSections("<hr><p>## 1. First section</p>");
    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBe("1. First section");
  });

  it("keeps a leading image before the first heading", () => {
    const sections = parseBlogSections('<p><img src="x.jpg"></p><p>## 1. First section</p>');
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe("");
    expect(sections[0].bodyHtml).toContain("<img");
  });
});
