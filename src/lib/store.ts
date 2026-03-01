/**
 * [INPUT]: script.md (raw), stream.ts, data.ts
 * [OUTPUT]: useGameStore hook + re-exported data types/constants
 * [POS]: 状态中枢 — Zustand + 剧本直通 + 富消息 + 双轨解析 + 链式反应
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import GAME_SCRIPT from './script.md?raw'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { streamChat, chat } from './stream'
import { extractChoices } from './parser'
import {
  type Character, type CharacterStats, type Message, type StatMeta, type StoryRecord,
  PERIODS, MAX_MONTHS, MAX_ACTION_POINTS,
  SCENES, ITEMS, GLOBAL_STAT_METAS, INITIAL_GLOBAL_STATS,
  STORY_INFO,
  buildCharacters, getCurrentChapter, getDayEvents, getMonthYear,
} from './data'

type GameStore = GameState & GameActions
let messageCounter = 0
const makeId = () => `msg-${Date.now()}-${++messageCounter}`
const SAVE_KEY = 'hknv-save-v1'

// ── State Interface ──

interface GameState {
  gameStarted: boolean
  playerName: string
  characters: Record<string, Character>
  globalStats: CharacterStats
  currentMonth: number
  currentPeriodIndex: number
  actionPoints: number
  currentScene: string
  currentCharacter: string | null
  characterStats: Record<string, CharacterStats>
  unlockedScenes: string[]
  currentChapter: number
  triggeredEvents: string[]
  inventory: Record<string, number>
  messages: Message[]
  historySummary: string
  isTyping: boolean
  streamingContent: string
  choices: string[]
  endingType: string | null
  activeTab: 'dialogue' | 'scene' | 'character'
  showDashboard: boolean
  showRecords: boolean
  storyRecords: StoryRecord[]
}

interface GameActions {
  setPlayerInfo: (name: string) => void
  initGame: () => void
  selectCharacter: (charId: string | null) => void
  selectScene: (sceneId: string) => void
  setActiveTab: (tab: 'dialogue' | 'scene' | 'character') => void
  toggleDashboard: () => void
  toggleRecords: () => void
  sendMessage: (text: string) => Promise<void>
  advanceTime: () => void
  useItem: (itemId: string) => void
  checkEnding: () => void
  addSystemMessage: (content: string) => void
  addStoryRecord: (title: string, content: string) => void
  resetGame: () => void
  saveGame: () => void
  loadGame: () => void
  hasSave: () => boolean
  clearSave: () => void
}

// ── Dual-track Parser ──

interface StatChangeResult {
  charChanges: Array<{ charId: string; stat: string; delta: number }>
  globalChanges: Array<{ key: string; delta: number }>
}

function parseStatChanges(
  content: string,
  characters: Record<string, Character>
): StatChangeResult {
  const charChanges: StatChangeResult['charChanges'] = []
  const globalChanges: StatChangeResult['globalChanges'] = []

  const nameToId: Record<string, string> = {}
  for (const [id, char] of Object.entries(characters)) {
    nameToId[char.name] = id
  }

  const labelToKey: Record<string, Array<{ charId: string; key: string }>> = {}
  for (const [charId, char] of Object.entries(characters)) {
    for (const meta of char.statMetas) {
      const labels = [meta.label, meta.label + '度', meta.label + '值']
      for (const label of labels) {
        if (!labelToKey[label]) labelToKey[label] = []
        labelToKey[label].push({ charId, key: meta.key })
      }
    }
  }

  const GLOBAL_ALIASES: Record<string, string> = {
    '职业能力': 'career', '职业': 'career',
    '经济状况': 'finance', '经济': 'finance', '存款': 'finance',
    '社交人脉': 'network', '社交': 'network', '人脉': 'network',
    '情感健康': 'emotional', '情感': 'emotional', '心理': 'emotional',
    '时尚品味': 'fashion', '时尚': 'fashion',
    '粤语能力': 'cantonese', '粤语': 'cantonese',
  }

  // Track 1: Character stat changes — 【角色名 数值+N】
  const charRegex = /[【\[]([^\]】]+?)\s+(\S+?)([+-])(\d+)[】\]]/g
  let match
  while ((match = charRegex.exec(content))) {
    const [, context, statLabel, sign, numStr] = match
    const delta = parseInt(numStr) * (sign === '+' ? 1 : -1)
    const charId = nameToId[context]
    if (charId) {
      const entries = labelToKey[statLabel]
      const entry = entries?.find((e) => e.charId === charId) || entries?.[0]
      if (entry) {
        charChanges.push({ charId: entry.charId, stat: entry.key, delta })
      }
    }
  }

  // Track 2: Global stat changes — 【职业能力+5】
  const globalRegex = /[【\[](\S+?)([+-])(\d+)[】\]]/g
  let gMatch
  while ((gMatch = globalRegex.exec(content))) {
    const [, label, sign, numStr] = gMatch
    const delta = parseInt(numStr) * (sign === '+' ? 1 : -1)
    const globalKey = GLOBAL_ALIASES[label]
    if (globalKey) {
      globalChanges.push({ key: globalKey, delta })
    }
  }

  return { charChanges, globalChanges }
}

// ── System Prompt Builder ──

function buildStatsSnapshot(state: GameState): string {
  const globalLines = GLOBAL_STAT_METAS
    .map((m) => `  ${m.icon} ${m.label}: ${state.globalStats[m.key] ?? 0}/100`)
    .join('\n')

  const charLines = Object.entries(state.characterStats)
    .map(([charId, stats]) => {
      const char = state.characters[charId]
      if (!char) return ''
      const lines = char.statMetas
        .map((m: StatMeta) => `  ${m.icon} ${m.label}: ${stats[m.key] ?? 0}/100`)
        .join('\n')
      return `${char.name}:\n${lines}`
    })
    .filter(Boolean)
    .join('\n')

  return `全局属性:\n${globalLines}\n\nNPC好感:\n${charLines}`
}

function buildSystemPrompt(state: GameState): string {
  const char = state.currentCharacter
    ? state.characters[state.currentCharacter]
    : null
  const chapter = getCurrentChapter(state.currentMonth)
  const scene = SCENES[state.currentScene]
  const { year, monthInYear } = getMonthYear(state.currentMonth)

  return `你是《${STORY_INFO.title}》的AI叙述者。

## 游戏剧本
${GAME_SCRIPT}

## 当前状态
玩家「${state.playerName}」(林薇琪)
第${state.currentMonth}月（第${year}年${monthInYear}月） · ${PERIODS[state.currentPeriodIndex].name}
第${chapter.id}章「${chapter.name}」
当前场景：${scene?.name ?? '未知'}
${char ? `当前交互角色：${char.name}` : ''}

## 当前数值
${buildStatsSnapshot(state)}

## 背包
${Object.entries(state.inventory).filter(([, v]) => v > 0).map(([k, v]) => `${ITEMS[k]?.name} x${v}`).join('、') || '空'}

## 已触发事件
${state.triggeredEvents.join('、') || '无'}

## 输出格式
- 每段回复 200-400 字（关键对话 500-800 字）
- 角色对话用角色名开头标识说话者
- 数值变化：【职业能力+5】【陈子谦 好感+10】
- 粤语穿插程度根据玩家粤语能力(${state.globalStats.cantonese})动态调整
- 严格遵循剧本叙事风格和信息不对称
- 每段回复末尾必须提供4个选项（1. 2. 3. 4.），让玩家选择下一步行动`
}

// ── Store ──

export const useGameStore = create<GameStore>()(immer((set, get) => ({
  // Initial state
  gameStarted: false,
  playerName: '',
  characters: buildCharacters(),
  globalStats: { ...INITIAL_GLOBAL_STATS },
  currentMonth: 1,
  currentPeriodIndex: 0,
  actionPoints: MAX_ACTION_POINTS,
  currentScene: 'apartment',
  currentCharacter: null,
  characterStats: Object.fromEntries(
    Object.entries(buildCharacters()).map(([id, c]) => [id, { ...c.initialStats }])
  ),
  unlockedScenes: ['apartment', 'tvstation'],
  currentChapter: 1,
  triggeredEvents: [],
  inventory: { diary: 1, octopus: 1 },
  messages: [],
  historySummary: '',
  isTyping: false,
  streamingContent: '',
  choices: [],
  endingType: null,
  activeTab: 'dialogue',
  showDashboard: false,
  showRecords: false,
  storyRecords: [],

  setPlayerInfo: (name: string) => {
    set((s) => { s.playerName = name })
  },

  initGame: () => {
    set((s) => {
      s.gameStarted = true
      s.messages.push({
        id: makeId(),
        role: 'system',
        content: `欢迎来到香港，${s.playerName}。你的港漂十年从这间红磡劏房开始。`,
        timestamp: Date.now(),
      })
    })
  },

  selectCharacter: (charId: string | null) => {
    set((s) => {
      s.currentCharacter = charId
      s.activeTab = 'dialogue'
    })
  },

  selectScene: (sceneId: string) => {
    const state = get()
    if (!state.unlockedScenes.includes(sceneId)) return
    if (state.currentScene === sceneId) return

    set((s) => {
      s.currentScene = sceneId
      s.activeTab = 'dialogue'
      s.messages.push({
        id: makeId(),
        role: 'system',
        content: `你来到了${SCENES[sceneId].name}。`,
        timestamp: Date.now(),
        type: 'scene-transition',
        sceneId,
      })
    })
  },

  setActiveTab: (tab) => {
    set((s) => { s.activeTab = tab })
  },

  toggleDashboard: () => {
    set((s) => {
      s.showDashboard = !s.showDashboard
      if (s.showDashboard) s.showRecords = false
    })
  },

  toggleRecords: () => {
    set((s) => {
      s.showRecords = !s.showRecords
      if (s.showRecords) s.showDashboard = false
    })
  },

  sendMessage: async (text: string) => {
    set((s) => {
      s.messages.push({
        id: makeId(), role: 'user', content: text, timestamp: Date.now(),
      })
      s.isTyping = true
      s.streamingContent = ''
      s.choices = []
    })

    try {
      const state = get()

      // History compression
      if (state.messages.length > 15 && !state.historySummary) {
        const summary = await chat([
          { role: 'system', content: '将以下对话压缩为200字以内的摘要，保留关键剧情、数值变化和人物关系发展：' },
          ...state.messages.slice(0, -5).map((m) => ({
            role: m.role, content: m.content,
          })),
        ])
        set((s) => { s.historySummary = summary })
      }

      const systemPrompt = buildSystemPrompt(get())
      const apiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...(get().historySummary
          ? [{ role: 'system' as const, content: `历史摘要: ${get().historySummary}` }]
          : []),
        ...get().messages.slice(-10).map((m) => ({
          role: m.role, content: m.content,
        })),
      ]

      let fullContent = ''
      await streamChat(
        apiMessages,
        (chunk) => {
          fullContent += chunk
          set((s) => { s.streamingContent = fullContent })
        },
        () => {},
      )

      // Extract dynamic choices from AI response
      const { cleanContent, choices } = extractChoices(fullContent)
      const contentForParse = cleanContent || fullContent

      // Dual-track parse
      const { charChanges, globalChanges } = parseStatChanges(contentForParse, get().characters)

      set((s) => {
        // Apply character stat changes
        for (const change of charChanges) {
          const stats = s.characterStats[change.charId]
          if (stats) {
            stats[change.stat] = Math.max(0, Math.min(100, (stats[change.stat] ?? 0) + change.delta))
          }
        }
        // Apply global stat changes
        for (const change of globalChanges) {
          s.globalStats[change.key] = Math.max(0, Math.min(100, (s.globalStats[change.key] ?? 0) + change.delta))
        }
      })

      // Chain reactions
      set((s) => {
        // Career ≥ 80 → unlock career benefits
        if (s.globalStats.career >= 80 && !s.triggeredEvents.includes('chain_career_elite')) {
          s.triggeredEvents.push('chain_career_elite')
          s.globalStats.network = Math.min(100, s.globalStats.network + 5)
        }
        // Emotional ≤ 30 → emotional crisis
        if (s.globalStats.emotional <= 30 && !s.triggeredEvents.includes('chain_emotional_crisis')) {
          s.triggeredEvents.push('chain_emotional_crisis')
          s.globalStats.career = Math.max(0, s.globalStats.career - 10)
        }
        // Cantonese ≥ 90 → social bonus
        if (s.globalStats.cantonese >= 90 && !s.triggeredEvents.includes('chain_cantonese_master')) {
          s.triggeredEvents.push('chain_cantonese_master')
          s.globalStats.network = Math.min(100, s.globalStats.network + 10)
        }
        // Finance < 5 → financial pressure
        if (s.globalStats.finance < 5 && !s.triggeredEvents.includes('chain_finance_crisis')) {
          s.triggeredEvents.push('chain_finance_crisis')
          s.globalStats.emotional = Math.max(0, s.globalStats.emotional - 15)
        }
      })

      // BE immediate check
      const postState = get()
      if (postState.globalStats.emotional <= 10) {
        set((s) => { s.endingType = 'be-collapse' })
      }

      // Push AI message (with choices stripped)
      set((s) => {
        s.messages.push({
          id: makeId(), role: 'assistant', content: contentForParse,
          character: s.currentCharacter ?? undefined,
          timestamp: Date.now(),
        })
        s.isTyping = false
        s.streamingContent = ''
        s.choices = choices
      })

      get().advanceTime()
      get().saveGame()

      const charName = get().currentCharacter
        ? get().characters[get().currentCharacter!]?.name
        : null
      get().addStoryRecord(charName ?? '日常', fullContent.slice(0, 40))

    } catch (err) {
      set((s) => { s.isTyping = false; s.streamingContent = '' })
      const msg = err instanceof Error ? err.message : String(err)
      get().addSystemMessage(`网络异常: ${msg.slice(0, 80)}`)
    }
  },

  advanceTime: () => {
    const prevMonth = get().currentMonth
    let monthChanged = false

    set((s) => {
      s.actionPoints -= 1
      s.currentPeriodIndex += 1

      if (s.currentPeriodIndex >= PERIODS.length) {
        s.currentPeriodIndex = 0
        s.currentMonth += 1
        s.actionPoints = MAX_ACTION_POINTS
        monthChanged = true

        // Natural decay/growth per month
        s.globalStats.emotional = Math.max(0, s.globalStats.emotional - 2) // HK pressure
        s.globalStats.cantonese = Math.min(100, s.globalStats.cantonese + 1) // immersion

        // Scene auto-unlock by month
        for (const [sceneId, scene] of Object.entries(SCENES)) {
          if (scene.unlockCondition?.month && s.currentMonth >= scene.unlockCondition.month) {
            if (!s.unlockedScenes.includes(sceneId)) {
              s.unlockedScenes.push(sceneId)
            }
          }
        }

        // Chapter progression
        const newChapter = getCurrentChapter(s.currentMonth)
        if (newChapter.id !== s.currentChapter) {
          s.currentChapter = newChapter.id
          s.storyRecords.push({
            id: `rec-ch-${newChapter.id}`,
            month: s.currentMonth,
            period: PERIODS[0].name,
            title: `进入「${newChapter.name}」`,
            content: newChapter.description,
          })
        }
      }
    })

    const state = get()

    if (monthChanged) {
      const chapter = getCurrentChapter(state.currentMonth)
      const { year, monthInYear } = getMonthYear(state.currentMonth)
      set((s) => {
        s.messages.push({
          id: makeId(),
          role: 'system',
          content: '',
          timestamp: Date.now(),
          type: 'month-change',
          monthInfo: {
            month: state.currentMonth,
            year,
            chapter: chapter.name,
          },
        })
      })
      get().addStoryRecord('月变', `进入第${state.currentMonth}月（第${year}年${monthInYear}月）`)
    } else {
      get().addSystemMessage(
        `${PERIODS[state.currentPeriodIndex].icon} 第${state.currentMonth}月 · ${PERIODS[state.currentPeriodIndex].name}`
      )
    }

    // Forced events
    const events = getDayEvents(state.currentMonth, state.triggeredEvents)
    for (const event of events) {
      if (event.triggerPeriod === undefined || event.triggerPeriod === state.currentPeriodIndex) {
        set((s) => {
          s.triggeredEvents.push(event.id)
          s.storyRecords.push({
            id: `rec-evt-${event.id}`,
            month: state.currentMonth,
            period: PERIODS[state.currentPeriodIndex].name,
            title: event.name,
            content: event.description,
          })
        })
        get().addSystemMessage(`【${event.name}】${event.description}`)
      }
    }

    // Time ending check
    if (prevMonth < MAX_MONTHS && state.currentMonth >= MAX_MONTHS) {
      get().checkEnding()
    }
  },

  useItem: (itemId: string) => {
    const state = get()
    if (!state.inventory[itemId] || state.inventory[itemId] <= 0) return

    set((s) => {
      if (ITEMS[itemId]?.maxCount) {
        s.inventory[itemId] = Math.max(0, (s.inventory[itemId] ?? 0) - 1)
      }
    })

    const item = ITEMS[itemId]
    if (item) {
      get().addSystemMessage(`使用了${item.icon} ${item.name}`)
    }
  },

  checkEnding: () => {
    const state = get()
    const gs = state.globalStats
    const cs = state.characterStats

    const setEnding = (id: string) => {
      set((s) => { s.endingType = id })
    }

    // BE
    if (gs.emotional <= 10) { setEnding('be-collapse'); return }
    if (gs.finance <= 5) { setEnding('be-bankrupt'); return }

    // SE (hidden - highest positive priority)
    const allHigh = gs.career >= 85 && gs.finance >= 85 && gs.network >= 85 &&
      gs.emotional >= 85 && gs.fashion >= 85 && gs.cantonese >= 85
    if (allHigh) { setEnding('se-perfect'); return }

    // TE
    if (gs.career >= 90 && (cs.chengzhifeng?.affection ?? 0) >= 80) { setEnding('te-power'); return }
    if (gs.network >= 85 && (cs.chenziqian?.affection ?? 0) >= 80) { setEnding('te-glory'); return }

    // HE
    const maxAffection = Math.max(
      cs.chenziqian?.affection ?? 0,
      cs.zhangyouning?.affection ?? 0,
      cs.lizhixuan?.affection ?? 0,
      cs.chengzhifeng?.affection ?? 0,
    )
    if (gs.career >= 80 && maxAffection >= 85 && gs.emotional >= 70) { setEnding('he-balance'); return }

    const allLowAffection = (cs.chenziqian?.affection ?? 0) < 60 &&
      (cs.zhangyouning?.affection ?? 0) < 60 &&
      (cs.lizhixuan?.affection ?? 0) < 60 &&
      (cs.chengzhifeng?.affection ?? 0) < 60
    if (gs.career >= 85 && gs.finance >= 80 && allLowAffection) { setEnding('he-queen'); return }

    // NE
    setEnding('ne-ordinary')
  },

  addSystemMessage: (content: string) => {
    set((s) => {
      s.messages.push({
        id: makeId(), role: 'system', content, timestamp: Date.now(),
      })
    })
  },

  addStoryRecord: (title: string, content: string) => {
    const state = get()
    set((s) => {
      s.storyRecords.push({
        id: makeId(),
        month: state.currentMonth,
        period: PERIODS[state.currentPeriodIndex]?.name ?? '',
        title,
        content,
      })
    })
  },

  resetGame: () => {
    set((s) => {
      s.gameStarted = false
      s.playerName = ''
      s.characters = buildCharacters()
      s.globalStats = { ...INITIAL_GLOBAL_STATS }
      s.currentMonth = 1
      s.currentPeriodIndex = 0
      s.actionPoints = MAX_ACTION_POINTS
      s.currentScene = 'apartment'
      s.currentCharacter = null
      s.characterStats = Object.fromEntries(
        Object.entries(buildCharacters()).map(([id, c]) => [id, { ...c.initialStats }])
      )
      s.unlockedScenes = ['apartment', 'tvstation']
      s.currentChapter = 1
      s.triggeredEvents = []
      s.inventory = { diary: 1, octopus: 1 }
      s.messages = []
      s.historySummary = ''
      s.isTyping = false
      s.streamingContent = ''
      s.endingType = null
      s.activeTab = 'dialogue'
      s.showDashboard = false
      s.showRecords = false
      s.storyRecords = []
    })
  },

  saveGame: () => {
    const s = get()
    const data = {
      version: 1,
      playerName: s.playerName,
      characters: s.characters,
      globalStats: s.globalStats,
      currentMonth: s.currentMonth,
      currentPeriodIndex: s.currentPeriodIndex,
      actionPoints: s.actionPoints,
      currentScene: s.currentScene,
      currentCharacter: s.currentCharacter,
      characterStats: s.characterStats,
      currentChapter: s.currentChapter,
      triggeredEvents: s.triggeredEvents,
      unlockedScenes: s.unlockedScenes,
      inventory: s.inventory,
      messages: s.messages.slice(-30),
      historySummary: s.historySummary,
      endingType: s.endingType,
      activeTab: s.activeTab,
      storyRecords: s.storyRecords.slice(-50),
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  },

  loadGame: () => {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return
    try {
      const data = JSON.parse(raw)
      if (data.version !== 1) return
      set((s) => {
        s.gameStarted = true
        s.playerName = data.playerName
        s.characters = data.characters ?? buildCharacters()
        s.globalStats = data.globalStats ?? { ...INITIAL_GLOBAL_STATS }
        s.currentMonth = data.currentMonth
        s.currentPeriodIndex = data.currentPeriodIndex
        s.actionPoints = data.actionPoints
        s.currentScene = data.currentScene
        s.currentCharacter = data.currentCharacter
        s.characterStats = data.characterStats
        s.currentChapter = data.currentChapter
        s.triggeredEvents = data.triggeredEvents
        s.unlockedScenes = data.unlockedScenes
        s.inventory = data.inventory ?? {}
        s.messages = data.messages ?? []
        s.historySummary = data.historySummary ?? ''
        s.endingType = data.endingType
        s.activeTab = data.activeTab ?? 'dialogue'
        s.storyRecords = data.storyRecords ?? []
      })
    } catch { /* corrupted save */ }
  },

  hasSave: () => !!localStorage.getItem(SAVE_KEY),

  clearSave: () => { localStorage.removeItem(SAVE_KEY) },
})))

// ── Re-export data.ts ──

export {
  SCENES, ITEMS, PERIODS, CHAPTERS,
  MAX_MONTHS, MAX_ACTION_POINTS,
  STORY_INFO, FORCED_EVENTS, ENDINGS,
  QUICK_ACTIONS, GLOBAL_STAT_METAS, INITIAL_GLOBAL_STATS,
  buildCharacters, getCurrentChapter, getMonthYear,
  getStatLevel, getAvailableCharacters, getDayEvents,
} from './data'

export type {
  Character, CharacterStats, Scene, GameItem, Chapter,
  ForcedEvent, Ending, TimePeriod, Message, StatMeta, StoryRecord,
} from './data'
