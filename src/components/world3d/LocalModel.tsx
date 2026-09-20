import { Component, Suspense, useMemo, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, Group, Vector3 } from 'three';

export const modelUrls = {
  plane: '/assets/models/pesawat.glb',
  quran: '/assets/models/pulau-quran.glb',
  arabic: '/assets/models/pulau-arabic.glb',
  digital: '/assets/models/pulau-digital.glb',
  tower: '/assets/models/menara.glb',
} as const;

export class AssetBoundary extends Component<
  { children: ReactNode; fallback: ReactNode }, { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.warn('[Brightoria] Local asset fallback:', error); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function Model({ url, size, children, rotationY }: { url: string; size: number; children?: ReactNode; rotationY: number }) {
  // Meshopt decoder is bundled by drei; never fetch a Draco decoder from a CDN.
  const { scene } = useGLTF(url, false, true);
  const fitted = useMemo(() => {
    const clone = scene.clone(true);
    const box = new Box3().setFromObject(clone);
    const dimensions = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const wrapper = new Group();
    wrapper.add(clone);
    clone.position.sub(center);
    wrapper.scale.setScalar(size / (Math.max(dimensions.x, dimensions.y, dimensions.z) || 1));
    return wrapper;
  }, [scene, size]);
  // Geometry/materials belong to useGLTF's cache and are shared between scenes.
  return <><group rotation={[0, rotationY, 0]}><primitive object={fitted} dispose={null} /></group>{children}</>;
}

export default function LocalModel({ url, size, fallback = null, children, rotationY = 0 }: {
  url: string; size: number; fallback?: ReactNode; children?: ReactNode; rotationY?: number;
}) {
  return (
    <AssetBoundary key={url} fallback={fallback}>
      <Suspense fallback={fallback}><Model url={url} size={size} rotationY={rotationY}>{children}</Model></Suspense>
    </AssetBoundary>
  );
}
