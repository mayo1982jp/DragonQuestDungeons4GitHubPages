/**
 * Web Audio API based 8-bit / Chiptune Retro Sound Engine
 * Synthesizes authentic Dragon Quest style melodies and sound effects in real-time.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;
  private bgmVolume: number = 0.35;
  private sfxVolume: number = 0.5;
  private currentBgm: string | null = null;
  private bgmTimer: number | null = null;
  private isBgmPlaying: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx(): boolean {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
      
      this.bgmGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : this.bgmVolume, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : this.sfxVolume, this.ctx.currentTime);

      this.bgmGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    if (this.ctx && this.bgmGain && this.sfxGain) {
      this.bgmGain.gain.setValueAtTime(mute ? 0 : this.bgmVolume, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(mute ? 0 : this.sfxVolume, this.ctx.currentTime);
    }
  }

  public getMute(): boolean {
    return this.isMuted;
  }

  public setBgmVolume(volume: number) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.bgmGain && !this.isMuted) {
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
    }
  }

  public setSfxVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.sfxGain && !this.isMuted) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  // Helper note frequency
  private noteToFreq(note: string): number {
    const notes: Record<string, number> = {
      'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
      'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
      'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
      'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
      'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'G6': 1567.98,
    };
    return notes[note] || 440;
  }

  // --- Sound Effects ---

  public playStep() {
    if (!this.initCtx() || !this.ctx || !this.sfxGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.05);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  public playHit() {
    if (!this.initCtx() || !this.ctx || !this.sfxGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playCriticalHit() {
    // 会心の一撃！
    if (!this.initCtx() || !this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // White noise explosion / sharp pop
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.25);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.26);

    // Deep square punch
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(360, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.25);
    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.26);
  }

  public playMiss() {
    if (!this.initCtx() || !this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.1);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.11);
  }

  public playMagic() {
    // 呪文詠唱音 (DQ風)
    if (!this.initCtx() || !this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(880, t + 0.12);
    osc.frequency.linearRampToValueAtTime(440, t + 0.22);
    osc.frequency.linearRampToValueAtTime(1100, t + 0.35);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.36);
  }

  public playHeal() {
    // ホイミ回復音 (キラキラ音)
    if (!this.initCtx() || !this.ctx || !this.sfxGain || this.isMuted) return;
    const notes = ['E5', 'G5', 'B5', 'E6', 'G6'];
    notes.forEach((note, index) => {
      const t = this.ctx!.currentTime + index * 0.06;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(this.noteToFreq(note), t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  public playItemGet() {
    if (!this.initCtx() || !this.ctx || !this.sfxGain || this.isMuted) return;
    const notes = ['G4', 'C5', 'E5', 'G5'];
    notes.forEach((note, idx) => {
      const t = this.ctx!.currentTime + idx * 0.05;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(this.noteToFreq(note), t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.1);
    });
  }

  public playEquip() {
    if (!this.initCtx() || !this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.setValueAtTime(480, t + 0.06);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playStairs() {
    // 階段を下りる音
    if (!this.initCtx() || !this.ctx || !this.sfxGain || this.isMuted) return;
    const tones = [400, 320, 260, 200];
    tones.forEach((freq, idx) => {
      const t = this.ctx!.currentTime + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.11);
    });
  }

  public playTrap() {
    if (!this.initCtx() || !this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.2);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.23);
  }

  public playLevelUp() {
    // ドラクエ風レベルアップファンファーレ
    if (!this.initCtx() || !this.ctx || !this.sfxGain || this.isMuted) return;
    // タッカタッカ、タッタラー！
    const melody: [string, number, number][] = [
      ['C5', 0.00, 0.09],
      ['C5', 0.09, 0.09],
      ['C5', 0.18, 0.09],
      ['C5', 0.27, 0.18],
      ['D#5', 0.45, 0.18],
      ['F5', 0.63, 0.18],
      ['G5', 0.81, 0.45],
    ];

    melody.forEach(([note, start, dur]) => {
      const t = this.ctx!.currentTime + start;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(this.noteToFreq(note), t);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.setValueAtTime(0.35, t + dur - 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + dur + 0.01);
    });
  }

  public playMonsterHouseJingle() {
    // 緊迫アラート
    if (!this.initCtx() || !this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + i * 0.12;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(587.33, start); // D5
      osc.frequency.setValueAtTime(622.25, start + 0.06); // D#5

      gain.gain.setValueAtTime(0.35, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.11);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.12);
    }
  }

  // --- Background Music Sequences ---

  public stopBgm() {
    if (this.bgmTimer) {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.isBgmPlaying = false;
    this.currentBgm = null;
  }

  public playBgm(type: 'dungeon' | 'boss' | 'monster_house' | 'title' | 'gameover') {
    if (this.currentBgm === type && this.isBgmPlaying) return;
    this.stopBgm();
    if (!this.initCtx() || !this.ctx) return;

    this.currentBgm = type;
    this.isBgmPlaying = true;
    this.scheduleBgmLoop(type);
  }

  private scheduleBgmLoop(type: 'dungeon' | 'boss' | 'monster_house' | 'title' | 'gameover') {
    if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;

    let loopDuration = 8.0;

    if (type === 'dungeon') {
      loopDuration = this.playDungeonTheme();
    } else if (type === 'boss') {
      loopDuration = this.playBossTheme();
    } else if (type === 'monster_house') {
      loopDuration = this.playTensionTheme();
    } else if (type === 'title') {
      loopDuration = this.playTitleTheme();
    } else if (type === 'gameover') {
      loopDuration = this.playGameOverTheme();
      return; // Do not loop gameover
    }

    this.bgmTimer = window.setTimeout(() => {
      if (this.isBgmPlaying && this.currentBgm === type) {
        this.scheduleBgmLoop(type);
      }
    }, loopDuration * 1000 - 50);
  }

  private playTone(note: string, startOffset: number, duration: number, type: OscillatorType = 'square', vol: number = 0.2) {
    if (!this.ctx || !this.bgmGain) return;
    const t = this.ctx.currentTime + startOffset;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(this.noteToFreq(note), t);

    gain.gain.setValueAtTime(vol, t);
    gain.gain.setValueAtTime(vol * 0.9, t + duration * 0.85);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  private playDungeonTheme(): number {
    // Authentic minor key DQ mysterious dungeon pattern (8 bars, 120 bpm, ~8 seconds)
    const bpm = 120;
    const beat = 60 / bpm; // 0.5s

    // Bass line (triangle / pulse)
    const bassline: [string, number, number][] = [
      ['A2', 0 * beat, beat * 0.8], ['A2', 1 * beat, beat * 0.8],
      ['C3', 2 * beat, beat * 0.8], ['E3', 3 * beat, beat * 0.8],
      ['D3', 4 * beat, beat * 0.8], ['F3', 5 * beat, beat * 0.8],
      ['E3', 6 * beat, beat * 0.8], ['G3', 7 * beat, beat * 0.8],
      ['A2', 8 * beat, beat * 0.8], ['C3', 9 * beat, beat * 0.8],
      ['D3', 10 * beat, beat * 0.8], ['D#3', 11 * beat, beat * 0.8],
      ['E3', 12 * beat, beat * 0.8], ['D3', 13 * beat, beat * 0.8],
      ['C3', 14 * beat, beat * 0.8], ['B2', 15 * beat, beat * 0.8],
    ];

    bassline.forEach(([note, time, dur]) => {
      this.playTone(note, time, dur, 'triangle', 0.28);
    });

    // Melody lead (square)
    const melody: [string, number, number][] = [
      ['A3', 0 * beat, beat * 1.5],
      ['C4', 1.5 * beat, beat * 0.5],
      ['B3', 2 * beat, beat * 1],
      ['A3', 3 * beat, beat * 1],
      ['D4', 4 * beat, beat * 1.5],
      ['C4', 5.5 * beat, beat * 0.5],
      ['B3', 6 * beat, beat * 1.5],
      ['G3', 7.5 * beat, beat * 0.5],
      ['A3', 8 * beat, beat * 2],
      ['E4', 10 * beat, beat * 1.5],
      ['D#4', 11.5 * beat, beat * 0.5],
      ['D4', 12 * beat, beat * 1.5],
      ['C4', 13.5 * beat, beat * 0.5],
      ['B3', 14 * beat, beat * 1],
      ['G#3', 15 * beat, beat * 1],
    ];

    melody.forEach(([note, time, dur]) => {
      this.playTone(note, time, dur, 'square', 0.22);
    });

    return 16 * beat; // 8.0s
  }

  private playBossTheme(): number {
    // Fast, epic 140 bpm boss clash
    const bpm = 144;
    const beat = 60 / bpm; // ~0.416s

    // Aggressive pulsating bass
    for (let i = 0; i < 16; i++) {
      const note = i % 4 === 0 ? 'D2' : i % 2 === 0 ? 'D3' : 'A2';
      this.playTone(note, i * beat, beat * 0.7, 'sawtooth', 0.25);
    }

    // Heroic dramatic melody
    const melody: [string, number, number][] = [
      ['D4', 0 * beat, beat * 0.9],
      ['D4', 1 * beat, beat * 0.45],
      ['F4', 1.5 * beat, beat * 0.45],
      ['G4', 2 * beat, beat * 0.9],
      ['G#4', 3 * beat, beat * 0.9],
      ['A4', 4 * beat, beat * 1.8],
      ['A4', 6 * beat, beat * 0.9],
      ['G4', 7 * beat, beat * 0.9],
      ['F4', 8 * beat, beat * 0.9],
      ['D4', 9 * beat, beat * 0.9],
      ['F4', 10 * beat, beat * 0.9],
      ['G4', 11 * beat, beat * 0.9],
      ['C#4', 12 * beat, beat * 2.0],
      ['D4', 14 * beat, beat * 1.8],
    ];

    melody.forEach(([note, time, dur]) => {
      this.playTone(note, time, dur, 'square', 0.28);
    });

    return 16 * beat;
  }

  private playTensionTheme(): number {
    // Monster house / tension staccato
    const bpm = 150;
    const beat = 60 / bpm;

    for (let i = 0; i < 16; i++) {
      const note = i % 2 === 0 ? 'F#3' : 'G3';
      this.playTone(note, i * beat * 0.5, beat * 0.35, 'square', 0.22);
    }
    return 8 * beat;
  }

  private playTitleTheme(): number {
    // Classic majestic prologue fanfare
    const bpm = 110;
    const beat = 60 / bpm;

    const notes: [string, number, number][] = [
      ['G3', 0 * beat, beat * 0.9],
      ['C4', 1 * beat, beat * 1.8],
      ['D4', 3 * beat, beat * 0.9],
      ['E4', 4 * beat, beat * 1.8],
      ['D4', 6 * beat, beat * 0.9],
      ['C4', 7 * beat, beat * 0.9],
      ['D4', 8 * beat, beat * 2.8],
      ['G4', 11 * beat, beat * 0.9],
      ['E4', 12 * beat, beat * 1.8],
      ['D4', 14 * beat, beat * 0.9],
      ['C4', 15 * beat, beat * 2.8],
    ];

    notes.forEach(([note, time, dur]) => {
      this.playTone(note, time, dur, 'square', 0.25);
      this.playTone(note, time, dur, 'triangle', 0.2);
    });

    return 18 * beat;
  }

  private playGameOverTheme(): number {
    const notes: [string, number, number][] = [
      ['E4', 0.0, 0.4],
      ['D#4', 0.4, 0.4],
      ['D4', 0.8, 0.4],
      ['C#4', 1.2, 0.8],
      ['C4', 2.0, 1.2],
    ];

    notes.forEach(([note, time, dur]) => {
      this.playTone(note, time, dur, 'sawtooth', 0.25);
    });

    return 3.5;
  }
}

export const soundEngine = new SoundEngine();
