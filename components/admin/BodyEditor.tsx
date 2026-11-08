"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useEditor, useEditorState, EditorContent, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link as LinkIcon, Unlink, Code, Braces,
  Table as TableIcon, Image as ImageIcon, Undo2, Redo2, Lightbulb, Info, Globe, Pilcrow,
  Heading2, Heading3, Check, X, Plus, Trash2, Quote, Minus, AlignRight, AlignCenter, AlignLeft,
  Highlighter, Palette, RemoveFormatting, Copy, FileCode2, type LucideIcon,
} from "lucide-react";
import { enhanceHtml } from "@/lib/html";
import { uploadImage } from "@/lib/actions";
import { Tip, NoteBox, Endpoint, CodeBlockLang } from "./editorExtensions";

type Mode = "visual" | "html" | "preview";
type Chain = ReturnType<Editor["chain"]>;
type Slash = { from: number; to: number; query: string; top: number; bottom: number; left: number; right: number } | null;
type Item = {
  id: string; label: string; hint: string; keys: string; icon: LucideIcon;
  run: (c: Chain, ctx: { pickImage: () => void }) => void;
};

/* ---------- الألوان (عدّلها كما تشاء) ---------- */
const TEXT_COLORS = ["#dc2626", "#ea580c", "#d97706", "#16a34a", "#0d9488", "#2563eb", "#7c3aed", "#db2777", "#6b7280", "#111827"];
const HL_COLORS = ["#fef08a", "#fed7aa", "#bbf7d0", "#bfdbfe", "#e9d5ff", "#fbcfe8", "#e5e7eb"];

const LANGS = ["JSON", "JavaScript", "TypeScript", "PHP", "Python", "cURL", "Bash", "HTML", "CSS", "SQL", "XML", "YAML"];
const ALIGNS = ["right", "center", "left"] as const;

/* ---------- قسم كود: عنوان + شرح + كتلة كود ---------- */
const codeSection = (c: Chain) =>
  c.insertContent([
    { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "عنوان القسم" }] },
    { type: "paragraph", content: [{ type: "text", text: "اكتب الشرح هنا…" }] },
    { type: "codeBlock", attrs: { lang: "JSON" } },
    { type: "paragraph" },
  ]).run();

/* ---------- عناصر قائمة "/" ---------- */
const ITEMS: Item[] = [
  { id: "p", label: "فقرة", hint: "نص عادي", keys: "paragraph text فقرة نص", icon: Pilcrow, run: (c) => c.setParagraph().run() },
  { id: "h2", label: "عنوان كبير", hint: "H2", keys: "h2 heading عنوان", icon: Heading2, run: (c) => c.setHeading({ level: 2 }).run() },
  { id: "h3", label: "عنوان فرعي", hint: "H3", keys: "h3 heading عنوان", icon: Heading3, run: (c) => c.setHeading({ level: 3 }).run() },
  { id: "ul", label: "قائمة نقطية", hint: "• عنصر", keys: "bullet list قائمة نقط", icon: List, run: (c) => c.toggleBulletList().run() },
  { id: "ol", label: "قائمة مرقمة", hint: "1. خطوة", keys: "ordered number list قائمة مرقمة خطوات", icon: ListOrdered, run: (c) => c.toggleOrderedList().run() },
  { id: "quote", label: "اقتباس", hint: "نص مميز", keys: "quote blockquote اقتباس", icon: Quote, run: (c) => c.toggleBlockquote().run() },
  { id: "tip", label: "نصيحة", hint: "صندوق أخضر", keys: "tip نصيحة", icon: Lightbulb, run: (c) => c.setNode("tip").run() },
  { id: "note", label: "ملاحظة", hint: "صندوق تنبيه", keys: "note ملاحظة تنبيه", icon: Info, run: (c) => c.setNode("noteBox").run() },
  {
    id: "ep", label: "Endpoint", hint: "POST /path", keys: "endpoint api رابط", icon: Globe,
    run: (c) => c.setNode("endpoint").insertContent([
      { type: "text", text: "POST", marks: [{ type: "italic" }] },
      { type: "text", text: "/path" },
    ]).run(),
  },
  { id: "code", label: "كتلة كود", hint: "JSON وغيره", keys: "code block كود", icon: Braces, run: (c) => c.setNode("codeBlock").run() },
  { id: "section", label: "قسم كود مع شرح", hint: "عنوان + شرح + كود", keys: "section code قسم كود شرح مثال", icon: FileCode2, run: (c) => { codeSection(c); } },
  { id: "table", label: "جدول", hint: "3 × 2", keys: "table جدول", icon: TableIcon, run: (c) => c.insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run() },
  { id: "img", label: "صورة", hint: "رفع من الجهاز", keys: "image صورة رفع", icon: ImageIcon, run: (c, ctx) => { c.run(); ctx.pickImage(); } },
  { id: "hr", label: "خط فاصل", hint: "———", keys: "divider hr line فاصل خط", icon: Minus, run: (c) => c.setHorizontalRule().run() },
];

const filterItems = (q: string) => {
  const s = q.trim().toLowerCase();
  return s ? ITEMS.filter((i) => `${i.label} ${i.keys}`.toLowerCase().includes(s)) : ITEMS;
};

const normalizeUrl = (s: string) => {
  const v = s.trim();
  if (!v) return "";
  return /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(v) ? v : `https://${v}`;
};

/* ---------- حالة الأزرار (تُقرأ من المحرر دون إعادة رسمه كله) ---------- */
function readState(e: Editor) {
  const text = e.getText();
  return {
    canUndo: e.can().undo(),
    canRedo: e.can().redo(),
    bold: e.isActive("bold"),
    italic: e.isActive("italic"),
    underline: e.isActive("underline"),
    strike: e.isActive("strike"),
    code: e.isActive("code"),
    link: e.isActive("link"),
    href: (e.getAttributes("link").href as string) ?? "",
    ul: e.isActive("bulletList"),
    ol: e.isActive("orderedList"),
    quote: e.isActive("blockquote"),
    tip: e.isActive("tip"),
    note: e.isActive("noteBox"),
    ep: e.isActive("endpoint"),
    codeBlock: e.isActive("codeBlock"),
    table: e.isActive("table"),
    image: e.isActive("image"),
    h3: e.isActive("heading", { level: 3 }),
    style: e.isActive("heading", { level: 2 }) ? "h2" : e.isActive("heading", { level: 3 }) ? "h3" : e.isActive("heading", { level: 4 }) ? "h4" : "p",
    canStyle: e.isActive("paragraph") || e.isActive("heading"),
    align: ALIGNS.find((a) => e.isActive({ textAlign: a })) ?? "",
    color: (e.getAttributes("textStyle").color as string) ?? "",
    highlight: (e.getAttributes("highlight").color as string) ?? "",
    lang: (e.getAttributes("codeBlock").lang as string) ?? "",
    alt: (e.getAttributes("image").alt as string) ?? "",
    src: (e.getAttributes("image").src as string) ?? "",
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    chars: text.length,
  };
}

/* ---------- مكونات صغيرة ---------- */
function Tool({ icon: Icon, label, on, active, disabled, text }: {
  icon: LucideIcon; label: string; on: () => void; active?: boolean; disabled?: boolean; text?: string;
}) {
  return (
    <button
      type="button" title={label} aria-label={label} disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} onClick={on}
      className={`inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-md px-2 text-[13px] transition disabled:opacity-35 ${
        active ? "bg-brand text-on" : "hover:bg-black/5 dark:hover:bg-white/10"
      }`}
    >
      <Icon size={17} strokeWidth={2} />
      {text && <span>{text}</span>}
    </button>
  );
}

const Sep = () => <span className="mx-1 h-5 w-px bg-line" aria-hidden />;

/** قائمة ألوان: ألوان جاهزة + لون مخصص + إزالة */
function ColorMenu({ icon, label, colors, current, onPick, onReset }: {
  icon: LucideIcon; label: string; colors: string[]; current: string; onPick: (c: string) => void; onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const hex = /^#[0-9a-f]{6}$/i.test(current) ? current : "#2563eb";

  return (
    <div ref={box} className="relative">
      <Tool icon={icon} label={label} active={open} on={() => setOpen((o) => !o)} />
      {current && <span className="pointer-events-none absolute inset-x-2 bottom-0.5 h-[3px] rounded" style={{ background: current }} />}
      {open && (
        <div className="absolute start-0 top-full z-40 mt-1 w-56 rounded-xl border border-line bg-card p-2 shadow-xl">
          <div className="grid grid-cols-5 gap-1.5">
            {colors.map((col) => (
              <button key={col} type="button" title={col}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onPick(col); setOpen(false); }}
                className="size-8 rounded-md border border-line" style={{ background: col }} />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="flex flex-1 cursor-pointer items-center gap-2 text-[13px]">
              <input type="color" value={hex} onChange={(e) => onPick(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-line bg-transparent p-0.5" />
              لون مخصص
            </label>
            <button type="button" onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onReset(); setOpen(false); }}
              className="rounded-md border border-line px-2 py-1 text-[13px]">إزالة</button>
          </div>
        </div>
      )}
    </div>
  );
}

function LinkInput({ initial, autoFocus, onApply, onRemove, onClose }: {
  initial: string; autoFocus?: boolean; onApply: (v: string) => void; onRemove: () => void; onClose: () => void;
}) {
  const [v, setV] = useState(initial);
  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus={autoFocus} dir="ltr" value={v} placeholder="https://example.com"
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); onApply(v); }
          if (e.key === "Escape") { e.preventDefault(); onClose(); }
        }}
        className="h-8 w-60 rounded-md border border-line bg-card px-2 text-[13px] outline-none focus:border-brand"
      />
      <Tool icon={Check} label="تطبيق" on={() => onApply(v)} />
      {initial && <Tool icon={Unlink} label="إزالة الرابط" on={onRemove} />}
      <Tool icon={X} label="إغلاق" on={onClose} />
    </div>
  );
}

/* ---------- المحرر ---------- */
export function BodyEditor({ name, defaultValue, dir }: { name: string; defaultValue: string; dir: "rtl" | "ltr" }) {
  const [html, setHtml] = useState(defaultValue);
  const [mode, setMode] = useState<Mode>("visual");
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [bubbleLink, setBubbleLink] = useState(false);
  const [slash, setSlashState] = useState<Slash>(null);
  const [index, setIndexState] = useState(0);
  const langListId = useId();

  const fileInput = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const slashRef = useRef<Slash>(null);
  const indexRef = useRef(0);
  const dismissed = useRef<number | null>(null);
  const activeItem = useRef<HTMLButtonElement>(null);

  const setSlash = (s: Slash) => { slashRef.current = s; setSlashState(s); };
  const setIndex = (i: number) => { indexRef.current = i; setIndexState(i); };
  const pickImage = () => fileInput.current?.click();

  /* رفع الصور: زر، لصق، سحب وإفلات */
  const upload = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    const ed = editorRef.current;
    if (!images.length || !ed) return;
    setUploading(true);
    setNotice("");
    for (const file of images) {
      const fd = new FormData();
      fd.append("file", file);
      const res: { url?: string; error?: string } = await uploadImage(fd).catch(() => ({ error: "تعذّر رفع الصورة." }));
      if (res.url) ed.chain().focus().setImage({ src: res.url, alt: "" }).run();
      else setNotice(`${file.name}: ${res.error ?? "تعذّر رفع الصورة."}`);
    }
    setUploading(false);
  };

  /* قائمة "/" : اكتشاف وتنفيذ */
  const syncSlash = (ed: Editor) => {
    const { $from, empty } = ed.state.selection;
    let next: Slash = null;
    if (empty && $from.parent.type.name === "paragraph") {
      const before = $from.parent.textBetween(0, $from.parentOffset, undefined, "\ufffc");
      const m = /^\/([^\s/]{0,20})$/.exec(before);
      if (m && $from.parent.textContent === before) {
        const co = ed.view.coordsAtPos($from.pos);
        next = { from: $from.start(), to: $from.pos, query: m[1], top: co.top, bottom: co.bottom, left: co.left, right: co.right };
      }
    }
    if (!next) dismissed.current = null;
    else if (dismissed.current === next.from) next = null;
    if (next?.query !== slashRef.current?.query) setIndex(0);
    setSlash(next);
  };

  const runSlash = (item: Item) => {
    const ed = editorRef.current;
    const sl = slashRef.current;
    if (!ed || !sl) return;
    setSlash(null);
    item.run(ed.chain().focus().deleteRange({ from: sl.from, to: sl.to }), { pickImage });
  };

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false, // الحالة تُقرأ عبر useEditorState
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: false,
        link: { openOnClick: false, HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" } },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
      Table.configure({ resizable: false }),
      TableRow, TableHeader, TableCell,
      Tip, NoteBox, Endpoint, CodeBlockLang,
      Placeholder.configure({
        placeholder: dir === "rtl" ? "اكتب هنا، أو اضغط / لإدراج عنصر…" : "Type here, or press / to insert…",
      }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: { dir, class: "prose-doc min-h-[380px] px-5 py-4 outline-none" },
      handlePaste: (_v, e) => {
        const f = Array.from(e.clipboardData?.files ?? []);
        if (f.length) { e.preventDefault(); upload(f); return true; }
        return false;
      },
      handleDrop: (_v, e) => {
        const f = Array.from(e.dataTransfer?.files ?? []);
        if (f.length) { e.preventDefault(); upload(f); return true; }
        return false;
      },
      handleKeyDown: (_v, e) => {
        // Ctrl+K لفتح حقل الرابط
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setLinkOpen(true); return true; }
        const sl = slashRef.current;
        if (!sl) return false;
        const list = filterItems(sl.query);
        if (e.key === "Escape") { dismissed.current = sl.from; setSlash(null); return true; }
        if (!list.length) return false;
        if (e.key === "ArrowDown") { setIndex((indexRef.current + 1) % list.length); return true; }
        if (e.key === "ArrowUp") { setIndex((indexRef.current - 1 + list.length) % list.length); return true; }
        if (e.key === "Enter" || e.key === "Tab") { runSlash(list[Math.min(indexRef.current, list.length - 1)]); return true; }
        return false;
      },
    },
    onCreate: ({ editor }) => { editorRef.current = editor; },
    onUpdate: ({ editor }) => { setHtml(editor.isEmpty ? "" : editor.getHTML()); syncSlash(editor); },
    onSelectionUpdate: ({ editor }) => { setBubbleLink(false); syncSlash(editor); },
  });

  const s = useEditorState({ editor, selector: ({ editor: e }) => (e ? readState(e) : null) });

  // ثابتان عمدًا: تغيّرهما في كل رسم يسبب حلقة في BubbleMenu
  const bubbleOptions = useMemo(() => ({ placement: "top" as const, offset: 8 }), []);
  const bubbleShouldShow = useCallback(
    ({ editor: e, view, state, element }: { editor: Editor; view: { hasFocus: () => boolean }; state: { selection: { empty: boolean } }; element: HTMLElement }) =>
      (view.hasFocus() || element.contains(document.activeElement)) &&
      !state.selection.empty &&
      !e.isActive("codeBlock") &&
      !e.isActive("image"),
    [],
  );

  useEffect(() => { activeItem.current?.scrollIntoView({ block: "nearest" }); }, [index, slash?.query]);

  /* الروابط */
  const applyLink = (raw: string) => {
    if (!editor) return;
    const url = normalizeUrl(raw);
    const chain = editor.chain().focus();
    if (!url) chain.extendMarkRange("link").unsetLink().run();
    else if (editor.state.selection.empty && !editor.isActive("link"))
      chain.insertContent({ type: "text", text: url, marks: [{ type: "link", attrs: { href: url } }] }).run();
    else chain.extendMarkRange("link").setLink({ href: url }).run();
    setLinkOpen(false);
    setBubbleLink(false);
  };
  const removeLink = () => {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkOpen(false);
    setBubbleLink(false);
  };

  /* نسخ كتلة الكود الحالية */
  const copyCode = async () => {
    if (!editor) return;
    try {
      await navigator.clipboard.writeText(editor.state.selection.$from.parent.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setNotice("تعذّر النسخ، انسخ الكود يدويًا.");
    }
  };

  const switchMode = (m: Mode) => {
    // عند الخروج من وضع HTML نمرّر النص المعدَّل للمحرر المرئي
    if (mode === "html" && m !== "html" && editor) editor.commands.setContent(html, { emitUpdate: false });
    setMode(m);
  };

  const ed = editor;
  const c = () => ed!.chain().focus();
  const visual = mode === "visual" && !!ed;
  const items = slash ? filterItems(slash.query) : [];
  const align = (v: (typeof ALIGNS)[number]) => (s?.align === v ? c().unsetTextAlign().run() : c().setTextAlign(v).run());
  const showCtx = visual && !!s && (!!notice || linkOpen || s.link || s.codeBlock || s.table || s.image);

  return (
    <div className="rounded-xl border border-line bg-card focus-within:border-brand">
      <input type="hidden" name={name} value={html} />

      {/* شريط الأدوات الثابت */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 rounded-t-xl border-b border-line bg-card/95 px-2 py-1.5 backdrop-blur">
        {ed && s && visual && (
          <>
            <Tool icon={Undo2} label="تراجع (Ctrl+Z)" disabled={!s.canUndo} on={() => c().undo().run()} />
            <Tool icon={Redo2} label="إعادة (Ctrl+Y)" disabled={!s.canRedo} on={() => c().redo().run()} />
            <Sep />
            <select
              value={s.style} disabled={!s.canStyle} title="نمط النص"
              onChange={(e) => {
                const v = e.target.value;
                if (v === "p") c().setParagraph().run();
                else c().setHeading({ level: Number(v[1]) as 2 | 3 | 4 }).run();
              }}
              className="h-8 rounded-md border border-line bg-card px-2 text-[13px] disabled:opacity-35"
            >
              <option value="p">فقرة</option>
              <option value="h2">عنوان كبير</option>
              <option value="h3">عنوان فرعي</option>
              <option value="h4">عنوان صغير</option>
            </select>
            <Sep />
            <Tool icon={Bold} label="عريض (Ctrl+B)" active={s.bold} on={() => c().toggleBold().run()} />
            <Tool icon={Italic} label="مائل (Ctrl+I)" active={s.italic} on={() => c().toggleItalic().run()} />
            <Tool icon={Underline} label="تسطير (Ctrl+U)" active={s.underline} on={() => c().toggleUnderline().run()} />
            <Tool icon={Strikethrough} label="يتوسطه خط" active={s.strike} on={() => c().toggleStrike().run()} />
            <ColorMenu icon={Palette} label="لون النص" colors={TEXT_COLORS} current={s.color}
              onPick={(col) => c().setColor(col).run()} onReset={() => c().unsetColor().run()} />
            <ColorMenu icon={Highlighter} label="تظليل" colors={HL_COLORS} current={s.highlight}
              onPick={(col) => c().setHighlight({ color: col }).run()} onReset={() => c().unsetHighlight().run()} />
            <Tool icon={RemoveFormatting} label="مسح التنسيق" on={() => c().unsetAllMarks().run()} />
            <Sep />
            <Tool icon={AlignRight} label="محاذاة لليمين" active={s.align === "right"} on={() => align("right")} />
            <Tool icon={AlignCenter} label="توسيط" active={s.align === "center"} on={() => align("center")} />
            <Tool icon={AlignLeft} label="محاذاة لليسار" active={s.align === "left"} on={() => align("left")} />
            <Sep />
            <Tool icon={List} label="قائمة نقطية" active={s.ul} on={() => c().toggleBulletList().run()} />
            <Tool icon={ListOrdered} label="قائمة مرقمة" active={s.ol} on={() => c().toggleOrderedList().run()} />
            <Tool icon={Quote} label="اقتباس" active={s.quote} on={() => c().toggleBlockquote().run()} />
            <Sep />
            <Tool icon={LinkIcon} label="رابط (Ctrl+K)" active={s.link || linkOpen} on={() => setLinkOpen((o) => !o)} />
            <Tool icon={Code} label="كود مضمّن" active={s.code} on={() => c().toggleCode().run()} />
            <Sep />
            <Tool icon={Lightbulb} label="نصيحة" text="نصيحة" active={s.tip} on={() => c().toggleNode("tip", "paragraph").run()} />
            <Tool icon={Info} label="ملاحظة" text="ملاحظة" active={s.note} on={() => c().toggleNode("noteBox", "paragraph").run()} />
            <Tool icon={Globe} label="Endpoint" text="Endpoint" active={s.ep} on={() => c().toggleNode("endpoint", "paragraph").run()} />
            <Sep />
            <Tool icon={Braces} label="كتلة كود" active={s.codeBlock} on={() => c().toggleNode("codeBlock", "paragraph").run()} />
            <Tool icon={FileCode2} label="قسم كود مع شرح" text="قسم كود" on={() => { codeSection(c()); }} />
            <Sep />
            <Tool icon={TableIcon} label="جدول" active={s.table} on={() => c().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()} />
            <Tool icon={ImageIcon} label="صورة (أو الصق / اسحب صورة)" disabled={uploading} text={uploading ? "جارٍ الرفع…" : undefined} on={pickImage} />
            <Tool icon={Minus} label="خط فاصل" on={() => c().setHorizontalRule().run()} />
          </>
        )}
        <div className="ms-auto flex overflow-hidden rounded-md border border-line text-[13px]">
          {(["visual", "html", "preview"] as const).map((m) => (
            <button key={m} type="button" onClick={() => switchMode(m)}
              className={`px-3 py-1 ${mode === m ? "bg-brand text-on" : "hover:bg-black/5 dark:hover:bg-white/10"}`}>
              {m === "visual" ? "مرئي" : m === "html" ? "HTML" : "معاينة"}
            </button>
          ))}
        </div>
        <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden
          onChange={(e) => { upload(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
      </div>

      {/* شريط السياق: يظهر فقط عند الحاجة */}
      {showCtx && ed && s && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line bg-soft/40 px-3 py-1.5 text-[13px]">
          {notice && (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-300">
              {notice}
              <Tool icon={X} label="إغلاق" on={() => setNotice("")} />
            </span>
          )}
          {linkOpen ? (
            <LinkInput autoFocus initial={s.href}
              onApply={applyLink} onRemove={removeLink} onClose={() => { setLinkOpen(false); ed.commands.focus(); }} />
          ) : s.link ? (
            <span className="flex items-center gap-1">
              <span dir="ltr" className="max-w-[260px] truncate text-muted">{s.href}</span>
              <Tool icon={LinkIcon} label="تعديل الرابط" text="تعديل" on={() => setLinkOpen(true)} />
              <Tool icon={Unlink} label="إزالة الرابط" text="إزالة" on={removeLink} />
            </span>
          ) : null}

          {s.codeBlock && (
            <span className="flex items-center gap-2">
              <span className="text-muted">لغة الكود</span>
              <input list={langListId} dir="ltr" value={s.lang} placeholder="JSON"
                onChange={(e) => ed.chain().updateAttributes("codeBlock", { lang: e.target.value }).run()}
                className="h-8 w-32 rounded-md border border-line bg-card px-2 outline-none focus:border-brand" />
              <datalist id={langListId}>{LANGS.map((l) => <option key={l} value={l} />)}</datalist>
              <Tool icon={copied ? Check : Copy} label="نسخ الكود" text={copied ? "تم النسخ" : "نسخ"} on={copyCode} />
            </span>
          )}

          {s.image && (
            <label className="flex items-center gap-2">
              <span className="text-muted">النص البديل</span>
              <input key={s.src} defaultValue={s.alt} placeholder="وصف الصورة"
                onChange={(e) => ed.chain().updateAttributes("image", { alt: e.target.value }).run()}
                className="h-8 w-64 rounded-md border border-line bg-card px-2 outline-none focus:border-brand" />
            </label>
          )}

          {s.table && (
            <span className="flex flex-wrap items-center gap-0.5">
              <Tool icon={Plus} label="إضافة صف" text="صف" on={() => c().addRowAfter().run()} />
              <Tool icon={Plus} label="إضافة عمود" text="عمود" on={() => c().addColumnAfter().run()} />
              <Tool icon={Trash2} label="حذف الصف" text="الصف" on={() => c().deleteRow().run()} />
              <Tool icon={Trash2} label="حذف العمود" text="العمود" on={() => c().deleteColumn().run()} />
              <Tool icon={Trash2} label="حذف الجدول" text="الجدول" on={() => c().deleteTable().run()} />
            </span>
          )}
        </div>
      )}

      {/* الشريط العائم عند تحديد نص */}
      {ed && s && visual && (
        <BubbleMenu
          editor={ed}
          options={bubbleOptions}
          shouldShow={bubbleShouldShow}
          className="z-30 rounded-lg border border-line bg-card p-1 shadow-lg"
        >
          {bubbleLink ? (
            <LinkInput autoFocus initial={s.href}
              onApply={applyLink} onRemove={removeLink} onClose={() => { setBubbleLink(false); ed.commands.focus(); }} />
          ) : (
            <div className="flex items-center gap-0.5">
              <Tool icon={Bold} label="عريض" active={s.bold} on={() => c().toggleBold().run()} />
              <Tool icon={Italic} label="مائل" active={s.italic} on={() => c().toggleItalic().run()} />
              <Tool icon={Underline} label="تسطير" active={s.underline} on={() => c().toggleUnderline().run()} />
              <Tool icon={Strikethrough} label="يتوسطه خط" active={s.strike} on={() => c().toggleStrike().run()} />
              <Sep />
              <Tool icon={Heading3} label="عنوان فرعي" active={s.h3} on={() => c().toggleHeading({ level: 3 }).run()} />
              <Tool icon={Code} label="كود مضمّن" active={s.code} on={() => c().toggleCode().run()} />
              <Tool icon={LinkIcon} label="رابط" active={s.link} on={() => setBubbleLink(true)} />
            </div>
          )}
        </BubbleMenu>
      )}

      <div className={mode === "visual" ? "" : "hidden"}><EditorContent editor={editor} /></div>

      {mode === "html" && (
        <textarea dir="ltr" spellCheck={false} value={html} onChange={(e) => setHtml(e.target.value)}
          className="block min-h-[380px] w-full resize-y bg-transparent p-4 font-mono text-[13.5px] leading-[1.7] outline-none" />
      )}
      {mode === "preview" && (
        <div dir={dir} className="prose-doc min-h-[380px] px-5 py-4" dangerouslySetInnerHTML={{ __html: enhanceHtml(html) }} />
      )}

      {/* شريط الحالة */}
      <div className="flex items-center justify-between gap-3 rounded-b-xl border-t border-line px-3 py-1.5 text-xs text-muted">
        <span>{s ? `${s.words} كلمة · ${s.chars} حرف` : ""}</span>
        {visual && <span>/ لإدراج عنصر · Ctrl+K رابط · ‎```‎ + مسافة لكتلة كود · Tab داخل الكود</span>}
      </div>

      {/* قائمة "/" */}
      {slash && items.length > 0 && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="fixed z-50 max-h-72 w-64 overflow-auto rounded-xl border border-line bg-card p-1 shadow-xl"
          style={{
            ...(slash.bottom + 290 > window.innerHeight ? { bottom: window.innerHeight - slash.top + 6 } : { top: slash.bottom + 6 }),
            ...(dir === "rtl"
              ? { right: Math.max(8, window.innerWidth - slash.right) }
              : { left: Math.max(8, Math.min(slash.left, window.innerWidth - 268)) }),
          }}
        >
          {items.map((it, i) => (
            <button key={it.id} type="button" ref={i === index ? activeItem : undefined}
              onMouseEnter={() => setIndex(i)} onClick={() => runSlash(it)}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-start ${i === index ? "bg-brand/10" : ""}`}>
              <span className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-card"><it.icon size={16} /></span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{it.label}</span>
                <span className="block text-xs text-muted">{it.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}