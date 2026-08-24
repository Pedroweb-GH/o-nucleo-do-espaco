import React, { useState, useCallback, useRef, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import { 
  GameState, GameReport, PowerUpType, ThemeType, UpgradesState, 
  DifficultyType, CustomSkinConfig, GameMode, BossState, Quest, Achievement 
} from './types';
import { generateBattleReport } from './services/geminiService';
import { 
  UPGRADES, DIFFICULTIES, DEFAULT_CUSTOM_SKIN, POWER_UP_DURATION_SECONDS, 
  INITIAL_QUESTS, INITIAL_ACHIEVEMENTS 
} from './constants';
import { soundEngine } from './soundEngine';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>('CLASSIC');
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [report, setReport] = useState<GameReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType>('NONE');
  const [selectedPowerUp, setSelectedPowerUp] = useState<PowerUpType>('NONE');
  const [hasMultiBonus, setHasMultiBonus] = useState(false);
  const [multiBonusSlots, setMultiBonusSlots] = useState<number>(0);
  const [equippedPowerUps, setEquippedPowerUps] = useState<PowerUpType[]>([]);
  const [activePowerUps, setActivePowerUps] = useState<PowerUpType[]>([]);
  const [powerUpTimers, setPowerUpTimers] = useState<Partial<Record<PowerUpType, number>>>({});
  
  // EMP Super Ability
  const [empEnergy, setEmpEnergy] = useState<number>(0);
  const triggerEmpFnRef = useRef<(() => void) | null>(null);
  
  // Boss State
  const [bossState, setBossState] = useState<BossState | null>(null);

  // Quests and Achievements
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  
  // Audio state
  const [sfxMuted, setSfxMuted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);

  const [credits, setCredits] = useState(0);
  const [difficulty, setDifficulty] = useState<DifficultyType>('MEDIUM');
  const [extraSpins, setExtraSpins] = useState(0);
  const [earnedCredits, setEarnedCredits] = useState(0);
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('DEFAULT');
  const [unlockedThemes, setUnlockedThemes] = useState<ThemeType[]>(['DEFAULT']);
  const [customSkin, setCustomSkin] = useState<CustomSkinConfig>(DEFAULT_CUSTOM_SKIN);
  const [upgrades, setUpgrades] = useState<UpgradesState>({ hull: 0, mining: 0, regen: 0, luck: 0 });
  const [highPerformance, setHighPerformance] = useState(false); 
  const [colorBlindMode, setColorBlindMode] = useState(false);
  
  const startTimeRef = useRef(0);
  const shieldAngleRef = useRef<React.MutableRefObject<number> | null>(null);
  const isGameOverInProgressRef = useRef(false);

  useEffect(() => {
    const savedCredits = localStorage.getItem('nucleoEspaco_credits');
    if (savedCredits) setCredits(parseInt(savedCredits, 10));

    const savedMode = localStorage.getItem('nucleoEspaco_gameMode');
    if (savedMode && (savedMode === 'CLASSIC' || savedMode === 'SURVIVAL' || savedMode === 'BOSS_RUSH')) {
      setGameMode(savedMode as GameMode);
    }

    const savedSlots = localStorage.getItem('nucleoEspaco_multiBonusSlots');
    const savedMulti = localStorage.getItem('nucleoEspaco_hasMultiBonus');
    if (savedSlots) {
      const parsedSlots = parseInt(savedSlots, 10);
      setMultiBonusSlots(parsedSlots);
      setHasMultiBonus(parsedSlots > 0);
    } else if (savedMulti === 'true') {
      setMultiBonusSlots(5);
      setHasMultiBonus(true);
    } else {
      setMultiBonusSlots(0);
      setHasMultiBonus(false);
    }

    const savedEquipped = localStorage.getItem('nucleoEspaco_equippedPowerUps');
    if (savedEquipped) {
      try {
        setEquippedPowerUps(JSON.parse(savedEquipped));
      } catch (e) {
        console.error('Error parsing equipped powerups', e);
      }
    } else {
      setEquippedPowerUps([]);
    }

    const savedDifficulty = localStorage.getItem('nucleoEspaco_difficulty');
    if (savedDifficulty && (savedDifficulty === 'EASY' || savedDifficulty === 'MEDIUM' || savedDifficulty === 'HARD')) {
      setDifficulty(savedDifficulty as DifficultyType);
    }

    const savedSpins = localStorage.getItem('nucleoEspaco_extraSpins');
    if (savedSpins) setExtraSpins(parseInt(savedSpins, 10));
    const savedThemes = localStorage.getItem('nucleoEspaco_themes');
    if (savedThemes) setUnlockedThemes(JSON.parse(savedThemes));
    const savedTheme = localStorage.getItem('nucleoEspaco_currentTheme');
    if (savedTheme) setCurrentTheme(savedTheme as ThemeType);
    const savedCustomSkin = localStorage.getItem('nucleoEspaco_customSkin');
    if (savedCustomSkin) {
      try {
        setCustomSkin(JSON.parse(savedCustomSkin));
      } catch (e) {
        console.error('Error parsing custom skin', e);
      }
    }
    const savedHigh = localStorage.getItem('nucleoEspaco_highscore');
    if (savedHigh) setHighScore(parseInt(savedHigh, 10));
    const savedUpgrades = localStorage.getItem('nucleoEspaco_upgrades');
    if (savedUpgrades) setUpgrades(JSON.parse(savedUpgrades));
    const savedCB = localStorage.getItem('nucleoEspaco_colorblind');
    if (savedCB) setColorBlindMode(savedCB === 'true');

    const savedQuests = localStorage.getItem('nucleoEspaco_quests');
    if (savedQuests) {
      try { setQuests(JSON.parse(savedQuests)); } catch (e) {}
    }
    const savedAchievements = localStorage.getItem('nucleoEspaco_achievements');
    if (savedAchievements) {
      try { setAchievements(JSON.parse(savedAchievements)); } catch (e) {}
    }
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
        setIsFullscreen(true);
      } else {
        document.exitFullscreen?.().catch(() => {});
        setIsFullscreen(false);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (gameState !== GameState.PLAYING || !shieldAngleRef.current) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    shieldAngleRef.current.current = Math.atan2(e.clientY - cy, e.clientX - cx);
  }, [gameState]);

  const handleTouchStart = useCallback((e: TouchEvent | React.TouchEvent) => {
    if (gameState !== GameState.PLAYING || !shieldAngleRef.current) return;
    
    // Check multi-touch for EMP shockwave (2 or more fingers)
    if (e.touches.length >= 2) {
      if (triggerEmpFnRef.current) {
        triggerEmpFnRef.current();
      }
      return;
    }

    const touch = e.touches[0];
    if (touch) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      shieldAngleRef.current.current = Math.atan2(touch.clientY - cy, touch.clientX - cx);
    }
  }, [gameState]);

  const handleTouchMove = useCallback((e: TouchEvent | React.TouchEvent) => {
    if (gameState !== GameState.PLAYING || !shieldAngleRef.current) return;
    const touch = e.touches[0];
    if (touch) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      shieldAngleRef.current.current = Math.atan2(touch.clientY - cy, touch.clientX - cx);
    }
  }, [gameState]);

  const handleToggleSfx = useCallback(() => {
    const next = !sfxMuted;
    setSfxMuted(next);
    soundEngine.setMuted(next);
  }, [sfxMuted]);

  const handleToggleMusic = useCallback(() => {
    const next = !musicMuted;
    setMusicMuted(next);
    soundEngine.setMusicMuted(next);
  }, [musicMuted]);

  // Desktop Keyboard Shortcuts (Space for EMP, F for Fullscreen, M for Mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameState === GameState.PLAYING) {
        e.preventDefault();
        if (triggerEmpFnRef.current) {
          triggerEmpFnRef.current();
        }
      } else if (e.code === 'KeyF') {
        toggleFullscreen();
      } else if (e.code === 'KeyM') {
        handleToggleSfx();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (gameState === GameState.PLAYING) {
        e.preventDefault();
        if (triggerEmpFnRef.current) {
          triggerEmpFnRef.current();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gameState, toggleFullscreen, handleToggleSfx]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleMouseMove, handleTouchStart, handleTouchMove]);

  const maxHealth = 100 + (upgrades.hull * UPGRADES.HULL.bonusPerLevel);

  // 5-minute (300s) countdown timer per active bonus during combat
  useEffect(() => {
    if (gameState !== GameState.PLAYING || activePowerUps.length === 0) return;

    const timerInterval = setInterval(() => {
      setPowerUpTimers(prev => {
        const next: Partial<Record<PowerUpType, number>> = {};
        const expiredTypes: PowerUpType[] = [];

        for (const pType of activePowerUps) {
          const currentRemaining = prev[pType] !== undefined ? prev[pType]! : POWER_UP_DURATION_SECONDS;
          const updated = currentRemaining - 1;
          if (updated <= 0) {
            expiredTypes.push(pType);
          } else {
            next[pType] = updated;
          }
        }

        if (expiredTypes.length > 0) {
          setActivePowerUps(currentList => {
            const remainingList = currentList.filter(p => !expiredTypes.includes(p));
            setActivePowerUp(remainingList[0] || 'NONE');
            return remainingList;
          });
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [gameState, activePowerUps]);

  const handleStartGame = useCallback(() => {
    soundEngine.initAudio();
    soundEngine.playGameMusic();

    isGameOverInProgressRef.current = false;
    let powerUpsToActivate: PowerUpType[] = [];
    if (hasMultiBonus && equippedPowerUps.length > 0) {
      powerUpsToActivate = [...equippedPowerUps];
    } else if (selectedPowerUp !== 'NONE') {
      powerUpsToActivate = [selectedPowerUp];
    }
    setActivePowerUps(powerUpsToActivate);
    setActivePowerUp(powerUpsToActivate[0] || 'NONE');
    
    const initialTimers: Partial<Record<PowerUpType, number>> = {};
    powerUpsToActivate.forEach(p => {
      initialTimers[p] = POWER_UP_DURATION_SECONDS;
    });
    setPowerUpTimers(initialTimers);

    setGameState(GameState.PLAYING);
    setScore(0);
    setHealth(maxHealth);
    setLevel(1);
    setReport(null);
    setEarnedCredits(0);
    setEmpEnergy(0);
    setBossState(null);
    startTimeRef.current = performance.now();
  }, [hasMultiBonus, equippedPowerUps, selectedPowerUp, maxHealth]);

  const handleGameOver = useCallback(async (finalScore?: number) => {
    if (isGameOverInProgressRef.current) return;
    isGameOverInProgressRef.current = true;
    
    soundEngine.stopGameMusic();
    setGameState(GameState.GAME_OVER);
    const timeAlive = Math.max(0.1, (performance.now() - startTimeRef.current) / 1000);
    const actualScore = typeof finalScore === 'number' ? finalScore : score;
    const diffMultiplier = DIFFICULTIES[difficulty]?.creditsMultiplier || 1.0;
    const miningMultiplier = 1 + (upgrades.mining * UPGRADES.MINING.bonusPerLevel);
    const hasInstantCredits = activePowerUps.includes('INSTANT_CREDITS') || activePowerUp === 'INSTANT_CREDITS';
    const powerUpBonusMult = hasInstantCredits ? 1.5 : 1.0;
    const earnedFromScore = Math.max(0, Math.floor((actualScore / 10) * miningMultiplier * diffMultiplier * powerUpBonusMult));
    
    setEarnedCredits(earnedFromScore);
    setCredits(prev => {
      const newVal = prev + earnedFromScore;
      localStorage.setItem('nucleoEspaco_credits', newVal.toString());
      return newVal;
    });
    setSelectedPowerUp('NONE');
    setActivePowerUp('NONE');
    setActivePowerUps([]);
    setPowerUpTimers({});
    
    if (actualScore > highScore) { 
      setHighScore(actualScore); 
      localStorage.setItem('nucleoEspaco_highscore', actualScore.toString()); 
    }
    
    setLoadingReport(true);
    try {
      const generatedReport = await generateBattleReport(actualScore, timeAlive);
      setReport(generatedReport);
    } catch (e) {
      console.warn("Could not generate report:", e);
      setReport({
        rank: "Piloto Espacial",
        message: "Dados de combate arquivados nos registos da frota."
      });
    } finally {
      setLoadingReport(false);
    }
  }, [score, highScore, upgrades.mining, difficulty, activePowerUps, activePowerUp]);

  const handleExitGame = useCallback(() => {
    isGameOverInProgressRef.current = false;
    soundEngine.stopGameMusic();
    
    const actualScore = score;
    const diffMultiplier = DIFFICULTIES[difficulty]?.creditsMultiplier || 1.0;
    const miningMultiplier = 1 + (upgrades.mining * UPGRADES.MINING.bonusPerLevel);
    const hasInstantCredits = activePowerUps.includes('INSTANT_CREDITS') || activePowerUp === 'INSTANT_CREDITS';
    const powerUpBonusMult = hasInstantCredits ? 1.5 : 1.0;
    const earnedFromScore = Math.max(0, Math.floor((actualScore / 10) * miningMultiplier * diffMultiplier * powerUpBonusMult));
    
    if (earnedFromScore > 0) {
      setCredits(prev => {
        const newVal = prev + earnedFromScore;
        localStorage.setItem('nucleoEspaco_credits', newVal.toString());
        return newVal;
      });
    }

    if (actualScore > highScore) { 
      setHighScore(actualScore); 
      localStorage.setItem('nucleoEspaco_highscore', actualScore.toString()); 
    }

    setGameState(GameState.MENU);
    setSelectedPowerUp('NONE');
    setActivePowerUp('NONE');
    setActivePowerUps([]);
    setPowerUpTimers({});
    setBossState(null);
  }, [score, highScore, upgrades.mining, difficulty, activePowerUps, activePowerUp]);

  const handleBuyTheme = useCallback((theme: ThemeType, price: number) => {
    if (credits >= price && !unlockedThemes.includes(theme)) {
        const newCredits = credits - price;
        setCredits(newCredits);
        localStorage.setItem('nucleoEspaco_credits', newCredits.toString());
        const newThemes = [...unlockedThemes, theme];
        setUnlockedThemes(newThemes);
        localStorage.setItem('nucleoEspaco_themes', JSON.stringify(newThemes));
        setCurrentTheme(theme);
        localStorage.setItem('nucleoEspaco_currentTheme', theme);
    }
  }, [credits, unlockedThemes]);

  const handleBuyUpgrade = useCallback((type: keyof UpgradesState, price: number) => {
    if (credits >= price) {
        const newCredits = credits - price;
        setCredits(newCredits);
        localStorage.setItem('nucleoEspaco_credits', newCredits.toString());
        const newUpgrades = { ...upgrades };
        newUpgrades[type] = (newUpgrades[type] || 0) + 1;
        setUpgrades(newUpgrades);
        localStorage.setItem('nucleoEspaco_upgrades', JSON.stringify(newUpgrades));
    }
  }, [credits, upgrades]);

  const handleBuySpins = useCallback((spinsCount: number = 5, price: number = 15000) => {
    if (credits >= price) {
      const newCredits = credits - price;
      setCredits(newCredits);
      localStorage.setItem('nucleoEspaco_credits', newCredits.toString());
      setExtraSpins(prev => {
        const newVal = prev + spinsCount;
        localStorage.setItem('nucleoEspaco_extraSpins', newVal.toString());
        return newVal;
      });
    }
  }, [credits]);

  const handleBuyMultiBonus = useCallback((slots: 5 | 8 | 16 | 26 = 26, price: number = 30000) => {
    if (credits >= price) {
      const newCredits = credits - price;
      setCredits(newCredits);
      localStorage.setItem('nucleoEspaco_credits', newCredits.toString());
      setHasMultiBonus(true);
      setMultiBonusSlots(slots);
      localStorage.setItem('nucleoEspaco_hasMultiBonus', 'true');
      localStorage.setItem('nucleoEspaco_multiBonusSlots', slots.toString());
      if (selectedPowerUp !== 'NONE' && !equippedPowerUps.includes(selectedPowerUp)) {
        const initial = [selectedPowerUp];
        setEquippedPowerUps(initial);
        localStorage.setItem('nucleoEspaco_equippedPowerUps', JSON.stringify(initial));
      }
    }
  }, [credits, selectedPowerUp, equippedPowerUps]);

  const handleToggleEquipPowerUp = useCallback((type: PowerUpType) => {
    if (type === 'NONE') return;
    const maxCapacity = multiBonusSlots > 0 ? multiBonusSlots : 26;
    if (hasMultiBonus) {
      setEquippedPowerUps(prev => {
        let next: PowerUpType[];
        if (prev.includes(type)) {
          next = prev.filter(p => p !== type);
        } else {
          if (prev.length >= maxCapacity) {
            next = [...prev.slice(1), type];
          } else {
            next = [...prev, type];
          }
        }
        localStorage.setItem('nucleoEspaco_equippedPowerUps', JSON.stringify(next));
        return next;
      });
    } else {
      setSelectedPowerUp(prev => (prev === type ? 'NONE' : type));
    }
  }, [hasMultiBonus, multiBonusSlots]);

  const handleEquipAllPowerUps = useCallback((types: PowerUpType[]) => {
    setEquippedPowerUps(types);
    localStorage.setItem('nucleoEspaco_equippedPowerUps', JSON.stringify(types));
  }, []);

  const handleClearEquippedPowerUps = useCallback(() => {
    setEquippedPowerUps([]);
    localStorage.setItem('nucleoEspaco_equippedPowerUps', JSON.stringify([]));
  }, []);

  const handlePowerUpWon = useCallback((type: PowerUpType) => {
    setSelectedPowerUp(type);
    const maxCapacity = multiBonusSlots > 0 ? multiBonusSlots : 26;
    if (hasMultiBonus && type !== 'NONE') {
      setEquippedPowerUps(prev => {
        let next: PowerUpType[];
        if (prev.includes(type)) {
          next = prev;
        } else if (prev.length < maxCapacity) {
          next = [...prev, type];
        } else {
          next = [...prev.slice(1), type];
        }
        localStorage.setItem('nucleoEspaco_equippedPowerUps', JSON.stringify(next));
        return next;
      });
    }
  }, [hasMultiBonus, multiBonusSlots]);

  const handleUseExtraSpin = useCallback(() => {
    setExtraSpins(prev => {
      const newVal = Math.max(0, prev - 1);
      localStorage.setItem('nucleoEspaco_extraSpins', newVal.toString());
      return newVal;
    });
  }, []);

  const handleResetAccount = useCallback(() => {
    // Clear all storage
    const keys = [
      'nucleoEspaco_credits',
      'nucleoEspaco_extraSpins',
      'nucleoEspaco_highscore',
      'nucleoEspaco_upgrades',
      'nucleoEspaco_themes',
      'nucleoEspaco_currentTheme',
      'nucleoEspaco_customSkin',
      'nucleoEspaco_hasMultiBonus',
      'nucleoEspaco_multiBonusSlots',
      'nucleoEspaco_equippedPowerUps',
      'nucleoEspaco_quests',
      'nucleoEspaco_achievements',
      'nucleoEspaco_gameMode',
      'nucleoEspaco_difficulty',
      'nucleoEspaco_colorblind',
    ];
    keys.forEach(k => localStorage.removeItem(k));

    // Reset states to brand new starting values
    setCredits(0);
    setHighScore(0);
    setExtraSpins(0);
    setEarnedCredits(0);
    setHasMultiBonus(false);
    setMultiBonusSlots(0);
    setEquippedPowerUps([]);
    setActivePowerUps([]);
    setActivePowerUp('NONE');
    setSelectedPowerUp('NONE');
    setUpgrades({ hull: 0, mining: 0, regen: 0, luck: 0 });
    setUnlockedThemes(['DEFAULT']);
    setCurrentTheme('DEFAULT');
    setCustomSkin(DEFAULT_CUSTOM_SKIN);
    setDifficulty('MEDIUM');
    setGameMode('CLASSIC');
    setScore(0);
    setLevel(1);
    setHealth(100);
    setEmpEnergy(0);
    setBossState(null);
    setReport(null);
    setQuests(INITIAL_QUESTS.map(q => ({ ...q, progress: 0, completed: false, claimed: false })));
    setAchievements(INITIAL_ACHIEVEMENTS.map(a => ({ ...a, progress: 0, unlocked: false })));
    
    soundEngine.playLevelUp();
  }, []);

  const handleAwardCredits = useCallback((amount: number) => {
    setCredits(prev => {
      const newVal = prev + amount;
      localStorage.setItem('nucleoEspaco_credits', newVal.toString());
      return newVal;
    });
  }, []);

  const handleCustomSkinChange = useCallback((newSkin: CustomSkinConfig) => {
    setCustomSkin(newSkin);
    localStorage.setItem('nucleoEspaco_customSkin', JSON.stringify(newSkin));
  }, []);

  const handleClaimQuest = useCallback((questId: string) => {
    setQuests(prev => {
      const updated = prev.map(q => {
        if (q.id === questId && q.completed && !q.claimed) {
          if (q.rewardCredits > 0) {
            setCredits(c => {
              const nc = c + q.rewardCredits;
              localStorage.setItem('nucleoEspaco_credits', nc.toString());
              return nc;
            });
          }
          if (q.rewardSpins > 0) {
            setExtraSpins(s => {
              const ns = s + q.rewardSpins;
              localStorage.setItem('nucleoEspaco_extraSpins', ns.toString());
              return ns;
            });
          }
          return { ...q, claimed: true };
        }
        return q;
      });
      localStorage.setItem('nucleoEspaco_quests', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleClaimAchievement = useCallback((achId: string) => {
    setAchievements(prev => {
      const updated = prev.map(a => {
        if (a.id === achId && a.unlocked) {
          return a;
        }
        return a;
      });
      localStorage.setItem('nucleoEspaco_achievements', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black selection:bg-sky-500/30">
      <div className="absolute inset-0 bg-cover bg-center z-0 opacity-80" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?q=80&w=2672&auto=format&fit=crop")' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-indigo-950/30 to-slate-900/80 z-0 mix-blend-multiply pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] z-0 pointer-events-none"></div>
      
      <GameCanvas 
        gameState={gameState}
        gameMode={gameMode}
        activePowerUp={activePowerUp} 
        activePowerUps={activePowerUps} 
        powerUpTimers={powerUpTimers} 
        currentTheme={currentTheme}
        customSkin={customSkin}
        difficulty={difficulty}
        highPerformance={highPerformance} 
        maxHealth={maxHealth} 
        upgrades={upgrades}
        onScoreUpdate={setScore} 
        onHealthUpdate={setHealth} 
        onLevelUpdate={setLevel}
        onGameOver={handleGameOver} 
        setShieldAngleRef={(ref) => { shieldAngleRef.current = ref; }}
        colorBlindMode={colorBlindMode}
        onEmpEnergyUpdate={setEmpEnergy}
        registerEmpTrigger={(fn) => { triggerEmpFnRef.current = fn; }}
        onBossStateUpdate={setBossState}
      />

      <GameUI 
        gameState={gameState} 
        gameMode={gameMode}
        onGameModeChange={(m) => { setGameMode(m); localStorage.setItem('nucleoEspaco_gameMode', m); }}
        score={score} 
        health={health} 
        maxHealth={maxHealth} 
        level={level}
        highScore={highScore} 
        credits={credits} 
        upgrades={upgrades} 
        earnedCredits={earnedCredits}
        difficulty={difficulty}
        onDifficultyChange={(d) => { setDifficulty(d); localStorage.setItem('nucleoEspaco_difficulty', d); }}
        extraSpins={extraSpins} 
        onBuySpins={handleBuySpins} 
        onUseExtraSpin={handleUseExtraSpin}
        onAwardCredits={handleAwardCredits}
        hasMultiBonus={hasMultiBonus} 
        multiBonusSlots={multiBonusSlots} 
        equippedPowerUps={equippedPowerUps}
        onBuyMultiBonus={handleBuyMultiBonus} 
        onToggleEquipPowerUp={handleToggleEquipPowerUp}
        onEquipAllPowerUps={handleEquipAllPowerUps} 
        onClearEquippedPowerUps={handleClearEquippedPowerUps}
        report={report} 
        loadingReport={loadingReport} 
        activePowerUp={activePowerUp} 
        activePowerUps={activePowerUps}
        powerUpTimers={powerUpTimers}
        currentTheme={currentTheme} 
        unlockedThemes={unlockedThemes} 
        onBuyTheme={handleBuyTheme}
        customSkin={customSkin} 
        onCustomSkinChange={handleCustomSkinChange}
        onThemeChange={(t) => { setCurrentTheme(t); localStorage.setItem('nucleoEspaco_currentTheme', t); }}
        onBuyUpgrade={handleBuyUpgrade} 
        highPerformance={highPerformance} 
        onPerformanceChange={setHighPerformance}
        colorBlindMode={colorBlindMode} 
        onColorBlindChange={(active) => { setColorBlindMode(active); localStorage.setItem('nucleoEspaco_colorblind', active.toString()); }}
        onStart={() => {
          if (gameState === GameState.GAME_OVER) setGameState(GameState.MENU);
          else handleStartGame();
        }}
        onExitGame={handleExitGame}
        onPowerUpSelected={handlePowerUpWon}
        empEnergy={empEnergy}
        onTriggerEmp={() => {
          if (triggerEmpFnRef.current) triggerEmpFnRef.current();
        }}
        bossState={bossState}
        quests={quests}
        onClaimQuest={handleClaimQuest}
        achievements={achievements}
        onClaimAchievement={handleClaimAchievement}
        sfxMuted={sfxMuted}
        musicMuted={musicMuted}
        onToggleSfx={handleToggleSfx}
        onToggleMusic={handleToggleMusic}
        onResetAccount={handleResetAccount}
      />
    </div>
  );
};

export default App;
