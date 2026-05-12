// TODO: Full-screen relic pick UI shown at milestone floors.
// Displays N relics (typically 2). Player taps one to add to run.
// RelicSystem.generateRelicOffer provides the offer; pickRelic updates RunState.

import React, { useMemo } from 'react';
import { RunState } from '../types';
import { generateRelicOffer, pickRelic } from '../roguelike/RelicSystem';

interface Props {
  run: RunState;
  onPick: (updatedRun: RunState) => void;
}

export function RelicScreen({ run, onPick }: Props): React.ReactElement {
  const offer = useMemo(() => generateRelicOffer(run), [run]);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)',
      color: '#fff',
      fontFamily: 'monospace',
      // TODO: replace with proper styled component
    }}>
      <h2>Choose a Relic</h2>
      <div style={{ display: 'flex', gap: 32, marginTop: 24 }}>
        {offer.relics.map((relic, i) => (
          <button
            key={relic.id}
            onClick={() => onPick(pickRelic(run, offer, i))}
            style={{ padding: '20px 32px', cursor: 'pointer', fontSize: 16, textAlign: 'center' }}
          >
            <div style={{ fontWeight: 'bold' }}>{relic.name}</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>{relic.description}</div>
            {/* TODO: show relic icon sprite */}
          </button>
        ))}
      </div>
    </div>
  );
}
