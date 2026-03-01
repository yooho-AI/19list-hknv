/**
 * [INPUT]: store.ts, styles, analytics
 * [OUTPUT]: Root component — Opening + GameScreen + EndingModal + MenuOverlay
 * [POS]: App entry point, no isMobile branching
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore, ENDINGS } from './lib/store'
import { useBgm } from './lib/bgm'
import { trackGameStart, trackGameContinue, trackPlayerCreate } from './lib/analytics'
import { AppShell } from './components/game/app-shell'
import './styles/globals.css'
import './styles/opening.css'
import './styles/rich-cards.css'

const P = 'hk'

// ── Ending Type Map (data-driven) ──

const ENDING_TYPE_MAP: Record<string, { label: string; color: string; icon: string }> = {
  BE: { label: 'Bad Ending', color: '#dc2626', icon: '💔' },
  TE: { label: 'True Ending', color: '#C9A96E', icon: '👑' },
  HE: { label: 'Happy Ending', color: '#22c55e', icon: '🌟' },
  SE: { label: 'Secret Ending', color: '#E8A87C', icon: '🏙️' },
  NE: { label: 'Normal Ending', color: '#94a3b8', icon: '🌙' },
}

// ── Opening Screen ──

function StartScreen() {
  const { setPlayerInfo, initGame, loadGame, hasSave } = useGameStore()
  const { toggle: toggleBgm, isPlaying } = useBgm()
  const saved = hasSave()
  const [phase, setPhase] = useState<'cinema' | 'name'>('cinema')
  const [name, setName] = useState('林薇琪')
  const [typeIndex, setTypeIndex] = useState(0)

  const introText = '一只行李箱，一腔热血，一份IANG签证。\n从红磡劏房到维港之巅，\n你的图鉴，由你亲手绘制。'
  const chars = useMemo(() => introText.split(''), [])

  useEffect(() => {
    if (phase !== 'cinema') return
    if (typeIndex >= chars.length) return
    const timer = setTimeout(() => setTypeIndex((i) => i + 1), 60)
    return () => clearTimeout(timer)
  }, [typeIndex, phase, chars.length])

  const handleStart = useCallback(() => {
    trackGameStart()
    setPhase('name')
  }, [])

  const handleContinue = useCallback(() => {
    trackGameContinue()
    loadGame()
  }, [loadGame])

  const handleBegin = useCallback(() => {
    if (!name.trim()) return
    trackPlayerCreate(name)
    setPlayerInfo(name)
    initGame()
  }, [name, setPlayerInfo, initGame])

  return (
    <div className={`${P}-start`}>
      <div className={`${P}-film-grain`} />

      <AnimatePresence mode="wait">
        {phase === 'cinema' && (
          <motion.div
            key="cinema"
            className={`${P}-cinema-scene`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Skyline silhouette */}
            <div className={`${P}-skyline`} />

            {/* Neon dots */}
            <div className={`${P}-neon-dots`}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className={`${P}-neon-dot`}
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${20 + Math.random() * 60}%`,
                    color: ['#E8A87C', '#FF6B9D', '#6B8DD6', '#22c55e', '#f59e0b'][i % 5],
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${1.5 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            {/* Title */}
            <motion.div
              className={`${P}-cinema-title`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className={`${P}-title-main`}>香港女子图鉴</div>
              <div className={`${P}-title-divider`} />
              <div className={`${P}-title-sub`}>港漂十年</div>
            </motion.div>

            {/* Typewriter text */}
            <motion.div
              className={`${P}-typewriter`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              {chars.slice(0, typeIndex).map((char, i) => (
                <span
                  key={i}
                  className={`${P}-type-char`}
                  style={{ animationDelay: '0s' }}
                >
                  {char === '\n' ? <br /> : char}
                </span>
              ))}
              {typeIndex < chars.length && <span className={`${P}-type-cursor`} />}
            </motion.div>

            {/* CTA */}
            <motion.div
              className={`${P}-start-cta`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
            >
              <button className={`${P}-start-btn`} onClick={handleStart}>
                开始你的港漂十年
              </button>
              {saved && (
                <button className={`${P}-continue-btn`} onClick={handleContinue}>
                  继续游戏
                </button>
              )}
            </motion.div>
          </motion.div>
        )}

        {phase === 'name' && (
          <motion.div
            key="name"
            className={`${P}-name-scene`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ width: '100%', maxWidth: 300, textAlign: 'center' }}
            >
              <div className={`${P}-name-label`}>你的名字</div>
              <input
                className={`${P}-name-input`}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入角色名"
                maxLength={8}
                autoFocus
              />
              <div className={`${P}-name-hint`}>默认：林薇琪</div>

              <div className={`${P}-start-cta`}>
                <button className={`${P}-start-btn`} onClick={handleBegin}>
                  踏上旅程
                </button>
                <button
                  className={`${P}-continue-btn`}
                  onClick={() => setPhase('cinema')}
                >
                  返回
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Music bar */}
      <div className={`${P}-music-bar`} onClick={toggleBgm}>
        <span>{isPlaying ? '♪' : '♪'}</span>
        <span>{isPlaying ? '播放中' : '点击播放'}</span>
      </div>
    </div>
  )
}

// ── Ending Modal ──

function EndingModal() {
  const { endingType, resetGame, clearSave } = useGameStore()
  if (!endingType) return null

  const ending = ENDINGS.find((e) => e.id === endingType)
  if (!ending) return null
  const meta = ENDING_TYPE_MAP[ending.type] ?? ENDING_TYPE_MAP.NE

  return (
    <AnimatePresence>
      <motion.div
        className={`${P}-ending-overlay`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className={`${P}-ending-modal`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>{meta.icon}</div>
          <div
            style={{
              display: 'inline-block',
              padding: '4px 16px',
              borderRadius: 20,
              background: `${meta.color}20`,
              color: meta.color,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 2,
              marginBottom: 16,
            }}
          >
            {meta.label}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
            {ending.name}
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 24 }}>
            {ending.description}
          </p>
          <button
            className={`${P}-start-btn`}
            onClick={() => { clearSave(); resetGame() }}
            style={{ fontSize: 13 }}
          >
            重新开始
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Menu Overlay ──

function MenuOverlay({ onClose }: { onClose: () => void }) {
  const { saveGame, loadGame, resetGame, clearSave } = useGameStore()
  const [toast, setToast] = useState('')

  const notify = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  return (
    <motion.div
      className={`${P}-overlay`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`${P}-modal`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, textAlign: 'center', color: 'var(--primary)' }}>
          菜单
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className={`${P}-quick-btn`} onClick={() => { saveGame(); notify('已保存') }}>
            💾 保存游戏
          </button>
          <button className={`${P}-quick-btn`} onClick={() => { loadGame(); onClose() }}>
            📂 读取存档
          </button>
          <button className={`${P}-quick-btn`} onClick={() => { clearSave(); resetGame(); onClose() }}>
            🔄 重新开始
          </button>
          <button className={`${P}-quick-btn`} onClick={onClose}>
            ▶️ 继续游戏
          </button>
        </div>
        {toast && (
          <div className={`${P}-toast`} style={{ position: 'absolute', bottom: -50, left: '50%', transform: 'translateX(-50%)' }}>
            {toast}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── App Root ──

export default function App() {
  const { gameStarted } = useGameStore()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!gameStarted) return <StartScreen />

  return (
    <>
      <AppShell onMenuOpen={() => setMenuOpen(true)} />
      <AnimatePresence>
        {menuOpen && <MenuOverlay onClose={() => setMenuOpen(false)} />}
      </AnimatePresence>
      <EndingModal />
    </>
  )
}
