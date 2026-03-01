/**
 * [INPUT]: store.ts (characters/currentCharacter/selectCharacter/characterStats/globalStats/currentMonth)
 * [OUTPUT]: TabCharacter — portrait hero + stat bars + relation graph + character grid + dossier
 * [POS]: 人物 Tab，立绘 + 属性 + SVG关系图 + 角色网格 + 全屏档案卡
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, GLOBAL_STAT_METAS, getAvailableCharacters } from '../../lib/store'
import type { StatMeta, Character } from '../../lib/store'

const P = 'hk'

// ── StatBar ───────────────────────────────────────────

function StatBar({ meta, value, delay = 0 }: { meta: StatMeta; value: number; delay?: number }) {
  return (
    <div className={`${P}-stat-bar`}>
      <span className={`${P}-stat-bar-label`}>{meta.icon} {meta.label}</span>
      <div className={`${P}-stat-bar-track`}>
        <motion.div
          className={`${P}-stat-bar-fill`}
          style={{ background: meta.color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay }}
        />
      </div>
      <span className={`${P}-stat-bar-value`} style={{ color: meta.color }}>{value}</span>
    </div>
  )
}

// ── Relation Label ────────────────────────────────────

function getRelationLabel(char: Character, stats: Record<string, number>): { text: string; color: string } {
  const relationMeta = char.statMetas.find((m) => m.category === 'relation')
  if (relationMeta) {
    const val = stats[relationMeta.key] ?? 0
    return { text: `${relationMeta.label} ${val}`, color: relationMeta.color }
  }
  return { text: char.title, color: 'var(--text-muted)' }
}

// ── SVG Relation Graph ────────────────────────────────

const W = 380
const H = 300
const CX = W / 2
const CY = H / 2
const R = 105
const NODE_R = 22

function RelationGraph({ onNodeClick }: { onNodeClick: (id: string) => void }) {
  const { characters, characterStats, currentMonth, currentCharacter } = useGameStore()
  const available = getAvailableCharacters(currentMonth, characters)
  const entries = Object.entries(available)

  const nodes = entries.map(([id, char], i) => {
    const angle = (Math.PI * 2 * i) / entries.length - Math.PI / 2
    return { id, char, x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) }
  })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', marginBottom: 16 }}>
      {/* Lines */}
      {nodes.map((node) => {
        const stats = characterStats[node.id] ?? {}
        const rel = getRelationLabel(node.char, stats)
        const mx = (CX + node.x) / 2
        const my = (CY + node.y) / 2
        const dx = node.x - CX
        const dy = node.y - CY
        const len = Math.sqrt(dx * dx + dy * dy)
        const sx = CX + (dx / len) * (NODE_R + 2)
        const sy = CY + (dy / len) * (NODE_R + 2)
        const ex = node.x - (dx / len) * (NODE_R + 2)
        const ey = node.y - (dy / len) * (NODE_R + 2)
        const isSelected = node.id === currentCharacter

        return (
          <g key={`line-${node.id}`}>
            <line
              x1={sx} y1={sy} x2={ex} y2={ey}
              stroke={isSelected ? node.char.themeColor : 'rgba(232,168,124,0.2)'}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray={isSelected ? 'none' : '4 3'}
            />
            <rect x={mx - 28} y={my - 8} width={56} height={16} rx={4} fill="rgba(26,26,46,0.9)" />
            <text x={mx} y={my + 3} textAnchor="middle" fontSize={9} fontWeight={600} fill={rel.color}>{rel.text}</text>
          </g>
        )
      })}

      {/* Center node */}
      <circle cx={CX} cy={CY} r={NODE_R + 4} fill="none" stroke="var(--primary)" strokeWidth={2.5} opacity={0.6} />
      <circle cx={CX} cy={CY} r={NODE_R} fill="rgba(232,168,124,0.1)" stroke="var(--primary)" strokeWidth={1.5} />
      <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle" fontSize={16}>👩</text>
      <text x={CX} y={CY + NODE_R + 14} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--primary)">我</text>

      {/* NPC nodes */}
      {nodes.map((node) => {
        const isSelected = node.id === currentCharacter
        return (
          <g key={`node-${node.id}`} style={{ cursor: 'pointer' }} onClick={() => onNodeClick(node.id)}>
            {isSelected && (
              <circle cx={node.x} cy={node.y} r={NODE_R + 4} fill="none" stroke={node.char.themeColor} strokeWidth={2} opacity={0.5} />
            )}
            <circle
              cx={node.x} cy={node.y} r={NODE_R}
              fill="rgba(232,168,124,0.06)"
              stroke={isSelected ? node.char.themeColor : 'var(--border)'}
              strokeWidth={isSelected ? 1.5 : 1}
            />
            <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={16}>👤</text>
            <text
              x={node.x} y={node.y + NODE_R + 13}
              textAnchor="middle" fontSize={10} fontWeight={600}
              fill={isSelected ? node.char.themeColor : 'var(--text-secondary)'}
            >
              {node.char.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── CharacterDossier ──────────────────────────────────

function CharacterDossier({ char, stats, onClose }: {
  char: Character
  stats: Record<string, number>
  onClose: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const rel = getRelationLabel(char, stats)

  return (
    <motion.div
      className={`${P}-dossier-overlay`}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
    >
      <button className={`${P}-dossier-close`} onClick={onClose}>✕</button>

      {/* Portrait */}
      <div className={`${P}-dossier-portrait`}>
        <motion.img
          src={char.portrait} alt={char.name}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className={`${P}-dossier-portrait-fade`} />
      </div>

      {/* Info */}
      <div className={`${P}-dossier-info`}>
        <div className={`${P}-dossier-name`}>{char.name}</div>
        <div className={`${P}-dossier-title-text`}>{char.title}</div>

        {/* Tags */}
        <div className={`${P}-dossier-tags`}>
          <span className={`${P}-dossier-tag`}>{char.gender === 'female' ? '女' : '男'}</span>
          <span className={`${P}-dossier-tag`}>{char.age}岁</span>
          <span className={`${P}-dossier-tag`}>{char.title}</span>
        </div>

        {/* Stat bars */}
        <div className={`${P}-dossier-section`}>
          <div className={`${P}-dossier-section-title`}>数值</div>
          {char.statMetas.map((meta, i) => (
            <StatBar key={meta.key} meta={meta} value={stats[meta.key] ?? 0} delay={i * 0.1} />
          ))}
        </div>

        {/* Description */}
        <div className={`${P}-dossier-section`}>
          <div className={`${P}-dossier-section-title`}>简介</div>
          <div className={`${P}-dossier-text`}>{char.description}</div>
        </div>

        {/* Personality */}
        <div className={`${P}-dossier-section`}>
          <div className={`${P}-dossier-section-title`}>性格</div>
          <div className={`${P}-dossier-text`}>
            {expanded ? char.personality : char.personality.slice(0, 40)}
            {char.personality.length > 40 && (
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  border: 'none', background: 'none', color: 'var(--primary)',
                  fontSize: 12, cursor: 'pointer', padding: '0 4px',
                }}
              >
                {expanded ? '收起' : '...展开'}
              </button>
            )}
          </div>
          <div className={`${P}-dossier-text`} style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginTop: 6 }}>
            「{char.speakingStyle}」
          </div>
        </div>

        {/* Relation */}
        <div className={`${P}-dossier-section`}>
          <div className={`${P}-dossier-section-title`}>关系</div>
          <div style={{ color: rel.color, fontWeight: 600, fontSize: 13 }}>{rel.text}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {char.triggerPoints.map((tp, i) => (
              <span
                key={i}
                className={`${P}-dossier-tag`}
                style={{ fontSize: 10 }}
              >
                {tp.slice(0, 6)}{'···'}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── TabCharacter ──────────────────────────────────────

export function TabCharacter() {
  const {
    characters, currentCharacter, selectCharacter,
    characterStats, globalStats, currentMonth,
  } = useGameStore()
  const [dossierCharId, setDossierCharId] = useState<string | null>(null)

  const available = getAvailableCharacters(currentMonth, characters)
  const char = currentCharacter ? characters[currentCharacter] : null
  const stats = currentCharacter ? (characterStats[currentCharacter] ?? {}) : {}

  const dossierChar = dossierCharId ? characters[dossierCharId] : null
  const dossierStats = dossierCharId ? (characterStats[dossierCharId] ?? {}) : {}

  const handleCharClick = (id: string) => {
    selectCharacter(id)
    setDossierCharId(id)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }} className={`${P}-scrollbar`}>

      {/* Portrait Hero */}
      {char ? (
        <>
          <div className={`${P}-portrait-hero`}>
            <motion.img
              src={char.portrait} alt={char.name}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              loading="lazy"
            />
            <div className={`${P}-portrait-hero-mask`} />
            <div className={`${P}-portrait-hero-info`}>
              <h2 className={`${P}-portrait-hero-name`} style={{ color: char.themeColor }}>{char.name}</h2>
              <p className={`${P}-portrait-hero-title`}>{char.title}</p>
            </div>
          </div>

          {/* Character Stats */}
          <div style={{ padding: '0 12px' }}>
            <div className={`${P}-section-title`}>好感度</div>
            {char.statMetas.map((meta, i) => (
              <StatBar key={meta.key} meta={meta} value={stats[meta.key] ?? 0} delay={i * 0.1} />
            ))}
          </div>
        </>
      ) : (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
          <p>选择一个角色开始互动</p>
        </div>
      )}

      <div style={{ padding: '0 12px 20px' }}>
        {/* Global Stats */}
        <div className={`${P}-section-title`}>能力值</div>
        {GLOBAL_STAT_METAS.map((meta, i) => (
          <StatBar key={meta.key} meta={meta} value={globalStats[meta.key] ?? 0} delay={i * 0.1} />
        ))}

        {/* Relation Graph */}
        <div className={`${P}-section-title`} style={{ marginTop: 16 }}>🔗 人物关系</div>
        <div style={{ background: 'rgba(232,168,124,0.03)', borderRadius: 12, padding: 8, border: '1px solid var(--border)' }}>
          <RelationGraph onNodeClick={handleCharClick} />
        </div>

        {/* All Characters Grid */}
        <div className={`${P}-section-title`} style={{ marginTop: 16 }}>👥 所有人物</div>
        <div className={`${P}-char-grid`}>
          {Object.entries(available).map(([id, c]) => {
            const isActive = id === currentCharacter
            const charStats = characterStats[id] ?? {}
            const affection = charStats.affection ?? 0
            return (
              <div
                key={id}
                className={`${P}-char-grid-item ${isActive ? `${P}-char-grid-active` : ''}`}
                onClick={() => handleCharClick(id)}
              >
                <img src={c.portrait} alt={c.name} loading="lazy" />
                <div className={`${P}-char-grid-info`}>
                  <div className={`${P}-char-grid-name`}>{c.name}</div>
                  <div className={`${P}-char-grid-stat`} style={{ color: c.themeColor }}>
                    ♥ {affection}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CharacterDossier Overlay */}
      <AnimatePresence>
        {dossierChar && (
          <CharacterDossier
            char={dossierChar}
            stats={dossierStats}
            onClose={() => setDossierCharId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
