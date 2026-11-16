# 弑神道果：万亿亿劫 (Godslayer Dao: Eons of Calamity)

> 修仙 × 克苏鲁题材策略构筑与天文数字增量放置游戏。  
> 觉醒【弑神道胎】，剥离高维天道古神的【灵石】，唤醒五大固定本命护法，点亮千级十重道纹词缀，轰穿高达 `1e120`（万亿亿之上）的十重古神躯壳，在诸天劫数与无尽真神轮回（NG+）中争夺 SSS 瞬杀竞速。

---

## 核心特性

### 1. 大数引擎与精确多乘区演算
- **无限大数支持**：基于 `break_infinity.js` 的 `Decimal` 运算引擎，无缝支持至 `1e9999` 级别数值，自带「中式大数单位（万 → 亿 → 兆 → 京 → …… → 古戈尔）」与「科学计数法」一键切换。
- **20Hz 高精度主循环**：50ms 逻辑帧驱动手操、机关傀儡自动点击、分身残影、护法独立攻击间隔（含 `0.05s` 防卡死攻速溢出转化）与每秒腐蚀毒结算。

### 2. 主角修为、肉身破境与主动神通
- **阶梯线性顿悟**：开局基础攻击 `10`、`+1/击` 起步，结合 500 击心魔软上限与自动傀儡衰减机制，避免前期数值崩坏。
- **肉身破境与 4 大主动神通**：凡胎 → 筑基 → 金丹 → 元婴 → 化神 → 古神道躯，依次解锁【燃血叩击】、【万法残影】、【天罚神雷】、【弑神共鸣】。
- **机关傀儡**：击破第 1 重躯壳后开放激活与升级（最高 50 级），提供稳定自动化手操体验。

### 3. 五大本命护法 × 千级十重道纹 × 48 种词缀协同
- **5 位专精本命护法**（非随机抽卡，定位鲜明、跨角色联动）：
  1. **青冥剑侍**：`0.4s` 极速连斩流（剑影分光 + 御剑随心）
  2. **深渊触母**：永久腐蚀毒与全队暴击毒爆共鸣
  3. **雷火机神**：高爆重炮（剑侍与主角攻击缩减冷却，破壳 6~10 重最终伤害 ×3）
  4. **天机阵尊**：聚灵灵石加成 + 1~3 号位增伤光环 + 全队神通减 CD
  5. **混沌古神嗣**：全队总有效等级每满 100 级复利 `×1.5`、汇聚 1~4 号位面板 500% 且放大全队词缀 `×1.5`
- **1000 级十槽道纹 + ★先天本命神通**：
  - 每位护法于 `Lv.10` 至 `Lv.1000` 逐层解锁 10 个等级词缀槽，每达节点自身伤害直接 `×4`。
  - 38 种凡/中/上等词缀（含五阶品质权重、10 次气运保底、先看后换预览、劫二后支持批量锁槽）与 10 种【先天本命神通】（如 ★法天象地、★万剑归宗、★万毒之源、★歼星连射、★千级共鸣）。

### 4. 四阶 30 件遗物、十重躯壳与无尽劫数竞速
- **30 件四阶永久遗物**：凡阶（8）、灵阶（10）、仙阶（7）、神阶·古神遗物（5），附带常驻池防溢出与神阶劫 7~10 概率直掉。
- **10 大劫数与 NG+ 轮回**：从 `500万` 血的【劫数一：凡胎初醒】一路推进至 `1e120` 血的【终焉劫：万亿亿古神】并开启真神轮回（NG+）；15 秒内达成 **SSS 瞬杀评级** 解锁本劫【自动连续挑战】。

### 5. 电影感沉浸叙事与极简暗黑矢量 UI
- **三幕呼吸式全屏序章**：分句焦距渐显播放，支持轻触加速与设置中「重温序章」。
- **全局零 Emoji 规范**：全部采用定制线性 SVG 矢量图腾与语义发光字体层级。
- **离线自动存档 & Base64 迁移**：自动持久化至浏览器 `localStorage`，支持 Base64 字符串导出/导入备份与跨设备迁移；内建 Web Audio API 合成打击、神通与破壳音效（可随时静音）。

---

## 技术栈

- **前端框架**：React 19 + TypeScript + Vite 8
- **样式与动效**：Tailwind CSS v4 (`@tailwindcss/vite`) + 原生 CSS 关键帧动画
- **大数计算**：`break_infinity.js`
- **图标库**：`lucide-react` + 定制线性 SVG 组件
- **持久化与音效**：`localStorage` (Base64 导出/导入) + Web Audio API 合成音效引擎

---

## 项目目录结构

```text
.
├── docs/                       # 完整游戏设计文档中心 (v3.5)
│   ├── 00_PROJECT_MAP.md       # 文档导航与代码模块映射
│   ├── 01_GLOSSARY_AND_UI.md   # 核心名词字典、重开传承规则与 UI 布局规范
│   ├── 02_MATH_AND_ECONOMY.md  # 全局伤害乘区、攻速溢出、毒伤与经济公式
│   ├── 03_HERO_AND_AUTOMATION.md   # 主角成长、肉身破境、神通与傀儡公式
│   ├── 04_MERCENARY_AND_AFFIXES.md # 五大护法、千级十槽与 48 种词缀配置表
│   ├── 05_RELICS_SYSTEM.md     # 四阶 30 件古神遗物配置表
│   ├── 06_BOSS_AND_ENDGAME.md  # 10 重躯壳、10 大劫数、NG+ 与速通评级
│   ├── 07_VISUAL_AND_UX_GUIDE.md   # 暗黑矢量视觉规范与洗练弹窗交互
│   └── 08_ONBOARDING_AND_LORE.md   # 世界观序章、引导节点与流派指南
├── src/
│   ├── components/             # UI 组件 (Arena, Tabs, Modals, SVG Icons)
│   ├── config/                 # 数值与配置词库 (affixes, archetypes, bosses, relics, highlights)
│   ├── core/                   # 伤害公式引擎与大数格式化 (damageCalc, formatNumber)
│   ├── stores/                 # 全局游戏状态、主循环与存档系统 (useGameStore)
│   ├── types/                  # TypeScript 领域类型定义
│   ├── utils/                  # Web Audio 合成音效工具
│   ├── App.tsx                 # 三段式主壳体与弹窗挂载
│   ├── index.css               # 全局暗黑主题、字体与关键帧动效
│   └── main.tsx                # 应用入口
├── CHANGELOG.md                # 版本更新日志
├── LICENSE                     # MIT 开源协议
├── index.html                  # HTML 入口与字体声明
├── metadata.json               # 应用元信息
├── package.json                # 依赖与脚本配置
├── tsconfig.json               # TypeScript 编译配置
└── vite.config.ts              # Vite 构建配置
```

---

## 本地开发与构建

### 环境要求
- Node.js >= 18.x
- npm / pnpm / bun 任意包管理器

### 安装与运行

```bash
# 1. 安装依赖
npm install

# 2. 启动本地开发服务器 (默认端口 3000)
npm run dev

# 3. TypeScript 静态类型检查
npm run lint

# 4. 生产环境打包构建
npm run build

# 5. 预览生产构建产物
npm run preview
```

---

## GitHub Pages 在线游玩部署

仓库已内置 [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) 与自适应 `base` 路径配置（[`vite.config.ts`](./vite.config.ts)），推送至 GitHub 即可零配置自动发布并直接在电脑或手机浏览器中在线游玩（本地 `localStorage` 自动存档，支持 Base64 导出迁移）：

1. 将本仓库代码推送到 GitHub 的 `main` 或 `master` 分支。
2. 进入 GitHub 仓库页 **Settings → Pages**。
3. 在 **Build and deployment → Source** 下拉框中选择 **GitHub Actions**。
4. 等待 Actions 中的 **Deploy to GitHub Pages** 工作流运行完成（约 1 分钟），即可通过页面生成的 `https://<你的用户名>.github.io/<仓库名>/` 链接直接游玩。
5. 若使用自定义根域名或手动上传静态产物，亦可通过 `VITE_BASE_PATH=/ npm run build` 自定义基础路径。

---

## 设计文档索引

完整数值平衡、公式推导、词缀/遗物配置表均归档于 [`docs/`](./docs/00_PROJECT_MAP.md) 目录：

- [00. 项目知识库地图](./docs/00_PROJECT_MAP.md)
- [01. 全局名词解析与 UI 规范](./docs/01_GLOSSARY_AND_UI.md)
- [02. 核心数学公式与全局伤害计算器](./docs/02_MATH_AND_ECONOMY.md)
- [03. 主角成长体系与主动神通](./docs/03_HERO_AND_AUTOMATION.md)
- [04. 五大固定本命佣兵与 48 词缀全表](./docs/04_MERCENARY_AND_AFFIXES.md)
- [05. 局外 30 件四阶遗物系统](./docs/05_RELICS_SYSTEM.md)
- [06. BOSS 10 重躯壳与 10 大劫数终局](./docs/06_BOSS_AND_ENDGAME.md)
- [07. 视觉与交互规范](./docs/07_VISUAL_AND_UX_GUIDE.md)
- [08. 世界观序章与新手引导](./docs/08_ONBOARDING_AND_LORE.md)

---

## 开源协议

本项目基于 [MIT License](./LICENSE) 开源。
