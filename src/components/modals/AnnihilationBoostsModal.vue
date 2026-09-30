<script>
import ModalWrapper from "@/components/modals/ModalWrapper";

export default {
  name: "AnnihilationBoostsModal",
  components: {
    ModalWrapper,
  },
  data() {
    return {
      freeBoostsOpen: false,
      earnedBoostsOpen: false,
    };
  },
  computed: {
    sectionIcon() {
      return isOpen => (isOpen ? "far fa-minus-square" : "far fa-plus-square");
    },
    freeBoosts() {
      const disabledInDoomed = Pelle.isDoomed ? " (disabled while Doomed)" : "";
      return [
        `Reality Machine gain: ×${format(Annihilation.realityMachineMultiplier, 2, 2)}${disabledInDoomed}`,
        `Reality count: ×${format(Annihilation.realityCountMultiplier, 2, 2)}${disabledInDoomed}`,
        `Imaginary Machine gain: ×${format(Annihilation.imaginaryMachineMultiplier, 2, 2)}${disabledInDoomed}`,
        `Relic Shard gain: ×${format(Annihilation.relicShardMultiplier, 2, 2)}${disabledInDoomed}`,
        `Reality Shard and Perk Point gain: ×${format(Annihilation.realityShardMultiplier, 2, 2)}${disabledInDoomed}`,
        `Tachyon Particle and Dilated Time gain: ` +
          `×${format(Annihilation.tachyonParticleMultiplier, 2, 2)}${disabledInDoomed}`,
        `Singularity gain: ×${format(Annihilation.singularityMultiplier, 2, 2)}${disabledInDoomed}`,
        `Nameless Ones stored real time: ×${format(Annihilation.storedRealTimeMultiplier, 2, 2)}` +
          `${disabledInDoomed}`,
        `Ra Memory Chunks and Memories per Chunk: ×${format(Annihilation.raMemoryMultiplier, 2, 2)}` +
          `${disabledInDoomed}`,
        `Glyph refinement: ×${format(Annihilation.glyphRefinementMultiplier, 2, 2)}${disabledInDoomed}`,
        `Alchemy resource cap: ×${format(Annihilation.alchemyResourceCapMultiplier, 2, 2)}${disabledInDoomed}`,
        `Glyph level gain: ×${format(Annihilation.glyphLevelGainMultiplier, 2, 2)}${disabledInDoomed}`,
      ];
    },
    earnedBoosts() {
      const boosts = [];
      if (Annihilation.dimensionCount > 0) {
        boosts.push(`Annihilated Dimensions: ${formatInt(Annihilation.dimensionCount)}; ` +
          `base Antimatter Dimension exponent is ^${format(Annihilation.antimatterDimensionPower, 2, 2)}.`);
      }
      if (Annihilation.infinityUpgradeCount > 0) {
        const upgradeCount = formatInt(Annihilation.infinityUpgradeCount);
        boosts.push(`Annihilated Infinity Upgrade columns: ${upgradeCount} upgrades kept; ` +
          `Antimatter Dimensions gain ^${format(Annihilation.infinityAntimatterPower, 2, 2)} ` +
          `and Infinity Points gain ^${format(Annihilation.infinityPointPower, 2, 2)}.`);
      }
      if (Annihilation.power >= 1) {
        boosts.push(`1-Annihilation milestone: ` +
          `×${format(Annihilation.firstMilestoneGameSpeedMultiplier, 2, 2)} game speed and ` +
          `^${format(Annihilation.firstMilestoneGameSpeedPower, 2, 2)} game speed.`);
        boosts.push(`V unlock Reality requirement: ×${format(Math.pow(0.8, Annihilation.power), 2, 2)} ` +
          `of its base requirement (currently ${formatInt(Annihilation.vRealityRequirement)} Realities).`);
      }
      if (Annihilation.power >= 2) {
        boosts.push(`2-Annihilation milestone: Infinity and Eternity Point gain are ` +
          `^${format(Annihilation.prestigePointMilestonePower, 2, 2)}.`);
        boosts.push(`Annihilations after the first: each Tesseract multiplies its Infinity Dimension ` +
          `purchase-cap effect by ×${format(Annihilation.tesseractEffectBase, 3, 3)} ` +
          `(base +${format(Annihilation.tesseractEffectBase - 2, 3, 3)}; caps at +1.000).`);
        boosts.push(`Annihilations after the first: repeatable Dilation Upgrade Autobuyers are ` +
          `×${format(Annihilation.repeatableDilationUpgradeAutobuyerSpeedMultiplier, 2, 2)} faster.`);
        boosts.push(`Annihilations after the first: Pelle Rifts can be filled to ` +
          `${formatPercents(Annihilation.pelleRiftFillPercentage, 2)} ` +
          `(+${formatPercents(Annihilation.pelleRiftFillBonus, 2)}; caps at 1,000%).`);
      }
      if (Annihilation.power >= 3) {
        boosts.push(`3-Annihilation milestone: Reality rewards are ` +
          `×${format(Annihilation.realityRewardMultiplier, 2, 2)}.`);
      }
      if (Annihilation.power >= 5) {
        boosts.push(`5-Annihilation milestone: Infinity upgrades based on Infinities are ` +
          `^${format(Annihilation.infinityUpgradeInfinitiesPower, 2, 2)} stronger.`);
      }
      for (const perk of Array.range(1, 8)) {
        if (Annihilation.isPerkBought(perk)) {
          const config = Annihilation.perkConfig(perk);
          boosts.push(`${config.label}: ${config.description}`);
        }
      }
      if (boosts.length === 0) {
        boosts.push("Earn boosts by annihilating Dimensions, reaching milestones, and buying Annihilation Perks.");
      }
      return boosts;
    },
  },
};
</script>

<template>
  <ModalWrapper>
    <template #header>
      Annihilation Boosts
    </template>
    <div class="l-annihilation-boosts-modal">
      <button
        class="c-annihilation-boosts-section"
        @click="freeBoostsOpen = !freeBoostsOpen"
      >
        <i :class="sectionIcon(freeBoostsOpen)" />
        <span>Free Annihilation Boosts</span>
      </button>
      <div
        v-if="freeBoostsOpen"
        class="c-annihilation-boosts-list"
      >
        <p
          v-for="boost in freeBoosts"
          :key="boost"
        >
          {{ boost }}
        </p>
      </div>

      <button
        class="c-annihilation-boosts-section"
        @click="earnedBoostsOpen = !earnedBoostsOpen"
      >
        <i :class="sectionIcon(earnedBoostsOpen)" />
        <span>Earned Annihilation Boosts</span>
      </button>
      <div
        v-if="earnedBoostsOpen"
        class="c-annihilation-boosts-list"
      >
        <p
          v-for="boost in earnedBoosts"
          :key="boost"
        >
          {{ boost }}
        </p>
      </div>
    </div>
  </ModalWrapper>
</template>

<style scoped>
.l-annihilation-boosts-modal {
  width: min(90vw, 88rem);
  max-height: 55rem;
  overflow-y: auto;
  padding: 0.5rem;
}

.c-annihilation-boosts-section {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 7rem;
  margin: 1.5rem 0 0;
  padding: 1.2rem 2rem;
  color: #aaa;
  background: #111;
  border: 0.2rem solid #888;
  border-radius: var(--var-border-radius, 0.5rem);
  font-family: Typewriter, serif;
  font-size: 2.3rem;
  font-weight: bold;
  cursor: pointer;
}

.c-annihilation-boosts-section:hover { color: #111; background: #888; }
.c-annihilation-boosts-section i { width: 4rem; text-align: left; }
.c-annihilation-boosts-section span { flex: 1; text-align: center; }

.c-annihilation-boosts-list {
  margin: 0;
  padding: 1rem 2rem;
  color: #ddd;
  background: #18181d;
  border: 0.1rem solid #555;
  border-top: 0;
  text-align: left;
}

.c-annihilation-boosts-list p { margin: 0.8rem 0; line-height: 1.35; }
</style>
