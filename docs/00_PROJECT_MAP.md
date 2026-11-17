# 《弑神道果：万亿亿劫》项目知识库地图 (Project Map - v4.1)

> **致开发者与 AI 编程助手**：
> 本目录 (`docs/`) 是游戏的模块化设计文档中心。当你需要查阅设计规则或修改特定模块的代码时，**请按需读取对应的子文档**。
> **UI、性能与手机优先铁律**：项目采用极简暗黑矢量 UI 与手机端优先触控布局（最小触控区 44px+）；遗物六阶（凡/灵/玄/圣/仙/神）使用统一无衬线字体配合渐层色、辉光与金属扫光（`.font-tier-common` ~ `.font-tier-mythic`）；主角傀儡、残影与护法均受 `25次/秒 (0.04s)` 攻速上限保护（超出 1:1 转攻击力），同屏飘字/波纹设并发上限，全局严格保持零 Emoji。

## 文档导航与代码映射关系 (Document -> Code Mapping)

| 文档路径 | 核心内容 | 对应代码目录 / 文件 (React + TS 实现) | 维护职责 |
| :--- | :--- | :--- | :--- |
| **[01_GLOSSARY_AND_UI.md](./01_GLOSSARY_AND_UI.md)** | 全局简化名词字典（灵石/词缀石/神晶/道力）、重开传承铁律 | `src/stores/useGameStore.tsx`, `src/components/TopStatusBar.tsx` | 修改货币名称、核心重开逻辑 |
| **[02_MATH_AND_ECONOMY.md](./02_MATH_AND_ECONOMY.md)** | 中式大数单位表、5大固定佣兵千级公式、词缀放大器、`25次/秒`攻速溢出转化与毒伤/神晶公式 | `src/core/formatNumber.ts`, `src/core/damageCalc.ts` | 调整数值膨胀曲线、伤害与神晶乘区计算 |
| **[03_HERO_AND_AUTOMATION.md](./03_HERO_AND_AUTOMATION.md)** | 主角线性+1起步、阶梯顿悟、扣费肉身破境、4大主动神通、傀儡与后期灵枢自动化 | `src/config/constants.ts`, `src/components/TabHero.tsx`, `src/stores/useGameStore.tsx` | 调整前期手操手感、技能倍率、自动化解锁与回蓝 |
| **[04_MERCENARY_AND_AFFIXES.md](./04_MERCENARY_AND_AFFIXES.md)** | 5大固定本命佣兵、1000级10词缀槽节点、神晶本命槽、48种五阶词缀表 | `src/config/archetypes.ts`, `src/config/affixes.ts`, `src/components/TabMercenaries.tsx` | 佣兵升级、10词缀槽解锁、48词缀池与洗练 |
| **[05_RELICS_SYSTEM.md](./05_RELICS_SYSTEM.md)** | 45件六阶遗物完整表（凡/灵/玄/圣/仙/神六阶、流光辉光样式、双轨等级、满印溢转、圣+神晶增幅、掉率幸运） | `src/config/relics.ts`, `src/components/TabRelics.tsx`, `src/components/CompendiumModal.tsx` | 调整遗物池、双轨等级上限、掉宝幸运与溢转机制 |
| **[06_BOSS_AND_ENDGAME.md](./06_BOSS_AND_ENDGAME.md)** | 10重躯壳、10大劫数独立阶位掉率表（线性 1~10 件掉落、劫十 1% 神阶）、无感自动结算与 0.25s 连刷、NG+ | `src/config/bosses.ts`, `src/components/BossArena.tsx`, `src/stores/useGameStore.tsx` | 劫数门槛、独立掉率分配、平滑中后期血量与连刷 |
| **[07_VISUAL_AND_UX_GUIDE.md](./07_VISUAL_AND_UX_GUIDE.md)** | 极简暗黑矢量 UI、线性 SVG 图标、手机端触控卡片、同屏弹出并发上限与洗练前后对比预览 | `src/App.tsx`, `src/components/`, `src/config/highlights.tsx`, `src/index.css` | 保持暗黑矢量视觉、六阶流光色阶、性能优化与移动端布局 |
| **[08_ONBOARDING_AND_LORE.md](./08_ONBOARDING_AND_LORE.md)** | 开场3屏电影式呼吸序章、首局渐进式 UI 显隐、关键节点解锁提醒与图鉴系统 | `src/components/Modals.tsx`, `src/components/CompendiumModal.tsx` | 优化新手引导、世界观文案、字体高亮与图鉴查表 |
| **[TAPTAP_RELEASE_GUIDE.md](./TAPTAP_RELEASE_GUIDE.md)** | TapTap 上架美术套件清单（`1:1`/`16:9`/`3:4`）、商店可复制简介标签、打包指引 | `public/taptap/`, `index.html`, `README.md` | 维护渠道宣发图集、商店描述与发包说明 |

