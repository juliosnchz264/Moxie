"use client";

import { useEffect } from "react";
import { googleFontsHref } from "@moxie/tokens";
import { useEditor } from "@/lib/store";

const LINK_ID = "moxie-google-fonts";

export function GoogleFontsLoader() {
  const theme = useEditor((s) => s.theme);

  useEffect(() => {
    const families = [theme.fonts?.sans, theme.fonts?.heading].filter(
      (f): f is string => typeof f === "string" && f.length > 0,
    );
    const href = googleFontsHref(families);

    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!href) {
      if (link) link.remove();
      return;
    }
    if (!link) {
      link = document.createElement("link");
      link.id = LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }, [theme.fonts?.sans, theme.fonts?.heading]);

  return null;
}
