import type { ReactNode } from 'react';
import { AssetBoundary } from './world3d/LocalModel';

let webglAvailable: boolean | undefined;
export function canRenderWebGL(): boolean {
  if (webglAvailable !== undefined) return webglAvailable;
  try {
    const context = document.createElement('canvas').getContext('webgl2');
    webglAvailable = Boolean(context);
    context?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch { webglAvailable = false; }
  return webglAvailable;
}

/** Outside Canvas so context-creation failures are caught as well as scene errors. */
export default function CanvasBoundary({ children }: { children: ReactNode }) {
  const fallback = (
    <div role="status" style={{ padding: 24, background: '#fff8eb', color: '#263c44' }}>
      Tampilan 3D tidak tersedia. Gunakan tombol kembali atau tutup untuk memilih aktivitas lain.
    </div>
  );
  if (!canRenderWebGL()) return fallback;
  return <AssetBoundary fallback={fallback}>{children}</AssetBoundary>;
}
