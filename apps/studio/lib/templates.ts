import type { Block } from "@moxie/core";

export function uid(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `blk_${Math.random().toString(36).slice(2, 10)}`
  );
}

export interface BlockPreset {
  id: string;
  label: string;
  build: () => Block;
}

export interface BlockTemplate {
  type: string;
  label: string;
  description: string;
  icon: string;
  build: () => Block;
  presets?: BlockPreset[];
}

const heroCentered = (): Block => ({
  id: uid(),
  type: "hero",
  version: 1,
  props: {
    title: "New hero",
    subtitle: "A catchy tagline goes here",
    padding: "xl",
    bg: "muted",
    align: "center",
  },
});

const heroLeft = (): Block => ({
  id: uid(),
  type: "hero",
  version: 1,
  props: {
    title: "New hero",
    subtitle: "A catchy tagline goes here",
    padding: "xl",
    bg: "muted",
    align: "left",
  },
});

const heroMinimal = (): Block => ({
  id: uid(),
  type: "hero",
  version: 1,
  props: {
    title: "New hero",
    padding: "lg",
    bg: "background",
    align: "center",
  },
});

const textParagraph = (): Block => ({
  id: uid(),
  type: "text",
  version: 2,
  props: {
    body: "Write something here.",
    align: "left",
    padding: "md",
  },
});

const textLead = (): Block => ({
  id: uid(),
  type: "text",
  version: 2,
  props: {
    body: "A bigger lead paragraph that opens a section.",
    align: "left",
    padding: "md",
    fontSize: "xl",
  },
});

const textCaption = (): Block => ({
  id: uid(),
  type: "text",
  version: 2,
  props: {
    body: "A small caption.",
    align: "center",
    padding: "sm",
    fontSize: "xs",
    color: "muted",
  },
});

const columnsWith = (count: 2 | 3 | 4): (() => Block) =>
  () => ({
    id: uid(),
    type: "columns",
    version: 1,
    props: { count, padding: "md" },
    children: [],
  });

const ctaBanner = (): Block => ({
  id: uid(),
  type: "cta",
  version: 1,
  props: {
    title: "Ready to start?",
    subtitle: "Join thousands of happy users today",
    ctaLabel: "Get started",
    ctaHref: "#",
    padding: "xl",
    bg: "muted",
    align: "center",
  },
});

const ctaSimple = (): Block => ({
  id: uid(),
  type: "cta",
  version: 1,
  props: {
    title: "Ready to start?",
    ctaLabel: "Get started",
    ctaHref: "#",
    padding: "lg",
    bg: "background",
    align: "center",
  },
});

const buttonPrimary = (): Block => ({
  id: uid(),
  type: "button",
  version: 1,
  props: {
    label: "Click me",
    href: "#",
    variant: "primary",
    target: "_self",
    padding: "sm",
    align: "center",
  },
});

const buttonSecondary = (): Block => ({
  ...buttonPrimary(),
  props: { ...(buttonPrimary().props as object), variant: "secondary" },
});

const buttonGhost = (): Block => ({
  ...buttonPrimary(),
  props: { ...(buttonPrimary().props as object), variant: "ghost" },
});

export const blockTemplates: BlockTemplate[] = [
  {
    type: "hero",
    label: "Hero",
    description: "Title + subtitle",
    icon: "◨",
    build: heroCentered,
    presets: [
      { id: "centered", label: "Centered", build: heroCentered },
      { id: "left", label: "Left", build: heroLeft },
      { id: "minimal", label: "Minimal", build: heroMinimal },
    ],
  },
  {
    type: "text",
    label: "Text",
    description: "Paragraph",
    icon: "¶",
    build: textParagraph,
    presets: [
      { id: "paragraph", label: "Paragraph", build: textParagraph },
      { id: "lead", label: "Lead", build: textLead },
      { id: "caption", label: "Caption", build: textCaption },
    ],
  },
  {
    type: "section",
    label: "Section",
    description: "Container with padding",
    icon: "▭",
    build: () => ({
      id: uid(),
      type: "section",
      version: 1,
      props: { padding: "lg", bg: "background" },
      children: [],
    }),
  },
  {
    type: "columns",
    label: "Columns",
    description: "Multi-column layout",
    icon: "▥",
    build: columnsWith(2),
    presets: [
      { id: "2", label: "2 cols", build: columnsWith(2) },
      { id: "3", label: "3 cols", build: columnsWith(3) },
      { id: "4", label: "4 cols", build: columnsWith(4) },
    ],
  },
  {
    type: "image",
    label: "Image",
    description: "Single image",
    icon: "🖼",
    build: () => ({
      id: uid(),
      type: "image",
      version: 1,
      props: { src: "", alt: "", fit: "cover", padding: "sm" },
    }),
  },
  {
    type: "button",
    label: "Button",
    description: "CTA link",
    icon: "▢",
    build: buttonPrimary,
    presets: [
      { id: "primary", label: "Primary", build: buttonPrimary },
      { id: "secondary", label: "Secondary", build: buttonSecondary },
      { id: "ghost", label: "Ghost", build: buttonGhost },
    ],
  },
  {
    type: "spacer",
    label: "Spacer",
    description: "Empty vertical space",
    icon: "↕",
    build: () => ({
      id: uid(),
      type: "spacer",
      version: 1,
      props: { size: "md" },
    }),
  },
  {
    type: "divider",
    label: "Divider",
    description: "Horizontal rule",
    icon: "—",
    build: () => ({
      id: uid(),
      type: "divider",
      version: 1,
      props: { style: "solid", thickness: "thin", padding: "sm" },
    }),
  },
  {
    type: "card",
    label: "Card",
    description: "Container with border",
    icon: "▣",
    build: () => ({
      id: uid(),
      type: "card",
      version: 1,
      props: { title: "", padding: "md" },
      children: [],
    }),
  },
  {
    type: "cta",
    label: "CTA",
    description: "Headline + button",
    icon: "★",
    build: ctaBanner,
    presets: [
      { id: "banner", label: "Banner", build: ctaBanner },
      { id: "simple", label: "Simple", build: ctaSimple },
    ],
  },
  {
    type: "gallery",
    label: "Gallery",
    description: "Image grid",
    icon: "▦",
    build: () => ({
      id: uid(),
      type: "gallery",
      version: 1,
      props: { columns: 3, items: [], padding: "md" },
    }),
  },
  {
    type: "richtext",
    label: "Rich text",
    description: "Formatted prose",
    icon: "✎",
    build: () => ({
      id: uid(),
      type: "richtext",
      version: 1,
      props: {
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Write something…" }],
            },
          ],
        },
        padding: "md",
      },
    }),
  },
];

export function findTemplate(type: string): BlockTemplate | undefined {
  return blockTemplates.find((t) => t.type === type);
}
