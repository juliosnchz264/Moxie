import type { Block } from "@moxie/core";
import { uid } from "./templates";

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  blocks: () => Block[];
}

const saasLanding = (): Block[] => [
  {
    id: uid(),
    type: "hero",
    version: 1,
    props: {
      title: "Ship faster with less code",
      subtitle: "The toolkit teams use to go from idea to production in a week.",
      padding: "2xl",
      bg: "muted",
      align: "center",
    },
  },
  {
    id: uid(),
    type: "button",
    version: 1,
    props: {
      label: "Start free trial",
      href: "#signup",
      variant: "primary",
      target: "_self",
      align: "center",
      paddingY: "md",
    },
  },
  {
    id: uid(),
    type: "columns",
    version: 1,
    props: { count: 3, padding: "xl", gap: "lg" },
    children: [
      {
        id: uid(),
        type: "text",
        version: 2,
        props: {
          body: "⚡ Fast\n\nSub-second page loads on every device, out of the box.",
          align: "left",
          padding: "md",
        },
      },
      {
        id: uid(),
        type: "text",
        version: 2,
        props: {
          body: "🔒 Secure\n\nBest-in-class auth, SOC2-ready audit trail, zero-trust by default.",
          align: "left",
          padding: "md",
        },
      },
      {
        id: uid(),
        type: "text",
        version: 2,
        props: {
          body: "🛠 Flexible\n\nIntegrates with the stack you already use — no lock-in.",
          align: "left",
          padding: "md",
        },
      },
    ],
  },
  {
    id: uid(),
    type: "divider",
    version: 1,
    props: { style: "solid", thickness: "thin", padding: "md" },
  },
  {
    id: uid(),
    type: "text",
    version: 2,
    props: {
      body: "Trusted by teams at Acme, Globex, Initech, and 3,200 others.",
      align: "center",
      padding: "md",
      color: "muted",
      fontSize: "sm",
    },
  },
  {
    id: uid(),
    type: "cta",
    version: 1,
    props: {
      title: "Ready to ship?",
      subtitle: "Start your 14-day trial. No card required.",
      ctaLabel: "Get started",
      ctaHref: "#signup",
      padding: "2xl",
      bg: "muted",
      align: "center",
    },
  },
];

const portfolio = (): Block[] => [
  {
    id: uid(),
    type: "hero",
    version: 1,
    props: {
      title: "Jane Doe",
      subtitle: "Product designer · Based in Berlin",
      padding: "xl",
      bg: "background",
      align: "left",
    },
  },
  {
    id: uid(),
    type: "text",
    version: 2,
    props: {
      body: "I design systems and tools that make teams ship faster. Previously at Stripe, Linear, and Vercel.",
      align: "left",
      padding: "md",
      fontSize: "lg",
      maxWidth: "prose",
    },
  },
  {
    id: uid(),
    type: "gallery",
    version: 1,
    props: { columns: 3, items: [], padding: "lg" },
  },
  {
    id: uid(),
    type: "divider",
    version: 1,
    props: { style: "solid", thickness: "thin", padding: "sm" },
  },
  {
    id: uid(),
    type: "text",
    version: 2,
    props: {
      body: "Selected work",
      align: "left",
      padding: "md",
      fontSize: "2xl",
    },
  },
  {
    id: uid(),
    type: "richtext",
    version: 1,
    props: {
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", marks: [{ type: "bold" }], text: "Project one — " },
              { type: "text", text: "Redesign of a checkout flow that lifted conversion 18%." },
            ],
          },
          {
            type: "paragraph",
            content: [
              { type: "text", marks: [{ type: "bold" }], text: "Project two — " },
              { type: "text", text: "A design system adopted across seven product teams." },
            ],
          },
        ],
      },
      padding: "md",
      maxWidth: "prose",
    },
  },
  {
    id: uid(),
    type: "button",
    version: 1,
    props: {
      label: "Get in touch",
      href: "mailto:hello@example.com",
      variant: "primary",
      target: "_self",
      align: "left",
      padding: "md",
    },
  },
];

const blogPost = (): Block[] => [
  {
    id: uid(),
    type: "hero",
    version: 1,
    props: {
      title: "How we halved our build times",
      subtitle: "A short case study on incremental adoption of Turborepo.",
      padding: "xl",
      bg: "background",
      align: "center",
    },
  },
  {
    id: uid(),
    type: "text",
    version: 2,
    props: {
      body: "Published April 19, 2026 · 6 min read",
      align: "center",
      padding: "sm",
      color: "muted",
      fontSize: "sm",
    },
  },
  {
    id: uid(),
    type: "image",
    version: 1,
    props: {
      src: "",
      alt: "",
      fit: "cover",
      padding: "md",
      radius: "md",
      maxWidth: "2xl",
    },
  },
  {
    id: uid(),
    type: "richtext",
    version: 1,
    props: {
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "The story starts in a familiar place: a monorepo with 40 packages and builds that took eleven minutes." },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "What we tried first" }],
          },
          {
            type: "paragraph",
            content: [
              { type: "text", text: "We started by auditing which tasks were actually slow. Most weren't — they were just uncached." },
            ],
          },
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Type generation was fully recomputed every run." }] }],
              },
              {
                type: "listItem",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Downstream packages rebuilt even when inputs were identical." }] }],
              },
            ],
          },
        ],
      },
      padding: "md",
      maxWidth: "prose",
    },
  },
  {
    id: uid(),
    type: "divider",
    version: 1,
    props: { style: "solid", thickness: "thin", padding: "sm" },
  },
  {
    id: uid(),
    type: "cta",
    version: 1,
    props: {
      title: "Enjoyed this post?",
      subtitle: "Subscribe for one short write-up a week.",
      ctaLabel: "Subscribe",
      ctaHref: "#subscribe",
      padding: "lg",
      bg: "muted",
      align: "center",
    },
  },
];

const aboutPage = (): Block[] => [
  {
    id: uid(),
    type: "hero",
    version: 1,
    props: {
      title: "About us",
      subtitle: "A small team building tools we wish existed.",
      padding: "xl",
      bg: "muted",
      align: "center",
    },
  },
  {
    id: uid(),
    type: "columns",
    version: 1,
    props: { count: 2, padding: "xl", gap: "xl" },
    children: [
      {
        id: uid(),
        type: "image",
        version: 1,
        props: { src: "", alt: "", fit: "cover", radius: "md" },
      },
      {
        id: uid(),
        type: "richtext",
        version: 1,
        props: {
          content: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Our story" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "We started in 2023 because every tool we touched forced a trade-off we didn't want to make." }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Today the team is nine people, spread across four timezones, shipping a release every Thursday." }],
              },
            ],
          },
          padding: "md",
        },
      },
    ],
  },
  {
    id: uid(),
    type: "divider",
    version: 1,
    props: { style: "solid", thickness: "thin", padding: "md" },
  },
  {
    id: uid(),
    type: "cta",
    version: 1,
    props: {
      title: "Want to work with us?",
      ctaLabel: "See open roles",
      ctaHref: "/careers",
      padding: "xl",
      bg: "background",
      align: "center",
    },
  },
];

const contactPage = (): Block[] => [
  {
    id: uid(),
    type: "hero",
    version: 1,
    props: {
      title: "Get in touch",
      subtitle: "We usually reply within one working day.",
      padding: "xl",
      bg: "background",
      align: "center",
    },
  },
  {
    id: uid(),
    type: "columns",
    version: 1,
    props: { count: 2, padding: "xl", gap: "xl" },
    children: [
      {
        id: uid(),
        type: "richtext",
        version: 1,
        props: {
          content: {
            type: "doc",
            content: [
              { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Email" }] },
              { type: "paragraph", content: [{ type: "text", text: "hello@example.com" }] },
              { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Support" }] },
              { type: "paragraph", content: [{ type: "text", text: "support@example.com" }] },
              { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Office" }] },
              { type: "paragraph", content: [{ type: "text", text: "Friedrichstraße 123, 10117 Berlin" }] },
            ],
          },
          padding: "md",
        },
      },
      {
        id: uid(),
        type: "card",
        version: 1,
        props: { title: "Book a call", padding: "lg", bg: "muted", radius: "md" },
        children: [
          {
            id: uid(),
            type: "text",
            version: 2,
            props: { body: "Prefer to talk? Grab a 20-minute slot.", align: "left", padding: "sm" },
          },
          {
            id: uid(),
            type: "button",
            version: 1,
            props: {
              label: "Book a call",
              href: "#calendly",
              variant: "primary",
              target: "_blank",
              align: "left",
              padding: "sm",
            },
          },
        ],
      },
    ],
  },
];

export const pageTemplates: PageTemplate[] = [
  {
    id: "saas-landing",
    name: "SaaS landing",
    description: "Hero, features, social proof, CTA",
    icon: "🚀",
    blocks: saasLanding,
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Personal intro, gallery, work list",
    icon: "🎨",
    blocks: portfolio,
  },
  {
    id: "blog-post",
    name: "Blog post",
    description: "Title, cover, article body, subscribe CTA",
    icon: "📝",
    blocks: blogPost,
  },
  {
    id: "about",
    name: "About page",
    description: "Story, image + text split, hiring CTA",
    icon: "🧭",
    blocks: aboutPage,
  },
  {
    id: "contact",
    name: "Contact page",
    description: "Contact details + booking card",
    icon: "✉️",
    blocks: contactPage,
  },
];

export function findPageTemplate(id: string): PageTemplate | undefined {
  return pageTemplates.find((t) => t.id === id);
}
