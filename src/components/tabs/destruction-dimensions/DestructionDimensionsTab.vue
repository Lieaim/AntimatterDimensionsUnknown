<script>
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "DestructionDimensionsTab",
  components: {
    PrimaryButton,
  },
  data() {
    return {
      matter: new Decimal(0),
      destructionPower: new Decimal(0),
      destructionPowerEffect: 1,
      playtimeMultiplier: 1,
      secondsPlayed: 0,
      dimensions: Array.range(1, 8).map(tier => ({
        tier,
        name: ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth"][tier - 1],
        unlocked: false,
        amount: new Decimal(0),
        bought: 0,
        cost: new Decimal(0),
        production: new Decimal(0),
        multiplier: new Decimal(1),
        canBuy: false,
      })),
    };
  },
  methods: {
    update() {
      this.matter.copyFrom(Annihilation.matter);
      this.destructionPower.copyFrom(Annihilation.destructionPower);
      this.destructionPowerEffect = DestructionDimensions.powerEffect;
      this.playtimeMultiplier = Annihilation.dimensionPlaytimeMultiplier;
      this.secondsPlayed = player.records.realTimePlayed / 1000;
      for (const entry of this.dimensions) {
        const dimension = DestructionDimension(entry.tier);
        entry.unlocked = dimension.isUnlocked;
        entry.amount.copyFrom(dimension.amount);
        entry.bought = dimension.bought;
        entry.cost.copyFrom(dimension.cost);
        entry.production.copyFrom(dimension.productionPerSecond);
        entry.multiplier.copyFrom(dimension.multiplier);
        entry.canBuy = dimension.isAvailableForPurchase;
      }
    },
    buy(tier) {
      DestructionDimension(tier).buy();
    },
  },
};
</script>

<template>
  <div class="l-destruction-dimensions l-centered-vertical-tab">
    <h2>Destruction Dimensions</h2>
    <p>
      You have <b>{{ format(matter, 2, 2) }}</b> Annihilation Matter.
    </p>
    <p>
      You have <b>{{ format(destructionPower, 2, 2) }}</b> Destruction Power,
      making Infinity Power effects and free Time Shard tickspeed upgrades <b>{{ formatX(destructionPowerEffect, 2, 2) }}</b> stronger.
    </p>
    <p>
      All Antimatter, Infinity, and Time Dimensions are currently multiplied by
      <b>{{ formatX(playtimeMultiplier, 2, 2) }}</b> from {{ formatInt(secondsPlayed) }} seconds played.
    </p>
    <p class="c-destruction-dimensions__hint">
      Each Annihilated Antimatter Dimension unlocks its matching Destruction Dimension.
      Higher Destruction Dimensions produce the tier below them; the first produces Destruction Power.
    </p>
    <div class="l-destruction-dimensions__rows">
      <div
        v-for="dimension in dimensions"
        :key="dimension.tier"
        class="c-destruction-dimension-row"
        :class="{ 'c-destruction-dimension-row--locked': !dimension.unlocked }"
      >
        <template v-if="dimension.unlocked">
          <div class="c-destruction-dimension-row__description">
            <span class="c-destruction-dimension-row__name">{{ dimension.name }} Destruction Dimension</span>
            <span class="c-destruction-dimension-row__multiplier">{{ formatX(dimension.multiplier, 2, 2) }}</span>
          </div>
          <div class="c-destruction-dimension-row__amount">
            <span>{{ format(dimension.amount, 2) }}</span>
            <span class="c-destruction-dimension-row__production">(+{{ format(dimension.production, 2) }}/s)</span>
          </div>
          <PrimaryButton
            :enabled="dimension.canBuy"
            class="c-destruction-dimension-row__buy"
            @click="buy(dimension.tier)"
          >
            Buy 1 — {{ format(dimension.cost, 2) }} Matter
          </PrimaryButton>
        </template>
        <template v-else>
          <div class="c-destruction-dimension-row__description">
            <span class="c-destruction-dimension-row__name">Locked Destruction Dimension</span>
            <span class="c-destruction-dimension-row__multiplier">Annihilate Antimatter Dimension {{ formatInt(dimension.tier) }} to unlock</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.l-destruction-dimensions {
  width: min(125rem, 100%);
  margin: auto;
}

.c-destruction-dimensions__hint {
  color: var(--color-text);
  opacity: 0.8;
}

.l-destruction-dimensions__rows {
  display: flex;
  margin-top: 2rem;
  flex-direction: column;
  gap: 0.7rem;
}

.c-destruction-dimension-row {
  display: grid;
  min-height: 6.5rem;
  padding: 0.7rem 1.2rem;
  border: 0.1rem solid #777;
  border-radius: 0.4rem;
  grid-template-columns: minmax(25rem, 1fr) minmax(20rem, 0.7fr) minmax(26rem, 0.85fr);
  align-items: center;
  color: #eee;
  background: #111;
}

.c-destruction-dimension-row:nth-child(even) {
  background: #292929;
}

.c-destruction-dimension-row--locked {
  border-color: #4e4e4e;
  color: #999;
  background: #0b0b0b !important;
}

.c-destruction-dimension-row__description,
.c-destruction-dimension-row__amount {
  display: flex;
  text-align: left;
  flex-direction: column;
}

.c-destruction-dimension-row__name,
.c-destruction-dimension-row__amount > span:first-child {
  font-size: 1.8rem;
  font-weight: bold;
}

.c-destruction-dimension-row__multiplier,
.c-destruction-dimension-row__production {
  margin-top: 0.2rem;
  font-size: 1.25rem;
  font-weight: bold;
}

.c-destruction-dimension-row__buy {
  min-height: 4.5rem;
  margin-left: 1rem;
  border: 0.1rem solid #aaa !important;
  border-radius: 0.5rem;
  color: #f2f2f2 !important;
  font-size: 1.45rem;
  font-weight: bold;
  background: #4a4a4a !important;
}

.c-destruction-dimension-row__buy:hover:not(.o-primary-btn--disabled) {
  background: #626262 !important;
}

@media (max-width: 900px) {
  .c-destruction-dimension-row {
    grid-template-columns: 1fr;
    gap: 0.7rem;
  }

  .c-destruction-dimension-row__buy {
    margin-left: 0;
  }
}
</style>
