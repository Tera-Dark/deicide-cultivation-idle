# 🗺️ 《弑神道果：万亿亿劫》项目知识库地图 (Project Map - v2.2定型版)

> **致 AI 编程助手 (Cursor / Claude / Windsurf)**：
> 本目录 (`docs/`) 是游戏的模块化设计中心。当你需要编写或修改特定模块的代码时，**请只按需读取对应的子文档**，无需一次性加载全部文档以节省上下文 Token 并提高准确率。

## 📂 文档导航与代码映射关系 (Document -> Code Mapping)

| 文档路径 | 核心内容 | 对应代码目录 / 文件 | 维护职责 |
| :--- | :--- | :--- | :--- |
| **[01_GLOSSARY_AND_UI.md](./01_GLOSSARY_AND_UI.md)** | 全局简化名词字典（灵石/词缀石/神晶/道力）、重开传承铁律、UI规范 | `src/stores/`, `src/components/` | 修改货币名称、界面布局调整 |
| **[02_MATH_AND_ECONOMY.md](./02_MATH_AND_ECONOMY.md)** | 中式大数单位表、伤害转灵石衰减公式、指数升级成本公式 | `src/core/formatNumber.ts`, `src/core/damageCalc.ts` | 调整数值膨胀曲线、软上限公式 |
| **[03_HERO_AND_AUTOMATION.md](./03_HERO_AND_AUTOMATION.md)** | 主角点击线性+1起步、顿悟、肉身破境、4大主动神通、傀儡后置解锁 | `src/stores/useGameStore.ts` | 调整前期手操手感、技能倍率与回蓝 |
| **[04_MERCENARY_AND_AFFIXES.md](./04_MERCENARY_AND_AFFIXES.md)** | **核心玩法**：5栏位神晶阶梯解锁、4大基底、15个专属词缀池与洗练权重 | `src/config/archetypes.ts`, `src/config/affixes.ts`, `src/stores/useMercenaryStore.ts` | 新增佣兵词缀、调整流派联动平衡 |
| **[05_RELICS_SYSTEM.md](./05_RELICS_SYSTEM.md)** | **30件四阶遗物完整表**（凡/灵/仙/神四阶、后期BOSS直掉神阶与等级机制） | `src/config/relics.ts`, `src/stores/useMetaStore.ts` | 调整刷宝掉率、遗物满级上限与增幅 |
| **[06_BOSS_AND_ENDGAME.md](./06_BOSS_AND_ENDGAME.md)** | **48小时短平快曲线**：10重躯壳、10大劫数奖励（前5给神晶/后5送遗物等级） | `src/config/bosses.ts`, `src/core/gameLoop.ts` | 拓展终局轮回难度、调整通关大爆奖励 |

---

## 🛠️ 工程目录结构规范 (Target Source Tree)

```text
src/
├── config/                  # 【静态配置表】严格与 docs/ 02~06 文档一一对应
│   ├── constants.ts         # 对应 01 & 02 文档
│   ├── archetypes.ts        # 对应 04 文档 (第一层基底)
│   ├── affixes.ts           # 对应 04 文档 (第三层词缀池)
│   ├── relics.ts            # 对应 05 文档 (30件四阶遗物)
│   └── bosses.ts            # 对应 06 文档 (BOSS与劫数奖励)
├── stores/                  # 【Pinia状态管理】
│   ├── useGameStore.ts      # 局内状态（灵石、BOSS血量、主角修为、道力、4大神通CD、计时器）
│   ├── useMercenaryStore.ts # 5人佣兵栏位状态（等级重开归零，栏位解锁/基底/词缀永久持久化）
│   └── useMetaStore.ts      # 局外永久状态（词缀石、神晶、30件遗物等级、劫数进度与最快记录）
├── core/                    # 【核心引擎】
│   ├── gameLoop.ts          # 50ms (20 FPS) 主循环逻辑与事件触发总线
│   ├── damageCalc.ts        # 伤害、乘区与软上限计算器
│   └── formatNumber.ts      # 中式大数格式化工具
└── components/              # 【UI组件】顶部状态栏、中部BOSS战区+神通栏、底部4大Tab区
```
