import "server-only";
import sanitize from "sanitize-html";

/** Làm sạch HTML từ trình soạn thảo WYSIWYG trước khi lưu. */
export function cleanHtml(html: string) {
  return sanitize(html, {
    allowedTags: sanitize.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "figure", "figcaption", "iframe"]),
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
      iframe: ["src", "width", "height", "allowfullscreen", "frameborder"],
      "*": ["class"],
    },
    allowedIframeHostnames: ["www.youtube.com", "youtube.com", "www.google.com", "maps.google.com"],
    transformTags: {
      // H1 dành riêng cho tiêu đề trang → hạ cấp heading trong nội dung để giữ phân cấp chuẩn
      h1: "h2",
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    },
  });
}
