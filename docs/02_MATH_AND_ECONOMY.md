# 02. 核心数学公式与全局伤害计算器规范 (Math & Damage Calculator - v4.1)

> **强制技术要求**：所有涉及血量、伤害、灵石、神晶的运算，必须使用 `break_infinity.js` 的 `Decimal` 类（支持高达 `1e9999` 的大数）。
> **经济防崩坏与性能铁律**：严禁主角【顿悟】出现指数级自我繁殖导致单靠点击无脑通关！主角成长受限于“阶梯线性公式 + 500 击心魔软上限 + 陡峭价格指数（`1.42^L`）”；同时主角傀儡、残影与 5 大护法均执行 **`25次/秒 (0.04s)` 攻击间隔上限 + 超出 1:1 等比例转攻击力** 规则。注意：该上限只封顶**间隔驱动攻击**，单次攻击可拆多段命中，点击联动/机神充能也会追加攻击事件，因此 HUD 必须分别显示“攻击事件/秒”与“命中事件/秒”。

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
2. **三大放大倍率相乘（复利词缀例外）**：
   ```ts
   // 复利词缀（af_t2_century）品质倍率开平方，且不吃 5 号位放大
   const isCompound = cfg.tierScaling === 'sqrt';
   const tierMult = isCompound ? Math.sqrt(tierMeta.mult) : tierMeta.mult;
   // ① 5号位【混沌古神嗣】天赋②：只要已解锁上阵，全队非复利词缀数值 ×1.5
   const slot5Boost = isSlot5Unlocked && !isCompound ? 1.5 : 1.0;
   // ② 本命神通 ★【道纹升华 (sp_affix_boost)】：若该佣兵自带此本命词缀，自身10个等级槽数值 ×2.0
   const innateBoost = hasInnateAffix(i, "sp_affix_boost") ? 2.0 : 1.0;
   // ③ 【神】阶遗物【古神之瞳 (rel_m_first_affix)】：前4个等级槽 (Index 0..3, Lv.10~Lv.100) 数值 ×(1 + 0.10 * TotalLv)
   //    复利词缀（tierScaling: 'sqrt'）不吃古神瞳放大，避免百炼成仙被遗物二次复利
   const relicSlotBoost = (slotIdx <= 3 && !isCompound) ? (1 + 0.10 * TotalLv(rel_m_first_affix)) : 1.0;

   // 最终生效值（注：概率类词缀汇总后封顶 100%，af_t2_cheap 单个佣兵封顶 75%，af_t2_century 单护法合计封顶 90%）
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
  + Math.min(2.5, stoneLog10 * 0.005 * TotalLv(rel_s_stone_surge))              // 点石成金印（封顶 +250%）
  + Math.min(2.5, manaSpentThisRun * 0.0001 * TotalLv(rel_e_void_mana))         // 混沌道海
  + unlockedMercCount * 0.04 * TotalLv(rel_m_omni_base)                         // 混沌母体
  + 0.08 * TotalLv(rel_m_god_crystal);                                          // 古神铸晶炉

// ③ 终局复利池 (InfinityRelicPool —— 长线复利增长核心)：
InfinityRelicPool = Decimal.pow(1.025, crystalLv(rel_e_inf_dmg))
  .mul(Decimal.pow(1.006, dropLv(rel_e_inf_dmg)))
  .mul(Decimal.pow(1.07, crystalLv(rel_m_final_mult)))
  .mul(Decimal.pow(1.015, dropLv(rel_m_final_mult)));

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
* **傀儡与残影 `25次/秒` 攻击事件溢出转换**：
  ```ts
  const puppetRate = Math.min(25, rawPuppetRate);
  const puppetOverflowMult = rawPuppetRate > 25 ? rawPuppetRate / 25 : 1.0;
  const cloneRate = Math.min(25, rawCloneRate);
  const cloneOverflowMult = rawCloneRate > 25 ? rawCloneRate / 25 : 1.0;
  ```
  * 口径：`puppetRate` / `cloneRate` 是真实点击事件数；`*OverflowMult` 只放大单次伤害，**不增加点击事件**。点击联动（每 12 / 20 / 10 次）按真实事件数结算，不按溢出后的伤害倍率结算。
* **单次点击基础公式**：
  ```ts
  BaseHero = new Decimal(10).plus(accumulatedAtk);
  // HeroBasePower 为未乘 GlobalMult 的主角基础战力（供佣兵借力词缀使用，防止重复乘算）
  HeroBasePower = BaseHero.times(RealmMultiplier).times(1 + HeroBuff_affix + Sum_AllActive(af_t1_hero_a)).times(1 + 0.04 * TotalLv(rel_c_click_mult));
  RawHeroClick = HeroBasePower.times(GlobalMult).times(TierDirectPenalty);
  ActualHeroClickDmg = (isHeroCrit ? RawHeroClick.times(HeroCritDmgMult) : RawHeroClick).times(clickDmgMult);
  ```

### 4. 单个佣兵（Slot 1~5）`25次/秒 (0.04s)` 攻击间隔溢出转化与直伤公式 (`D_merc(i)`)
* **攻击 vs 命中口径（v3.9 铁律）**：
  * `25/s` 只封顶**间隔驱动攻击**；点击联动（伴生剑意/御剑随心/万道合击）与机神充能追加的是额外攻击事件，另计。
  * 每次【攻击】触发一次的效果（机神充能、雷火装填、天降横财、汲灵反哺、护法反哺）必须写在 `executeMercAttack` 的攻击层，**严禁写进命中循环**。
  * 天降横财另有独立令牌桶：每秒最多 `5` 次全额 + `5` 次 `20%` 折算，超出直接丢弃，防止高攻速把灵石经济打成无限。
  * 每次【命中】触发的效果（毒爆共鸣、万毒催熟）保留在命中循环，按 `totalHits` 结算。
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
  // Step 4: 词缀加成与点名联动乘区（每条联动单独封顶，避免千级线性层数滚成数十倍）
  // 以毒攻毒仅 2号位触母生效，封顶 +600%
  PoisonScaleBonus = (i === 2) ? Math.min(6.0, Math.floor(poisonStacks / 10) * Sum_SelfActive(af_t3_p_scale)) : 0;
  AffixSelfMult = 1 + Sum_SelfActive(af_t1_atk, af_t1_early_or_late, af_t2_execute, stack_bonus) + Math.min(3.0, Math.floor(EffLevel / 25) * Sum_SelfActive(af_t1_flat_lv));
  // 百炼成仙改为线性：1 + 比率 × 整百层数，单护法整百比率合计封顶 +90%（Lv.1000 最多 ×10）
  CenturyRatio = Math.min(0.9, Sum_SelfActive(af_t2_century));
  CenturyMult = new Decimal(1 + CenturyRatio * Math.floor(EffLevel / 100));
  // 唯我独尊：自身 ×(1+比率)，其他 4 人每人 ×0.85
  LoneWolfMult = (1 + Sum_SelfActive(af_t3_lone)) * Math.pow(0.85, Count_OtherMercsWith(af_t3_lone));
  // 点名联动：剑道宗师/深渊共生/重火协同各自仅对本人生效，且每条封顶 +300%；万仙来朝封顶 +200%
  SwordSynergy = (i === 1) ? Math.min(3.0, Math.floor(Slot1EffLevel / 10) * Sum_SelfActive(af_t3_sword_s)) : 0;
  TentacleSynergy = (i === 2) ? Math.min(3.0, Math.floor(Slot2EffLevel / 10) * Sum_SelfActive(af_t3_tent_s)) : 0;
  TotalLevelSynergy = Math.min(2.0, Math.floor(TotalMercEffLevels / 50) * Sum_SelfActive(af_t3_total_l));
  CrossSelfSynergy = SwordSynergy + TentacleSynergy + TotalLevelSynergy;
  // 阵道加持仅 4号位阵尊生效，全队合计封顶 +300%；左右逢源改为其他 4 人并封顶 +300%
  ArrayTeamBonus = (isSlot4Unlocked) ? Math.min(3.0, Sum_SelfActive_OnSlot4(af_t3_arr_s) * Math.floor(Slot4EffLevel / 10)) : 0;
  CrossMercSynergyMult = (1 + CrossSelfSynergy + ArrayTeamBonus + PoisonScaleBonus) * (1 + Math.min(3.0, TeamAdjacentBuff)) * LoneWolfMult;
  // Step 5: 4号位光环 (1~3号位生效) + ① 战力基础池（磨剑石碑与专精遗物同池加算）+ 主角借力
  Slot4AuraMult = (isSlot4Unlocked && i <= 3) ? (1 + (Slot4EffLevel * 0.02) * (1 + 0.02 * TotalLv(rel_r_array_buff))) : 1;
  SpecPct = i === 1 ? 0.07 * TotalLv(rel_r_sword_dmg) : i === 2 ? 0.07 * TotalLv(rel_r_tentacle) : i === 3 ? 0.04 * TotalLv(rel_r_cannon_dmg) : 0;
  MercRelicMult = 1 + 0.025 * TotalLv(rel_c_merc_atk) + SpecPct;
  HeroLinkAdd = HeroBasePower.times(Sum_SelfActive(af_t3_hero_ln));
  // Step 6: 暴击与超百溢出转化（含 sp_omni_crit 1:3 与 破绽罗盘 rel_r_merc_crit 1:2）
  RawCritRate = (i === 3 ? 0.50 : 0.05) + Sum_SelfActive(af_t1_crit_r) + 0.01 * TotalLv(rel_r_merc_crit);
  MercCritRate = hasInnateAffix(i, "sp_omni_crit") ? 1.0 : Math.min(1.0, RawCritRate);
  critOverflowScale = hasInnateAffix(i, "sp_omni_crit") ? 3.0 : (TotalLv(rel_r_merc_crit) > 0 ? 2.0 : 0);
  OmniOverflowDmg = (critOverflowScale > 0 && RawCritRate > 1.0) ? (RawCritRate - 1.0) * critOverflowScale : 0;
  MercCritDmgMult = (i === 3 ? 3.00 : 1.50) + Sum_SelfActive(af_t1_crit_d) + ((i === 3) ? Math.min(3.0, Math.floor(Slot3EffLevel / 10) * Sum_SelfActive(af_t3_can_s)) : 0) + (0.04 * TotalLv(rel_r_crit_dmg)) + OmniOverflowDmg;
  RawMercDmg = (PanelBase.times(AffixSelfMult).times(CenturyMult).times(CrossMercSynergyMult).times(Slot4AuraMult).times(MercRelicMult).plus(HeroLinkAdd)).times(OverflowSpdMult).times(GlobalMult).times(TierDirectPenalty);
  if (i === 3 && currentPhase >= 6) RawMercDmg = RawMercDmg.times(2.25);
  const skill4Bonus = isSkill4Active ? RawHeroClick.times(0.3 * Skill4Level * (1 + 0.15 * TotalLv(rel_m_auto_skill))) : new Decimal(0);
  FinalMercDmg = (isCrit ? RawMercDmg.times(MercCritDmgMult) : RawMercDmg).plus(skill4Bonus);
  ```

### 5. 2号位【深渊触母】每秒腐蚀毒伤结算公式 (`D_poison_tick`)
*(毒层上限 `MAX_POISON_STACKS = 3500`，本命 ★【万毒之源】每击 `+2%`；同步引入 `CenturyMult` 与同池加算的 `PoisonRelicPool`，使毒伤与其他构筑处于同一量级竞赛。)*
```ts
PoisonBasePanel = new Decimal(4 * 0.65 * Slot2EffLevel).times(Decimal.pow(1.018, Slot2Level)).plus(SharedHeroGrowth).times(MilestoneMult);
PoisonRelicPool = 1 + 0.025 * TotalLv(rel_c_merc_atk) + 0.07 * TotalLv(rel_r_tentacle);
TentaclePoisonBase = PoisonBasePanel.times(1 + Sum_AllActive(af_t1_poison)).times(1 + Math.floor(Slot2EffLevel / 10) * Sum_AllActive(af_t3_tent_s)).times(CenturyMult).times(PoisonRelicPool).times(GlobalMult);
RawPoisonTick = TentaclePoisonBase.times(Math.pow(poisonStacks, 0.75)); // 亚线性：压制前期 3500× 免费乘区
PoisonCritChance = Math.min(1, 0.25 + 0.03 * TotalLv(rel_e_dot_crit));
PoisonCritMult = 1.6 + (0.20 * TotalLv(rel_e_dot_crit)) + (0.04 * TotalLv(rel_r_crit_dmg));
FinalPoisonTick = isPoisonCrit ? RawPoisonTick.times(PoisonCritMult) : RawPoisonTick;
```
* **毒层指数**：`POISON_STACK_EXPONENT = 0.75`（定义于 `config/constants.ts`）。毒爆/万毒催熟引用同一 `rawPoison`，因此同步享受亚线性收敛。

### 6. 统一伤害分解与 HUD/离线口径 (`getTeamCombatDpsBreakdown`)
为消除“HUD 少算、离线偏低”的双口径，所有秒伤展示、构筑归因、洗练预览与离线推进统一读取：
```ts
TotalDps = 主角点击 + 5 护法基础直伤 + 毒持续 + 毒爆/催熟
         + 点击联动（伴生剑意 + 御剑随心 + 万道合击）
         + 机神充能追加攻击
```
* `attacksPerSec`：护法攻击事件/秒（间隔驱动 + 点击联动 + 充能）。机神充能（15 次攻击 + 雷火装填）合计封顶 `1.0 秒冷却/秒`，即最多使机神攻速翻倍。
* `clickLinkBySlot` / `clickStormBySlot`：点击联动与万道合击按护法归因，用于平衡审计，避免把机神的高单发收益藏在“点击联动”里。
* `hitsPerSec`：护法命中事件/秒（单次攻击可拆 5~9 段，因此可显著高于 25）。
* 离线结算直接使用 `TotalDps × OFFLINE_EFFICIENCY`，不再另设系数或漏项。

---

## 四、 伤害转灵石与升级成本公式
1. **实时伤害转灵石（含 4号位天机阵尊 + 乾坤阵图 + 聚财铜钱）**：
   ```ts
   Slot4GoldBonus = isSlot4Unlocked ? (1.2 + Slot4EffLevel * 0.04) * (1 + 0.02 * TotalLv(rel_r_array_buff)) : 0;
   ΔSpiritStones = ActualDamage.times(0.15).times(1 + Slot4GoldBonus + Sum_AllActive(af_t2_gold) + 0.04 * TotalLv(rel_c_stone_gain)).times(StagePenalty).times(TierStoneDebuff).times(AdStoneBoost);
   ```
   * **`StagePenalty`（古神躯壳威压衰减）**：Phase 1~3 为 `1.0`；Phase 4~6 为 `0.75`；Phase 7~8 为 `0.55`；Phase 9~10 为 `0.35`。
   * **`AdStoneBoost`（广告灵石加速）**：在线观看激励广告后 `×2`，持续 `10` 分钟，每日最多 `5` 次且不可叠加；离线结算显式固定 `1.0`，防止挂机前看一次广告白嫖整段离线。
2. **升级成本公式（`rel_c_cost_down` 作用于顿悟、傀儡、主动神通及佣兵升级，不作用于一次性肉身破境门坎）**：
   ```ts
   AffixDiscount = Math.min(0.75, Sum_SelfActive(af_t2_cheap));
   Cost(L) = BaseCost * ((GrowthRate + TierGrowthPenalty) ^ (L - 1)) * (1 - AffixDiscount) * Math.max(0.55, 1 - 0.0075 * TotalLv(rel_c_cost_down));
   ```

---

## 五、 词缀石经济模型 (`v3.8`)

词缀石不再是「每重躯壳固定掉落」，而是由**劫数期望 × 躯壳深度权重 × 封顶加成**三部分构成，统一实现在 `core/damageCalc.ts`：

```ts
// 1. 躯壳深度权重（BOSS_SHELLS.baseAffixStones 除以权重均值 4）
DepthWeight(phase) = BOSS_SHELLS[phase].baseAffixStones / 4;          // 0.25 ~ 2.50

// 2. 遗物/词缀加成（乘法、分别封顶）
EssencePct  = min(150, 4 * TotalLv(rel_r_essence));                  // 贪婪触须
AffixPct    = min(100, 100 * Sum_AllActive(af_t2_stone_p));           // 寻宝天眼（全队合计）
StoneMult   = 1 + (EssencePct + AffixPct) / 100;                      // 上限 3.5×

// 3. 单次破壳期望与取整
Expected(phase) = Tribulation.stonePerShell * DepthWeight(phase) * StoneMult;
Drops(phase)    = floor(Expected) + (random() < Expected - floor(Expected) ? 1 : 0);
```

| 劫数 | `stonePerShell` | 全通期望 | 单槽洗练阶梯 | 批量洗练阶梯 |
| :--- | :--- | :--- | :--- | :--- |
| 劫一 | `0.40` | `4` | `2` | `1` |
| 劫二 | `0.55` | `5.5` | `2` | `1` |
| 劫三 | `0.70` | `7` | `2` | `1` |
| 劫四 | `0.90` | `9` | `4` | `2` |
| 劫五 | `1.00` | `10`（+首通 `50`） | `4` | `2` |
| 劫六 | `1.10` | `11` | `4` | `2` |
| 劫七 | `1.25` | `12.5` | `7` | `3` |
| 劫八 | `1.40` | `14` | `7` | `3` |
| 劫九 | `1.60` | `16` | `7` | `3` |
| 劫十 | `2.00` | `20` | `12` | `5` |

* **消耗口径**：单槽洗练按槽位阶梯计价（`Lv.10 ~ Lv.1000`），批量洗练对每个未锁槽位按较低阶梯计价，且**不享受【命运骰子】免单**（免单封顶 `50%`，仅单槽）。
* **沉淀池（道纹淬炼）**：凡→良 `8`、良→上 `25`、上→极 `70`、极→仙 `220` 颗，**必定提升一阶**，四人 40 槽淬满共 `12,920` 颗，构成终局确定性长线目标。
* **离口径一致**：在线破壳、离线普通推进、离线 SSS 扫荡三处统一调用同一套期望函数，禁止再出现硬编码掉落数字。
* **目标曲线**：全 40 槽洗到「极品(紫)+」约 `1,100` 颗（≈ `57` 次劫十全通）；追指定「仙品(金)」约 `1.38e5` 颗，构成终局长线目标。
