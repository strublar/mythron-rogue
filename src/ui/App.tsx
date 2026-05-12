// TODO: React root. Renders the correct meta-loop screen based on ProgressionSystem state.
// Sits above Phaser canvas (z-index via index.html CSS).
// pointer-events: none by default so clicks pass through to Phaser canvas during combat.
// Individual screen components re-enable pointer-events on their containers.

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RunHUD } from './RunHUD';
import { DraftScreen } from './DraftScreen';
import { RelicScreen } from './RelicScreen';
import { MetaScreen } from '../roguelike/ProgressionSystem';
import { RunState } from '../types';

// TODO: wire up to ProgressionSystem singleton — currently placeholder
const PLACEHOLDER_RUN: RunState = {
  floor: 1,
  playerHp: 25,
  playerMaxHp: 25,
  gold: 0,
  deck: [],
  relics: [],
};

export function App(): React.ReactElement {
  const [screen, setScreen] = useState<MetaScreen>('combat');
  const [run, setRun] = useState<RunState>(PLACEHOLDER_RUN);

  useEffect(() => {
    // TODO: subscribe to ProgressionSystem.onTransition here
    // progressionSystem.onTransition((nextScreen, nextRun) => {
    //   setScreen(nextScreen);
    //   setRun(nextRun);
    // });
    void setRun; void setScreen; // suppress unused warning until wired
  }, []);

  return (
    <>
      {/* HUD always visible during combat */}
      {screen === 'combat' && <RunHUD run={run} />}

      {/* Full-screen overlays for meta-loop screens */}
      {screen === 'draft' && <DraftScreen run={run} onPick={() => { /* TODO */ }} />}
      {screen === 'relic' && <RelicScreen run={run} onPick={() => { /* TODO */ }} />}

      {/* TODO: add RunSelectScreen, VictoryScreen, DefeatScreen */}
    </>
  );
}

/** Call from main.ts to mount React overlay */
export function mountReactApp(container: HTMLElement): void {
  createRoot(container).render(<App />);
}
