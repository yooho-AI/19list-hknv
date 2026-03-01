/**
 * [INPUT]: opening-data.ts PROLOGUE_SCENES
 * [OUTPUT]: Prologue cinematic narrative sequence
 * [POS]: Multi-scene crossfade with typewriter narration, auto-advances or tap to skip
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PROLOGUE_SCENES } from '@/lib/opening-data'

interface Props {
  onComplete: () => void
}

const SCENE_DURATION = 5500
const CHAR_DELAY = 55

export default function Prologue({ onComplete }: Props) {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)

  const scene = PROLOGUE_SCENES[sceneIndex]
  const chars = useMemo(() => (scene ? scene.text.split('') : []), [sceneIndex])

  // Typewriter effect
  useEffect(() => {
    if (charIndex >= chars.length) return
    const timer = setTimeout(() => setCharIndex((i) => i + 1), CHAR_DELAY)
    return () => clearTimeout(timer)
  }, [charIndex, chars.length])

  // Auto-advance to next scene after text completes
  useEffect(() => {
    if (charIndex < chars.length) return
    const timer = setTimeout(() => {
      if (sceneIndex < PROLOGUE_SCENES.length - 1) {
        setSceneIndex((i) => i + 1)
        setCharIndex(0)
      } else {
        onComplete()
      }
    }, SCENE_DURATION - chars.length * CHAR_DELAY)
    return () => clearTimeout(timer)
  }, [charIndex, chars.length, sceneIndex, onComplete])

  const handleSkip = useCallback(() => {
    onComplete()
  }, [onComplete])

  const handleTap = useCallback(() => {
    // Tap to skip to next scene or complete
    if (charIndex < chars.length) {
      setCharIndex(chars.length) // instant-reveal text
    } else if (sceneIndex < PROLOGUE_SCENES.length - 1) {
      setSceneIndex((i) => i + 1)
      setCharIndex(0)
    } else {
      onComplete()
    }
  }, [charIndex, chars.length, sceneIndex, onComplete])

  return (
    <div className="hk-prologue" onClick={handleTap}>
      {/* Background images crossfade */}
      <AnimatePresence mode="sync">
        <motion.img
          key={sceneIndex}
          className="hk-prologue-bg"
          src={PROLOGUE_SCENES[sceneIndex].image}
          alt=""
          draggable={false}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        />
      </AnimatePresence>

      {/* Dark overlay */}
      <div className="hk-prologue-overlay" />

      {/* Film grain */}
      <div className="hk-film-grain" />

      {/* Narration text */}
      <div className="hk-prologue-text">
        <AnimatePresence mode="wait">
          <motion.div
            key={sceneIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {chars.slice(0, charIndex).map((char, i) => (
              <span key={i} className="hk-prologue-char">
                {char === '\n' ? <br /> : char}
              </span>
            ))}
            {charIndex < chars.length && <span className="hk-type-cursor" />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="hk-prologue-dots">
        {PROLOGUE_SCENES.map((_, i) => (
          <div
            key={i}
            className={`hk-prologue-dot ${i === sceneIndex ? 'active' : ''} ${i < sceneIndex ? 'done' : ''}`}
          />
        ))}
      </div>

      {/* Skip button */}
      <button className="hk-skip-btn" onClick={handleSkip}>
        跳过
      </button>
    </div>
  )
}
