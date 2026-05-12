// TODO: Displays run-level stats during combat (HP bar, floor, gold).
// Positioned top-right of screen. Pointer-events none — no interaction.
// Updates whenever RunState changes (driven by ProgressionSystem).

import React from 'react';
import { RunState } from '../types';

interface Props {
  run: RunState;
}

export function RunHUD({ run }: Props): React.ReactElement {
  return (
    <div style={{
      position: 'absolute',
      top: 8,
      right: 12,
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: 14,
      textAlign: 'right',
      pointerEvents: 'none',
      // TODO: replace inline styles with CSS module or Tailwind
    }}>
      <div>Floor {run.floor}</div>
      <div>HP: {run.playerHp}/{run.playerMaxHp}</div>
      <div>Gold: {run.gold}</div>
      {/* TODO: render relic icons */}
    </div>
  );
}
