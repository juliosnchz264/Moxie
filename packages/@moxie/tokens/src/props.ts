import type { SpacingToken } from "./spacing";
import type { ColorToken } from "./color";
import type { RadiusToken } from "./radius";
import type { FontSizeToken, AlignToken } from "./typography";
import type { ShadowToken } from "./shadow";
import type { BorderToken } from "./border";
import type { MaxWidthToken } from "./width";
import type { ResponsiveValue } from "./responsive";

export interface TokenProps {
  padding?: ResponsiveValue<SpacingToken>;
  paddingX?: ResponsiveValue<SpacingToken>;
  paddingY?: ResponsiveValue<SpacingToken>;
  gap?: ResponsiveValue<SpacingToken>;
  bg?: ResponsiveValue<ColorToken>;
  color?: ResponsiveValue<ColorToken>;
  radius?: ResponsiveValue<RadiusToken>;
  fontSize?: ResponsiveValue<FontSizeToken>;
  align?: ResponsiveValue<AlignToken>;
  shadow?: ResponsiveValue<ShadowToken>;
  border?: ResponsiveValue<BorderToken>;
  borderColor?: ResponsiveValue<ColorToken>;
  maxWidth?: ResponsiveValue<MaxWidthToken>;
}
