<script>
const MILESTONE_REQUIREMENTS = Array.range(1, 15);

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
        const description = "2x game speed and ^1.01 game speed compounding per annihilation " +
          "(caps at 25 annihilations)";
        const current = `Currently: x${this.formatAnnihilation(Annihilation.firstMilestoneGameSpeedMultiplier, 2)}, ` +
          `^${this.formatAnnihilation(Annihilation.firstMilestoneGameSpeedPower, 2)}`;
        return `${description}\n${current}`;
      }
      return "Placeholder milestone effect";
    },
  },
};
</script>

<template>
  <div class="l-annihilation-milestone-grid">
    <div>You have {{ quantifyInt("Annihilation", annihilations) }}.</div>
    <div>Milestone effects are placeholders for now and will be added as Annihilation expands.</div>
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
  font-size: 1.2rem;
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
