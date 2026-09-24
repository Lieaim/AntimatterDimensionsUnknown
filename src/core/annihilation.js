import { DC } from "./constants";
import { GameEnd } from "./celestials/pelle/game-end";
import { NG } from "./new-game";
import { Quotes } from "./celestials/quotes";

const DIMENSION_COSTS = [
  DC.D1,
  new Decimal(10),
  new Decimal(250),
  new Decimal("1e4"),
  DC.E6,
  new Decimal("1e24"),
  DC.E100,
  new Decimal("1e3003"),
];

const INFINITY_COLUMN_UPGRADES = [
  ["timeMult", "18Mult", "36Mult", "resetBoost"],
  [],
  [],
  [],
];

const INFINITY_COLUMN_COSTS = [DC.E15];
const FIRST_ANNIHILATION_ANTIMATTER = new Decimal("9e9e15");
const NON_DOOMED_ANTIMATTER_CAP = new Decimal("1e9e15");
export const BASE_ANNIHILATION_MATTER_EXPONENT = 0.7;

const MATTER_MILESTONES = [
  { antimatter: FIRST_ANNIHILATION_ANTIMATTER, matter: DC.D1 },
];

// The first Annihilation always grants its fixed 1 Matter reward. These are the caps for
// Annihilations 2-5: the old second-reset cap is doubled and the later caps are multiplied by ten.
const MATTER_GAIN_CAPS = [undefined, new Decimal(20), new Decimal(2500), new Decimal("1e5"), new Decimal("1e7")];

// Reality Perks visible in the QOL2 reference image. They are retained through Annihilation once QOL2 is bought.
const QOL2_PERMANENT_REALITY_PERKS = [
  0, 31, 40, 41, 42, 43, 52, 53, 54, 55, 56, 57, 60, 61, 62, 70, 71, 72, 73, 80,
  100, 104, 105, 106, 107, 201, 202, 203, 204, 205,
];

// Dimension multipliers are cached. Annihilation power is permanent, so it must be restored whenever a reset
// replaces the Dimension state before production starts again.
function reapplyAnnihilatedDimensionPower() {
  GameCache.antimatterDimensionFinalMultipliers.invalidate();
}

function removeLegacyAutoAchievements() {
  if (player.annihilation.legacyAutoAchievementsCleared) return;
  for (const id of Array.range(181, 8)) Achievement(id).lock();
  player.annihilation.legacyAutoAchievementsCleared = true;
}

const PERK_CONFIG = [
  {
    id: 1,
    label: "START",
    description: "Every Perk bought makes Galaxies 1% stronger and delays Distant and Remote Galaxy scaling, " +
      "and also have a free 5× game speed multiplier",
    prerequisites: [],
  },
  {
    id: 2, label: "QOL1", description: "Eternity Dimension Autobuyers are always unlocked", prerequisites: [1]
  },
  {
    id: 3,
    label: "PR1",
    description: "Glyph levels are 10% easier to get and Reality Machine gain is multiplied by 1e6",
    prerequisites: [1],
  },
  { id: 4, label: "SP1", description: "Dilation Upgrade Autobuyers are always unlocked", prerequisites: [1] },
  { id: 5, label: "QOL2", description: "Keep some Reality Perks permanently", prerequisites: [2] },
  { id: 6, label: "PR2", description: "Reality Glyphs can be created up to level 35,000", prerequisites: [3] },
  { id: 7, label: "SP2", description: "Remove the extra requirements on Reality Upgrades", prerequisites: [4] },
  {
    id: 8,
    label: "ULT1",
    description: "Keep all Reality Perks permanently, create Reality Glyphs up to level 50,000, " +
      "and generate Tachyon Particles outside Dilation",
    prerequisites: [5, 6, 7],
  },
];

export function formatAnnihilation(value, places = 2, placesUnder1000 = 0) {
  return Notations.current.format(value, places, placesUnder1000, 3);
}

export const Annihilation = {
  get perkStates() {
    if (!Array.isArray(player.annihilation.perks)) player.annihilation.perks = Array.repeat(false, PERK_CONFIG.length);
    return player.annihilation.perks;
  },

  perkConfig(id) {
    return PERK_CONFIG[id - 1];
  },

  isPerkBought(id) {
    return this.perkStates[id - 1] === true;
  },

  get boughtPerkCount() {
    return this.perkStates.countWhere(Boolean);
  },

  get availablePerks() {
    return Math.max(this.power - this.boughtPerkCount, 0);
  },

  canBuyPerk(id) {
    const config = this.perkConfig(id);
    return config !== undefined && !this.isPerkBought(id) && this.availablePerks >= 1 &&
      config.prerequisites.every(prerequisite => this.isPerkBought(prerequisite));
  },

  buyPerk(id) {
    if (!this.canBuyPerk(id)) return false;
    player.annihilation.perks[id - 1] = true;
    GameUI.update();
    return true;
  },

  get galaxyStrength() {
    const perkStrength = this.isPerkBought(1) ? Math.pow(1.01, this.boughtPerkCount) : 1;
    return perkStrength * (Achievement(192).isUnlocked ? 1.025 : 1);
  },

  get gameSpeedMultiplier() {
    return this.isPerkBought(1) ? 5 : 1;
  },

  get firstMilestoneGameSpeedMultiplier() {
    if (this.power < 1) return 1;
    return Math.pow(2, this.firstMilestoneGameSpeedPower);
  },

  get firstMilestoneGameSpeedPower() {
    if (this.power < 1) return 0;
    return 1 + 0.01 * Math.min(this.power, 25);
  },

  get distantGalaxyScalingDelay() {
    return 10 * this.boughtPerkCount;
  },

  get remoteGalaxyScalingDelay() {
    return 15 * this.boughtPerkCount;
  },

  get matter() {
    return player.annihilation.matter;
  },

  get isUnlocked() {
    return player.annihilation.unlocked || GameEnd.creditsEverClosed;
  },

  get power() {
    return player.annihilation.power;
  },

  get destructionPower() {
    // Saves created before Destruction Power existed do not have this field yet.
    if (player.annihilation.destructionPower === undefined) player.annihilation.destructionPower = DC.D0;
    return player.annihilation.destructionPower;
  },

  addDestructionPower(amount) {
    player.annihilation.destructionPower = this.destructionPower.plus(amount);
  },

  get hasAnnihilated() {
    return this.power > 0;
  },

  // Each point is fully effective through 10 Power. In every later 10× range, each additional
  // point contributes 4× less exponent than it did in the preceding range. The segments join
  // continuously: 1 Power gives ^2, 2 Power gives ^3, and 10 Power gives ^11.
  get destructionPowerPlaytimeExponent() {
    const power = this.destructionPower;
    if (power.lte(0)) return 1;
    if (power.lte(10)) return 1 + power.toNumber();

    let contribution = 10;
    let lowerBound = 10;
    let contributionPerPower = 1 / 4;
    // The cap keeps this JavaScript-number exponent safe even if the player eventually reaches
    // extraordinarily large Decimal values. The resulting Decimal multiplier remains enormous.
    while (contribution < 1e6) {
      const upperBound = lowerBound * 10;
      if (power.lte(upperBound)) {
        return Math.min(1e6, 1 + contribution + power.minus(lowerBound).toNumber() * contributionPerPower);
      }
      contribution += (upperBound - lowerBound) * contributionPerPower;
      lowerBound = upperBound;
      contributionPerPower /= 4;
    }
    return 1e6;
  },

  // This uses real seconds played so Black Hole speed and offline game-time multipliers cannot inflate it.
  // Clamp at two seconds: log2(2) is 1, keeping the boost safe on a brand-new save. Destruction
  // Power then raises this whole playtime multiplier to its progressively softened exponent.
  get dimensionPlaytimeMultiplier() {
    const secondsPlayed = Math.max(player.records.realTimePlayed / 1000, 2);
    return new Decimal(Math.max(1, Math.log2(secondsPlayed)))
      .pow(this.destructionPowerPlaytimeExponent)
      .clampMax(Decimal.dSafeMax);
  },

  get realityMachineMultiplier() {
    return (this.hasAnnihilated ? 10 : 1) * (this.isPerkBought(3) ? 1e6 : 1);
  },

  get imaginaryMachineMultiplier() {
    return this.hasAnnihilated ? 10 : 1;
  },

  get perkPointMultiplier() {
    return this.hasAnnihilated ? 5 : 2;
  },

  get blackHolePowerExponent() {
    return this.hasAnnihilated ? 1.1 : 1;
  },

  get glyphLevelMultiplier() {
    return this.hasAnnihilated ? 1.1 : 1.05;
  },

  get glyphLevelGainMultiplier() {
    const baseMultiplier = this.hasAnnihilated ? 1.25 : 1.1;
    return baseMultiplier * (this.isPerkBought(3) ? 1.1 : 1);
  },

  get realityGlyphLevelCap() {
    if (this.isPerkBought(8)) return 50000;
    if (this.isPerkBought(6)) return 35000;
    return Ra.alchemyResourceCap;
  },

  get realityPerksToKeep() {
    const boughtPerks = [...player.reality.perks];
    if (this.isPerkBought(8)) return boughtPerks;
    return this.isPerkBought(5)
      ? boughtPerks.filter(id => QOL2_PERMANENT_REALITY_PERKS.includes(id))
      : [];
  },

  restoreRealityPerks(perkIds) {
    for (const id of perkIds) {
      const perk = Perks.find(id);
      if (perk === undefined || player.reality.perks.has(id)) continue;
      player.reality.perks.add(id);
      perk.onPurchased();
    }
  },

  // Reality Resource deliberately keeps its normal cap; all other Alchemy Resources use this multiplier.
  get alchemyResourceCapMultiplier() {
    return this.hasAnnihilated ? 3 : 2;
  },

  get glyphRefinementMultiplier() {
    return this.hasAnnihilated ? 100 : 5;
  },

  get tachyonParticleMultiplier() {
    return this.hasAnnihilated ? 25 : 5;
  },

  get dilatedTimeMultiplier() {
    return this.hasAnnihilated ? 25 : 5;
  },

  get dilatedTimeUpgradeMultiplier() {
    return this.hasAnnihilated ? 3 : 2.5;
  },

  get firstResetRequirement() {
    return FIRST_ANNIHILATION_ANTIMATTER;
  },

  get antimatterCap() {
    // The cap holds through the entire non-doomed game, including after Annihilation.
    // A Doomed Reality is the one place where Antimatter may progress beyond it.
    return Pelle.isDoomed ? Decimal.dSafeMax : NON_DOOMED_ANTIMATTER_CAP;
  },

  get resetRequirement() {
    if (this.hasAnnihilated || Pelle.isDoomed) return MATTER_MILESTONES[0].antimatter;
    // The non-doomed Antimatter cap must still allow the very first Annihilation.
    return Decimal.min(this.firstResetRequirement, this.antimatterCap);
  },

  get canReset() {
    return this.isUnlocked && Currency.antimatter.gte(this.resetRequirement);
  },

  get matterExponent() {
    return BASE_ANNIHILATION_MATTER_EXPONENT;
  },

  matterGainFrom(antimatter) {
    const firstMilestone = MATTER_MILESTONES[0];
    if (antimatter.lt(firstMilestone.antimatter)) return DC.D0;
    return firstMilestone.matter.times(antimatter.div(firstMilestone.antimatter).pow(this.matterExponent));
  },

  get matterGain() {
    if (!this.hasAnnihilated) return DC.D1;
    const cap = MATTER_GAIN_CAPS[this.power];
    return cap === undefined
      ? this.matterGainFrom(Currency.antimatter.value)
      : Decimal.min(this.matterGainFrom(Currency.antimatter.value), cap);
  },

  get dimensionCount() {
    return player.annihilation.dimensions.filter(Boolean).length;
  },

  isDimensionAnnihilated(tier) {
    return player.annihilation.dimensions[tier - 1] === true;
  },

  hasDimensionContinuum(tier) {
    return tier === 1 && this.isDimensionAnnihilated(1);
  },

  isInfinityColumnAnnihilated(column) {
    return player.annihilation.infinityColumns[column] === true;
  },

  get infinityUpgradeCount() {
    return player.annihilation.infinityColumns
      .map((isAnnihilated, column) => (isAnnihilated ? INFINITY_COLUMN_UPGRADES[column].length : 0))
      .sum();
  },

  get antimatterDimensionPower() {
    // Each annihilated Dimension doubles the base Annihilation exponent: 2, 4, 8, 16, ...
    return 2 ** this.dimensionCount;
  },

  antimatterDimensionPowerForTier(tier) {
    // Annihilation's extra exponent is full strength on AD1, then halves for each higher
    // Antimatter Dimension. Preserve the ordinary ^1 baseline on every tier.
    return 1 + (this.antimatterDimensionPower - 1) * Math.pow(0.5, tier - 1);
  },

  get infinityPointPower() {
    return 1 + 0.5 * this.infinityUpgradeCount;
  },

  get infinityAntimatterPower() {
    return 1 + this.infinityUpgradeCount;
  },

  dimensionCost(tier) {
    return DIMENSION_COSTS[tier - 1];
  },

  infinityColumnCost(column) {
    return INFINITY_COLUMN_COSTS[column];
  },

  canAnnihilateDimension(tier) {
    return this.isUnlocked &&
      Number.isInteger(tier) &&
      tier >= 1 &&
      tier <= DIMENSION_COSTS.length &&
      !player.annihilation.dimensions[tier - 1] &&
      this.matter.gte(this.dimensionCost(tier));
  },

  annihilateDimension(tier) {
    if (!this.canAnnihilateDimension(tier)) return false;
    player.annihilation.matter = this.matter.minus(this.dimensionCost(tier));
    player.annihilation.dimensions[tier - 1] = true;
    reapplyAnnihilatedDimensionPower();
    GameUI.update();
    return true;
  },

  canAnnihilateInfinityColumn(column) {
    const upgrades = INFINITY_COLUMN_UPGRADES[column];
    const cost = this.infinityColumnCost(column);
    return this.dimensionCount >= 5 &&
      upgrades?.length > 0 &&
      cost !== undefined &&
      !player.annihilation.infinityColumns[column] &&
      this.matter.gte(cost);
  },

  annihilateInfinityColumn(column) {
    if (!this.canAnnihilateInfinityColumn(column)) return false;
    player.annihilation.matter = this.matter.minus(this.infinityColumnCost(column));
    player.annihilation.infinityColumns[column] = true;
    for (const upgrade of INFINITY_COLUMN_UPGRADES[column]) {
      player.infinityUpgrades.add(upgrade);
    }
    reapplyAnnihilatedDimensionPower();
    GameUI.update();
    return true;
  },

  restoreInfinityUpgrades() {
    player.annihilation.infinityColumns.forEach((isAnnihilated, column) => {
      if (!isAnnihilated) return;
      for (const upgrade of INFINITY_COLUMN_UPGRADES[column]) {
        player.infinityUpgrades.add(upgrade);
      }
    });
  },

  reset() {
    if (!this.canReset) return false;
    // Ultimate Destruction is awarded by the first Annihilation, so its retention reward applies immediately.
    const savedBoostAchievements = Achievements.rows(1, 13)
      .filter(achievement => achievement.isUnlocked && achievement.config.effect !== undefined)
      .map(achievement => achievement.id);
    const hasStartingEternitiesAchievement = Achievement(196).isUnlocked;
    const savedRealityPerks = this.realityPerksToKeep;
    const savedAnnihilation = {
      matter: this.matter.plus(this.matterGain),
      power: this.power + 1,
      destructionPower: new Decimal(this.destructionPower),
      perks: [...this.perkStates],
      dimensions: [...player.annihilation.dimensions],
      destructionDimensions: (player.annihilation.destructionDimensions ?? []).map(dimension => ({
        amount: new Decimal(dimension.amount),
        bought: dimension.bought,
        cost: new Decimal(dimension.cost),
      })),
      infinityColumns: [...player.annihilation.infinityColumns],
      legacyAutoAchievementsCleared: player.annihilation.legacyAutoAchievementsCleared,
      unlocked: true,
    };
    GameEnd.creditsClosed = false;
    GameEnd.creditsEverClosed = false;
    player.isGameEnd = false;
    player.celestials.pelle.doomed = false;
    NG.restartWithCarryover();
    player.annihilation = savedAnnihilation;
    player.break = true;
    reapplyAnnihilatedDimensionPower();
    for (const id of savedBoostAchievements) Achievement(id).unlock(true);
    Achievement(191).unlock();
    if (hasStartingEternitiesAchievement) {
      Achievement(196).unlock(true);
      Currency.eternities.bumpTo(1000);
    }
    this.restoreRealityPerks(savedRealityPerks);
    this.restoreInfinityUpgrades();
    GameUI.update();
    Quotes.annihilation.first.show();
    return true;
  },
};

// Reapply permanent Annihilated Dimension boosts after every ordinary reset layer and after loading a save.
[
  GAME_EVENT.DIMBOOST_AFTER,
  GAME_EVENT.GALAXY_RESET_AFTER,
  GAME_EVENT.SACRIFICE_RESET_AFTER,
  GAME_EVENT.BIG_CRUNCH_AFTER,
  GAME_EVENT.ETERNITY_RESET_AFTER,
  GAME_EVENT.REALITY_RESET_AFTER,
  GAME_EVENT.ARMAGEDDON_AFTER,
  GAME_EVENT.GAME_LOAD,
].forEach(event => EventHub.logic.on(event, reapplyAnnihilatedDimensionPower));

EventHub.logic.on(GAME_EVENT.GAME_LOAD, removeLegacyAutoAchievements);
