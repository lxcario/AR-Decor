import type { Product } from "../types/app";

const image = (id: string, src: string, alt: string) => ({
  id,
  src,
  alt,
});

export const products: Product[] = [
  {
    id: "prod_solstice_cloud_sofa",
    slug: "solstice-cloud-sofa",
    sku: "ARD-SOF-001",
    name: "Solstice Cloud Sofa",
    collection: "Atelier Living",
    designer: "Mara Elston",
    categoryId: "sofas",
    badge: "Featured in AR",
    tagline: "A low, loungey silhouette for soft evening light.",
    shortDescription: "Oversized lounge sofa in oat boucle with a deep, sink-in seat.",
    description:
      "The Solstice Cloud Sofa balances relaxed depth with refined tailoring, pairing a sculpted profile with performance boucle that keeps its polish in busy living rooms.",
    roomSceneLabel: "Open-plan living room",
    priceUsd: 3290,
    compareAtUsd: 3580,
    rating: 4.9,
    reviewCount: 126,
    heroImage: image(
      "solstice-hero",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&q=80",
      "Cream boucle sofa styled in a warm modern living room.",
    ),
    gallery: [
      image(
        "solstice-gallery-1",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
        "Softly lit living room with layered textures and neutral seating.",
      ),
      image(
        "solstice-gallery-2",
        "https://images.unsplash.com/photo-1505693416388-cf5b2e4db8e6?auto=format&fit=crop&w=1200&q=80",
        "Close-up of a textured ivory upholstery fabric.",
      ),
      image(
        "solstice-gallery-3",
        "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
        "Warm-toned coffee table and sofa composition in a premium interior.",
      ),
    ],
    arPlacementImage: image(
      "solstice-ar",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80",
      "Front angle of the Solstice sofa for AR placement preview.",
    ),
    inventory: {
      status: "in_stock",
      leadTimeLabel: "Ready to ship in 5-7 days",
    },
    finishes: [
      { name: "Oat Boucle", swatch: "#d8d0c4", material: "Performance boucle" },
      { name: "Sand Linen", swatch: "#d7c8bb", material: "Belgian linen blend" },
      { name: "Charcoal Weave", swatch: "#4b4844", material: "Textured woven chenille" },
    ],
    materials: ["Performance boucle", "Kiln-dried hardwood", "High-density foam", "Feather blend"],
    dimensions: {
      widthIn: 96,
      depthIn: 40,
      heightIn: 31,
      seatHeightIn: 18,
    },
    features: [
      "Deep seat profile designed for lounging",
      "Removable cushion covers for easier upkeep",
      "Wide armrest proportions for book and tray styling",
    ],
    care: [
      "Vacuum with a soft upholstery attachment weekly",
      "Blot spills immediately with a dry microfiber cloth",
      "Rotate cushions monthly to maintain loft",
    ],
    demoPrompt:
      "A cinematic smartphone video showing the Solstice Cloud Sofa being placed in a bright, neutral living room, with soft camera movement, premium retail styling, and a polished mobile AR shopping feel.",
  },
  {
    id: "prod_marlow_travertine_table",
    slug: "marlow-travertine-table",
    sku: "ARD-TBL-014",
    name: "Marlow Travertine Table",
    collection: "Residency Collection",
    designer: "Julian Vale",
    categoryId: "tables",
    badge: "Limited run",
    tagline: "Stone presence without visual heaviness.",
    shortDescription: "Oval coffee table in honed travertine with a recessed plinth base.",
    description:
      "The Marlow anchors a room with quiet material depth. Its softened oval top and recessed base create a floating profile that reads luxe without feeling formal.",
    roomSceneLabel: "Gallery-style living area",
    priceUsd: 2140,
    rating: 4.8,
    reviewCount: 64,
    heroImage: image(
      "marlow-hero",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80",
      "Stone coffee table layered with books in a warm premium lounge.",
    ),
    gallery: [
      image(
        "marlow-gallery-1",
        "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=80",
        "Neutral living room with sculptural stone surfaces.",
      ),
      image(
        "marlow-gallery-2",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
        "Editorial interior styling with warm natural finishes.",
      ),
      image(
        "marlow-gallery-3",
        "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
        "Close-up of stone texture and subtle tonal variation.",
      ),
    ],
    arPlacementImage: image(
      "marlow-ar",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1000&q=80",
      "Oval travertine coffee table for AR placement preview.",
    ),
    inventory: {
      status: "limited",
      leadTimeLabel: "Ships in 2 weeks",
      piecesLeft: 9,
    },
    finishes: [
      { name: "Honed Travertine", swatch: "#c7b49a", material: "Natural stone" },
      { name: "Smoked Oak", swatch: "#5f4a3a", material: "Solid oak veneer base" },
    ],
    materials: ["Honed travertine", "Engineered hardwood core", "Felt floor glides"],
    dimensions: {
      widthIn: 54,
      depthIn: 30,
      heightIn: 14,
    },
    features: [
      "Recessed plinth creates a floating silhouette",
      "Rounded edge profile softens the stone surface",
      "Protected underside for apartment-friendly moves",
    ],
    care: [
      "Seal annually with a stone-safe treatment",
      "Use coasters for acidic drinks and oils",
      "Dust with a dry cloth to preserve the honed finish",
    ],
    demoPrompt:
      "A polished mobile commerce demo of the Marlow Travertine Table appearing in a modern living room through a phone camera, with subtle parallax and elegant lighting.",
  },
  {
    id: "prod_vesper_floor_lamp",
    slug: "vesper-floor-lamp",
    sku: "ARD-LGT-007",
    name: "Vesper Floor Lamp",
    collection: "Afterglow",
    designer: "Lina Rosset",
    categoryId: "lighting",
    tagline: "Atmosphere first, hardware second.",
    shortDescription: "Sculptural floor lamp with a linen drum shade and aged brass stem.",
    description:
      "The Vesper was designed to disappear into the room until dusk, when its warm linen glow turns corners into intimate reading nooks.",
    roomSceneLabel: "Reading corner",
    priceUsd: 880,
    rating: 4.7,
    reviewCount: 42,
    heroImage: image(
      "vesper-hero",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
      "Warm floor lamp illuminating a neutral seating area.",
    ),
    gallery: [
      image(
        "vesper-gallery-1",
        "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80",
        "Ambient interior lighting with layered warm tones.",
      ),
      image(
        "vesper-gallery-2",
        "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80",
        "Linen texture and brass hardware details in soft natural light.",
      ),
      image(
        "vesper-gallery-3",
        "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80",
        "Minimal room styling with a warm lighting focus.",
      ),
    ],
    arPlacementImage: image(
      "vesper-ar",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80",
      "Floor lamp staged in a premium corner setting for AR preview.",
    ),
    inventory: {
      status: "in_stock",
      leadTimeLabel: "Ships in 3-5 business days",
    },
    finishes: [
      { name: "Aged Brass", swatch: "#9c7a46", material: "Brushed brass" },
      { name: "Soft Linen", swatch: "#e5ddd0", material: "Natural linen shade" },
    ],
    materials: ["Brushed brass", "Natural linen", "Weighted steel base"],
    dimensions: {
      widthIn: 20,
      depthIn: 20,
      heightIn: 66,
    },
    features: [
      "Warm-dim compatible LED socket",
      "Weighted base for secure placement",
      "Linen shade diffuses harsh overhead light",
    ],
    care: [
      "Dust shade with a lint roller or soft brush",
      "Polish metal with a dry jewelry cloth only",
      "Avoid moisture near the linen weave",
    ],
    demoPrompt:
      "A premium lifestyle demo where the Vesper Floor Lamp is visualized in the corner of a cozy living room, showing soft warm light and realistic mobile AR placement.",
  },
  {
    id: "prod_atelier_lounge_chair",
    slug: "atelier-lounge-chair",
    sku: "ARD-SET-021",
    name: "Atelier Lounge Chair",
    collection: "Edition No. 3",
    designer: "Tomas Verne",
    categoryId: "seating",
    badge: "Designer favorite",
    tagline: "Curved comfort with gallery posture.",
    shortDescription: "Rounded accent chair wrapped in camel boucle with a walnut base.",
    description:
      "A compact lounge chair shaped for conversation areas and bedroom corners, the Atelier brings sculptural character without overpowering tighter floor plans.",
    roomSceneLabel: "Primary bedroom corner",
    priceUsd: 1490,
    rating: 4.9,
    reviewCount: 88,
    heroImage: image(
      "atelier-hero",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=80",
      "Curved lounge chair in boucle fabric beside a side table.",
    ),
    gallery: [
      image(
        "atelier-gallery-1",
        "https://images.unsplash.com/photo-1505693416388-cf5b2e4db8e6?auto=format&fit=crop&w=1200&q=80",
        "Close-up of textured boucle upholstery and warm wood details.",
      ),
      image(
        "atelier-gallery-2",
        "https://images.unsplash.com/photo-1472220625704-91e1462799b2?auto=format&fit=crop&w=1200&q=80",
        "Editorial corner styling with an accent chair and layered lighting.",
      ),
      image(
        "atelier-gallery-3",
        "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80",
        "Warm seating nook with tactile finishes and soft natural light.",
      ),
    ],
    arPlacementImage: image(
      "atelier-ar",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80",
      "Accent chair ready for AR placement preview.",
    ),
    inventory: {
      status: "made_to_order",
      leadTimeLabel: "Made to order in 6-8 weeks",
    },
    finishes: [
      { name: "Camel Boucle", swatch: "#b69479", material: "Looped boucle" },
      { name: "Ivory Boucle", swatch: "#e6ddd3", material: "Looped boucle" },
      { name: "Walnut Frame", swatch: "#6a4f3d", material: "Solid walnut plinth" },
    ],
    materials: ["Boucle upholstery", "Solid walnut", "Foam core", "Fiber wrap"],
    dimensions: {
      widthIn: 34,
      depthIn: 33,
      heightIn: 29,
      seatHeightIn: 17,
    },
    features: [
      "Compact footprint for apartment layouts",
      "Solid wood plinth enhances the floating form",
      "Works as a standalone accent or pair",
    ],
    care: [
      "Spot clean with a textile-safe foam cleaner",
      "Keep out of direct prolonged sun to preserve tone",
      "Brush boucle gently to lift the pile",
    ],
    demoPrompt:
      "A refined product demo where the Atelier Lounge Chair is placed beside a bed and window in a warm minimalist room, viewed through an iPhone-like AR interface.",
  },
  {
    id: "prod_noa_arch_console",
    slug: "noa-arch-console",
    sku: "ARD-STO-009",
    name: "Noa Arch Console",
    collection: "Threshold",
    designer: "Elio Laurent",
    categoryId: "storage",
    tagline: "Slim storage that behaves like architecture.",
    shortDescription: "Arched console in smoked oak with concealed cable management.",
    description:
      "The Noa Arch Console is proportioned for entryways, media walls, and dining edges, delivering subtle storage without breaking the calm line of a room.",
    roomSceneLabel: "Entry and media wall",
    priceUsd: 1980,
    rating: 4.8,
    reviewCount: 53,
    heroImage: image(
      "noa-hero",
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1400&q=80",
      "Smoked oak console beneath artwork in a warm modern interior.",
    ),
    gallery: [
      image(
        "noa-gallery-1",
        "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80",
        "Styled console vignette with books and ceramics.",
      ),
      image(
        "noa-gallery-2",
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80",
        "Wood grain detail in warm directional light.",
      ),
      image(
        "noa-gallery-3",
        "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80",
        "Minimal console styling with sculptural accessories.",
      ),
    ],
    arPlacementImage: image(
      "noa-ar",
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1000&q=80",
      "Slim smoked oak console for AR placement preview.",
    ),
    inventory: {
      status: "in_stock",
      leadTimeLabel: "Ships in 7-10 business days",
    },
    finishes: [
      { name: "Smoked Oak", swatch: "#5b4332", material: "Oak veneer" },
      { name: "Natural Oak", swatch: "#b08963", material: "Oak veneer" },
    ],
    materials: ["Oak veneer", "Engineered hardwood", "Soft-close hardware"],
    dimensions: {
      widthIn: 72,
      depthIn: 16,
      heightIn: 31,
    },
    features: [
      "Hidden cable route for lamps and media accessories",
      "Slim depth designed for narrow circulation spaces",
      "Soft-close doors conceal daily clutter",
    ],
    care: [
      "Dust with a soft cloth following the wood grain",
      "Avoid hot serving pieces directly on the finish",
      "Use a wood-safe conditioner twice a year",
    ],
    demoPrompt:
      "A sleek AR shopping clip showing the Noa Arch Console appearing along a living room wall through a phone camera, with realistic scale, polished transitions, and luxury retail styling.",
  },
  {
    id: "prod_sora_boucle_ottoman",
    slug: "sora-boucle-ottoman",
    sku: "ARD-DEC-031",
    name: "Sora Boucle Ottoman",
    collection: "Soft Geometry",
    designer: "Anais Hart",
    categoryId: "decor",
    badge: "Layering essential",
    tagline: "The finishing layer that pulls a room together.",
    shortDescription: "Rounded ottoman in ivory boucle designed for flexible styling.",
    description:
      "The Sora is an adaptable accent piece that can float between coffee table, extra seat, and bedroom landing spot while softening sharper furniture profiles.",
    roomSceneLabel: "Flexible lounge space",
    priceUsd: 620,
    rating: 4.8,
    reviewCount: 71,
    heroImage: image(
      "sora-hero",
      "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1400&q=80",
      "Rounded boucle ottoman styled with books and textiles.",
    ),
    gallery: [
      image(
        "sora-gallery-1",
        "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80",
        "Detail of boucle texture and soft neutral color palette.",
      ),
      image(
        "sora-gallery-2",
        "https://images.unsplash.com/photo-1472220625704-91e1462799b2?auto=format&fit=crop&w=1200&q=80",
        "Layered decor composition with tactile fabrics and warm lighting.",
      ),
      image(
        "sora-gallery-3",
        "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=80",
        "Low lounge vignette with soft curves and premium materials.",
      ),
    ],
    arPlacementImage: image(
      "sora-ar",
      "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1000&q=80",
      "Rounded ottoman ready for AR placement preview.",
    ),
    inventory: {
      status: "in_stock",
      leadTimeLabel: "Ready to ship in 4-6 days",
    },
    finishes: [
      { name: "Ivory Boucle", swatch: "#e7e0d5", material: "Performance boucle" },
      { name: "Mushroom Weave", swatch: "#b8a292", material: "Textured weave" },
    ],
    materials: ["Performance boucle", "Foam core", "Wooden base"],
    dimensions: {
      widthIn: 24,
      depthIn: 24,
      heightIn: 16,
    },
    features: [
      "Lightweight enough to move room to room",
      "Rounded profile softens angular floor plans",
      "Doubles as a casual coffee table with a tray",
    ],
    care: [
      "Vacuum gently to remove dust and lint",
      "Rotate periodically to distribute wear",
      "Use a tray if styling with beverages or candles",
    ],
    demoPrompt:
      "A stylish mobile AR showcase where the Sora Boucle Ottoman is placed near a sofa in a bright room, emphasizing scale, texture, and a native iPhone shopping experience.",
  },
];

export const featuredProduct = products[0];

export const trendingProducts = products.slice(0, 4);

export const getProductBySlug = (slug: string) =>
  products.find((product) => product.slug === slug);
