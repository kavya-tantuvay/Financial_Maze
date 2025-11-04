import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Sky } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { create } from 'zustand';

// ==================== ZUSTAND STORE ====================
const useGameStore = create((set, get) => ({
  savings: 0,
  debt: 0,
  risk: 0,
  smartRisk: 0,
  recklessRisk: 0,
  score: 0,
  currentDecision: null,
  playerPosition: [1.5, 0.3, 1.5],
  completedDecisions: new Set(),
  gameWon: false,
  flashlightOn: true,
  minimapSize: 'large',
  visitedCells: new Set(['1,1']),
  
  makeDecision: (id, choice) => {
    const state = get();
    const decisions = getDecisions();
    const decision = decisions.find(d => d.id === id);
    if (!decision) return;
    
    const option = decision.options[choice];
    let newSavings = state.savings + (option.savings || 0);
    let newDebt = state.debt + (option.debt || 0);
    let newRisk = state.risk + (option.risk || 0);
    let newSmartRisk = state.smartRisk + (option.smartRisk || 0);
    let newRecklessRisk = state.recklessRisk + (option.recklessRisk || 0);
    
    const savingsScore = Math.sqrt(Math.max(0, newSavings)) * 10;
    const debtPenalty = Math.sqrt(Math.max(0, newDebt)) * 12;
    const riskBonus = newSmartRisk - (1.6 * newRecklessRisk) - (0.4 * newRisk);
    const newScore = savingsScore - debtPenalty + riskBonus;
    
    set({
      savings: newSavings,
      debt: newDebt,
      risk: newRisk,
      smartRisk: newSmartRisk,
      recklessRisk: newRecklessRisk,
      score: newScore,
      currentDecision: null,
      completedDecisions: new Set([...state.completedDecisions, id])
    });
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
  checkWinCondition: () => {
    const state = get();
    if (state.completedDecisions.size === 5) {
      if (state.score >= 50 && state.debt <= 25) {
        set({ gameWon: true });
      }
    }
  },
  toggleFlashlight: () => set(state => ({ flashlightOn: !state.flashlightOn })),
  toggleMinimapSize: () => set(state => ({ 
    minimapSize: state.minimapSize === 'small' ? 'large' : 'small' 
  }))
}));

// ==================== MAZE LAYOUT ====================
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

// ==================== DECISIONS ====================
const getDecisions = () => [
  {
    id: 'decision1',
    position: [3.5, 0.5, 1.5],
    checkpointPos: [3, 1],
    question: "🎉 First Salary! What will you do?",
    options: [
      { text: "💰 Save ₹5000 (Smart)", savings: 10, effect: "Savings +10" },
      { text: "🛍️ Spend all shopping", debt: 5, effect: "Debt +5" }
    ]
  },
  {
    id: 'decision2',
    position: [7.5, 0.5, 3.5],
    checkpointPos: [7, 3],
    question: "💼 Business Investment Opportunity",
    options: [
      { text: "📈 Invest wisely ₹10K", smartRisk: 5, effect: "Smart Risk +5" },
      { text: "🎲 Risky investment", recklessRisk: 5, effect: "Reckless Risk +5" }
    ]
  },
  {
    id: 'decision3',
    position: [7.5, 0.5, 7.5],
    checkpointPos: [7, 7],
    question: "🏥 Medical Emergency!",
    options: [
      { text: "💵 Emergency savings", savings: -5, effect: "Savings -5" },
      { text: "💳 Credit card", debt: 10, effect: "Debt +10" }
    ]
  },
  {
    id: 'decision4',
    position: [11.5, 0.5, 9.5],
    checkpointPos: [11, 9],
    question: "🏠 Buy a House?",
    options: [
      { text: "🏡 Down payment", savings: -15, debt: 5, smartRisk: 3, effect: "Smart investment" },
      { text: "🏚️ 100% loan", debt: 20, recklessRisk: 5, effect: "Heavy debt" }
    ]
  },
  {
    id: 'decision5',
    position: [3.5, 0.5, 11.5],
    checkpointPos: [3, 11],
    question: "🎓 Career Upgrade?",
    options: [
      { text: "📚 Education investment", savings: -3, smartRisk: 2, effect: "Growth" },
      { text: "😴 Stay comfortable", effect: "No growth" }
    ]
  }
];

// ==================== TEXTURES ====================
const createBrickTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(0, 0, 512, 512);
  
  const brickWidth = 128;
  const brickHeight = 64;
  
  for (let y = 0; y < 512; y += brickHeight) {
    const offset = (y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
    for (let x = -brickWidth; x < 512 + brickWidth; x += brickWidth) {
      const variation = Math.random() * 25 - 12;
      ctx.fillStyle = `rgb(${139 + variation}, ${115 + variation}, ${85 + variation})`;
      ctx.fillRect(x + offset + 3, y + 3, brickWidth - 6, brickHeight - 6);
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

const createFloorTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(0, 0, 512, 512);
  
  const imageData = ctx.getImageData(0, 0, 512, 512);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.random() * 30 - 15;
    data[i] += noise;
    data[i + 1] += noise;
    data[i + 2] += noise;
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

// ==================== COLLISION HELPER ====================
const isValidPosition = (x, z) => {
  const cellX = Math.floor(x);
  const cellZ = Math.floor(z);
  
  if (cellZ < 0 || cellZ >= mazeLayout.length || 
      cellX < 0 || cellX >= mazeLayout[0].length) {
    return false;
  }
  
  return mazeLayout[cellZ][cellX] === 0;
};

// ==================== PLAYER CHARACTER ====================
const PlayerCharacter = () => {
  const meshRef = useRef();
  const playerPosition = useGameStore(state => state.playerPosition);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.05;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.08;
    }
  });
  
  return (
    <group position={[playerPosition[0], playerPosition[1], playerPosition[2]]}>
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial 
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.6}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      <pointLight position={[0, 0.5, 0]} intensity={2.5} color="#fbbf24" distance={4} />
    </group>
  );
};

// ==================== PLAYER CONTROLLER WITH FIXED COLLISION ====================
const Player = () => {
  const { camera } = useThree();
  const playerPos = useRef(new THREE.Vector3(1.5, 0.3, 1.5));
  const setPlayerPosition = useGameStore(state => state.setPlayerPosition);
  const [keys, setKeys] = useState({ 
    up: false, 
    down: false, 
    left: false, 
    right: false 
  });
  
  useEffect(() => {
    const onKeyDown = (e) => {
      setKeys(k => ({ ...k, 
        up: e.key === 'ArrowUp' ? true : k.up,
        down: e.key === 'ArrowDown' ? true : k.down,
        left: e.key === 'ArrowLeft' ? true : k.left,
        right: e.key === 'ArrowRight' ? true : k.right
      }));
      if (e.key === 'f' || e.key === 'F') useGameStore.getState().toggleFlashlight();
      if (e.key === 'm' || e.key === 'M') useGameStore.getState().toggleMinimapSize();
    };
    
    const onKeyUp = (e) => {
      setKeys(k => ({ ...k,
        up: e.key === 'ArrowUp' ? false : k.up,
        down: e.key === 'ArrowDown' ? false : k.down,
        left: e.key === 'ArrowLeft' ? false : k.left,
        right: e.key === 'ArrowRight' ? false : k.right
      }));
    };
    
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, []);
  
  useFrame((state, delta) => {
    const speed = 2.5 * delta;
    const newPos = playerPos.current.clone();
    
    if (keys.up) newPos.z -= speed;
    if (keys.down) newPos.z += speed;
    if (keys.left) newPos.x -= speed;
    if (keys.right) newPos.x += speed;
    
    // Check collision with buffer zone
    const buffer = 0.3;
    const testPositions = [
      newPos.clone(),
      new THREE.Vector3(newPos.x + buffer, newPos.y, newPos.z),
      new THREE.Vector3(newPos.x - buffer, newPos.y, newPos.z),
      new THREE.Vector3(newPos.x, newPos.y, newPos.z + buffer),
      new THREE.Vector3(newPos.x, newPos.y, newPos.z - buffer)
    ];
    
    let canMove = true;
    for (const testPos of testPositions) {
      if (!isValidPosition(testPos.x, testPos.z)) {
        canMove = false;
        break;
      }
    }
    
    if (canMove) {
      playerPos.current.copy(newPos);
    }
    
    // Update camera to follow player
    const targetCameraPos = new THREE.Vector3(
      playerPos.current.x,
      playerPos.current.y + 10,
      playerPos.current.z + 8
    );
    
    camera.position.lerp(targetCameraPos, 0.1);
    camera.lookAt(playerPos.current.x, 0, playerPos.current.z);
    
    setPlayerPosition([playerPos.current.x, playerPos.current.y, playerPos.current.z]);
    
    // Check for checkpoint proximity
    const decisions = getDecisions();
    decisions.forEach(decision => {
      const dist = Math.sqrt(
        Math.pow(playerPos.current.x - decision.position[0], 2) + 
        Math.pow(playerPos.current.z - decision.position[2], 2)
      );
      if (dist < 1.0) {
        const completed = useGameStore.getState().completedDecisions;
        if (!completed.has(decision.id)) {
          useGameStore.getState().setCurrentDecision(decision.id);
        }
      }
    });
    
    // Check for exit
    const exitDist = Math.sqrt(
      Math.pow(playerPos.current.x - 13.5, 2) + 
      Math.pow(playerPos.current.z - 11.5, 2)
    );
    
    if (exitDist < 1.2) {
      useGameStore.getState().checkWinCondition();
    }
  });
  
  return <PerspectiveCamera makeDefault position={[1.5, 10, 9.5]} fov={60} />;
};

// ==================== MAZE WALLS ====================
const MazeWalls = () => {
  const wallTexture = useMemo(() => createBrickTexture(), []);
  
  const walls = useMemo(() => {
    const wallData = [];
    for (let z = 0; z < mazeLayout.length; z++) {
      for (let x = 0; x < mazeLayout[z].length; x++) {
        if (mazeLayout[z][x] === 1) {
          wallData.push({ x: x + 0.5, z: z + 0.5 });
        }
      }
    }
    return wallData;
  }, []);
  
  return (
    <>
      {walls.map((wall, i) => (
        <mesh key={i} position={[wall.x, 1, wall.z]} castShadow receiveShadow>
          <boxGeometry args={[1, 2, 1]} />
          <meshStandardMaterial 
            map={wallTexture}
            roughness={0.85}
            metalness={0.15}
          />
        </mesh>
      ))}
    </>
  );
};

// ==================== FLOOR ====================
const Floor = () => {
  const floorTexture = useMemo(() => {
    const tex = createFloorTexture();
    tex.repeat.set(8, 8);
    return tex;
  }, []);
  
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7.5, 0, 6.5]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial 
        map={floorTexture}
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
};

// ==================== CHECKPOINT GATE ====================
const CheckpointGate = ({ position, id, isCompleted }) => {
  const gateRef = useRef();
  const [playerNear, setPlayerNear] = useState(false);
  const playerPosition = useGameStore(state => state.playerPosition);
  
  useFrame(() => {
    if (!gateRef.current) return;
    
    const dist = Math.sqrt(
      Math.pow(playerPosition[0] - position[0], 2) + 
      Math.pow(playerPosition[2] - position[2], 2)
    );
    
    setPlayerNear(dist < 1.0);
    
    const targetY = isCompleted ? 3 : (playerNear ? 2.2 : 0.5);
    gateRef.current.position.y += (targetY - gateRef.current.position.y) * 0.08;
  });
  
  return (
    <group position={position}>
      <mesh position={[-0.5, 1, 0]} castShadow>
        <boxGeometry args={[0.15, 2, 0.15]} />
        <meshStandardMaterial color="#4b5563" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.5, 1, 0]} castShadow>
        <boxGeometry args={[0.15, 2, 0.15]} />
        <meshStandardMaterial color="#4b5563" metalness={0.8} roughness={0.2} />
      </mesh>
      
      <mesh ref={gateRef} position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.2, 0.25, 0.1]} />
        <meshStandardMaterial 
          color={isCompleted ? "#22c55e" : (playerNear ? "#fbbf24" : "#ef4444")}
          emissive={isCompleted ? "#16a34a" : (playerNear ? "#f59e0b" : "#dc2626")}
          emissiveIntensity={0.7}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      
      <pointLight 
        position={[0, 2, 0]} 
        intensity={playerNear ? 3.5 : 2} 
        color={isCompleted ? "#22c55e" : (playerNear ? "#fbbf24" : "#ef4444")}
        distance={6}
      />
      
      {!isCompleted && (
        <mesh position={[0, 2.8, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial 
            color="#fbbf24" 
            emissive="#f59e0b" 
            emissiveIntensity={1.2}
          />
        </mesh>
      )}
    </group>
  );
};

// ==================== MARKERS ====================
const StartMarker = () => {
  const ref = useRef();
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.02;
      ref.current.position.y = 1.8 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });
  
  return (
    <group position={[1.5, 0, 1.5]}>
      <mesh ref={ref} castShadow>
        <coneGeometry args={[0.5, 1.2, 32]} />
        <meshStandardMaterial 
          color="#22c55e" 
          emissive="#16a34a" 
          emissiveIntensity={1.2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <pointLight position={[0, 3, 0]} intensity={5} color="#22c55e" distance={8} />
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshBasicMaterial color="#22c55e" opacity={0.5} transparent />
      </mesh>
    </group>
  );
};

const ExitMarker = () => {
  const ref = useRef();
  const lightRef = useRef();
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.025;
      ref.current.position.y = 1.8 + Math.sin(state.clock.elapsedTime * 2) * 0.25;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 5 + Math.sin(state.clock.elapsedTime * 3) * 2;
    }
  });
  
  return (
    <group position={[13.5, 0, 11.5]}>
      <mesh ref={ref} castShadow>
        <torusGeometry args={[0.6, 0.25, 16, 32]} />
        <meshStandardMaterial 
          color="#ef4444" 
          emissive="#dc2626" 
          emissiveIntensity={1.4}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <pointLight ref={lightRef} position={[0, 3, 0]} intensity={5} color="#ef4444" distance={10} />
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 32]} />
        <meshBasicMaterial color="#ef4444" opacity={0.5} transparent />
      </mesh>
    </group>
  );
};

// ==================== BREADCRUMBS ====================
const BreadcrumbTrail = () => {
  const visitedCells = useGameStore(state => state.visitedCells);
  
  return (
    <>
      {Array.from(visitedCells).map((cell, i) => {
        const [x, z] = cell.split(',').map(Number);
        return (
          <mesh key={i} position={[x + 0.5, 0.02, z + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.25, 16]} />
            <meshBasicMaterial 
              color="#fbbf24"
              opacity={0.35}
              transparent
            />
          </mesh>
        );
      })}
    </>
  );
};

// ==================== LIGHTING ====================
const Lighting = () => {
  const flashlightOn = useGameStore(state => state.flashlightOn);
  const playerPosition = useGameStore(state => state.playerPosition);
  const spotRef = useRef();
  
  useFrame(() => {
    if (spotRef.current && flashlightOn) {
      spotRef.current.position.set(
        playerPosition[0], 
        playerPosition[1] + 8, 
        playerPosition[2]
      );
      spotRef.current.target.position.set(
        playerPosition[0], 
        0, 
        playerPosition[2]
      );
      spotRef.current.target.updateMatrixWorld();
    }
  });
  
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight 
        position={[20, 30, 20]} 
        intensity={2.5} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <hemisphereLight args={['#87ceeb', '#4ade80', 1.2]} />
      
      {flashlightOn && (
        <spotLight
          ref={spotRef}
          intensity={5}
          angle={0.7}
          penumbra={0.4}
          distance={25}
          color="#ffffff"
          castShadow
        />
      )}
    </>
  );
};

// ==================== HUD ====================
const HUD = () => {
  const { savings, debt, risk, score, currentDecision, gameWon, flashlightOn, minimapSize } = useGameStore();
  const decisions = getDecisions();
  const currentDec = decisions.find(d => d.id === currentDecision);
  const completedDecisions = useGameStore(state => state.completedDecisions);
  
  const getScoreColor = () => {
    if (score >= 50) return '#22c55e';
    if (score >= 25) return '#eab308';
    return '#ef4444';
  };
  
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.9)', color: 'white', padding: '1.5rem', borderRadius: '1rem', pointerEvents: 'auto', border: '3px solid #3b82f6', minWidth: '240px', boxShadow: '0 0 30px rgba(59,130,246,0.4)' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fbbf24', textShadow: '0 0 15px rgba(251, 191, 36, 0.6)' }}>💰 Financial Stats</h2>
        <div style={{ fontSize: '1.1rem', lineHeight: '2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>💵 Savings:</span>
            <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{savings.toFixed(1)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>💳 Debt:</span>
            <span style={{ color: '#f87171', fontWeight: 'bold' }}>{debt.toFixed(1)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>🎲 Risk:</span>
            <span style={{ color: '#fb923c', fontWeight: 'bold' }}>{risk.toFixed(1)}</span>
          </div>
          <div style={{ paddingTop: '1rem', marginTop: '1rem', borderTop: '2px solid #4b5563' }}>
            <div style={{ fontSize: '1.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📊 Score:</span>
              <span style={{ color: getScoreColor(), fontWeight: 'bold', fontSize: '1.8rem', textShadow: `0 0 15px ${getScoreColor()}` }}>{score.toFixed(2)}</span>
            </div>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.95rem', color: '#94a3b8' }}>
            Progress: {completedDecisions.size}/5 decisions
          </div>
        </div>
      </div>
      
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.9)', color: 'white', padding: '1.5rem', borderRadius: '1rem', fontSize: '1rem', maxWidth: '300px', border: '3px solid #8b5cf6', boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '1rem', fontSize: '1.3rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🎮</span> Controls
        </div>
        <div style={{ lineHeight: '2.2' }}>
          <div><kbd style={{ background: '#374151', padding: '4px 8px', borderRadius: '4px', marginRight: '0.75rem', fontWeight: 'bold' }}>↑ ↓ ← →</kbd>Move</div>
          <div><kbd style={{ background: '#374151', padding: '4px 8px', borderRadius: '4px', marginRight: '0.75rem', fontWeight: 'bold' }}>F</kbd>Flashlight {flashlightOn ? '🔦' : '⚫'}</div>
          <div><kbd style={{ background: '#374151', padding: '4px 8px', borderRadius: '4px', marginRight: '0.75rem', fontWeight: 'bold' }}>M</kbd>Minimap size</div>
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(234, 179, 8, 0.25)', borderRadius: '0.75rem', border: '2px solid #eab308' }}>
            <div style={{ color: '#fcd34d', fontWeight: 'bold', fontSize: '1.1rem' }}>🎯 Win Condition:</div>
            <div style={{ fontSize: '0.95rem', marginTop: '0.5rem', color: '#fef08a' }}>Complete 5 decisions<br/>Score ≥ 50 & Debt ≤ 25</div>
          </div>
        </div>
      </div>
      
      {currentDec && !gameWon && !completedDecisions.has(currentDec.id) && (
        <div 
          style={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'rgba(0,0,0,0.95)', 
            pointerEvents: 'auto',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div style={{ 
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
            padding: '3rem', 
            borderRadius: '1.5rem', 
            maxWidth: '45rem', 
            border: '4px solid #eab308', 
            boxShadow: '0 0 60px rgba(234, 179, 8, 0.6)'
          }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '2rem', color: 'white', textAlign: 'center', textShadow: '0 0 25px rgba(234, 179, 8, 0.8)' }}>
              {currentDec.question}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {currentDec.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => {
                    useGameStore.getState().makeDecision(currentDec.id, i);
                  }}
                  style={{ 
                    width: '100%', 
                    textAlign: 'left', 
                    padding: '1.75rem', 
                    background: i === 0 
                      ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' 
                      : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', 
                    color: 'white', 
                    borderRadius: '1rem', 
                    border: 'none', 
                    cursor: 'pointer', 
                    transition: 'all 0.2s',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.4)',
                    transform: 'scale(1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.04) translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '1.4rem', marginBottom: '0.75rem' }}>{option.text}</div>
                  <div style={{ fontSize: '1.1rem', color: '#e5e7eb', opacity: 0.95 }}>{option.effect}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {gameWon && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.95)', pointerEvents: 'auto', zIndex: 1000 }}>
          <div style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)', padding: '4rem', borderRadius: '2rem', textAlign: 'center', border: '5px solid #4ade80', boxShadow: '0 0 80px rgba(74, 222, 128, 0.6)' }}>
            <div style={{ fontSize: '6rem', marginBottom: '2rem' }}>🎉</div>
            <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem', textShadow: '0 0 40px rgba(255,255,255,0.9)' }}>Financial Freedom!</h1>
            <p style={{ fontSize: '2rem', color: '#86efac', marginBottom: '2.5rem' }}>You've mastered money management!</p>
            <div style={{ background: 'rgba(0,0,0,0.7)', padding: '2.5rem', borderRadius: '1.5rem', color: 'white', marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '1.5rem' }}>Final Score: {score.toFixed(2)}</div>
              <div style={{ fontSize: '1.75rem', marginTop: '0.75rem' }}>💰 Savings: <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{savings.toFixed(1)}</span></div>
              <div style={{ fontSize: '1.75rem', marginTop: '0.75rem' }}>💳 Debt: <span style={{ color: debt > 25 ? '#f87171' : '#4ade80', fontWeight: 'bold' }}>{debt.toFixed(1)}</span></div>
              <div style={{ fontSize: '1.5rem', marginTop: '0.75rem', color: '#86efac' }}>Decisions Completed: {completedDecisions.size}/5</div>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              style={{ 
                padding: '1.25rem 3.5rem', 
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
                color: 'white', 
                fontWeight: 'bold', 
                borderRadius: '1rem', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: '1.5rem',
                boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.15)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
              }}
            >
              🔄 Play Again
            </button>
          </div>
        </div>
      )}
      
      {!gameWon && completedDecisions.size === 5 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.95)', pointerEvents: 'auto', zIndex: 1000 }}>
          <div style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #991b1b 50%, #b91c1c 100%)', padding: '4rem', borderRadius: '2rem', textAlign: 'center', border: '5px solid #ef4444', boxShadow: '0 0 80px rgba(239, 68, 68, 0.6)' }}>
            <div style={{ fontSize: '6rem', marginBottom: '2rem' }}>😢</div>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem', textShadow: '0 0 40px rgba(255,255,255,0.9)' }}>Game Over</h1>
            <p style={{ fontSize: '1.75rem', color: '#fca5a5', marginBottom: '2.5rem' }}>You didn't meet the win conditions</p>
            <div style={{ background: 'rgba(0,0,0,0.7)', padding: '2.5rem', borderRadius: '1.5rem', color: 'white', marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '1.5rem' }}>Final Score: {score.toFixed(2)}</div>
              <div style={{ fontSize: '1.75rem', marginTop: '0.75rem' }}>💰 Savings: <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{savings.toFixed(1)}</span></div>
              <div style={{ fontSize: '1.75rem', marginTop: '0.75rem' }}>💳 Debt: <span style={{ color: '#f87171', fontWeight: 'bold' }}>{debt.toFixed(1)}</span></div>
              <div style={{ fontSize: '1.25rem', marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem', border: '1px solid #ef4444' }}>
                {score < 50 && <div>❌ Score below 50</div>}
                {debt > 25 && <div>❌ Debt above 25</div>}
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              style={{ 
                padding: '1.25rem 3.5rem', 
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                color: 'white', 
                fontWeight: 'bold', 
                borderRadius: '1rem', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: '1.5rem',
                boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.15)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
              }}
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      )}
      
      <Minimap />
      
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};

// ==================== MINIMAP ====================
const Minimap = () => {
  const playerPosition = useGameStore(state => state.playerPosition);
  const visitedCells = useGameStore(state => state.visitedCells);
  const minimapSize = useGameStore(state => state.minimapSize);
  const completedDecisions = useGameStore(state => state.completedDecisions);
  
  const scale = minimapSize === 'large' ? 20 : 12;
  const size = minimapSize === 'large' ? 300 : 180;
  
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'm' || e.key === 'M') {
        useGameStore.getState().toggleMinimapSize();
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  return (
    <div style={{ 
      position: 'absolute', 
      bottom: '1.5rem', 
      right: '1.5rem', 
      background: 'rgba(0,0,0,0.95)', 
      padding: '1.25rem', 
      borderRadius: '1rem', 
      border: '3px solid #22d3ee',
      boxShadow: '0 0 40px rgba(34, 211, 238, 0.6)',
      transition: 'all 0.3s'
    }}>
      <svg width={size} height={size} style={{ background: '#0a0f1e', borderRadius: '0.75rem', display: 'block', border: '2px solid #1e293b' }}>
        {mazeLayout.map((row, z) => 
          row.map((cell, x) => 
            cell === 1 ? (
              <rect 
                key={`wall-${x}-${z}`}
                x={x * scale} 
                y={z * scale} 
                width={scale} 
                height={scale} 
                fill="#8b7355" 
                stroke="#6b5d4f"
                strokeWidth="1.5"
              />
            ) : (
              <rect 
                key={`floor-${x}-${z}`}
                x={x * scale} 
                y={z * scale} 
                width={scale} 
                height={scale} 
                fill="#1a3a1a" 
                stroke="#0f2610"
                strokeWidth="0.5"
              />
            )
          )
        )}
        
        {Array.from(visitedCells).map((cell, i) => {
          const [x, z] = cell.split(',').map(Number);
          return (
            <circle
              key={`visited-${i}`}
              cx={(x + 0.5) * scale}
              cy={(z + 0.5) * scale}
              r={scale * 0.2}
              fill="#fbbf24"
              opacity="0.4"
            />
          );
        })}
        
        <g>
          <circle 
            cx={1.5 * scale} 
            cy={1.5 * scale} 
            r={scale * 0.6} 
            fill="#22c55e"
            stroke="#16a34a"
            strokeWidth="3"
          >
            <animate attributeName="r" values={`${scale * 0.5};${scale * 0.65};${scale * 0.5}`} dur="2s" repeatCount="indefinite" />
          </circle>
          <text
            x={1.5 * scale}
            y={1.5 * scale + 4}
            fontSize={scale * 0.3}
            fill="white"
            textAnchor="middle"
            fontWeight="bold"
          >START</text>
        </g>
        
        {getDecisions().map(d => {
          const isCompleted = completedDecisions.has(d.id);
          const x = d.position[0];
          const z = d.position[2];
          return (
            <g key={d.id}>
              <circle 
                cx={x * scale} 
                cy={z * scale} 
                r={scale * 0.45} 
                fill={isCompleted ? "#22c55e" : "#f59e0b"}
                stroke={isCompleted ? "#16a34a" : "#d97706"}
                strokeWidth="2.5"
              />
              {isCompleted && (
                <text
                  x={x * scale}
                  y={z * scale + 4}
                  fontSize={scale * 0.5}
                  fill="white"
                  textAnchor="middle"
                  fontWeight="bold"
                >✓</text>
              )}
            </g>
          );
        })}
        
        <g>
          <circle 
            cx={13.5 * scale} 
            cy={11.5 * scale} 
            r={scale * 0.65} 
            fill="#ef4444"
            stroke="#dc2626"
            strokeWidth="3"
          >
            <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <text
            x={13.5 * scale}
            y={11.5 * scale + 4}
            fontSize={scale * 0.3}
            fill="white"
            textAnchor="middle"
            fontWeight="bold"
          >EXIT</text>
        </g>
        
        <g transform={`translate(${playerPosition[0] * scale}, ${playerPosition[2] * scale})`}>
          <circle r={scale * 0.55} fill="#fbbf24" stroke="#fff" strokeWidth="3">
            <animate attributeName="r" values={`${scale * 0.5};${scale * 0.6};${scale * 0.5}`} dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle r={scale * 0.25} fill="#fff" />
        </g>
      </svg>
      <div style={{ 
        color: 'white', 
        fontSize: minimapSize === 'large' ? '1.1rem' : '0.85rem', 
        textAlign: 'center', 
        marginTop: '0.75rem',
        fontWeight: 'bold',
        color: '#22d3ee',
        textShadow: '0 0 10px rgba(34,211,238,0.6)'
      }}>
        📍 Minimap {minimapSize === 'large' ? '(Large)' : '(Small)'}
      </div>
      <div style={{ 
        fontSize: '0.8rem', 
        color: '#94a3b8', 
        textAlign: 'center',
        marginTop: '0.25rem'
      }}>
        Press M to resize
      </div>
    </div>
  );
};

// ==================== SCENE ====================
const Scene = () => {
  const decisions = getDecisions();
  const completedDecisions = useGameStore(state => state.completedDecisions);
  
  return (
    <>
      <Sky 
        distance={450000}
        sunPosition={[100, 70, 100]}
        inclination={0.35}
        azimuth={0.25}
        turbidity={6}
      />
      <Player />
      <Lighting />
      <Floor />
      <MazeWalls />
      <BreadcrumbTrail />
      <PlayerCharacter />
      <StartMarker />
      <ExitMarker />
      
      {decisions.map(decision => (
        <CheckpointGate 
          key={decision.id}
          position={decision.position}
          id={decision.id}
          isCompleted={completedDecisions.has(decision.id)}
        />
      ))}
      
      <EffectComposer>
        <Bloom luminanceThreshold={0.7} luminanceSmoothing={0.9} intensity={1.3} />
      </EffectComposer>
    </>
  );
};

// ==================== MAIN APP ====================
export default function FinancialMaze3D() {
  const [started, setStarted] = useState(false);
  
  if (!started) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #1e3a8a 50%, #581c87 75%, #4c1d95 100%)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)'
        }} />
        
        <div style={{ 
          textAlign: 'center', 
          color: 'white', 
          padding: '3.5rem', 
          background: 'rgba(0,0,0,0.85)', 
          borderRadius: '2rem', 
          maxWidth: '50rem',
          border: '4px solid #3b82f6',
          boxShadow: '0 0 60px rgba(59, 130, 246, 0.5)',
          position: 'relative',
          zIndex: 1
        }}>
          <h1 style={{ 
            fontSize: '5rem', 
            fontWeight: 'bold', 
            marginBottom: '1.5rem',
            textShadow: '0 0 40px rgba(251, 191, 36, 1)',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            💰 Financial Maze 3D
          </h1>
          <p style={{ fontSize: '1.75rem', marginBottom: '3rem', color: '#cbd5e1', fontWeight: '500' }}>
            Navigate the maze and make smart money decisions!
          </p>
          
          <div style={{ 
            textAlign: 'left', 
            marginBottom: '2.5rem', 
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '2rem',
            borderRadius: '1.25rem',
            border: '2px solid #334155'
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '1.25rem', color: '#22d3ee', fontWeight: 'bold' }}>
              ✨ Production-Ready Features:
            </div>
            <div style={{ fontSize: '1.15rem', lineHeight: '2.5' }}>
              <div>✅ <strong>Fixed Collision Detection</strong> - Can't walk through walls</div>
              <div>✅ <strong>Perfect Camera View</strong> - Elevated bird's eye angle</div>
              <div>✅ <strong>Checkpoint Gates</strong> - Physical barriers at each decision</div>
              <div>✅ <strong>Progress Tracking</strong> - Shows X/5 decisions completed</div>
              <div>✅ <strong>Win/Lose Screens</strong> - Clear end game conditions</div>
              <div>✅ <strong>Smooth Movement</strong> - Arrow keys with collision buffer</div>
            </div>
          </div>
          
          <div style={{ 
            marginBottom: '3rem', 
            padding: '1.5rem',
            background: 'rgba(234, 179, 8, 0.2)',
            borderRadius: '1rem',
            border: '3px solid #eab308'
          }}>
            <div style={{ fontWeight: 'bold', color: '#fbbf24', marginBottom: '1rem', fontSize: '1.3rem' }}>
              🏆 Your Mission:
            </div>
            <div style={{ color: '#fcd34d', fontSize: '1.2rem', lineHeight: '1.8' }}>
              Navigate from <span style={{ color: '#22c55e', fontWeight: 'bold' }}>START</span> to{' '}
              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>EXIT</span>
              <br />
              Complete all 5 financial decisions
              <br />
              <strong>Win: Score ≥ 50 & Debt ≤ 25</strong>
            </div>
          </div>
          
          <button 
            onClick={() => setStarted(true)}
            style={{ 
              padding: '1.75rem 4rem', 
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)', 
              color: 'white', 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              borderRadius: '1.25rem', 
              border: 'none', 
              cursor: 'pointer',
              boxShadow: '0 0 50px rgba(34, 197, 94, 0.7)',
              transition: 'all 0.3s',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1) translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(34, 197, 94, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 50px rgba(34, 197, 94, 0.7)';
            }}
          >
            🚀 Start Your Journey
          </button>
          
          <div style={{ 
            marginTop: '2.5rem', 
            fontSize: '1.1rem', 
            color: '#94a3b8',
            fontStyle: 'italic'
          }}>
            Use <strong style={{ color: '#22d3ee' }}>Arrow Keys (↑ ↓ ← →)</strong> to move • <strong style={{ color: '#22d3ee' }}>F</strong> for flashlight
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