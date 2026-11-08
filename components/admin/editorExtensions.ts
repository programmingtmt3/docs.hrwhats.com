import { Node, mergeAttributes, textblockTypeInputRule } from "@tiptap/core";

/** صندوق بكلاس ثابت (نصيحة / ملاحظة / Endpoint) */
const block = (name: string, tag: string, cls: string) =>
  Node.create({
    name,
    group: "block",
    content: "inline*",
    defining: true,
    parseHTML: () => [{ tag }],
    renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { class: cls }), 0],
    addKeyboardShortcuts() {
      return {
        // Enter على سطر فارغ يخرج من الصندوق
        Enter: ({ editor }) => {
          const { $from, empty } = editor.state.selection;
          if (!empty || $from.parent.type.name !== name || $from.parent.content.size > 0) return false;
          return editor.commands.setParagraph();
        },
        // Backspace في بداية الصندوق يحوّله لفقرة
        Backspace: ({ editor }) => {
          const { $from, empty } = editor.state.selection;
          if (!empty || $from.parent.type.name !== name || $from.parentOffset !== 0) return false;
          return editor.commands.setParagraph();
        },
      };
    },
  });

export const Tip = block("tip", "div.tip", "tip");
export const NoteBox = block("noteBox", "div.note", "note");
export const Endpoint = block("endpoint", "div.ep", "ep");

/** <pre data-lang="JSON"> مع حفظ اللغة */
export const CodeBlockLang = Node.create({
  name: "codeBlock",
  group: "block",
  content: "text*",
  marks: "",
  code: true,
  defining: true,
  addAttributes() {
    return {
      lang: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-lang") ?? "",
        renderHTML: (attrs) => (attrs.lang ? { "data-lang": attrs.lang } : {}),
      },
    };
  },
  parseHTML: () => [{ tag: "pre", preserveWhitespace: "full" }],
  renderHTML: ({ HTMLAttributes }) => ["pre", HTMLAttributes, 0],
  // اكتب ``` ثم مسافة (أو ```json ثم مسافة) لإنشاء كتلة كود
  addInputRules() {
    return [
      textblockTypeInputRule({
        find: /^```([a-zA-Z0-9+#.-]*)[\s\n]$/,
        type: this.type,
        getAttributes: (m) => ({ lang: m[1] ?? "" }),
      }),
    ];
  },
  addKeyboardShortcuts() {
    return {
      // Tab يكتب مسافتين داخل الكود بدل الانتقال خارج المحرر
      Tab: ({ editor }) => (editor.isActive("codeBlock") ? editor.commands.insertContent("  ") : false),
      "Mod-Enter": ({ editor }) => editor.commands.exitCode(),
      Backspace: ({ editor }) => {
        const { $anchor, empty } = editor.state.selection;
        if (!empty || $anchor.parent.type.name !== "codeBlock" || $anchor.parent.content.size > 0) return false;
        return editor.commands.setParagraph();
      },
    };
  },
});