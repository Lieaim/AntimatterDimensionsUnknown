<script>
const MILESTONE_REQUIREMENTS = [1, 2, 3, ...Array.range(5, 11)];

export default {
  name: "AnnihilationMilestonesTab",
  data() {
    return {
      annihilations: 0,
      milestones: MILESTONE_REQUIREMENTS,
    };
  },
  computed: {
    rows() {
      return Math.ceil(this.milestones.length / 3);
    },
  },
  methods: {
    update() {
      this.annihilations = Annihilation.power;
    },
    milestoneAt(row, column) {
      return this.milestones[(row - 1) * 3 + column - 1];
    },
    effectFor(requirement) {
      if (requirement === 1) {
        const description = "2x game speed compounds per Annihilation; game speed gains +^0.01 per Annihilation " +
          "(caps at 25 annihilations)";
        const multiplier = this.formatAnnihilation(Annihilation.firstMilestoneGameSpeedMultiplier, 2, 2);
        const power = this.formatAnnihilation(Annihilation.firstMilestoneGameSpeedPower, 2, 2);
        const current = `Currently: x${multiplier}, ^${power}`;
        return `${description}\n${current}`;
      }
      if (requirement === 2) {
        const description = "^0.01 Infinity Point and Eternity Point gain per Annihilation starting at 2 " +
          "(caps at ^1.5)";
        return `${description}\nCurrently: ^${this.formatAnnihilation(Annihilation.prestigePointMilestonePower, 2, 2)}`;
      }
      if (requirement === 3) {
        const description = "Reality rewards gain +×1 per Annihilation starting at 3 " +
          "(caps at ×25)";
        return `${description}\nCurrently: ×${formatInt(Annihilation.realityRewardMultiplier)}`;
      }
      if (requirement === 5) {
        const description = "Infinity upgrades which boost Antimatter Dimensions based on Infinities gain " +
          "+^0.05 per Annihilation starting at 5 (caps at ^2.5)";
        const current = this.formatAnnihilation(Annihilation.infinityUpgradeInfinitiesPower, 2, 2);
        return `${description}\nCurrently: ^${current}`;
      }
      return "Placeholder milestone effect";
    },
  },
};
</script>

<template>
  <div class="l-annihilation-milestone-grid">
    <div>You have {{ quantifyInt("Annihilation", annihilations) }}.</div>
    <div>More milestones will be added as Annihilation expands.</div>
    <div
      v-for="row in rows"
      :key="row"
      class="l-annihilation-milestone-grid__row"
    >
      <div
        v-for="column in 3"
        :key="column"
        class="l-annihilation-milestone-grid__cell"
      >
        <template v-if="milestoneAt(row, column)">
          <span class="o-annihilation-milestone__goal">
            {{ quantifyInt("Annihilation", milestoneAt(row, column)) }}:
          </span>
          <button
            class="o-annihilation-milestone__reward"
            :class="{
              'o-annihilation-milestone__reward--reached': annihilations >= milestoneAt(row, column),
              'o-annihilation-milestone__reward--first': milestoneAt(row, column) === 1,
            }"
          >
            {{ effectFor(milestoneAt(row, column)) }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.l-annihilation-milestone-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #aaa;
}

.l-annihilation-milestone-grid__row {
  display: flex;
  flex-direction: row;
}

.l-annihilation-milestone-grid__cell {
  margin: 0.5rem 0.8rem;
}

.o-annihilation-milestone__goal {
  display: block;
  text-align: left;
  font-size: 2rem;
}

.o-annihilation-milestone__reward {
  width: 25rem;
  height: 8rem;
  color: #aaa;
  background: dimgrey;
  border: 0.1rem solid #888;
  border-radius: var(--var-border-radius, 0.4rem);
  font-family: Typewriter, serif;
  font-size: 1rem;
  white-space: pre-line;
  transition-duration: 0.2s;
}

.o-annihilation-milestone__reward--reached {
  color: #111;
  background: #888;
  border-color: #aaa;
}

.o-annihilation-milestone__reward--first {
  font-size: 1.05rem;
}
</style>
