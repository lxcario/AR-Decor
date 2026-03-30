import type { ProductCategory } from "../types/app";

export const categories: ProductCategory[] = [
  {
    id: "sofas",
    label: "Sofas",
    description: "Room-anchoring silhouettes with real-world dimensions ready for AR.",
    coverImage: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80",
    accentLabel: "Scaled seating",
  },
  {
    id: "tables",
    label: "Tables",
    description: "Side tables and surfaces with sculptural profiles and grounded placement.",
    coverImage: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800&q=80",
    accentLabel: "Stone and form",
  },
  {
    id: "lighting",
    label: "Lighting",
    description: "Lamps and wall pieces that add soft ambience and clean silhouettes.",
    coverImage: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
    accentLabel: "Ambient glow",
  },
  {
    id: "seating",
    label: "Seating",
    description: "Accent seating with compact footprints and strong visual presence.",
    coverImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    accentLabel: "Curved comfort",
  },
  {
    id: "storage",
    label: "Storage",
    description: "Shelves and utility pieces that read as architecture, not clutter.",
    coverImage: "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=800&q=80",
    accentLabel: "Architectural calm",
  },
  {
    id: "textiles",
    label: "Textiles",
    description: "Rugs and soft goods that ground the room with pattern and texture.",
    coverImage: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=800&q=80",
    accentLabel: "Soft layers",
  },
  {
    id: "decor",
    label: "Decor",
    description: "Smaller styling pieces for tables, shelves, walls, and collected corners.",
    coverImage: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800&q=80",
    accentLabel: "Collected details",
  },
];