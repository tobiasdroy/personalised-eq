import type { EQBand, EQProfile, FilterType } from '../types';

const APO_TYPE: Record<FilterType, string> = { PK: 'PK', LSC: 'LSC', HSC: 'HSC' };
const FROM_APO_TYPE: Record<string, FilterType> = { PK: 'PK', LSC: 'LSC', HSC: 'HSC' };

export function exportToAPO(profile: EQProfile): string {
  const lines: string[] = [];
  if (profile.preampGain !== 0) {
    lines.push(`Preamp: ${profile.preampGain.toFixed(1)} dB`);
  }
  profile.bands.forEach((band, i) => {
    const on = band.enabled ? 'ON' : 'OFF';
    const type = APO_TYPE[band.type];
    const fc = Math.round(band.frequency);
    const gain = band.gain.toFixed(1);
    const q = band.q.toFixed(2);
    lines.push(`Filter ${i + 1}: ${on} ${type} Fc ${fc} Hz Gain ${gain} dB Q ${q}`);
  });
  return lines.join('\n') + '\n';
}

export function importFromAPO(text: string): EQProfile {
  const bands: EQBand[] = [];
  let preampGain = 0;

  const preampMatch = text.match(/Preamp:\s*([+-]?\d+(?:\.\d+)?)\s*dB/i);
  if (preampMatch) preampGain = parseFloat(preampMatch[1]);

  // Matches: Filter N: ON/OFF TYPE Fc FREQ Hz Gain GAIN dB Q QVAL
  const filterRe =
    /Filter\s+\d+:\s*(ON|OFF)\s+(PK|LSC|HSC)\s+Fc\s+([\d.]+)\s+Hz\s+Gain\s+([+-]?[\d.]+)\s+dB(?:\s+Q\s+([\d.]+))?/gi;

  let match: RegExpExecArray | null;
  while ((match = filterRe.exec(text)) !== null) {
    const [, onOff, typeStr, fcStr, gainStr, qStr] = match;
    const type = FROM_APO_TYPE[typeStr.toUpperCase()] ?? 'PK';
    const isShelf = type === 'LSC' || type === 'HSC';
    // Shelf filters default Q to 0.707 (S=1 Butterworth) when omitted
    const q = qStr ? parseFloat(qStr) : (isShelf ? 0.707 : 1.0);
    bands.push({
      id: crypto.randomUUID(),
      enabled: onOff.toUpperCase() === 'ON',
      type,
      frequency: parseFloat(fcStr),
      gain: parseFloat(gainStr),
      q,
    });
  }

  return { preampGain, bands };
}
