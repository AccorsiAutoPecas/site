"use client";

import TextAlign from "@tiptap/extension-text-align";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";

const shellClass =
  "rounded-lg border border-gray-200 bg-white text-sm text-gray-900 shadow-sm focus-within:border-admin-accent focus-within:ring-2 focus-within:ring-[#1d63ed]/20";

const toolbarBtn =
  "rounded px-2 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-40";

const toolbarBtnActive = "bg-[#1d63ed]/15 text-admin-accent";

type Props = {
  name?: string;
  /** HTML inicial (ex.: vindo do banco). */
  initialHtml?: string;
  fieldId?: string;
};

function emptyDoc(): string {
  return "<p></p>";
}

export function ProductDescriptionEditor({
  name = "descricao",
  initialHtml = "",
  fieldId = "descricao",
}: Props) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const initial = (initialHtml || "").trim() || emptyDoc();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
      }),
      TextAlign.configure({
        types: ["paragraph"],
        defaultAlignment: "left",
      }),
    ],
    content: initial,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[140px] px-3 py-2 focus:outline-none [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (hiddenRef.current) hiddenRef.current.value = ed.getHTML();
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (hiddenRef.current) hiddenRef.current.value = editor.getHTML();
  }, [editor]);

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-gray-500">
        Use <strong className="font-semibold">Negrito</strong> e o alinhamento por parágrafo. Enter cria novo parágrafo;
        Shift+Enter quebra linha no mesmo parágrafo.
      </p>
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={initial} />
      <div className={shellClass}>
        {editor ? (
          <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 px-2 py-1.5">
            <button
              type="button"
              className={`${toolbarBtn} ${editor.isActive("bold") ? toolbarBtnActive : ""}`}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              Negrito
            </button>
            <span className="mx-1 text-gray-300" aria-hidden>
              |
            </span>
            {(
              [
                { align: "left" as const, label: "Esquerda" },
                { align: "center" as const, label: "Centro" },
                { align: "right" as const, label: "Direita" },
                { align: "justify" as const, label: "Justificado" },
              ] as const
            ).map(({ align, label }) => (
              <button
                key={align}
                type="button"
                className={`${toolbarBtn} ${editor.isActive({ textAlign: align }) ? toolbarBtnActive : ""}`}
                onClick={() => editor.chain().focus().setTextAlign(align).run()}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
        <div id={fieldId} tabIndex={0} className="rounded-b-lg outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1d63ed]/30">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
