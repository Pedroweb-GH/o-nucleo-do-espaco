import React, { useState, useEffect, useRef } from 'react';
import {
  GameState, GameReport, PowerUpType, PowerUpConfig, ThemeType, UpgradesState,
  DifficultyType, CustomSkinConfig, GameMode, BossState, Quest, Achievement
} from '../types';
import { THEMES, UPGRADES, DIFFICULTIES, GAME_MODES, PILOT_RANKS, BOSS_CONFIGS } from '../constants';
import { soundEngine } from '../soundEngine';
import {
  Loader2, Shield, Play, RotateCcw, Zap, Turtle, LayoutTemplate, Star, ShoppingBag,
  X, Clock, AlertTriangle, Layers, Palette, Cpu, Lock, Coins, ArrowUpCircle,
  Eye, Gauge, Settings, Maximize2, CheckCircle2, Sliders, Sparkles, Paintbrush, SlidersHorizontal,
  HeartPulse, Gift, Award, LogOut, Volume2, VolumeX, Music, Flame, Crosshair, Target, Compass,
  Radio, Orbit, Trophy, Pause, HelpCircle, History, User, Heart
} from 'lucide-react';
import type { GameHistoryEntry } from '../App';

interface GameUIProps {
  gameState: GameState;
  gameMode: GameMode;
  onGameModeChange: (mode: GameMode) => void;
  score: number;
  health: number;
  maxHealth: number;
  level: number;
  highScore: number;
  credits: number;
  upgrades: UpgradesState;
  difficulty: DifficultyType;
  onDifficultyChange: (difficulty: DifficultyType) => void;
  report: GameReport | null;
  loadingReport: boolean;
  earnedCredits: number;
  extraSpins: number;
  onBuySpins: (count: number, price: number) => void;
  onUseExtraSpin: () => void;
  onAwardCredits?: (amount: number) => void;
  hasMultiBonus?: boolean;
  multiBonusSlots?: number;
  equippedPowerUps?: PowerUpType[];
  unlockedPowerUps?: PowerUpType[];
  onBuyMultiBonus?: (slots: 5 | 8, price: number) => void;
  onToggleEquipPowerUp?: (type: PowerUpType) => void;
  onEquipAllPowerUps?: (types: PowerUpType[]) => void;
  onClearEquippedPowerUps?: () => void;
  onStart: () => void;
  onExitGame?: () => void;
  onPowerUpSelected?: (type: PowerUpType) => void;
  activePowerUp: PowerUpType;
  activePowerUps?: PowerUpType[];
  powerUpTimers?: Partial<Record<PowerUpType, number>>;
  currentTheme: ThemeType;
  unlockedThemes: ThemeType[];
  onBuyTheme: (theme: ThemeType, price: number) => void;
  onThemeChange: (theme: ThemeType) => void;
  customSkin?: CustomSkinConfig;
  onCustomSkinChange?: (skin: CustomSkinConfig) => void;
  onBuyUpgrade: (type: keyof UpgradesState, price: number) => void;
  highPerformance: boolean;
  onPerformanceChange: (isHigh: boolean) => void;
  colorBlindMode: boolean;
  onColorBlindChange: (active: boolean) => void;
  // Super Ability EMP
  empEnergy: number;
  onTriggerEmp: () => void;
  // Boss State
  bossState: BossState | null;
  // Quests & Achievements
  quests: Quest[];
  onClaimQuest: (questId: string) => void;
  achievements: Achievement[];
  onClaimAchievement: (achievementId: string) => void;
  // Audio Controls
  sfxMuted: boolean;
  musicMuted: boolean;
  onToggleSfx: () => void;
  onToggleMusic: () => void;
  onResetAccount?: () => void;
  countdown?: number | null;
  showTutorial?: boolean;
  onDismissTutorial?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  gameHistory?: GameHistoryEntry[];
  timeAttackRemaining?: number;
  combo?: number;
  damageFlash?: boolean;
  totalDeflects?: number;
}

export const WHEEL_SEGMENTS: {
  type: PowerUpType;
  label: string;
  shortLabel: string;
  color: string;
  description: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { type: 'WIDE_SHIELD', label: 'Escudo Largo', shortLabel: 'Largo', color: '#a855f7', description: '+50% Largura do Escudo', Icon: LayoutTemplate },
  { type: 'DOUBLE_SCORE', label: 'Pontos x2', shortLabel: 'x2 Pts', color: '#fbbf24', description: 'Pontuação a Dobrar', Icon: Star },
  { type: 'SLOW_TIME', label: 'Câmara Lenta', shortLabel: 'Lento', color: '#22c55e', description: 'Inimigos -35% Velocidade', Icon: Turtle },
  { type: 'MAGNET_SHIELD', label: 'Escudo Expandido', shortLabel: 'Expandir', color: '#06b6d4', description: 'Alcance do Escudo +35% Maior', Icon: Maximize2 },
  { type: 'NANO_REPAIR', label: 'Super Regeneração', shortLabel: 'Regenerar', color: '#ec4899', description: 'Regeneração Contínua de Vida', Icon: HeartPulse },
  { type: 'INSTANT_CREDITS', label: '+1.500 Créditos', shortLabel: '+1.5k CR', color: '#eab308', description: '+1.500 CR Imediatos + Bónus Mineração', Icon: Coins },
  { type: 'EXPLOSIVE_DEFENSE', label: 'Onda Explosiva', shortLabel: 'Explosão', color: '#ef4444', description: 'Impactos Destroem Detritos Próximos', Icon: Zap },
  { type: 'TRIPLE_SCORE', label: 'Pontos x3 Hiperdrive', shortLabel: 'x3 Pts', color: '#3b82f6', description: 'Pontuação Triplicada Épica (x3)', Icon: Sparkles },
  { type: 'HYPER_EMP', label: 'Carga Total EMP', shortLabel: 'EMP Max', color: '#f97316', description: 'Carrega Barra EMP a 100% Rapidamente', Icon: Flame },
  { type: 'TIME_FREEZE', label: 'Congelamento Cósmico', shortLabel: 'Gelo', color: '#38bdf8', description: 'Inimigos e Detritos 65% Mais Lentos', Icon: Gauge },
  { type: 'DOUBLE_SHIELD', label: 'Escudo Duplo 360°', shortLabel: 'Duplo', color: '#10b981', description: 'Segundo Escudo Espelhado a 180°', Icon: Layers },
  { type: 'JACKPOT_CREDITS', label: 'Super Jackpot CR', shortLabel: 'Jackpot', color: '#f59e0b', description: '+5.000 Créditos Instantâneos', Icon: Gift },
  { type: 'EXTRA_SPINS_REWARD', label: '+3 Giros Grátis', shortLabel: '+3 Giros', color: '#8b5cf6', description: '+3 Giros Extra de Roleta Gratuitos', Icon: RotateCcw },
  { type: 'PLASMA_OVERCHARGE', label: 'Super Plasma', shortLabel: 'Plasma', color: '#d946ef', description: '+250 Pts por Bloqueio e Dano a Chefes', Icon: Crosshair },
  { type: 'INVULNERABILITY_BOOST', label: 'Campo de Força', shortLabel: 'Barreira', color: '#6366f1', description: 'Absorve Impacto Crítico ao Núcleo', Icon: Shield },
  { type: 'CREDIT_FRENZY', label: 'Fúria de Mineração', shortLabel: 'x3 CR', color: '#84cc16', description: 'Créditos de Fim de Jogo Triplicados', Icon: Coins },
  // 10 Novas Opções da Roleta
  { type: 'ORBITAL_LASER', label: 'Laser Orbital', shortLabel: 'Laser', color: '#f43f5e', description: 'Dispara raios periódicos que vaporizam detritos', Icon: Radio },
  { type: 'GRAVITY_PULL', label: 'Vórtice Gravitacional', shortLabel: 'Vórtice', color: '#0284c7', description: 'Atrai detritos para a trajetória do escudo', Icon: Orbit },
  { type: 'SUPER_MEGA_CREDITS', label: 'Mega Fortuna (+10.000 CR)', shortLabel: '+10k CR', color: '#ca8a04', description: '+10.000 Créditos instantâneos na conta', Icon: Trophy },
  { type: 'TRIPLE_SHIELD', label: 'Escudo Triplo 360°', shortLabel: 'Triplo', color: '#14b8a6', description: '3 Escudos simultâneos espaçados a 120°', Icon: Layers },
  { type: 'BOSS_SLAYER_BOOST', label: 'Exterminador de Chefes', shortLabel: 'Anti-Boss', color: '#dc2626', description: 'Dano duplo a chefes e +10k CR ao vencer', Icon: Target },
  { type: 'SUPER_SPINS_PACK', label: 'Pack Galáctico (+10 Giros)', shortLabel: '+10 Giros', color: '#c084fc', description: '+10 Giros Extra gratuitos na Roleta', Icon: Play },
  { type: 'CHAIN_LIGHTNING', label: 'Relâmpago em Cadeia', shortLabel: 'Raio', color: '#0ea5e9', description: 'Bloqueios disparam arcos elétricos em cadeia', Icon: Zap },
  { type: 'CORE_REPULSOR', label: 'Repulsor do Núcleo', shortLabel: 'Repulsor', color: '#a21caf', description: 'Onda cinética afasta projéteis do núcleo', Icon: Compass },
  { type: 'SCORE_FRENZY_5X', label: 'Hiper Pontuação x5', shortLabel: 'x5 Pts', color: '#fb923c', description: 'Multiplicador extremo de 5x a todos os pontos', Icon: Sparkles },
  { type: 'GIGA_JACKPOT', label: 'Jackpot Cósmico (+25.000 CR)', shortLabel: '+25k CR', color: '#e11d48', description: 'Prémio supremo de +25.000 Créditos imediatos', Icon: Gift },
];

const POWERUPS: Record<PowerUpType, PowerUpConfig> = {
  NONE: { type: 'NONE', label: 'Sem Bónus', color: '#64748b', description: 'Defesas Padrão' },
  WIDE_SHIELD: { type: 'WIDE_SHIELD', label: 'Escudo Largo', color: '#a855f7', description: '+50% Largura do Escudo' },
  DOUBLE_SCORE: { type: 'DOUBLE_SCORE', label: 'Pontos x2', color: '#fbbf24', description: 'Pontuação a Dobrar' },
  SLOW_TIME: { type: 'SLOW_TIME', label: 'Câmara Lenta', color: '#22c55e', description: 'Inimigos -35% Velocidade' },
  MAGNET_SHIELD: { type: 'MAGNET_SHIELD', label: 'Escudo Expandido', color: '#06b6d4', description: 'Alcance do Escudo +35% Maior' },
  NANO_REPAIR: { type: 'NANO_REPAIR', label: 'Super Regeneração', color: '#ec4899', description: 'Regeneração Contínua de Vida' },
  INSTANT_CREDITS: { type: 'INSTANT_CREDITS', label: '+1.500 Créditos', color: '#eab308', description: '+1.500 CR Imediatos + Bónus Mineração' },
  EXPLOSIVE_DEFENSE: { type: 'EXPLOSIVE_DEFENSE', label: 'Onda Explosiva', color: '#ef4444', description: 'Impactos Destroem Detritos Próximos' },
  TRIPLE_SCORE: { type: 'TRIPLE_SCORE', label: 'Pontos x3 Hiperdrive', color: '#3b82f6', description: 'Pontuação Triplicada Épica (x3)' },
  HYPER_EMP: { type: 'HYPER_EMP', label: 'Carga Total EMP', color: '#f97316', description: 'Carrega Barra EMP a 100% Rapidamente' },
  TIME_FREEZE: { type: 'TIME_FREEZE', label: 'Congelamento Cósmico', color: '#38bdf8', description: 'Inimigos e Detritos 65% Mais Lentos' },
  DOUBLE_SHIELD: { type: 'DOUBLE_SHIELD', label: 'Escudo Duplo 360°', color: '#10b981', description: 'Segundo Escudo Espelhado a 180°' },
  JACKPOT_CREDITS: { type: 'JACKPOT_CREDITS', label: 'Super Jackpot CR', color: '#f59e0b', description: '+5.000 Créditos Instantâneos' },
  EXTRA_SPINS_REWARD: { type: 'EXTRA_SPINS_REWARD', label: '+3 Giros Grátis', color: '#8b5cf6', description: '+3 Giros Extra de Roleta Gratuitos' },
  PLASMA_OVERCHARGE: { type: 'PLASMA_OVERCHARGE', label: 'Super Plasma', color: '#d946ef', description: '+250 Pts por Bloqueio e Dano a Chefes' },
  INVULNERABILITY_BOOST: { type: 'INVULNERABILITY_BOOST', label: 'Campo de Força', color: '#6366f1', description: 'Absorve Impacto Crítico ao Núcleo' },
  CREDIT_FRENZY: { type: 'CREDIT_FRENZY', label: 'Fúria de Mineração', color: '#84cc16', description: 'Créditos de Fim de Jogo Triplicados' },
  ORBITAL_LASER: { type: 'ORBITAL_LASER', label: 'Laser Orbital', color: '#f43f5e', description: 'Dispara raios periódicos que vaporizam detritos' },
  GRAVITY_PULL: { type: 'GRAVITY_PULL', label: 'Vórtice Gravitacional', color: '#0284c7', description: 'Atrai detritos para a trajetória do escudo' },
  SUPER_MEGA_CREDITS: { type: 'SUPER_MEGA_CREDITS', label: 'Mega Fortuna (+10.000 CR)', color: '#ca8a04', description: '+10.000 Créditos instantâneos na conta' },
  TRIPLE_SHIELD: { type: 'TRIPLE_SHIELD', label: 'Escudo Triplo 360°', color: '#14b8a6', description: '3 Escudos simultâneos espaçados a 120°' },
  BOSS_SLAYER_BOOST: { type: 'BOSS_SLAYER_BOOST', label: 'Exterminador de Chefes', color: '#dc2626', description: 'Dano duplo a chefes e +10k CR ao vencer' },
  SUPER_SPINS_PACK: { type: 'SUPER_SPINS_PACK', label: 'Pack Galáctico (+10 Giros)', color: '#c084fc', description: '+10 Giros Extra gratuitos na Roleta' },
  CHAIN_LIGHTNING: { type: 'CHAIN_LIGHTNING', label: 'Relâmpago em Cadeia', color: '#0ea5e9', description: 'Bloqueios disparam arcos elétricos em cadeia' },
  CORE_REPULSOR: { type: 'CORE_REPULSOR', label: 'Repulsor do Núcleo', color: '#a21caf', description: 'Onda cinética afasta projéteis do núcleo' },
  SCORE_FRENZY_5X: { type: 'SCORE_FRENZY_5X', label: 'Hiper Pontuação x5', color: '#fb923c', description: 'Multiplicador extremo de 5x a todos os pontos' },
  GIGA_JACKPOT: { type: 'GIGA_JACKPOT', label: 'Jackpot Cósmico (+25.000 CR)', color: '#e11d48', description: 'Prémio supremo de +25.000 Créditos imediatos' },
};

const SkinPreviewCanvas: React.FC<{ coreColor: string; shieldColor: string; pattern: string; size?: number }> = ({ coreColor, shieldColor, pattern, size = 140 }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = size;
    const cx = s / 2, cy = s / 2;
    ctx.clearRect(0, 0, s, s);

    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.48);
    bgGrad.addColorStop(0, 'rgba(15,23,42,0.9)');
    bgGrad.addColorStop(1, 'rgba(2,6,23,1)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, s, s);

    const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.4);
    glowGrad.addColorStop(0, coreColor + '40');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, s, s);

    const coreR = s * 0.12;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fillStyle = coreColor;
    ctx.shadowBlur = 20;
    ctx.shadowColor = coreColor;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff40';
    ctx.fill();

    if (pattern === 'NEON_RINGS') {
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, coreR + i * 6, 0, Math.PI * 2);
        ctx.strokeStyle = coreColor + '30';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else if (pattern === 'ENERGY_MATRIX') {
      ctx.strokeStyle = coreColor + '25';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * s * 0.35, cy + Math.sin(a) * s * 0.35);
        ctx.stroke();
      }
    } else if (pattern === 'GOLD_STARS') {
      ctx.fillStyle = '#fbbf2440';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const r = coreR + 14;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const shieldDist = s * 0.32;
    const shieldArc = Math.PI / 3;
    ctx.beginPath();
    ctx.arc(cx, cy, shieldDist, -shieldArc / 2, shieldArc / 2);
    ctx.strokeStyle = shieldColor;
    ctx.lineWidth = s * 0.04;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 15;
    ctx.shadowColor = shieldColor;
    ctx.stroke();
    ctx.shadowBlur = 0;

  }, [coreColor, shieldColor, pattern, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-xl border border-slate-700" />;
};

const PowerUpPreviewCanvas: React.FC<{ type: PowerUpType; color: string; size?: number }> = ({ type, color, size = 48 }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = size;
    const cx = s / 2, cy = s / 2;
    ctx.clearRect(0, 0, s, s);

    const coreR = s * 0.12;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#38bdf8';
    ctx.fill();
    ctx.shadowBlur = 0;

    const shieldDist = s * 0.32;
    const baseArc = Math.PI / 3;

    if (type === 'WIDE_SHIELD') {
      ctx.beginPath();
      ctx.arc(cx, cy, shieldDist, -baseArc * 0.75, baseArc * 0.75);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
      ctx.stroke();
    } else if (type === 'DOUBLE_SHIELD') {
      ctx.beginPath();
      ctx.arc(cx, cy, shieldDist, -baseArc / 2, baseArc / 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, shieldDist, Math.PI - baseArc / 2, Math.PI + baseArc / 2);
      ctx.stroke();
    } else if (type === 'TRIPLE_SHIELD') {
      for (let i = 0; i < 3; i++) {
        const offset = (i * 2 * Math.PI) / 3;
        ctx.beginPath();
        ctx.arc(cx, cy, shieldDist, offset - baseArc / 2, offset + baseArc / 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    } else if (type === 'ORBITAL_LASER') {
      ctx.beginPath();
      ctx.arc(cx, cy, shieldDist, -baseArc / 2, baseArc / 2);
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + shieldDist * 0.7, cy - 2);
      ctx.lineTo(cx + s * 0.45, cy - 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 6;
      ctx.shadowColor = color;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (type === 'CHAIN_LIGHTNING') {
      ctx.beginPath();
      ctx.arc(cx, cy, shieldDist, -baseArc / 2, baseArc / 2);
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 10, cy - 5);
      ctx.lineTo(cx + 16, cy);
      ctx.lineTo(cx + 12, cy + 2);
      ctx.lineTo(cx + 20, cy + 6);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 6;
      ctx.shadowColor = color;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (type === 'SLOW_TIME' || type === 'TIME_FREEZE') {
      ctx.beginPath();
      ctx.arc(cx, cy, shieldDist, -baseArc / 2, baseArc / 2);
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.fillStyle = color + '30';
      ctx.beginPath();
      ctx.arc(cx, cy, shieldDist - 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'EXPLOSIVE_DEFENSE') {
      ctx.beginPath();
      ctx.arc(cx, cy, shieldDist, -baseArc / 2, baseArc / 2);
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const r = shieldDist * 0.6;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2, 0, Math.PI * 2);
        ctx.fillStyle = color + '80';
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, shieldDist, -baseArc / 2, baseArc / 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [type, color, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />;
};

const DISPLAY_SEGMENTS = 12;
const Wheel: React.FC<{ onComplete: (type: PowerUpType) => void, spinning: boolean, lastResult: PowerUpType }> = ({ onComplete, spinning, lastResult }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<typeof WHEEL_SEGMENTS[0] | null>(null);

  const visibleSegments = WHEEL_SEGMENTS.slice(0, DISPLAY_SEGMENTS);
  const segmentAngle = (2 * Math.PI) / DISPLAY_SEGMENTS;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 4;

    ctx.clearRect(0, 0, size, size);

    visibleSegments.forEach((seg, i) => {
      const startAngle = i * segmentAngle - Math.PI / 2;
      const endAngle = startAngle + segmentAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx + Math.cos(startAngle) * r,
        cy + Math.sin(startAngle) * r
      );
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const midAngle = startAngle + segmentAngle / 2;
      const textR = r * 0.65;
      const tx = cx + Math.cos(midAngle) * textR;
      const ty = cy + Math.sin(midAngle) * textR;

      ctx.save();
      ctx.translate(tx, ty);
      const textAngle = midAngle + Math.PI / 2;
      const flip = midAngle > 0 && midAngle < Math.PI;
      ctx.rotate(flip ? textAngle + Math.PI : textAngle);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 4;
      ctx.fillText(seg.shortLabel, 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', cx, cy);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.stroke();
  }, []);

  useEffect(() => {
    if (spinning) {
      setShowResult(false);
      setResultData(null);
      const randomIdx = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
      const displayIdx = randomIdx % DISPLAY_SEGMENTS;
      const segAngleDeg = 360 / DISPLAY_SEGMENTS;
      const targetAngle = displayIdx * segAngleDeg + segAngleDeg / 2;
      const newRotation = rotation + 1440 + (360 - targetAngle);
      setRotation(newRotation);

      const tickInterval = setInterval(() => {
        soundEngine.playRouletteTick();
      }, 150);

      setTimeout(() => {
        clearInterval(tickInterval);
        const result = WHEEL_SEGMENTS[randomIdx];
        setResultData(result);
        setShowResult(true);
        onComplete(result.type);
      }, 3200);
    }
  }, [spinning]);

  const resultSeg = resultData || (lastResult !== 'NONE' ? WHEEL_SEGMENTS.find(s => s.type === lastResult) : null);

  return (
    <div className="flex flex-col items-center mb-4">
      <div className="relative w-52 h-52 sm:w-60 sm:h-60 mx-auto select-none">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
          <div className="w-0 h-0 border-l-[11px] border-l-transparent border-t-[18px] border-t-amber-400 border-r-[11px] border-r-transparent filter drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]"></div>
        </div>

        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-full shadow-[0_0_25px_rgba(0,0,0,0.8)] transition-transform duration-[3200ms] ease-[cubic-bezier(0.2,0.85,0.25,1)]"
          style={{ transform: `rotate(-${rotation}deg)` }}
        />
      </div>

      {showResult && resultSeg && (
        <div className="mt-3 w-full animate-in zoom-in-95 fade-in duration-300">
          <div className="flex items-center gap-3 p-3 rounded-xl border-2 shadow-lg" style={{ borderColor: resultSeg.color, backgroundColor: resultSeg.color + '15' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-slate-950" style={{ backgroundColor: resultSeg.color }}>
              <resultSeg.Icon size={20} />
            </div>
            <div className="min-w-0">
              <span className="text-white font-black text-sm block truncate">{resultSeg.label}</span>
              <span className="text-slate-400 text-[10px] block">{resultSeg.description}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GameUI: React.FC<GameUIProps> = ({ 
  gameState, gameMode, onGameModeChange, score, health, maxHealth, level, highScore, credits, upgrades, difficulty, onDifficultyChange,
  report, loadingReport, earnedCredits, extraSpins, onBuySpins, onUseExtraSpin, onAwardCredits,
  hasMultiBonus, multiBonusSlots = 0, equippedPowerUps = [], unlockedPowerUps = [], onBuyMultiBonus, onToggleEquipPowerUp, onEquipAllPowerUps, onClearEquippedPowerUps,
  onStart, onExitGame, onPowerUpSelected, activePowerUp, activePowerUps = [], powerUpTimers = {},
  currentTheme, unlockedThemes, onBuyTheme, onThemeChange, customSkin = { coreColor: '#a855f7', shieldColor: '#06b6d4', pattern: 'ENERGY_MATRIX' }, onCustomSkinChange,
  onBuyUpgrade, highPerformance, onPerformanceChange, colorBlindMode, onColorBlindChange,
  empEnergy, onTriggerEmp, bossState, quests, onClaimQuest, achievements, onClaimAchievement,
  sfxMuted, musicMuted, onToggleSfx, onToggleMusic, onResetAccount,
  countdown, showTutorial, onDismissTutorial, onPause, onResume, gameHistory = [],
  timeAttackRemaining = 90, combo = 0, damageFlash = false, totalDeflects = 0
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [missionsTab, setMissionsTab] = useState<'QUESTS' | 'ACHIEVEMENTS' | 'RANKS'>('QUESTS');
  const [isCustomizingSkin, setIsCustomizingSkin] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toasts, setToasts] = useState<{id: string; text: string; color: string; icon: string}[]>([]);
  const [bestCombo, setBestCombo] = useState(0);
  
  // Wheel state
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [wheelResult, setWheelResult] = useState<PowerUpType>('NONE');

  const hasAvailableSpins = !hasSpun || extraSpins > 0;

  const addToast = (text: string, color: string, icon: string = '✨') => {
    const id = Math.random().toString(36);
    setToasts(prev => [...prev.slice(-3), { id, text, color, icon }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  useEffect(() => {
    if (combo > bestCombo) setBestCombo(combo);
    if (combo === 5) addToast('Combo x5! Incrível!', '#facc15', '🔥');
    else if (combo === 10) addToast('Combo x10! Imparável!', '#f97316', '⚡');
    else if (combo === 20) addToast('Combo x20! LENDÁRIO!', '#ef4444', '🌟');
  }, [combo]);

  useEffect(() => {
    if (gameState === GameState.PLAYING && level > 1) {
      addToast(`Nível ${level} alcançado!`, '#facc15', '⬆️');
    }
  }, [level]);

  useEffect(() => {
    if (damageFlash) addToast('Núcleo atingido!', '#ef4444', '💥');
  }, [damageFlash]);

  // Unclaimed rewards count
  const claimableQuestsCount = quests.filter(q => q.completed && !q.claimed).length;
  const claimableAchievementsCount = achievements.filter(a => a.unlocked && a.progress >= a.target).length;
  const totalClaimable = claimableQuestsCount;

  // Current pilot rank
  const currentRank = [...PILOT_RANKS].reverse().find(r => highScore >= r.minScore) || PILOT_RANKS[0];

  const handleSpinClick = () => {
    if (isSpinning) return;
    if (hasSpun && extraSpins > 0) {
      onUseExtraSpin();
    } else if (hasSpun && extraSpins <= 0) {
      return;
    }
    setIsSpinning(true);
  };

  const handleWheelComplete = (result: PowerUpType) => {
    setIsSpinning(false);
    setHasSpun(true);
    setWheelResult(result);
    if (onPowerUpSelected) onPowerUpSelected(result);

    const miningMultiplier = 1 + (upgrades.mining * UPGRADES.MINING.bonusPerLevel);

    if (result === 'INSTANT_CREDITS' && onAwardCredits) {
      const bonusCr = Math.round(1500 * miningMultiplier);
      onAwardCredits(bonusCr);
    } else if (result === 'JACKPOT_CREDITS' && onAwardCredits) {
      const bonusCr = Math.round(5000 * miningMultiplier);
      onAwardCredits(bonusCr);
      soundEngine.playLevelUp();
    } else if (result === 'SUPER_MEGA_CREDITS' && onAwardCredits) {
      const bonusCr = Math.round(10000 * miningMultiplier);
      onAwardCredits(bonusCr);
      soundEngine.playLevelUp();
    } else if (result === 'GIGA_JACKPOT' && onAwardCredits) {
      const bonusCr = Math.round(25000 * miningMultiplier);
      onAwardCredits(bonusCr);
      soundEngine.playLevelUp();
    } else if (result === 'EXTRA_SPINS_REWARD') {
      onBuySpins(3, 0);
      soundEngine.playLevelUp();
    } else if (result === 'SUPER_SPINS_PACK') {
      onBuySpins(10, 0);
      soundEngine.playLevelUp();
    }
  };

  const getHealthColor = () => {
    if (colorBlindMode) {
      if (health > 66) return "bg-blue-500";
      if (health > 33) return "bg-yellow-400";
      return "bg-orange-600 animate-pulse";
    }
    if (health > 66) return "bg-sky-500";
    if (health > 33) return "bg-yellow-500";
    return "bg-red-600 animate-pulse";
  };

  const enterFullscreen = () => {
    const docEl = document.documentElement;
    try {
      if (docEl.requestFullscreen) docEl.requestFullscreen();
      else if ((docEl as any).webkitRequestFullscreen) (docEl as any).webkitRequestFullscreen();
    } catch (e) { console.warn("Fullscreen failed", e); }
  };

  const getUpgradePrice = (base: number, multiplier: number, l: number) => Math.floor(base * Math.pow(multiplier, l));

  return (
    <div className={`absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden bg-transparent z-50 ${colorBlindMode ? 'saturate-[1.2]' : ''}`}>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-screen bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40 mix-blend-multiply bg-[radial-gradient(circle,rgba(0,0,0,0)_60%,rgba(0,0,0,1)_100%)]"></div>

      {health < 35 && gameState === GameState.PLAYING && (
        <div className={`absolute inset-0 pointer-events-none z-0 border-[20px] ${colorBlindMode ? 'border-orange-500/20' : 'border-red-600/20'} animate-pulse mix-blend-overlay`}></div>
      )}

      {/* Damage flash overlay */}
      {damageFlash && gameState === GameState.PLAYING && (
        <div className={`absolute inset-0 pointer-events-none z-[5] ${colorBlindMode ? 'bg-orange-500/20' : 'bg-red-500/20'} animate-[flash_0.4s_ease-out_forwards]`}></div>
      )}

      {/* Toast notifications */}
      <div className="fixed top-16 sm:top-20 right-3 sm:right-6 z-[55] pointer-events-none flex flex-col gap-2 items-end">
        {toasts.map(toast => (
          <div key={toast.id} className="animate-in slide-in-from-right fade-in duration-300 bg-slate-950/90 backdrop-blur border border-slate-700 px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs">
            <span>{toast.icon}</span>
            <span className="font-bold" style={{ color: toast.color }}>{toast.text}</span>
          </div>
        ))}
      </div>

      {/* Combo display */}
      {combo >= 3 && gameState === GameState.PLAYING && (
        <div className="fixed bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-[15] pointer-events-none animate-in zoom-in-75 duration-200">
          <div className={`text-center ${combo >= 10 ? 'scale-125' : ''} transition-transform`}>
            <div className="text-2xl sm:text-3xl font-black tracking-wider" style={{ color: combo >= 20 ? '#ef4444' : combo >= 10 ? '#f97316' : '#facc15', textShadow: `0 0 20px ${combo >= 20 ? '#ef4444' : combo >= 10 ? '#f97316' : '#f59e0b'}` }}>
              COMBO x{combo}
            </div>
            {combo >= 5 && <div className="text-[10px] text-amber-300 font-bold uppercase tracking-widest mt-0.5">{combo >= 20 ? 'LENDÁRIO' : combo >= 10 ? 'IMPARÁVEL' : 'INCRÍVEL'}</div>}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start w-full pointer-events-auto relative z-10 p-3 sm:p-6">
        <div className="flex flex-col gap-2 min-w-0">
          <div>
            <h1 className="text-base sm:text-2xl font-bold text-white tracking-widest flex items-center gap-1.5 sm:gap-2 shadow-black drop-shadow-md">
              <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-pink-400 shrink-0" />
              <span className="truncate">O NÚCLEO<span className="text-sky-400"> DO ESPAÇO</span></span>
            </h1>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
              <p className="text-slate-400 text-[10px] sm:text-xs hidden sm:block">SISTEMA DE DEFESA DO NÚCLEO</p>
              <div className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${DIFFICULTIES[difficulty].badgeBg}`}>
                <Gauge size={11} />
                <span>{DIFFICULTIES[difficulty].label}</span>
              </div>
              <div className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-bold border border-slate-700 bg-slate-900/80 text-slate-300">
                <span>{GAME_MODES[gameMode].name}</span>
              </div>
            </div>
          </div>
          {gameState !== GameState.MENU && gameMode !== 'ZEN' && (
            <div className="mt-2 w-32 sm:w-48 animate-in slide-in-from-left duration-500">
              <div className="flex justify-between text-[10px] text-slate-300 uppercase font-bold mb-1">
                <span>Integridade</span>
                <span className={health < 35 ? (colorBlindMode ? "text-orange-400" : "text-red-500") : "text-sky-400"}>{Math.max(0, Math.round(health))}/{Math.round(maxHealth)}</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div className={`h-full ${getHealthColor()} transition-all duration-300 ease-out`} style={{ width: `${Math.min(100, (Math.max(0, health)/maxHealth)*100)}%` }} />
              </div>
            </div>
          )}
        </div>
        
        {/* Boss Health Bar on Top of HUD */}
        {gameState === GameState.PLAYING && bossState && bossState.active && (
          <div className="absolute left-1/2 -translate-x-1/2 top-4 w-full max-w-md px-4 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300 z-30">
            <div className="bg-slate-950/90 backdrop-blur-md border-2 border-red-500/70 p-3 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.4)] w-full">
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-red-500 animate-bounce" />
                  <span className="text-xs font-black tracking-widest text-red-400 uppercase">{bossState.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{Math.max(0, Math.round(bossState.health))} / {bossState.maxHealth} HP</span>
              </div>
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-red-950 p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 rounded-full transition-all duration-150"
                  style={{ width: `${Math.min(100, Math.max(0, (bossState.health / bossState.maxHealth) * 100))}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-1 italic">{bossState.title}</p>
            </div>
          </div>
        )}

        {/* Level and Exit Button when playing */}
        {gameState === GameState.PLAYING && (
          <div className="fixed left-3 bottom-3 sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-0 sm:mt-6 flex items-center gap-1.5 sm:gap-2.5 z-30">
             <div className="bg-slate-900/80 backdrop-blur border border-slate-700 px-3 sm:px-4 py-1.5 rounded-full shadow-lg shadow-black/50 flex items-center gap-1.5 sm:gap-2">
                <Layers size={14} className="text-yellow-400" />
                <span className="text-yellow-400 font-bold font-mono tracking-widest text-xs">NÍVEL {level}</span>
             </div>
             {gameMode === 'TIME_ATTACK' && (
               <div className={`bg-slate-900/80 backdrop-blur border px-3 sm:px-4 py-1.5 rounded-full shadow-lg shadow-black/50 flex items-center gap-1.5 sm:gap-2 ${timeAttackRemaining <= 15 ? 'border-red-500 animate-pulse' : 'border-slate-700'}`}>
                 <Clock size={14} className={timeAttackRemaining <= 15 ? 'text-red-400' : 'text-sky-400'} />
                 <span className={`font-bold font-mono tracking-widest text-xs ${timeAttackRemaining <= 15 ? 'text-red-400' : 'text-sky-400'}`}>
                   {Math.floor(timeAttackRemaining / 60)}:{(timeAttackRemaining % 60).toString().padStart(2, '0')}
                 </span>
               </div>
             )}
             <button
               id="in-game-exit-btn"
               onClick={() => setShowExitConfirm(true)}
               className="bg-rose-950/70 hover:bg-rose-900/90 text-rose-300 hover:text-white border border-rose-500/50 hover:border-rose-400 px-3 sm:px-3.5 py-1.5 rounded-full shadow-lg shadow-rose-950/50 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 group cursor-pointer backdrop-blur"
               title="Abandonar combate e voltar ao menu"
             >
               <LogOut size={13} className="text-rose-400 group-hover:-translate-x-0.5 transition-transform" />
               <span>Sair</span>
             </button>
          </div>
        )}

        {/* Right Header: Credits, Score, Audio & Power-ups */}
        <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0">
           <div className="flex items-center gap-1.5 sm:gap-2">
             {/* Audio Toggles */}
             <button
               onClick={onToggleSfx}
               className={`p-1 sm:p-1.5 rounded-lg border text-xs transition-colors backdrop-blur ${sfxMuted ? 'bg-slate-900/80 border-slate-800 text-slate-500' : 'bg-slate-900/80 border-sky-500/40 text-sky-400'}`}
               title={sfxMuted ? "Efeitos Sonoros Desativados" : "Efeitos Sonoros Ativados"}
             >
               {sfxMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
             </button>
             <button
               onClick={onToggleMusic}
               className={`p-1 sm:p-1.5 rounded-lg border text-xs transition-colors backdrop-blur ${musicMuted ? 'bg-slate-900/80 border-slate-800 text-slate-500' : 'bg-slate-900/80 border-purple-500/40 text-purple-400'}`}
               title={musicMuted ? "Música Espacial Desativada" : "Música Espacial Ativada"}
             >
               <Music size={14} />
             </button>

             <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/80 backdrop-blur border border-yellow-500/40 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-lg shadow-yellow-500/10">
                <Coins size={13} className="text-yellow-400 animate-pulse sm:hidden" />
                <Coins size={15} className="text-yellow-400 animate-pulse hidden sm:block" />
                <span className="text-yellow-400 font-mono text-xs sm:text-sm font-black tracking-wider flex items-center gap-1">
                  {credits >= 999999999 ? (
                    <>
                      <span className="text-lg leading-none">∞</span>
                      <span className="text-xs text-yellow-300/80 font-normal">(INFINITO)</span>
                    </>
                  ) : (
                    `${credits.toLocaleString()} CR`
                  )}
                </span>
             </div>
           </div>
           
           <div className="text-right">
            <div className="text-xl sm:text-3xl font-mono text-white font-bold drop-shadow-md">{score.toLocaleString()}</div>
            <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Pontuação</div>
          </div>
          
          {/* Active Power-Ups — hidden during gameplay to avoid blocking the view */}
        </div>
      </div>

      {/* In-Game EMP Super Ability Button (Bottom Right) */}
      {gameState === GameState.PLAYING && (
        <div className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-40 pointer-events-auto flex flex-col items-end gap-2 animate-in slide-in-from-bottom duration-300">
          <button
            id="in-game-emp-btn"
            onClick={onTriggerEmp}
            disabled={empEnergy < 100}
            className={`relative group px-3 py-2.5 sm:px-5 sm:py-3.5 rounded-2xl flex items-center gap-2 sm:gap-3 transition-all duration-300 font-black text-[10px] sm:text-xs uppercase tracking-wider ${
              empEnergy >= 100
                ? 'bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 text-slate-950 shadow-[0_0_35px_rgba(56,189,248,0.8)] scale-105 animate-pulse cursor-pointer hover:scale-110'
                : 'bg-slate-950/80 backdrop-blur border border-slate-800 text-slate-500 cursor-not-allowed opacity-85'
            }`}
          >
            <div className="relative">
              <Zap size={18} className={empEnergy >= 100 ? 'text-slate-950 animate-bounce' : 'text-sky-500'} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline">ONDA DE CHOQUE EMP</span>
                <span className="sm:hidden">EMP</span>
                <span className="font-mono text-[10px] sm:text-[11px]">{Math.round(empEnergy)}%</span>
              </div>
              <span className="text-[9px] font-normal normal-case block opacity-80">
                {empEnergy >= 100 ? 'PRONTO! Toca para ativar' : 'Carrega ao defender'}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Main Menu State */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-10 px-4">
          <div className="text-center animate-in zoom-in duration-500 max-w-lg w-full">
             
             {/* Game Mode Selector */}
             <div className="mb-4 bg-slate-950/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 shadow-2xl animate-in fade-in slide-in-from-bottom duration-300" style={{ animationDelay: '50ms', animationFillMode: 'both' }}>
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2.5 flex items-center justify-between">
                 <div className="flex items-center gap-1.5">
                   <Target size={13} className="text-cyan-400" />
                   <span>Modo de Jogo</span>
                 </div>
                 <span className={`text-[10px] font-bold ${currentRank.color}`}>{currentRank.title}</span>
               </div>
               
               <div className="grid grid-cols-3 gap-2">
                 {(['CLASSIC', 'SURVIVAL', 'BOSS_RUSH', 'ZEN', 'TIME_ATTACK'] as GameMode[]).map((mKey) => {
                   const m = GAME_MODES[mKey];
                   const isSelected = gameMode === mKey;
                   return (
                     <button
                       key={mKey}
                       onClick={() => onGameModeChange(mKey)}
                       className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl transition-all font-bold text-xs border ${
                         isSelected
                           ? 'bg-slate-900 border-cyan-400 text-white shadow-lg shadow-cyan-500/20 scale-[1.02] ring-1 ring-cyan-400'
                           : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                       }`}
                     >
                       <span className="font-black tracking-wider text-[11px]">{m.name}</span>
                       <span className="text-[9px] opacity-75 font-normal mt-0.5">{m.tag}</span>
                     </button>
                   );
                 })}
               </div>
               <p className="text-slate-400 text-[11px] mt-2.5 leading-tight">
                 {GAME_MODES[gameMode].description}
               </p>
             </div>

             {/* Difficulty Selector */}
             <div className="mb-4 bg-slate-950/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 shadow-2xl animate-in fade-in slide-in-from-bottom duration-300" style={{ animationDelay: '120ms', animationFillMode: 'both' }}>
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5">
                 <Gauge size={13} className="text-sky-400" />
                 <span>Selecionar Dificuldade</span>
               </div>
               
               <div className="grid grid-cols-3 gap-2">
                 {(['EASY', 'MEDIUM', 'HARD'] as DifficultyType[]).map((diffKey) => {
                   const d = DIFFICULTIES[diffKey];
                   const isSelected = difficulty === diffKey;
                   return (
                     <button
                       key={diffKey}
                       id={`difficulty-${diffKey.toLowerCase()}-btn`}
                       onClick={() => onDifficultyChange(diffKey)}
                       className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-all font-bold text-xs border ${
                         isSelected
                           ? `${d.badgeBg} shadow-lg scale-[1.03] ring-1 ring-white/20`
                           : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                       }`}
                     >
                       <span className="font-black tracking-wider text-xs">{d.label}</span>
                       <span className="text-[10px] font-mono opacity-80 mt-0.5">
                         {diffKey === 'EASY' ? '0.8x CR' : diffKey === 'MEDIUM' ? '1.0x CR' : '+50% CR'}
                       </span>
                     </button>
                   );
                 })}
               </div>
             </div>

             {/* Primary Play Button */}
             <button
               id="main-start-game-btn"
               style={{ animationDelay: '200ms', animationFillMode: 'both' }}
               onClick={() => { enterFullscreen(); onStart(); }}
               className="w-full group relative px-12 py-4 bg-white hover:bg-sky-400 text-slate-900 hover:text-white transition-all duration-300 rounded-2xl font-black text-2xl tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(56,189,248,0.6)] hover:scale-105 flex items-center justify-center gap-3 overflow-hidden animate-in fade-in slide-in-from-bottom duration-300"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                <Play size={28} fill="currentColor" />
                INICIAR JOGO
             </button>

             {/* Secondary Menu Buttons */}
             <div className="grid grid-cols-4 gap-2 mt-3.5 animate-in fade-in slide-in-from-bottom duration-300" style={{ animationDelay: '280ms', animationFillMode: 'both' }}>
               <button
                 id="menu-missions-btn"
                 onClick={() => { setIsMissionsOpen(true); setIsSettingsOpen(false); setIsShopOpen(false); setIsStatsOpen(false); }}
                 className="py-3 px-2 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 hover:from-slate-850 hover:to-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-wider border-2 border-slate-700 hover:border-emerald-400 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 hover:scale-[1.03] shadow-xl shadow-black/50 group relative"
               >
                 <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30 group-hover:bg-emerald-500/30 transition-colors">
                   <Award size={18} className="text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                 </div>
                 <span className="block leading-none text-white text-xs font-bold">Missões</span>
                 {totalClaimable > 0 && (
                   <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] font-black text-slate-950 items-center justify-center">
                       {totalClaimable}
                     </span>
                   </span>
                 )}
               </button>

               <button
                 id="menu-settings-btn"
                 onClick={() => { setIsSettingsOpen(true); setIsShopOpen(false); setIsMissionsOpen(false); setIsStatsOpen(false); }}
                 className="py-3 px-2 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 hover:from-slate-850 hover:to-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-wider border-2 border-slate-700 hover:border-sky-400 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 hover:scale-[1.03] shadow-xl shadow-black/50 group"
               >
                 <div className="w-8 h-8 rounded-xl bg-sky-500/20 flex items-center justify-center border border-sky-400/30 group-hover:bg-sky-500/30 transition-colors">
                   <Settings size={18} className="text-sky-400 group-hover:rotate-90 transition-transform duration-500" />
                 </div>
                 <span className="block leading-none text-white text-xs font-bold">Opções</span>
               </button>

               <button
                 id="menu-shop-btn"
                 onClick={() => { setIsShopOpen(true); setIsSettingsOpen(false); setIsMissionsOpen(false); setIsStatsOpen(false); }}
                 className="py-3 px-2 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 hover:from-slate-850 hover:to-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-wider border-2 border-slate-700 hover:border-amber-400 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 hover:scale-[1.03] shadow-xl shadow-black/50 group relative"
               >
                 <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-400/30 group-hover:bg-amber-500/30 transition-colors">
                   <ShoppingBag size={18} className="text-amber-400 group-hover:scale-110 transition-transform duration-300" />
                 </div>
                 <span className="block leading-none text-white text-xs font-bold">Loja</span>
                 {hasAvailableSpins && (
                   <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-slate-950"></span>
                   </span>
                 )}
               </button>

               <button
                 onClick={() => { setIsStatsOpen(true); setIsShopOpen(false); setIsSettingsOpen(false); setIsMissionsOpen(false); }}
                 className="py-3 px-2 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 hover:from-slate-850 hover:to-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-wider border-2 border-slate-700 hover:border-purple-400 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 hover:scale-[1.03] shadow-xl shadow-black/50 group"
               >
                 <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-400/30 group-hover:bg-purple-500/30 transition-colors">
                   <Trophy size={18} className="text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                 </div>
                 <span className="block leading-none text-white text-xs font-bold">Stats</span>
               </button>
             </div>

             <button
               onClick={() => setIsAboutOpen(true)}
               className="mt-4 flex items-center justify-center gap-1.5 mx-auto text-slate-500 hover:text-sky-400 text-xs uppercase tracking-[0.15em] transition-colors group"
             >
               <User size={12} className="group-hover:scale-110 transition-transform" />
               <span>Criado por Miguel Sousa</span>
             </button>
          </div>
        </div>
      )}
      
      {/* Game Over Modal */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-20 bg-black/40 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-[#020617] border border-red-900/50 p-4 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full text-center mx-3 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-center mb-3 sm:mb-4 text-red-500">
               <AlertTriangle size={36} className="animate-pulse sm:hidden" />
               <AlertTriangle size={48} className="animate-pulse hidden sm:block" />
             </div>
            <h2 className="text-2xl sm:text-4xl text-white font-bold mb-1 tracking-tighter">FALHA CRÍTICA</h2>
            <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
              <p className="text-red-400 text-xs uppercase tracking-widest">Integridade do Núcleo: 0%</p>
              <span className="text-slate-600">•</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${DIFFICULTIES[difficulty].badgeBg}`}>
                {DIFFICULTIES[difficulty].label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-black/60 border border-slate-700 p-3 sm:p-4 rounded-xl shadow-inner">
                <div className="text-[10px] sm:text-xs text-slate-400 font-bold tracking-wider mb-1">PONTUAÇÃO</div>
                <div className="text-xl sm:text-3xl text-white font-mono font-black tracking-tight">{score.toLocaleString()}</div>
              </div>
              <div className="bg-black/60 border border-slate-700 p-3 sm:p-4 rounded-xl shadow-inner">
                <div className="text-[10px] sm:text-xs text-slate-400 font-bold tracking-wider mb-1">RECORDE</div>
                <div className="text-xl sm:text-3xl text-yellow-400 font-mono font-black tracking-tight">{highScore.toLocaleString()}</div>
              </div>
            </div>
            <div className="mb-6">
               <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-yellow-500/30 px-6 py-3 rounded-xl flex items-center justify-between">
                 <div className="text-left">
                   <span className="text-slate-300 text-xs font-bold uppercase tracking-wider block">Créditos Ganhos</span>
                   <span className="text-[10px] text-slate-400">Multiplicador {DIFFICULTIES[difficulty].creditsMultiplier}x</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Coins size={20} className="text-yellow-400 drop-shadow-md" />
                    <span className="text-yellow-400 font-mono font-black text-xl drop-shadow-md">+{earnedCredits}</span>
                 </div>
               </div>
            </div>
            <div className="bg-black/40 rounded-lg p-4 mb-6 text-left border-l-4 border-sky-500 min-h-[120px]">
              <div className="text-[10px] text-sky-500 uppercase font-bold mb-2 tracking-wider flex justify-between">
                <span>Diário do Comandante</span>
                {report?.rank && <span className="text-white">{report.rank}</span>}
              </div>
              {loadingReport ? (
                <div className="flex items-center justify-center h-16 text-slate-500 gap-2"><Loader2 className="animate-spin w-4 h-4" /> A desencriptar transmissão...</div>
              ) : (
                <p className="text-sm text-slate-300 italic leading-relaxed">"{report?.message || "Sinal perdido..."}"</p>
              )}
            </div>
            {/* Game History / Leaderboard */}
            {gameHistory.length > 1 && (
              <div className="bg-black/40 rounded-lg p-3 mb-4 text-left border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-2 tracking-wider flex items-center gap-1.5">
                  <History size={12} />
                  <span>Últimas Partidas</span>
                </div>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {gameHistory.slice(0, 5).map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-800/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono w-4">{idx + 1}.</span>
                        <span className="text-white font-bold">{entry.score.toLocaleString()}</span>
                        <span className="text-slate-500">Nv{entry.level}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-yellow-400 font-mono">+{entry.credits}</span>
                        <span className="text-slate-600 text-[9px]">{new Date(entry.date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => { setWheelResult('NONE'); onStart(); }} className="w-full flex items-center justify-center px-8 py-4 font-bold text-slate-900 transition-all duration-200 bg-white rounded-xl hover:bg-slate-200 hover:scale-[1.02]"><RotateCcw className="w-5 h-5 mr-2" />REINICIAR JOGO</button>
          </div>
        </div>
      )}
        
      {/* Modals: Missions, Settings, Shop */}
      {gameState === GameState.MENU && (isSettingsOpen || isShopOpen || isMissionsOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-200">
          
          {/* Modal de Missões & Troféus */}
          {isMissionsOpen && (
            <div className="bg-[#020617] border-2 border-slate-600 p-0 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] max-w-lg w-full text-center border-b-4 border-b-emerald-500 animate-in zoom-in-95 duration-200 max-h-[88vh] overflow-hidden flex flex-col relative z-50">
               <div className="flex justify-between items-center p-3 sm:p-5 border-b border-slate-800 shrink-0 bg-[#020617] relative z-20">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30 shrink-0">
                      <Award size={16} className="text-emerald-400" />
                    </div>
                    <h2 className="text-sm sm:text-lg text-white font-black uppercase tracking-wider sm:tracking-widest truncate">MISSÕES & CONQUISTAS</h2>
                  </div>
                  <button onClick={() => setIsMissionsOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl hover:bg-slate-700 shrink-0 ml-2"><X size={18} /></button>
               </div>

               {/* Tabs */}
               <div className="flex border-b border-slate-800 bg-slate-950 p-1.5 gap-1.5">
                 <button
                   onClick={() => setMissionsTab('QUESTS')}
                   className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                     missionsTab === 'QUESTS' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900'
                   }`}
                 >
                   <Compass size={14} />
                   <span>Missões Diárias</span>
                   {claimableQuestsCount > 0 && (
                     <span className="bg-white text-emerald-700 text-[10px] font-black rounded-full px-1.5 py-0.2">
                       {claimableQuestsCount}
                     </span>
                   )}
                 </button>
                 <button
                   onClick={() => setMissionsTab('ACHIEVEMENTS')}
                   className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                     missionsTab === 'ACHIEVEMENTS' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900'
                   }`}
                 >
                   <Award size={14} />
                   <span>Troféus</span>
                 </button>
                 <button
                   onClick={() => setMissionsTab('RANKS')}
                   className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                     missionsTab === 'RANKS' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900'
                   }`}
                 >
                   <Star size={14} />
                   <span>Patentes</span>
                 </button>
               </div>

               <div className="p-5 overflow-y-auto custom-scrollbar relative z-10 bg-[#020617] space-y-4 text-left">
                  {/* Quests Tab */}
                  {missionsTab === 'QUESTS' && (
                    <div className="space-y-3">
                      {quests.map(q => {
                        const pct = Math.min(100, Math.round((q.current / q.target) * 100));
                        return (
                          <div key={q.id} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-bold text-xs">{q.title}</span>
                                {q.completed && <CheckCircle2 size={13} className="text-emerald-400" />}
                              </div>
                              <p className="text-[11px] text-slate-400 mb-2">{q.description}</p>
                              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                                <span>{q.current} / {q.target}</span>
                                <span className="text-yellow-400">+{q.rewardCredits} CR {q.rewardSpins > 0 ? `+${q.rewardSpins} Giro` : ''}</span>
                              </div>
                            </div>
                            <div>
                              {q.claimed ? (
                                <span className="text-[11px] text-slate-500 font-bold bg-slate-800 px-3 py-1.5 rounded-lg">Resgatado</span>
                              ) : q.completed ? (
                                <button
                                  onClick={() => onClaimQuest(q.id)}
                                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 transition-all animate-bounce"
                                >
                                  Resgatar
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-500 font-mono bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
                                  {pct}%
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Achievements Tab */}
                  {missionsTab === 'ACHIEVEMENTS' && (
                    <div className="space-y-3">
                      {achievements.map(a => {
                        const pct = Math.min(100, Math.round((a.progress / a.target) * 100));
                        return (
                          <div key={a.id} className={`p-3 sm:p-4 rounded-xl border transition-all ${a.unlocked ? 'bg-purple-950/20 border-purple-500/40' : 'bg-slate-900/60 border-slate-800'}`}>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="min-w-0">
                                <span className={`font-bold text-xs ${a.unlocked ? 'text-purple-300' : 'text-white'}`}>{a.title}</span>
                                <p className="text-[11px] text-slate-400 mt-0.5">{a.description}</p>
                              </div>
                              {a.unlocked ? (
                                <button
                                  onClick={() => onClaimAchievement(a.id)}
                                  className="px-2.5 py-1.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-[10px] rounded-lg shadow-lg shadow-purple-500/30 transition-all shrink-0"
                                >
                                  +{a.rewardCredits} CR
                                </button>
                              ) : (
                                <span className="text-[11px] text-yellow-400 font-mono font-bold shrink-0">+{a.rewardCredits} CR</span>
                              )}
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                              <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                              <span>{a.progress} / {a.target}</span>
                              <span>{a.unlocked ? 'Concluído ✓' : `${pct}%`}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Ranks Tab */}
                  {missionsTab === 'RANKS' && (
                    <div className="space-y-2.5">
                      <p className="text-xs text-slate-400 mb-3">As patentes galácticas são atribuídas com base na tua maior pontuação de sempre.</p>
                      {PILOT_RANKS.map(r => {
                        const isUnlocked = highScore >= r.minScore;
                        const isCurrent = currentRank.level === r.level;
                        return (
                          <div key={r.level} className={`p-3.5 rounded-xl border flex items-center justify-between ${isCurrent ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-950' : isUnlocked ? 'bg-slate-900 border-slate-700' : 'bg-slate-950/40 border-slate-800 opacity-60'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border ${isCurrent ? 'bg-cyan-500 text-slate-950 border-cyan-300' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                {r.level}
                              </div>
                              <div>
                                <span className={`font-bold text-xs block ${r.color}`}>{r.title}</span>
                                <span className="text-[10px] text-slate-500 font-mono">Recorde mín: {r.minScore.toLocaleString()} pts</span>
                              </div>
                            </div>
                            {isCurrent && (
                              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded text-[10px] font-bold">
                                Patente Atual
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* Modal de Definições */}
          {isSettingsOpen && (
            <div className="bg-[#020617] border-2 border-slate-600 p-0 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] max-w-md w-full text-center border-b-4 border-b-sky-500 animate-in zoom-in-95 duration-200 max-h-[88vh] overflow-hidden flex flex-col relative z-50">
               <div className="flex justify-between items-center p-3 sm:p-5 border-b border-slate-800 shrink-0 bg-[#020617] relative z-20">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-500/20 flex items-center justify-center border border-sky-400/30 shrink-0">
                      <Settings size={16} className="text-sky-400 animate-[spin_10s_linear_infinite]"/>
                    </div>
                    <h2 className="text-sm sm:text-lg text-white font-black uppercase tracking-wider sm:tracking-widest truncate">DEFINIÇÕES</h2>
                  </div>
                  <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl hover:bg-slate-700 shrink-0 ml-2"><X size={18} /></button>
               </div>

               <div className="p-6 overflow-y-auto custom-scrollbar relative z-10 bg-[#020617] space-y-5 text-left">
                  {/* Seção Áudio */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 size={15} className="text-sky-400" />
                      <h3 className="text-xs text-slate-300 uppercase tracking-widest font-bold">Áudio e Efeitos</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={onToggleSfx}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${!sfxMuted ? 'bg-sky-500/20 border-sky-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                      >
                        <span className="flex items-center gap-1.5"><Volume2 size={14}/> Efeitos Sonoros</span>
                        <span>{!sfxMuted ? 'Ligado' : 'Mudo'}</span>
                      </button>
                      <button
                        onClick={onToggleMusic}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${!musicMuted ? 'bg-purple-500/20 border-purple-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                      >
                        <span className="flex items-center gap-1.5"><Music size={14}/> Música Synth</span>
                        <span>{!musicMuted ? 'Ligado' : 'Mudo'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Seção Dificuldade */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge size={15} className="text-sky-400" />
                      <h3 className="text-xs text-slate-300 uppercase tracking-widest font-bold">Nível de Dificuldade</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['EASY', 'MEDIUM', 'HARD'] as DifficultyType[]).map((dKey) => {
                        const d = DIFFICULTIES[dKey];
                        const isSelected = difficulty === dKey;
                        return (
                          <button
                            key={dKey}
                            onClick={() => onDifficultyChange(dKey)}
                            className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center ${
                              isSelected ? `${d.badgeBg} ring-1 ring-white/20 shadow-md` : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <span>{d.label}</span>
                            <span className="text-[9px] font-mono opacity-80 mt-0.5">
                              {dKey === 'EASY' ? '0.8x CR' : dKey === 'MEDIUM' ? '1.0x CR' : '+50% CR'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Desempenho e Acessibilidade */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => onPerformanceChange(!highPerformance)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-xs text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Cpu size={16} className="text-amber-400" />
                        <div>
                          <span className="font-bold text-white block">Modo Alto Desempenho</span>
                          <span className="text-[10px] text-slate-400">Reduz partículas para dispositivos lentos</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${highPerformance ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                        {highPerformance ? 'ATIVADO' : 'DESATIVADO'}
                      </span>
                    </button>

                    <button
                      onClick={() => onColorBlindChange(!colorBlindMode)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-xs text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Eye size={16} className="text-blue-400" />
                        <div>
                          <span className="font-bold text-white block">Modo Daltonismo</span>
                          <span className="text-[10px] text-slate-400">Ajusta cores do núcleo e alertas visuais</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${colorBlindMode ? 'bg-blue-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                        {colorBlindMode ? 'ATIVADO' : 'DESATIVADO'}
                      </span>
                    </button>
                  </div>

                  {/* Zona de Perigo - Reset da Conta */}
                  <div className="pt-3 border-t border-red-950/60">
                    <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={15} className="text-red-400" />
                        <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Zona Crítica: Reiniciar Conta</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Apaga o teu recorde, créditos, melhorias e reinicia a tua conta para o estado original inicial.
                      </p>

                      {!showResetConfirm ? (
                        <button
                          onClick={() => setShowResetConfirm(true)}
                          className="w-full py-2 bg-red-950/60 hover:bg-red-900/60 text-red-300 hover:text-red-200 border border-red-700/50 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw size={13} />
                          <span>Fazer Reset à Conta</span>
                        </button>
                      ) : (
                        <div className="bg-red-950/90 border border-red-500 p-2.5 rounded-lg space-y-2">
                          <p className="text-[11px] font-bold text-white text-center">Tens a certeza? Todo o progresso será apagado!</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                onResetAccount?.();
                                setShowResetConfirm(false);
                                setIsSettingsOpen(false);
                              }}
                              className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-xs transition-colors shadow-md"
                            >
                              Sim, Fazer Reset
                            </button>
                            <button
                              onClick={() => setShowResetConfirm(false)}
                              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-xs transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
               </div>
            </div>
          )}

          {/* Modal da Loja */}
          {isShopOpen && (
            <div className="bg-[#020617] border-2 border-slate-600 p-0 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] max-w-lg w-full text-center border-b-4 border-b-amber-500 animate-in zoom-in-95 duration-200 max-h-[88vh] overflow-hidden flex flex-col relative z-50">
               <div className="flex justify-between items-center p-3 sm:p-5 border-b border-slate-800 shrink-0 bg-[#020617] relative z-20">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-400/30 shrink-0">
                      <ShoppingBag size={16} className="text-amber-400"/>
                    </div>
                    <h2 className="text-sm sm:text-lg text-white font-black uppercase tracking-wider sm:tracking-widest truncate">LOJA & HANGAR</h2>
                  </div>
                  <button onClick={() => { setIsShopOpen(false); setIsCustomizingSkin(false); }} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl hover:bg-slate-700 shrink-0 ml-2"><X size={18} /></button>
               </div>

               <div className="p-5 overflow-y-auto custom-scrollbar relative z-10 bg-[#020617] space-y-6 text-left">
                  {/* Multi-Bónus e Equipamento de Slots (5 e 8 Bónus) */}
                  <div className="bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 p-4 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Zap size={16} className="text-amber-400" />
                        <div>
                          <h3 className="text-xs text-white uppercase tracking-widest font-black flex items-center gap-1.5">
                            MULTI-BÓNUS SIMULTÂNEO & FERRAMENTAS
                            <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-black">8 SLOTS MÁX</span>
                          </h3>
                          <p className="text-[10px] text-slate-400">Ativa múltiplos bónus e super ferramentas ao mesmo tempo em combate</p>
                        </div>
                      </div>
                    </div>

                    {/* Unlock / Upgrade Slots Options */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {/* 5 Slots */}
                      <div className={`p-2.5 rounded-xl border transition-all ${multiBonusSlots >= 5 ? 'bg-indigo-950/40 border-indigo-400' : 'bg-slate-900 border-slate-800'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] font-black text-white">5 Bónus</span>
                          {multiBonusSlots >= 5 && <CheckCircle2 size={13} className="text-emerald-400" />}
                        </div>
                        <p className="text-[9px] text-slate-400 mb-2">30.000 CR</p>
                        {multiBonusSlots >= 5 ? (
                          <div className="bg-indigo-500/20 text-indigo-300 text-[9px] font-bold py-1 rounded text-center border border-indigo-500/40">
                            ATIVO (5)
                          </div>
                        ) : (
                          <button
                            onClick={() => onBuyMultiBonus?.(5, 30000)}
                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all"
                          >
                            Ativar (30k)
                          </button>
                        )}
                      </div>

                      {/* 8 Slots */}
                      <div className={`p-2.5 rounded-xl border transition-all ${multiBonusSlots >= 8 ? 'bg-amber-950/30 border-amber-400' : 'bg-slate-900 border-slate-800'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] font-black text-amber-300">8 Bónus</span>
                          {multiBonusSlots >= 8 && <CheckCircle2 size={13} className="text-amber-400" />}
                        </div>
                        <p className="text-[9px] text-slate-400 mb-2">60.000 CR</p>
                        {multiBonusSlots >= 8 ? (
                          <div className="bg-amber-500/20 text-amber-300 text-[9px] font-bold py-1 rounded text-center border border-amber-500/40">
                            ATIVO (8)
                          </div>
                        ) : (
                          <button
                            onClick={() => onBuyMultiBonus?.(8, 60000)}
                            className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold transition-all"
                          >
                            Ativar (60k)
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Seleção rápida dos bónus equipados */}
                    {hasMultiBonus && (
                      <div className="pt-3 border-t border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-300 uppercase">
                            Ferramentas & Bónus Ativos ({equippedPowerUps.length}/{multiBonusSlots}):
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => onEquipAllPowerUps?.(unlockedPowerUps.slice(0, multiBonusSlots))}
                              className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-lg text-[10px] shadow-sm"
                            >
                              ⚡ Equipar Todos
                            </button>
                            <button
                              onClick={() => onClearEquippedPowerUps?.()}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[10px]"
                            >
                              Limpar
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                          {unlockedPowerUps.length === 0 && (
                            <div className="col-span-2 text-center py-4 text-slate-500 text-xs">
                              Gira a roleta para desbloquear bónus!
                            </div>
                          )}
                          {WHEEL_SEGMENTS.filter(seg => unlockedPowerUps.includes(seg.type)).map((seg) => {
                            const isEquipped = equippedPowerUps.includes(seg.type);
                            const SegIcon = seg.Icon;
                            return (
                              <button
                                key={seg.type}
                                onClick={() => onToggleEquipPowerUp?.(seg.type)}
                                className={`flex items-center justify-between p-2 rounded-xl border text-left text-xs transition-all ${
                                  isEquipped
                                    ? 'bg-slate-900 border-white/60 shadow-md ring-1 ring-white/30'
                                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <PowerUpPreviewCanvas type={seg.type} color={seg.color} size={36} />
                                  <div className="overflow-hidden">
                                    <span className={`block font-bold text-[11px] truncate ${isEquipped ? 'text-white' : 'text-slate-300'}`}>{seg.label}</span>
                                    <span className="text-[9px] text-slate-500 truncate block">{seg.description}</span>
                                  </div>
                                </div>
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ml-1.5 ${isEquipped ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                                  {isEquipped ? 'ATIVO' : 'OFF'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Roleta de Bónus */}
                  <div className="bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 p-4 rounded-2xl text-center shadow-inner">
                     <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                           <Gift size={16} className="text-amber-400" />
                           <h3 className="text-xs text-slate-300 uppercase tracking-widest font-bold">Roleta Orbital de Bónus ({WHEEL_SEGMENTS.length} Prémios Cósmicos)</h3>
                        </div>
                        <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold">
                           <Sparkles size={11} className="text-amber-400" />
                           <span>Giros extras: {extraSpins}</span>
                        </div>
                     </div>

                     <Wheel onComplete={handleWheelComplete} spinning={isSpinning} lastResult={wheelResult} />

                     <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleSpinClick}
                          disabled={isSpinning || !hasAvailableSpins}
                          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            isSpinning || !hasAvailableSpins
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/30 active:scale-95'
                          }`}
                        >
                          <Play size={14} fill="currentColor" />
                          <span>
                            {isSpinning 
                              ? 'A girar roleta...' 
                              : hasSpun 
                              ? (extraSpins > 0 ? `Girar Novamente (${extraSpins} extra${extraSpins > 1 ? 's' : ''})` : 'Sem Giros Extras') 
                              : 'Girar Roleta Grátis'}
                          </span>
                        </button>

                        <button
                          onClick={() => onBuySpins(5, 15000)}
                          className="py-3 px-3.5 bg-slate-800 hover:bg-slate-700 text-yellow-400 rounded-xl font-bold text-xs border border-yellow-500/30 transition-colors flex items-center gap-1 shrink-0"
                          title="Comprar +5 Giros por 15.000 Créditos"
                        >
                          <RotateCcw size={13} />
                          <span>+5 Giros (15k)</span>
                        </button>
                     </div>
                  </div>

                  {/* Melhorias do Núcleo */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu size={16} className="text-sky-400" />
                      <h3 className="text-xs text-slate-300 uppercase tracking-widest font-bold">Melhorias do Núcleo</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {(Object.keys(UPGRADES) as (keyof UpgradesState)[]).map((uKey) => {
                        const u = UPGRADES[uKey.toUpperCase() as keyof typeof UPGRADES];
                        const currentLvl = upgrades[uKey] || 0;
                        const price = getUpgradePrice(u.basePrice, u.priceMultiplier, currentLvl);
                        const isMax = currentLvl >= u.maxLevel;

                        return (
                          <div key={uKey} className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-white text-xs leading-tight">{u.label}</span>
                                <span className="text-[10px] font-mono font-bold text-sky-400">Nv {currentLvl}/{u.maxLevel}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mb-3">{u.description}</p>
                            </div>
                            <button
                              disabled={isMax}
                              onClick={() => onBuyUpgrade(uKey, price)}
                              className={`w-full py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                isMax
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20 active:scale-95'
                              }`}
                            >
                              {isMax ? 'NÍVEL MÁXIMO' : <><Coins size={12} /> {price.toLocaleString()} CR</>}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Temas e Skins */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Palette size={16} className="text-purple-400" />
                        <h3 className="text-xs text-slate-300 uppercase tracking-widest font-bold">Temas e Cores do Núcleo</h3>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{unlockedThemes.length}/{Object.keys(THEMES).length} Desbloqueados</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(THEMES) as ThemeType[]).map((themeKey) => {
                        const isUnlocked = unlockedThemes.includes(themeKey);
                        const isSelected = currentTheme === themeKey;
                        const themeConfig = THEMES[themeKey];
                        const isCustom = themeKey === 'CUSTOM';
                        const bgCardColor = isCustom && isUnlocked ? customSkin.coreColor : themeConfig.CORE;
                        const bgShieldColor = isCustom && isUnlocked ? customSkin.shieldColor : themeConfig.SHIELD;

                        return (
                          <button
                            key={themeKey}
                            onClick={() => { 
                              if (isUnlocked) {
                                onThemeChange(themeKey);
                                if (isCustom) setIsCustomizingSkin(true);
                              } else {
                                onBuyTheme(themeKey, themeConfig.price); 
                              }
                            }}
                            className={`relative h-20 rounded-xl border-2 transition-all flex flex-col items-center justify-center overflow-hidden group ${
                              isSelected 
                                ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-[1.02] bg-[#020617]' 
                                : 'border-slate-800 hover:border-slate-600 bg-[#020617]'
                            }`}
                          >  
                              <div className="absolute inset-0 opacity-40" style={{ 
                                background: isCustom 
                                  ? `linear-gradient(135deg, ${bgCardColor} 0%, ${bgShieldColor} 100%)` 
                                  : bgCardColor 
                              }}></div>
                              <span className="relative z-10 text-[10px] font-black text-white uppercase drop-shadow-md flex items-center gap-1">
                                {isCustom && <Sparkles size={11} className="text-yellow-300" />}
                                {themeConfig.label}
                              </span>
                              {isCustom && isUnlocked && (
                                <span className="relative z-10 text-[9px] text-sky-300 font-mono mt-0.5">Personalizada</span>
                              )}
                              {!isUnlocked && (
                                <div className="relative z-10 flex flex-col items-center mt-1">
                                  <Lock size={12} className="text-slate-300 mb-1" />
                                  <div className="bg-black/70 px-2 py-0.5 rounded text-[10px] text-yellow-400 font-mono font-bold flex items-center gap-1">
                                    <Coins size={8} /> {themeConfig.price.toLocaleString()}
                                  </div>
                                </div>
                              )}
                              {isSelected && <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-white rounded-full shadow-lg ring-2 ring-sky-400"></div>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Skin Customizer Panel with Preview */}
                    {isCustomizingSkin && currentTheme === 'CUSTOM' && (
                      <div className="mt-4 bg-slate-900/80 border border-purple-500/30 rounded-xl p-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-4">
                          <SkinPreviewCanvas
                            coreColor={customSkin.coreColor}
                            shieldColor={customSkin.shieldColor}
                            pattern={customSkin.pattern}
                          />
                          <div className="flex-1 space-y-3">
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Cor do Núcleo</label>
                              <input
                                type="color"
                                value={customSkin.coreColor}
                                onChange={e => onCustomSkinChange?.({ ...customSkin, coreColor: e.target.value })}
                                className="w-full h-8 rounded-lg cursor-pointer border border-slate-700 bg-transparent"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Cor do Escudo</label>
                              <input
                                type="color"
                                value={customSkin.shieldColor}
                                onChange={e => onCustomSkinChange?.({ ...customSkin, shieldColor: e.target.value })}
                                className="w-full h-8 rounded-lg cursor-pointer border border-slate-700 bg-transparent"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Padrão</label>
                              <div className="grid grid-cols-2 gap-1.5">
                                {(['NONE', 'NEON_RINGS', 'ENERGY_MATRIX', 'GOLD_STARS'] as const).map(p => (
                                  <button
                                    key={p}
                                    onClick={() => onCustomSkinChange?.({ ...customSkin, pattern: p })}
                                    className={`py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                      customSkin.pattern === p
                                        ? 'bg-purple-500/20 border-purple-400 text-white'
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {p === 'NONE' ? 'Limpo' : p === 'NEON_RINGS' ? 'Neon' : p === 'ENERGY_MATRIX' ? 'Matriz' : 'Estrelas'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsCustomizingSkin(false)}
                          className="w-full mt-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Confirmar Skin
                        </button>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          )}
        </div>
      )}

      {/* Pause button in-game (top-left area, below health) */}
      {gameState === GameState.PLAYING && (
        <div className="fixed left-3 bottom-14 sm:left-auto sm:bottom-auto sm:top-4 sm:right-1/2 sm:translate-x-[220px] z-40 pointer-events-auto">
          <button
            onClick={onPause}
            className="bg-slate-900/80 backdrop-blur border border-slate-700 hover:border-sky-400 p-2 rounded-full shadow-lg shadow-black/50 transition-all active:scale-95"
            title="Pausar jogo (P)"
          >
            <Pause size={16} className="text-white" />
          </button>
        </div>
      )}

      {/* Pause Overlay with Game Summary */}
      {gameState === GameState.PAUSED && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
          <div className="text-center max-w-sm w-full mx-4">
            <div className="bg-slate-950/95 border-2 border-sky-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-sky-500/10">
              <Pause size={40} className="text-sky-400 mx-auto mb-3" />
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-widest mb-1">PAUSA</h2>
              <p className="text-xs text-slate-400 mb-4">O combate está em espera.</p>

              <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-800">
                  <div className="text-lg font-black text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{score.toLocaleString()}</div>
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Pontos</div>
                </div>
                <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-800">
                  <div className="text-lg font-black text-sky-400">Nv {level}</div>
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Nível</div>
                </div>
                <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-800">
                  <div className="text-lg font-black text-amber-400">x{bestCombo}</div>
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Melhor Combo</div>
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <div className="flex-1 bg-slate-900 rounded-lg p-2 border border-slate-800 flex items-center justify-center gap-1.5">
                  <Shield size={12} className="text-pink-400" />
                  <span className="text-xs text-slate-300 font-bold">{totalDeflects} defesas</span>
                </div>
                <div className="flex-1 bg-slate-900 rounded-lg p-2 border border-slate-800 flex items-center justify-center gap-1.5">
                  <HeartPulse size={12} className={health > 50 ? 'text-emerald-400' : 'text-red-400'} />
                  <span className="text-xs text-slate-300 font-bold">{Math.round(health)}% vida</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={onResume}
                  className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-black text-sm uppercase tracking-wider transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Play size={18} fill="currentColor" />
                  Continuar a Jogar
                </button>
                <button
                  onClick={() => { setShowExitConfirm(true); }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogOut size={14} />
                  Sair para o Menu
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-4">Prima P ou ESC para retomar</p>
            </div>
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {countdown !== null && countdown !== undefined && countdown > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 pointer-events-none">
          <div className="text-center">
            <div className="text-8xl sm:text-9xl font-black text-white drop-shadow-[0_0_40px_rgba(56,189,248,0.8)] animate-pulse" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {countdown}
            </div>
            <p className="text-sm text-sky-400 font-bold tracking-widest uppercase mt-4">Preparar Defesas</p>
          </div>
        </div>
      )}

      {/* Interactive Tutorial Overlay */}
      {showTutorial && gameState === GameState.MENU && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto p-4">
          <div className="bg-slate-950/95 border-2 border-sky-500/40 rounded-2xl p-5 sm:p-8 max-w-md w-full shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-wider">BEM-VINDO, PILOTO!</h2>
                <p className="text-[10px] text-sky-400 uppercase tracking-wider font-bold">Tutorial de Defesa do Núcleo</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              {/* Step 1 */}
              <div className="bg-slate-900 rounded-xl p-3.5 border border-pink-500/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-pink-500"></div>
                <div className="flex items-start gap-3 ml-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0 border border-pink-400/30">
                    <span className="text-pink-400 font-black text-sm">1</span>
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block mb-1">Protege o Núcleo</span>
                    <p>O núcleo está no centro do ecrã. Usa o <strong className="text-pink-300">escudo</strong> para bloquear os projéteis que voam em direção a ele.</p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-900 rounded-xl p-3.5 border border-sky-500/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-sky-500"></div>
                <div className="flex items-start gap-3 ml-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center shrink-0 border border-sky-400/30">
                    <span className="text-sky-400 font-black text-sm">2</span>
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block mb-1">Roda o Escudo</span>
                    <div className="space-y-1">
                      <p className="hidden sm:block"><strong className="text-sky-300">Rato:</strong> Move o cursor em volta do núcleo</p>
                      <p className="hidden sm:block"><strong className="text-sky-300">Teclado:</strong> Setas ←→ ou teclas A / D</p>
                      <p className="sm:hidden"><strong className="text-sky-300">Toque:</strong> Arrasta o dedo para rodar</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-900 rounded-xl p-3.5 border border-amber-500/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <div className="flex items-start gap-3 ml-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-400/30">
                    <span className="text-amber-400 font-black text-sm">3</span>
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block mb-1">Poder EMP</span>
                    <p>Cada deflexão carrega a <strong className="text-amber-300">energia EMP</strong>. A 100%, ativa com <span className="hidden sm:inline"><strong>Espaço</strong> ou <strong>Clique Direito</strong></span><span className="sm:hidden"><strong>2 dedos</strong></span> para destruir inimigos próximos!</p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-slate-900 rounded-xl p-3.5 border border-emerald-500/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="flex items-start gap-3 ml-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-400/30">
                    <span className="text-emerald-400 font-black text-sm">4</span>
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block mb-1">Evolui e Combate</span>
                    <p>Ganha <strong className="text-emerald-300">créditos</strong> para comprar melhorias na <strong>Loja</strong>. Gira a <strong>Roleta</strong> para bónus. A cada 5 níveis, enfrenta um <strong className="text-red-300">Chefe Cósmico</strong>!</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onDismissTutorial}
              className="w-full mt-5 py-3.5 bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
            >
              <Play size={16} fill="currentColor" />
              Entendido — Vamos Jogar!
            </button>
          </div>
        </div>
      )}

      {/* About / Creator Modal */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto p-4 animate-in fade-in duration-200">
          <div className="bg-[#020617] border-2 border-sky-500/40 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>

            <button onClick={() => setIsAboutOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl hover:bg-slate-700 z-10">
              <X size={16} />
            </button>

            <div className="relative z-10">
              <div className="flex flex-col items-center mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg shadow-sky-500/20">
                  <User size={32} className="text-white" />
                </div>
                <h2 className="text-xl font-black text-white tracking-wider">MIGUEL SOUSA</h2>
                <p className="text-sky-400 text-xs font-bold uppercase tracking-widest mt-1">Criador do Jogo · 9 Anos</p>
              </div>

              <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 mb-4">
                <p className="text-sm text-slate-300 leading-relaxed">
                  O Miguel tem apenas 9 anos, mas a sua curiosidade pelo mundo não conhece limites. É daqueles miúdos que fazem mil perguntas, que querem saber como tudo funciona, e que não têm medo de explorar coisas novas.
                </p>
                <p className="text-sm text-slate-300 leading-relaxed mt-3">
                  Quando não está a criar jogos no computador, o Miguel está no campo a jogar futsal com os amigos — com uma energia que nunca acaba. Na escola, é um verdadeiro estrela: gosta de aprender, de participar, e de descobrir algo novo todos os dias.
                </p>
                <p className="text-sm text-slate-300 leading-relaxed mt-3">
                  <span className="italic text-sky-300">O Núcleo do Espaço</span> nasceu dessa mesma curiosidade — a vontade de criar algo do zero e partilhá-lo com o mundo. Este jogo é a prova de que a idade é apenas um número quando tens imaginação e vontade de aprender.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-slate-500 text-[10px] uppercase tracking-wider">
                <Heart size={12} className="text-pink-400" />
                <span>Feito com amor e muita curiosidade</span>
                <Heart size={12} className="text-pink-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {isStatsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto p-4 animate-in fade-in duration-200">
          <div className="bg-[#020617] border-2 border-purple-500/40 rounded-2xl p-0 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[88vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-400/30">
                  <Trophy size={16} className="text-purple-400" />
                </div>
                <h2 className="text-lg text-white font-black uppercase tracking-widest">Estatísticas</h2>
              </div>
              <button onClick={() => setIsStatsOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-center">
                  <div className="text-2xl font-black text-amber-400" style={{ fontVariantNumeric: 'tabular-nums' }}>{highScore.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold mt-1">Recorde</div>
                </div>
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-center">
                  <div className="text-2xl font-black text-sky-400" style={{ fontVariantNumeric: 'tabular-nums' }}>{credits.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold mt-1">Créditos</div>
                </div>
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-center">
                  <div className="text-2xl font-black text-emerald-400">{gameHistory.length}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold mt-1">Partidas</div>
                </div>
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-center">
                  <div className="text-2xl font-black text-purple-400">{currentRank.title.split(' ').slice(-1)[0]}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold mt-1">Rank</div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                <h3 className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-3">Conquistas</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-amber-400" />
                    <div>
                      <div className="text-sm font-bold text-white">{achievements.filter(a => a.unlocked).length}/{achievements.length}</div>
                      <div className="text-[9px] text-slate-500">Desbloqueadas</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-sky-400" />
                    <div>
                      <div className="text-sm font-bold text-white">{Object.values(upgrades).reduce((a: number, b: number) => a + b, 0)}/{Object.keys(UPGRADES).length * 15}</div>
                      <div className="text-[9px] text-slate-500">Melhorias</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Palette size={14} className="text-pink-400" />
                    <div>
                      <div className="text-sm font-bold text-white">{unlockedThemes.length}/{Object.keys(THEMES).length}</div>
                      <div className="text-[9px] text-slate-500">Skins</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame size={14} className="text-red-400" />
                    <div>
                      <div className="text-sm font-bold text-white">x{bestCombo}</div>
                      <div className="text-[9px] text-slate-500">Melhor Combo</div>
                    </div>
                  </div>
                </div>
              </div>

              {gameHistory.length > 0 && (
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                  <h3 className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-3">Últimas Partidas</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {gameHistory.slice(0, 8).map((entry, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-slate-950 rounded-lg px-3 py-2 border border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono text-[10px] w-4">#{idx + 1}</span>
                          <span className="font-bold text-white">{entry.score.toLocaleString()}</span>
                          <span className="text-slate-500">Nv{entry.level}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 text-[10px]">+{entry.credits} CR</span>
                          <span className="text-slate-600 text-[9px]">{GAME_MODES[entry.mode]?.name || entry.mode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {gameHistory.length > 0 && (
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-center">
                  <div className="text-xs text-slate-400">
                    Pontuação média: <span className="text-white font-bold">{Math.round(gameHistory.reduce((a, e) => a + e.score, 0) / gameHistory.length).toLocaleString()}</span>
                    {' · '}
                    Nível médio: <span className="text-white font-bold">{Math.round(gameHistory.reduce((a, e) => a + e.level, 0) / gameHistory.length)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Guidance text at bottom */}
      <div className="w-full text-center pointer-events-none opacity-50 absolute bottom-14 sm:bottom-6 left-0 z-0">
        {gameState === GameState.PLAYING && <p className="text-[10px] sm:text-xs text-white tracking-widest uppercase animate-pulse"><span className="hidden sm:inline">Move o cursor para rodar o escudo · P para pausar</span><span className="sm:hidden">Toca e arrasta para rodar o escudo</span></p>}
      </div>

      {/* Modal de Confirmação para Sair do Jogo */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl shadow-rose-950/60 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
              <LogOut size={22} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Sair da Partida?</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Desejas abandonar o combate e voltar ao menu principal? Os créditos obtidos até agora serão guardados.
            </p>
            <div className="flex gap-3">
              <button
                id="cancel-exit-btn"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Continuar a Jogar
              </button>
              <button
                id="confirm-exit-btn"
                onClick={() => {
                  setShowExitConfirm(false);
                  onExitGame?.();
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-rose-900/50 flex items-center justify-center gap-1.5"
              >
                <LogOut size={14} />
                <span>Sim, Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameUI;
