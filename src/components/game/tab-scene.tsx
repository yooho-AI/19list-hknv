/**
 * [INPUT]: store.ts (scenes/currentScene/selectScene/unlockedScenes)
 * [OUTPUT]: TabScene — scene hero + location list
 * [POS]: 场景 Tab，9:16大图 + 地点列表(锁定/解锁/当前态)
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { useGameStore, SCENES } from '../../lib/store'

const P = 'hk'

export function TabScene() {
  const {
    currentScene, selectScene, unlockedScenes,
  } = useGameStore()

  const scene = SCENES[currentScene]

  return (
    <div style={{ height: '100%', overflowY: 'auto' }} className={`${P}-scrollbar`}>

      {/* Scene Hero */}
      {scene && (
        <div className={`${P}-scene-hero`}>
          <img src={scene.background} alt={scene.name} loading="lazy" />
          <div className={`${P}-scene-hero-mask`} />
          <div className={`${P}-scene-hero-info`}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{scene.icon}</div>
            <h2 className={`${P}-scene-hero-name`}>{scene.name}</h2>
            <p className={`${P}-scene-hero-desc`}>{scene.description}</p>
            <p className={`${P}-scene-hero-atmo`}>{scene.atmosphere}</p>
          </div>
        </div>
      )}

      {/* All Locations */}
      <div style={{ padding: '16px 12px 20px' }}>
        <div className={`${P}-section-title`}>🗺️ 所有地点</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {Object.values(SCENES).map((s) => {
            const isActive = s.id === currentScene
            const isLocked = !unlockedScenes.includes(s.id)

            return (
              <button
                key={s.id}
                className={`${P}-char-tag ${isActive ? `${P}-char-tag-active` : ''}`}
                onClick={() => !isLocked && selectScene(s.id)}
                disabled={isLocked}
                style={isLocked ? { opacity: 0.35 } : undefined}
              >
                <span style={{ fontSize: 18 }}>{isLocked ? '🔒' : s.icon}</span>
                <span>{s.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
