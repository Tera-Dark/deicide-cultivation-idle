# 02. 核心数学公式与全局伤害计算器规范 (Math & Damage Calculator - v3.5.1完美修正版)

> **强制技术要求**：所有涉及血量、伤害、灵石、神晶的运算，必须使用 `break_infinity.js` 的 `Decimal` 类（支持高达 `1e9999` 的大数）。
> **经济防崩坏核心铁律**：严禁主角【顿悟】出现指数级自我繁殖导致单靠点击无脑通关！主角成长必须受限于“阶梯线性公式 + 500击修为软上限 + 陡峭价格指数（`1.38^L`）”，逼迫玩家在中后期必须将重心转向 5 大佣兵与 10 词缀槽协同！

---

## 一、 大数单位格式化字典 (`formatNumber.ts`)
* `< 10^4`：显示整数（如 `9527`）。
* `>= 10^4` 且 `< 10^80`：每 `10^4`（万倍）进一位，保留两位小数：
  `['', '万', '亿', '兆', '京', '垓', '秭', '穰', '沟', '涧', '正', '载', '极', '恒河沙', '阿僧祇', '那由他', '不可思议', '无量', '大数', '古戈尔']`
* `>= 10^80`：切换为科学计数法显示（如 `1.25e115`）。

---

## 二、 词缀生效与三大词缀放大器 (`getEffectiveAffixValue`)
在读取第 `i` 号佣兵的第 `slotIdx (0..9)` 个等级词缀槽的数值前，必须先按以下规则计算其**实际生效值**：
1. **激活判定**：只有当 `EffLevel[i] >= SlotUnlockLevel[slotIdx]` 时才生效，否则为 `0`。
2. **三大放大倍率相乘**：
   ```ts
   // ① 5号位【混沌古神嗣】天赋②：只要已解锁上阵，全队所有已激活词缀数值 ×1.5
   const slot5Boost = isSlot5Unlocked ? 1.5 : 1.0;
   // ② 本命神通 ★【道纹升华 (sp_affix_boost)】：若该佣兵自带此本命词缀，自身10个等级槽数值 ×2.0
   const innateBoost = hasInnateAffix(i, "sp_affix_boost") ? 2.0 : 1.0;
   // ③ 神阶遗物【古神之瞳 (rel_m_first_affix)】：前4个等级槽 (Index 0..3, Lv.10~Lv.100) 数值 ×(1 + 0.25 * L)
   const relicSlotBoost = (slotIdx <= 3) ? (1 + 0.25 * L_rel_m_first_affix) : 1.0;
   
   // 最终生效值（注：概率类词缀汇总后封顶 100%，af_t2_cheap 单个佣兵封顶 75%）
   EffectiveValue = BaseValue * tierMult * slot5Boost * innateBoost * relicSlotBoost;
   ```

---

## 三、 全局伤害计算总公式 (`damageCalc.ts`)

### 1. 全局通用乘区 (`GlobalMult`)
```ts
// TotalMercEffLevels 为所有已解锁佣兵的 EffLevel 之和（受 sp_double_lvl 翻倍影响）
Slot5GlobalMult = isSlot5Unlocked ? Decimal.pow(1.5, Math.floor(TotalMercEffLevels / 100)) : new Decimal(1);
// ★【千级共鸣 (sp_max_god)】：每有1个有效等级 >= 500 级的佣兵，全队总伤 ×3
MaxGodMult = AnyMercHas("sp_max_god") ? Decimal.pow(3, CountMercsEffLevelGte500) : new Decimal(1);
// ★【乾坤聚宝 (sp_gold_empire)】：灵石每有 10^N，全队伤害 +50%
GoldEmpireMult = AnyMercHas("sp_gold_empire") ? (1 + Math.max(0, Math.floor(spiritStones.max(1).log10())) * 0.5) : 1;
// 遗物乘区：弑神道果(rel_e_inf_dmg) * 不可名状之核(rel_m_final_mult) * 混沌母体(rel_m_omni_base)
RelicGlobalMult = Decimal.pow(1.25, L_inf_dmg).times(Decimal.pow(2, L_final_mult)).times(1 + UnlockedMercCount * 0.20 * L_omni_base);

GlobalMult = Slot5GlobalMult.times(MaxGodMult).times(GoldEmpireMult).times(RelicGlobalMult).times(TierStageDecay);
```

### 2. 主角单次点击最终伤害 (`D_click`)
* **主角暴击属性**：暴击率 `Math.min(1, 0.10 + Sum_AllActive(af_t1_hero_c))`，爆伤 `1.5 + (0.15 * L_rel_r_crit_dmg)`。
* **护法反哺 (`af_t3_buff_h`) 叠加标准**：在 `useGameStore` 中维护长度上限为 `25` 的 FIFO 队列 `{ val: number, expiresAt: number }`。每次触发推入 `{ val: 词缀生效值, expiresAt: now + 5000 }`（超出25个挤掉最早项）；`HeroBuff_affix` 为未过期项 `val` 之和。
```ts
BaseHero = new Decimal(10).plus(accumulatedAtk);
// HeroBasePower 为未乘 GlobalMult 的主角基础战力（供佣兵借力词缀使用，防止重复乘算！）
HeroBasePower = BaseHero.times(RealmMultiplier).times(1 + HeroBuff_affix + Sum_AllActive(af_t1_hero_a)).times(1 + 0.25 * L_rel_c_click_mult);
RawHeroClick = HeroBasePower.times(GlobalMult).times(TierDirectPenalty);
ActualHeroClickDmg = isHeroCrit ? RawHeroClick.times(HeroCritDmgMult) : RawHeroClick;
```

### 3. 单个佣兵（Slot 1~5）攻速下限与溢出转化 + 1000级直伤公式 (`D_merc(i)`)
* **攻速计算与 `0.05s` 防卡死溢出转化**：
  ```ts
  const baseInt = (i === 3 && hasInnateAffix(3, "sp_cannon_gat")) ? baseInterval * 0.5 : baseInterval;
  const spdBonus = Sum_SelfActive(af_t1_spd) + Sum_AllActive(af_t3_team_sp);
  const skill4Spd = isSkill4Active ? 1.5 : 1.0;
  const rawInterval = (baseInt * TierIntervalMult) / ((1 + spdBonus) * skill4Spd);
  const ActualInterval = Math.max(0.05, rawInterval);
  const OverflowSpdMult = rawInterval < 0.05 ? (0.05 / rawInterval) : 1.0;
  ```
* **单次直伤 6 步公式**：
  ```ts
  // Step 1: 有效等级
  EffLevel = hasInnateAffix(i, "sp_double_lvl") ? Level * 2 : Level;
  // Step 2: 基础等级面板 + 逢25级×2 + 10大词缀槽里程碑每次×4
  MilestoneCount = [10,25,50,100,200,350,500,650,800,1000].filter(m => EffLevel >= m).length;
  MilestoneMult = Decimal.pow(2, Math.floor(EffLevel / 25)).times(Decimal.pow(4, MilestoneCount));
  PanelBase = new Decimal(25 * dmgFactor * EffLevel).times(Decimal.pow(1.065, EffLevel)).plus(SharedHeroGrowth).times(MilestoneMult);
  // Step 3: 5号位汇聚 1~4 号位面板总和的 500%
  if (i === 5) PanelBase = PanelBase.plus(Sum_Slot1_to_4_PanelBase.times(5.0));
  // Step 4: 词缀加成与点名联动乘区
  PoisonScaleBonus = Math.min(50.0, Math.floor(poisonStacks / 10) * Sum_SelfActive(af_t3_p_scale));
  AffixSelfMult = 1 + Sum_SelfActive(af_t1_atk, af_t1_early_or_late, af_t2_execute, stack_bonus) + (Math.floor(EffLevel / 25) * Sum_SelfActive(af_t1_flat_lv));
  CenturyMult = Decimal.pow(1 + Sum_SelfActive(af_t2_century), Math.floor(EffLevel / 100));
  LoneWolfMult = (1 + Sum_SelfActive(af_t3_lone)) * Math.pow(0.75, Count_OtherMercsWith(af_t3_lone));
  CrossSelfSynergy = (Math.floor(Slot1EffLevel / 10) * Sum_SelfActive(af_t3_sword_s)) + (Math.floor(Slot2EffLevel / 10) * Sum_SelfActive(af_t3_tent_s)) + (Math.floor(TotalMercEffLevels / 50) * Sum_SelfActive(af_t3_total_l));
  CrossMercSynergyMult = (1 + CrossSelfSynergy + Sum_AllActive(af_t3_arr_s) * Math.floor(Slot4EffLevel / 10) + PoisonScaleBonus) * (1 + AdjacentBuff_from_Neighbors) * LoneWolfMult;
  // Step 5: 4号位光环 (1~3号位生效) + 流派专精遗物 + 主角借力（使用 HeroBasePower 防止二次乘算 GlobalMult！）
  Slot4AuraMult = (isSlot4Unlocked && i <= 3) ? (1 + (Slot4EffLevel * 0.15) * (1 + 0.08 * L_rel_r_array_buff)) : 1;
  MercRelicMult = (i === 1) ? (1 + 0.5*L_rel_r_sword_dmg) : (i === 2) ? (1 + 0.5*L_rel_r_tentacle) : (i === 3) ? (1 + 0.7*L_rel_r_cannon_dmg) : 1.0;
  HeroLinkAdd = HeroBasePower.times(Sum_SelfActive(af_t3_hero_ln));
  // Step 6: 暴击与最终汇总（含 OverflowSpdMult 攻速溢出转化）
  RawCritRate = (i === 3 ? 0.50 : 0.05) + Sum_SelfActive(af_t1_crit_r);
  MercCritRate = hasInnateAffix(i, "sp_omni_crit") ? 1.0 : Math.min(1.0, RawCritRate);
  OmniOverflowDmg = (hasInnateAffix(i, "sp_omni_crit") && RawCritRate > 1.0) ? (RawCritRate - 1.0) * 3.0 : 0;
  MercCritDmgMult = (i === 3 ? 3.00 : 1.50) + Sum_SelfActive(af_t1_crit_d) + (Math.floor(Slot3EffLevel / 10) * Sum_SelfActive(af_t3_can_s)) + (0.15 * L_rel_r_crit_dmg) + OmniOverflowDmg;
  RawMercDmg = PanelBase.times(AffixSelfMult).times(CenturyMult).times(CrossMercSynergyMult).times(Slot4AuraMult).times(MercRelicMult).times(OverflowSpdMult).plus(HeroLinkAdd).times(GlobalMult).times(TierDirectPenalty);
  if (i === 3 && currentPhase >= 6) RawMercDmg = RawMercDmg.times(3);
  const skill4Bonus = isSkill4Active ? RawHeroClick.times(0.3 * Skill4Level * (1 + 0.2 * L_rel_m_auto_skill)) : new Decimal(0);
  FinalMercDmg = (isCrit ? RawMercDmg.times(MercCritDmgMult) : RawMercDmg).plus(skill4Bonus);
  ```

### 4. 2号位【深渊触母】每秒腐蚀毒伤结算公式 (`D_poison_tick`)
```ts
TentaclePoisonBase = PanelBase_Slot2.times(1 + Sum_AllActive(af_t1_poison)).times(1 + Math.floor(Slot2EffLevel / 10) * Sum_AllActive(af_t3_tent_s)).times(1 + 0.50 * L_rel_r_tentacle).times(GlobalMult);
RawPoisonTick = TentaclePoisonBase.times(poisonStacks);
PoisonCritMult = 2.0 + (0.4 * L_rel_e_dot_crit) + (0.15 * L_rel_r_crit_dmg);
FinalPoisonTick = isPoisonCrit ? RawPoisonTick.times(PoisonCritMult) : RawPoisonTick;
```

---

## 四、 伤害转灵石与升级成本公式
1. **实时伤害转灵石（含 4号位天机阵尊 + 乾坤阵图遗物加成）**：
   ```ts
   Slot4GoldBonus = isSlot4Unlocked ? (1.5 + Slot4EffLevel * 0.05) * (1 + 0.08 * L_rel_r_array_buff) : 0;
   ΔSpiritStones = ActualDamage.times(0.5).times(1 + Slot4GoldBonus + Sum_AllActive(af_t2_gold) + 0.20 * L_rel_c_stone_gain).times(StagePenalty).times(TierStoneDebuff);
   ```
   * **`StagePenalty`（古神躯壳威压衰减）**：Phase 1~3 为 `1.0`；Phase 4~6 为 `0.6`；Phase 7~8 为 `0.3`；Phase 9~10 为 `0.1`。
2. **升级成本公式（`rel_c_cost_down` 作用于顿悟、傀儡、主动神通及佣兵升级，不作用于一次性肉身破境门坎）**：
   ```ts
   AffixDiscount = Math.min(0.75, Sum_SelfActive(af_t2_cheap));
   Cost(L) = BaseCost * ((GrowthRate + TierGrowthPenalty) ^ (L - 1)) * (1 - AffixDiscount) * (1 - 0.015 * L_rel_c_cost_down);
   ```
