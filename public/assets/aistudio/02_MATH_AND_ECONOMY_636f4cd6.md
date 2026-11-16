# 🧮 02. 核心数学公式与全局伤害计算器规范 (Math & Damage Calculator - v2.5完美封版)

> **强制技术要求**：所有涉及血量、伤害、灵石、神晶的运算，必须使用 `break_infinity.js` 的 `Decimal` 类。请在 `src/core/damageCalc.ts` 中严格实现本章全部公式。

---

## 一、 大数单位格式化字典 (`formatNumber.ts`)
* `< 10^4`：显示整数（如 `9527`）。
* `>= 10^4` 且 `< 10^80`：每 `10^4`（万倍）进一位，保留两位小数。单位数组依次为：
  `['', '万', '亿', '兆', '京', '垓', '秭', '穰', '沟', '涧', '正', '载', '极', '恒河沙', '阿僧祇', '那由他', '不可思议', '无量', '大数', '古戈尔']`
* `>= 10^80`：直接切换为科学计数法显示（如 `1.25e85`）。

---

## 二、 全局伤害计算总公式 (`damageCalc.ts`)

### 1. 全局通用乘区 (`GlobalMult`)
适用于主角、所有佣兵直伤、神通伤害以及每秒毒伤的最终兜底乘区：
```ts
// 弑神道果(rel_e_inf_dmg) * 不可名状之核(rel_m_final_mult) * 混沌母体(rel_m_omni_base) * 劫数10阶段衰减
GlobalMult = (1.25 ^ L_inf_dmg) * (2 ^ L_final_mult) * (1 + UniqueArchetypeCount * 0.15 * L_omni_base) * TierStageDecay;
```

### 2. 主角单次点击最终伤害 (`D_click`)
* **主角暴击属性**：主角天生自带 `10%` 暴击率，基础暴击伤害为 `1.5 + (0.15 * L_rel_r_crit_dmg)`。
```ts
BaseHero = 15 + accumulatedAtk;
RawHeroClick = BaseHero * RealmMultiplier * (1 + HeroBuff_affix) * (1 + 0.25 * L_rel_c_click_mult) * GlobalMult * TierDirectPenalty;
// 每次点击实际造成伤害（含暴击判定）：
ActualHeroClickDmg = isHeroCrit ? RawHeroClick * HeroCritDmgMult : RawHeroClick;
// 注：用于附加给佣兵【借力】或【天罚神雷】计算的 D_click 基准值，统一取期望值或 RawHeroClick。
```

### 3. 单个佣兵（Slot i）单次直伤完整公式 (`D_merc(i)`)
当第 `i` 号栏位已解锁佣兵（非阵盘基底）发动攻击时，按以下 6 步依次计算其单次伤害：
```ts
// Step 1: 基础等级面板伤害 (含岁月史书 rel_m_click_echo 同步加成 与 逢10级翻倍)
PanelBase = (30 * dmgFactor * Level * (1.06 ^ Level) + SharedHeroGrowth) * (2 ^ Math.floor(Level / 10));

// Step 2: 词缀【借力 (af_hero_link)】附加主角点击伤害
HeroLinkAdd = RawHeroClick * Sum(af_hero_link_value);

// Step 3: 自身与小队词缀加算区 (锋锐 + 相邻阵眼 + 总等级共鸣)
AffixAddMult = 1 + Sum(af_dmg_self) + AdjacentArrayBuff(i) + (Math.floor(TotalMercLevels / 25) * Sum(af_total_lvl));

// Step 4: 词缀【成长 (af_lvl_scale)】与【献祭 (af_lone_wolf)】独立乘算区
GrowthMult = 1 + Math.floor(Level / 10) * Sum(af_lvl_scale);
LoneWolfSelfMult = 1 + Sum(af_lone_wolf_self); // 自身携带献祭的增幅
LoneWolfPenalty = 0.7 ^ Count(OtherMercsWithLoneWolf); // 其他队友携带献祭对自身的指数衰减(防负数!)

// Step 5: 阵盘常驻光环乘区 + 对应流派遗物乘区
ArrayAuraMult = 1 + Sum(AllArrayMercLevels * 0.08) * (1 + 0.08 * L_rel_r_array_buff);
ArchetypeRelicMult = 1 + (isCannon ? 0.70 : 0.50) * L_archetype_relic;

// Step 6: 汇总并判定暴击
// 暴击率 = Math.min(1.0, (isCannon ? 0.50 : 0.05) + Sum(af_crit_rate))
// 暴击伤害 = (isCannon ? 2.50 : 1.50) + Sum(af_crit_dmg) + (0.15 * L_rel_r_crit_dmg)
RawMercDmg = (PanelBase * AffixAddMult * GrowthMult * LoneWolfSelfMult * LoneWolfPenalty * ArrayAuraMult * ArchetypeRelicMult + HeroLinkAdd) * GlobalMult * TierDirectPenalty;
FinalMercDmg = (isCrit ? RawMercDmg * MercCritDmgMult : RawMercDmg) + (isSkill4Active ? RawHeroClick * Skill4SyncRatio : 0);
```

### 4. 【触手基底】每秒腐蚀毒伤结算公式 (`D_poison_tick`)
* 场上任意【触手基底】佣兵每次攻击命中，使 BOSS 身上的 `poisonStacks`（毒层数）`+1`。
* 每隔 `1.0` 秒（或当其他佣兵触发【催熟 `af_poison_pop`】词缀时），立即结算一次毒伤（**毒伤无视劫数二的直伤减免**）：
```ts
// 汇总场上所有触手佣兵的每秒毒伤面板 (dmgFactor 取 0.6)
TotalTentaclePoisonPanel = Sum_Tentacles( D_merc_without_crit_and_herolink(i) );
RawPoisonDmg = TotalTentaclePoisonPanel * poisonStacks;
// 若拥有仙阶遗物【腐化之眼 (rel_e_dot_crit)】，则毒伤可按遗物暴击率(30%+4%*L)与爆伤(200%+40%*L)进行暴击判定！
FinalPoisonDmg = isPoisonCrit ? RawPoisonDmg * PoisonCritMult : RawPoisonDmg;
```

---

## 三、 伤害转灵石与升级成本公式
1. **实时伤害转灵石**：
   ```ts
   ΔSpiritStones = ActualDamage * (1 + StoneBonus_affix + 0.20 * L_rel_c_stone_gain) * (1.15 ^ L_rel_c_stone_inf) * StagePenalty * TierStoneDebuff;
   ```
   * `StagePenalty`：Phase 1~6 为 `1.0`；Phase 7~8 为 `0.5`；Phase 9~10 为 `0.2`。
2. **升级成本与批量购买 (`×1 / ×10 / ×100 / Max`)**：
   ```ts
   Cost(L) = BaseCost * ((GrowthRate + TierGrowthPenalty) ^ (L - 1)) * (1 - 0.015 * L_rel_c_cost_down);
   TotalCost(L, N) = Cost(L) * (((GrowthRate + TierGrowthPenalty) ^ N) - 1) / ((GrowthRate + TierGrowthPenalty) - 1);
   ```
