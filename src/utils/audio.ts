/**
 * Web Audio API synthesizer for a premium, crisp instant message notification chime (similar to WhatsApp/Telegram).
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        sharedAudioCtx = new AudioCtxClass();
      }
    }
    return sharedAudioCtx;
  } catch (e) {
    console.warn("AudioContext creation error:", e);
    return null;
  }
}

// Auto-unlock AudioContext on first user interaction
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
}

export function unlockAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

export function playNotificationSound(count?: number, actionType?: 'urgent_alert' | 'order_received' | 'price_updated' | 'test' | 'supplier_signal' | string) {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem('isAudioMuted') === 'true') return;
    
    const audioCtx = getAudioContext();
    if (!audioCtx) return;

    const playNotes = () => {
      const now = audioCtx.currentTime;

      let notes = [
        { freq: 523.25, delay: 0.0, duration: 0.12, volume: 0.12 }, // C5
        { freq: 659.25, delay: 0.04, duration: 0.12, volume: 0.12 }, // E5
        { freq: 783.99, delay: 0.08, duration: 0.7, volume: 0.16 }   // G5
      ];

      if (actionType === 'urgent_alert') {
        // High-end crisp push notification style (A5 -> C6 -> E6 crisp tri-arp)
        notes = [
          { freq: 880.00, delay: 0.0, duration: 0.14, volume: 0.18 }, 
          { freq: 1046.50, delay: 0.06, duration: 0.14, volume: 0.20 }, 
          { freq: 1318.51, delay: 0.12, duration: 0.55, volume: 0.24 }  
        ];
      } else if (actionType === 'order_received') {
        // Cash register / order success chime
        notes = [
          { freq: 987.77, delay: 0.0, duration: 0.09, volume: 0.15 }, 
          { freq: 1318.51, delay: 0.06, duration: 0.5, volume: 0.22 }
        ];
      } else if (actionType === 'price_updated') {
        // Smooth mellow double pulse
        notes = [
          { freq: 587.33, delay: 0.0, duration: 0.1, volume: 0.12 }, // D5
          { freq: 880.00, delay: 0.08, duration: 0.45, volume: 0.16 }  // A5
        ];
      } else if (actionType === 'supplier_signal') {
        // Double acoustic pulse for warehouse & supply logistics
        notes = [
          { freq: 659.25, delay: 0.0, duration: 0.1, volume: 0.15 },
          { freq: 880.00, delay: 0.1, duration: 0.35, volume: 0.18 }
        ];
      } else if (actionType === 'test') {
        // Rich melodic sequence
        notes = [
          { freq: 523.25, delay: 0.0, duration: 0.1, volume: 0.14 },
          { freq: 659.25, delay: 0.08, duration: 0.1, volume: 0.14 },
          { freq: 783.99, delay: 0.16, duration: 0.1, volume: 0.16 },
          { freq: 1046.50, delay: 0.24, duration: 0.45, volume: 0.2 }
        ];
      }

      notes.forEach((note) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.delay);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, now + note.delay);

        gainNode.gain.setValueAtTime(0, now + note.delay);
        gainNode.gain.linearRampToValueAtTime(note.volume, now + note.delay + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + note.delay + note.duration);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start(now + note.delay);
        osc.stop(now + note.delay + note.duration + 0.15);
      });
    };

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(playNotes).catch(() => {
        playNotes();
      });
    } else {
      playNotes();
    }

  } catch (e) {
    console.warn("Notification sound synthesis notice:", e);
  }
}


