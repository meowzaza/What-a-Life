import { useCallback, useEffect, useState } from 'react';
import { buildSavePayload, hydrateLoadedSaveSlot, saveToIndexedDB, type SaveSlotData } from './engine/save';
import { createInitialGameState } from './engine/state';
import type { ActionRecord, GameState, LifeGenRequest } from './engine/types';
import { FontSettingsModal } from './ui/components/FontSettingsModal';
import { SaveLoadModal } from './ui/components/SaveLoadModal';
import { applyFontPreset, type FontPresetId, loadSavedFontPreset } from './ui/fonts';
import { LifeGenScreen } from './ui/screens/LifeGenScreen';
import { MainGameScreen } from './ui/screens/MainGameScreen';
import { SceneDebugScreen } from './ui/screens/SceneDebugScreen';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [reduceFx, setReduceFx] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const [fontPreset, setFontPreset] = useState<FontPresetId>(() => loadSavedFontPreset());
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lifeGenRequest, setLifeGenRequest] = useState<LifeGenRequest | null>(null);
  const [actionLog, setActionLog] = useState<ActionRecord[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isDebugScenesOpen, setIsDebugScenesOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.location.search.includes('debug=scenes');
    }
    return false;
  });

  useEffect(() => {
    const handleUrlChange = () => {
      if (typeof window !== 'undefined' && window.location.search.includes('debug=scenes')) {
        setIsDebugScenesOpen(true);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    document.documentElement.setAttribute('data-reduce-fx', reduceFx ? 'true' : 'false');
  }, [reduceFx]);

  useEffect(() => {
    applyFontPreset(fontPreset);
  }, [fontPreset]);

  const handleStartLife = (request: LifeGenRequest) => {
    const initial = createInitialGameState(request);
    setLifeGenRequest(request);
    setActionLog([]);
    setGameState(initial);
  };

  const handleRecordAction = useCallback((record: ActionRecord) => {
    setActionLog((prev) => [...prev, record]);
  }, []);

  const handleSaveToSlot = async (slotId: string, label: string) => {
    if (!gameState || !lifeGenRequest) return;
    const payload = buildSavePayload(slotId, label, gameState, lifeGenRequest, actionLog);
    await saveToIndexedDB(payload);
  };

  const handleLoadFromSlot = (slot: SaveSlotData) => {
    const hydrated = hydrateLoadedSaveSlot(slot);
    setLifeGenRequest(hydrated.lifeGenRequest);
    setActionLog(hydrated.actionLog);
    setGameState(hydrated.snapshot);
  };

  return (
    <>
      {gameState && lifeGenRequest ? (
        <MainGameScreen
          state={gameState}
          lifeGenRequest={lifeGenRequest}
          actionLog={actionLog}
          onUpdateState={setGameState}
          onRecordAction={handleRecordAction}
          isDark={isDark}
          reduceFx={reduceFx}
          fontPreset={fontPreset}
          onToggleTheme={() => setIsDark((d) => !d)}
          onToggleReduceFx={() => setReduceFx((r) => !r)}
          onOpenFontSettings={() => setIsFontModalOpen(true)}
          onOpenSaveLoad={() => setIsSaveModalOpen(true)}
          onStartNewLife={() => setGameState(null)}
          onOpenSceneDebug={() => setIsDebugScenesOpen(true)}
        />
      ) : (
        <LifeGenScreen
          onStartLife={handleStartLife}
          onOpenLoadModal={() => setIsSaveModalOpen(true)}
          onOpenFontSettings={() => setIsFontModalOpen(true)}
          isDark={isDark}
          reduceFx={reduceFx}
          onToggleTheme={() => setIsDark((d) => !d)}
          onOpenSceneDebug={() => setIsDebugScenesOpen(true)}
        />
      )}

      <SaveLoadModal
        isOpen={isSaveModalOpen}
        canSave={Boolean(gameState)}
        onClose={() => setIsSaveModalOpen(false)}
        onSaveToSlot={handleSaveToSlot}
        onLoadFromSlot={handleLoadFromSlot}
      />

      <FontSettingsModal
        isOpen={isFontModalOpen}
        currentFont={fontPreset}
        reduceFx={reduceFx}
        onSelectFont={setFontPreset}
        onClose={() => setIsFontModalOpen(false)}
      />

      {isDebugScenesOpen && (
        <SceneDebugScreen
          state={gameState ?? undefined}
          onClose={() => {
            setIsDebugScenesOpen(false);
            if (typeof window !== 'undefined' && window.location.search.includes('debug=scenes')) {
              const url = new URL(window.location.href);
              url.searchParams.delete('debug');
              window.history.replaceState({}, '', url.toString());
            }
          }}
        />
      )}
    </>
  );
}
