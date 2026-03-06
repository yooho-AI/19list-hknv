/**
 * [INPUT]: store.ts (characters/currentCharacter/selectCharacter/characterStats/currentMonth)
 * [OUTPUT]: TabCharacter — 2x2 grid + SVG relation graph + CharacterDossier + CharacterChat
 * [POS]: 人物 Tab，2x2角色网格(聊天按钮+mini好感条) + SVG关系图 + 全屏档案 + 私聊
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatCircleDots } from '@phosphor-icons/react'
import { useGameStore, getAvailableCharacters, getStatLevel } from '../../lib/store'
import type { Character } from '../../lib/store'
import CharacterChat from './character-chat'

const P = 'hk'

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
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
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
            <clipPath id={`clip-${node.id}`}>
              <circle cx={node.x} cy={node.y} r={NODE_R - 2} />
            </clipPath>
            <image
              href={node.char.portrait}
              x={node.x - NODE_R + 2} y={node.y - NODE_R + 2}
              width={(NODE_R - 2) * 2} height={(NODE_R - 2) * 2}
              clipPath={`url(#clip-${node.id})`}
              preserveAspectRatio="xMidYMid slice"
            />
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

// ── CharacterDossier (overlay + sheet pattern) ────────

function CharacterDossier({ char, stats, onClose }: {
  char: Character
  stats: Record<string, number>
  onClose: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const rel = getRelationLabel(char, stats)

  return (
    <>
      <motion.div
        className={`${P}-dossier-overlay`}
        style={{ background: 'rgba(0,0,0,0.5)', overflow: 'visible' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className={`${P}-record-sheet`}
        style={{ zIndex: 130, overflowY: 'auto' }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
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
            {char.statMetas.map((meta, i) => {
              const value = stats[meta.key] ?? 0
              return (
                <div key={meta.key} className={`${P}-stat-bar`}>
                  <span className={`${P}-stat-bar-label`}>{meta.icon} {meta.label}</span>
                  <div className={`${P}-stat-bar-track`}>
                    <motion.div
                      className={`${P}-stat-bar-fill`}
                      style={{ background: meta.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.1 }}
                    />
                  </div>
                  <span className={`${P}-stat-bar-value`} style={{ color: meta.color }}>{value}</span>
                </div>
              )
            })}
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
    </>
  )
}

// ── TabCharacter ──────────────────────────────────────

export function TabCharacter() {
  const {
    characters, characterStats, currentMonth,
  } = useGameStore()
  const [dossierCharId, setDossierCharId] = useState<string | null>(null)
  const [chatChar, setChatChar] = useState<string | null>(null)

  const available = getAvailableCharacters(currentMonth, characters)

  const dossierChar = dossierCharId ? characters[dossierCharId] : null
  const dossierStats = dossierCharId ? (characterStats[dossierCharId] ?? {}) : {}

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 12 }} className={`${P}-scrollbar`}>
      {/* ── 角色网格 (2x2) ── */}
      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, paddingLeft: 4 }}>
        👥 人物一览
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {Object.entries(available).map(([id, char]) => {
          const stats = characterStats[id] ?? {}
          const mainMeta = char.statMetas[0]
          const mainVal = stats[mainMeta?.key] ?? 0
          const level = getStatLevel(mainVal)
          return (
            <button
              key={id}
              onClick={() => setDossierCharId(id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: 10, borderRadius: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              {/* 聊天按钮 */}
              <div
                onClick={(e) => { e.stopPropagation(); setChatChar(id) }}
                style={{
                  position: 'absolute', top: 6, left: 6,
                  width: 28, height: 28, borderRadius: '50%',
                  background: `${char.themeColor}18`,
                  border: `1px solid ${char.themeColor}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 1,
                }}
              >
                <ChatCircleDots size={16} weight="fill" color={char.themeColor} />
              </div>
              <img
                src={char.portrait}
                alt={char.name}
                style={{
                  width: 56, height: 56, borderRadius: '50%',
                  objectFit: 'cover', objectPosition: 'center top',
                  border: `2px solid ${char.themeColor}44`,
                  marginBottom: 6,
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 500, color: char.themeColor }}>
                {char.name}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                {char.title}
              </span>
              {/* Mini affection bar */}
              <div style={{ width: '80%', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: char.themeColor,
                  width: `${mainVal}%`, transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                {level.name} {mainVal}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── 关系图 ── */}
      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, paddingLeft: 4 }}>
        🔗 关系网络
      </h4>
      <div style={{
        padding: 8, borderRadius: 12, background: 'rgba(232,168,124,0.03)',
        border: '1px solid var(--border)', marginBottom: 20,
      }}>
        <RelationGraph onNodeClick={(id) => setDossierCharId(id)} />
      </div>

      <div style={{ height: 16 }} />

      {/* ── Character Dossier ── */}
      <AnimatePresence>
        {dossierChar && (
          <CharacterDossier
            char={dossierChar}
            stats={dossierStats}
            onClose={() => setDossierCharId(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Character Chat ── */}
      <AnimatePresence>
        {chatChar && characters[chatChar] && (
          <CharacterChat
            charId={chatChar}
            onClose={() => setChatChar(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
