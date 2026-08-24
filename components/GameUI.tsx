import React, { useState, useEffect } from 'react';
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
  Radio, Orbit, Trophy
} from 'lucide-react';

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
  onBuyMultiBonus?: (slots: 5 | 8 | 16 | 26, price: number) => void;
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

const Wheel: React.FC<{ onComplete: (type: PowerUpType) => void, spinning: boolean }> = ({ onComplete, spinning }) => {
  const [rotation, setRotation] = useState(0);

  const segmentAngle = 360 / WHEEL_SEGMENTS.length;
  const conicGradient = WHEEL_SEGMENTS.map((seg, i) => {
    const start = i * segmentAngle;
    const end = (i + 1) * segmentAngle;
    return `${seg.color} ${start}deg ${end}deg`;
  }).join(', ');

  useEffect(() => {
    if (spinning) {
      const newRotation = rotation + 1440 + Math.random() * 360;
      setRotation(newRotation);
      
      const tickInterval = setInterval(() => {
        soundEngine.playRouletteTick();
      }, 140);

      setTimeout(() => {
        clearInterval(tickInterval);
        const normalizedDeg = (newRotation % 360 + 360) % 360;
        const index = Math.floor(normalizedDeg / segmentAngle) % WHEEL_SEGMENTS.length;
        const result = WHEEL_SEGMENTS[index]?.type || 'WIDE_SHIELD';
        onComplete(result);
      }, 3200);
    }
  }, [spinning]);

  return (
    <div className="relative w-64 h-64 mx-auto mb-4 select-none">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
        <div className="w-0 h-0 border-l-[11px] border-l-transparent border-t-[18px] border-t-amber-400 border-r-[11px] border-r-transparent filter drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]"></div>
      </div>

      <div 
        className="w-full h-full rounded-full border-4 border-slate-800 overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.8)] relative transition-transform duration-[3200ms] ease-[cubic-bezier(0.2,0.85,0.25,1)]"
        style={{ 
          transform: `rotate(-${rotation}deg)`,
          background: `conic-gradient(${conicGradient})`
        }}
      >
        {WHEEL_SEGMENTS.map((_, i) => (
          <div
            key={i}
            className="absolute top-0 left-1/2 w-0.5 h-1/2 origin-bottom bg-black/40"
            style={{ transform: `translateX(-50%) rotate(${i * segmentAngle}deg)` }}
          />
        ))}

        {WHEEL_SEGMENTS.map((seg, idx) => {
          const deg = idx * segmentAngle + (segmentAngle / 2);
          const SegIcon = seg.Icon;
          return (
            <div
              key={seg.type}
              className="absolute top-0 left-1/2 w-6 h-1/2 origin-bottom -translate-x-1/2 flex flex-col items-center pt-1.5 text-white pointer-events-none"
              style={{ transform: `translateX(-50%) rotate(${deg}deg)` }}
            >
              <div className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] flex flex-col items-center scale-75">
                <SegIcon size={12} />
                <span className="text-[6px] font-black tracking-tighter uppercase mt-0.5 whitespace-nowrap">{seg.shortLabel}</span>
              </div>
            </div>
          );
        })}

        <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-slate-900 border-2 border-slate-700 shadow-inner flex items-center justify-center z-20">
          <Zap size={16} className="text-yellow-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

const GameUI: React.FC<GameUIProps> = ({ 
  gameState, gameMode, onGameModeChange, score, health, maxHealth, level, highScore, credits, upgrades, difficulty, onDifficultyChange,
  report, loadingReport, earnedCredits, extraSpins, onBuySpins, onUseExtraSpin, onAwardCredits,
  hasMultiBonus, multiBonusSlots = 0, equippedPowerUps = [], onBuyMultiBonus, onToggleEquipPowerUp, onEquipAllPowerUps, onClearEquippedPowerUps,
  onStart, onExitGame, onPowerUpSelected, activePowerUp, activePowerUps = [], powerUpTimers = {},
  currentTheme, unlockedThemes, onBuyTheme, onThemeChange, customSkin = { coreColor: '#a855f7', shieldColor: '#06b6d4', pattern: 'ENERGY_MATRIX' }, onCustomSkinChange,
  onBuyUpgrade, highPerformance, onPerformanceChange, colorBlindMode, onColorBlindChange,
  empEnergy, onTriggerEmp, bossState, quests, onClaimQuest, achievements, onClaimAchievement,
  sfxMuted, musicMuted, onToggleSfx, onToggleMusic, onResetAccount
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);
  const [missionsTab, setMissionsTab] = useState<'QUESTS' | 'ACHIEVEMENTS' | 'RANKS'>('QUESTS');
  const [isCustomizingSkin, setIsCustomizingSkin] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Wheel state
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [wheelResult, setWheelResult] = useState<PowerUpType>('NONE');

  const hasAvailableSpins = !hasSpun || extraSpins > 0;

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

  const formatTimer = (seconds?: number) => {
    if (seconds === undefined) return '5:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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

  const displayPowerUp = gameState === GameState.PLAYING ? activePowerUp : wheelResult;
  const getUpgradePrice = (base: number, multiplier: number, l: number) => Math.floor(base * Math.pow(multiplier, l));

  return (
    <div className={`absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden bg-transparent z-50 ${colorBlindMode ? 'saturate-[1.2]' : ''}`}>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-screen bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40 mix-blend-multiply bg-[radial-gradient(circle,rgba(0,0,0,0)_60%,rgba(0,0,0,1)_100%)]"></div>

      {health < 35 && gameState === GameState.PLAYING && (
        <div className={`absolute inset-0 pointer-events-none z-0 border-[20px] ${colorBlindMode ? 'border-orange-500/20' : 'border-red-600/20'} animate-pulse mix-blend-overlay`}></div>
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
          {gameState !== GameState.MENU && (
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
          
          {/* Active Power-Ups Tray */}
          {gameState === GameState.PLAYING && activePowerUps && activePowerUps.length > 0 ? (
             <div className="flex flex-wrap gap-1.5 justify-end max-w-[480px] animate-in slide-in-from-right duration-500">
               {activePowerUps.map((pType) => {
                 const remainingSecs = powerUpTimers[pType];
                 const isLow = remainingSecs !== undefined && remainingSecs <= 30;
                 return (
                   <div
                     key={pType}
                     className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-950 shadow-md shadow-black/40 ring-1 ring-white/20 transition-all ${
                       isLow ? 'animate-pulse ring-2 ring-red-500' : ''
                     }`}
                     style={{ backgroundColor: POWERUPS[pType].color }}
                   >
                     <Zap size={11} fill="currentColor" className="shrink-0" />
                     <span className="truncate max-w-[90px]">{POWERUPS[pType].label}</span>
                     <div className="flex items-center gap-0.5 bg-black/35 px-1.5 py-0.5 rounded text-[10px] font-mono font-black text-white shrink-0 ml-0.5">
                       <Clock size={9} className="shrink-0 text-white/80" />
                       <span>{formatTimer(remainingSecs)}</span>
                     </div>
                   </div>
                 );
               })}
             </div>
          ) : hasMultiBonus && equippedPowerUps && equippedPowerUps.length > 0 ? (
             <div className="flex flex-wrap gap-1.5 justify-end max-w-[480px] animate-in slide-in-from-right duration-500">
               {equippedPowerUps.map((pType) => (
                 <div
                   key={pType}
                   className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-950 shadow-md shadow-black/40 ring-1 ring-white/20"
                   style={{ backgroundColor: POWERUPS[pType].color }}
                 >
                   <Zap size={11} fill="currentColor" className="shrink-0" />
                   <span className="truncate max-w-[90px]">{POWERUPS[pType].label}</span>
                   <div className="flex items-center gap-0.5 bg-black/35 px-1.5 py-0.5 rounded text-[10px] font-mono font-black text-white shrink-0 ml-0.5">
                     <Clock size={9} className="shrink-0 text-white/80" />
                     <span>5:00</span>
                   </div>
                 </div>
               ))}
             </div>
          ) : displayPowerUp !== 'NONE' ? (
             <div className="animate-in slide-in-from-right duration-500">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-slate-900 shadow-lg shadow-black/50" style={{ backgroundColor: POWERUPS[displayPowerUp].color }}>
                  <Zap size={13} fill="currentColor" />
                  <span>{POWERUPS[displayPowerUp].label}</span>
                  <div className="flex items-center gap-0.5 bg-black/35 px-1.5 py-0.5 rounded text-[10px] font-mono font-black text-white shrink-0">
                    <Clock size={9} className="shrink-0 text-white/80" />
                    <span>{formatTimer(powerUpTimers[displayPowerUp])}</span>
                  </div>
                </div>
             </div>
          ) : null}
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
             <div className="mb-4 bg-slate-950/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 shadow-2xl">
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2.5 flex items-center justify-between">
                 <div className="flex items-center gap-1.5">
                   <Target size={13} className="text-cyan-400" />
                   <span>Modo de Jogo</span>
                 </div>
                 <span className={`text-[10px] font-bold ${currentRank.color}`}>{currentRank.title}</span>
               </div>
               
               <div className="grid grid-cols-3 gap-2">
                 {(['CLASSIC', 'SURVIVAL', 'BOSS_RUSH'] as GameMode[]).map((mKey) => {
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
             <div className="mb-4 bg-slate-950/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 shadow-2xl">
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
               onClick={() => { enterFullscreen(); onStart(); }}
               className="w-full group relative px-12 py-4 bg-white hover:bg-sky-400 text-slate-900 hover:text-white transition-all duration-300 rounded-2xl font-black text-2xl tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(56,189,248,0.6)] hover:scale-105 flex items-center justify-center gap-3 overflow-hidden"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                <Play size={28} fill="currentColor" />
                INICIAR JOGO
             </button>

             {/* Secondary Menu Buttons: Missões & Troféus, Definições, Loja */}
             <div className="grid grid-cols-3 gap-2.5 mt-3.5">
               <button
                 id="menu-missions-btn"
                 onClick={() => { setIsMissionsOpen(true); setIsSettingsOpen(false); setIsShopOpen(false); }}
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
                 onClick={() => { setIsSettingsOpen(true); setIsShopOpen(false); setIsMissionsOpen(false); }}
                 className="py-3 px-2 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 hover:from-slate-850 hover:to-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-wider border-2 border-slate-700 hover:border-sky-400 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 hover:scale-[1.03] shadow-xl shadow-black/50 group"
               >
                 <div className="w-8 h-8 rounded-xl bg-sky-500/20 flex items-center justify-center border border-sky-400/30 group-hover:bg-sky-500/30 transition-colors">
                   <Settings size={18} className="text-sky-400 group-hover:rotate-90 transition-transform duration-500" />
                 </div>
                 <span className="block leading-none text-white text-xs font-bold">Opções</span>
               </button>

               <button
                 id="menu-shop-btn"
                 onClick={() => { setIsShopOpen(true); setIsSettingsOpen(false); setIsMissionsOpen(false); }}
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
             </div>

             <p className="mt-4 text-slate-500 text-xs uppercase tracking-[0.2em]">O NÚCLEO AGUARDA COMANDO</p>
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
               <div className="flex justify-between items-center p-5 border-b border-slate-800 shrink-0 bg-[#020617] relative z-20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
                      <Award size={18} className="text-emerald-400" /> 
                    </div>
                    <h2 className="text-lg text-white font-black uppercase tracking-widest">MISSÕES & CONQUISTAS</h2>
                  </div>
                  <button onClick={() => setIsMissionsOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl hover:bg-slate-700"><X size={18} /></button>
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
                          <div key={a.id} className={`p-4 rounded-xl border transition-all ${a.unlocked ? 'bg-purple-950/20 border-purple-500/40' : 'bg-slate-900/60 border-slate-800'}`}>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div>
                                <span className={`font-bold text-xs ${a.unlocked ? 'text-purple-300' : 'text-white'}`}>{a.title}</span>
                                <p className="text-[11px] text-slate-400 mt-0.5">{a.description}</p>
                              </div>
                              <span className="text-[11px] text-yellow-400 font-mono font-bold shrink-0">+{a.rewardCredits} CR</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                              <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                              <span>Progresso: {a.progress} / {a.target}</span>
                              <span>{a.unlocked ? 'Desbloqueado ✓' : `${pct}%`}</span>
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
               <div className="flex justify-between items-center p-5 border-b border-slate-800 shrink-0 bg-[#020617] relative z-20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center border border-sky-400/30">
                      <Settings size={18} className="text-sky-400 animate-[spin_10s_linear_infinite]"/> 
                    </div>
                    <h2 className="text-lg text-white font-black uppercase tracking-widest">DEFINIÇÕES DO JOGO</h2>
                  </div>
                  <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl hover:bg-slate-700"><X size={18} /></button>
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
               <div className="flex justify-between items-center p-5 border-b border-slate-800 shrink-0 bg-[#020617] relative z-20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-400/30">
                      <ShoppingBag size={18} className="text-amber-400"/> 
                    </div>
                    <h2 className="text-lg text-white font-black uppercase tracking-widest">LOJA & HANGAR</h2>
                  </div>
                  <button onClick={() => { setIsShopOpen(false); setIsCustomizingSkin(false); }} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl hover:bg-slate-700"><X size={18} /></button>
               </div>

               <div className="p-5 overflow-y-auto custom-scrollbar relative z-10 bg-[#020617] space-y-6 text-left">
                  {/* Multi-Bónus e Equipamento de Slots (5, 8, 16 e 26 Bónus) */}
                  <div className="bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 p-4 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Zap size={16} className="text-amber-400" />
                        <div>
                          <h3 className="text-xs text-white uppercase tracking-widest font-black flex items-center gap-1.5">
                            MULTI-BÓNUS SIMULTÂNEO & FERRAMENTAS
                            <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-black">26 SLOTS MÁX</span>
                          </h3>
                          <p className="text-[10px] text-slate-400">Ativa múltiplos bónus e super ferramentas ao mesmo tempo em combate</p>
                        </div>
                      </div>
                    </div>

                    {/* Unlock / Upgrade Slots Options */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
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

                      {/* 16 Slots */}
                      <div className={`p-2.5 rounded-xl border transition-all ${multiBonusSlots >= 16 ? 'bg-purple-950/40 border-purple-400' : 'bg-slate-900 border-slate-800'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] font-black text-purple-300">16 Bónus</span>
                          {multiBonusSlots >= 16 && <CheckCircle2 size={13} className="text-purple-400" />}
                        </div>
                        <p className="text-[9px] text-slate-400 mb-2">100.000 CR</p>
                        {multiBonusSlots >= 16 ? (
                          <div className="bg-purple-500/20 text-purple-300 text-[9px] font-bold py-1 rounded text-center border border-purple-500/40">
                            ATIVO (16)
                          </div>
                        ) : (
                          <button
                            onClick={() => onBuyMultiBonus?.(16, 100000)}
                            className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold transition-all"
                          >
                            Ativar (100k)
                          </button>
                        )}
                      </div>

                      {/* 26 Slots (TODOS OS 26 BÓNUS - MODO DEUS SUPREMO) */}
                      <div className={`p-2.5 rounded-xl border transition-all ${multiBonusSlots >= 26 ? 'bg-fuchsia-950/40 border-fuchsia-400 shadow-md shadow-fuchsia-500/20 ring-1 ring-fuchsia-400/50' : 'bg-slate-900 border-slate-800'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] font-black text-fuchsia-300">26 (TODOS)</span>
                          {multiBonusSlots >= 26 && <CheckCircle2 size={13} className="text-fuchsia-400" />}
                        </div>
                        <p className="text-[9px] text-slate-400 mb-2">150.000 CR</p>
                        {multiBonusSlots >= 26 ? (
                          <div className="bg-fuchsia-500/20 text-fuchsia-300 text-[9px] font-black py-1 rounded text-center border border-fuchsia-500/40">
                            MÁXIMO (26)
                          </div>
                        ) : (
                          <button
                            onClick={() => onBuyMultiBonus?.(26, 150000)}
                            className="w-full py-1.5 bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 text-white rounded-lg text-[10px] font-black transition-all"
                          >
                            Ativar (150k)
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Seleção rápida dos bónus equipados */}
                    {hasMultiBonus && (
                      <div className="pt-3 border-t border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-300 uppercase">
                            Ferramentas & Bónus Ativos ({equippedPowerUps.length}/{multiBonusSlots || 26}):
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => onEquipAllPowerUps?.(WHEEL_SEGMENTS.map(s => s.type))}
                              className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-lg text-[10px] shadow-sm"
                            >
                              ⚡ Equipar Todas as 26 Ferramentas
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
                          {WHEEL_SEGMENTS.map((seg) => {
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
                                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-950 font-bold shrink-0" style={{ backgroundColor: seg.color }}>
                                    <SegIcon size={13} />
                                  </div>
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
                           <h3 className="text-xs text-slate-300 uppercase tracking-widest font-bold">Roleta Orbital de Bónus (26 Prémios Cósmicos)</h3>
                        </div>
                        <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold">
                           <Sparkles size={11} className="text-amber-400" />
                           <span>Giros extras: {extraSpins}</span>
                        </div>
                     </div>

                     <Wheel onComplete={handleWheelComplete} spinning={isSpinning} />

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
                  </div>
               </div>
            </div>
          )}
        </div>
      )}

      {/* Guidance text at bottom */}
      <div className="w-full text-center pointer-events-none opacity-50 absolute bottom-14 sm:bottom-6 left-0 z-0">
        {gameState === GameState.PLAYING && <p className="text-[10px] sm:text-xs text-white tracking-widest uppercase animate-pulse"><span className="hidden sm:inline">Move o cursor para rodar o escudo</span><span className="sm:hidden">Toca e arrasta para rodar o escudo</span></p>}
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
