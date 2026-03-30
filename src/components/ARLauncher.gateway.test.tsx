/**
 * ARLauncher gateway verification
 * Run: npx vitest run ARLauncher.gateway.test.tsx
 *
 * These six cases must all pass before Tasks 7-10 are built.
 * They test only the routing logic - not the child components themselves.
 * Each child is mocked to a stable sentinel so branch detection is unambiguous.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ARCapability } from '../types/app';

vi.mock('./WebXRSession', () => ({
  default: () => <div data-testid="branch-webxr" />,
}));
vi.mock('./QuickLookLauncher', () => ({
  default: () => <div data-testid="branch-quicklook" />,
}));
vi.mock('./SceneViewerLauncher', () => ({
  default: () => <div data-testid="branch-sceneviewer" />,
}));
vi.mock('./FallbackViewer', () => ({
  default: () => <div data-testid="branch-fallback" />,
}));

const mockCapability = vi.fn();

vi.mock('../hooks/useARCapability', () => ({
  useARCapability: () => mockCapability(),
}));

const product = {
  id: 'test-001',
  slug: 'test-chair',
  name: 'Test Chair',
  brand: 'Test Brand',
  price: 100,
  currency: 'USD',
  description: '',
  tags: [],
  assets: {
    modelGlb: '/models/test.glb',
    modelUsdz: '/models/test.usdz',
    poster: '/posters/test.webp',
    images: [],
  },
  dimensionsMeters: { width: 0.8, depth: 0.8, height: 0.9 },
  placement: {
    surface: 'floor' as const,
    defaultScale: 1,
    allowRotate: true,
    allowScale: false,
  },
};

function withCapability(level: ARCapability['level'] | null, isDetecting = false) {
  const capability: ARCapability | null = level === null ? null : {
    level,
    isSecureContext: true,
    hasCamera: true,
    webxrSessionTypes: level === 'webxr' ? ['immersive-ar'] : [],
  };
  mockCapability.mockReturnValue({ capability, isDetecting });
}

const { default: ARLauncher } = await import('./ARLauncher');

describe('ARLauncher - capability gateway', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('case 1 - renders spinner only while isDetecting, no branch visible', () => {
    withCapability(null, true);
    render(<ARLauncher product={product} />);

    expect(screen.queryByTestId('branch-webxr')).toBeNull();
    expect(screen.queryByTestId('branch-quicklook')).toBeNull();
    expect(screen.queryByTestId('branch-sceneviewer')).toBeNull();
    expect(screen.queryByTestId('branch-fallback')).toBeNull();

    expect(document.querySelector('[role="status"], [aria-label*="loading" i], [data-testid="spinner"]')).not.toBeNull();
  });

  it('case 2 - webxr capability renders WebXRSession', () => {
    withCapability('webxr');
    render(<ARLauncher product={product} />);
    expect(screen.getByTestId('branch-webxr')).toBeTruthy();
    expect(screen.queryByTestId('branch-quicklook')).toBeNull();
    expect(screen.queryByTestId('branch-sceneviewer')).toBeNull();
    expect(screen.queryByTestId('branch-fallback')).toBeNull();
  });

  it('case 3 - quicklook capability renders QuickLookLauncher', () => {
    withCapability('quicklook');
    render(<ARLauncher product={product} />);
    expect(screen.getByTestId('branch-quicklook')).toBeTruthy();
    expect(screen.queryByTestId('branch-webxr')).toBeNull();
    expect(screen.queryByTestId('branch-sceneviewer')).toBeNull();
    expect(screen.queryByTestId('branch-fallback')).toBeNull();
  });

  it('case 4 - sceneviewer capability renders SceneViewerLauncher', () => {
    withCapability('sceneviewer');
    render(<ARLauncher product={product} />);
    expect(screen.getByTestId('branch-sceneviewer')).toBeTruthy();
    expect(screen.queryByTestId('branch-webxr')).toBeNull();
    expect(screen.queryByTestId('branch-quicklook')).toBeNull();
    expect(screen.queryByTestId('branch-fallback')).toBeNull();
  });

  it('case 5 - inline3d capability renders FallbackViewer', () => {
    withCapability('inline3d');
    render(<ARLauncher product={product} />);
    expect(screen.getByTestId('branch-fallback')).toBeTruthy();
    expect(screen.queryByTestId('branch-webxr')).toBeNull();
    expect(screen.queryByTestId('branch-quicklook')).toBeNull();
    expect(screen.queryByTestId('branch-sceneviewer')).toBeNull();
  });

  it('case 6 - unknown capability renders FallbackViewer', () => {
    withCapability('unknown');
    render(<ARLauncher product={product} />);
    expect(screen.getByTestId('branch-fallback')).toBeTruthy();
    expect(screen.queryByTestId('branch-webxr')).toBeNull();
    expect(screen.queryByTestId('branch-quicklook')).toBeNull();
    expect(screen.queryByTestId('branch-sceneviewer')).toBeNull();
  });

  it('case 6b - exactly one branch is mounted at all times (no double render)', () => {
    const levels: ARCapability['level'][] = ['webxr', 'quicklook', 'sceneviewer', 'inline3d', 'unknown'];
    const testIds = ['branch-webxr', 'branch-quicklook', 'branch-sceneviewer', 'branch-fallback'];

    for (const level of levels) {
      const { unmount } = (() => {
        withCapability(level);
        return render(<ARLauncher product={product} />);
      })();

      const visible = testIds.filter((id) => screen.queryByTestId(id) !== null);
      expect(visible).toHaveLength(1);
      unmount();
    }
  });
});
