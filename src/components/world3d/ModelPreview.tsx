import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import LocalModel, { AssetBoundary } from './LocalModel';
import { canRenderWebGL } from '../CanvasBoundary';

/** Decorative, on-demand scene. Gameplay stays usable if WebGL is unavailable. */
export default function ModelPreview({ url, image, label }: {
  url: string; image: string; label: string;
}) {
  return (
    <div className="game-model-preview" role="img" aria-label={label}>
      {!canRenderWebGL() ? <img src={image} alt={label} /> : <AssetBoundary fallback={<img src={image} alt={label} />}>
        <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 0.6, 3.8], fov: 42 }}>
          <ambientLight intensity={1.8} />
          <directionalLight position={[3, 5, 4]} intensity={2.5} />
          <LocalModel url={url} size={2} fallback={
            <mesh><icosahedronGeometry args={[0.7, 0]} /><meshStandardMaterial color="#d4a747" /></mesh>
          } />
          <OrbitControls enablePan={false} enableZoom={false} />
        </Canvas>
      </AssetBoundary>}
    </div>
  );
}
