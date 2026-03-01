/**
 * [INPUT]: opening-data.ts COVER config
 * [OUTPUT]: CoverPage cover component
 * [POS]: Game cover: scene image background + title overlay + start/continue buttons
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { motion } from 'framer-motion'
import { COVER } from '@/lib/opening-data'

interface Props {
  hasSave: boolean
  onNewGame: () => void
  onContinue: () => void
}

export default function CoverPage({ hasSave, onNewGame, onContinue }: Props) {
  return (
    <div className="cover">
      <img
        className="cover-bg"
        src={COVER.poster}
        alt=""
        draggable={false}
      />
      <div className="cover-overlay" />
      <motion.div
        className="cover-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="cover-line" />
        <div className="cover-logo">{COVER.title}</div>
        {COVER.subtitle && <div className="cover-sub">{COVER.subtitle}</div>}
        {COVER.slogan && <div className="cover-slogan">{COVER.slogan}</div>}
        <div className="cover-actions">
          <button className="cover-start" onClick={onNewGame}>
            开始游戏
          </button>
          {hasSave && (
            <button className="cover-continue" onClick={onContinue}>
              继续游戏
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
