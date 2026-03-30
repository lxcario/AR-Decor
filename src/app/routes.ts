export const routes = {
  home: "/",
  guide: "/guide",
  product: (slug: string) => `/products/${slug}`,
  arView: (slug: string) => `/products/${slug}/ar`,
};
