import { Suspense, lazy, type ReactNode } from "react";
import { createComponentRegistry } from "@moxie/engine";
import { Hero } from "./Hero";
import { Text } from "./Text";
import { Section } from "./Section";
import { Columns } from "./Columns";
import { Image as ImageBlock } from "./Image";
import { Button } from "./Button";
import { Spacer } from "./Spacer";
import { Divider } from "./Divider";
import { Card } from "./Card";
import { Cta } from "./Cta";

const Gallery = lazy(() =>
  import("./Gallery").then((m) => ({ default: m.Gallery })),
);
const RichText = lazy(() =>
  import("./RichText").then((m) => ({ default: m.RichText })),
);

function LazySkeleton({ className, label }: { className: string; label: string }) {
  return (
    <div
      className={`${className} animate-pulse text-xs text-slate-400 italic border border-dashed border-slate-200 rounded p-6 text-center`.trim()}
    >
      Loading {label}…
    </div>
  );
}

export const componentRegistry = createComponentRegistry<ReactNode>();

componentRegistry.register("hero", ({ block, className }) => (
  <Hero block={block} className={className} />
));

componentRegistry.register("text", ({ block, className }) => (
  <Text block={block} className={className} />
));

componentRegistry.register("section", ({ block, className, children }) => (
  <Section block={block} className={className} slots={children} />
));

componentRegistry.register("columns", ({ block, className, children }) => (
  <Columns block={block} className={className} slots={children} />
));

componentRegistry.register("image", ({ block, className }) => (
  <ImageBlock block={block} className={className} />
));

componentRegistry.register("button", ({ block, className }) => (
  <Button block={block} className={className} />
));

componentRegistry.register("spacer", ({ block, className }) => (
  <Spacer block={block} className={className} />
));

componentRegistry.register("divider", ({ block, className }) => (
  <Divider block={block} className={className} />
));

componentRegistry.register("card", ({ block, className, children }) => (
  <Card block={block} className={className} slots={children} />
));

componentRegistry.register("cta", ({ block, className }) => (
  <Cta block={block} className={className} />
));

componentRegistry.register("gallery", ({ block, className }) => (
  <Suspense fallback={<LazySkeleton className={className} label="gallery" />}>
    <Gallery block={block} className={className} />
  </Suspense>
));

componentRegistry.register("richtext", ({ block, className }) => (
  <Suspense fallback={<LazySkeleton className={className} label="rich text" />}>
    <RichText block={block} className={className} />
  </Suspense>
));
