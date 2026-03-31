import type { CategoryRoute, ModelStrategy } from '../types/pipeline.js';

const CATEGORY_ROUTES: CategoryRoute[] = [
  { category: 'sofa', strategy: 'depth_mesh', depthStrengthMultiplier: 0.25 },
  { category: 'armchair', strategy: 'depth_mesh', depthStrengthMultiplier: 0.25 },
  { category: 'table', strategy: 'depth_mesh', depthStrengthMultiplier: 0.15 },
  { category: 'shelf', strategy: 'depth_mesh', depthStrengthMultiplier: 0.15 },
  { category: 'vase', strategy: 'depth_mesh', depthStrengthMultiplier: 0.55 },
  { category: 'sculpture', strategy: 'depth_mesh', depthStrengthMultiplier: 0.5 },
  { category: 'candle', strategy: 'depth_mesh', depthStrengthMultiplier: 0.45 },
  { category: 'clock', strategy: 'depth_mesh', depthStrengthMultiplier: 0.1 },
  { category: 'lamp', strategy: 'depth_mesh', depthStrengthMultiplier: 0.2 },
  { category: 'mirror', strategy: 'depth_mesh', depthStrengthMultiplier: 0.08 },
  { category: 'cushion', strategy: 'depth_mesh', depthStrengthMultiplier: 0.2 },
  { category: 'basket', strategy: 'depth_mesh', depthStrengthMultiplier: 0.3 },
  { category: 'pot', strategy: 'depth_mesh', depthStrengthMultiplier: 0.5 },
  { category: 'tray', strategy: 'depth_mesh', depthStrengthMultiplier: 0.12 },
  { category: 'rug', strategy: 'flat_plane', depthStrengthMultiplier: 0 },
  { category: 'wall_art', strategy: 'flat_plane', depthStrengthMultiplier: 0 },
];

const DEFAULT_ROUTE: CategoryRoute = {
  category: 'unknown',
  strategy: 'depth_mesh',
  depthStrengthMultiplier: 0.2,
};

export function routeCategory(category: string): CategoryRoute {
  const normalized = category.toLowerCase().trim();
  const match = CATEGORY_ROUTES.find(
    (route) => normalized.includes(route.category) || route.category.includes(normalized),
  );

  return match ?? DEFAULT_ROUTE;
}

export function getStrategy(category: string): ModelStrategy {
  return routeCategory(category).strategy;
}
