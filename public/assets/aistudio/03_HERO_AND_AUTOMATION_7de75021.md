# 03. 主角成长体系、主动神通与硬核曲线配平 (Hero, Skills & Balancing - v3.5.1完美修正版)

> **核心平衡性原则**：
> 1. **扎实的线性起步**：开局主角基础攻击力 `10`，【顿悟】1级每手动点 1 下加 `+1` 攻击！
> 2. **切断顿悟自锁**：顿悟效果为阶梯多项式，价格底数为陡峭的 `1.38^L`；叠加 **500击心魔软上限** 与 **傀儡代打 25% 效率衰减**，绝不允许无脑靠点击单通！

---

## 一、 主角点击成长底层公式（含软上限、手操奖励与岁月史书同步）

1. **初始状态**：
   * 主角初始基础攻击力 `baseAtk = 10`。
   * 重开初始化 `accumulatedAtk`：若拥有仙阶遗物【逆时沙漏 (`L_rel_e_auto_start > 0`)】，则开局设为 `1000 * (2 ^ L)`；否则为 `0`。
2. **动态累积规则**：
   * 每次发生有效点击时，按以下严谨公式计算本次增加的修为 `actualGain`：
     ```ts
     // 1. 来源系数：手动点击或2技能【万法残影】享受 100% 成长；【机关傀儡】自动点击仅享受 25% 成长！
     const sourceFactor = (clickSource === "puppet") ? 0.25 : 1.0;
     // 2. 心魔瓶颈软上限：若当前 accumulatedAtk 已超过 growthPerClick * 500，叠攻效率衰减为 20%
     const capPenalty = accumulatedAtk.gte(growthPerClick.times(500)) ? 0.20 : 1.0;
     // 3. 1技能【燃血叩击】爆发乘数（受神阶遗物【万法道胎 rel_m_auto_skill】放大）
     const relicSkillBoost = 1 + 0.2 * L_rel_m_auto_skill;
     const skill1Mult = isSkill1Active ? (2.0 + 0.5 * Skill1Level) * relicSkillBoost : 1.0;
     
     const actualGain = growthPerClick.times(sourceFactor).times(capPenalty).times(skill1Mult);
     accumulatedAtk = accumulatedAtk.plus(actualGain);
     
     // 4. 神阶遗物【岁月史书 (rel_m_click_echo)】：同步将 actualGain * (0.1 * L) 累加至佣兵 SharedHeroGrowth
     if (L_rel_m_click_echo > 0) SharedHeroGrowth = SharedHeroGrowth.plus(actualGain.times(0.1 * L_rel_m_click_echo));
     ```

---

## 二、 主角三大养成模块（消耗【灵石】）

### 模块 A：【顿悟】（提升每次点击增加的攻击力 `growthPerClick`）
* **初始等级**：1 级（每击 `+1` 攻）。
* **升级价格公式**：`Cost(L) = 25 * (1.38 ^ (L - 1)) * (1 - 0.015 * L_rel_c_cost_down)`
* **每级效果公式（阶梯多项式）**：
  ```ts
  growthPerClick(L) = (1 + (L - 1) * (1 + Math.floor(L / 10) * 1.5) + (2 * L_rel_c_click_flat)) * (1 + Sum_AllActive(af_t2_h_grow));
  ```

### 模块 B：【肉身破境】（阶段性质变 —— 必须同时满足点击次数并扣除灵石！）

| 境界阶位 | 境界名称 | 突破需消耗灵石 (不受打折) | 突破需本局点击层数 | 境界总伤害乘数 (`RealmMultiplier`) | 突破额外解锁奖励 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 0阶 (初始)| **凡胎肉身** | 0 | 0 | `×1` | 初始自带第1神通：【燃血叩击】 |
| 1阶 | **百脉筑基** | **消耗 `800` 灵石** | 50 次 | `×3` | 解锁第2神通：【万法残影】（分身连打） |
| 2阶 | **煞气金丹** | **消耗 `25,000` 灵石**| 250 次 | `×10` | 解锁第3神通：【天罚神雷】（破壳核弹） |
| 3阶 | **不灭元婴** | **消耗 `1.50e6` (150万)**| 1,000 次 | `×40` | 解锁第4神通：【弑神共鸣】（全队暴走） |
| 4阶 | **法则化神** | **消耗 `2.00e8` (2亿)** | 3,000 次 | `×200` | 道力上限额外 `+50`，自然恢复 `+1.5/秒` |
| 5阶~N阶 | **古神道躯·N重**| **消耗 `2e8 * (200 ^ (N-4))`**| 无需点击限制 | 每阶额外 `×5` | 中后期主角伤害质变池 |

### 模块 C：【机关傀儡】（自动点击器）
* **解锁条件**：首次击破第 1 重躯壳（500血）后永久显示购买项；若拥有【逆时沙漏 (`L > 0`)】，开局直接免费赠送 `5 * L` 级（上限 50 级）。
* **购买与升级**：
  * **激活价格（0 -> 1级）**：`60 * (1 - 0.015 * L_rel_c_cost_down)` 灵石。
  * **升级价格公式（当前等级 `L >= 0`）**：`Cost(L) = 60 * (1.28 ^ L) * (1 - 0.015 * L_rel_c_cost_down)`（等级上限 50 级）。
  * **攻速公式**：`PuppetCPS = (1.5 + (L - 1) * 0.35) + (0.2 * L_rel_c_puppet_spd) + Sum_AllActive(af_t2_puppet)`（若在劫数三，上限硬锁为 `8次/秒`）。

---

## 三、 道力（Mana）与 4 大主动神通系统

### 1. 道力上限与恢复完整公式
* **容量上限 (`MaxMana`)**：`100 + (4 * L_rel_c_mana_cap) + (Realm >= 4 ? 50 : 0)`。**每局开局默认拥有 `40` 点道力**。
* **自然恢复速率 (`ManaRegenPerSec`)**：`[ 1.0 + (Realm >= 4 ? 1.5 : 0) + Sum_AllActive(af_t1_mana_r) ] * (isTier7 ? 0.5 : 1.0)`。
* **手动点击回蓝 (`ManaPerManualClick`)**：`[ 0.8 + (0.05 * L_rel_c_mana_click) ] * (isTier7 ? 0.5 : 1.0)`。

### 2. 四大主动神通配置表
升级价格公式：`BaseCost * (1.65 ^ (SLvl - 1)) * (1 - 0.015 * L_rel_c_cost_down)`；冷却时间缩减：`CD * (1 - 0.016 * L_rel_r_skill_cd)`；持续时间延长：`Dur + (0.5 * L_rel_r_skill_dur)`；神阶遗物【万法道胎 (`rel_m_auto_skill`)】使全神通无蓝耗自动释放，且效果倍率额外 `× (1 + 0.2 * L_rel_m_auto_skill)`。**（注：若持续时间因遗物延长而超过冷却时间，重复释放仅刷新当前持续时间，效果不叠加！）**

| 技能ID | 神通名称 | 解锁境界 | 消耗道力 | 原始持续 / 原始CD | 初始升级价 (`BaseCost`) | 技能效果与等级成长公式 (`SLvl` 为技能等级) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `sk_blood` | **① 燃血叩击** | 初始自带 | `20` 点 | 持续 **8秒** / CD 25秒 | `100` 灵石 | **叠攻爆发**：激活期间，主角每次点击获得的攻击力成长值 **`× (2.0 + 0.5 * SLvl) * (1 + 0.2 * L_rel_m_auto_skill)`**。 |
| `sk_clone` | **② 万法残影** | 1阶筑基 | `35` 点 | 持续 **8秒** / CD 35秒 | `1,200` 灵石 | **高频连打**：召唤残影，每秒自动发动 **`(5 + 1 * SLvl) * (1 + 0.2 * L_rel_m_auto_skill)` 次** 主角点击（享受 100% 顿悟叠攻）。 |
| `sk_thunder`| **③ 天罚神雷** | 2阶金丹 | `50` 点 | 瞬发 / CD 25秒 | `30,000` 灵石 | **破盾核弹**：立即造成 **`RawHeroClick × (150 + 50 * SLvl) × (1 + 0.15 * L_rel_r_thunder) × (1 + Sum_AllActive(af_t1_skill_d)) × (1 + 0.2 * L_rel_m_auto_skill)`** 伤害！ |
| `sk_sync` | **④ 弑神共鸣** | 3阶元婴 | `75` 点 | 持续 10秒 / CD 50秒 | `1.00e6` 灵石 | **全队暴走**：激活期间，所有已上阵佣兵攻速 **`×1.5`**，且佣兵每次攻击额外附带主角 **`RawHeroClick × (0.3 * SLvl) × (1 + 0.2 * L_rel_m_auto_skill)`** 协同伤害！ |
