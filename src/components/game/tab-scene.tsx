/**
 * [INPUT]: store.ts (scenes/currentScene/selectScene/unlockedScenes/characters/selectCharacter/currentMonth)
 * [OUTPUT]: TabScene — scene hero + related characters + location list
 * [POS]: 场景 Tab，9:16大图 + 人物标签 + 地点列表(锁定/解锁/当前态)
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { useGameStore, SCENES, getAvailableCharacters } from '../../lib/store'

const P = 'hk'

export function TabScene() {
  const {
    currentScene, selectScene, unlockedScenes,
    characters, selectCharacter, setActiveTab,
    currentMonth,
  } = useGameStore()

  const scene = SCENES[currentScene]
  const availableChars = getAvailableCharacters(currentMonth, characters)
  const allScenes = Object.values(SCENES)

  const handleCharClick = (charId: string) => {
    selectCharacter(charId)
    setActiveTab('character')
  }

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

      <div style={{ padding: '0 12px 20px' }}>
        {/* Related Characters */}
        <div className={`${P}-section-title`}>👤 场景相关人物</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          {Object.entries(availableChars).map(([id, char]) => (
            <button
              key={id}
              className={`${P}-char-tag`}
              onClick={() => handleCharClick(id)}
            >
              <img
                src={char.portrait} alt={char.name}
                style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                loading="lazy"
              />
              <span>{char.name}</span>
            </button>
          ))}
        </div>

        {/* All Locations */}
        <div className={`${P}-section-title`}>🗺️ 所有地点</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {allScenes.map((s) => {
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
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <span>{s.name}{isLocked ? ' 🔒' : ''}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
