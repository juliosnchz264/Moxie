import { describe, it, expect } from "vitest";
import { textBlock } from "../src/blocks/text";
import { migrateProps } from "../src/migrate";
import { validateBlock } from "../src/validate";
import { defaultRegistry } from "../src/default-registry";
import type { Block } from "@moxie/core";

describe("text block v1 → v2 migration", () => {
  const v1Props = { body: "Hello world" };

  it("migrateProps adds default align and preserves body", () => {
    const migrated = migrateProps(textBlock, 1, v1Props) as Record<
      string,
      unknown
    >;

    expect(migrated.body).toBe("Hello world");
    expect(migrated.align).toBe("left");
  });

  it("migrateProps does not drop passthrough keys (e.g. token props)", () => {
    const v1WithTokens = { body: "copy", padding: "md", bg: "muted" };
    const migrated = migrateProps(textBlock, 1, v1WithTokens) as Record<
      string,
      unknown
    >;

    expect(migrated).toMatchObject({
      body: "copy",
      align: "left",
      padding: "md",
      bg: "muted",
    });
  });

  it("validateBlock migrates a v1 block to latest version (v2) end-to-end", () => {
    const v1Block: Block = {
      id: "t1",
      type: "text",
      version: 1,
      props: v1Props,
    };

    const out = validateBlock(v1Block, defaultRegistry);

    expect(out.version).toBe(2);
    expect(out.props).toMatchObject({ body: "Hello world", align: "left" });
  });

  it("migrateProps is a no-op when the block is already at the latest version", () => {
    const v2Props = { body: "ready", align: "center" as const };
    const result = migrateProps(textBlock, 2, v2Props);
    expect(result).toEqual(v2Props);
  });

  it("rejects out-of-range versions with descriptive errors", () => {
    expect(() => migrateProps(textBlock, 0, v1Props)).toThrow(
      /invalid version 0/,
    );
    expect(() => migrateProps(textBlock, 99, v1Props)).toThrow(
      /newer than registered latest/,
    );
  });

  it("throws a descriptive Zod error when v1 body is missing", () => {
    expect(() => migrateProps(textBlock, 1, {})).toThrow(/body/i);
  });
});
