import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Sky } from '@react-three/drei';
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing';
import * as THREE from 'three';
import { create } from 'zustand';

/* =================== TUNING CONSTANTS =================== */
// ---- Collision tuning ----
const PLAYER_RADIUS = 0.28;    // capsule radius
const SUBSTEP_MAX   = 0.18;    // max move per substep (prevents tunneling)
const PUSH_OUT_EPS  = 0.002;   // tiny nudge to escape precision overlaps

/* =================== STORE =================== */
const useGameStore = create((set, get) => ({
  // Money model (₹k = thousands to keep numbers small)
  wallet: 20,
  savings: 0,
  debt: 0,
  risk: 0,
  smartRisk: 0,
  recklessRisk: 0,

  // Game state
  score: 0,
  currentDecision: null,
  playerPosition: [1.5, 0.3, 1.5],
  completedDecisions: new Set(),
  decisionCooldownUntil: 0,

  gameEnded: false,
  gameWon: false,

  flashlightOn: true,
  minimapSize: 'large',
  visitedCells: new Set(['1,1']),

  // Apply a choice
  makeDecision: (id, choice) => {
    const state = get();
    const decisions = getDecisions();
    const decision = decisions.find(d => d.id === id);
    if (!decision) return;

    const opt = decision.options[choice];

    const wallet       = state.wallet + (opt.wallet || 0);
    const savings      = state.savings + (opt.savings || 0);
    const debt         = state.debt + (opt.debt || 0);
    const risk         = state.risk + (opt.risk || 0);
    const smartRisk    = state.smartRisk + (opt.smartRisk || 0);
    const recklessRisk = state.recklessRisk + (opt.recklessRisk || 0);

    // Attainable scoring
    const savingsScore = Math.sqrt(Math.max(0, savings)) * 12;
    const walletScore  = Math.sqrt(Math.max(0, wallet))  * 8;
    const debtPenalty  = Math.sqrt(Math.max(0, debt))    * 10;
    const riskBonus    = smartRisk * 1.4 - recklessRisk * 1.2 - risk * 0.3;
    const score        = savingsScore + walletScore - debtPenalty + riskBonus;

    const completed = new Set([...state.completedDecisions, id]);

    set({
      wallet, savings, debt, risk, smartRisk, recklessRisk,
      score,
      currentDecision: null,
      completedDecisions: completed,
      decisionCooldownUntil: performance.now() + 800,
    });
  },

  // Reaching exit evaluates the outcome
  finishGame: () => {
    const s = get();
    const win =
      (s.score >= 40 && s.debt <= 20) ||
      (s.savings >= 15 && s.wallet >= 10 && s.recklessRisk <= 8);

    set({ gameEnded: true, gameWon: win });
  },

  setCurrentDecision: (id) => set({ currentDecision: id }),
  clearCurrentDecision: () => set({ currentDecision: null }),

  setPlayerPosition: (pos) => {
    const cellKey = `${Math.floor(pos[0])},${Math.floor(pos[2])}`;
    set(state => ({
      playerPosition: pos,
      visitedCells: new Set([...state.visitedCells, cellKey])
    }));
  },

  toggleFlashlight: () => set(state => ({ flashlightOn: !state.flashlightOn })),
  toggleMinimapSize: () => set(state => ({
    minimapSize: state.minimapSize === 'small' ? 'large' : 'small'
  })),
}));

/* =================== MAZE =================== */
const mazeLayout = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
  [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
  [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,0,1,1,1,0,1,1,1,0,1,1,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,1,1,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
  [1,0,1,0,1,1,1,1,1,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

/* =================== DECISIONS (10) =================== */
const getDecisions = () => [
  { // z=1
    id: 'salary1',
    position: [3.5, 0.5, 1.5],
    question: '🎉 First salary!',
    options: [
      { text: 'Save ₹8k + small treat', savings: 8, wallet: -1, smartRisk: 1, effect: 'Savings +8, Wallet -1' },
      { text: 'Weekend shopping spree', wallet: -6, debt: 4, recklessRisk: 2, effect: 'Wallet -6, Debt +4' },
    ],
  },
  {
    id: 'budget1',
    position: [6.5, 0.5, 1.5],
    question: '📋 Set a monthly budget?',
    options: [
      { text: 'Use 50-30-20 rule', savings: 4, smartRisk: 1, effect: 'Savings +4' },
      { text: 'No plan, just vibes', debt: 2, recklessRisk: 2, effect: 'Debt +2' },
    ],
  },
  {
    id: 'insurance1',
    position: [9.5, 0.5, 1.5],
    question: '🩺 Buy health insurance?',
    options: [
      { text: 'Yes (annual premium)', wallet: -3, smartRisk: 2, effect: 'Wallet -3, Smart +2' },
      { text: 'Skip it', recklessRisk: 3, effect: 'Reckless +3' },
    ],
  },

  // z=3
  {
    id: 'invest1',
    position: [5.5, 0.5, 3.5],
    question: '📈 Start SIP in index fund?',
    options: [
      { text: 'Start ₹2k/month', savings: 6, smartRisk: 3, wallet: -2, effect: 'Savings +6 (future), Wallet -2' },
      { text: 'Hype crypto buy', recklessRisk: 4, risk: 2, wallet: -3, effect: 'Reckless +4, Wallet -3' },
    ],
  },
  {
    id: 'skill1',
    position: [11.5, 0.5, 3.5],
    question: '🎓 Online course to upskill',
    options: [
      { text: 'Enroll (₹2k)', wallet: -2, savings: 2, smartRisk: 1, effect: 'Wallet -2, Savings +2 (career)' },
      { text: 'Skip for now', effect: 'No change' },
    ],
  },

  // z=5 middle hub
  {
    id: 'loan1',
    position: [5.5, 0.5, 5.5],
    question: '📱 EMI temptation for a gadget',
    options: [
      { text: 'Wait & save', savings: 3, effect: 'Savings +3' },
      { text: 'Buy on EMI', debt: 8, recklessRisk: 3, effect: 'Debt +8' },
    ],
  },
  {
    id: 'sidegig1',
    position: [9.5, 0.5, 5.5],
    question: '🧰 Weekend side-gig',
    options: [
      { text: 'Take it', wallet: 6, smartRisk: 1, effect: 'Wallet +6' },
      { text: 'Skip this month', effect: 'No change' },
    ],
  },

  // z=7
  {
    id: 'rent1',
    position: [10.5, 0.5, 7.5],
    question: '🏠 Rent increase',
    options: [
      { text: 'Negotiate -₹1k', wallet: 1, smartRisk: 1, effect: 'Wallet +1' },
      { text: 'Accept increase', wallet: -1, effect: 'Wallet -1' },
    ],
  },
  {
    id: 'medical1',
    position: [3.5, 0.5, 7.5],
    question: '🏥 Medical expense',
    options: [
      { text: 'Use emergency fund', savings: -3, effect: 'Savings -3' },
      { text: 'Swipe credit card', debt: 6, effect: 'Debt +6' },
    ],
  },

  // z=11 near exit
  {
    id: 'vacation1',
    position: [5.5, 0.5, 11.5],
    question: '✈️ Vacation plan?',
    options: [
      { text: 'Budget trip', wallet: -2, effect: 'Wallet -2' },
      { text: 'Luxury trip on EMI', debt: 10, recklessRisk: 3, effect: 'Debt +10' },
    ],
  },
];

/* =================== TEXTURES =================== */
const createBrickTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#8b7355'; ctx.fillRect(0, 0, 512, 512);
  const bw = 128, bh = 64;
  for (let y = 0; y < 512; y += bh) {
    const off = (y / bh) % 2 === 0 ? 0 : bw / 2;
    for (let x = -bw; x < 512 + bw; x += bw) {
      const v = Math.random() * 25 - 12;
      ctx.fillStyle = `rgb(${139 + v}, ${115 + v}, ${85 + v})`;
      ctx.fillRect(x + off + 3, y + 3, bw - 6, bh - 6);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

const createFloorTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4ade80'; ctx.fillRect(0, 0, 512, 512);
  const img = ctx.getImageData(0, 0, 512, 512);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = Math.random() * 30 - 15;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
};

/* =================== COLLISION HELPERS (robust) =================== */
const isWall = (x, z) => {
  const cellX = Math.floor(x);
  const cellZ = Math.floor(z);
  if (
    cellZ < 0 || cellZ >= mazeLayout.length ||
    cellX < 0 || cellX >= mazeLayout[0].length
  ) return true; // out-of-bounds acts like wall
  return mazeLayout[cellZ][cellX] === 1;
};

// Capsule (circle in top view) test with 8 samples around the radius
const canStandAt = (x, z, r = PLAYER_RADIUS) => {
  const s = [
    [ r,  0], [-r,  0], [ 0,  r], [ 0, -r],
    [ r*0.7071,  r*0.7071], [ r*0.7071, -r*0.7071],
    [-r*0.7071,  r*0.7071], [-r*0.7071, -r*0.7071],
  ];
  for (const [ox, oz] of s) {
    if (isWall(x + ox, z + oz)) return false;
  }
  return true;
};

// If tiny penetration occurs, nudge out gently
const pushOutIfInside = (pos) => {
  if (canStandAt(pos.x, pos.z)) return;
  const nudge = [
    [ 1,  0], [-1,  0], [ 0,  1], [ 0, -1],
    [ 1,  1], [ 1, -1], [-1,  1], [-1, -1],
  ];
  for (const [dx, dz] of nudge) {
    const nx = pos.x + dx * PUSH_OUT_EPS;
    const nz = pos.z + dz * PUSH_OUT_EPS;
    if (canStandAt(nx, nz)) { pos.x = nx; pos.z = nz; return; }
  }
};

/* =================== PLAYER MESH =================== */
const PlayerCharacter = () => {
  const meshRef = useRef();
  const playerPosition = useGameStore(s => s.playerPosition);
  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.05;
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.08;
  });
  return (
    <group position={[playerPosition[0], playerPosition[1], playerPosition[2]]}>
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6} metalness={0.9} roughness={0.1}/>
      </mesh>
      <pointLight position={[0, 0.5, 0]} intensity={2.5} color="#fbbf24" distance={4} />
    </group>
  );
};

/* =================== PLAYER CONTROLLER =================== */
const Player = () => {
  const { camera, gl } = useThree();
  const playerPos = useRef(new THREE.Vector3(1.5, 0.3, 1.5));
  const setPlayerPosition = useGameStore(s => s.setPlayerPosition);
  const currentDecision = useGameStore(s => s.currentDecision);
  const completedDecisions = useGameStore(s => s.completedDecisions);
  const gameEnded = useGameStore(s => s.gameEnded);
  const [keys, setKeys] = useState({ up: false, down: false, left: false, right: false });

  useEffect(() => { gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }, [gl]);

  useEffect(() => {
    const down = (e) => {
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
      setKeys(k => ({ 
        up: e.key==='ArrowUp' ? true : k.up,
        down: e.key==='ArrowDown' ? true : k.down,
        left: e.key==='ArrowLeft' ? true : k.left,
        right: e.key==='ArrowRight' ? true : k.right
      }));
      if (e.key === 'f' || e.key === 'F') useGameStore.getState().toggleFlashlight();
      if (e.key === 'm' || e.key === 'M') useGameStore.getState().toggleMinimapSize();
    };
    const up = (e) => {
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
      setKeys(k => ({ 
        up: e.key==='ArrowUp' ? false : k.up,
        down: e.key==='ArrowDown' ? false : k.down,
        left: e.key==='ArrowLeft' ? false : k.left,
        right: e.key==='ArrowRight' ? false : k.right
      }));
    };
    document.addEventListener('keydown', down, { passive:false });
    document.addEventListener('keyup', up, { passive:false });
    return () => {
      document.removeEventListener('keydown', down);
      document.removeEventListener('keyup', up);
    };
  }, []);

  useFrame((_, delta) => {
    if (gameEnded) return;

    if (!currentDecision) {
      // Desired velocity (normalized for diagonal)
      const speed = 2.5;
      const dir = new THREE.Vector2(
        (keys.right ? 1 : 0) - (keys.left ? 1 : 0),
        (keys.down ? 1 : 0) - (keys.up ? 1 : 0)
      );
      if (dir.lengthSq() > 1e-6) dir.normalize();

      let totalDx = dir.x * speed * delta;
      let totalDz = dir.y * speed * delta;

      // Substep to avoid tunneling
      const steps = Math.max(
        1,
        Math.ceil(Math.max(Math.abs(totalDx), Math.abs(totalDz)) / SUBSTEP_MAX)
      );
      const stepDx = totalDx / steps;
      const stepDz = totalDz / steps;

      for (let i = 0; i < steps; i++) {
        // --- X axis resolve ---
        const tryX = playerPos.current.x + stepDx;
        if (canStandAt(tryX, playerPos.current.z)) {
          playerPos.current.x = tryX;
        } else {
          const sgn = Math.sign(stepDx) || 1;
          let backoff = 0;
          for (let k = 0; k < 5; k++) {
            backoff = (backoff ? backoff * 0.5 : Math.abs(stepDx) * 0.5);
            const nx = playerPos.current.x + sgn * (Math.abs(stepDx) - backoff);
            if (canStandAt(nx, playerPos.current.z)) { playerPos.current.x = nx; break; }
          }
        }

        // --- Z axis resolve ---
        const tryZ = playerPos.current.z + stepDz;
        if (canStandAt(playerPos.current.x, tryZ)) {
          playerPos.current.z = tryZ;
        } else {
          const sgn = Math.sign(stepDz) || 1;
          let backoff = 0;
          for (let k = 0; k < 5; k++) {
            backoff = (backoff ? backoff * 0.5 : Math.abs(stepDz) * 0.5);
            const nz = playerPos.current.z + sgn * (Math.abs(stepDz) - backoff);
            if (canStandAt(playerPos.current.x, nz)) { playerPos.current.z = nz; break; }
          }
        }

        // Safety: push out if a tiny overlap sneaks in
        pushOutIfInside(playerPos.current);
      }

      setPlayerPosition([playerPos.current.x, playerPos.current.y, playerPos.current.z]);

      // Trigger checkpoints (cooldown respected)
      const now = performance.now();
      const cool = useGameStore.getState().decisionCooldownUntil;
      for (const d of getDecisions()) {
        const dist = Math.hypot(playerPos.current.x - d.position[0], playerPos.current.z - d.position[2]);
        if (dist < 1.0 && !completedDecisions.has(d.id) && now >= cool) {
          useGameStore.getState().setCurrentDecision(d.id);
          break;
        }
      }
    } else {
      // Freeze while modal is open
      setPlayerPosition([playerPos.current.x, playerPos.current.y, playerPos.current.z]);
    }

    // Camera follow
    const target = new THREE.Vector3(playerPos.current.x, playerPos.current.y + 10, playerPos.current.z + 8);
    camera.position.lerp(target, 0.1);
    camera.lookAt(playerPos.current.x, 0, playerPos.current.z);

    // Exit check (13.5, 11.5)
    const exitDist = Math.hypot(playerPos.current.x - 13.5, playerPos.current.z - 11.5);
    if (exitDist < 1.2) useGameStore.getState().finishGame();
  });

  return <PerspectiveCamera makeDefault position={[1.5, 10, 9.5]} fov={60} />;
};

/* =================== WORLD =================== */
const MazeWalls = () => {
  const wallTex = useMemo(() => createBrickTexture(), []);
  const walls = useMemo(() => {
    const w = [];
    for (let z = 0; z < mazeLayout.length; z++)
      for (let x = 0; x < mazeLayout[z].length; x++)
        if (mazeLayout[z][x] === 1) w.push({ x: x + 0.5, z: z + 0.5 });
    return w;
  }, []);
  return (
    <>
      {walls.map((w, i) => (
        <mesh key={i} position={[w.x, 1, w.z]} castShadow receiveShadow>
          <boxGeometry args={[1, 2, 1]} />
          <meshStandardMaterial map={wallTex} roughness={0.85} metalness={0.15}/>
        </mesh>
      ))}
    </>
  );
};

const Floor = () => {
  const floorTex = useMemo(() => { const t = createFloorTexture(); t.repeat.set(8, 8); return t; }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7.5, 0, 6.5]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial map={floorTex} roughness={0.9} metalness={0.1}/>
    </mesh>
  );
};

const Checkpoint = ({ position, done }) => {
  const ref = useRef(); const light = useRef();
  useFrame((s) => {
    if (ref.current) { ref.current.rotation.y += 0.025; ref.current.position.y = 1.5 + Math.sin(s.clock.elapsedTime * 2) * 0.25; }
    if (light.current) light.current.intensity = 3 + Math.sin(s.clock.elapsedTime * 3) * 1.5;
  });
  return (
    <group position={position}>
      <mesh ref={ref} castShadow>
        <icosahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color={done ? '#22c55e' : '#f59e0b'} emissive={done ? '#16a34a' : '#d97706'} emissiveIntensity={1.0} metalness={0.7} roughness={0.3}/>
      </mesh>
      <pointLight ref={light} position={[0, 2.2, 0]} distance={6} intensity={4} color={done ? '#22c55e' : '#f59e0b'} />
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial color={done ? '#22c55e' : '#f59e0b'} opacity={0.4} transparent />
      </mesh>
    </group>
  );
};

const StartMarker = () => {
  const ref = useRef();
  useFrame((s) => {
    if (ref.current) { ref.current.rotation.y += 0.02; ref.current.position.y = 1.8 + Math.sin(s.clock.elapsedTime * 2) * 0.2; }
  });
  return (
    <group position={[1.5, 0, 1.5]}>
      <mesh ref={ref} castShadow>
        <coneGeometry args={[0.5, 1.2, 32]} />
        <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={1.2} metalness={0.8} roughness={0.2}/>
      </mesh>
      <pointLight position={[0, 3, 0]} intensity={5} color="#22c55e" distance={8} />
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshBasicMaterial color="#22c55e" opacity={0.5} transparent />
      </mesh>
    </group>
  );
};

const ExitMarker = () => {
  const ref = useRef(); const light = useRef();
  useFrame((s) => {
    if (ref.current) { ref.current.rotation.y += 0.025; ref.current.position.y = 1.8 + Math.sin(s.clock.elapsedTime * 2) * 0.25; }
    if (light.current) light.current.intensity = 5 + Math.sin(s.clock.elapsedTime * 3) * 2;
  });
  return (
    <group position={[13.5, 0, 11.5]}>
      <mesh ref={ref} castShadow>
        <torusGeometry args={[0.6, 0.25, 16, 32]} />
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.4} metalness={0.8} roughness={0.2}/>
      </mesh>
      <pointLight ref={light} position={[0, 3, 0]} intensity={5} color="#ef4444" distance={10} />
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[1.5, 32]} />
        <meshBasicMaterial color="#ef4444" opacity={0.5} transparent />
      </mesh>
    </group>
  );
};

const BreadcrumbTrail = () => {
  const visited = useGameStore(s => s.visitedCells);
  return (
    <>
      {Array.from(visited).map((c, i) => {
        const [x, z] = c.split(',').map(Number);
        return (
          <mesh key={i} position={[x + 0.5, 0.02, z + 0.5]} rotation={[-Math.PI/2,0,0]}>
            <circleGeometry args={[0.22, 14]} />
            <meshBasicMaterial color="#fbbf24" opacity={0.35} transparent />
          </mesh>
        );
      })}
    </>
  );
};

const Lighting = () => {
  const flashlightOn = useGameStore(s => s.flashlightOn);
  const playerPosition = useGameStore(s => s.playerPosition);
  const spot = useRef();
  useFrame(() => {
    if (!spot.current || !flashlightOn) return;
    spot.current.position.set(playerPosition[0], playerPosition[1] + 8, playerPosition[2]);
    spot.current.target.position.set(playerPosition[0], 0, playerPosition[2]);
    spot.current.target.updateMatrixWorld();
  });
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[20,30,20]} intensity={2.2} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-far={60} shadow-camera-left={-20} shadow-camera-right={20}
        shadow-camera-top={20} shadow-camera-bottom={-20} />
      <hemisphereLight args={['#87ceeb', '#4ade80', 1.1]} />
      {flashlightOn && <spotLight ref={spot} intensity={5} angle={0.7} penumbra={0.4} distance={25} color="#fff" castShadow />}
    </>
  );
};

/* =================== HUD =================== */
const HUD = () => {
  const {
    wallet, savings, debt, risk, score,
    currentDecision, gameEnded, gameWon,
    flashlightOn, minimapSize
  } = useGameStore();
  const decisions = getDecisions();
  const currentDec = decisions.find(d => d.id === currentDecision);
  const completed = useGameStore(s => s.completedDecisions);

  const getScoreColor = () => (score >= 40 ? '#22c55e' : score >= 20 ? '#eab308' : '#ef4444');

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', fontFamily: 'system-ui, sans-serif' }}>
      {/* Wallet + Stats */}
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.9)', color: 'white', padding: '1.5rem', borderRadius: '1rem', pointerEvents: 'auto', border: '3px solid #3b82f6', minWidth: '260px', boxShadow: '0 0 30px rgba(59,130,246,0.4)' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#fbbf24' }}>💼 Wallet & Stats</h2>
        <div style={{ fontSize: '1.05rem', lineHeight: '2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>👛 Wallet (₹k):</span><b style={{ color: '#22d3ee' }}>{wallet.toFixed(1)}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>💵 Savings:</span><b style={{ color: '#4ade80' }}>{savings.toFixed(1)}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>💳 Debt:</span><b style={{ color: '#f87171' }}>{debt.toFixed(1)}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>🎲 Risk:</span><b style={{ color: '#fb923c' }}>{risk.toFixed(1)}</b></div>
          <div style={{ paddingTop: '0.6rem', marginTop: '0.6rem', borderTop: '2px solid #4b5563' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📊 Score:</span>
              <span style={{ color: getScoreColor(), fontWeight: 'bold', fontSize: '1.6rem', textShadow: `0 0 15px ${getScoreColor()}` }}>{score.toFixed(2)}</span>
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.95rem', color: '#94a3b8' }}>
            Decisions: {completed.size}/{decisions.length}
          </div>
        </div>
      </div>

      {/* Controls & rule */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.9)', color: 'white', padding: '1.5rem', borderRadius: '1rem', fontSize: '1rem', maxWidth: '320px', border: '3px solid #8b5cf6', boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '1rem', fontSize: '1.3rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🎮</span> Controls
        </div>
        <div style={{ lineHeight: '2.2' }}>
          <div><kbd style={{ background: '#374151', padding: '4px 8px', borderRadius: '4px', marginRight: '0.75rem', fontWeight: 'bold' }}>↑ ↓ ← →</kbd>Move</div>
          <div><kbd style={{ background: '#374151', padding: '4px 8px', borderRadius: '4px', marginRight: '0.75rem', fontWeight: 'bold' }}>F</kbd>Flashlight {flashlightOn ? '🔦' : '⚫'}</div>
          <div><kbd style={{ background: '#374151', padding: '4px 8px', borderRadius: '4px', marginRight: '0.75rem', fontWeight: 'bold' }}>M</kbd>Minimap size</div>
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(234,179,8,0.25)', borderRadius: '0.75rem', border: '2px solid #eab308' }}>
            <div style={{ color: '#fcd34d', fontWeight: 'bold' }}>💡 Outcome rule:</div>
            <div style={{ fontSize: '0.95rem', marginTop: '0.4rem', color: '#fef08a' }}>
              Exit anytime. Win if finances are healthy (e.g., Score ≥ 40 & Debt ≤ 20).
            </div>
          </div>
        </div>
      </div>

      {/* Decision modal */}
      {currentDec && !gameEnded && !completed.has(currentDec.id) && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.95)', pointerEvents: 'auto', zIndex: 1000 }}>
          <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '3rem', borderRadius: '1.5rem', maxWidth: '46rem', border: '4px solid #eab308', boxShadow: '0 0 60px rgba(234,179,8,0.6)' }}>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 'bold', marginBottom: '1.6rem', color: 'white', textAlign: 'center' }}>
              {currentDec.question}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentDec.options.map((o, i) => (
                <button key={i}
                  onClick={() => useGameStore.getState().makeDecision(currentDec.id, i)}
                  style={{ width: '100%', textAlign: 'left', padding: '1.5rem', background: i===0 ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#dc2626,#ef4444)', color: 'white', borderRadius: '1rem', border: 'none', cursor: 'pointer', boxShadow: '0 6px 12px rgba(0,0,0,0.4)' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '0.4rem' }}>{o.text}</div>
                  <div style={{ opacity: 0.95 }}>{o.effect || ''}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* End screen */}
      {gameEnded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.95)', pointerEvents: 'auto', zIndex: 1000 }}>
          <div style={{ background: gameWon ? 'linear-gradient(135deg, #065f46 0%, #059669 100%)' : 'linear-gradient(135deg, #7c2d12 0%, #b91c1c 100%)', padding: '3.2rem', borderRadius: '1.6rem', textAlign: 'center', border: `5px solid ${gameWon ? '#4ade80' : '#ef4444'}`, color: 'white', width: 'min(90vw, 820px)' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>{gameWon ? '🎉' : '😢'}</div>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              {gameWon ? 'Financially Healthy!' : 'Needs Improvement'}
            </h1>
            <p style={{ fontSize: '1.3rem', opacity: 0.95, marginBottom: '1.5rem' }}>
              {gameWon ? 'Great balance of savings, cash, and controlled debt.' : 'Try boosting savings, reducing debt, and avoiding risky choices.'}
            </p>
            <div style={{ background: 'rgba(0,0,0,0.6)', padding: '1.4rem', borderRadius: '1rem', marginBottom: '1.6rem' }}>
              <div>👛 Wallet: <b style={{ color: '#22d3ee' }}>{wallet.toFixed(1)}</b> · 💵 Savings: <b style={{ color: '#4ade80' }}>{savings.toFixed(1)}</b> · 💳 Debt: <b style={{ color: debt <= 20 ? '#4ade80' : '#f87171' }}>{debt.toFixed(1)}</b></div>
              <div style={{ marginTop: '0.4rem' }}>📊 Score: <b style={{ color: gameWon ? '#22c55e' : '#fbbf24' }}>{score.toFixed(2)}</b> · Decisions taken: <b>{useGameStore.getState().completedDecisions.size}/{getDecisions().length}</b></div>
            </div>
            <button onClick={() => window.location.reload()} style={{ padding: '1rem 2.6rem', background: gameWon ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', fontWeight: 'bold', borderRadius: '0.9rem', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
              🔄 Play Again
            </button>
          </div>
        </div>
      )}

      <Minimap />
    </div>
  );
};

/* =================== MINIMAP =================== */
const Minimap = () => {
  const player = useGameStore(s => s.playerPosition);
  const visited = useGameStore(s => s.visitedCells);
  const minimapSize = useGameStore(s => s.minimapSize);
  const completed = useGameStore(s => s.completedDecisions);
  const decisions = getDecisions();

  const scale = minimapSize === 'large' ? 20 : 12;
  const size = minimapSize === 'large' ? 300 : 180;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'm' || e.key === 'M') useGameStore.getState().toggleMinimapSize(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', background: 'rgba(0,0,0,0.95)', padding: '1.25rem', borderRadius: '1rem', border: '3px solid #22d3ee', boxShadow: '0 0 40px rgba(34,211,238,0.6)' }}>
      <svg width={size} height={size} style={{ background: '#0a0f1e', borderRadius: '0.75rem', display: 'block', border: '2px solid #1e293b' }}>
        {mazeLayout.map((row, z) =>
          row.map((cell, x) =>
            cell === 1 ? (
              <rect key={`w-${x}-${z}`} x={x*scale} y={z*scale} width={scale} height={scale} fill="#8b7355" stroke="#6b5d4f" strokeWidth="1.5"/>
            ) : (
              <rect key={`f-${x}-${z}`} x={x*scale} y={z*scale} width={scale} height={scale} fill="#1a3a1a" stroke="#0f2610" strokeWidth="0.5"/>
            )
          )
        )}

        {Array.from(visited).map((cell, i) => {
          const [x, z] = cell.split(',').map(Number);
          return <circle key={`v-${i}`} cx={(x+0.5)*scale} cy={(z+0.5)*scale} r={scale*0.2} fill="#fbbf24" opacity="0.4"/>;
        })}

        {/* Start */}
        <g>
          <circle cx={1.5*scale} cy={1.5*scale} r={scale*0.6} fill="#22c55e" stroke="#16a34a" strokeWidth="3">
            <animate attributeName="r" values={`${scale*0.5};${scale*0.65};${scale*0.5}`} dur="2s" repeatCount="indefinite"/>
          </circle>
          <text x={1.5*scale} y={1.5*scale+4} fontSize={scale*0.3} fill="white" textAnchor="middle" fontWeight="bold">START</text>
        </g>

        {/* Decisions */}
        {decisions.map(d => {
          const done = completed.has(d.id);
          const x = d.position[0], z = d.position[2];
          return (
            <g key={d.id}>
              <circle cx={x*scale} cy={z*scale} r={scale*0.45} fill={done ? '#22c55e' : '#f59e0b'} stroke={done ? '#16a34a' : '#d97706'} strokeWidth="2.2"/>
              {done && <text x={x*scale} y={z*scale+4} fontSize={scale*0.5} fill="white" textAnchor="middle" fontWeight="bold">✓</text>}
            </g>
          );
        })}

        {/* Exit */}
        <g>
          <circle cx={13.5*scale} cy={11.5*scale} r={scale*0.65} fill="#ef4444" stroke="#dc2626" strokeWidth="3">
            <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          <text x={13.5*scale} y={11.5*scale+4} fontSize={scale*0.3} fill="white" textAnchor="middle" fontWeight="bold">EXIT</text>
        </g>

        {/* Player */}
        <g transform={`translate(${player[0]*scale}, ${player[2]*scale})`}>
          <circle r={scale*0.55} fill="#fbbf24" stroke="#fff" strokeWidth="3">
            <animate attributeName="r" values={`${scale*0.5};${scale*0.6};${scale*0.5}`} dur="1.5s" repeatCount="indefinite"/>
          </circle>
          <circle r={scale*0.25} fill="#fff" />
        </g>
      </svg>
      <div style={{ color: '#22d3ee', fontSize: minimapSize==='large' ? '1.05rem':'0.85rem', textAlign: 'center', marginTop: '0.6rem', fontWeight: 'bold' }}>
        📍 Minimap {minimapSize==='large' ? '(Large)' : '(Small)'}
      </div>
      <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.25rem' }}>
        Press M to resize
      </div>
    </div>
  );
};

/* =================== SCENE =================== */
const Scene = () => {
  const decisions = getDecisions();
  const completed = useGameStore(s => s.completedDecisions);

  return (
    <>
      <Sky distance={450000} sunPosition={[100, 70, 100]} inclination={0.35} azimuth={0.25} turbidity={6} />
      <Player />
      <Lighting />
      <Floor />
      <MazeWalls />
      <BreadcrumbTrail />
      <PlayerCharacter />
      <StartMarker />
      <ExitMarker />

      {decisions.map(d => (
        <Checkpoint key={d.id} position={d.position} done={completed.has(d.id)} />
      ))}

      {/* SSAO fix: enableNormalPass prevents black screen */}
      <EffectComposer enableNormalPass>
        <SSAO radius={0.2} intensity={15} luminanceInfluence={0.6} />
        <Bloom luminanceThreshold={0.7} luminanceSmoothing={0.9} intensity={1.2} />
      </EffectComposer>
    </>
  );
};

/* =================== APP =================== */
export default function FinancialMaze3D() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(135deg,#0f172a,#1e293b 25%,#1e3a8a 50%,#581c87 75%,#4c1d95 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.2) 0%, transparent 60%)' }} />
        <div style={{ textAlign: 'center', color: 'white', padding: '3.5rem', background: 'rgba(0,0,0,0.85)', borderRadius: '2rem', maxWidth: '52rem', border: '4px solid #3b82f6', boxShadow: '0 0 60px rgba(59,130,246,0.5)', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '4.6rem', fontWeight: 'bold', marginBottom: '1.2rem', background: 'linear-gradient(135deg,#fbbf24,#d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            💰 Financial Maze 3D
          </h1>
          <p style={{ fontSize: '1.4rem', marginBottom: '2rem', color: '#cbd5e1' }}>
            Make realistic money choices, watch your wallet, and head to EXIT whenever you’re ready.
          </p>

          <div style={{ textAlign: 'left', marginBottom: '2rem', background: 'rgba(15,23,42,0.7)', padding: '1.4rem', borderRadius: '1rem', border: '2px solid #334155' }}>
            <div style={{ fontWeight: 'bold', color: '#22d3ee', marginBottom: '0.6rem' }}>What’s inside</div>
            <ul style={{ marginLeft: '1rem', lineHeight: 1.9 }}>
              <li>✅ Wallet + Savings + Debt + Risk</li>
              <li>✅ 10 checkpoints across multiple paths</li>
              <li>✅ Exit anytime — outcome based on finances</li>
              <li>✅ Robust collision, SSAO, breadcrumbs</li>
            </ul>
          </div>

          <button onClick={() => setStarted(true)} style={{ padding: '1.4rem 3.6rem', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white', fontSize: '1.6rem', fontWeight: 'bold', borderRadius: '1rem', border: 'none', cursor: 'pointer' }}>
            🚀 Start
          </button>

          <div style={{ marginTop: '1.2rem', fontSize: '0.95rem', color: '#94a3b8', fontStyle: 'italic' }}>
            Use Arrow Keys • F flashlight • M minimap
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#87ceeb' }}>
      <Canvas shadows gl={{ antialias: true, alpha: false }} dpr={[1, 2]}>
        <Scene />
      </Canvas>
      <HUD />
    </div>
  );
}
