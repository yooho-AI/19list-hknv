/**
 * [INPUT]: None (no external dependencies)
 * [OUTPUT]: All type definitions + constants + characters/scenes/items/chapters/events/endings + utility functions
 * [POS]: lib UI thin layer, consumed by store.ts and all components. Narrative content lives in script.md
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

// ── Types ──

export interface TimePeriod {
  index: number
  name: string
  icon: string
  hours: string
}

export interface StatMeta {
  key: string
  label: string
  color: string
  icon: string
  category: 'relation' | 'status' | 'skill'
  autoIncrement?: number
  decayRate?: number
}

export type CharacterStats = Record<string, number>

export interface Character {
  id: string
  name: string
  portrait: string
  gender: 'female' | 'male'
  age: number
  title: string
  description: string
  personality: string
  speakingStyle: string
  secret: string
  triggerPoints: string[]
  behaviorPatterns: string
  themeColor: string
  joinMonth: number
  statMetas: StatMeta[]
  initialStats: CharacterStats
}

export interface Scene {
  id: string
  name: string
  icon: string
  description: string
  background: string
  atmosphere: string
  tags: string[]
  unlockCondition?: {
    event?: string
    month?: number
  }
}

export interface GameItem {
  id: string
  name: string
  icon: string
  type: 'lifestyle' | 'career' | 'personal' | 'social'
  description: string
  maxCount?: number
}

export interface Chapter {
  id: number
  name: string
  monthRange: [number, number]
  description: string
  objectives: string[]
  atmosphere: string
}

export interface ForcedEvent {
  id: string
  name: string
  triggerMonth: number
  triggerPeriod?: number
  description: string
}

export interface Ending {
  id: string
  name: string
  type: 'TE' | 'HE' | 'NE' | 'BE' | 'SE'
  description: string
  condition: string
}

export interface StoryRecord {
  id: string
  month: number
  period: string
  title: string
  content: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  character?: string
  timestamp: number
  type?: 'scene-transition' | 'month-change'
  sceneId?: string
  monthInfo?: { month: number; year: number; chapter: string }
}

// ── Constants ──

export const PERIODS: TimePeriod[] = [
  { index: 0, name: '月初', icon: '🌅', hours: '规划期' },
  { index: 1, name: '月中', icon: '⚡', hours: '行动期' },
  { index: 2, name: '月末', icon: '🌙', hours: '结算期' },
]

export const MAX_MONTHS = 120
export const MAX_ACTION_POINTS = 3

// ── Global Stat Metas ──

export const GLOBAL_STAT_METAS: StatMeta[] = [
  { key: 'career', label: '职业能力', color: '#3b82f6', icon: '💼', category: 'skill' },
  { key: 'finance', label: '经济状况', color: '#f59e0b', icon: '💰', category: 'status' },
  { key: 'network', label: '社交人脉', color: '#8b5cf6', icon: '🤝', category: 'skill' },
  { key: 'emotional', label: '情感健康', color: '#ec4899', icon: '💗', category: 'status', decayRate: 2 },
  { key: 'fashion', label: '时尚品味', color: '#f97316', icon: '👗', category: 'skill' },
  { key: 'cantonese', label: '粤语能力', color: '#10b981', icon: '🗣️', category: 'skill', autoIncrement: 1 },
]

export const INITIAL_GLOBAL_STATS: CharacterStats = {
  career: 45,
  finance: 20,
  network: 25,
  emotional: 60,
  fashion: 30,
  cantonese: 35,
}

// ── Characters ──

const CHEN_ZIQIAN: Character = {
  id: 'chenziqian',
  name: '陈子谦',
  portrait: '/characters/chenziqian.jpg?v=2',
  gender: 'male',
  age: 30,
  title: '富三代继承人',
  description: '家族企业继承人，绅士外表下渴望自由',
  personality: '优雅克制，暗藏叛逆',
  speakingStyle: '中英混杂，平稳优雅，善用反问',
  secret: '秘密资助独立纪录片项目',
  triggerPoints: ['好感≥30私人聚会', '好感≥50借钱考验', '好感≥70工作室秘密'],
  behaviorPatterns: '用物质表达关心，在家族场合变得僵硬',
  themeColor: '#C9A96E',
  joinMonth: 3,
  statMetas: [
    { key: 'affection', label: '好感', color: '#C9A96E', icon: '💛', category: 'relation' },
  ],
  initialStats: { affection: 0 },
}

const ZHANG_YOUNING: Character = {
  id: 'zhangyouning',
  name: '张佑宁',
  portrait: '/characters/zhangyouning.jpg?v=2',
  gender: 'male',
  age: 25,
  title: '新生代偶像',
  description: '迅速蹿红的偶像，阳光背后承受巨大压力',
  personality: '活泼外向，内心脆弱',
  speakingStyle: '网络流行语，语速快，口头禅"算啦"',
  secret: '轻度抑郁症，秘密服药',
  triggerPoints: ['好感≥25深夜大排档', '好感≥45粉丝骚扰', '好感≥65经纪人警告'],
  behaviorPatterns: '公开场合自动切换偶像人设',
  themeColor: '#FF6B9D',
  joinMonth: 1,
  statMetas: [
    { key: 'affection', label: '好感', color: '#FF6B9D', icon: '💗', category: 'relation' },
  ],
  initialStats: { affection: 0 },
}

const LI_ZHIXUAN: Character = {
  id: 'lizhixuan',
  name: '李志轩',
  portrait: '/characters/lizhixuan.jpg?v=2',
  gender: 'male',
  age: 32,
  title: '大学副教授',
  description: '最年轻的副教授，理性儒雅',
  personality: '理性冷静，渴望被理解',
  speakingStyle: '措辞精准，偶尔引用学术观点，含蓄表达',
  secret: '少年时初恋失控的创伤',
  triggerPoints: ['好感≥20学术咖啡', '好感≥45论文合作', '好感≥65求婚'],
  behaviorPatterns: '用逻辑分析感情，受触动时突然沉默',
  themeColor: '#6B8DD6',
  joinMonth: 1,
  statMetas: [
    { key: 'affection', label: '好感', color: '#6B8DD6', icon: '💙', category: 'relation' },
  ],
  initialStats: { affection: 10 },
}

const CHENG_ZHIFENG: Character = {
  id: 'chengzhifeng',
  name: '程志峰',
  portrait: '/characters/chengzhifeng.jpg?v=2',
  gender: 'male',
  age: 35,
  title: '电视台副台长',
  description: '王牌副台长，严格惜才的职场导师',
  personality: '铁面高效，内心孤独',
  speakingStyle: '简洁有力，粤语TVB语感，"嗱你听住"',
  secret: '年轻时为事业放弃初恋',
  triggerPoints: ['好感≥25深夜加班', '好感≥50核心项目', '好感≥70前妻出现'],
  behaviorPatterns: '公司严格上司，私下偶露疲惫',
  themeColor: '#4A5568',
  joinMonth: 1,
  statMetas: [
    { key: 'affection', label: '好感', color: '#4A5568', icon: '🖤', category: 'relation' },
  ],
  initialStats: { affection: 15 },
}

export function buildCharacters(): Record<string, Character> {
  return {
    chenziqian: CHEN_ZIQIAN,
    zhangyouning: ZHANG_YOUNING,
    lizhixuan: LI_ZHIXUAN,
    chengzhifeng: CHENG_ZHIFENG,
  }
}

// ── Scenes ──

export const SCENES: Record<string, Scene> = {
  apartment: {
    id: 'apartment',
    name: '红磡劏房',
    icon: '🏠',
    description: '100呎的起点，窗缝里能看到一小片维港',
    background: '/scenes/apartment.jpg?v=2',
    atmosphere: '狭小但温暖的港漂起点',
    tags: ['住所', '私密', '日常'],
  },
  tvstation: {
    id: 'tvstation',
    name: '电视台',
    icon: '📺',
    description: '开放式办公区，新闻编辑室大屏永远滚动',
    background: '/scenes/tvstation.jpg?v=2',
    atmosphere: '高压竞争的职场战场',
    tags: ['工作', '竞争', '机遇'],
  },
  central: {
    id: 'central',
    name: '中环CBD',
    icon: '🏙️',
    description: '玻璃幕墙大厦如森林，兰桂坊霓虹闪烁',
    background: '/scenes/central.jpg?v=2',
    atmosphere: '权力与金钱汇聚的心脏',
    tags: ['商务', '社交', '奢华'],
    unlockCondition: { month: 3 },
  },
  causewaybay: {
    id: 'causewaybay',
    name: '铜锣湾',
    icon: '🛍️',
    description: 'SOGO十字路口人潮涌动，小巷藏着老字号',
    background: '/scenes/causewaybay.jpg?v=2',
    atmosphere: '最生活化的购物区，文化课堂',
    tags: ['购物', '美食', '休闲'],
    unlockCondition: { month: 6 },
  },
  westkowloon: {
    id: 'westkowloon',
    name: '西九龙文化区',
    icon: '🎨',
    description: 'M+博物馆映照维港，海滨长廊延伸开去',
    background: '/scenes/westkowloon.jpg?v=2',
    atmosphere: '灵感与治愈的文化新地标',
    tags: ['文化', '减压', '约会'],
    unlockCondition: { month: 30 },
  },
  campus: {
    id: 'campus',
    name: '大学校园',
    icon: '🎓',
    description: '港大红砖老藤，最纯粹的青春记忆',
    background: '/scenes/campus.jpg?v=2',
    atmosphere: '知识的纯粹与青春的回响',
    tags: ['学术', '回忆', '宁静'],
    unlockCondition: { month: 12 },
  },
  peak: {
    id: 'peak',
    name: '太平山顶',
    icon: '⛰️',
    description: '维港两岸天际线尽收眼底，百万夜景',
    background: '/scenes/peak.jpg?v=2',
    atmosphere: '香港的制高点，俯瞰十年人生',
    tags: ['高端', '浪漫', '决定'],
    unlockCondition: { month: 54 },
  },
}

// ── Items ──

export const ITEMS: Record<string, GameItem> = {
  milktea: {
    id: 'milktea',
    name: '丝袜奶茶',
    icon: '🍵',
    type: 'lifestyle',
    description: '港式丝袜奶茶，浓郁如琥珀',
  },
  handbag: {
    id: 'handbag',
    name: '名牌手袋',
    icon: '👜',
    type: 'social',
    description: '中环社交的隐形通行证',
  },
  hikegear: {
    id: 'hikegear',
    name: '行山装备',
    icon: '🥾',
    type: 'lifestyle',
    description: '登山鞋背包遮阳帽，减压三件套',
  },
  suit: {
    id: 'suit',
    name: '高级套装',
    icon: '👔',
    type: 'career',
    description: '剪裁精良的职业装，衬里有亮色线',
  },
  diary: {
    id: 'diary',
    name: '旧日记本',
    icon: '📔',
    type: 'personal',
    description: '记录港漂心路历程的老朋友',
  },
  octopus: {
    id: 'octopus',
    name: '八达通',
    icon: '💳',
    type: 'lifestyle',
    description: '"嘟"一声，就是香港人的日常',
  },
}

// ── Chapters ──

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    name: '初来乍到',
    monthRange: [1, 24],
    description: '语言关、职场适应、经济压力',
    objectives: ['通过转正考核', '粤语能力达到50', '存款突破10万'],
    atmosphere: '忐忑与期待并存的新人期',
  },
  {
    id: 2,
    name: '站稳脚跟',
    monthRange: [25, 48],
    description: '职业方向选择、感情深化、社交圈突破',
    objectives: ['晋升部门主管', '突破本地专业圈', '确定感情方向'],
    atmosphere: '渐入佳境但暗流涌动',
  },
  {
    id: 3,
    name: '风云际会',
    monthRange: [49, 72],
    description: '事业巅峰期选择、行业变革、深层身份认同',
    objectives: ['完成重大项目', '申请永久居民', '经济状况突破60'],
    atmosphere: '机遇与危机并存的关键期',
  },
  {
    id: 4,
    name: '蜕变重生',
    monthRange: [73, 96],
    description: '中年危机前兆、关系定型、价值观确立',
    objectives: ['找到事业第二曲线', '确定人生方向', '情感健康保持稳定'],
    atmosphere: '沉淀与抉择的成熟期',
  },
  {
    id: 5,
    name: '图鉴完成',
    monthRange: [97, 120],
    description: '收官、传承、定义属于自己的成功',
    objectives: ['完成十年图鉴', '达成理想结局'],
    atmosphere: '回顾十年，展望未来',
  },
]

// ── Forced Events ──

export const FORCED_EVENTS: ForcedEvent[] = [
  {
    id: 'party_encounter',
    name: '酒会初遇',
    triggerMonth: 3,
    triggerPeriod: 1,
    description: '电视台周年酒会，你不小心将红酒洒在陈子谦的Armani西装上',
  },
  {
    id: 'probation_exam',
    name: '转正考核',
    triggerMonth: 6,
    triggerPeriod: 1,
    description: '你与本地实习生Amy竞争唯一的转正名额',
  },
  {
    id: 'key_choice',
    name: '关键抉择',
    triggerMonth: 24,
    triggerPeriod: 0,
    description: '李志轩求婚+海外博士机会 vs 程志峰升职+重大项目',
  },
  {
    id: 'department_battle',
    name: '部门主管之争',
    triggerMonth: 36,
    triggerPeriod: 1,
    description: '你与空降的精英海归Marcus竞争部门主管',
  },
  {
    id: 'decade_review',
    name: '十年回顾',
    triggerMonth: 120,
    triggerPeriod: 2,
    description: '十年到了，是时候回顾你的香港图鉴',
  },
]

// ── Endings ──

export const ENDINGS: Ending[] = [
  {
    id: 'be-collapse',
    name: '精神崩溃',
    type: 'BE',
    description: '你在深夜的维港边痛哭，决定放弃一切回到内地。十年图鉴只留下半本空白。',
    condition: '情感健康≤10',
  },
  {
    id: 'be-bankrupt',
    name: '经济破产',
    type: 'BE',
    description: '信用破产，被迫离港。你拖着当初那只行李箱，在罗湖口岸回望最后一眼。',
    condition: '经济状况连续6个月为负',
  },
  {
    id: 'te-power',
    name: '权力之巅',
    type: 'TE',
    description: '你成为最年轻的频道总监，但代价是失去了所有私人生活。',
    condition: '职业能力≥90且程志峰好感≥80',
  },
  {
    id: 'te-glory',
    name: '名利双收',
    type: 'TE',
    description: '你嫁入豪门，名利兼得，但内心始终有一个声音在问：这是你想要的吗？',
    condition: '社交人脉≥85且陈子谦好感≥80',
  },
  {
    id: 'he-balance',
    name: '事业爱情双丰收',
    type: 'HE',
    description: '你在事业和爱情中都找到了属于自己的位置。中环写字楼的黄昏，你望着天际线微笑。',
    condition: '职业能力≥80且任一男主好感≥85且情感健康≥70',
  },
  {
    id: 'he-queen',
    name: '独立女王',
    type: 'HE',
    description: '"我自己就是豪门。"你在太平山顶独自庆祝，敬这座教会你成长的城市。',
    condition: '职业能力≥85且经济状况≥80且所有男主好感<60',
  },
  {
    id: 'se-perfect',
    name: '完满图鉴',
    type: 'SE',
    description: '你终于可以坦然地说："我系香港人。"你的图鉴，是一本关于成长与勇气的教科书。',
    condition: '所有六项属性≥85且帮助过3位NPC',
  },
  {
    id: 'ne-ordinary',
    name: '平凡十年',
    type: 'NE',
    description: '十年过去，你依然在这座城市里生活着。不算成功也不算失败，平凡但也是一种人生。',
    condition: '未满足以上条件',
  },
]

// ── Story Info ──

export const STORY_INFO = {
  title: '香港女子图鉴',
  subtitle: '港漂十年',
  description: '从港漂到香港人，你的十年图鉴由你亲手绘制',
  objective: '在十年内找到属于自己的成功与幸福',
  era: '2010年代香港',
}

export const QUICK_ACTIONS: string[] = [
  '💼 拼搏',
  '🤝 社交',
  '💕 恋爱',
  '🧘 充电',
]

// ── Utility Functions ──

export function getStatLevel(value: number) {
  if (value >= 80) return { level: 4, name: '卓越', color: '#E8A87C' }
  if (value >= 60) return { level: 3, name: '优秀', color: '#3b82f6' }
  if (value >= 30) return { level: 2, name: '一般', color: '#94a3b8' }
  return { level: 1, name: '困难', color: '#dc2626' }
}

export function getAvailableCharacters(
  month: number,
  characters: Record<string, Character>
): Record<string, Character> {
  return Object.fromEntries(
    Object.entries(characters).filter(([, char]) => char.joinMonth <= month)
  )
}

export function getCurrentChapter(month: number): Chapter {
  return CHAPTERS.find((ch) => month >= ch.monthRange[0] && month <= ch.monthRange[1])
    ?? CHAPTERS[0]
}

export function getDayEvents(
  month: number,
  triggeredEvents: string[]
): ForcedEvent[] {
  return FORCED_EVENTS.filter(
    (e) => e.triggerMonth === month && !triggeredEvents.includes(e.id)
  )
}

export function getMonthYear(month: number): { year: number; monthInYear: number } {
  const year = Math.ceil(month / 12)
  const monthInYear = ((month - 1) % 12) + 1
  return { year, monthInYear }
}
