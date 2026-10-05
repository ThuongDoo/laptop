"use client";

import { useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Link2, ImagePlus, Undo2, Redo2, Code2, Minus } from "lucide-react";

/** Trình soạn thảo WYSIWYG – nội dung HTML được ghi vào input ẩn `name`. */
export function RichEditor({ name, defaultValue, minHeight = 320 }: { name: string; defaultValue?: string | null; minHeight?: number }) {
  const [html, setHtml] = useState(defaultValue ?? "");
  const [source, setSource] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ link: { openOnClick: false }, heading: { levels: [2, 3] } }), Image],
    content: defaultValue ?? "",
    editorProps: { attributes: { class: "prose-content outline-none px-4 py-3", style: `min-height:${minHeight}px` } },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-brand-500">
      <input type="hidden" name={name} value={html} />
      <Toolbar editor={editor} source={source} toggleSource={() => {
        if (source) editor?.commands.setContent(html);
        setSource(!source);
      }} />
      {source ? (
        <textarea value={html} onChange={(e) => setHtml(e.target.value)} className="w-full p-3 font-mono text-xs outline-none" style={{ minHeight }} />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}

function Toolbar({ editor, source, toggleSource }: { editor: Editor | null; source: boolean; toggleSource: () => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  if (!editor) return <div className="h-10 border-b border-gray-200 bg-gray-50" />;
  const btn = (active: boolean) => `rounded p-1.5 ${active ? "bg-brand-100 text-brand-700" : "text-gray-600 hover:bg-gray-200"}`;
  const c = () => editor.chain().focus();

  const upload = async (f: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    setUploading(false);
    const data = await res.json();
    if (data.url) c().setImage({ src: data.url, alt: f.name.replace(/\.[^.]+$/, "") }).run();
    else alert(data.error || "Upload thất bại");
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 p-1">
      {!source && (
        <>
          <button type="button" title="In đậm" className={btn(editor.isActive("bold"))} onClick={() => c().toggleBold().run()}>
            <Bold size={16} />
          </button>
          <button type="button" title="In nghiêng" className={btn(editor.isActive("italic"))} onClick={() => c().toggleItalic().run()}>
            <Italic size={16} />
          </button>
          <button type="button" title="Tiêu đề H2" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => c().toggleHeading({ level: 2 }).run()}>
            <Heading2 size={16} />
          </button>
          <button type="button" title="Tiêu đề H3" className={btn(editor.isActive("heading", { level: 3 }))} onClick={() => c().toggleHeading({ level: 3 }).run()}>
            <Heading3 size={16} />
          </button>
          <button type="button" title="Danh sách" className={btn(editor.isActive("bulletList"))} onClick={() => c().toggleBulletList().run()}>
            <List size={16} />
          </button>
          <button type="button" title="Danh sách số" className={btn(editor.isActive("orderedList"))} onClick={() => c().toggleOrderedList().run()}>
            <ListOrdered size={16} />
          </button>
          <button type="button" title="Trích dẫn" className={btn(editor.isActive("blockquote"))} onClick={() => c().toggleBlockquote().run()}>
            <Quote size={16} />
          </button>
          <button type="button" title="Đường kẻ" className={btn(false)} onClick={() => c().setHorizontalRule().run()}>
            <Minus size={16} />
          </button>
          <button
            type="button"
            title="Chèn liên kết"
            className={btn(editor.isActive("link"))}
            onClick={() => {
              const url = prompt("Nhập URL liên kết (để trống để gỡ):", editor.getAttributes("link").href || "https://");
              if (url === null) return;
              if (!url) c().unsetLink().run();
              else c().extendMarkRange("link").setLink({ href: url }).run();
            }}
          >
            <Link2 size={16} />
          </button>
          <button type="button" title="Chèn ảnh (tự nén WebP)" className={btn(false)} disabled={uploading} onClick={() => file.current?.click()}>
            <ImagePlus size={16} className={uploading ? "animate-pulse" : ""} />
          </button>
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <span className="mx-1 h-5 w-px bg-gray-300" />
          <button type="button" title="Hoàn tác" className={btn(false)} onClick={() => c().undo().run()}>
            <Undo2 size={16} />
          </button>
          <button type="button" title="Làm lại" className={btn(false)} onClick={() => c().redo().run()}>
            <Redo2 size={16} />
          </button>
        </>
      )}
      <button type="button" title="Sửa mã HTML" className={`${btn(source)} ml-auto`} onClick={toggleSource}>
        <Code2 size={16} />
      </button>
    </div>
  );
}
