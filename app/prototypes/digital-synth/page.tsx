"use client";

// Template for creating a new prototype
// To use this template:
// 1. Create a new folder in app/prototypes with your prototype name
// 2. Copy this file and styles.module.css into your new folder
// 3. Create an 'images' folder for your prototype's images
// 4. Rename and customize the component and styles as needed

import { useEffect, useRef, useState } from 'react';
import styles from './styles.module.css';

interface Note {
  note: string;
  freq: number;
  key: string;
  isBlack?: boolean;
}

interface PlayedNote {
  note: string;
  timestamp: number;
  duration?: number;
}

const NOTES: Note[] = [
  { note: 'C4', freq: 261.63, key: 'a' },
  { note: 'C#4', freq: 277.18, key: 'w', isBlack: true },
  { note: 'D4', freq: 293.66, key: 's' },
  { note: 'D#4', freq: 311.13, key: 'e', isBlack: true },
  { note: 'E4', freq: 329.63, key: 'd' },
  { note: 'F4', freq: 349.23, key: 'f' },
  { note: 'F#4', freq: 369.99, key: 't', isBlack: true },
  { note: 'G4', freq: 392.00, key: 'g' },
  { note: 'G#4', freq: 415.30, key: 'y', isBlack: true },
  { note: 'A4', freq: 440.00, key: 'h' },
  { note: 'A#4', freq: 466.16, key: 'u', isBlack: true },
  { note: 'B4', freq: 493.88, key: 'j' },
  { note: 'C5', freq: 523.25, key: 'k' },
];

export default function DigitalPiano() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<Map<string, OscillatorNode>>(new Map());
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [waveform, setWaveform] = useState<OscillatorType>('sine');
  const [playedNotes, setPlayedNotes] = useState<PlayedNote[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    audioContextRef.current = new AudioContext();

    const handleKeyDown = (e: KeyboardEvent) => {
      const note = NOTES.find(n => n.key === e.key.toLowerCase());
      if (note && !e.repeat) {
        playNote(note);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const note = NOTES.find(n => n.key === e.key.toLowerCase());
      if (note) {
        stopNote(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      audioContextRef.current?.close();
    };
  }, []);

  const playNote = (note: Note) => {
    if (!audioContextRef.current || oscillatorsRef.current.has(note.note)) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(note.freq, audioContextRef.current.currentTime);
    
    gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContextRef.current.currentTime + 0.01);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    oscillator.start();

    oscillatorsRef.current.set(note.note, oscillator);
    gainNodesRef.current.set(note.note, gainNode);
    setActiveNotes(prev => new Set([...prev, note.note]));

    if (isRecording) {
      const currentTime = Date.now();
      if (startTimeRef.current === 0) {
        startTimeRef.current = currentTime;
      }
      setPlayedNotes(prev => [...prev, {
        note: note.note,
        timestamp: currentTime - startTimeRef.current
      }]);
    }
  };

  const stopNote = (note: Note) => {
    const gainNode = gainNodesRef.current.get(note.note);
    const oscillator = oscillatorsRef.current.get(note.note);
    
    if (gainNode && oscillator && audioContextRef.current) {
      gainNode.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.1);
      setTimeout(() => {
        oscillator.stop();
        oscillatorsRef.current.delete(note.note);
        gainNodesRef.current.delete(note.note);
      }, 100);
    }
    
    setActiveNotes(prev => {
      const next = new Set(prev);
      next.delete(note.note);
      return next;
    });

    if (isRecording) {
      const currentTime = Date.now();
      setPlayedNotes(prev => prev.map(n => 
        n.note === note.note && !n.duration ? 
        { ...n, duration: currentTime - (startTimeRef.current + n.timestamp) } : 
        n
      ));
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setPlayedNotes([]);
      startTimeRef.current = 0;
    }
    setIsRecording(!isRecording);
  };

  const clearSongsheet = () => {
    setPlayedNotes([]);
    startTimeRef.current = 0;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Digital Piano</h1>
      
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label htmlFor="waveform">Sound:</label>
          <select
            id="waveform"
            value={waveform}
            onChange={(e) => setWaveform(e.target.value as OscillatorType)}
          >
            <option value="sine">Smooth</option>
            <option value="triangle">Soft</option>
            <option value="square">Electric</option>
            <option value="sawtooth">Sharp</option>
          </select>
        </div>

        <div className={styles.keyboard}>
          {NOTES.map((note) => (
            <button
              key={note.note}
              className={`${styles.key} ${note.isBlack ? styles.blackKey : styles.whiteKey} ${
                activeNotes.has(note.note) ? styles.active : ''
              }`}
              onMouseDown={() => playNote(note)}
              onMouseUp={() => stopNote(note)}
              onMouseLeave={() => activeNotes.has(note.note) && stopNote(note)}
              data-note={note.note}
              data-key={note.key}
            >
              <span className={styles.keyLabel}>{note.key}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.songsheetContainer}>
        <div className={styles.songsheetHeader}>
          <span>DIGITAL SONGSHEET</span>
          <span className={styles.recordingStatus}>
            {isRecording ? 'RECORDING IN PROGRESS' : 'READY TO RECORD'}
          </span>
        </div>
        
        <div className={styles.songsheet}>
          {playedNotes.map((playedNote, index) => (
            <div
              key={`${playedNote.note}-${playedNote.timestamp}`}
              className={`${styles.noteEntry} ${!playedNote.duration ? styles.activeNote : ''}`}
              style={{
                '--note-delay': `${playedNote.timestamp}ms`,
                '--note-duration': playedNote.duration ? `${playedNote.duration}ms` : '0ms'
              } as any}
            >
              <div className={styles.noteInfo}>
                <span className={styles.noteTime}>
                  {(playedNote.timestamp / 1000).toFixed(2)}s
                </span>
                <span className={styles.noteName}>{playedNote.note}</span>
                <span className={styles.noteDuration}>
                  {playedNote.duration ? `${(playedNote.duration / 1000).toFixed(2)}s` : '...'}
                </span>
              </div>
            </div>
          ))}
          {playedNotes.length === 0 && (
            <div className={styles.emptyState}>
              No notes recorded yet. Press "Start Recording" and play some notes!
            </div>
          )}
        </div>

        <div className={styles.visualizerControls}>
          <button
            className={`${styles.controlButton} ${isRecording ? styles.recording : ''}`}
            onClick={toggleRecording}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          <button
            className={styles.controlButton}
            onClick={clearSongsheet}
          >
            Clear Songsheet
          </button>
        </div>
      </div>

      <div className={styles.instructions}>
        <p>Use your keyboard to play! Keys are mapped as shown on the piano keys.</p>
      </div>
    </div>
  );
} 