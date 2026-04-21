import { createRegistry } from "./registry";
import {
  heroBlock,
  textBlock,
  sectionBlock,
  columnsBlock,
  imageBlock,
  buttonBlock,
  spacerBlock,
  dividerBlock,
  cardBlock,
  ctaBlock,
  galleryBlock,
  richtextBlock,
} from "./blocks";

export const defaultRegistry = createRegistry();
defaultRegistry.register(heroBlock);
defaultRegistry.register(textBlock);
defaultRegistry.register(sectionBlock);
defaultRegistry.register(columnsBlock);
defaultRegistry.register(imageBlock);
defaultRegistry.register(buttonBlock);
defaultRegistry.register(spacerBlock);
defaultRegistry.register(dividerBlock);
defaultRegistry.register(cardBlock);
defaultRegistry.register(ctaBlock);
defaultRegistry.register(galleryBlock);
defaultRegistry.register(richtextBlock);
