import { CategoryId } from './categories';

// Add an entry here each time you draw a new overlay.
// Categories not listed yet will fall back to the generic box shape.
export const OVERLAY_IMAGES: Partial<Record<CategoryId, any>> = {
  'long-sleeves': require('../assets/overlays/long-sleeves.png'),
};