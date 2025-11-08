import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Sky, PerformanceMonitor } from '@react-three/drei';
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing';
import * as THREE from 'three';
import { create } from 'zustand';

/* =================== Responsive =================== */
const useResponsive = () => {
  const [uiScale, setUiScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const measure = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const s = Math.min(w / 1280, h / 720);
      setUiScale(Math.min(1, Math.max(0.68, s)));
      setIsMobile(w < 900);
      document.documentElement.style.setProperty('--vh', `${h * 0.01}px`);
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);
  return { uiScale, isMobile };
};

/* =================== Tuning =================== */
const PLAYER_RADIUS = 0.28;
const SUBSTEP_MAX = 0.18;
const PUSH_OUT_EPS = 0.002;

/* =================== Store =================== */
const useGameStore = create((set, get) => ({
  // Money
  wallet: 20, savings: 0, debt: 0, risk: 0, smartRisk: 0, recklessRisk: 0,

  // Game state
  score: 0,
  currentDecision: null,
  playerPosition: [1.5, 0.3, 1.5],
  completedDecisions: new Set(),
  decisionCooldownUntil: 0,
  gameEnded: false,
  gameWon: false,

  // UI state
  flashlightOn: true,
  minimapSize: 'large',
  visitedCells: new Set(['1,1']),

  makeDecision: (id, choice) => {
    const state = get();
    const decision = getDecisions().find(d => d.id === id);
    if (!decision) return;
    const o = decision.options[choice];

    const wallet = state.wallet + (o.wallet || 0);
    const savings = state.savings + (o.savings || 0);
    const debt = state.debt + (o.debt || 0);
    const risk = state.risk + (o.risk || 0);
    const smartRisk = state.smartRisk + (o.smartRisk || 0);
    const recklessRisk = state.recklessRisk + (o.recklessRisk || 0);

    const savingsScore = Math.sqrt(Math.max(0, savings)) * 12;
    const walletScore  = Math.sqrt(Math.max(0, wallet))  * 8;
    const debtPenalty  = Math.sqrt(Math.max(0, debt))    * 10;
    const riskBonus    = smartRisk * 1.4 - recklessRisk * 1.2 - risk * 0.3;
    const score        = savingsScore + walletScore - debtPenalty + riskBonus;

    set({
      wallet, savings, debt, risk, smartRisk, recklessRisk, score,
      currentDecision: null,
      completedDecisions: new Set([...state.completedDecisions, id]),
      decisionCooldownUntil: performance.now() + 800,
    });
  },

  finishGame: () => {
    const s = get();
    const win = (s.score >= 40 && s.debt <= 20) ||
                (s.savings >= 15 && s.wallet >= 10 && s.recklessRisk <= 8);
    set({ gameEnded: true, gameWon: win });
  },

  setCurrentDecision: (id) => set({ currentDecision: id }),
  clearCurrentDecision: () => set({ currentDecision: null }),
  setPlayerPosition: (pos) => {
    const cellKey = `${Math.floor(pos[0])},${Math.floor(pos[2])}`;
    set(state => ({ playerPosition: pos, visitedCells: new Set([...state.visitedCells, cellKey]) }));
  },

  toggleFlashlight:   () => set(s => ({ flashlightOn: !s.flashlightOn })),
  toggleMinimapSize:  () => set(s => ({ minimapSize: s.minimapSize === 'small' ? 'large' : 'small' })),
}));

/* =================== Maze =================== */
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

const MAZE_WIDTH = mazeLayout[0].length;
const MAZE_HEIGHT = mazeLayout.length;
const MAZE_CENTER_X = MAZE_WIDTH / 2;
const MAZE_CENTER_Z = MAZE_HEIGHT / 2;

/* =================== Decisions (10) =================== */
const getDecisions = () => [
  { id:'salary1',   position:[3.5,0.5,1.5],  question:'🎉 First salary!', options:[
      { text:'Save ₹8k + small treat', savings:8, wallet:-1, smartRisk:1, effect:'Savings +8, Wallet -1' },
      { text:'Weekend shopping spree', wallet:-6, debt:4, recklessRisk:2, effect:'Wallet -6, Debt +4' }
  ]},
  { id:'budget1',   position:[6.5,0.5,1.5],  question:'📋 Set a monthly budget?', options:[
      { text:'Use 50-30-20 rule', savings:4, smartRisk:1, effect:'Savings +4' },
      { text:'No plan, just vibes', debt:2, recklessRisk:2, effect:'Debt +2' }
  ]},
  { id:'insurance1',position:[9.5,0.5,1.5],  question:'🩺 Buy health insurance?', options:[
      { text:'Yes (annual premium)', wallet:-3, smartRisk:2, effect:'Wallet -3, Smart +2' },
      { text:'Skip it', recklessRisk:3, effect:'Reckless +3' }
  ]},
  { id:'invest1',   position:[5.5,0.5,3.5],  question:'📈 Start SIP in index fund?', options:[
      { text:'Start ₹2k/month', savings:6, smartRisk:3, wallet:-2, effect:'Savings +6 (future), Wallet -2' },
      { text:'Hype crypto buy', recklessRisk:4, risk:2, wallet:-3, effect:'Reckless +4, Wallet -3' }
  ]},
  { id:'skill1',    position:[11.5,0.5,3.5], question:'🎓 Online course to upskill', options:[
      { text:'Enroll (₹2k)', wallet:-2, savings:2, smartRisk:1, effect:'Wallet -2, Savings +2 (career)' },
      { text:'Skip for now', effect:'No change' }
  ]},
  { id:'loan1',     position:[5.5,0.5,5.5],  question:'📱 EMI temptation for a gadget', options:[
      { text:'Wait & save', savings:3, effect:'Savings +3' },
      { text:'Buy on EMI', debt:8, recklessRisk:3, effect:'Debt +8' }
  ]},
  { id:'sidegig1',  position:[9.5,0.5,5.5],  question:'🧰 Weekend side-gig', options:[
      { text:'Take it', wallet:6, smartRisk:1, effect:'Wallet +6' },
      { text:'Skip this month', effect:'No change' }
  ]},
  { id:'rent1',     position:[10.5,0.5,7.5], question:'🏠 Rent increase', options:[
      { text:'Negotiate -₹1k', wallet:1, smartRisk:1, effect:'Wallet +1' },
      { text:'Accept increase', wallet:-1, effect:'Wallet -1' }
  ]},
  { id:'medical1',  position:[3.5,0.5,7.5],  question:'🏥 Medical expense', options:[
      { text:'Use emergency fund', savings:-3, effect:'Savings -3' },
      { text:'Swipe credit card', debt:6, effect:'Debt +6' }
  ]},
  { id:'vacation1', position:[5.5,0.5,11.5], question:'✈️ Vacation plan?', options:[
      { text:'Budget trip', wallet:-2, effect:'Wallet -2' },
      { text:'Luxury trip on EMI', debt:10, recklessRisk:3, effect:'Debt +10' }
  ]},
];

/* =================== Textures =================== */
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
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
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

/* =================== Collision helpers =================== */
const isWall = (x, z) => {
  const cx = Math.floor(x), cz = Math.floor(z);
  if (cz < 0 || cz >= mazeLayout.length || cx < 0 || cx >= mazeLayout[0].length) return true;
  return mazeLayout[cz][cx] === 1;
};
const canStandAt = (x, z, r = PLAYER_RADIUS) => {
  const s = [
    [ r,  0], [-r,  0], [ 0,  r], [ 0, -r],
    [ r*0.7071,  r*0.7071], [ r*0.7071, -r*0.7071],
    [-r*0.7071,  r*0.7071], [-r*0.7071, -r*0.7071],
  ];
  for (const [ox, oz] of s) if (isWall(x + ox, z + oz)) return false;
  return true;
};
const pushOutIfInside = (pos) => {
  if (canStandAt(pos.x, pos.z)) return;
  const nudge = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  for (const [dx, dz] of nudge) {
    const nx = pos.x + dx * PUSH_OUT_EPS;
    const nz = pos.z + dz * PUSH_OUT_EPS;
    if (canStandAt(nx, nz)) { pos.x = nx; pos.z = nz; return; }
  }
};

/* =================== Player mesh =================== */
const PlayerCharacter = () => {
  const meshRef = useRef();
  const p = useGameStore(s => s.playerPosition);
  useFrame((st) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.05;
    meshRef.current.position.y = Math.sin(st.clock.elapsedTime * 3) * 0.08;
  });
  return (
    <group position={[p[0], p[1], p[2]]}>
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6} metalness={0.9} roughness={0.1}/>
      </mesh>
      <pointLight position={[0, 0.5, 0]} intensity={2.5} color="#fbbf24" distance={4} />
    </group>
  );
};

/* =================== Player controller =================== */
const Player = () => {
  const { camera, gl } = useThree();
  const playerPos = useRef(new THREE.Vector3(1.5, 0.3, 1.5));
  const setPlayerPosition = useGameStore(s => s.setPlayerPosition);
  const currentDecision = useGameStore(s => s.currentDecision);
  const completedDecisions = useGameStore(s => s.completedDecisions);
  const gameEnded = useGameStore(s => s.gameEnded);

  const [keys, setKeys] = useState({ up:false, down:false, left:false, right:false });

  useEffect(() => { gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }, [gl]);

  useEffect(() => {
    const down = (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
      setKeys(k => ({ up:e.key==='ArrowUp'||e.key==='w'||e.key==='W'?true:k.up,
                      down:e.key==='ArrowDown'||e.key==='s'||e.key==='S'?true:k.down,
                      left:e.key==='ArrowLeft'||e.key==='a'||e.key==='A'?true:k.left,
                      right:e.key==='ArrowRight'||e.key==='d'||e.key==='D'?true:k.right }));
      if (e.key==='f'||e.key==='F') useGameStore.getState().toggleFlashlight();
      if (e.key==='m'||e.key==='M') useGameStore.getState().toggleMinimapSize();
    };
    const up = (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','W','a','A','s','S','d','D'].includes(e.key)) e.preventDefault();
      setKeys(k => ({ up:e.key==='ArrowUp'||e.key==='w'||e.key==='W'?false:k.up,
                      down:e.key==='ArrowDown'||e.key==='s'||e.key==='S'?false:k.down,
                      left:e.key==='ArrowLeft'||e.key==='a'||e.key==='A'?false:k.left,
                      right:e.key==='ArrowRight'||e.key==='d'||e.key==='D'?false:k.right }));
    };
    document.addEventListener('keydown', down, { passive:false });
    document.addEventListener('keyup', up,   { passive:false });
    return () => { document.removeEventListener('keydown', down); document.removeEventListener('keyup', up); };
  }, []);

  useFrame((_, delta) => {
    if (gameEnded) return;

    if (!currentDecision) {
      const speed = 2.5;
      const dir = new THREE.Vector2((keys.right?1:0)-(keys.left?1:0),(keys.down?1:0)-(keys.up?1:0));
      if (dir.lengthSq() > 1e-6) dir.normalize();

      let totalDx = dir.x * speed * delta;
      let totalDz = dir.y * speed * delta;

      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(totalDx), Math.abs(totalDz)) / SUBSTEP_MAX));
      const stepDx = totalDx / steps, stepDz = totalDz / steps;

      for (let i = 0; i < steps; i++) {
        const tryX = playerPos.current.x + stepDx;
        if (canStandAt(tryX, playerPos.current.z)) playerPos.current.x = tryX;
        else {
          const sgn = Math.sign(stepDx) || 1; let back = 0;
          for (let k = 0; k < 5; k++) {
            back = back ? back*0.5 : Math.abs(stepDx)*0.5;
            const nx = playerPos.current.x + sgn*(Math.abs(stepDx)-back);
            if (canStandAt(nx, playerPos.current.z)) { playerPos.current.x = nx; break; }
          }
        }
        const tryZ = playerPos.current.z + stepDz;
        if (canStandAt(playerPos.current.x, tryZ)) playerPos.current.z = tryZ;
        else {
          const sgn = Math.sign(stepDz) || 1; let back = 0;
          for (let k = 0; k < 5; k++) {
            back = back ? back*0.5 : Math.abs(stepDz)*0.5;
            const nz = playerPos.current.z + sgn*(Math.abs(stepDz)-back);
            if (canStandAt(playerPos.current.x, nz)) { playerPos.current.z = nz; break; }
          }
        }
        pushOutIfInside(playerPos.current);
      }

      setPlayerPosition([playerPos.current.x, playerPos.current.y, playerPos.current.z]);

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
      setPlayerPosition([playerPos.current.x, playerPos.current.y, playerPos.current.z]);
    }

    // Camera (smooth cinematic follow)
    const followOffset = new THREE.Vector3(0, 8, 6);
    const target = new THREE.Vector3(
      playerPos.current.x + followOffset.x,
      playerPos.current.y + followOffset.y,
      playerPos.current.z + followOffset.z
    );
    camera.position.lerp(target, 0.08);
    camera.lookAt(playerPos.current.x, playerPos.current.y + 0.5, playerPos.current.z);
    camera.fov = 65;
    camera.updateProjectionMatrix();

    // Exit
    const exitDist = Math.hypot(playerPos.current.x - 13.5, playerPos.current.z - 11.5);
    if (exitDist < 1.2) useGameStore.getState().finishGame();
  });

  return <PerspectiveCamera makeDefault position={[1.5, 10, 9.5]} fov={60} />;
};

/* =================== World pieces =================== */
const MazeWalls = () => {
  const wallTexture = useMemo(() => createBrickTexture(), []);
  const walls = useMemo(() => {
    const list = [];
    for (let z = 0; z < mazeLayout.length; z++)
      for (let x = 0; x < mazeLayout[z].length; x++)
        if (mazeLayout[z][x] === 1) list.push({ x: x + 0.5, z: z + 0.5 });
    return list;
  }, []);
  return (
    <>
      {walls.map((w, i) => (
        <mesh key={i} position={[w.x, 1.2, w.z]} castShadow receiveShadow>
          <boxGeometry args={[1, 2.4, 1]} />
          <meshStandardMaterial 
            map={wallTexture} 
            roughness={0.75} 
            metalness={0.2}
            normalScale={new THREE.Vector2(0.5, 0.5)}
          />
        </mesh>
      ))}
    </>
  );
};
const Floor = () => {
  const floorTexture = useMemo(() => { const t = createFloorTexture(); t.repeat.set(8, 8); return t; }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[MAZE_CENTER_X, 0, MAZE_CENTER_Z]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial 
        map={floorTexture} 
        roughness={0.85} 
        metalness={0.15}
        aoMapIntensity={0.5}
      />
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

/* =================== Lighting (enhanced realism) =================== */
const Lighting = ({ lowPerf = false }) => {
  const flashlightOn = useGameStore(s => s.flashlightOn);
  const p = useGameStore(s => s.playerPosition);
  const spot = useRef();
  useFrame(() => {
    if (!spot.current || !flashlightOn) return;
    spot.current.position.set(p[0], p[1] + 8, p[2]);
    spot.current.target.position.set(p[0], 0, p[2]);
    spot.current.target.updateMatrixWorld();
  });
  const shadowSize = lowPerf ? 1024 : 2048;
  const dirIntensity = lowPerf ? 1.8 : 2.5;
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[25,35,20]} intensity={dirIntensity} castShadow
        shadow-mapSize-width={shadowSize} shadow-mapSize-height={shadowSize}
        shadow-camera-far={70}
        shadow-camera-left={-25} shadow-camera-right={25}
        shadow-camera-top={25} shadow-camera-bottom={-25}
        shadow-bias={-0.0001} />
      <hemisphereLight args={['#87ceeb', '#3a5f3a', 1.2]} />
      {flashlightOn && (
        <spotLight ref={spot} intensity={lowPerf ? 4 : 6} angle={0.65} penumbra={0.5} distance={28} color="#ffffee" castShadow={!lowPerf}
          shadow-mapSize-width={lowPerf ? 512 : 1024} shadow-mapSize-height={lowPerf ? 512 : 1024} />
      )}
      <pointLight position={[MAZE_CENTER_X, 15, MAZE_CENTER_Z]} intensity={1.5} color="#fff8dc" distance={30} decay={2} />
    </>
  );
};

/* =================== HUD (compact, non-intrusive) =================== */
const HUD = () => {
  const { uiScale, isMobile } = useResponsive();
  const {
    wallet, savings, debt, risk, score,
    currentDecision, gameEnded, flashlightOn
  } = useGameStore();
  const decisions = getDecisions();
  const currentDec = decisions.find(d => d.id === currentDecision);
  const completed = useGameStore(s => s.completedDecisions);
  const getScoreColor = () => (score >= 40 ? '#22c55e' : score >= 20 ? '#eab308' : '#ef4444');

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', fontFamily: 'system-ui, sans-serif' }}>
      {/* Compact left card */}
      <div className="hud-scale-left" style={{
        position:'absolute', top:12, left:12, transform:`scale(${Math.min(uiScale, 0.85)})`,
        transformOrigin:'top left', background:'rgba(0,0,0,0.85)', color:'#fff',
        padding: isMobile ? '0.9rem':'1.2rem', borderRadius:'0.85rem', pointerEvents:'auto',
        border:'2px solid #3b82f6', minWidth: isMobile ? '160px' : '220px',
        boxShadow:'0 0 25px rgba(59,130,246,0.35)', backdropFilter:'blur(10px)'
      }}>
        <h2 style={{ fontSize: isMobile ? '1rem':'1.3rem', fontWeight:'bold', marginBottom:'0.5rem', color:'#fbbf24' }}>💼 Stats</h2>
        <div style={{ fontSize: isMobile ? '0.85rem':'0.95rem', lineHeight:1.8 }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}><span>👛 Wallet:</span><b style={{ color:'#22d3ee' }}>{wallet.toFixed(1)}</b></div>
          <div style={{ display:'flex', justifyContent:'space-between' }}><span>💵 Savings:</span><b style={{ color:'#4ade80' }}>{savings.toFixed(1)}</b></div>
          <div style={{ display:'flex', justifyContent:'space-between' }}><span>💳 Debt:</span><b style={{ color:'#f87171' }}>{debt.toFixed(1)}</b></div>
          <div style={{ display:'flex', justifyContent:'space-between' }}><span>🎲 Risk:</span><b style={{ color:'#fb923c' }}>{risk.toFixed(1)}</b></div>
          <div style={{ paddingTop:4, marginTop:4, borderTop:'1px solid #4b5563' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>📊 Score:</span>
              <span style={{ color:getScoreColor(), fontWeight:'bold', fontSize: isMobile ? '1.1rem':'1.3rem', textShadow:`0 0 12px ${getScoreColor()}` }}>{score.toFixed(1)}</span>
            </div>
          </div>
          <div style={{ marginTop:4, fontSize: isMobile ? '0.75rem':'0.85rem', color:'#94a3b8' }}>
            {completed.size}/{decisions.length} decisions
          </div>
        </div>
      </div>

      {/* Compact right card */}
      <div className="hud-scale-right" style={{
        position:'absolute', top:12, right:12, transform:`scale(${Math.min(uiScale, 0.85)})`,
        transformOrigin:'top right', background:'rgba(0,0,0,0.85)', color:'#fff',
        padding: isMobile ? '0.9rem':'1.2rem', borderRadius:'0.85rem', fontSize:'0.95rem',
        maxWidth: isMobile ? 200 : 260, border:'2px solid #8b5cf6',
        boxShadow:'0 0 25px rgba(139,92,246,0.35)', pointerEvents:'auto', backdropFilter:'blur(10px)'
      }}>
        <div style={{ fontWeight:'bold', marginBottom:'0.6rem', fontSize: isMobile ? '0.95rem':'1.1rem', color:'#a78bfa', display:'flex', alignItems:'center', gap:'0.4rem' }}>
          <span>🎮</span> Controls
        </div>

        <div style={{ display:'grid', gap:'0.4rem' }}>
          <button onClick={() => useGameStore.getState().toggleFlashlight()}
            style={{ cursor:'pointer', background:'#111827', color:'#fff', border:'1px solid #374151',
              borderRadius:6, padding:'0.45rem 0.65rem', textAlign:'left', fontSize:'0.9rem' }}>
            <b style={{ background:'#374151', padding:'2px 5px', borderRadius:3, marginRight:6, fontSize:'0.85rem' }}>F</b>
            Flashlight {flashlightOn ? '🔦' : '⚫'}
          </button>

          <button onClick={() => useGameStore.getState().toggleMinimapSize()}
            style={{ cursor:'pointer', background:'#111827', color:'#fff', border:'1px solid #374151',
              borderRadius:6, padding:'0.45rem 0.65rem', textAlign:'left', fontSize:'0.9rem' }}>
            <b style={{ background:'#374151', padding:'2px 5px', borderRadius:3, marginRight:6, fontSize:'0.85rem' }}>M</b>
            Minimap
          </button>
        </div>

        <div style={{ marginTop:'0.6rem', padding:'0.5rem', background:'rgba(234,179,8,0.2)', borderRadius:'0.6rem', border:'1px solid #eab308' }}>
          <div style={{ color:'#fcd34d', fontWeight:'bold', fontSize:'0.9rem' }}>💡 Goal</div>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', marginTop:3, color:'#fef08a' }}>
            Score ≥40 & Debt ≤20 to win!
          </div>
        </div>
      </div>

      {/* Decision modal */}
      {currentDec && !gameEnded && !completed.has(currentDec.id) && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.95)', pointerEvents:'auto', zIndex:1000 }}>
          <div className="start-card" style={{
            background:'linear-gradient(135deg,#1e293b 0%,#334155 100%)',
            padding: isMobile ? '1.6rem':'3rem',
            borderRadius:'1.2rem',
            width:'min(92vw, 46rem)',
            border:'4px solid #eab308',
            boxShadow:'0 0 60px rgba(234,179,8,0.6)'
          }}>
            <h2 style={{ fontSize: isMobile ? '1.4rem' : '2.1rem', fontWeight:'bold', marginBottom: isMobile ? '1rem' : '1.6rem', color:'#fff', textAlign:'center' }}>
              {currentDec.question}
            </h2>
            <div style={{ display:'flex', flexDirection:'column', gap:isMobile ? '0.8rem':'1rem' }}>
              {currentDec.options.map((o, i) => (
                <button key={i}
                  onClick={() => useGameStore.getState().makeDecision(currentDec.id, i)}
                  style={{ width:'100%', textAlign:'left', padding:isMobile ? '1.1rem':'1.5rem',
                    background: i===0 ? 'linear-gradient(135deg,#059669,#10b981)':'linear-gradient(135deg,#dc2626,#ef4444)',
                    color:'#fff', borderRadius:'1rem', border:'none', cursor:'pointer', boxShadow:'0 6px 12px rgba(0,0,0,0.4)' }}>
                  <div style={{ fontWeight:'bold', fontSize:isMobile ? '1.05rem':'1.25rem', marginBottom:'0.35rem' }}>{o.text}</div>
                  <div style={{ opacity:0.95 }}>{o.effect || ''}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* End screen */}
      {useGameStore.getState().gameEnded && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.95)', pointerEvents:'auto', zIndex:1000 }}>
          <EndScreen />
        </div>
      )}
    </div>
  );
};

const EndScreen = () => {
  const { wallet, savings, debt, score, gameWon } = useGameStore();
  const completed = useGameStore(s => s.completedDecisions);
  return (
    <div className="start-card" style={{ background: gameWon ? 'linear-gradient(135deg,#065f46,#059669)':'linear-gradient(135deg,#7c2d12,#b91c1c)', padding:'2rem', borderRadius:'1.2rem', textAlign:'center', border:`5px solid ${gameWon ? '#4ade80':'#ef4444'}`, color:'#fff', width:'min(92vw, 820px)' }}>
      <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>{gameWon ? '🎉':'😢'}</div>
      <h1 style={{ fontSize:'2.2rem', fontWeight:'bold', marginBottom:'1rem' }}>
        {gameWon ? 'Financially Healthy!' : 'Needs Improvement'}
      </h1>
      <div style={{ background:'rgba(0,0,0,0.6)', padding:'1rem', borderRadius:'1rem', marginBottom:'1.2rem' }}>
        <div>👛 Wallet: <b style={{ color:'#22d3ee' }}>{wallet.toFixed(1)}</b> · 💵 Savings: <b style={{ color:'#4ade80' }}>{savings.toFixed(1)}</b> · 💳 Debt: <b style={{ color: debt<=20 ? '#4ade80':'#f87171' }}>{debt.toFixed(1)}</b></div>
        <div style={{ marginTop:'0.4rem' }}>📊 Score: <b>{score.toFixed(2)}</b> · Decisions taken: <b>{completed.size}/{getDecisions().length}</b></div>
      </div>
      <button onClick={() => window.location.reload()} style={{ padding:'0.9rem 2.4rem', background: gameWon ? 'linear-gradient(135deg,#22c55e,#16a34a)':'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff', fontWeight:'bold', borderRadius:'0.9rem', border:'none', cursor:'pointer', fontSize:'1.05rem' }}>
        🔄 Play Again
      </button>
    </div>
  );
};

/* =================== Minimap (compact) =================== */
const Minimap = () => {
  const player = useGameStore(s => s.playerPosition);
  const visited = useGameStore(s => s.visitedCells);
  const minimapSize = useGameStore(s => s.minimapSize);
  const completed = useGameStore(s => s.completedDecisions);
  const decisions = getDecisions();
  const { isMobile } = useResponsive();

  const sizeKey = isMobile ? 'small' : minimapSize;
  const scale = sizeKey === 'large' ? 16 : 10;
  const size = sizeKey === 'large' ? 240 : 150;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'm' || e.key === 'M') useGameStore.getState().toggleMinimapSize(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ position:'absolute', bottom:'1rem', right:'1rem', background:'rgba(0,0,0,0.88)', padding:'0.8rem', borderRadius:'0.8rem', border:'2px solid #22d3ee', boxShadow:'0 0 30px rgba(34,211,238,0.5)', pointerEvents:'auto', backdropFilter:'blur(8px)' }}>
      <svg width={size} height={size} style={{ background:'#0a0f1e', borderRadius:'0.6rem', display:'block', border:'2px solid #1e293b' }}>
        {mazeLayout.map((row, z) =>
          row.map((cell, x) =>
            cell === 1 ? (
              <rect key={`w-${x}-${z}`} x={x*scale} y={z*scale} width={scale} height={scale} fill="#8b7355" stroke="#6b5d4f" strokeWidth="1.2"/>
            ) : (
              <rect key={`f-${x}-${z}`} x={x*scale} y={z*scale} width={scale} height={scale} fill="#1a3a1a" stroke="#0f2610" strokeWidth="0.4"/>
            )
          )
        )}

        {Array.from(visited).map((cell, i) => {
          const [x, z] = cell.split(',').map(Number);
          return <circle key={`v-${i}`} cx={(x+0.5)*scale} cy={(z+0.5)*scale} r={scale*0.18} fill="#fbbf24" opacity="0.35"/>;
        })}

        {/* Start */}
        <g>
          <circle cx={1.5*scale} cy={1.5*scale} r={scale*0.5} fill="#22c55e" stroke="#16a34a" strokeWidth="2.5">
            <animate attributeName="r" values={`${scale*0.42};${scale*0.55};${scale*0.42}`} dur="2s" repeatCount="indefinite"/>
          </circle>
        </g>

        {/* Decisions */}
        {decisions.map(d => {
          const done = completed.has(d.id);
          const x = d.position[0], z = d.position[2];
          return (
            <g key={d.id}>
              <circle cx={x*scale} cy={z*scale} r={scale*0.38} fill={done ? '#22c55e' : '#f59e0b'} stroke={done ? '#16a34a' : '#d97706'} strokeWidth="1.8"/>
              {done && <text x={x*scale} y={z*scale+3} fontSize={scale*0.4} fill="white" textAnchor="middle" fontWeight="bold">✓</text>}
            </g>
          );
        })}

        {/* Exit */}
        <g>
          <circle cx={13.5*scale} cy={11.5*scale} r={scale*0.55} fill="#ef4444" stroke="#dc2626" strokeWidth="2.5">
            <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite"/>
          </circle>
        </g>

        {/* Player */}
        <g transform={`translate(${player[0]*scale}, ${player[2]*scale})`}>
          <circle r={scale*0.48} fill="#fbbf24" stroke="#fff" strokeWidth="2.5">
            <animate attributeName="r" values={`${scale*0.43};${scale*0.52};${scale*0.43}`} dur="1.5s" repeatCount="indefinite"/>
          </circle>
          <circle r={scale*0.22} fill="#fff" />
        </g>
      </svg>
      <div style={{ color:'#22d3ee', fontSize: sizeKey==='large' ? '0.9rem':'0.75rem', textAlign:'center', marginTop:'0.4rem', fontWeight:'bold' }}>
        📍 Map {sizeKey==='large' ? '(L)' : '(S)'}
      </div>
    </div>
  );
};

/* =================== Scene (enhanced visuals) =================== */
const Scene = () => {
  const decisions = getDecisions();
  const completed = useGameStore(s => s.completedDecisions);
  const [lowPerf, setLowPerf] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;

  return (
    <>
      <PerformanceMonitor onDecline={() => setLowPerf(true)} onIncline={() => setLowPerf(false)} />
      <Sky distance={450000} sunPosition={[100, 70, 100]} inclination={0.35} azimuth={0.25} turbidity={6}/>
      <fog attach="fog" args={['#1a3a1a', 10, 35]} />
      <Player />
      <Lighting lowPerf={lowPerf || isMobile} />
      <Floor />
      <MazeWalls />
      <BreadcrumbTrail />
      <PlayerCharacter />
      <StartMarker />
      <ExitMarker />
      {decisions.map(d => <Checkpoint key={d.id} position={d.position} done={completed.has(d.id)} />)}

      <EffectComposer enableNormalPass={!isMobile && !lowPerf}>
        {!isMobile && !lowPerf && <SSAO radius={0.2} intensity={15} luminanceInfluence={0.4} />}
        <Bloom luminanceThreshold={0.75} luminanceSmoothing={0.9} intensity={lowPerf ? 0.9 : 1.3} />
      </EffectComposer>
    </>
  );
};

/* =================== App =================== */
export default function FinancialMaze3D() {
  const [started, setStarted] = useState(false);
  const { uiScale, isMobile } = useResponsive();

  if (!started) {
    return (
      <div style={{ width:'100vw', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', position:'relative' }}>
        <div style={{
          transform:`scale(${uiScale})`,
          transformOrigin:'center',
          textAlign:'center', color:'#fff', padding:'2rem',
          background:'rgba(0,0,0,0.85)', borderRadius:'1.4rem',
          width:'min(92vw, 52rem)', border:'4px solid #3b82f6',
          boxShadow:'0 0 60px rgba(59,130,246,0.5)'
        }}>
          <h1 style={{
            fontSize:isMobile ? '2.4rem':'4.2rem', fontWeight:'bold', marginBottom:'1rem',
            background:'linear-gradient(135deg,#fbbf24,#d97706)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
          }}>
            💰 Financial Maze 3D
          </h1>
          <p style={{ fontSize:isMobile ? '1.05rem':'1.35rem', marginBottom:'1.2rem', color:'#cbd5e1' }}>
            Make realistic money choices, watch your wallet, and head to EXIT whenever you're ready.
          </p>
          <div style={{ textAlign:'left', margin:'0 auto 1.2rem', background:'rgba(15,23,42,0.7)', padding:'1rem', borderRadius:'0.9rem', border:'2px solid #334155', maxWidth:800 }}>
            <div style={{ fontWeight:'bold', color:'#22d3ee', marginBottom:'0.4rem' }}>What's inside</div>
            <ul style={{ marginLeft:'1rem', lineHeight:1.8, fontSize:isMobile ? '0.95rem':'1.05rem' }}>
              <li>Wallet + Savings + Debt + Risk</li>
              <li>10 checkpoints across multiple paths</li>
              <li>Exit anytime — outcome based on finances</li>
              <li>Enhanced graphics with fog, SSAO, bloom</li>
            </ul>
          </div>
          <button onClick={() => setStarted(true)}
            style={{ padding:isMobile ? '1rem 2.2rem':'1.2rem 3rem', background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'#fff', fontSize:isMobile ? '1.2rem':'1.5rem', fontWeight:'bold', borderRadius:'1rem', border:'none', cursor:'pointer' }}>
            🚀 Start
          </button>
          <div style={{ marginTop:'0.9rem', fontSize:isMobile ? '0.85rem':'0.95rem', color:'#94a3b8', fontStyle:'italic' }}>
            Keys: Arrow/WASD • F flashlight • M minimap
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width:'100vw', height:'100vh', position:'relative', overflow:'hidden' }}>
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false }}
        dpr={[1, window.innerWidth < 900 ? 1.5 : 2]}
      >
        <Scene />
      </Canvas>
      <HUD />
      <Minimap />
    </div>
  );
}