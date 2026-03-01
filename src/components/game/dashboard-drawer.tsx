/**
 * [INPUT]: store.ts
 * [OUTPUT]: DashboardDrawer — left slide-in info drawer with reorderable sections
 * [POS]: 港漂手帐 — front page + character carousel + scene grid + objectives + finance
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { useState, useEffect } from 'react'
import { motion, Reorder, useDragControls } from 'framer-motion'
import {
  useGameStore, SCENES, PERIODS, GLOBAL_STAT_METAS,
  getCurrentChapter, getMonthYear,
} from '../../lib/store'

const P = 'hk'
const STORAGE_KEY = 'hk-dash-order'

const DEFAULT_ORDER = ['front', 'characters', 'stats', 'scenes', 'objectives', 'finance']

function loadOrder(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return DEFAULT_ORDER
}

interface SectionProps {
  id: string
  children: React.ReactNode
}

function DraggableSection({ id, children }: SectionProps) {
  const controls = useDragControls()
  return (
    <Reorder.Item value={id} dragListener={false} dragControls={controls}>
      <div className={`${P}-dash-section`}>
        <div
          className={`${P}-dash-drag-handle`}
          onPointerDown={(e) => controls.start(e)}
        >
          ⋮⋮
        </div>
        {children}
      </div>
    </Reorder.Item>
  )
}

export function DashboardDrawer() {
  const {
    toggleDashboard, currentMonth, currentPeriodIndex,
    characters, characterStats, globalStats, unlockedScenes,
    selectCharacter, selectScene, currentChapter: chapterId,
  } = useGameStore()

  const [order, setOrder] = useState(loadOrder)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
  }, [order])

  const chapter = getCurrentChapter(currentMonth)
  const { year, monthInYear } = getMonthYear(currentMonth)

  const renderSection = (id: string) => {
    switch (id) {
      case 'front':
        return (
          <DraggableSection key={id} id={id}>
            <div className={`${P}-dash-front`}>
              <div className={`${P}-dash-front-title`}>港漂手帐</div>
              <div className={`${P}-dash-front-info`}>
                第{year}年 {monthInYear}月 · {PERIODS[currentPeriodIndex]?.name}<br />
                第{chapterId}章「{chapter.name}」
              </div>
            </div>
          </DraggableSection>
        )

      case 'characters':
        return (
          <DraggableSection key={id} id={id}>
            <div className={`${P}-dash-section-title`}>缘分速览</div>
            <div className={`${P}-dash-char-scroll`}>
              {Object.entries(characters).map(([charId, char]) => {
                const stats = characterStats[charId]
                const affection = stats?.affection ?? 0
                return (
                  <div
                    key={charId}
                    className={`${P}-dash-char-card`}
                    onClick={() => { selectCharacter(charId); toggleDashboard() }}
                  >
                    <img src={char.portrait} alt={char.name} loading="lazy" />
                    <div className={`${P}-dash-char-card-info`}>
                      <div className={`${P}-dash-char-card-name`}>{char.name}</div>
                      <div className={`${P}-dash-char-card-stat`} style={{ color: char.themeColor }}>
                        ♥ {affection}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </DraggableSection>
        )

      case 'stats':
        return (
          <DraggableSection key={id} id={id}>
            <div className={`${P}-dash-section-title`}>能力值</div>
            {GLOBAL_STAT_METAS.map((meta) => (
              <div key={meta.key} className={`${P}-stat-bar`}>
                <span className={`${P}-stat-bar-label`}>{meta.icon} {meta.label}</span>
                <div className={`${P}-stat-bar-track`}>
                  <div
                    className={`${P}-stat-bar-fill`}
                    style={{
                      width: `${globalStats[meta.key] ?? 0}%`,
                      background: meta.color,
                    }}
                  />
                </div>
                <span className={`${P}-stat-bar-value`}>{globalStats[meta.key] ?? 0}</span>
              </div>
            ))}
          </DraggableSection>
        )

      case 'scenes':
        return (
          <DraggableSection key={id} id={id}>
            <div className={`${P}-dash-section-title`}>地点</div>
            <div className={`${P}-dash-scene-grid`}>
              {Object.entries(SCENES).map(([sceneId, scene]) => {
                const unlocked = unlockedScenes.includes(sceneId)
                return (
                  <div
                    key={sceneId}
                    className={`${P}-dash-scene-thumb ${!unlocked ? `${P}-dash-scene-locked` : ''}`}
                    onClick={() => {
                      if (unlocked) { selectScene(sceneId); toggleDashboard() }
                    }}
                  >
                    <img src={scene.background} alt={scene.name} loading="lazy" />
                    <div className={`${P}-dash-scene-thumb-label`}>
                      {unlocked ? scene.name : '???'}
                    </div>
                  </div>
                )
              })}
            </div>
          </DraggableSection>
        )

      case 'objectives':
        return (
          <DraggableSection key={id} id={id}>
            <div className={`${P}-dash-section-title`}>当前目标</div>
            {chapter.objectives.map((obj, i) => (
              <div key={i} className={`${P}-dash-objective`}>
                <div className={`${P}-dash-objective-check`}>○</div>
                {obj}
              </div>
            ))}
          </DraggableSection>
        )

      case 'finance':
        return (
          <DraggableSection key={id} id={id}>
            <div className={`${P}-dash-section-title`}>财务速览</div>
            <div className={`${P}-dash-finance`}>
              <div className={`${P}-dash-finance-item`}>
                <div className={`${P}-dash-finance-label`}>经济状况</div>
                <div className={`${P}-dash-finance-value`}>{globalStats.finance ?? 0}</div>
              </div>
              <div className={`${P}-dash-finance-item`}>
                <div className={`${P}-dash-finance-label`}>时尚品味</div>
                <div className={`${P}-dash-finance-value`}>{globalStats.fashion ?? 0}</div>
              </div>
            </div>
          </DraggableSection>
        )

      default:
        return null
    }
  }

  return (
    <>
      <motion.div
        className={`${P}-dash-overlay`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={toggleDashboard}
      />
      <motion.div
        className={`${P}-dash-drawer`}
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <button className={`${P}-dash-close`} onClick={toggleDashboard}>✕</button>

        <Reorder.Group
          axis="y"
          values={order}
          onReorder={setOrder}
          style={{ listStyle: 'none', padding: 0 }}
        >
          {order.map((id) => renderSection(id))}
        </Reorder.Group>
      </motion.div>
    </>
  )
}
