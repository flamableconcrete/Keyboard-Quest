export async function generateThemeMusic(seedStr: string): Promise<AudioBuffer> {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    const sampleRate = ctx.sampleRate;

    let s = 0;
    for (let i = 0; i < seedStr.length; i++) s = (s << 5) - s + seedStr.charCodeAt(i);
    const random = () => {
        s = Math.sin(s) * 10000;
        return s - Math.floor(s);
    };

    const bpm = 100 + random() * 40;
    const beatLength = 60 / bpm;
    const duration = 32 * beatLength; // 8 measures of 4/4

    const offlineCtx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);

    // Create scales (Pentatonic or Diatonic for chill, non-threatening vibes)
    const baseFreq = 220; // A3
    // Major pentatonic intervals: 0, 2, 4, 7, 9
    // Minor pentatonic: 0, 3, 5, 7, 10
    const isMinor = random() > 0.5;
    const scale = isMinor ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9];

    const getFreq = (octave: number, degree: number) => {
        const wrapDegree = degree % scale.length;
        const wrapOctave = octave + Math.floor(degree / scale.length);
        const semitones = scale[wrapDegree] + (wrapOctave - 3) * 12;
        return baseFreq * Math.pow(2, semitones / 12);
    };

    // --- Channel 1: Pulse (Melody) ---
    const osc1 = offlineCtx.createOscillator();
    osc1.type = random() > 0.5 ? 'square' : 'triangle';
    const gain1 = offlineCtx.createGain();
    gain1.gain.value = 0.05;
    osc1.connect(gain1);
    gain1.connect(offlineCtx.destination);
    osc1.start(0);

    // Generate a repeating 2-measure riff for melody (8 beats)
    const melodyRiff: {beat: number, degree: number, len: number}[] = [];
    for (let i = 0; i < 8; i += 0.5) {
        if (random() > 0.3) {
            melodyRiff.push({
                beat: i,
                degree: Math.floor(random() * 8),
                len: (random() > 0.5 ? 0.25 : 0.5) * beatLength
            });
        }
    }

    // Play melody 4 times (8 measures total)
    for (let m = 0; m < 4; m++) {
        const offset = m * 8 * beatLength;
        for (const note of melodyRiff) {
            const time = offset + note.beat * beatLength;
            // Add a little variation in later measures
            const degreeOffset = (m === 3 && random() > 0.5) ? 2 : 0;
            const freq = getFreq(4 + (random() > 0.8 ? 1 : 0), note.degree + degreeOffset);
            osc1.frequency.setValueAtTime(freq, time);
            gain1.gain.setValueAtTime(0.05, time);
            gain1.gain.exponentialRampToValueAtTime(0.001, time + note.len);
        }
    }
    osc1.stop(duration);

    // --- Channel 2: Triangle (Bass) ---
    const osc2 = offlineCtx.createOscillator();
    osc2.type = 'triangle';
    const gain2 = offlineCtx.createGain();
    gain2.gain.value = 0.08;
    osc2.connect(gain2);
    gain2.connect(offlineCtx.destination);
    osc2.start(0);

    // Bass line (mostly on beats, roots)
    const bassRiff: number[] = [0, random()>0.5?2:4, random()>0.5?3:5, 0];
    for (let i = 0; i < 32; i++) { // 32 beats
        const time = i * beatLength;
        const measure = Math.floor(i / 4);
        const root = bassRiff[measure % 4];
        // bounce pattern
        const freq = (i % 2 === 0) ? getFreq(2, root) : getFreq(3, root);
        osc2.frequency.setValueAtTime(freq, time);
        gain2.gain.setValueAtTime(0.08, time);
        gain2.gain.linearRampToValueAtTime(0.01, time + beatLength * 0.8);
    }
    osc2.stop(duration);

    // --- Channel 3: Noise (Drums) ---
    const bufferSize = sampleRate * duration;
    const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    const noiseSource = offlineCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Filter noise for NES drum sound
    const noiseFilter = offlineCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = offlineCtx.createGain();
    noiseGain.gain.value = 0;

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(offlineCtx.destination);
    noiseSource.start(0);

    // Drum pattern: Kick on 1, 3; Snare on 2, 4
    for (let i = 0; i < 32; i++) {
        const time = i * beatLength;
        if (i % 2 === 0) { // Kick (low pass)
            noiseFilter.frequency.setValueAtTime(150, time);
            noiseGain.gain.setValueAtTime(0.1, time);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        } else { // Snare (high bandpass)
            noiseFilter.frequency.setValueAtTime(3000, time);
            noiseGain.gain.setValueAtTime(0.05, time);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        }
        // Hihat on offbeats
        const timeOff = time + beatLength / 2;
        noiseFilter.frequency.setValueAtTime(6000, timeOff);
        noiseGain.gain.setValueAtTime(0.02, timeOff);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, timeOff + 0.05);
    }

    const renderedBuffer = await offlineCtx.startRendering();
    // Also clean up AudioContext used for sample rate extraction if possible
    if (ctx.state !== 'closed') ctx.close();

    return renderedBuffer;
}
