// TODO: Drives the meta-loop state machine.
// State machine: RunSelect → Combat → Draft → (Relic if milestone) → Combat → ... → Boss → Win/Lose
// Listens to 'combat:end' event → decides next screen → emits transition event to React App.
// ProgressionSystem is the bridge between Phaser (combat) and React (meta UI).

import { RunState } from '../types';

export type MetaScreen = 'run-select' | 'combat' | 'draft' | 'relic' | 'boss' | 'victory' | 'defeat';

export type TransitionListener = (screen: MetaScreen, run: RunState) => void;

const RELIC_MILESTONE_EVERY = 3; // offer relic every N floors
const BOSS_FLOOR = 10;           // TODO: make configurable per act

export class ProgressionSystem {
  private run: RunState | null = null;
  private listeners: TransitionListener[] = [];

  onTransition(fn: TransitionListener): void {
    this.listeners.push(fn);
  }

  startRun(run: RunState): void {
    this.run = run;
    this.emit('combat');
  }

  /** Call this when CombatScene emits 'combat:end' */
  onCombatEnd(playerWon: boolean, damageTaken: number, goldEarned: number): void {
    if (!this.run) return;

    if (!playerWon) {
      this.emit('defeat');
      return;
    }

    // TODO: import applyPostCombat from RunState
    this.run = {
      ...this.run,
      playerHp: Math.max(0, this.run.playerHp - damageTaken),
      gold: this.run.gold + goldEarned,
      floor: this.run.floor + 1,
    };

    if (this.run.floor > BOSS_FLOOR) {
      this.emit('victory');
      return;
    }

    // offer relic at milestones, otherwise go straight to draft
    const isRelicFloor = this.run.floor % RELIC_MILESTONE_EVERY === 0;
    this.emit(isRelicFloor ? 'relic' : 'draft');
  }

  /** Call after player finishes draft or relic pick */
  onRewardComplete(): void {
    if (!this.run) return;
    // check if we paused at relic before draft, otherwise straight to combat
    this.emit('combat');
  }

  private emit(screen: MetaScreen): void {
    this.listeners.forEach(fn => fn(screen, this.run!));
  }
}
