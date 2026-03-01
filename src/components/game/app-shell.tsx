/**
 * [INPUT]: store.ts, bgm.ts, dashboard-drawer, tab-dialogue, tab-scene, tab-character
 * [OUTPUT]: AppShell — header + tab routing + tab bar + drawers + gesture navigation
 * [POS]: Unique layout entry, zero branching
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore, PERIODS, getCurrentChapter, getMonthYear } from '../../lib/store'
import { useBgm } from '../../lib/bgm'
import { DashboardDrawer } from './dashboard-drawer'
import { TabDialogue } from './tab-dialogue'
import { TabScene } from './tab-scene'
import { TabCharacter } from './tab-character'
import {
  Notebook, Scroll, MusicNotes, SpeakerSimpleSlash,
  List, MapTrifold, ChatCircleDots, User, X,
} from '@phosphor-icons/react'

const P = 'hk'

const TABS = [
  { key: 'scene', Icon: MapTrifold, label: '场景' },
  { key: 'dialogue', Icon: ChatCircleDots, label: '对话' },
  { key: 'character', Icon: User, label: '人物' },
] as const

export function AppShell({ onMenuOpen }: { onMenuOpen: () => void }) {
  const {
    activeTab, setActiveTab, currentMonth, currentPeriodIndex, currentChapter,
    showDashboard, toggleDashboard, showRecords, toggleRecords,
    storyRecords,
  } = useGameStore()
  const { toggle: toggleBgm, isPlaying: bgmPlaying } = useBgm()

  // Three-way gesture
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y)
    if (Math.abs(dx) > 60 && dy < Math.abs(dx) * 1.5) {
      if (dx > 0) toggleDashboard()
      else toggleRecords()
    }
    touchStart.current = null
  }, [toggleDashboard, toggleRecords])

  const chapter = getCurrentChapter(currentMonth)
  const { year, monthInYear } = getMonthYear(currentMonth)

  return (
    <div className={`${P}-shell`}>
      {/* Header */}
      <header className={`${P}-header`}>
        <div className={`${P}-header-left`}>
          <button
            className={`${P}-header-btn ${bgmPlaying ? `${P}-music-playing` : ''}`}
            onClick={toggleBgm}
            title="BGM"
          >
            {bgmPlaying ? <MusicNotes size={18} /> : <SpeakerSimpleSlash size={18} />}
          </button>
        </div>
        <div className={`${P}-header-center`}>
          <div className={`${P}-header-time`}>
            第{year}年{monthInYear}月 · {PERIODS[currentPeriodIndex]?.name}
          </div>
          <div className={`${P}-header-chapter`}>
            第{currentChapter}章「{chapter.name}」
          </div>
        </div>
        <div className={`${P}-header-right`}>
          <button className={`${P}-header-btn`} onClick={onMenuOpen} title="菜单">
            <List size={18} />
          </button>
        </div>
      </header>

      {/* Tab Content */}
      <div
        style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'dialogue' && (
            <motion.div
              key="dialogue"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ height: '100%' }}
            >
              <TabDialogue />
            </motion.div>
          )}
          {activeTab === 'scene' && (
            <motion.div
              key="scene"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              style={{ height: '100%', overflowY: 'auto' }}
              className={`${P}-scrollbar`}
            >
              <TabScene />
            </motion.div>
          )}
          {activeTab === 'character' && (
            <motion.div
              key="character"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ height: '100%', overflowY: 'auto' }}
              className={`${P}-scrollbar`}
            >
              <TabCharacter />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tab Bar (5 buttons: 手册 + 场景/对话/人物 + 事件) */}
      <nav className={`${P}-tab-bar`}>
        <button className={`${P}-tab-item`} onClick={toggleDashboard}>
          <Notebook size={20} weight={showDashboard ? 'fill' : 'regular'} />
          <span>手册</span>
        </button>
        {TABS.map(({ key, Icon, label }) => (
          <button
            key={key}
            className={`${P}-tab-item ${activeTab === key ? `${P}-tab-active` : ''}`}
            onClick={() => setActiveTab(key as typeof activeTab)}
          >
            <Icon size={20} weight={activeTab === key ? 'fill' : 'regular'} />
            <span>{label}</span>
          </button>
        ))}
        <button className={`${P}-tab-item`} onClick={toggleRecords}>
          <Scroll size={20} weight={showRecords ? 'fill' : 'regular'} />
          <span>事件</span>
        </button>
      </nav>

      {/* Dashboard Drawer (left) */}
      <AnimatePresence>
        {showDashboard && <DashboardDrawer />}
      </AnimatePresence>

      {/* Record Sheet (right) */}
      <AnimatePresence>
        {showRecords && (
          <>
            <motion.div
              className={`${P}-record-overlay`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleRecords}
            />
            <motion.div
              className={`${P}-record-sheet`}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <button className={`${P}-record-close`} onClick={toggleRecords}><X size={16} /></button>
              <h3 className={`${P}-record-title`}>事件记录</h3>
              <div className={`${P}-record-timeline`}>
                {[...storyRecords].reverse().map((record) => (
                  <div key={record.id} className={`${P}-record-item`}>
                    <div className={`${P}-record-dot`} />
                    <div className={`${P}-record-meta`}>
                      第{record.month}月 · {record.period}
                    </div>
                    <div className={`${P}-record-event-title`}>{record.title}</div>
                    <div className={`${P}-record-event-content`}>
                      {record.content.slice(0, 60)}
                    </div>
                  </div>
                ))}
                {storyRecords.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 20 }}>
                    暂无记录
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}
