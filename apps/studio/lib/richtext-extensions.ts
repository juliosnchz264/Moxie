import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

export const richTextExtensions = [
  StarterKit,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: { rel: "noopener noreferrer", class: "underline" },
  }),
];
