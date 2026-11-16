# 《弑神道果：万亿亿劫》项目知识库地图 (Project Map - v3.5最终封版)

> **致 AI 编程助手 (Cursor / Claude / Windsurf)**：
> 本目录 (`docs/`) 是游戏的模块化设计中心。当你需要编写或修改特定模块的代码时，**请只按需读取对应的子文档**。
> **UI 保护铁律**：当前项目的极简暗黑矢量 UI 风格已定型，在实现新功能时，**请完全沿用现有的深色卡片、按钮与线性 SVG 图标风格**，不要大改全局配色与布局框架！

## 文档导航与代码映射关系 (Document -> Code Mapping)

| 文档路径 | 核心内容 | 对应代码目录 / 文件 | 维护职责 |
| :--- | :--- | :--- | :--- |
| **[01_GLOSSARY_AND_UI.md](./01_GLOSSARY_AND_UI.md)** | 全局简化名词字典（灵石/词缀石/神晶/道力）、重开传承铁律 | `src/stores/`, `src/components/` | 修改货币名称、核心重开逻辑 |
| **[02_MATH_AND_ECONOMY.md](./02_MATH_AND_ECONOMY.md)** | 中式大数单位表、5大固定佣兵1000级公式、词缀放大器、攻速溢出转化与毒伤公式 | `src/core/formatNumber.ts`, `src/core/damageCalc.ts` | 调整数值膨胀曲线、伤害乘区计算 |
| **[03_HERO_AND_AUTOMATION.md](./03_HERO_AND_AUTOMATION.md)** | 主角线性+1起步、阶梯顿悟、扣费肉身破境、4大主动神通、傀儡自动化 | `src/stores/useGameStore.ts` | 调整前期手操手感、技能倍率与回蓝 |
| **[04_MERCENARY_AND_AFFIXES.md](./04_MERCENARY_AND_AFFIXES.md)** | 5大固定本命佣兵、1000级10词缀槽节点、神晶本命槽、48种三六九等词缀表 | `src/config/archetypes.ts`, `src/config/affixes.ts`, `src/stores/useMercenaryStore.ts` | 佣兵升级、10词缀槽解锁、48词缀池与洗练 |
| **[05_RELICS_SYSTEM.md](./05_RELICS_SYSTEM.md)** | 30件四阶遗物完整表（凡/灵/仙/神四阶、后期BOSS直掉神阶机制） | `src/config/relics.ts`, `src/stores/useMetaStore.ts` | 调整刷宝掉率、遗物满级上限与增幅 |
| **[06_BOSS_AND_ENDGAME.md](./06_BOSS_AND_ENDGAME.md)** | 10重躯壳、10大劫数（直达1e120万亿亿终局）精确Debuff公式与刷宝奖励 | `src/config/bosses.ts`, `src/core/gameLoop.ts` | 终局高压挑战、调整通关大爆奖励 |
| **[07_VISUAL_AND_UX_GUIDE.md](./07_VISUAL_AND_UX_GUIDE.md)** | 保持现有极简暗黑矢量UI与线性SVG图标、适配十词缀洗练弹窗 | `src/App.vue`, `src/components/` | 保持现有UI风格、扩展十词缀面板与动效反馈 |
| **[08_ONBOARDING_AND_LORE.md](./08_ONBOARDING_AND_LORE.md)** | 开场3屏世界观序章、首局渐进式UI显隐、8大系统解锁提醒弹窗 | `src/components/IntroModal.vue`, `src/components/UnlockToast.vue` | 优化新手前5分钟引导、世界观文案与流派指南 |
