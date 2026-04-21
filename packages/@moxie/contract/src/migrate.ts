import type { BlockDefinition } from "./definition";

export function migrateProps(
  def: BlockDefinition,
  fromVersion: number,
  props: unknown,
): unknown {
  const latest = def.versions[def.versions.length - 1]!.version;

  if (fromVersion < 1) {
    throw new Error(`Block "${def.type}": invalid version ${fromVersion}`);
  }
  if (fromVersion > latest) {
    throw new Error(
      `Block "${def.type}": block version ${fromVersion} is newer than registered latest v${latest}`,
    );
  }

  let current = props;
  for (let v = fromVersion + 1; v <= latest; v++) {
    const step = def.versions[v - 1]!;
    if (!step.migrate) {
      throw new Error(`Block "${def.type}" v${v}: migrate function missing`);
    }
    current = step.migrate(current);
  }
  return current;
}
