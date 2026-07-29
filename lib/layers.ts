import { CategoryId } from './categories';

export type LayerId =
  | 'underwear'
  | 'legwear'
  | 'shoes'
  | 'bottoms'
  | 'sleeves'
  | 'sweaters'
  | 'jackets'
  | 'accessories';

export type Layer = {
  id: LayerId;
  label: string;
  categories: CategoryId[];
};

// Order = stacking order, bottom of the outfit to top
export const LAYERS: Layer[] = [
  { id: 'underwear', label: 'Underwear', categories: ['bras'] },
  { id: 'legwear', label: 'Legwear', categories: ['tights'] },
  { id: 'shoes', label: 'Shoes', categories: ['shoes'] },
  { id: 'bottoms', label: 'Bottoms', categories: ['pants', 'skirts', 'dresses'] },
  { id: 'sleeves', label: 'Tops', categories: ['short-sleeves', 'long-sleeves'] },
  { id: 'sweaters', label: 'Sweaters', categories: ['sweaters'] },
  { id: 'jackets', label: 'Jackets', categories: ['jackets'] },
  { id: 'accessories', label: 'Accessories', categories: ['jewelry', 'belts', 'bags', 'hats', 'scarves'] },
];

// Look up which layer a given category belongs to
export function layerForCategory(category: CategoryId): LayerId {
  const layer = LAYERS.find((l) => l.categories.includes(category));
  return layer?.id ?? 'sleeves';
}