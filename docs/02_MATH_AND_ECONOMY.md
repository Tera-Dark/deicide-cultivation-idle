# 02. 核心数学公式与全局伤害计算器规范 (Math & Damage Calculator - v4.1)

> **强制技术要求**：所有涉及血量、伤害、灵石、神晶的运算，必须使用 `break_infinity.js` 的 `Decimal` 类（支持高达 `1e9999` 的大数）。
> **经济防崩坏与性能铁律**：严禁主角【顿悟】出现指数级自我繁殖导致单靠点击无脑通关！主角成长受限于“阶梯线性公式 + 500 击心魔软上限 + 陡峭价格指数（`1.42^L`）”；同时主角傀儡、残影与 5 大护法均执行 **`25次/秒 (0.04s)` 攻速上限 + 超出 1:1 等比例转攻击力** 规则，保障高配构筑的性能流畅与伤害无损。

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
   // ③ 【神】阶遗物【古神之瞳 (rel_m_first_affix)】：前4个等级槽 (Index 0..3, Lv.10~Lv.100) 数值 ×(1 + 0.12 * TotalLv)
   const relicSlotBoost = (slotIdx <= 3) ? (1 + 0.12 * TotalLv(rel_m_first_affix)) : 1.0;

   // 最终生效值（注：概率类词缀汇总后封顶 100%，af_t2_cheap 单个佣兵封顶 75%，af_t2_century 单护法合计封顶 120%）
   EffectiveValue = BaseValue * tierMult * slot5Boost * innateBoost * relicSlotBoost;
   ```

---

## 三、 全局伤害与神晶计算总公式 (`damageCalc.ts`)

### 1. 全局通用乘区与遗物四大乘区 (`GlobalMult` & `getRelicPoolBreakdown`)
为彻底消除前期遗物叠乘虚高（避免十几层即碾压中后期），圣殿遗物统一归并为 **战力基础池 × 战术终伤池 × 终局复利池 × 经济减抗池** 四大核心乘区：
```ts
// TotalMercEffLevels 为所有已解锁佣兵的 EffLevel 之和（受 sp_double_lvl 翻倍影响）
Slot5GlobalMult = isSlot5Unlocked ? Decimal.pow(1.18, Math.floor(TotalMercEffLevels / 100)) : new Decimal(1);
// ★【千级共鸣 (sp_max_god)】：每有1个有效等级 >= 500 级的佣兵，全队总伤 ×2
MaxGodMult = AnyMercHas("sp_max_god") ? Decimal.pow(2.0, CountMercsEffLevelGte500) : new Decimal(1);
// ★【乾坤聚宝 (sp_gold_empire)】：灵石每有 10^N，全队伤害 +50%
stoneLog10 = Math.max(0, Math.floor(spiritStones.max(1).log10()));
GoldEmpireMult = AnyMercHas("sp_gold_empire") ? (1 + stoneLog10 * 0.5) : 1;

// ② 战术终伤池 (TacticalRelicPool —— 6 件中后期/神阶遗物同池加算，防止指数滚雪球)：
TacticalRelicPool = 1
  + Math.floor(mana / 10) * 0.002 * TotalLv(rel_y_mana_blade)                  // 化气为剑
  + ((hpRatio < 0.5 ? 0.03 : 0) + (phase >= 8 ? 0.015 : 0)) * TotalLv(rel_s_execute_dmg) // 残月断魂镰
  + stoneLog10 * 0.005 * TotalLv(rel_s_stone_surge)                             // 点石成金印
  + Math.min(2.5, manaSpentThisRun * 0.0001 * TotalLv(rel_e_void_mana))         // 混沌道海
  + unlockedMercCount * 0.04 * TotalLv(rel_m_omni_base)                         // 混沌母体
  + 0.08 * TotalLv(rel_m_god_crystal);                                          // 古神铸晶炉

// ③ 终局复利池 (InfinityRelicPool —— 长线复利增长核心)：
InfinityRelicPool = Decimal.pow(1.032, crystalLv(rel_e_inf_dmg))
  .mul(Decimal.pow(1.008, dropLv(rel_e_inf_dmg)))
  .mul(Decimal.pow(1.09, crystalLv(rel_m_final_mult)))
  .mul(Decimal.pow(1.022, dropLv(rel_m_final_mult)));

RelicGlobalMult = InfinityRelicPool.times(TacticalRelicPool);

GlobalMult = Slot5GlobalMult.times(MaxGodMult).times(GoldEmpireMult).times(RelicGlobalMult).times(TierStageDecay);
```

### 2. 【圣】阶及以上神晶获取增幅倍率 (`CrystalBonusMult`)
```ts
CrystalBonusMult = 1
  + 0.08 * TotalLv(rel_s_crystal_bless)   // 圣：圣灵聚晶塔
  + 0.12 * TotalLv(rel_e_inf_crystal)     // 仙：源初神格
  + 0.20 * TotalLv(rel_m_god_crystal);    // 神：古神铸晶炉
```
作用于所有劫数通关结算神晶奖励以及满印特限遗物的溢出转化神晶奖励。

### 3. 主角单次点击最终伤害与 `25次/秒` 自动点击溢出 (`D_click`)
* **主角暴击属性**：暴击率 `Math.min(1, 0.10 + Sum_AllActive(af_t1_hero_c))`，爆伤 `1.5 + (0.04 * TotalLv(rel_r_crit_dmg))`。
* **古神道躯突破**：法则化神 (`×120`) 之后每次突破【古神道躯】主角全伤额外 **`×10`**，让【道海叩击流】在终局能与护法体系并肩。
* **护法反哺 (`af_t3_buff_h`) 叠加标准**：在 `useGameStore` 中维护长度上限为 `25` 的 FIFO 队列 `{ val: number, expiresAt: number }`（有效期 5000ms）。
* **傀儡与残影 `25次/秒` 攻速溢出转换**：
  ```ts
  const puppetRate = Math.min(25, rawPuppetRate);
  const puppetOverflowMult = rawPuppetRate > 25 ? rawPuppetRate / 25 : 1.0;
  const cloneRate = Math.min(25, rawCloneRate);
  const cloneOverflowMult = rawCloneRate > 25 ? rawCloneRate / 25 : 1.0;
  ```
* **单次点击基础公式**：
  ```ts
  BaseHero = new Decimal(10).plus(accumulatedAtk);
  // HeroBasePower 为未乘 GlobalMult 的主角基础战力（供佣兵借力词缀使用，防止重复乘算）
  HeroBasePower = BaseHero.times(RealmMultiplier).times(1 + HeroBuff_affix + Sum_AllActive(af_t1_hero_a)).times(1 + 0.04 * TotalLv(rel_c_click_mult));
  RawHeroClick = HeroBasePower.times(GlobalMult).times(TierDirectPenalty);
  ActualHeroClickDmg = (isHeroCrit ? RawHeroClick.times(HeroCritDmgMult) : RawHeroClick).times(clickDmgMult);
  ```

### 4. 单个佣兵（Slot 1~5）`25次/秒 (0.04s)` 攻速溢出转化与直伤公式 (`D_merc(i)`)
* **攻速计算与 `25次/秒 (0.04s)` 防卡死溢出转化**：
  ```ts
  const baseInt = (i === 3 && hasInnateAffix(3, "sp_cannon_gat")) ? baseInterval * 0.5 : baseInterval;
  const spdBonus = Sum_SelfActive(af_t1_spd) + Sum_AllActive(af_t3_team_sp) + 0.02 * TotalLv(rel_r_merc_spd);
  const skill4Spd = isSkill4Active ? 1.5 : 1.0;
  const rawInterval = (baseInt * TierIntervalMult) / ((1 + spdBonus) * skill4Spd);
  const ActualInterval = Math.max(0.04, rawInterval);
  const OverflowSpdMult = rawInterval < 0.04 ? (0.04 / rawInterval) : 1.0;
  ```
* **单次直伤 6 步公式**：
  ```ts
  // Step 1: 有效等级（用于槽位解锁、里程碑 ×2、光环与跨护法联动）
  EffLevel = hasInnateAffix(i, "sp_double_lvl") ? Level * 2 : Level;
  // Step 2: 基础等级面板 + 10大词缀槽里程碑每次×2（注意：1.018^Level 按实购等级计算，防止法天象地出现1e8倍指数畸变）
  MilestoneCount = [10,25,50,100,200,350,500,650,800,1000].filter(m => EffLevel >= m).length;
  MilestoneMult = Decimal.pow(2.0, MilestoneCount);
  PanelBase = new Decimal(4 * dmgFactor * EffLevel).times(Decimal.pow(1.018, Level)).plus(SharedHeroGrowth).times(MilestoneMult);
  // Step 3: 5号位汇聚 1~4 号位面板总和的 1000%
  if (i === 5) PanelBase = PanelBase.plus(Sum_Slot1_to_4_PanelBase.times(10.0));
  // Step 4: 词缀加成与点名联动乘区（百炼成仙单护法整百比率封顶 1.20，以毒攻毒封顶 12.0）
  PoisonScaleBonus = Math.min(12.0, Math.floor(poisonStacks / 10) * Sum_SelfActive(af_t3_p_scale));
  AffixSelfMult = 1 + Sum_SelfActive(af_t1_atk, af_t1_early_or_late, af_t2_execute, stack_bonus) + (Math.floor(EffLevel / 25) * Sum_SelfActive(af_t1_flat_lv));
  CenturyRatio = Math.min(1.2, Sum_SelfActive(af_t2_century));
  CenturyMult = Decimal.pow(1 + CenturyRatio, Math.floor(EffLevel / 100));
  LoneWolfMult = (1 + Sum_SelfActive(af_t3_lone)) * Math.pow(0.75, Count_OtherMercsWith(af_t3_lone));
  CrossSelfSynergy = (Math.floor(Slot1EffLevel / 10) * Sum_SelfActive(af_t3_sword_s)) + (Math.floor(Slot2EffLevel / 10) * Sum_SelfActive(af_t3_tent_s)) + (Math.floor(TotalMercEffLevels / 50) * Sum_SelfActive(af_t3_total_l));
  CrossMercSynergyMult = (1 + CrossSelfSynergy + Sum_AllActive(af_t3_arr_s) * Math.floor(Slot4EffLevel / 10) + PoisonScaleBonus) * (1 + AdjacentBuff_from_Neighbors) * LoneWolfMult;
  // Step 5: 4号位光环 (1~3号位生效) + ① 战力基础池（磨剑石碑与专精遗物同池加算）+ 主角借力
  Slot4AuraMult = (isSlot4Unlocked && i <= 3) ? (1 + (Slot4EffLevel * 0.06) * (1 + 0.03 * TotalLv(rel_r_array_buff))) : 1;
  SpecPct = i === 1 ? 0.05 * TotalLv(rel_r_sword_dmg) : i === 2 ? 0.05 * TotalLv(rel_r_tentacle) : i === 3 ? 0.05 * TotalLv(rel_r_cannon_dmg) : 0;
  MercRelicMult = 1 + 0.03 * TotalLv(rel_c_merc_atk) + SpecPct;
  HeroLinkAdd = HeroBasePower.times(Sum_SelfActive(af_t3_hero_ln));
  // Step 6: 暴击与超百溢出转化（含 sp_omni_crit 1:3 与 破绽罗盘 rel_r_merc_crit 1:2）
  RawCritRate = (i === 3 ? 0.50 : 0.05) + Sum_SelfActive(af_t1_crit_r) + 0.01 * TotalLv(rel_r_merc_crit);
  MercCritRate = hasInnateAffix(i, "sp_omni_crit") ? 1.0 : Math.min(1.0, RawCritRate);
  critOverflowScale = hasInnateAffix(i, "sp_omni_crit") ? 3.0 : (TotalLv(rel_r_merc_crit) > 0 ? 2.0 : 0);
  OmniOverflowDmg = (critOverflowScale > 0 && RawCritRate > 1.0) ? (RawCritRate - 1.0) * critOverflowScale : 0;
  MercCritDmgMult = (i === 3 ? 3.00 : 1.50) + Sum_SelfActive(af_t1_crit_d) + (Math.floor(Slot3EffLevel / 10) * Sum_SelfActive(af_t3_can_s)) + (0.04 * TotalLv(rel_r_crit_dmg)) + OmniOverflowDmg;
  RawMercDmg = PanelBase.times(AffixSelfMult).times(CenturyMult).times(CrossMercSynergyMult).times(Slot4AuraMult).times(MercRelicMult).times(OverflowSpdMult).plus(HeroLinkAdd).times(GlobalMult).times(TierDirectPenalty);
  if (i === 3 && currentPhase >= 6) RawMercDmg = RawMercDmg.times(3);
  const skill4Bonus = isSkill4Active ? RawHeroClick.times(0.3 * Skill4Level * (1 + 0.15 * TotalLv(rel_m_auto_skill))) : new Decimal(0);
  FinalMercDmg = (isCrit ? RawMercDmg.times(MercCritDmgMult) : RawMercDmg).plus(skill4Bonus);
  ```

### 5. 2号位【深渊触母】每秒腐蚀毒伤结算公式 (`D_poison_tick`)
*(毒层上限 `MAX_POISON_STACKS = 3500`，本命 ★【万毒之源】每击 `+2%`；同步引入 `CenturyMult` 与同池加算的 `PoisonRelicPool`，使毒伤与其他构筑处于同一量级竞赛。)*
```ts
PoisonBasePanel = new Decimal(4 * 0.45 * Slot2EffLevel).times(Decimal.pow(1.018, Slot2Level)).plus(SharedHeroGrowth).times(MilestoneMult);
PoisonRelicPool = 1 + 0.03 * TotalLv(rel_c_merc_atk) + 0.05 * TotalLv(rel_r_tentacle);
TentaclePoisonBase = PoisonBasePanel.times(1 + Sum_AllActive(af_t1_poison)).times(1 + Math.floor(Slot2EffLevel / 10) * Sum_AllActive(af_t3_tent_s)).times(CenturyMult).times(PoisonRelicPool).times(GlobalMult);
RawPoisonTick = TentaclePoisonBase.times(poisonStacks);
PoisonCritChance = Math.min(1, 0.25 + 0.03 * TotalLv(rel_e_dot_crit));
PoisonCritMult = 1.6 + (0.20 * TotalLv(rel_e_dot_crit)) + (0.04 * TotalLv(rel_r_crit_dmg));
FinalPoisonTick = isPoisonCrit ? RawPoisonTick.times(PoisonCritMult) : RawPoisonTick;
```

---

## 四、 伤害转灵石与升级成本公式
1. **实时伤害转灵石（含 4号位天机阵尊 + 乾坤阵图 + 聚财铜钱）**：
   ```ts
   Slot4GoldBonus = isSlot4Unlocked ? (1.2 + Slot4EffLevel * 0.04) * (1 + 0.03 * TotalLv(rel_r_array_buff)) : 0;
   ΔSpiritStones = ActualDamage.times(0.15).times(1 + Slot4GoldBonus + Sum_AllActive(af_t2_gold) + 0.04 * TotalLv(rel_c_stone_gain)).times(StagePenalty).times(TierStoneDebuff);
   ```
   * **`StagePenalty`（古神躯壳威压衰减）**：Phase 1~3 为 `1.0`；Phase 4~6 为 `0.75`；Phase 7~8 为 `0.55`；Phase 9~10 为 `0.35`。
2. **升级成本公式（`rel_c_cost_down` 作用于顿悟、傀儡、主动神通及佣兵升级，不作用于一次性肉身破境门坎）**：
   ```ts
   AffixDiscount = Math.min(0.75, Sum_SelfActive(af_t2_cheap));
   Cost(L) = BaseCost * ((GrowthRate + TierGrowthPenalty) ^ (L - 1)) * (1 - AffixDiscount) * Math.max(0.55, 1 - 0.0075 * TotalLv(rel_c_cost_down));
   ```
