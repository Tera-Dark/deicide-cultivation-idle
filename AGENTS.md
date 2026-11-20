# AGENTS.md — 弑神道果：万亿亿劫

## 项目
修仙×克苏鲁题材的策略构筑与天文数字增量放置游戏。纯前端单机，Web/PWA 与 TapTap 小游戏双端；核心是 `break_infinity.js` 大数、五大护法 × 十槽词缀 × 六阶遗物构筑与离线结算。

## 运行与验证
- 安装：`bun install`（仓库锁定 `bun.lock`，CI 固定 `bun 1.4.4`）
- 开发：`bun run dev`（端口 3000）
- 类型检查：`bun run lint`
- 构建：`bun run build`；小游戏：`bun run build:minigame`
- 改伤害/经济公式后必跑：`bun run damage:sim`、`bun run econ:check` 与 `bun run balance:audit`
- Windows 构建若遇系统 Temp 目录 `EPERM`，把 `TEMP`/`TMP` 指向项目内临时目录后重跑；这是环境权限问题，不是代码错误。

## 技术栈
React 19 / TypeScript / Vite 8 / Tailwind CSS v4 / `break_infinity.js` / `vite-plugin-pwa` / `lucide-react`。

## 目录与约定
- `src/core/damageCalc.ts`：伤害与经济公式的唯一来源；HUD、离线结算、洗练预览必须调用同一套函数。
- `src/stores/useGameStore.tsx`：20Hz 主循环、攻击结算、离线结算、存档与自动购买。
- `src/config/`：`affixes` / `archetypes` / `relics` / `bosses` / `constants` 数值配置。
- `scripts/`：可执行的数值回归脚本，属于正式开发工具，不要当临时残留删除。
- `docs/`：设计文档；改公式或配置后同步对应文档与 `CHANGELOG.md`。
- UI 全中文、零 Emoji、触控区 44px+；亿级以上数值一律用 `Decimal`，禁止用 `Number` 承载。
- `25/s` 只封顶“间隔驱动攻击”；单次攻击可拆多段命中，点击联动与机神充能会追加攻击事件。每次【攻击】效果与每次【命中】效果必须分层实现。机神充能另有 `1.0 秒冷却/秒` 的共享上限（15 次攻击 + 雷火装填），Live 用令牌桶、HUD/离线用同一公式。天降横财每秒最多 `5` 次全额 + `5` 次 20% 折算，超出丢弃。
- 存档字段只增不减；给 `RunState` 加字段时，必须在所有加载路径为旧档补默认值。

## 当前状态（v3.11.0）
- 已完成：v3.9 的攻击/命中口径分离与 HUD/离线同源；v3.10 的结构性平衡补丁——百炼改线性并脱离古神瞳/5 号位放大，强体/万仙来朝/点名联动全部加上限，机神 `dmgFactor 12→5`、破壳 `×3→×2.25`、充能 `1.0s→0.4s/15` 且共享 `1.0 秒/秒` 硬上限；剑侍/触母/毒流补位；点石成金印封顶 `+250%`。
- v3.11：遗物降幅（磨剑 `2.5%/级`、乾坤 `2%/级`、古神瞳 `10%/级`、无限复利 `1.025/1.006` 与 `1.07/1.015`、机神专精 `4%/级`）；天降横财令牌桶（`5 次/秒全额 + 5 次/秒×20%`）；劫5/7/8/9/10 血量与推荐等级上调；新增广告位 `stone_boost`（伤害转化灵石 `×2` 持续 10 分钟，每日 5 次）。
- 门禁：`bun run lint`、`bun run econ:check`、`bun run damage:sim`、`bun run balance:audit` 全部通过。
- 审计基线（劫10 / Lv.1000 / 金词缀 / 有限遗物拉满）：机神全归因约 `43.1%`（直接+充能 `27.9%`），剑侍直伤约 `28.0%`，毒伤约 `11.1%`；单槽词缀最高边际约 `×5.67`（深渊共生）。
- 下一步（可选）：观察真实玩家构筑是否重新收敛到“机神 + 点击联动”；若需要进一步多样性，可把 `rel_e_click_storm` 的万道合击改为按护法 DPS 归因，或给毒流增加独立的终局乘区。
