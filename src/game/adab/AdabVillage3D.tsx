import CanvasBoundary from '../../components/CanvasBoundary';
import BlockyCharacter, { type CharacterMotion } from '../../components/world3d/BlockyCharacter';
import ProceduralEnv from '../../render/ProceduralEnv';
import { getQuality } from '../../render/quality';
import { Html, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Camera, HandHeart, Map, Move, Settings, Sun } from 'lucide-react';
import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';

export type SimQuality = 'best' | 'good' | 'needsWork';

export interface SimChoice {
  text: string;
  quality: SimQuality;
  feedback: string;
}

export interface SimMission {
  id: string;
  locationId: string;
  title: string;
  scenario: string;
  hadith?: {
    title: string;
    childSummary: string;
    practicePrompt: string;
  };
  choices: SimChoice[];
}

export interface VillageLocation {
  id: string;
  name: string;
  subtitle: string;
  position: [number, number];
  npcModel: string;
  placeModel: string;
  npcScale: number;
  placeScale: number;
  labelOffset?: [number, number, number];
  accent: string;
}

interface InputState {
  x: number;
  z: number;
}

interface CameraControlState {
  locked: boolean;
  followYaw: number;
  yawOffset: number;
  pitchOffset: number;
  distanceOffset: number;
}

const ARENA_RADIUS = 15.2;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function applyCameraLook(control: CameraControlState, dx: number, dy: number, locked: boolean) {
  const sensitivity = locked ? 0.0032 : 0.0042;
  if (locked) control.followYaw -= dx * sensitivity;
  else control.yawOffset = clamp(control.yawOffset - dx * sensitivity, -Math.PI * 1.1, Math.PI * 1.1);
  control.pitchOffset = clamp(control.pitchOffset - dy * 0.003, -0.72, 0.45);
}

export const adabLocations3d: VillageLocation[] = [
  {
    id: 'home',
    name: 'Rumah',
    subtitle: 'Bantu orang tua',
    position: [10.4, -1.3],
    npcModel: '/assets/adab-village/mother-helper.glb',
    placeModel: '/assets/adab-village/bazaar-cottage.glb',
    npcScale: 1.45,
    placeScale: 3.9,
    labelOffset: [0.25, 3.25, 0.15],
    accent: '#c86845',
  },
  {
    id: 'school',
    name: 'Majelis Ilmu',
    subtitle: 'Adab belajar',
    position: [2.0, 3.45],
    npcModel: '/assets/adab-village/wise-imam.glb',
    placeModel: '/assets/adab-village/knowledge-statue.glb',
    npcScale: 1.38,
    placeScale: 3.05,
    labelOffset: [-0.15, 3.05, 0],
    accent: '#3d73bc',
  },
  {
    id: 'mosque',
    name: 'Masjid',
    subtitle: 'Tenang dan tertib',
    position: [-4.15, 5.05],
    npcModel: '/assets/adab-village/hooded-wanderer.glb',
    placeModel: '/assets/adab-village/oasis-mosque.glb',
    npcScale: 1.45,
    placeScale: 4.25,
    labelOffset: [0.2, 3.8, 0.1],
    accent: '#17856f',
  },
  {
    id: 'park',
    name: 'Taman Sahabat',
    subtitle: 'Berbagi dan meminta maaf',
    position: [7.15, 2.95],
    npcModel: '/assets/adab-village/hijab-girl.glb',
    placeModel: '/assets/adab-village/adab-mosque-sign.glb',
    npcScale: 1.35,
    placeScale: 2.9,
    labelOffset: [0.05, 2.95, 0.2],
    accent: '#8b5ab5',
  },
  {
    id: 'shop',
    name: 'Warung Amanah',
    subtitle: 'Jujur saat membeli',
    position: [-9.55, -1.85],
    npcModel: '/assets/adab-village/boy-friend.glb',
    placeModel: '/assets/adab-village/market-stall.glb',
    npcScale: 1.45,
    placeScale: 3.8,
    labelOffset: [-0.2, 3.15, 0.1],
    accent: '#da843c',
  },
];

function groundHeight(x: number, z: number): number {
  const d = Math.hypot(x, z);
  return Math.sin(x * 0.28) * 0.16 + Math.cos(z * 0.24) * 0.12 - Math.exp(-(d * d) / 45) * 0.18;
}

function FittedModel({
  url,
  size,
  rotationY = 0,
}: {
  url: string;
  size: number;
  rotationY?: number;
}) {
  const { scene } = useGLTF(url, false, true);
  const fitted = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if ('castShadow' in obj) obj.castShadow = true;
      if ('receiveShadow' in obj) obj.receiveShadow = true;
    });
    const box = new THREE.Box3().setFromObject(clone);
    const dimensions = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const wrapper = new THREE.Group();
    wrapper.add(clone);
    clone.position.set(-center.x, -box.min.y, -center.z);
    wrapper.scale.setScalar(size / (Math.max(dimensions.x, dimensions.y, dimensions.z) || 1));
    return wrapper;
  }, [scene, size]);

  return (
    <group rotation={[0, rotationY, 0]}>
      <primitive object={fitted} dispose={null} />
    </group>
  );
}

function Terrain() {
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(46, 40, 96, 88);
    const pos = plane.attributes.position;
    const colors: number[] = [];
    const color = new THREE.Color();
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const h = groundHeight(x, z);
      pos.setZ(i, h);
      const centerPlaza = Math.hypot(x, z - 0.15) < 2.9;
      const mainPath = Math.abs(x * 0.08 + z + 5.4) < 1.28 && z < 0.8;
      const crossPath = Math.abs(z - 1.35 - Math.sin(x * 0.22) * 0.32) < 0.96 && x > -11.4 && x < 11.7;
      const mosquePath = Math.abs(x + 3.2 + Math.sin(z * 0.55) * 0.24) < 0.82 && z > 1.2 && z < 6.2;
      const homePath = Math.abs(x - 8.8 - Math.sin(z * 0.5) * 0.2) < 0.76 && z > -2.4 && z < 2.6;
      const outer = Math.hypot(x * 0.78, z) > 17.1;
      if (centerPlaza) color.set(i % 2 ? '#e9cc95' : '#dcb879');
      else if (mainPath || crossPath || mosquePath || homePath) color.set(i % 3 === 0 ? '#e4c38a' : '#d8b175');
      else if (outer) color.set('#78bd68');
      else color.set(h > 0.06 ? '#9adf78' : '#83cf6f');
      colors.push(color.r, color.g, color.b);
    }
    plane.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    plane.computeVertexNormals();
    return plane;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.9} metalness={0.02} />
    </mesh>
  );
}

function MissionMarker({
  location,
  done,
  near,
}: {
  location: VillageLocation;
  done: boolean;
  near: boolean;
}) {
  const [x, z] = location.position;
  const y = groundHeight(x, z);
  const ring = useRef<THREE.Mesh>(null);
  const labelOffset = location.labelOffset ?? [0, 3.1, 0];

  useFrame((state) => {
    if (!ring.current) return;
    ring.current.rotation.z += 0.018;
    const pulse = (near ? 1.2 : 1) + Math.sin(state.clock.elapsedTime * 3) * 0.04;
    ring.current.scale.setScalar(pulse);
  });

  return (
    <group position={[x, y, z]}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[1.45, 1.65, 40]} />
        <meshBasicMaterial color={done ? '#f3c861' : location.accent} transparent opacity={near ? 0.8 : 0.45} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[1.55, 1.82, 0.1, 28]} />
        <meshStandardMaterial color={done ? '#fff3cd' : '#fff7df'} roughness={0.8} />
      </mesh>
      <group position={[0, 0.02, -1.15]} rotation={[0, Math.PI, 0]}>
        <Suspense fallback={null}>
          <FittedModel url={location.placeModel} size={location.placeScale} />
        </Suspense>
      </group>
      <group position={[1.02, 0.02, 0.9]} rotation={[0, -0.35, 0]}>
        <Suspense fallback={null}>
          <FittedModel url={location.npcModel} size={location.npcScale} />
        </Suspense>
      </group>
      <Html center position={labelOffset} zIndexRange={[30, 0]}>
        <div className={'adab3d-label' + (near ? ' near' : '')}>
          <b>{done ? 'Selesai' : location.name}</b>
          <span>{near ? 'Tekan Bantu' : location.subtitle}</span>
        </div>
      </Html>
    </group>
  );
}

function VillageDecor() {
  const treePositions: [number, number, number][] = [
    [-14.0, -5.2, 1.45], [-12.8, 4.9, 1.18], [-8.0, 7.2, 1.1],
    [-1.0, 7.8, 1.0], [5.3, 7.1, 1.05], [11.4, 5.25, 1.28],
    [13.6, -2.75, 1.22], [-5.7, -8.4, 1.0], [5.8, -8.1, 1.08],
  ];
  const rocks: [number, number, number][] = [
    [-7.0, -4.0, .42], [-6.1, -3.35, .26], [-11.1, .85, .34],
    [3.5, -2.55, .3], [7.8, .35, .36], [8.9, 1.45, .24],
    [-2.6, 1.85, .22], [1.55, -4.55, .26], [11.8, -2.0, .42],
    [-12.4, -2.8, .36], [5.2, 4.9, .3],
  ];
  const flowerClusters: [number, number, string][] = [
    [-7.2, -2.55, '#fff7d5'], [-6.5, -1.9, '#f6b9c8'], [3.0, .65, '#ffffff'],
    [5.35, 1.0, '#ffe4ed'], [8.65, -2.65, '#fff7d5'], [-3.35, 2.75, '#f6b9c8'],
    [.05, -1.8, '#ffffff'], [-10.25, -3.45, '#fff7d5'], [10.2, .7, '#ffffff'],
    [-.8, 2.45, '#ffe4ed'],
  ];
  const lamps: [number, number][] = [
    [-4.7, .7], [4.45, .45], [-2.35, 3.35], [7.9, 2.1], [-8.9, -2.95], [9.55, -1.15],
  ];
  const fenceRuns: [number, number, number, number][] = [
    [-13.2, -4.35, Math.PI / 2, 5], [-9.3, -5.7, 0, 4], [9.0, -5.35, 0, 4],
    [12.7, -2.9, Math.PI / 2, 4], [6.3, 4.9, 0, 4], [-6.3, 6.05, 0, 4],
  ];
  return (
    <>
      {treePositions.map(([x, z, s], i) => (
        <group key={i} position={[x, groundHeight(x, z), z]} scale={s}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.3, 1.05, 7]} />
            <meshStandardMaterial color="#7b4c24" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.35, 0]} castShadow>
            <dodecahedronGeometry args={[0.92, 0]} />
            <meshStandardMaterial color={i % 2 ? '#55a957' : '#67bf54'} roughness={0.85} />
          </mesh>
          <mesh position={[0.42, 1.02, -0.16]} castShadow>
            <dodecahedronGeometry args={[0.48, 0]} />
            <meshStandardMaterial color={i % 2 ? '#7ccf62' : '#4f9a50'} roughness={0.85} />
          </mesh>
        </group>
      ))}
      <group position={[0, groundHeight(0, 0), 0]}>
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <cylinderGeometry args={[2.55, 2.75, 0.12, 40]} />
          <meshStandardMaterial color="#e7c58d" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.17, 0]} receiveShadow>
          <ringGeometry args={[1.88, 2.03, 40]} />
          <meshStandardMaterial color="#b58b5e" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.75, -0.18]} castShadow>
          <boxGeometry args={[2.05, 0.95, 0.2]} />
          <meshStandardMaterial color="#9b5b2d" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.32, 0.48]} castShadow>
          <boxGeometry args={[0.18, 0.96, 0.18]} />
          <meshStandardMaterial color="#7b4c24" roughness={0.8} />
        </mesh>
        <mesh position={[-1.7, 0.22, .98]} rotation={[0, .2, 0]} castShadow>
          <boxGeometry args={[1.05, .22, .26]} />
          <meshStandardMaterial color="#ab6f38" roughness={0.85} />
        </mesh>
        <mesh position={[1.7, 0.22, .98]} rotation={[0, -.2, 0]} castShadow>
          <boxGeometry args={[1.05, .22, .26]} />
          <meshStandardMaterial color="#ab6f38" roughness={0.85} />
        </mesh>
      </group>
      {rocks.map(([x, z, s], i) => (
        <mesh key={`rock-${i}`} position={[x, groundHeight(x, z) + s * 0.14, z]} scale={s} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 2 ? '#a7aaa0' : '#8f968c'} roughness={0.92} />
        </mesh>
      ))}
      {flowerClusters.map(([x, z, color], i) => (
        <group key={`flowers-${i}`} position={[x, groundHeight(x, z) + 0.07, z]}>
          <mesh castShadow>
            <dodecahedronGeometry args={[0.38, 0]} />
            <meshStandardMaterial color="#4fa64e" roughness={0.86} />
          </mesh>
          {[0, 1, 2, 3].map((p) => {
            const a = p * Math.PI * 0.5 + i * 0.3;
            return (
              <mesh key={p} position={[Math.cos(a) * .28, .12, Math.sin(a) * .22]} scale={[.08, .08, .08]} castShadow>
                <sphereGeometry args={[1, 8, 6]} />
                <meshStandardMaterial color={color} roughness={0.75} />
              </mesh>
            );
          })}
        </group>
      ))}
      {lamps.map(([x, z], i) => (
        <group key={`lamp-${i}`} position={[x, groundHeight(x, z), z]}>
          <mesh position={[0, .55, 0]} castShadow>
            <cylinderGeometry args={[.055, .075, 1.1, 8]} />
            <meshStandardMaterial color="#654023" roughness={0.72} />
          </mesh>
          <mesh position={[0, 1.2, 0]} castShadow>
            <boxGeometry args={[.24, .32, .24]} />
            <meshStandardMaterial color="#ffd98a" emissive="#ffb13f" emissiveIntensity={0.55} roughness={0.5} />
          </mesh>
          <pointLight position={[0, 1.18, 0]} color="#ffd38a" intensity={0.6} distance={3.1} />
        </group>
      ))}
      {fenceRuns.map(([x, z, rot, count], i) => (
        <group key={`fence-${i}`} position={[x, groundHeight(x, z) + .22, z]} rotation={[0, rot, 0]}>
          {Array.from({ length: count }).map((_, n) => (
            <group key={n} position={[(n - (count - 1) / 2) * .72, 0, 0]}>
              <mesh position={[0, .22, 0]} castShadow>
                <boxGeometry args={[.12, .55, .12]} />
                <meshStandardMaterial color="#8a572f" roughness={0.85} />
              </mesh>
              {n < count - 1 && (
                <mesh position={[.36, .33, 0]} castShadow>
                  <boxGeometry args={[.62, .09, .1]} />
                  <meshStandardMaterial color="#ad7440" roughness={0.85} />
                </mesh>
              )}
            </group>
          ))}
        </group>
      ))}
    </>
  );
}

function Player({
  input,
  cameraControl,
  frozen,
  onMove,
}: {
  input: RefObject<InputState>;
  cameraControl: RefObject<CameraControlState>;
  frozen: boolean;
  onMove: (position: [number, number]) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector2());
  const position = useRef(new THREE.Vector2(0, -8.55));
  const facing = useRef(0);
  const camera = useThree((s) => s.camera);
  const motion = useRef<CharacterMotion>({ speed: 0, airborne: false });

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.05);
    const rawWish = new THREE.Vector2(frozen ? 0 : input.current.x, frozen ? 0 : input.current.z);
    if (rawWish.length() > 1) rawWish.normalize();
    const control = cameraControl.current;
    const baseYaw = control.locked ? control.followYaw : 0;
    const sin = Math.sin(baseYaw);
    const cos = Math.cos(baseYaw);
    const wish = control.locked
      ? new THREE.Vector2(rawWish.x * cos - rawWish.y * sin, rawWish.x * -sin - rawWish.y * cos)
      : rawWish.clone();
    if (wish.length() > 1) wish.normalize();
    velocity.current.lerp(wish.multiplyScalar(4.6), Math.min(1, dt * 12));
    position.current.addScaledVector(velocity.current, dt);
    if (position.current.length() > ARENA_RADIUS - 1.25) position.current.setLength(ARENA_RADIUS - 1.25);

    const x = position.current.x;
    const z = position.current.y;
    const y = groundHeight(x, z) + 0.03;
    if (group.current) {
      group.current.position.set(x, y, z);
      if (control.locked) {
        facing.current = control.followYaw;
      } else if (velocity.current.length() > 0.15) {
        facing.current = Math.atan2(velocity.current.x, velocity.current.y);
      }
      group.current.rotation.y = facing.current;
    }
    motion.current.speed = Math.min(1, velocity.current.length() / 4.6);
    onMove([x, z]);

    const cameraYaw = control.locked ? control.followYaw : facing.current + control.yawOffset;
    const dist = 10.4 + control.distanceOffset;
    const height = y + 3.95 + control.pitchOffset * 3.35 + control.distanceOffset * 0.1;
    camera.position.lerp(
      new THREE.Vector3(x - Math.sin(cameraYaw) * dist, Math.max(y + 2.4, height), z - Math.cos(cameraYaw) * dist),
      Math.min(1, dt * 3),
    );
    camera.lookAt(x, y + 1.18 + control.pitchOffset * 0.25, z + 1.85);
  });

  return (
    <group ref={group}>
      <BlockyCharacter motionRef={motion} accessory="backpack" />
      <pointLight color="#ffd78c" intensity={1.1} distance={4} position={[0, 1.2, 0]} />
    </group>
  );
}

function Scene({
  input,
  cameraControl,
  frozen,
  doneIds,
  warmLight,
  onNear,
}: {
  input: RefObject<InputState>;
  cameraControl: RefObject<CameraControlState>;
  frozen: boolean;
  doneIds: Set<string>;
  warmLight: boolean;
  onNear: (locationId: string | null) => void;
}) {
  const player = useRef<[number, number]>([0, -8.55]);
  const nearRef = useRef<string | null>(null);
  const frame = useRef(0);
  const quality = getQuality();

  useFrame(() => {
    frame.current += 1;
    if (frame.current % 8 !== 0) return;
    let near: string | null = null;
    for (const location of adabLocations3d) {
      const dx = player.current[0] - location.position[0];
      const dz = player.current[1] - location.position[1];
      if (dx * dx + dz * dz < 5.2) {
        near = location.id;
        break;
      }
    }
    if (near !== nearRef.current) {
      nearRef.current = near;
      onNear(near);
    }
  });

  return (
    <>
      <ProceduralEnv intensity={warmLight ? 0.42 : 0.55} />
      <fog attach="fog" args={['#dff4ff', 19, 42]} />
      <ambientLight intensity={warmLight ? 0.62 : 0.78} color={warmLight ? '#fff1d6' : '#f7fbff'} />
      <hemisphereLight intensity={warmLight ? 0.72 : 0.9} color="#dff7ff" groundColor="#7fc16d" />
      <directionalLight
        castShadow
        position={[-6, 10, 5]}
        intensity={warmLight ? 2.15 : 1.6}
        color={warmLight ? '#ffe0a3' : '#ffffff'}
        shadow-mapSize-width={1536}
        shadow-mapSize-height={1536}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      <Terrain />
      <VillageDecor />
      <Player input={input} cameraControl={cameraControl} frozen={frozen} onMove={(pos) => (player.current = pos)} />
      {adabLocations3d.map((location) => (
        <MissionMarker
          key={location.id}
          location={location}
          done={doneIds.has(location.id)}
          near={nearRef.current === location.id}
        />
      ))}
      <OrbitControls enabled={false} />
      {!quality.postfx && <ambientLight intensity={0.18} />}
    </>
  );
}

export default function AdabVillage3D({
  missions,
  doneMissionIds,
  activeMission,
  feedback,
  onOpenMission,
  onChoose,
  onResetFeedback,
  onBack,
}: {
  missions: SimMission[];
  doneMissionIds: string[];
  activeMission: SimMission | null;
  feedback: { quality: SimQuality; text: string } | null;
  onOpenMission: (locationId: string) => void;
  onChoose: (choice: SimChoice) => void;
  onResetFeedback: () => void;
  onBack: () => void;
}) {
  const input = useRef<InputState>({ x: 0, z: 0 });
  const keys = useRef<Record<string, boolean>>({});
  const cameraControl = useRef<CameraControlState>({ locked: false, followYaw: 0, yawOffset: 0, pitchOffset: 0, distanceOffset: 0 });
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [nearLocationId, setNearLocationId] = useState<string | null>(null);
  const [cameraLocked, setCameraLocked] = useState(false);
  const [warmLight, setWarmLight] = useState(true);
  const doneLocationIds = useMemo(
    () => new Set(doneMissionIds.map((id) => missions.find((mission) => mission.id === id)?.locationId).filter(Boolean) as string[]),
    [doneMissionIds, missions],
  );
  const nearLocation = adabLocations3d.find((loc) => loc.id === nearLocationId) ?? null;

  useEffect(() => {
    function updateMovement() {
      const k = keys.current;
      input.current.x = (k.arrowright || k.d ? 1 : 0) - (k.arrowleft || k.a ? 1 : 0);
      input.current.z = (k.arrowdown || k.s ? 1 : 0) - (k.arrowup || k.w ? 1 : 0);
    }
    function onKey(e: KeyboardEvent) {
      const down = e.type === 'keydown';
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright', ' ', 'shift'].includes(key)) {
        e.preventDefault();
      }
      if (down && e.code === 'ShiftLeft') {
        setCameraLocked((value) => !value);
        return;
      }
      keys.current[key] = down;
      updateMovement();
      if (down && (e.code === 'Enter' || e.code === 'Space') && nearLocationId) onOpenMission(nearLocationId);
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, [nearLocationId, onOpenMission]);

  useEffect(() => {
    if (!activeMission) return;
    keys.current = {};
    input.current.x = 0;
    input.current.z = 0;
    if (knobRef.current) knobRef.current.style.transform = 'translate(0, 0)';
  }, [activeMission]);

  useEffect(() => {
    cameraControl.current.locked = cameraLocked;
    if (cameraLocked) {
      cameraControl.current.followYaw += cameraControl.current.yawOffset;
      cameraControl.current.yawOffset = 0;
    }
  }, [cameraLocked]);

  useEffect(() => {
    const stick = stickRef.current;
    const knob = knobRef.current;
    if (!stick || !knob) return;
    let active = false;
    let originX = 0;
    let originY = 0;
    const radius = 46;
    function setKnob(dx: number, dy: number) {
      knob!.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    function onDown(e: PointerEvent) {
      active = true;
      const rect = stick!.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
      stick!.setPointerCapture(e.pointerId);
      onMove(e);
    }
    function onMove(e: PointerEvent) {
      if (!active) return;
      let dx = e.clientX - originX;
      let dy = e.clientY - originY;
      const len = Math.hypot(dx, dy);
      if (len > radius) {
        dx = (dx / len) * radius;
        dy = (dy / len) * radius;
      }
      setKnob(dx, dy);
      input.current.x = dx / radius;
      input.current.z = dy / radius;
      e.preventDefault();
    }
    function onUp(e: PointerEvent) {
      active = false;
      setKnob(0, 0);
      input.current.x = 0;
      input.current.z = 0;
      if (stick!.hasPointerCapture(e.pointerId)) stick!.releasePointerCapture(e.pointerId);
    }
    stick.addEventListener('pointerdown', onDown);
    stick.addEventListener('pointermove', onMove);
    stick.addEventListener('pointerup', onUp);
    stick.addEventListener('pointercancel', onUp);
    return () => {
      stick.removeEventListener('pointerdown', onDown);
      stick.removeEventListener('pointermove', onMove);
      stick.removeEventListener('pointerup', onUp);
      stick.removeEventListener('pointercancel', onUp);
    };
  }, []);

  useEffect(() => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return;
    const wrapEl = wrap;
    let active = false;
    let pointerId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    function onContextMenu(e: MouseEvent) {
      e.preventDefault();
    }
    function onPointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest('button,.adab3d-card,.adab3d-stick')) return;
      if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1 && e.button !== 2) return;
      active = true;
      pointerId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      wrapEl.setPointerCapture(e.pointerId);
      e.preventDefault();
    }
    function onPointerMove(e: PointerEvent) {
      if (!active || e.pointerId !== pointerId) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      applyCameraLook(cameraControl.current, dx, dy, cameraControl.current.locked);
      e.preventDefault();
    }
    function onWheel(e: WheelEvent) {
      cameraControl.current.distanceOffset = clamp(cameraControl.current.distanceOffset + e.deltaY * 0.006, -2.4, 4.6);
      e.preventDefault();
    }
    function onPointerUp(e: PointerEvent) {
      if (e.pointerId !== pointerId) return;
      active = false;
      pointerId = null;
      if (wrapEl.hasPointerCapture(e.pointerId)) wrapEl.releasePointerCapture(e.pointerId);
      e.preventDefault();
    }
    wrapEl.addEventListener('contextmenu', onContextMenu);
    wrapEl.addEventListener('pointerdown', onPointerDown);
    wrapEl.addEventListener('pointermove', onPointerMove);
    wrapEl.addEventListener('pointerup', onPointerUp);
    wrapEl.addEventListener('pointercancel', onPointerUp);
    wrapEl.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      wrapEl.removeEventListener('contextmenu', onContextMenu);
      wrapEl.removeEventListener('pointerdown', onPointerDown);
      wrapEl.removeEventListener('pointermove', onPointerMove);
      wrapEl.removeEventListener('pointerup', onPointerUp);
      wrapEl.removeEventListener('pointercancel', onPointerUp);
      wrapEl.removeEventListener('wheel', onWheel);
    };
  }, []);

  return (
    <div className="adab3d-shell">
      <div className="adab3d-canvas" ref={canvasWrapRef}>
        <CanvasBoundary>
          <Canvas
            shadows
            dpr={[1, 1.5]}
            camera={{ position: [0, 4.2, 9.8], fov: 39, near: 0.1, far: 90 }}
            gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
          >
            <Suspense fallback={null}>
              <Scene
                input={input}
                cameraControl={cameraControl}
                frozen={!!activeMission}
                doneIds={doneLocationIds}
                warmLight={warmLight}
                onNear={setNearLocationId}
              />
            </Suspense>
          </Canvas>
        </CanvasBoundary>
      </div>

      <div className="adab3d-title">
        <b>KAMPUNG ADAB</b>
        <span>Adab Daily Life Simulator</span>
      </div>

      <div className="adab3d-progress">
        <div className="adab3d-progress-row">
          <span className="adab3d-progress-icon"><HandHeart size={22} /></span>
          <span>Misi Adab</span>
        </div>
        <div className="adab3d-progress-track">
          <span className="adab3d-progress-fill" style={{ width: `${(doneMissionIds.length / Math.max(1, missions.length)) * 100}%` }} />
        </div>
        <small>{doneMissionIds.length}/{missions.length} misi adab</small>
      </div>

      <div className="adab3d-toolbar">
        <button className="adab3d-tool" onClick={onBack}>
          <Map size={18} /> Peta
        </button>
        <button className={'adab3d-tool icon' + (cameraLocked ? ' locked' : '')} aria-label="Kamera" onClick={() => setCameraLocked((value) => !value)}>
          <Camera size={18} />
        </button>
        <button
          className="adab3d-tool icon"
          aria-label="Pengaturan"
          onClick={() => {
            cameraControl.current.yawOffset = 0;
            cameraControl.current.pitchOffset = 0;
            cameraControl.current.distanceOffset = 0;
          }}
        >
          <Settings size={18} />
        </button>
        <button className={'adab3d-tool icon' + (warmLight ? ' on' : '')} aria-label="Pencahayaan" onClick={() => setWarmLight((value) => !value)}>
          <Sun size={18} />
        </button>
      </div>

      <div className="adab3d-stick" ref={stickRef} aria-label="Kontrol gerak">
        <div className="adab3d-stick-knob" ref={knobRef}>
          <Move size={18} />
        </div>
      </div>

      {nearLocation && !activeMission && (
        <div className="adab3d-near">
          <span>
            Kamu dekat <b>{nearLocation.name}</b>
          </span>
          <button onClick={() => onOpenMission(nearLocation.id)}>
            <HandHeart size={16} /> Bantu
          </button>
        </div>
      )}

      {activeMission && (
        <div className="adab3d-card">
          <span className="adab-sim-badge">
            <HandHeart size={13} /> Misi Kampung Adab
          </span>
          <h3>{activeMission.title}</h3>
          <p>{activeMission.scenario}</p>
          {activeMission.hadith && (
            <div className="adab-sim-hadith">
              <b>Hadits Hikmah: {activeMission.hadith.title}</b>
              <span>{activeMission.hadith.childSummary}</span>
              <small>{activeMission.hadith.practicePrompt}</small>
            </div>
          )}
          <div className="adab-sim-choices">
            {activeMission.choices.map((choice) => (
              <button key={choice.text} className="adab-sim-choice" onClick={() => onChoose(choice)}>
                {choice.text}
              </button>
            ))}
          </div>
          {feedback && (
            <div className="adab-sim-feedback">
              <b>
                {feedback.quality === 'best'
                  ? 'Pilihan adab terbaik!'
                  : feedback.quality === 'good'
                    ? 'Pilihan baik.'
                    : 'Yuk coba lebih baik lagi.'}
              </b>
              <br />
              {feedback.text}
            </div>
          )}
          <div className="adab-sim-footer">
            <button className="adab-ghost-btn" onClick={onResetFeedback}>
              Coba ulang
            </button>
            <button className="adab-primary-btn" onClick={onBack}>
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

adabLocations3d.forEach((location) => {
  useGLTF.preload(location.npcModel);
  useGLTF.preload(location.placeModel);
});
