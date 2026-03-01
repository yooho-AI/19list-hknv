# 香港女子图鉴 · 港漂十年 — AI 驱动交互式叙事游戏

React 19 + Zustand 5 + Immer + Vite 7 + Tailwind CSS v4 + Framer Motion + Cloudflare Pages

## 架构

```
19list-hknv/
├── worker/index.js              - ☆ CF Worker API 代理（备用，未部署）
├── public/
│   ├── audio/bgm.mp3            - 背景音乐
│   ├── characters/              - 4 角色立绘 9:16 竖版 (1440x2560)
│   └── scenes/                  - 7 场景背景 9:16 竖版 (1440x2560)
├── src/
│   ├── main.tsx                 - ☆ React 入口
│   ├── vite-env.d.ts            - Vite 类型声明
│   ├── App.tsx                  - 根组件: 港式电影片头(城市剪影+金字打字机→姓名输入) + GameScreen + EndingModal + MenuOverlay
│   ├── lib/
│   │   ├── script.md            - ★ 剧本直通：五模块原文（零转换注入 prompt）
│   │   ├── data.ts              - ★ UI 薄层：类型(含富消息扩展) + 4角色 + 7场景 + 6道具 + 5章节 + 5事件 + 8结局
│   │   ├── store.ts             - ★ 状态中枢：Zustand + 富消息插入(场景/换月) + 抽屉状态 + StoryRecord + 双轨解析
│   │   ├── parser.ts            - AI 回复解析（角色名着色 + 数值着色）
│   │   ├── analytics.ts         - Umami 埋点（hk_ 前缀）
│   │   ├── stream.ts            - ☆ SSE 流式通信
│   │   ├── bgm.ts               - ☆ 背景音乐
│   │   └── hooks.ts             - ☆ useMediaQuery / useIsMobile
│   ├── styles/
│   │   ├── globals.css          - 全局基础样式（hk- 前缀）
│   │   ├── opening.css          - 开场样式：港式电影片头 + 城市剪影 + 金字打字机
│   │   └── rich-cards.css       - 富UI组件：场景卡 + 月变卡 + NPC气泡 + 抽屉 + 档案 + 关系图 + Toast
│   └── components/game/
│       ├── app-shell.tsx        - 居中壳 + Header + Tab路由 + TabBar + 三向手势 + DashboardDrawer + RecordSheet
│       ├── dashboard-drawer.tsx - 港漂手帐(左抽屉)：扉页+缘分速览+能力值+场景网格+目标+财务。Reorder拖拽排序
│       ├── tab-dialogue.tsx     - 对话 Tab：富消息路由(SceneCard/MonthCard/NPC头像气泡) + 快捷操作 + 背包
│       ├── tab-scene.tsx        - 场景 Tab：9:16大图 + 人物标签 + 地点列表
│       └── tab-character.tsx    - 人物 Tab：立绘 + 属性 + SVG关系图 + 角色网格 + 全屏档案
├── index.html
├── package.json
├── vite.config.ts               - ☆
├── tsconfig*.json               - ☆
└── wrangler.toml                - ☆
```

★ = 种子文件 ☆ = 零修改模板

## 核心设计

- **港漂十年叙事**：4 男主攻略线 + 独身奋斗线，120个月（10年×12月）
- **双轨数值**：6 全局属性（职业/经济/社交/情感/时尚/粤语）+ NPC 好感度
- **暗调港风**：深灰底(#1a1a2e)+奶茶暖金(#E8A87C)+霓虹粉(#FF6B9D)，hk- CSS 前缀
- **3 时段制**：每月 3 时段（月初/月中/月末），共 360 时间槽
- **剧本直通**：script.md 存五模块原文，?raw import 注入 prompt
- **8 结局**：BE×2 + TE×2 + HE×2 + SE×1 + NE×1，优先级 BE→SE→TE→HE→NE

## 富UI组件系统

| 组件 | 位置 | 触发 | 视觉风格 |
|------|------|------|----------|
| StartScreen | App.tsx | 开场 | 港式电影片头：城市天际线SVG+霓虹灯点+金字打字机+姓名输入 |
| DashboardDrawer | dashboard-drawer | Header📓+右滑手势 | 毛玻璃+奶茶金：扉页+缘分速览(4男主好感)+能力值条+场景缩略图+目标清单+财务速览+Reorder拖拽 |
| RecordSheet | app-shell | Header📜+左滑手势 | 右侧滑入事件记录：时间线倒序+金色圆点 |
| SceneTransitionCard | tab-dialogue | selectScene | 场景背景+Ken Burns(8s)+渐变遮罩+金色角标 |
| MonthChangeCard | tab-dialogue | 换月 | 霓虹渐变顶条+逐字打字机(80ms)+年月显示+章节名 |
| RelationGraph | tab-character | 始终可见 | SVG环形布局，中心"我"+4NPC节点+连线+关系标签 |
| CharacterDossier | tab-character | 点击角色 | 全屏右滑入+50vh立绘呼吸动画+好感阶段+触发暗示 |
| Toast | app-shell | saveGame | TabBar上方弹出"已保存"2s消失 |

## 三向手势导航

- **右滑**（任意主Tab内容区）→ 左侧港漂手帐
- **左滑**（任意主Tab内容区）→ 右侧事件记录
- Header 按钮（📓/📜）同等触发
- 手帐内组件支持拖拽排序（Reorder + localStorage `hk-dash-order` 持久化）

## Store 状态扩展

- `showDashboard: boolean` — 左抽屉开关
- `showRecords: boolean` — 右抽屉开关
- `storyRecords: StoryRecord[]` — 事件记录（sendMessage 和 advanceTime 自动追加）
- `selectCharacter` 末尾自动跳转 dialogue Tab
- `globalStats` — 6项全局属性（独立于 characterStats）

## 富消息机制

Message 类型扩展 `type` 字段路由渲染：
- `scene-transition` → SceneTransitionCard（selectScene 触发）
- `month-change` → MonthChangeCard（advanceTime 换月时触发）
- NPC 消息带 `character` 字段 → 28px 圆形立绘头像

## Analytics 集成

- `trackGameStart` / `trackPlayerCreate` → App.tsx 开场
- `trackGameContinue` → App.tsx 继续游戏
- `trackTimeAdvance` / `trackChapterEnter` → store.ts advanceTime
- `trackEndingReached` → store.ts checkEnding
- `trackMentalCrisis` → store.ts emotional≤20
- `trackSceneUnlock` → store.ts selectScene/advanceTime

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
