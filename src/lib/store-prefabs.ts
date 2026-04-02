import type {
  LayoutCollider,
  LayoutInteraction,
  LayoutObject,
  ObjCategory,
} from "./store-layout";

export interface PrefabDefinition {
  id: string;
  label: string;
  family: string;
  category: ObjCategory;
  defaultWidth: number;
  defaultDepth: number;
  editorColor: string;
  defaultLayer: string;
  defaultCollider?: LayoutCollider;
  defaultInteraction?: LayoutInteraction;
}

const BOX = (
  width: number,
  depth: number,
  extras?: Partial<LayoutCollider>
): LayoutCollider => ({
  type: "box",
  enabled: true,
  width,
  depth,
  ...extras,
});

export const STORE_PREFABS: PrefabDefinition[] = [
  {
    id: "shelf/gondola",
    label: "Shelf Gondola",
    family: "shelf",
    category: "shelf",
    defaultWidth: 3.2,
    defaultDepth: 0.6,
    editorColor: "#8B5E3C",
    defaultLayer: "fixtures",
    defaultCollider: BOX(2.6, 0.4),
    defaultInteraction: { type: "shelf", label: "Browse Shelf" },
  },
  {
    id: "shelf/wall-run",
    label: "Wall Shelf Run",
    family: "shelf",
    category: "shelf",
    defaultWidth: 6,
    defaultDepth: 0.3,
    editorColor: "#8B5E3C",
    defaultLayer: "fixtures",
    defaultCollider: BOX(6, 0.3),
  },
  {
    id: "shelf/new-releases-wall",
    label: "New Releases Wall",
    family: "shelf",
    category: "shelf",
    defaultWidth: 19,
    defaultDepth: 0.3,
    editorColor: "#ec4899",
    defaultLayer: "fixtures",
    defaultCollider: BOX(19, 0.4),
  },
  {
    id: "fixture/counter",
    label: "Counter",
    family: "fixture",
    category: "counter",
    defaultWidth: 6,
    defaultDepth: 1.2,
    editorColor: "#D2B48C",
    defaultLayer: "fixtures",
    defaultCollider: BOX(6.4, 1.6),
  },
  {
    id: "prop/trophy-shelf",
    label: "Trophy Shelf",
    family: "prop",
    category: "prop",
    defaultWidth: 0.6,
    defaultDepth: 2.5,
    editorColor: "#22c55e",
    defaultLayer: "props",
    defaultCollider: BOX(0.8, 2.8),
    defaultInteraction: { type: "trophy", label: "View Collection" },
  },
  {
    id: "wall/poster",
    label: "Wall Poster",
    family: "wall",
    category: "wall",
    defaultWidth: 0.8,
    defaultDepth: 0.2,
    editorColor: "#ffd700",
    defaultLayer: "wall-decor",
  },
  {
    id: "sign/neon",
    label: "Neon Sign",
    family: "sign",
    category: "wall",
    defaultWidth: 5.8,
    defaultDepth: 0.15,
    editorColor: "#ffd700",
    defaultLayer: "wall-decor",
  },
  {
    id: "sign/plastic-store",
    label: "Plastic Store Sign",
    family: "sign",
    category: "wall",
    defaultWidth: 1.5,
    defaultDepth: 0.15,
    editorColor: "#ffd700",
    defaultLayer: "wall-decor",
  },
  {
    id: "sign/open",
    label: "Open Sign",
    family: "sign",
    category: "wall",
    defaultWidth: 1,
    defaultDepth: 0.15,
    editorColor: "#ff6b6b",
    defaultLayer: "wall-decor",
  },
  {
    id: "sign/store-hours",
    label: "Store Hours",
    family: "sign",
    category: "wall",
    defaultWidth: 1.3,
    defaultDepth: 0.9,
    editorColor: "#ffd700",
    defaultLayer: "wall-decor",
  },
  {
    id: "sign/promo-board",
    label: "Promo Board",
    family: "sign",
    category: "wall",
    defaultWidth: 1,
    defaultDepth: 0.2,
    editorColor: "#ffd700",
    defaultLayer: "wall-decor",
  },
  {
    id: "sign/challenge-board",
    label: "Challenge Board",
    family: "sign",
    category: "wall",
    defaultWidth: 0.82,
    defaultDepth: 0.2,
    editorColor: "#ffd700",
    defaultLayer: "wall-decor",
    defaultInteraction: { type: "challenge", label: "Challenge Board" },
  },
  {
    id: "prop/bulletin-board",
    label: "Bulletin Board",
    family: "prop",
    category: "wall",
    defaultWidth: 1.2,
    defaultDepth: 0.2,
    editorColor: "#22c55e",
    defaultLayer: "wall-decor",
  },
  {
    id: "prop/wall-clock",
    label: "Wall Clock",
    family: "prop",
    category: "wall",
    defaultWidth: 0.5,
    defaultDepth: 0.5,
    editorColor: "#ffd700",
    defaultLayer: "wall-decor",
  },
  {
    id: "prop/return-bin",
    label: "Return Bin",
    family: "prop",
    category: "prop",
    defaultWidth: 0.8,
    defaultDepth: 0.6,
    editorColor: "#22c55e",
    defaultLayer: "props",
    defaultCollider: BOX(1, 0.8),
    defaultInteraction: { type: "return_slot", label: "Drop Returns Here" },
  },
  {
    id: "prop/bargain-bin",
    label: "Bargain Bin",
    family: "prop",
    category: "prop",
    defaultWidth: 0.9,
    defaultDepth: 0.7,
    editorColor: "#22c55e",
    defaultLayer: "props",
    defaultCollider: BOX(1.1, 0.9),
  },
  {
    id: "prop/trash-can",
    label: "Trash Can",
    family: "prop",
    category: "prop",
    defaultWidth: 0.35,
    defaultDepth: 0.35,
    editorColor: "#22c55e",
    defaultLayer: "props",
    defaultCollider: BOX(0.45, 0.45),
  },
  {
    id: "prop/crt-tv",
    label: "CRT TV",
    family: "prop",
    category: "wall",
    defaultWidth: 1,
    defaultDepth: 0.3,
    editorColor: "#ffd700",
    defaultLayer: "wall-decor",
    defaultInteraction: { type: "tv", label: "Friday Night Pick" },
  },
  {
    id: "exterior/car",
    label: "Car",
    family: "exterior",
    category: "exterior",
    defaultWidth: 2,
    defaultDepth: 1,
    editorColor: "#ff6b6b",
    defaultLayer: "exterior",
    defaultCollider: BOX(2.2, 1.3),
  },
  {
    id: "exterior/lamp-post",
    label: "Lamp Post",
    family: "exterior",
    category: "exterior",
    defaultWidth: 0.3,
    defaultDepth: 0.3,
    editorColor: "#ff6b6b",
    defaultLayer: "exterior",
    defaultCollider: BOX(0.6, 0.6),
  },
];

export const STORE_PREFAB_MAP = new Map(
  STORE_PREFABS.map((prefab) => [prefab.id, prefab] as const)
);

export function inferPrefabId(
  obj: Pick<LayoutObject, "id" | "category">
): string | undefined {
  if (obj.id.startsWith("shelf-row")) return "shelf/gondola";
  if (obj.id === "wallshelf-back-drama") return "shelf/wall-run";
  if (obj.id === "new-releases-wall") return "shelf/new-releases-wall";
  if (obj.id === "counter") return "fixture/counter";
  if (obj.id === "trophy-shelf") return "prop/trophy-shelf";
  if (obj.id.startsWith("poster-")) return "wall/poster";
  if (obj.id === "neon-sign") return "sign/neon";
  if (
    obj.id === "be-kind-sign" ||
    obj.id === "late-fees-sign" ||
    obj.id === "rewards-sign"
  ) {
    return "sign/plastic-store";
  }
  if (obj.id === "open-sign" || obj.id === "laundro-open") return "sign/open";
  if (obj.id === "store-hours") return "sign/store-hours";
  if (obj.id === "promo-board") return "sign/promo-board";
  if (obj.id === "challenge-board") return "sign/challenge-board";
  if (obj.id === "bulletin-board") return "prop/bulletin-board";
  if (obj.id === "clock-counter") return "prop/wall-clock";
  if (obj.id === "return-bin") return "prop/return-bin";
  if (obj.id === "bargain-crate") return "prop/bargain-bin";
  if (obj.id === "trash-can") return "prop/trash-can";
  if (obj.id === "tv-left" || obj.id === "tv-right") return "prop/crt-tv";
  if (obj.id.startsWith("car-")) return "exterior/car";
  if (obj.id.startsWith("lamp-")) return "exterior/lamp-post";
  return undefined;
}

export function getPrefabDefinition(
  prefabId: string | undefined
): PrefabDefinition | undefined {
  return prefabId ? STORE_PREFAB_MAP.get(prefabId) : undefined;
}

export function resolvePrefabDefinition(
  obj: Pick<LayoutObject, "id" | "category" | "prefab">
): PrefabDefinition | undefined {
  return getPrefabDefinition(obj.prefab || inferPrefabId(obj));
}
