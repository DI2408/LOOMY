/* Types duplicated to avoid circular import with LumiProvider. */
type SizeKey = "XS" | "S" | "M" | "L";
type Product = {
  id: string;
  name: string;
  category: "New In" | "Emergency Outfits" | "Shoes" | "Accessories";
  description: string;
  imageUrl: string;
  price: number;
  sizes: Record<SizeKey, number>;
};
type StoreData = {
  id: string;
  name: string;
  neighborhood: string;
  address: string;
  etaMinutes: number;
  rating: number;
  products: Product[];
};
type CourierData = {
  id: string;
  name: string;
  zone: string;
  etaMinutes: number;
  status: "available" | "on_delivery";
};

/** In-memory demo catalog when Supabase is unavailable or catalog fetch fails. */
export const demoFallbackStores: StoreData[] = [
  {
    id: "strom-boutique",
    name: "Strøm Boutique",
    neighborhood: "Indre By",
    address: "Kronprinsensgade 22, 1114 København K",
    etaMinutes: 28,
    rating: 4.9,
    products: [
      {
        id: "strom-silk-shirt",
        name: "Silk Shirt",
        category: "New In",
        description: "Premium silk shirt for office and dinner.",
        imageUrl: "/products/new-in.svg",
        price: 899,
        sizes: { XS: 2, S: 4, M: 3, L: 2 },
      },
      {
        id: "strom-midnight-blazer",
        name: "Midnight Blazer",
        category: "Emergency Outfits",
        description: "Tailored blazer for last-minute events.",
        imageUrl: "/products/emergency.svg",
        price: 1499,
        sizes: { XS: 1, S: 2, M: 3, L: 2 },
      },
      {
        id: "strom-oxford-loafer",
        name: "Oxford Loafer",
        category: "Shoes",
        description: "Classic loafers with all-day comfort.",
        imageUrl: "/products/shoes.svg",
        price: 1299,
        sizes: { XS: 1, S: 2, M: 2, L: 1 },
      },
      {
        id: "strom-gold-chain",
        name: "Gold Chain",
        category: "Accessories",
        description: "Minimal gold-plated statement chain.",
        imageUrl: "/products/accessories.svg",
        price: 699,
        sizes: { XS: 3, S: 3, M: 3, L: 3 },
      },
    ],
  },
  {
    id: "naked-copenhagen-edit",
    name: "Naked Copenhagen Edit",
    neighborhood: "Indre By",
    address: "Pilestræde 46, 1112 København K",
    etaMinutes: 32,
    rating: 4.8,
    products: [
      {
        id: "naked-bomber-jacket",
        name: "Oversized Bomber",
        category: "New In",
        description: "Streetwear bomber with premium finish.",
        imageUrl: "/products/new-in.svg",
        price: 1199,
        sizes: { XS: 1, S: 2, M: 2, L: 1 },
      },
      {
        id: "naked-utility-set",
        name: "Utility Set",
        category: "Emergency Outfits",
        description: "Complete matching set ready to wear.",
        imageUrl: "/products/emergency.svg",
        price: 999,
        sizes: { XS: 2, S: 3, M: 2, L: 1 },
      },
      {
        id: "naked-runner",
        name: "City Runner Sneaker",
        category: "Shoes",
        description: "Urban running sneaker in neutral tones.",
        imageUrl: "/products/shoes.svg",
        price: 1099,
        sizes: { XS: 1, S: 2, M: 2, L: 2 },
      },
      {
        id: "naked-cap",
        name: "Signature Cap",
        category: "Accessories",
        description: "Low-profile cap with subtle branding.",
        imageUrl: "/products/accessories.svg",
        price: 399,
        sizes: { XS: 4, S: 4, M: 4, L: 4 },
      },
    ],
  },
  {
    id: "birger-et-mikkelsen-house",
    name: "Birger et Mikkelsen House",
    neighborhood: "Indre By",
    address: "Amagertorv 33, 1160 København K",
    etaMinutes: 35,
    rating: 4.7,
    products: [
      {
        id: "bemk-wrap-dress",
        name: "Wrap Dress",
        category: "New In",
        description: "Elegant wrap dress in soft satin.",
        imageUrl: "/products/new-in.svg",
        price: 1599,
        sizes: { XS: 1, S: 2, M: 2, L: 1 },
      },
      {
        id: "bemk-event-trouser",
        name: "Event Trouser",
        category: "Emergency Outfits",
        description: "Tailored trouser for evening and business.",
        imageUrl: "/products/emergency.svg",
        price: 1099,
        sizes: { XS: 2, S: 2, M: 3, L: 2 },
      },
      {
        id: "bemk-heel",
        name: "Leather Heel",
        category: "Shoes",
        description: "Soft leather heel with stable fit.",
        imageUrl: "/products/shoes.svg",
        price: 1399,
        sizes: { XS: 1, S: 1, M: 2, L: 1 },
      },
      {
        id: "bemk-clutch",
        name: "Evening Clutch",
        category: "Accessories",
        description: "Compact clutch for occasion wear.",
        imageUrl: "/products/accessories.svg",
        price: 799,
        sizes: { XS: 2, S: 2, M: 2, L: 2 },
      },
    ],
  },
  {
    id: "wood-wood-city",
    name: "WOOD WOOD City",
    neighborhood: "Indre By",
    address: "Grønnegade 1, 1107 København K",
    etaMinutes: 30,
    rating: 4.8,
    products: [
      {
        id: "ww-city-hoodie",
        name: "City Hoodie",
        category: "New In",
        description: "Relaxed premium hoodie for city wear.",
        imageUrl: "/products/new-in.svg",
        price: 899,
        sizes: { XS: 3, S: 4, M: 4, L: 3 },
      },
      {
        id: "ww-date-night-fit",
        name: "Date Night Fit",
        category: "Emergency Outfits",
        description: "Complete outfit ready for tonight.",
        imageUrl: "/products/emergency.svg",
        price: 1399,
        sizes: { XS: 1, S: 2, M: 2, L: 2 },
      },
      {
        id: "ww-street-runner",
        name: "Street Runner",
        category: "Shoes",
        description: "Hybrid sneaker with lightweight sole.",
        imageUrl: "/products/shoes.svg",
        price: 1199,
        sizes: { XS: 2, S: 2, M: 3, L: 2 },
      },
      {
        id: "ww-crossbody",
        name: "Crossbody Bag",
        category: "Accessories",
        description: "Compact crossbody for essentials.",
        imageUrl: "/products/accessories.svg",
        price: 649,
        sizes: { XS: 3, S: 3, M: 3, L: 3 },
      },
    ],
  },
  {
    id: "storm-cph",
    name: "STORM Copenhagen",
    neighborhood: "Indre By",
    address: "Store Regnegade 1, 1110 København K",
    etaMinutes: 26,
    rating: 4.9,
    products: [
      {
        id: "storm-merino-knit",
        name: "Merino Knit",
        category: "New In",
        description: "Fine merino knit in modern silhouette.",
        imageUrl: "/products/new-in.svg",
        price: 999,
        sizes: { XS: 2, S: 3, M: 3, L: 2 },
      },
      {
        id: "storm-black-set",
        name: "Black Tailored Set",
        category: "Emergency Outfits",
        description: "Polished set for same-day events.",
        imageUrl: "/products/emergency.svg",
        price: 1699,
        sizes: { XS: 1, S: 2, M: 2, L: 1 },
      },
      {
        id: "storm-derby",
        name: "Leather Derby",
        category: "Shoes",
        description: "Hand-finished derby with sleek profile.",
        imageUrl: "/products/shoes.svg",
        price: 1499,
        sizes: { XS: 1, S: 2, M: 2, L: 1 },
      },
      {
        id: "storm-scarf",
        name: "Cashmere Scarf",
        category: "Accessories",
        description: "Soft cashmere scarf in neutral tones.",
        imageUrl: "/products/accessories.svg",
        price: 549,
        sizes: { XS: 5, S: 5, M: 5, L: 5 },
      },
    ],
  },
];

export const demoFallbackCouriers: CourierData[] = [
  { id: "mikkel", name: "Mikkel (Bike)", zone: "Inner City", etaMinutes: 12, status: "available" },
  { id: "sara", name: "Sara (Car)", zone: "Norrebro", etaMinutes: 18, status: "on_delivery" },
  { id: "jonas", name: "Jonas (Bike)", zone: "Vesterbro", etaMinutes: 15, status: "available" },
];
