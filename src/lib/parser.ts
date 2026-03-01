/**
 * [INPUT]: None (no data.ts import — avoids circular deps)
 * [OUTPUT]: parseStoryParagraph function + color maps
 * [POS]: AI 回复解析 — 角色名着色 + 数值着色 + charColor 输出
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

// ── Character Colors (hardcoded, no import from data.ts) ──

const CHARACTER_COLORS: Record<string, string> = {
  '陈子谦': '#C9A96E',
  '张佑宁': '#FF6B9D',
  '李志轩': '#6B8DD6',
  '程志峰': '#4A5568',
  '林薇琪': '#E8A87C',
  'Amy': '#a78bfa',
  'Maggie': '#f472b6',
  'Marcus': '#64748b',
  '清姐': '#10b981',
  'Ravi': '#f59e0b',
}

// ── Stat Colors ──

const STAT_COLORS: Record<string, string> = {
  '职业能力': '#3b82f6',
  '职业': '#3b82f6',
  '经济状况': '#f59e0b',
  '经济': '#f59e0b',
  '存款': '#f59e0b',
  '社交人脉': '#8b5cf6',
  '社交': '#8b5cf6',
  '人脉': '#8b5cf6',
  '情感健康': '#ec4899',
  '情感': '#ec4899',
  '心理': '#ec4899',
  '时尚品味': '#f97316',
  '时尚': '#f97316',
  '粤语能力': '#10b981',
  '粤语': '#10b981',
  '好感': '#E8A87C',
  '好感度': '#E8A87C',
}

const DEFAULT_COLOR = '#E8A87C'

// ── Parser ──

export interface ParsedParagraph {
  narrative: string
  statHtml: string
  charColor: string | null
}

export function parseStoryParagraph(content: string): ParsedParagraph {
  let charColor: string | null = null
  let narrative = content
  let statHtml = ''

  // Detect first character name for NPC bubble border
  for (const [name, color] of Object.entries(CHARACTER_COLORS)) {
    if (content.includes(name)) {
      charColor = color
      break
    }
  }

  // Highlight character names
  for (const [name, color] of Object.entries(CHARACTER_COLORS)) {
    narrative = narrative.replace(
      new RegExp(name, 'g'),
      `<span style="color:${color};font-weight:600">${name}</span>`
    )
  }

  // Extract and highlight stat changes: 【Stat+N】 or 【Name Stat+N】
  const statRegex = /[【\[]((?:[^\]】]+?\s+)?(\S+?)([+-])(\d+))[】\]]/g
  const statMatches: string[] = []
  let match

  while ((match = statRegex.exec(content))) {
    const [fullMatch, , statLabel, sign, num] = match
    const color = STAT_COLORS[statLabel] || DEFAULT_COLOR
    const signChar = sign === '+' ? '+' : '-'
    const signColor = sign === '+' ? '#22c55e' : '#ef4444'

    statMatches.push(
      `<span style="color:${color}">${statLabel}</span>` +
      `<span style="color:${signColor}">${signChar}${num}</span>`
    )

    // Remove from narrative
    narrative = narrative.replace(fullMatch, '')
  }

  if (statMatches.length > 0) {
    statHtml = statMatches.join('  ')
  }

  // Clean up extra whitespace
  narrative = narrative.replace(/\n{3,}/g, '\n\n').trim()

  return { narrative, statHtml, charColor }
}
