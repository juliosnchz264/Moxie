"use client";

import type { Block } from "@moxie/core";
import type { PayloadPageDoc, PayloadSiteDoc } from "./api-client";
import type { Device, EditorMode } from "./store";
import { blockTemplates } from "./templates";

export type CommandGroup =
  | "Insert"
  | "Navigate"
  | "Page"
  | "View"
  | "Device"
  | "Account";

export interface Command {
  id: string;
  label: string;
  hint?: string;
  group: CommandGroup;
  icon?: string;
  shortcut?: string;
  keywords?: string[];
  run: () => void | Promise<void>;
}

export interface CommandContext {
  page: {
    id: string;
    slug: string;
    title: string;
    status: "draft" | "published";
  } | null;
  site: PayloadSiteDoc | null;
  mode: EditorMode;
  device: Device;
  selectedId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  previewing: boolean;
  designMode: boolean;
  pages: PayloadPageDoc[] | null;

  addBlock: (block: Block) => void;
  setDevice: (d: Device) => void;
  undo: () => void;
  redo: () => void;
  removeBlock: (id: string) => void;

  navigate: (href: string) => void;
  openLiveSite: (slug?: string) => void;

  togglePreview: () => void;
  toggleDesign: () => void;
  openTemplates: () => void;
  openHelp: () => void;
  publish: () => void | Promise<void>;
  signOut: () => void | Promise<void>;
}

export function buildCommands(ctx: CommandContext): Command[] {
  const out: Command[] = [];
  const isPage = ctx.mode === "page";
  const isSlot = ctx.mode === "header" || ctx.mode === "footer";

  for (const tpl of blockTemplates) {
    if (tpl.presets && tpl.presets.length > 0) {
      for (const p of tpl.presets) {
        out.push({
          id: `insert.${tpl.type}.${p.id}`,
          label: `Add ${tpl.label} — ${p.label}`,
          hint: tpl.description,
          group: "Insert",
          icon: tpl.icon,
          keywords: [tpl.type, p.id, "add", "insert", "new", tpl.description],
          run: () => ctx.addBlock(p.build()),
        });
      }
    } else {
      out.push({
        id: `insert.${tpl.type}`,
        label: `Add ${tpl.label}`,
        hint: tpl.description,
        group: "Insert",
        icon: tpl.icon,
        keywords: [tpl.type, "add", "insert", "new", tpl.description],
        run: () => ctx.addBlock(tpl.build()),
      });
    }
  }

  if (ctx.site) {
    out.push({
      id: "nav.sites",
      label: "Go to all sites",
      group: "Navigate",
      icon: "⌂",
      keywords: ["dashboard", "home"],
      run: () => ctx.navigate("/sites"),
    });
    out.push({
      id: "nav.site",
      label: `Go to ${ctx.site.name} dashboard`,
      hint: ctx.site.domain,
      group: "Navigate",
      icon: "▤",
      keywords: ["site", "pages", ctx.site.slug],
      run: () => ctx.navigate(`/sites/${ctx.site!.id}`),
    });
    out.push({
      id: "nav.header",
      label: "Edit header",
      group: "Navigate",
      icon: "◳",
      keywords: ["layout", "top"],
      run: () => ctx.navigate(`/editor/site/${ctx.site!.id}/header`),
    });
    out.push({
      id: "nav.footer",
      label: "Edit footer",
      group: "Navigate",
      icon: "◱",
      keywords: ["layout", "bottom"],
      run: () => ctx.navigate(`/editor/site/${ctx.site!.id}/footer`),
    });
    out.push({
      id: "nav.live",
      label: "Open live site",
      hint: ctx.site.domain,
      group: "Navigate",
      icon: "↗",
      keywords: ["preview", "public", "view"],
      run: () => ctx.openLiveSite(isPage && ctx.page ? ctx.page.slug : ""),
    });
  }

  if (ctx.pages && ctx.site) {
    for (const doc of ctx.pages) {
      if (ctx.page && doc.id === ctx.page.id) continue;
      out.push({
        id: `nav.page.${doc.id}`,
        label: `Go to page: ${doc.title}`,
        hint: `/${doc.slug}`,
        group: "Navigate",
        icon: "▤",
        keywords: [doc.slug, "page", "open"],
        run: () => ctx.navigate(`/editor/${doc.id}`),
      });
    }
  }

  if (isPage && ctx.page) {
    out.push({
      id: "page.publish",
      label: ctx.page.status === "published" ? "Republish page" : "Publish page",
      hint: ctx.page.status === "published" ? "Update live version" : "Make live",
      group: "Page",
      icon: "🚀",
      keywords: ["ship", "live", "deploy"],
      run: () => ctx.publish(),
    });
  }
  if (isPage) {
    out.push({
      id: "page.templates",
      label: "Apply page template",
      group: "Page",
      icon: "◧",
      keywords: ["starter", "preset", "layout"],
      run: () => ctx.openTemplates(),
    });
  }

  out.push({
    id: "view.preview",
    label: ctx.previewing ? "Exit preview" : "Preview page",
    group: "View",
    icon: "◉",
    keywords: ["play", "test", "live"],
    run: () => ctx.togglePreview(),
  });
  if (!isSlot) {
    out.push({
      id: "view.theme",
      label: ctx.designMode ? "Close theme editor" : "Open theme editor",
      group: "View",
      icon: "❖",
      keywords: ["design", "colors", "fonts", "tokens"],
      run: () => ctx.toggleDesign(),
    });
  }
  out.push({
    id: "view.undo",
    label: "Undo",
    group: "View",
    icon: "↶",
    shortcut: "⌘Z",
    keywords: ["back", "revert"],
    run: () => {
      if (ctx.canUndo) ctx.undo();
    },
  });
  out.push({
    id: "view.redo",
    label: "Redo",
    group: "View",
    icon: "↷",
    shortcut: "⌘⇧Z",
    keywords: ["forward"],
    run: () => {
      if (ctx.canRedo) ctx.redo();
    },
  });
  out.push({
    id: "view.help",
    label: "Keyboard shortcuts",
    group: "View",
    icon: "?",
    shortcut: "?",
    keywords: ["help", "keys"],
    run: () => ctx.openHelp(),
  });
  if (ctx.selectedId) {
    out.push({
      id: "view.delete",
      label: "Delete selected block",
      group: "View",
      icon: "✕",
      shortcut: "Del",
      keywords: ["remove", "trash"],
      run: () => {
        if (ctx.selectedId) ctx.removeBlock(ctx.selectedId);
      },
    });
  }

  const devices: { d: Device; label: string; icon: string }[] = [
    { d: "desktop", label: "Desktop", icon: "▭" },
    { d: "tablet", label: "Tablet", icon: "▯" },
    { d: "mobile", label: "Mobile", icon: "▮" },
  ];
  for (const { d, label, icon } of devices) {
    if (d === ctx.device) continue;
    out.push({
      id: `device.${d}`,
      label: `Switch to ${label}`,
      group: "Device",
      icon,
      keywords: ["responsive", "viewport", d],
      run: () => ctx.setDevice(d),
    });
  }

  out.push({
    id: "account.signout",
    label: "Sign out",
    group: "Account",
    icon: "⇥",
    keywords: ["logout", "exit"],
    run: () => ctx.signOut(),
  });

  return out;
}
