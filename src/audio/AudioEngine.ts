import type { FilterType, SweepConfig } from '../types';

const FILTER_TYPE_MAP: Record<FilterType, BiquadFilterType> = {
  PK: 'peaking',
  LSC: 'lowshelf',
  HSC: 'highshelf',
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private oscGainNode: GainNode | null = null;
  private fileGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private filterNodes: BiquadFilterNode[] = [];
  private currentOscillator: OscillatorNode | null = null;
  private currentFileSource: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private fileEQEnabled = true;
  private sweepTimeoutId: ReturnType<typeof setTimeout> | null = null;

  init(): void {
    if (this.ctx) return;

    // AudioContext can be created on mount; it starts suspended but getFrequencyResponse
    // works regardless. We call resume() before actual audio playback.
    this.ctx = new AudioContext();

    this.oscGainNode = this.ctx.createGain();
    this.fileGainNode = this.ctx.createGain();
    this.masterGainNode = this.ctx.createGain();
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 2048;

    this.analyserNode.connect(this.masterGainNode);
    this.masterGainNode.connect(this.ctx.destination);

    for (let i = 0; i < 5; i++) {
      const node = this.ctx.createBiquadFilter();
      node.type = 'peaking';
      node.frequency.value = this.defaultFrequencyForBand(i);
      node.gain.value = 0;
      node.Q.value = 1.0;
      this.filterNodes.push(node);
    }

    this.rebuildChain();
  }

  async resumeContext(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  private defaultFrequencyForBand(index: number): number {
    const defaults = [100, 400, 1000, 4000, 12000];
    return defaults[index] ?? 1000;
  }

  private getChainEntry(): AudioNode | null {
    if (this.filterNodes.length > 0) return this.filterNodes[0];
    return this.analyserNode;
  }

  rebuildChain(): void {
    if (!this.ctx || !this.oscGainNode || !this.fileGainNode || !this.analyserNode) return;

    // Disconnect all chain nodes
    this.oscGainNode.disconnect();
    this.fileGainNode.disconnect();
    for (const node of this.filterNodes) {
      node.disconnect();
    }

    // Reconnect filter chain
    for (let i = 0; i < this.filterNodes.length - 1; i++) {
      this.filterNodes[i].connect(this.filterNodes[i + 1]);
    }
    if (this.filterNodes.length > 0) {
      this.filterNodes[this.filterNodes.length - 1].connect(this.analyserNode);
    }

    // Connect sources to chain entry
    const entry = this.getChainEntry()!;
    this.oscGainNode.connect(entry);

    if (this.fileEQEnabled) {
      this.fileGainNode.connect(entry);
    } else {
      this.fileGainNode.connect(this.analyserNode);
    }
  }

  // ── Oscillator ──────────────────────────────────────────────────────────────

  async startOscillator(freq: number): Promise<void> {
    if (!this.ctx || !this.oscGainNode) return;
    await this.resumeContext();
    this.stopOscillator();

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(this.oscGainNode);
    osc.start();
    this.currentOscillator = osc;
  }

  stopOscillator(): void {
    if (this.currentOscillator) {
      try { this.currentOscillator.stop(); } catch { /* already stopped */ }
      this.currentOscillator.disconnect();
      this.currentOscillator = null;
    }
  }

  setOscillatorFrequency(freq: number): void {
    if (!this.ctx || !this.currentOscillator) return;
    this.currentOscillator.frequency.setValueAtTime(freq, this.ctx.currentTime);
  }

  startSweep(config: SweepConfig): void {
    if (!this.ctx || !this.currentOscillator) return;
    const { startFreq, endFreq, duration } = config;
    const now = this.ctx.currentTime;
    this.currentOscillator.frequency.cancelScheduledValues(now);
    this.currentOscillator.frequency.setValueAtTime(startFreq, now);
    this.currentOscillator.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    if (this.sweepTimeoutId !== null) clearTimeout(this.sweepTimeoutId);
    this.sweepTimeoutId = setTimeout(() => {
      this.sweepTimeoutId = null;
    }, duration * 1000);
  }

  stopSweep(): void {
    if (!this.ctx || !this.currentOscillator) return;
    if (this.sweepTimeoutId !== null) {
      clearTimeout(this.sweepTimeoutId);
      this.sweepTimeoutId = null;
    }
    const now = this.ctx.currentTime;
    const currentFreq = this.currentOscillator.frequency.value;
    this.currentOscillator.frequency.cancelScheduledValues(now);
    this.currentOscillator.frequency.setValueAtTime(currentFreq, now);
  }

  getSweepProgress(startTime: number, duration: number): number {
    if (!this.ctx) return 0;
    return Math.min((this.ctx.currentTime - startTime) / duration, 1);
  }

  getCurrentTime(): number {
    return this.ctx?.currentTime ?? 0;
  }

  // ── File player ─────────────────────────────────────────────────────────────

  async loadFile(buffer: ArrayBuffer): Promise<void> {
    if (!this.ctx) return;
    this.audioBuffer = await this.ctx.decodeAudioData(buffer);
  }

  async startFile(): Promise<void> {
    if (!this.ctx || !this.fileGainNode || !this.audioBuffer) return;
    await this.resumeContext();
    this.stopFile();

    const source = this.ctx.createBufferSource();
    source.buffer = this.audioBuffer;
    source.connect(this.fileGainNode);
    source.start();
    source.onended = () => {
      if (this.currentFileSource === source) {
        this.currentFileSource = null;
      }
    };
    this.currentFileSource = source;
  }

  stopFile(): void {
    if (this.currentFileSource) {
      try { this.currentFileSource.stop(); } catch { /* already stopped */ }
      this.currentFileSource.disconnect();
      this.currentFileSource = null;
    }
  }

  setFileEQEnabled(enabled: boolean): void {
    this.fileEQEnabled = enabled;
    this.rebuildChain();
  }

  hasAudioFile(): boolean {
    return this.audioBuffer !== null;
  }

  // ── EQ bands ────────────────────────────────────────────────────────────────

  addBand(): void {
    if (!this.ctx) return;
    const node = this.ctx.createBiquadFilter();
    node.type = 'peaking';
    node.frequency.value = 1000;
    node.gain.value = 0;
    node.Q.value = 1.0;
    this.filterNodes.push(node);
    this.rebuildChain();
  }

  removeBand(index: number): void {
    if (index < 0 || index >= this.filterNodes.length) return;
    this.filterNodes[index].disconnect();
    this.filterNodes.splice(index, 1);
    this.rebuildChain();
  }

  setBandType(index: number, type: FilterType): void {
    const node = this.filterNodes[index];
    if (!node) return;
    node.type = FILTER_TYPE_MAP[type];
  }

  setBandFrequency(index: number, freq: number): void {
    const node = this.filterNodes[index];
    if (!this.ctx || !node) return;
    node.frequency.setValueAtTime(freq, this.ctx.currentTime);
  }

  setBandGain(index: number, gain: number): void {
    const node = this.filterNodes[index];
    if (!this.ctx || !node) return;
    node.gain.setValueAtTime(gain, this.ctx.currentTime);
  }

  setBandQ(index: number, q: number): void {
    const node = this.filterNodes[index];
    if (!this.ctx || !node) return;
    node.Q.setValueAtTime(q, this.ctx.currentTime);
  }

  setBandEnabled(index: number, enabled: boolean, restoreGain = 0): void {
    const node = this.filterNodes[index];
    if (!this.ctx || !node) return;
    // Bypass by zeroing gain; restore previous gain value when re-enabling
    node.gain.setValueAtTime(enabled ? restoreGain : 0, this.ctx.currentTime);
  }

  getFilterNodes(): BiquadFilterNode[] {
    return this.filterNodes;
  }

  // ── Master ───────────────────────────────────────────────────────────────────

  setMasterGain(gain: number): void {
    if (!this.ctx || !this.masterGainNode) return;
    this.masterGainNode.gain.setValueAtTime(gain, this.ctx.currentTime);
  }

  getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }

  get isInitialised(): boolean {
    return this.ctx !== null;
  }

  destroy(): void {
    this.stopOscillator();
    this.stopFile();
    this.ctx?.close();
    this.ctx = null;
    this.filterNodes = [];
    this.audioBuffer = null;
  }
}
