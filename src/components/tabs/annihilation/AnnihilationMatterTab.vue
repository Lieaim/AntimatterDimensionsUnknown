<script>
const FIRST_ANNIHILATION_REQUIREMENT = new Decimal("9e9e15");
const DIMENSION_COSTS = [new Decimal(1), new Decimal(10), new Decimal(250), new Decimal("1e4"), new Decimal("1e6"),
  new Decimal("1e24"), new Decimal("1e100"), new Decimal("1e3003")];

function safeDecimal(value) {
  try {
    return value instanceof Decimal ? value : new Decimal(value ?? 0);
  } catch {
    return new Decimal(0);
  }
}

function safeFormat(value) {
  try {
    return format(safeDecimal(value), 2, 2);
  } catch {
    return "0";
  }
}

function ensureAnnihilationState() {
  if (player.annihilation === undefined || player.annihilation === null) player.annihilation = {};
  const state = player.annihilation;
  state.matter = safeDecimal(state.matter);
  if (!Array.isArray(state.dimensions)) state.dimensions = Array(8).fill(false);
  if (!Array.isArray(state.infinityColumns)) state.infinityColumns = Array(4).fill(false);
  return state;
}

export default {
  name: "AnnihilationMatterTab",
  data() {
    return {
      matterText: "0",
      resetText: "You need to doom your reality to annihilate",
      resetAvailable: false,
      dimensionButtons: [],
      showInfinityUpgrade: false,
      infinityUpgradeText: "",
      infinityUpgradeAvailable: false,
      statusText: "",
    };
  },
  methods: {
    update() {
      this.refreshTab();
    },
    refreshTab() {
      try {
        const state = ensureAnnihilationState();
        const isDoomed = Boolean(Pelle.isDoomed);
        const antimatter = safeDecimal(Currency.antimatter.value);
        const canReset = isDoomed && antimatter.gte(FIRST_ANNIHILATION_REQUIREMENT);
        this.matterText = safeFormat(state.matter);
        this.resetAvailable = canReset;
        this.statusText = "";

        if (!isDoomed) this.resetText = "You need to doom your reality to annihilate";
        else if (!canReset) this.resetText = "Reach 9ee15 Antimatter to Annihilate";
        else {
          let reward = "Annihilation Matter";
          try {
            reward = `${safeFormat(Annihilation.matterGain)} Annihilation Matter`;
          } catch {
            // A display-only reward failure must never make the page unusable.
          }
          this.resetText = `Annihilate and begin again\nGain ${reward} and 1 Annihilation Perk`;
        }

        this.dimensionButtons = DIMENSION_COSTS.map((cost, index) => {
          const tier = index + 1;
          const isAnnihilated = state.dimensions[index] === true;
          return {
            tier,
            available: !isAnnihilated && state.matter.gte(cost),
            bought: isAnnihilated,
            text: isAnnihilated
              ? `Dimension ${tier} annihilated`
              : `Annihilate Dimension ${tier}\nCost: ${safeFormat(cost)} Matter`,
          };
        });

        this.showInfinityUpgrade = state.dimensions.filter(Boolean).length >= 5;
        const infinityBought = state.infinityColumns[0] === true;
        const infinityCost = new Decimal("1e15");
        this.infinityUpgradeAvailable = this.showInfinityUpgrade && !infinityBought && state.matter.gte(infinityCost);
        this.infinityUpgradeText = infinityBought
          ? "First Infinity Upgrade column annihilated"
          : `Annihilate first Infinity Upgrade column\nCost: ${safeFormat(infinityCost)} Matter`;
      } catch {
        // This is intentionally a complete fallback view. The tab must remain visible
        // even if a legacy save has malformed Annihilation data.
        this.matterText = "0";
        this.resetText = "You need to doom your reality to annihilate";
        this.resetAvailable = false;
        this.dimensionButtons = [];
        this.showInfinityUpgrade = false;
        this.statusText = "Annihilation data was repaired. Reopen this tab if needed.";
      }
    },
    annihilate() {
      try {
        if (this.resetAvailable) Annihilation.reset();
      } finally {
        this.refreshTab();
      }
    },
    buyDimension(tier) {
      try {
        Annihilation.annihilateDimension(tier);
      } finally {
        this.refreshTab();
      }
    },
    buyInfinityUpgrade() {
      try {
        Annihilation.annihilateInfinityColumn(0);
      } finally {
        this.refreshTab();
      }
    },
    replayQuotes() {
      Quotes.annihilation.first.present();
    },
  },
};
</script>

<template>
  <div class="l-annihilation-tab">
    <h2>Annihilation Matter</h2>
    <button class="c-annihilation-quotes" @click="replayQuotes">Annihilation Quotes</button>
    <button class="c-annihilation-reset" :disabled="!resetAvailable" @click="annihilate">{{ resetText }}</button>
    <div class="c-annihilation-tab__amount">{{ matterText }}</div>
    <p>Spend Matter to annihilate Dimensions and permanently strengthen Antimatter production.</p>
    <p v-if="statusText" class="c-annihilation-tab__status">{{ statusText }}</p>
    <div class="l-annihilation-dimensions">
      <button
        v-for="dimension in dimensionButtons"
        :key="dimension.tier"
        class="c-annihilation-upgrade"
        :class="{ 'c-annihilation-upgrade--bought': dimension.bought }"
        :disabled="!dimension.available"
        @click="buyDimension(dimension.tier)"
      >
        {{ dimension.text }}
      </button>
    </div>
    <button
      v-if="showInfinityUpgrade"
      class="c-annihilation-upgrade c-annihilation-upgrade--infinity"
      :disabled="!infinityUpgradeAvailable"
      @click="buyInfinityUpgrade"
    >
      {{ infinityUpgradeText }}
    </button>
  </div>
</template>

<style scoped>
.l-annihilation-tab { text-align: center; color: #aaa; }
.c-annihilation-tab__amount { margin-top: 1rem; font-size: 3rem; font-weight: bold; }
.c-annihilation-tab__status { color: #d38b55; }
.c-annihilation-quotes, .c-annihilation-upgrade, .c-annihilation-reset {
  color: #aaa; background: #111; border: 0.15rem solid #888; border-radius: var(--var-border-radius, 0.5rem);
  font-family: Typewriter, serif; white-space: pre-line; cursor: pointer;
}
.c-annihilation-quotes { display: block; margin: 1rem auto; padding: 0.6rem 1.2rem; }
.c-annihilation-reset { min-width: 42rem; min-height: 6rem; padding: 0.75rem 1.5rem; font-size: 1.5rem; }
.c-annihilation-upgrade { min-height: 5rem; padding: 0.5rem; }
.c-annihilation-upgrade--infinity { min-width: 26rem; margin-bottom: 2rem; }
.c-annihilation-upgrade:disabled, .c-annihilation-reset:disabled { opacity: 0.5; cursor: default; }
.c-annihilation-quotes:hover, .c-annihilation-upgrade:not(:disabled):hover,
.c-annihilation-reset:not(:disabled):hover { color: #111; background: #888; }
.c-annihilation-upgrade--bought { color: #111; background: #888; opacity: 1; }
.l-annihilation-dimensions { display: grid; grid-template-columns: repeat(2, minmax(20rem, 1fr)); gap: 1rem; max-width: 52rem; margin: 2rem auto; }
</style>
