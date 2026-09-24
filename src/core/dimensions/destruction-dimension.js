import { DC } from "../constants";

// Destruction Dimensions use Annihilation Matter and follow Time Dimension-style cascading
// production: higher tiers produce the tier below, while the first tier produces Destruction Power.
const BASE_COSTS = [DC.D1, DC.D5, DC.E2, DC.E3, DC.E6, DC.E12, DC.E18, DC.E24];
const COST_MULTIPLIERS = [3, 9, 27, 81, 243, 729, 2187, 6561];
const COST_THRESHOLDS = [DC.E6, DC.E6000];

function defaultData(tier) {
  return {
    amount: DC.D0,
    bought: 0,
    cost: new Decimal(BASE_COSTS[tier - 1]),
  };
}

function costAtPurchaseCount(tier, bought) {
  const base = BASE_COSTS[tier - 1];
  const multiplier = COST_MULTIPLIERS[tier - 1];
  const normalCost = Decimal.pow(multiplier, bought).times(base);
  if (normalCost.lt(COST_THRESHOLDS[0])) return normalCost;
  const increasedCost = Decimal.pow(multiplier * 1.5, bought).times(base);
  if (increasedCost.lt(COST_THRESHOLDS[1])) return increasedCost;
  return Decimal.pow(multiplier * 2.2, bought).times(base);
}

function dimensionData(tier) {
  if (!Array.isArray(player.annihilation.destructionDimensions)) {
    player.annihilation.destructionDimensions = Array.range(1, 8).map(defaultData);
  }
  let data = player.annihilation.destructionDimensions[tier - 1];
  if (data === undefined) {
    player.annihilation.destructionDimensions[tier - 1] = defaultData(tier);
    data = player.annihilation.destructionDimensions[tier - 1];
  }

  // These fields are custom save data, so old saves deserialize them as plain values instead
  // of Decimal instances. Normalize them at the boundary before any production calculation.
  if (!(data.amount instanceof Decimal)) data.amount = new Decimal(data.amount ?? 0);
  if (!Number.isFinite(data.bought) || data.bought < 0) data.bought = 0;
  data.bought = Math.floor(data.bought);
  if (!(data.cost instanceof Decimal)) data.cost = new Decimal(data.cost ?? 0);
  if (!data.cost.isFinite() || data.cost.lte(0)) data.cost = costAtPurchaseCount(tier, data.bought);
  return data;
}

class DestructionDimensionState {
  constructor(tier) {
    this._tier = tier;
  }

  get tier() {
    return this._tier;
  }

  get data() {
    return dimensionData(this.tier);
  }

  get amount() {
    return this.data.amount;
  }

  get bought() {
    return this.data.bought;
  }

  get cost() {
    return this.data.cost;
  }

  get multiplier() {
    return Decimal.pow(2, this.bought);
  }

  get productionPerSecond() {
    return this.amount.times(this.multiplier);
  }

  productionForDiff(diff) {
    return this.productionPerSecond.times(diff / 1000);
  }

  get isUnlocked() {
    return Annihilation.isDimensionAnnihilated(this.tier);
  }

  get isAffordable() {
    return Annihilation.matter.gte(this.cost);
  }

  get isAvailableForPurchase() {
    return this.isUnlocked && this.isAffordable;
  }

  nextCost(bought) {
    return costAtPurchaseCount(this.tier, bought);
  }

  buy() {
    if (!this.isAvailableForPurchase) return false;
    player.annihilation.matter = Annihilation.matter.minus(this.cost);
    this.data.amount = this.amount.plus(1);
    this.data.bought += 1;
    this.data.cost = this.nextCost(this.bought);
    GameUI.update();
    return true;
  }
}

// Keep a stable accessor array without relying on DimensionState's player-data layout.
const destructionIndex = Array.range(1, 8).map(tier => new DestructionDimensionState(tier));
export const DestructionDimension = tier => destructionIndex[tier - 1];
DestructionDimension.index = [null, ...destructionIndex];

export const DestructionDimensions = {
  all: destructionIndex,

  get powerEffect() {
    // A softened logarithmic multiplier keeps the effect useful without making the two affected formulas unstable.
    // Base growth is divided by 5. Past x5, additional gain is 1.25x weaker; past x10 it is
    // weakened by another 1.25x. Both softcaps join continuously.
    const rawEffect = 1 + Annihilation.destructionPower.plus(1).log2().toNumber() / 5;
    const firstSoftcap = 5;
    const secondSoftcap = 10;
    const firstReduction = 1.25;
    const effect = rawEffect <= firstSoftcap
      ? rawEffect
      : rawEffect <= secondSoftcap
        ? firstSoftcap + (rawEffect - firstSoftcap) / firstReduction
        : firstSoftcap + (secondSoftcap - firstSoftcap) / firstReduction +
          (rawEffect - secondSoftcap) / (firstReduction * firstReduction);
    return Number.isFinite(effect) ? Math.max(effect, 1) : 1e6;
  },

  tick(diff) {
    // The first dimension creates Destruction Power. Higher tiers follow the Time Dimension
    // production convention and create the preceding tier at one tenth their rate.
    if (!Number.isFinite(diff) || diff <= 0) return;
    for (let tier = 8; tier >= 2; tier--) {
      const source = DestructionDimension(tier);
      const target = DestructionDimension(tier - 1);
      if (source.isUnlocked && target.isUnlocked) {
        target.data.amount = target.amount.plus(source.productionForDiff(diff / 10));
      }
    }
    const first = DestructionDimension(1);
    if (first.isUnlocked) Annihilation.addDestructionPower(first.productionForDiff(diff));
  },

  get unlockedCount() {
    return this.all.countWhere(dimension => dimension.isUnlocked);
  },
};
