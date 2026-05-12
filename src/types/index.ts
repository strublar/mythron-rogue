// TODO: Source of truth for ALL shared types. Import from here everywhere.
// Add types as features are built. Never duplicate type definitions across modules.

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

/** Column 0-8, Row 0-4. Top-left = [0,0]. */
export type Position = { col: number; row: number };

export const BOARD_COLS = 9;
export const BOARD_ROWS = 5;

// ---------------------------------------------------------------------------
// Factions / Players
// ---------------------------------------------------------------------------

export type Faction = 'player' | 'enemy';

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

export interface UnitStats {
  maxHp: number;
  hp: number;
  attack: number;
  /** Movement range in tiles per turn */
  moveRange: number;
  /** Attack range in tiles (1 = melee) */
  attackRange: number;
}

export interface Unit {
  id: string;
  definitionId: string; // references UnitDefinition
  faction: Faction;
  position: Position;
  stats: UnitStats;
  /** Status effects applied this turn (stun, freeze, etc.) */
  statusEffects: StatusEffect[];
  /** Whether unit has moved this turn */
  hasMoved: boolean;
  /** Whether unit has attacked this turn */
  hasAttacked: boolean;
  /** True for general units — death ends the game */
  isGeneral?: boolean;
}

// ---------------------------------------------------------------------------
// Status Effects
// ---------------------------------------------------------------------------

export type StatusEffectType = 'stun' | 'freeze' | 'poison' | 'flying';

export interface StatusEffect {
  type: StatusEffectType;
  remainingTurns: number;
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

export type CardType = 'unit' | 'spell' | 'artifact';

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  manaCost: number;
  // TODO: add effect payload (e.g. { damage: number } | { summonUnitId: string })
}

export interface CardInstance {
  instanceId: string;
  definitionId: string;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type ActionType = 'move' | 'attack' | 'playCard' | 'endTurn';

export interface MoveAction {
  type: 'move';
  unitId: string;
  to: Position;
}

export interface AttackAction {
  type: 'attack';
  attackerId: string;
  targetId: string;
}

export interface PlayCardAction {
  type: 'playCard';
  cardInstanceId: string;
  /** Target position or unit for the card */
  target?: Position | string;
}

export interface EndTurnAction {
  type: 'endTurn';
}

export type GameAction = MoveAction | AttackAction | PlayCardAction | EndTurnAction;

// ---------------------------------------------------------------------------
// Game State
// ---------------------------------------------------------------------------

export interface PlayerState {
  faction: Faction;
  hand: CardInstance[];
  mana: number;
  maxMana: number;
  general: Unit; // hero unit — death = game over
}

export interface GameState {
  turn: number;
  activePlayer: Faction;
  player: PlayerState;
  enemy: PlayerState;
  units: Unit[]; // all units on board (including generals)
}

// ---------------------------------------------------------------------------
// Roguelike / Run
// ---------------------------------------------------------------------------

export interface RunState {
  floor: number;
  playerHp: number;
  playerMaxHp: number;
  gold: number;
  deck: CardDefinition[];
  relics: RelicDefinition[];
}

export interface RelicDefinition {
  id: string;
  name: string;
  description: string;
  // TODO: add passive effect hook signature
}

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

export interface ScoredAction {
  action: GameAction;
  score: number;
}

// ---------------------------------------------------------------------------
// Events (cross-system bus)
// ---------------------------------------------------------------------------

// TODO: define typed event map for Phaser EventEmitter or a simple mitt bus
export type GameEventType =
  | 'combat:start'
  | 'combat:end'
  | 'unit:death'
  | 'card:played'
  | 'turn:end'
  | 'run:draftReady'
  | 'run:relicReady'
  | 'run:bossDefeated';
