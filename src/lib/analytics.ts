/**
 * [INPUT]: None
 * [OUTPUT]: Umami analytics tracking functions
 * [POS]: lib 埋点层，被 store.ts 和 App.tsx 调用
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

const PREFIX = 'hk_'

function track(event: string, data?: Record<string, string | number>) {
  try {
    if (typeof window !== 'undefined' && 'umami' in window) {
      (window as Record<string, unknown>).umami &&
        ((window as Record<string, unknown>).umami as { track: (e: string, d?: Record<string, string | number>) => void })
          .track(`${PREFIX}${event}`, data)
    }
  } catch {
    // silently ignore
  }
}

export function trackGameStart() { track('game_start') }
export function trackPlayerCreate(name: string) { track('player_create', { name }) }
export function trackGameContinue() { track('game_continue') }
export function trackTimeAdvance(month: number) { track('time_advance', { month }) }
export function trackChapterEnter(chapter: number) { track('chapter_enter', { chapter }) }
export function trackEndingReached(ending: string) { track('ending_reached', { ending }) }
export function trackEmotionalCrisis() { track('emotional_crisis') }
export function trackSceneUnlock(scene: string) { track('scene_unlock', { scene }) }
