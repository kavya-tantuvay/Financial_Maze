import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Sky, PerformanceMonitor } from '@react-three/drei';
import { EffectComposer, Bloom, SSAO, DepthOfField, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { create } from 'zustand';

/* =================== Audio System =================== */
const AudioSystem = {
  bgMusic: null,
  sounds: {},
  audioContext: null,
  bgOscillators: [],
  bgInterval: null,
  
  init() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    this.createSound = (type, frequency, duration) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    };
    
    this.sounds = {
      gameStart: () => {
        this.createSound('sine', 523.25, 0.3);
        setTimeout(() => this.createSound('sine', 659.25, 0.3), 100);
        setTimeout(() => this.createSound('sine', 783.99, 0.5), 200);
      },
      checkpoint: () => {
        this.createSound('sine', 880, 0.15);
        setTimeout(() => this.createSound('sine', 1046.5, 0.2), 80);
      },
      decision: () => {
        this.createSound('triangle', 440, 0.1);
        setTimeout(() => this.createSound('triangle', 554.37, 0.15), 60);
      },
      buttonClick: () => {
        this.createSound('square', 800, 0.05);
      },
      win: () => {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          setTimeout(() => this.createSound('sine', freq, 0.3), i * 100);
        });
      },
      lose: () => {
        [440, 392, 349.23, 293.66].forEach((freq, i) => {
          setTimeout(() => this.createSound('sawtooth', freq, 0.25), i * 100);
        });
      },
      exitReached: () => {
        this.createSound('sine', 659.25, 0.2);
        setTimeout(() => this.createSound('sine', 783.99, 0.3), 100);
      }
    };
  },
  
  play(soundName) {
    if (this.sounds[soundName]) {
      try {
        this.sounds[soundName]();
      } catch (e) {
        console.log('Audio play failed:', e);
      }
    }
  },
  
  startBgMusic() {
    if (this.bgInterval) return; // Already playing
    
    try {
      // Upbeat melody inspired by Super Mario / Subway Surfer
      // Fast-paced, energetic 8-bit style melody
      const melody = [
        // Main theme (catchy, upbeat)
        {note: 659.25, duration: 0.15}, // E
        {note: 659.25, duration: 0.15}, // E
        {note: 0, duration: 0.15},      // rest
        {note: 659.25, duration: 0.15}, // E
        {note: 0, duration: 0.15},      // rest
        {note: 523.25, duration: 0.15}, // C
        {note: 659.25, duration: 0.15}, // E
        {note: 0, duration: 0.15},      // rest
        {note: 783.99, duration: 0.15}, // G
        {note: 0, duration: 0.45},      // rest
        {note: 392.00, duration: 0.15}, // G (lower)
        {note: 0, duration: 0.45},      // rest
        
        // Second phrase
        {note: 523.25, duration: 0.15}, // C
        {note: 0, duration: 0.30},      // rest
        {note: 392.00, duration: 0.15}, // G
        {note: 0, duration: 0.30},      // rest
        {note: 329.63, duration: 0.15}, // E
        {note: 0, duration: 0.30},      // rest
        {note: 440.00, duration: 0.15}, // A
        {note: 0, duration: 0.15},      // rest
        {note: 493.88, duration: 0.15}, // B
        {note: 0, duration: 0.15},      // rest
        {note: 466.16, duration: 0.15}, // Bb
        {note: 440.00, duration: 0.15}, // A
        {note: 0, duration: 0.15},      // rest
        
        // Third phrase (ascending)
        {note: 392.00, duration: 0.2},  // G
        {note: 659.25, duration: 0.2},  // E
        {note: 783.99, duration: 0.2},  // G
        {note: 880.00, duration: 0.15}, // A
        {note: 0, duration: 0.15},      // rest
        {note: 698.46, duration: 0.15}, // F
        {note: 783.99, duration: 0.15}, // G
        {note: 0, duration: 0.15},      // rest
        {note: 659.25, duration: 0.15}, // E
        {note: 0, duration: 0.15},      // rest
        {note: 523.25, duration: 0.15}, // C
        {note: 587.33, duration: 0.15}, // D
        {note: 493.88, duration: 0.15}, // B
        {note: 0, duration: 0.30},      // rest
      ];
      
      let noteIndex = 0;
      const masterGain = this.audioContext.createGain();
      masterGain.gain.value = 0.12; // Slightly louder for upbeat feel
      masterGain.connect(this.audioContext.destination);
      
      const playNote = () => {
        const currentNote = melody[noteIndex];
        noteIndex = (noteIndex + 1) % melody.length;
        
        if (currentNote.note > 0) {
          // Main melody
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          
          osc.type = 'square'; // 8-bit style square wave
          osc.frequency.value = currentNote.note;
          
          gain.gain.value = 0.3;
          gain.gain.exponentialRampToValueAtTime(0.01, 
            this.audioContext.currentTime + currentNote.duration);
          
          osc.connect(gain);
          gain.connect(masterGain);
          
          osc.start();
          osc.stop(this.audioContext.currentTime + currentNote.duration);
          
          // Add bass note (octave lower) for depth
          const bassOsc = this.audioContext.createOscillator();
          const bassGain = this.audioContext.createGain();
          
          bassOsc.type = 'triangle';
          bassOsc.frequency.value = currentNote.note / 2;
          
          bassGain.gain.value = 0.15;
          bassGain.gain.exponentialRampToValueAtTime(0.01, 
            this.audioContext.currentTime + currentNote.duration);
          
          bassOsc.connect(bassGain);
          bassGain.connect(masterGain);
          
          bassOsc.start();
          bassOsc.stop(this.audioContext.currentTime + currentNote.duration);
        }
        
        // Schedule next note
        this.bgInterval = setTimeout(playNote, currentNote.duration * 1000);
      };
      
      playNote();
      
    } catch (e) {
      console.log('Background music failed:', e);
    }
  },
  
  stopBgMusic() {
    if (this.bgInterval) {
      clearTimeout(this.bgInterval);
      this.bgInterval = null;
    }
    this.bgOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch(e) {}
    });
    this.bgOscillators = [];
  }
};

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
  wallet: 20, savings: 0, debt: 0, risk: 0, smartRisk: 0, recklessRisk: 0,
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
  cameraMode: 'follow',

  makeDecision: (id, choice) => {
    AudioSystem.play('buttonClick');
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
    AudioSystem.play('exitReached');
    const s = get();
    const win = (s.score >= 40 && s.debt <= 20) || (s.savings >= 15 && s.wallet >= 10 && s.recklessRisk <= 8);
    setTimeout(() => {
      AudioSystem.play(win ? 'win' : 'lose');
    }, 500);
    set({ gameEnded: true, gameWon: win });
  },

  setCurrentDecision: (id) => {
    AudioSystem.play('decision');
    set({ currentDecision: id });
  },
  clearCurrentDecision: () => set({ currentDecision: null }),
  setPlayerPosition: (pos) => {
    const cellKey = `${Math.floor(pos[0])},${Math.floor(pos[2])}`;
    set(state => ({ playerPosition: pos, visitedCells: new Set([...state.visitedCells, cellKey]) }));
  },

  toggleFlashlight: () => {
    AudioSystem.play('buttonClick');
    set(s => ({ flashlightOn: !s.flashlightOn }));
  },
  toggleMinimapSize: () => {
    AudioSystem.play('buttonClick');
    set(s => ({ minimapSize: s.minimapSize === 'small' ? 'large' : 'small' }));
  },
  cycleCameraMode: () => {
    AudioSystem.play('buttonClick');
    set(s => {
      const modes = ['follow', 'firstPerson', 'birds'];
      const idx = modes.indexOf(s.cameraMode);
      return { cameraMode: modes[(idx + 1) % modes.length] };
    });
  },
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

/* =================== Decisions =================== */
const getDecisions = () => [
  { id:'salary1', position:[3.5,0.5,1.5], question:'🎉 First salary!', options:[
      { text:'Save ₹8k + small treat', savings:8, wallet:-1, smartRisk:1, effect:'Savings +8, Wallet -1' },
      { text:'Weekend shopping spree', wallet:-6, debt:4, recklessRisk:2, effect:'Wallet -6, Debt +4' }
  ]},
  { id:'budget1', position:[6.5,0.5,1.5], question:'📋 Set a monthly budget?', options:[
      { text:'Use 50-30-20 rule', savings:4, smartRisk:1, effect:'Savings +4' },
      { text:'No plan, just vibes', debt:2, recklessRisk:2, effect:'Debt +2' }
  ]},
  { id:'insurance1', position:[9.5,0.5,1.5], question:'🩺 Buy health insurance?', options:[
      { text:'Yes (annual premium)', wallet:-3, smartRisk:2, effect:'Wallet -3, Smart +2' },
      { text:'Skip it', recklessRisk:3, effect:'Reckless +3' }
  ]},
  { id:'invest1', position:[5.5,0.5,3.5], question:'📈 Start SIP in index fund?', options:[
      { text:'Start ₹2k/month', savings:6, smartRisk:3, wallet:-2, effect:'Savings +6 (future), Wallet -2' },
      { text:'Hype crypto buy', recklessRisk:4, risk:2, wallet:-3, effect:'Reckless +4, Wallet -3' }
  ]},
  { id:'skill1', position:[11.5,0.5,3.5], question:'🎓 Online course to upskill', options:[
      { text:'Enroll (₹2k)', wallet:-2, savings:2, smartRisk:1, effect:'Wallet -2, Savings +2 (career)' },
      { text:'Skip for now', effect:'No change' }
  ]},
  { id:'loan1', position:[5.5,0.5,5.5], question:'📱 EMI temptation for a gadget', options:[
      { text:'Wait & save', savings:3, effect:'Savings +3' },
      { text:'Buy on EMI', debt:8, recklessRisk:3, effect:'Debt +8' }
  ]},
  { id:'sidegig1', position:[9.5,0.5,5.5], question:'🧰 Weekend side-gig', options:[
      { text:'Take it', wallet:6, smartRisk:1, effect:'Wallet +6' },
      { text:'Skip this month', effect:'No change' }
  ]},
  { id:'rent1', position:[10.5,0.5,7.5], question:'🏠 Rent increase', options:[
      { text:'Negotiate -₹1k', wallet:1, smartRisk:1, effect:'Wallet +1' },
      { text:'Accept increase', wallet:-1, effect:'Wallet -1' }
  ]},
  { id:'medical1', position:[3.5,0.5,7.5], question:'🏥 Medical expense', options:[
      { text:'Use emergency fund', savings:-3, effect:'Savings -3' },
      { text:'Swipe credit card', debt:6, effect:'Debt +6' }
  ]},
  { id:'vacation1', position:[5.5,0.5,11.5], question:'✈️ Vacation plan?', options:[
      { text:'Budget trip', wallet:-2, effect:'Wallet -2' },
      { text:'Luxury trip on EMI', debt:10, recklessRisk:3, effect:'Debt +10' }
  ]},
];

/* =================== Advanced Textures (Procedural) =================== */
const createRealisticBrickTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  const baseColors = ['#7a6a5a', '#8b7a6a', '#6a5a4a', '#9a8a7a'];
  ctx.fillStyle = baseColors[0];
  ctx.fillRect(0, 0, 1024, 1024);
  
  const bw = 256, bh = 128;
  for (let y = 0; y < 1024; y += bh) {
    const off = (y / bh) % 2 === 0 ? 0 : bw / 2;
    for (let x = -bw; x < 1024 + bw; x += bw) {
      const baseColor = baseColors[Math.floor(Math.random() * baseColors.length)];
      const variation = Math.random() * 40 - 20;
      
      const r = parseInt(baseColor.slice(1,3), 16);
      const g = parseInt(baseColor.slice(3,5), 16);
      const b = parseInt(baseColor.slice(5,7), 16);
      
      ctx.fillStyle = `rgb(${r + variation}, ${g + variation}, ${b + variation})`;
      ctx.fillRect(x + off + 4, y + 4, bw - 8, bh - 8);
      
      for (let i = 0; i < 15; i++) {
        const rx = x + off + 4 + Math.random() * (bw - 8);
        const ry = y + 4 + Math.random() * (bh - 8);
        const size = Math.random() * 3 + 1;
        const darkness = Math.random() * 30;
        ctx.fillStyle = `rgba(0,0,0,${darkness/100})`;
        ctx.fillRect(rx, ry, size, size);
      }
      
      ctx.strokeStyle = 'rgba(40,35,30,0.6)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + off + 4, y + 4, bw - 8, bh - 8);
    }
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
};

const createRealisticFloorTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
  gradient.addColorStop(0, '#3a4a3a');
  gradient.addColorStop(0.5, '#2a3a2a');
  gradient.addColorStop(1, '#3a4a3a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);
  
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.random() * 25 - 12;
    data[i] += noise;
    data[i + 1] += noise;
    data[i + 2] += noise;
  }
  ctx.putImageData(imgData, 0, 0);
  
  ctx.strokeStyle = 'rgba(20,25,20,0.4)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 1024, Math.random() * 1024);
    for (let j = 0; j < 5; j++) {
      ctx.lineTo(Math.random() * 1024, Math.random() * 1024);
    }
    ctx.stroke();
  }
  
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const radius = Math.random() * 40 + 20;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, 'rgba(15,20,15,0.3)');
    grad.addColorStop(1, 'rgba(15,20,15,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
};

const createNormalMap = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const nx = (Math.random() * 10 - 5) + 128;
      const ny = (Math.random() * 10 - 5) + 128;
      const nz = 255;
      ctx.fillStyle = `rgb(${nx}, ${ny}, ${nz})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  
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
    [r, 0], [-r, 0], [0, r], [0, -r],
    [r*0.7071, r*0.7071], [r*0.7071, -r*0.7071],
    [-r*0.7071, r*0.7071], [-r*0.7071, -r*0.7071],
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

/* =================== Player Character with Advanced Transformations =================== */
const PlayerCharacter = () => {
  const meshRef = useRef();
  const groupRef = useRef();
  const p = useGameStore(s => s.playerPosition);
  const cameraMode = useGameStore(s => s.cameraMode);
  
  useFrame((st) => {
    if (!meshRef.current || !groupRef.current) return;
    
    meshRef.current.rotation.y += 0.03;
    meshRef.current.rotation.x = Math.sin(st.clock.elapsedTime * 1.5) * 0.1;
    
    const scale = 1 + Math.sin(st.clock.elapsedTime * 3) * 0.08;
    meshRef.current.scale.set(scale, scale, scale);
    
    meshRef.current.position.y = Math.sin(st.clock.elapsedTime * 2.5) * 0.05;
    
    groupRef.current.rotation.y += 0.005;
  });
  
  if (cameraMode === 'firstPerson') return null;
  
  return (
    <group ref={groupRef} position={[p[0], p[1], p[2]]}>
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial 
          color="#d4af37" 
          emissive="#c9a932"
          emissiveIntensity={0.4}
          metalness={0.95}
          roughness={0.15}
          envMapIntensity={1.2}
        />
      </mesh>
      <pointLight position={[0, 0.3, 0]} intensity={1.8} color="#ffd700" distance={3.5} decay={2} />
      
      <mesh position={[0, -0.15, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[0.3, 0.4, 32]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[
          Math.cos((Date.now() * 0.001 + i * 2.1)) * 0.4,
          0,
          Math.sin((Date.now() * 0.001 + i * 2.1)) * 0.4
        ]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
};

/* =================== Player Controller with Multi-Camera System =================== */
const Player = () => {
  const { camera, gl } = useThree();
  const playerPos = useRef(new THREE.Vector3(1.5, 0.3, 1.5));
  const setPlayerPosition = useGameStore(s => s.setPlayerPosition);
  const currentDecision = useGameStore(s => s.currentDecision);
  const completedDecisions = useGameStore(s => s.completedDecisions);
  const gameEnded = useGameStore(s => s.gameEnded);
  const cameraMode = useGameStore(s => s.cameraMode);

  const [keys, setKeys] = useState({ up:false, down:false, left:false, right:false });
  const playerRotation = useRef(0);

  useEffect(() => { 
    gl.shadowMap.enabled = true; 
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.1;
  }, [gl]);

  useEffect(() => {
    const down = (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
      setKeys(k => ({ 
        up:e.key==='ArrowUp'||e.key==='w'||e.key==='W'?true:k.up,
        down:e.key==='ArrowDown'||e.key==='s'||e.key==='S'?true:k.down,
        left:e.key==='ArrowLeft'||e.key==='a'||e.key==='A'?true:k.left,
        right:e.key==='ArrowRight'||e.key==='d'||e.key==='D'?true:k.right 
      }));
      if (e.key==='f'||e.key==='F') useGameStore.getState().toggleFlashlight();
      if (e.key==='m'||e.key==='M') useGameStore.getState().toggleMinimapSize();
      if (e.key==='v'||e.key==='V') useGameStore.getState().cycleCameraMode();
    };
    const up = (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','W','a','A','s','S','d','D'].includes(e.key)) e.preventDefault();
      setKeys(k => ({ 
        up:e.key==='ArrowUp'||e.key==='w'||e.key==='W'?false:k.up,
        down:e.key==='ArrowDown'||e.key==='s'||e.key==='S'?false:k.down,
        left:e.key==='ArrowLeft'||e.key==='a'||e.key==='A'?false:k.left,
        right:e.key==='ArrowRight'||e.key==='d'||e.key==='D'?false:k.right 
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
      const speed = 2.8;
      const dir = new THREE.Vector2((keys.right?1:0)-(keys.left?1:0),(keys.down?1:0)-(keys.up?1:0));
      if (dir.lengthSq() > 1e-6) {
        dir.normalize();
        playerRotation.current = Math.atan2(dir.x, dir.y);
      }

      let totalDx = dir.x * speed * delta;
      let totalDz = dir.y * speed * delta;

      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(totalDx), Math.abs(totalDz)) / SUBSTEP_MAX));
      const stepDx = totalDx / steps, stepDz = totalDz / steps;

      for (let i = 0; i < steps; i++) {
        const tryX = playerPos.current.x + stepDx;
        if (canStandAt(tryX, playerPos.current.z)) playerPos.current.x = tryX;
        else {
          const sgn = Math.sign(stepDx) || 1; 
          let back = 0;
          for (let k = 0; k < 5; k++) {
            back = back ? back*0.5 : Math.abs(stepDx)*0.5;
            const nx = playerPos.current.x + sgn*(Math.abs(stepDx)-back);
            if (canStandAt(nx, playerPos.current.z)) { playerPos.current.x = nx; break; }
          }
        }
        const tryZ = playerPos.current.z + stepDz;
        if (canStandAt(playerPos.current.x, tryZ)) playerPos.current.z = tryZ;
        else {
          const sgn = Math.sign(stepDz) || 1; 
          let back = 0;
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
      const prevCompleted = completedDecisions.size;
      for (const d of getDecisions()) {
        const dist = Math.hypot(playerPos.current.x - d.position[0], playerPos.current.z - d.position[2]);
        if (dist < 1.0 && !completedDecisions.has(d.id) && now >= cool) {
          useGameStore.getState().setCurrentDecision(d.id);
          break;
        }
      }
      if (useGameStore.getState().completedDecisions.size > prevCompleted) {
        AudioSystem.play('checkpoint');
      }
    } else {
      setPlayerPosition([playerPos.current.x, playerPos.current.y, playerPos.current.z]);
    }

    let targetPos, lookTarget;
    
    switch(cameraMode) {
      case 'firstPerson':
        targetPos = new THREE.Vector3(
          playerPos.current.x,
          playerPos.current.y + 0.5,
          playerPos.current.z
        );
        lookTarget = new THREE.Vector3(
          playerPos.current.x + Math.sin(playerRotation.current) * 2,
          playerPos.current.y + 0.5,
          playerPos.current.z + Math.cos(playerRotation.current) * 2
        );
        camera.fov = 80;
        break;
        
      case 'birds':
        targetPos = new THREE.Vector3(
          playerPos.current.x,
          playerPos.current.y + 15,
          playerPos.current.z
        );
        lookTarget = new THREE.Vector3(playerPos.current.x, 0, playerPos.current.z);
        camera.fov = 60;
        break;
        
      default:
        const followOffset = new THREE.Vector3(0, 6, 5);
        targetPos = new THREE.Vector3(
          playerPos.current.x + followOffset.x,
          playerPos.current.y + followOffset.y,
          playerPos.current.z + followOffset.z
        );
        lookTarget = new THREE.Vector3(playerPos.current.x, playerPos.current.y + 0.5, playerPos.current.z);
        camera.fov = 70;
    }
    
    camera.position.lerp(targetPos, 0.06);
    camera.lookAt(lookTarget);
    camera.updateProjectionMatrix();

    const exitDist = Math.hypot(playerPos.current.x - 13.5, playerPos.current.z - 11.5);
    if (exitDist < 1.2) useGameStore.getState().finishGame();
  });

  return <PerspectiveCamera makeDefault position={[1.5, 6, 6.5]} fov={70} />;
};

/* =================== Realistic Maze Walls =================== */
const MazeWalls = () => {
  const wallTexture = useMemo(() => createRealisticBrickTexture(), []);
  const normalMap = useMemo(() => createNormalMap(), []);
  
  const walls = useMemo(() => {
    const list = [];
    for (let z = 0; z < mazeLayout.length; z++) {
      for (let x = 0; x < mazeLayout[z].length; x++) {
        if (mazeLayout[z][x] === 1) list.push({ x: x + 0.5, z: z + 0.5 });
      }
    }
    return list;
  }, []);

  return (
    <>
      {walls.map((w, i) => (
        <mesh key={i} position={[w.x, 1.5, w.z]} castShadow receiveShadow>
          <boxGeometry args={[1, 3, 1]} />
          <meshStandardMaterial 
            map={wallTexture}
            normalMap={normalMap}
            roughness={0.85}
            metalness={0.05}
            normalScale={new THREE.Vector2(0.3, 0.3)}
            envMapIntensity={0.4}
          />
        </mesh>
      ))}
    </>
  );
};

/* =================== Realistic Floor =================== */
const Floor = () => {
  const floorTexture = useMemo(() => { 
    const t = createRealisticFloorTexture(); 
    t.repeat.set(6, 6); 
    return t; 
  }, []);
  
  const normalMap = useMemo(() => {
    const t = createNormalMap();
    t.repeat.set(6, 6);
    return t;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[MAZE_CENTER_X, 0, MAZE_CENTER_Z]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial 
        map={floorTexture}
        normalMap={normalMap}
        roughness={0.9}
        metalness={0.05}
        normalScale={new THREE.Vector2(0.5, 0.5)}
        envMapIntensity={0.2}
      />
    </mesh>
  );
};

/* =================== Enhanced Checkpoint Markers =================== */
const Checkpoint = ({ position, done }) => {
  const ref = useRef();
  const light = useRef();
  
  useFrame((s) => {
    if (ref.current) { 
      ref.current.rotation.y += 0.02; 
      ref.current.position.y = 1.2 + Math.sin(s.clock.elapsedTime * 2) * 0.15; 
    }
    if (light.current) light.current.intensity = 2.5 + Math.sin(s.clock.elapsedTime * 3) * 1;
  });
  
  return (
    <group position={position}>
      <mesh ref={ref} castShadow>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial 
          color={done ? '#22c55e' : '#f59e0b'} 
          emissive={done ? '#16a34a' : '#d97706'} 
          emissiveIntensity={0.8}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <pointLight ref={light} position={[0, 1.8, 0]} distance={5} intensity={3} color={done ? '#22c55e' : '#f59e0b'} decay={2} />
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[0.45, 32]} />
        <meshBasicMaterial color={done ? '#22c55e' : '#f59e0b'} opacity={0.25} transparent />
      </mesh>
    </group>
  );
};

const StartMarker = () => {
  const ref = useRef();
  const light = useRef();
  
  useFrame((s) => {
    if (ref.current) { 
      ref.current.rotation.y += 0.015; 
      ref.current.position.y = 1.5 + Math.sin(s.clock.elapsedTime * 2) * 0.15; 
    }
    if (light.current) light.current.intensity = 4 + Math.sin(s.clock.elapsedTime * 2.5) * 1.5;
  });
  
  return (
    <group position={[1.5, 0, 1.5]}>
      <mesh ref={ref} castShadow>
        <coneGeometry args={[0.45, 1.1, 32]} />
        <meshStandardMaterial 
          color="#22c55e" 
          emissive="#16a34a" 
          emissiveIntensity={1.0}
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>
      <pointLight ref={light} position={[0, 2.5, 0]} intensity={5} color="#22c55e" distance={7} decay={2} />
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[1.0, 32]} />
        <meshBasicMaterial color="#22c55e" opacity={0.3} transparent />
      </mesh>
    </group>
  );
};

const ExitMarker = () => {
  const ref = useRef();
  const light = useRef();
  
  useFrame((s) => {
    if (ref.current) { 
      ref.current.rotation.y += 0.02; 
      ref.current.position.y = 1.5 + Math.sin(s.clock.elapsedTime * 2) * 0.2; 
    }
    if (light.current) light.current.intensity = 4.5 + Math.sin(s.clock.elapsedTime * 3) * 2;
  });
  
  return (
    <group position={[13.5, 0, 11.5]}>
      <mesh ref={ref} castShadow>
        <torusGeometry args={[0.55, 0.22, 16, 32]} />
        <meshStandardMaterial 
          color="#ef4444" 
          emissive="#dc2626" 
          emissiveIntensity={1.2}
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>
      <pointLight ref={light} position={[0, 2.5, 0]} intensity={6} color="#ef4444" distance={9} decay={2} />
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[1.3, 32]} />
        <meshBasicMaterial color="#ef4444" opacity={0.3} transparent />
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
          <mesh key={i} position={[x + 0.5, 0.015, z + 0.5]} rotation={[-Math.PI/2,0,0]}>
            <circleGeometry args={[0.18, 16]} />
            <meshBasicMaterial color="#d4af37" opacity={0.25} transparent />
          </mesh>
        );
      })}
    </>
  );
};

/* =================== Realistic Lighting System =================== */
const Lighting = ({ lowPerf = false }) => {
  const flashlightOn = useGameStore(s => s.flashlightOn);
  const p = useGameStore(s => s.playerPosition);
  const spot = useRef();
  const dirLight = useRef();
  
  useFrame((state) => {
    if (spot.current && flashlightOn) {
      spot.current.position.set(p[0], p[1] + 7, p[2]);
      spot.current.target.position.set(p[0], 0, p[2]);
      spot.current.target.updateMatrixWorld();
    }
    
    if (dirLight.current) {
      dirLight.current.intensity = 2.8 + Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });
  
  const shadowSize = lowPerf ? 1024 : 2048;
  
  return (
    <>
      <ambientLight intensity={0.35} color="#b8c5d9" />
      
      <directionalLight 
        ref={dirLight}
        position={[30, 40, 25]} 
        intensity={2.8} 
        color="#fff8e7"
        castShadow
        shadow-mapSize-width={shadowSize} 
        shadow-mapSize-height={shadowSize}
        shadow-camera-far={80}
        shadow-camera-left={-30} 
        shadow-camera-right={30}
        shadow-camera-top={30} 
        shadow-camera-bottom={-30}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      
      <directionalLight 
        position={[-20, 25, -15]} 
        intensity={0.8} 
        color="#c5d9ff"
      />
      
      <hemisphereLight 
        args={['#87ceeb', '#2d3d2d', 1.4]} 
        position={[0, 50, 0]}
      />
      
      {flashlightOn && (
        <spotLight 
          ref={spot} 
          intensity={lowPerf ? 5 : 7} 
          angle={0.6} 
          penumbra={0.6} 
          distance={30} 
          color="#fffaf0" 
          castShadow={!lowPerf}
          shadow-mapSize-width={lowPerf ? 512 : 1024} 
          shadow-mapSize-height={lowPerf ? 512 : 1024}
          shadow-bias={-0.0003}
          decay={2}
        />
      )}
      
      <pointLight 
        position={[MAZE_CENTER_X, 18, MAZE_CENTER_Z]} 
        intensity={1.2} 
        color="#fff5e6" 
        distance={35} 
        decay={2} 
      />
      
      <pointLight position={[2, 8, 2]} intensity={0.8} color="#ffd4a3" distance={12} decay={2} />
      <pointLight position={[13, 8, 11]} intensity={0.8} color="#ffd4a3" distance={12} decay={2} />
    </>
  );
};

/* =================== Compact HUD =================== */
const HUD = () => {
  const { uiScale, isMobile } = useResponsive();
  const { wallet, savings, debt, risk, score, currentDecision, gameEnded, flashlightOn, cameraMode } = useGameStore();
  const decisions = getDecisions();
  const currentDec = decisions.find(d => d.id === currentDecision);
  const completed = useGameStore(s => s.completedDecisions);
  const getScoreColor = () => (score >= 40 ? '#22c55e' : score >= 20 ? '#eab308' : '#ef4444');

  const getCameraModeName = () => {
    switch(cameraMode) {
      case 'firstPerson': return '👁️ First Person';
      case 'birds': return '🦅 Bird\'s Eye';
      default: return '🎥 Follow';
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{
        position:'absolute', top:10, left:10, transform:`scale(${Math.min(uiScale, 0.8)})`,
        transformOrigin:'top left', background:'rgba(15,23,42,0.92)', color:'#fff',
        padding: isMobile ? '0.8rem':'1rem', borderRadius:'0.75rem', pointerEvents:'auto',
        border:'1.5px solid rgba(59,130,246,0.5)', minWidth: isMobile ? '150px' : '200px',
        boxShadow:'0 8px 32px rgba(0,0,0,0.6)', backdropFilter:'blur(12px)'
      }}>
        <h2 style={{ fontSize: isMobile ? '0.95rem':'1.2rem', fontWeight:'700', marginBottom:'0.4rem', color:'#fbbf24' }}>💼 Stats</h2>
        <div style={{ fontSize: isMobile ? '0.8rem':'0.9rem', lineHeight:1.7 }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}><span>👛 Wallet:</span><b style={{ color:'#22d3ee' }}>{wallet.toFixed(1)}</b></div>
          <div style={{ display:'flex', justifyContent:'space-between' }}><span>💵 Savings:</span><b style={{ color:'#4ade80' }}>{savings.toFixed(1)}</b></div>
          <div style={{ display:'flex', justifyContent:'space-between' }}><span>💳 Debt:</span><b style={{ color:'#f87171' }}>{debt.toFixed(1)}</b></div>
          <div style={{ display:'flex', justifyContent:'space-between' }}><span>🎲 Risk:</span><b style={{ color:'#fb923c' }}>{risk.toFixed(1)}</b></div>
          <div style={{ paddingTop:3, marginTop:3, borderTop:'1px solid rgba(71,85,105,0.5)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>📊 Score:</span>
              <span style={{ color:getScoreColor(), fontWeight:'bold', fontSize: isMobile ? '1rem':'1.2rem', textShadow:`0 0 10px ${getScoreColor()}` }}>{score.toFixed(1)}</span>
            </div>
          </div>
          <div style={{ marginTop:3, fontSize: isMobile ? '0.7rem':'0.8rem', color:'#94a3b8' }}>
            {completed.size}/{decisions.length} decisions
          </div>
        </div>
      </div>

      <div style={{
        position:'absolute', top:10, right:10, transform:`scale(${Math.min(uiScale, 0.8)})`,
        transformOrigin:'top right', background:'rgba(15,23,42,0.92)', color:'#fff',
        padding: isMobile ? '0.8rem':'1rem', borderRadius:'0.75rem', fontSize:'0.9rem',
        maxWidth: isMobile ? 180 : 240, border:'1.5px solid rgba(139,92,246,0.5)',
        boxShadow:'0 8px 32px rgba(0,0,0,0.6)', pointerEvents:'auto', backdropFilter:'blur(12px)'
      }}>
        <div style={{ fontWeight:'700', marginBottom:'0.5rem', fontSize: isMobile ? '0.9rem':'1rem', color:'#a78bfa', display:'flex', alignItems:'center', gap:'0.3rem' }}>
          <span>🎮</span> Controls
        </div>

        <div style={{ display:'grid', gap:'0.35rem' }}>
          <button onClick={() => useGameStore.getState().toggleFlashlight()}
            style={{ cursor:'pointer', background:'rgba(17,24,39,0.8)', color:'#fff', border:'1px solid rgba(55,65,81,0.6)',
              borderRadius:5, padding:'0.4rem 0.6rem', textAlign:'left', fontSize:'0.85rem', transition:'all 0.2s' }}>
            <b style={{ background:'rgba(55,65,81,0.8)', padding:'1px 4px', borderRadius:3, marginRight:5, fontSize:'0.8rem' }}>F</b>
            Light {flashlightOn ? '🔦' : '⚫'}
          </button>

          <button onClick={() => useGameStore.getState().toggleMinimapSize()}
            style={{ cursor:'pointer', background:'rgba(17,24,39,0.8)', color:'#fff', border:'1px solid rgba(55,65,81,0.6)',
              borderRadius:5, padding:'0.4rem 0.6rem', textAlign:'left', fontSize:'0.85rem', transition:'all 0.2s' }}>
            <b style={{ background:'rgba(55,65,81,0.8)', padding:'1px 4px', borderRadius:3, marginRight:5, fontSize:'0.8rem' }}>M</b>
            Map
          </button>
          
          <button onClick={() => useGameStore.getState().cycleCameraMode()}
            style={{ cursor:'pointer', background:'rgba(17,24,39,0.8)', color:'#fff', border:'1px solid rgba(55,65,81,0.6)',
              borderRadius:5, padding:'0.4rem 0.6rem', textAlign:'left', fontSize:'0.85rem', transition:'all 0.2s' }}>
            <b style={{ background:'rgba(55,65,81,0.8)', padding:'1px 4px', borderRadius:3, marginRight:5, fontSize:'0.8rem' }}>V</b>
            {getCameraModeName()}
          </button>
        </div>

        <div style={{ marginTop:'0.5rem', padding:'0.45rem', background:'rgba(234,179,8,0.15)', borderRadius:'0.5rem', border:'1px solid rgba(234,179,8,0.4)' }}>
          <div style={{ color:'#fcd34d', fontWeight:'600', fontSize:'0.85rem' }}>💡 Win</div>
          <div style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', marginTop:2, color:'#fef08a' }}>
            Score ≥40 & Debt ≤20
          </div>
        </div>
      </div>

      {currentDec && !gameEnded && !completed.has(currentDec.id) && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.93)', pointerEvents:'auto', zIndex:1000, backdropFilter:'blur(8px)' }}>
          <div style={{
            background:'linear-gradient(135deg,rgba(30,41,59,0.95) 0%,rgba(51,65,85,0.95) 100%)',
            padding: isMobile ? '1.5rem':'2.5rem',
            borderRadius:'1rem',
            width:'min(90vw, 44rem)',
            border:'3px solid rgba(234,179,8,0.6)',
            boxShadow:'0 0 60px rgba(234,179,8,0.4)',
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
            <style>{`
              @keyframes modalSlideIn {
                from { opacity: 0; transform: translateY(-20px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>
            <h2 style={{ fontSize: isMobile ? '1.3rem' : '2rem', fontWeight:'bold', marginBottom: isMobile ? '0.9rem' : '1.4rem', color:'#fff', textAlign:'center' }}>
              {currentDec.question}
            </h2>
            <div style={{ display:'flex', flexDirection:'column', gap:isMobile ? '0.7rem':'0.9rem' }}>
              {currentDec.options.map((o, i) => (
                <button key={i}
                  onClick={() => useGameStore.getState().makeDecision(currentDec.id, i)}
                  style={{ width:'100%', textAlign:'left', padding:isMobile ? '1rem':'1.3rem',
                    background: i===0 ? 'linear-gradient(135deg,rgba(5,150,105,0.9),rgba(16,185,129,0.9))':'linear-gradient(135deg,rgba(220,38,38,0.9),rgba(239,68,68,0.9))',
                    color:'#fff', borderRadius:'0.8rem', border:'none', cursor:'pointer', boxShadow:'0 4px 12px rgba(0,0,0,0.5)', transition:'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                  <div style={{ fontWeight:'bold', fontSize:isMobile ? '1rem':'1.2rem', marginBottom:'0.3rem' }}>{o.text}</div>
                  <div style={{ opacity:0.9, fontSize:isMobile ? '0.85rem':'0.95rem' }}>{o.effect || ''}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {gameEnded && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.93)', pointerEvents:'auto', zIndex:1000, backdropFilter:'blur(8px)' }}>
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
    <div style={{ 
      background: gameWon ? 'linear-gradient(135deg,rgba(6,95,70,0.95),rgba(5,150,105,0.95))':'linear-gradient(135deg,rgba(124,45,18,0.95),rgba(185,28,28,0.95))', 
      padding:'2rem', 
      borderRadius:'1rem', 
      textAlign:'center', 
      border:`4px solid ${gameWon ? '#4ade80':'#ef4444'}`, 
      color:'#fff', 
      width:'min(90vw, 700px)',
      boxShadow:`0 0 50px ${gameWon ? 'rgba(74,222,128,0.5)':'rgba(239,68,68,0.5)'}`,
      animation: 'endScreenZoom 0.5s ease-out'
    }}>
      <style>{`
        @keyframes endScreenZoom {
          0% { opacity: 0; transform: scale(0.8) rotate(-5deg); }
          60% { transform: scale(1.05) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
      <div style={{ fontSize:'3.5rem', marginBottom:'0.8rem', animation: 'bounce 1s ease-in-out infinite' }}>
        {gameWon ? '🎉':'😢'}
      </div>
      <h1 style={{ fontSize:'2rem', fontWeight:'bold', marginBottom:'0.8rem' }}>
        {gameWon ? 'Financially Healthy!' : 'Needs Improvement'}
      </h1>
      <div style={{ background:'rgba(0,0,0,0.5)', padding:'0.9rem', borderRadius:'0.8rem', marginBottom:'1rem' }}>
        <div>👛 Wallet: <b style={{ color:'#22d3ee' }}>{wallet.toFixed(1)}</b> · 💵 Savings: <b style={{ color:'#4ade80' }}>{savings.toFixed(1)}</b> · 💳 Debt: <b style={{ color: debt<=20 ? '#4ade80':'#f87171' }}>{debt.toFixed(1)}</b></div>
        <div style={{ marginTop:'0.3rem' }}>📊 Score: <b>{score.toFixed(2)}</b> · Decisions: <b>{completed.size}/{getDecisions().length}</b></div>
      </div>
      <button onClick={() => {
        AudioSystem.play('buttonClick');
        setTimeout(() => window.location.reload(), 100);
      }} 
        style={{ padding:'0.8rem 2.2rem', 
          background: gameWon ? 'linear-gradient(135deg,#22c55e,#16a34a)':'linear-gradient(135deg,#ef4444,#dc2626)', 
          color:'#fff', fontWeight:'bold', borderRadius:'0.8rem', border:'none', 
          cursor:'pointer', fontSize:'1rem', boxShadow:'0 4px 12px rgba(0,0,0,0.4)',
          transition:'transform 0.2s' }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
        🔄 Play Again
      </button>
    </div>
  );
};

/* =================== Compact Minimap =================== */
const Minimap = () => {
  const player = useGameStore(s => s.playerPosition);
  const visited = useGameStore(s => s.visitedCells);
  const minimapSize = useGameStore(s => s.minimapSize);
  const completed = useGameStore(s => s.completedDecisions);
  const decisions = getDecisions();
  const { isMobile } = useResponsive();

  const sizeKey = isMobile ? 'small' : minimapSize;
  const scale = sizeKey === 'large' ? 14 : 9;
  const size = sizeKey === 'large' ? 210 : 135;

  return (
    <div style={{ 
      position:'absolute', bottom:'0.8rem', right:'0.8rem', 
      background:'rgba(15,23,42,0.92)', padding:'0.7rem', 
      borderRadius:'0.7rem', border:'1.5px solid rgba(34,211,238,0.5)', 
      boxShadow:'0 8px 32px rgba(0,0,0,0.6)', pointerEvents:'auto', 
      backdropFilter:'blur(12px)' 
    }}>
      <svg width={size} height={size} style={{ background:'#0a0f1e', borderRadius:'0.5rem', display:'block', border:'1.5px solid #1e293b' }}>
        {mazeLayout.map((row, z) =>
          row.map((cell, x) =>
            cell === 1 ? (
              <rect key={`w-${x}-${z}`} x={x*scale} y={z*scale} width={scale} height={scale} fill="#6a5a4a" stroke="#5a4a3a" strokeWidth="1"/>
            ) : (
              <rect key={`f-${x}-${z}`} x={x*scale} y={z*scale} width={scale} height={scale} fill="#1a2a1a" stroke="#0f1a0f" strokeWidth="0.3"/>
            )
          )
        )}

        {Array.from(visited).map((cell, i) => {
          const [x, z] = cell.split(',').map(Number);
          return <circle key={`v-${i}`} cx={(x+0.5)*scale} cy={(z+0.5)*scale} r={scale*0.16} fill="#d4af37" opacity="0.3"/>;
        })}

        <g>
          <circle cx={1.5*scale} cy={1.5*scale} r={scale*0.45} fill="#22c55e" stroke="#16a34a" strokeWidth="2">
            <animate attributeName="r" values={`${scale*0.38};${scale*0.5};${scale*0.38}`} dur="2s" repeatCount="indefinite"/>
          </circle>
        </g>

        {decisions.map(d => {
          const done = completed.has(d.id);
          const x = d.position[0], z = d.position[2];
          return (
            <g key={d.id}>
              <circle cx={x*scale} cy={z*scale} r={scale*0.35} fill={done ? '#22c55e' : '#f59e0b'} stroke={done ? '#16a34a' : '#d97706'} strokeWidth="1.5"/>
              {done && <text x={x*scale} y={z*scale+2.5} fontSize={scale*0.35} fill="white" textAnchor="middle" fontWeight="bold">✓</text>}
            </g>
          );
        })}

        <g>
          <circle cx={13.5*scale} cy={11.5*scale} r={scale*0.5} fill="#ef4444" stroke="#dc2626" strokeWidth="2">
            <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite"/>
          </circle>
        </g>

        <g transform={`translate(${player[0]*scale}, ${player[2]*scale})`}>
          <circle r={scale*0.44} fill="#d4af37" stroke="#fff" strokeWidth="2">
            <animate attributeName="r" values={`${scale*0.4};${scale*0.48};${scale*0.4}`} dur="1.5s" repeatCount="indefinite"/>
          </circle>
          <circle r={scale*0.2} fill="#fff" />
        </g>
      </svg>
      <div style={{ color:'#22d3ee', fontSize: sizeKey==='large' ? '0.8rem':'0.7rem', textAlign:'center', marginTop:'0.3rem', fontWeight:'600' }}>
        📍 {sizeKey==='large' ? 'Map' : 'Map'}
      </div>
    </div>
  );
};

/* =================== Scene with Advanced Post-Processing =================== */
const Scene = () => {
  const decisions = getDecisions();
  const completed = useGameStore(s => s.completedDecisions);
  const [lowPerf, setLowPerf] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;

  return (
    <>
      <PerformanceMonitor onDecline={() => setLowPerf(true)} onIncline={() => setLowPerf(false)} />
      
      <Sky 
        distance={450000} 
        sunPosition={[100, 20, 100]} 
        inclination={0.6} 
        azimuth={0.25} 
        turbidity={8}
        rayleigh={2}
      />
      
      <fog attach="fog" args={['#2d3d3d', 8, 32]} />
      
      <Player />
      <Lighting lowPerf={lowPerf || isMobile} />
      <Floor />
      <MazeWalls />
      <BreadcrumbTrail />
      <PlayerCharacter />
      <StartMarker />
      <ExitMarker />
      {decisions.map(d => <Checkpoint key={d.id} position={d.position} done={completed.has(d.id)} />)}

      <EffectComposer enableNormalPass={!isMobile && !lowPerf} multisampling={0}>
        {!isMobile && !lowPerf && (
          <>
            <SSAO 
              radius={0.25} 
              intensity={20} 
              luminanceInfluence={0.35} 
              bias={0.025}
              samples={16}
            />
            <DepthOfField 
              focusDistance={0.02} 
              focalLength={0.05} 
              bokehScale={3} 
            />
          </>
        )}
        <Bloom 
          luminanceThreshold={0.7} 
          luminanceSmoothing={0.9} 
          intensity={lowPerf ? 1 : 1.5} 
          radius={0.85}
        />
        <Vignette 
          offset={0.3} 
          darkness={0.6} 
          eskil={false}
        />
      </EffectComposer>
    </>
  );
};

/* =================== App =================== */
export default function FinancialMaze3D() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const { uiScale, isMobile } = useResponsive();

  useEffect(() => {
    AudioSystem.init();
    setTimeout(() => setLoading(false), 100);
    setTimeout(() => setFadeIn(true), 200);
  }, []);

  const handleStart = () => {
    AudioSystem.play('gameStart');
    AudioSystem.startBgMusic();
    setStarted(true);
  };

  if (!started) {
    return (
      <div style={{ 
        width:'100vw', 
        height:'100vh', 
        display:'flex', 
        alignItems:'center', 
        justifyContent:'center', 
        background:'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', 
        position:'relative', 
        overflow:'hidden',
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 0.8s ease-in-out'
      }}>
        <div style={{ 
          position:'absolute', 
          inset:0, 
          background:'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.1) 0%, transparent 50%)', 
          animation:'pulse 4s ease-in-out infinite' 
        }}></div>
        
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
        
        <div style={{
          transform:`scale(${uiScale})`,
          transformOrigin:'center',
          textAlign:'center', 
          color:'#fff', 
          padding:'2rem',
          background:'rgba(15,23,42,0.9)', 
          borderRadius:'1.2rem',
          width:'min(90vw, 50rem)', 
          border:'3px solid rgba(59,130,246,0.6)',
          boxShadow:'0 0 60px rgba(59,130,246,0.4), inset 0 0 60px rgba(59,130,246,0.1)',
          backdropFilter:'blur(20px)',
          animation: 'float 3s ease-in-out infinite'
        }}>
          <h1 style={{
            fontSize:isMobile ? '2.2rem':'3.8rem', 
            fontWeight:'900', 
            marginBottom:'0.8rem',
            background:'linear-gradient(135deg,#fbbf24 0%,#f59e0b 50%,#d97706 100%)', 
            WebkitBackgroundClip:'text', 
            WebkitTextFillColor:'transparent',
            textShadow:'0 0 40px rgba(251,191,36,0.5)',
            letterSpacing:'-0.02em'
          }}>
            💰 Financial Maze 3D
          </h1>
          <p style={{ fontSize:isMobile ? '1rem':'1.25rem', marginBottom:'1rem', color:'#cbd5e1', lineHeight:1.6 }}>
            Navigate realistic 3D maze. Make smart financial decisions. Build wealth.
          </p>
          <div style={{ textAlign:'left', margin:'0 auto 1rem', background:'rgba(15,23,42,0.8)', padding:'0.9rem', borderRadius:'0.8rem', border:'2px solid rgba(51,65,85,0.6)', maxWidth:700 }}>
            <div style={{ fontWeight:'bold', color:'#22d3ee', marginBottom:'0.3rem', fontSize:isMobile ? '0.9rem':'1rem' }}>✨ Ultra-Realistic Features</div>
            <ul style={{ marginLeft:'1rem', lineHeight:1.7, fontSize:isMobile ? '0.9rem':'1rem', color:'#e2e8f0' }}>
              <li>Advanced procedural textures & materials</li>
              <li>Cinematic lighting with shadows & fog</li>
              <li>SSAO, Depth of Field, Bloom, Vignette</li>
              <li>🎮 Multiple camera perspectives (Press V)</li>
              <li>🎵 Immersive sound design & music</li>
              <li>🌀 Advanced CG transformations</li>
            </ul>
          </div>
          <button onClick={handleStart}
            onMouseDown={() => AudioSystem.play('buttonClick')}
            style={{ 
              padding:isMobile ? '0.9rem 2rem':'1.1rem 2.8rem', 
              background:'linear-gradient(135deg,#22c55e 0%,#16a34a 100%)', 
              color:'#fff', 
              fontSize:isMobile ? '1.1rem':'1.4rem', 
              fontWeight:'bold', 
              borderRadius:'0.9rem', 
              border:'none', 
              cursor:'pointer',
              boxShadow:'0 8px 24px rgba(34,197,94,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              transition:'all 0.3s ease',
              textTransform:'uppercase',
              letterSpacing:'0.05em'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(34,197,94,0.5), inset 0 1px 0 rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(34,197,94,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
            }}>
            🚀 Start Journey
          </button>
          <div style={{ marginTop:'0.8rem', fontSize:isMobile ? '0.8rem':'0.9rem', color:'#94a3b8', fontStyle:'italic' }}>
            Controls: WASD/Arrows • F: Flashlight • M: Map • V: Camera View
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      width:'100vw', 
      height:'100vh', 
      position:'relative', 
      overflow:'hidden', 
      background:'#000',
      opacity: 1,
      animation: 'fadeInGame 1s ease-in-out'
    }}>
      <style>{`
        @keyframes fadeInGame {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <Canvas
        shadows
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true
        }}
        dpr={[1, window.innerWidth < 900 ? 1.5 : 2]}
      >
        <Scene />
      </Canvas>
      <HUD />
      <Minimap />
    </div>
  );
}