/**
 * [INPUT]: store.ts (messages/isTyping/streamingContent/sendMessage/inventory/useItem/choices), parser.ts
 * [OUTPUT]: TabDialogue — chat area + rich message routing + dynamic choices + input + backpack
 * [POS]: 对话 Tab，Markdown渲染NPC全宽气泡 + 场景卡 + 月变卡 + AI动态选项 + 道具栏 + 输入框
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, ITEMS, SCENES, STORY_INFO } from '../../lib/store'
import type { Message } from '../../lib/store'
import { parseStoryParagraph } from '../../lib/parser'
import { Backpack, PaperPlaneRight, Gift, GameController, CaretUp, CaretDown } from '@phosphor-icons/react'

const P = 'hk'

// ── LetterCard ────────────────────────────────────────

function LetterCard() {
  return (
    <div className={`${P}-letter-card`}>
      <div className={`${P}-letter-card-title`}>{STORY_INFO.title}</div>
      <p>{STORY_INFO.description}</p>
      <div style={{
        marginTop: 16, padding: '14px 16px',
        background: 'rgba(232,168,124,0.06)', borderRadius: 12,
        textAlign: 'left', lineHeight: 1.8,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>怎么玩</div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
          输入文字或点击选项推进剧情<br />
          在「场景」Tab切换地点，探索香港<br />
          在「人物」Tab查看角色关系和属性变化<br />
          经营六项属性，在十年中找到你的人生方向<br />
          注意情感健康——香港速度压力不小
        </p>
      </div>
      <p style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
        {STORY_INFO.era} · 共120月 · 8种结局
      </p>
    </div>
  )
}

// ── SceneTransitionCard ───────────────────────────────

function SceneTransitionCard({ msg }: { msg: Message }) {
  const scene = msg.sceneId ? SCENES[msg.sceneId] : null
  if (!scene) return null

  return (
    <motion.div
      className={`${P}-scene-card`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className={`${P}-scene-card-bg`}>
        <motion.img
          src={scene.background} alt={scene.name}
          animate={{ scale: [1, 1.05] }}
          transition={{ duration: 8, ease: 'linear' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className={`${P}-scene-card-mask`} />
      </div>
      <div className={`${P}-scene-card-content`}>
        <span className={`${P}-scene-card-badge`}>{scene.icon} 场景切换</span>
        <div className={`${P}-scene-card-name`}>{scene.name}</div>
        <div className={`${P}-scene-card-desc`}>{scene.atmosphere}</div>
      </div>
    </motion.div>
  )
}

// ── MonthChangeCard ───────────────────────────────────

function MonthChangeCard({ msg }: { msg: Message }) {
  if (!msg.monthInfo) return null

  const label = `第${msg.monthInfo.month}月`

  return (
    <motion.div
      className={`${P}-month-card`}
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 200 }}
    >
      <div className={`${P}-month-card-accent`} />
      <div className={`${P}-month-card-body`}>
        <div className={`${P}-month-card-year`}>第{msg.monthInfo.year}年</div>
        <div className={`${P}-month-card-number`}>
          {label.split('').map((ch, i) => (
            <span
              key={i}
              className={`${P}-month-type-char`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >{ch}</span>
          ))}
        </div>
        <div className={`${P}-month-card-chapter`}>
          {msg.monthInfo.chapter}
        </div>
      </div>
    </motion.div>
  )
}

// ── MessageBubble ─────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const { characters } = useGameStore()

  // Rich message routing
  if (msg.type === 'scene-transition') return <SceneTransitionCard msg={msg} />
  if (msg.type === 'month-change') return <MonthChangeCard msg={msg} />

  if (msg.role === 'system') {
    return (
      <motion.div
        className={`${P}-bubble-system`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {msg.content}
      </motion.div>
    )
  }

  if (msg.role === 'user') {
    return (
      <motion.div
        className={`${P}-bubble-player`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {msg.content}
      </motion.div>
    )
  }

  // assistant — NPC avatar row + full-width markdown bubble
  const { narrative, statHtml, charColor } = parseStoryParagraph(msg.content)
  const char = msg.character ? characters[msg.character] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`${P}-avatar-row`}>
        {char && (
          <img
            className={`${P}-npc-avatar`}
            src={char.portrait}
            alt={char.name}
            loading="lazy"
            style={{ borderColor: char.themeColor }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
        {char && (
          <span className={`${P}-npc-name`} style={{ color: char.themeColor }}>{char.name}</span>
        )}
      </div>
      <div
        className={`${P}-bubble-npc`}
        style={charColor ? { borderLeftColor: charColor } : undefined}
      >
        <div dangerouslySetInnerHTML={{ __html: narrative }} />
        {statHtml && <div dangerouslySetInnerHTML={{ __html: statHtml }} />}
      </div>
    </motion.div>
  )
}

// ── StreamingBubble ───────────────────────────────────

function StreamingBubble({ content }: { content: string }) {
  const { narrative, statHtml, charColor } = parseStoryParagraph(content)
  return (
    <div className={`${P}-bubble-npc`} style={charColor ? { borderLeftColor: charColor } : undefined}>
      <div dangerouslySetInnerHTML={{ __html: narrative }} />
      {statHtml && <div dangerouslySetInnerHTML={{ __html: statHtml }} />}
    </div>
  )
}

// ── TypingIndicator ───────────────────────────────────

function TypingIndicator() {
  return (
    <div className={`${P}-typing`}>
      <div className={`${P}-typing-dot`} />
      <div className={`${P}-typing-dot`} />
      <div className={`${P}-typing-dot`} />
    </div>
  )
}

// ── InventorySheet ────────────────────────────────────

function InventorySheet({ onClose }: { onClose: () => void }) {
  const { inventory, useItem } = useGameStore()
  const items = Object.entries(inventory).filter(([, count]) => count > 0)

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
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: '16px 16px 0 0', maxHeight: '60vh', overflowY: 'auto' }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)', textAlign: 'center', marginBottom: 16 }}>
          <Gift size={16} weight="fill" style={{ verticalAlign: -2, marginRight: 6 }} />
          背包
        </h3>
        {items.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 20 }}>
            背包里空空如也
          </div>
        )}
        {items.map(([id]) => {
          const item = ITEMS[id]
          if (!item) return null
          return (
            <div
              key={id}
              className={`${P}-bag-item`}
              onClick={() => { useItem(id); onClose() }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.description}</div>
              </div>
            </div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}

// ── TabDialogue ───────────────────────────────────────

export function TabDialogue() {
  const {
    messages, isTyping, streamingContent,
    sendMessage, inventory, choices,
  } = useGameStore()
  const [input, setInput] = useState('')
  const [showInventory, setShowInventory] = useState(false)
  const [choicesOpen, setChoicesOpen] = useState(false)
  const prevChoicesRef = useRef<string[]>([])
  const chatRef = useRef<HTMLDivElement>(null)

  const totalItems = Object.values(inventory).reduce((sum, n) => sum + n, 0)

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, streamingContent, choices])

  // Auto-collapse when choices change (new AI response)
  useEffect(() => {
    const prev = prevChoicesRef.current
    if (choices.length > 0 && (choices.length !== prev.length || choices[0] !== prev[0])) {
      setChoicesOpen(false)
    }
    prevChoicesRef.current = choices
  }, [choices])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isTyping) return
    setInput('')
    sendMessage(text)
  }, [input, isTyping, sendMessage])

  const handleChoice = useCallback((action: string) => {
    if (isTyping) return
    setChoicesOpen(false)
    sendMessage(action)
  }, [isTyping, sendMessage])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat Area */}
      <div ref={chatRef} className={`${P}-chat-area ${P}-scrollbar`}>
        {messages.length === 0 && <LetterCard />}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {isTyping && streamingContent && <StreamingBubble content={streamingContent} />}
        {isTyping && !streamingContent && <TypingIndicator />}
      </div>

      {/* Collapsible Choices Panel */}
      {choices.length > 0 && (
        <div className={`${P}-choice-wrap`}>
          <AnimatePresence mode="wait">
            {!choicesOpen ? (
              <motion.button
                key="collapsed"
                className={`${P}-choice-toggle`}
                onClick={() => setChoicesOpen(true)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                disabled={isTyping}
              >
                <GameController size={16} weight="fill" />
                <span>展开行动选项</span>
                <span className={`${P}-choice-toggle-badge`}>{choices.length}</span>
                <CaretUp size={14} />
              </motion.button>
            ) : (
              <motion.div
                key="expanded"
                className={`${P}-choice-panel`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                <button
                  className={`${P}-choice-panel-header`}
                  onClick={() => setChoicesOpen(false)}
                >
                  <span>选择行动</span>
                  <span className={`${P}-choice-panel-count`}>{choices.length}项</span>
                  <CaretDown size={14} />
                </button>
                <div className={`${P}-choice-list`}>
                  {choices.map((action, idx) => (
                    <motion.button
                      key={`${action}-${idx}`}
                      className={`${P}-choice-btn`}
                      onClick={() => handleChoice(action)}
                      disabled={isTyping}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <span className={`${P}-choice-idx`}>{String.fromCharCode(65 + idx)}</span>
                      {action}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Input Area */}
      <div className={`${P}-input-area`}>
        <button
          className={`${P}-icon-btn`}
          onClick={() => setShowInventory(true)}
          style={{ position: 'relative' }}
        >
          <Backpack size={20} />
          {totalItems > 0 && (
            <span style={{
              position: 'absolute', top: 0, right: 0,
              background: 'var(--primary)', color: 'var(--bg-primary)',
              fontSize: 10, fontWeight: 700, borderRadius: '50%',
              width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {totalItems}
            </span>
          )}
        </button>
        <input
          type="text"
          className={`${P}-input`}
          placeholder="输入你的行动..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isTyping}
        />
        <button
          className={`${P}-send-btn`}
          onClick={handleSend}
          disabled={isTyping || !input.trim()}
        >
          <PaperPlaneRight size={18} weight="fill" />
        </button>
      </div>

      {/* Inventory Sheet */}
      <AnimatePresence>
        {showInventory && <InventorySheet onClose={() => setShowInventory(false)} />}
      </AnimatePresence>
    </div>
  )
}
