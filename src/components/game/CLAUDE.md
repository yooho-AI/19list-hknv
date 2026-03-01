# components/game/ — 游戏组件层
L2 | 父级: 19list-hknv/CLAUDE.md

## 成员清单

- `app-shell.tsx`: 游戏主壳——Header(📓+📜) + Tab路由(三向手势导航) + TabBar(3项+保存) + DashboardDrawer(左滑) + RecordSheet(右滑) + Toast
- `dashboard-drawer.tsx`: 港漂手帐——左侧滑入抽屉，6组件：扉页/缘分速览(4男主好感)/能力值(6条)/场景网格(3列)/当前目标/财务速览。Reorder拖拽排序
- `tab-dialogue.tsx`: 对话Tab——ChatArea(LetterCard/MessageBubble(NPC头像+角色色标左边框)/StreamingBubble/SceneTransitionCard/MonthChangeCard) + QuickActions(2x2网格) + InputArea + InventorySheet
- `tab-scene.tsx`: 场景Tab——SceneHero(9:16大图+渐变遮罩+场景信息) + 相关人物(2列) + 地点列表(2列，锁定/解锁/当前态)
- `tab-character.tsx`: 人物Tab——PortraitHero(呼吸动画) + 好感度条 + 能力值条(6全局) + SVG RelationGraph + 角色网格(2列) + CharacterDossier全屏档案

## 富UI组件清单

| 组件 | 所在文件 | 风格 |
|------|----------|------|
| CharacterDossier | tab-character.tsx | 全屏右滑入，立绘50vh+呼吸动画+数值条stagger+性格+关系线索 |
| SceneTransitionCard | tab-dialogue.tsx | 场景大图200px+Ken Burns 8s+渐变遮罩+金色角标 |
| MonthChangeCard | tab-dialogue.tsx | 霓虹渐变顶条+逐字打字机+年月+章节名 |
| DashboardDrawer | dashboard-drawer.tsx | 左侧滑入港漂手帐：扉页+缘分速览+能力值+场景网格+目标+财务+拖拽排序 |

## 交互架构

- **三向手势导航**：右滑→左侧手帐 | 左滑→右侧记录 | Header按钮同等触发
- **手帐拖拽排序**：Reorder.Group + dragControls + 拖拽手柄(⋮⋮)，排序持久化localStorage
- 移动优先唯一布局，无 isMobile 条件分叉
- 所有组件通过 `useGameStore` 获取状态
- CSS 类名统一 `hk-` 前缀
- Framer Motion 驱动 Tab 切换、弹窗、富消息动画
- 富消息通过 Message.type 字段路由渲染

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
