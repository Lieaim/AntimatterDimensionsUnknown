<script>
import { DataSet, Network } from "vis-network";

const PLACEHOLDER_PERKS = [
  { id: 1, label: "START", x: 0, y: -250 },
  { id: 2, label: "QOL1", x: -260, y: -100 },
  { id: 3, label: "PR1", x: 0, y: -100 },
  { id: 4, label: "SP1", x: 260, y: -100 },
  { id: 5, label: "QOL2", x: -260, y: 100 },
  { id: 6, label: "PR2", x: 0, y: 100 },
  { id: 7, label: "SP2", x: 260, y: 100 },
  { id: 8, label: "PR3", x: 0, y: 280 },
];

const PLACEHOLDER_CONNECTIONS = [
  [1, 2], [1, 3], [1, 4], [2, 5], [3, 6], [4, 7], [5, 8], [6, 8], [7, 8],
];

export default {
  name: "AnnihilationPerksTab",
  data() {
    return {
      power: 0,
      availablePerks: 0,
    };
  },
  mounted() {
    const nodes = new DataSet(PLACEHOLDER_PERKS.map(perk => ({
      ...perk,
      title: this.perkTooltip(perk.id),
    })));
    this.nodes = nodes;
    const edges = new DataSet(PLACEHOLDER_CONNECTIONS.map(([from, to]) => ({ from, to })));
    this.network = new Network(this.$refs.tree, { nodes, edges }, {
      physics: false,
      interaction: {
        hover: true,
        hoverConnectedEdges: false,
        selectConnectedEdges: false,
        tooltipDelay: 0,
      },
      nodes: {
        shape: "dot",
        size: 22,
        borderWidth: 2,
        shadow: true,
        font: {
          size: 14,
          color: "#ddd",
        },
        color: {
          background: "#333",
          border: "#888",
          hover: {
            background: "#888",
            border: "#aaa",
          },
          highlight: {
            background: "#888",
            border: "#aaa",
          },
        },
      },
      edges: {
        width: 4,
        shadow: true,
        smooth: {
          type: "continuous",
        },
        color: "#777",
      },
    });
    this.network.on("click", params => {
      const id = params.nodes[0];
      if (id === undefined) return;
      Annihilation.buyPerk(id);
      this.updatePerkNetwork();
    });
    this.network.moveTo({ position: { x: 0, y: 0 }, scale: 0.85 });
    this.updatePerkNetwork();
  },
  beforeDestroy() {
    this.network?.destroy();
  },
  methods: {
    update() {
      this.power = Annihilation.power;
      this.availablePerks = Annihilation.availablePerks;
      this.updatePerkNetwork();
    },
    perkTooltip(id) {
      const config = Annihilation.perkConfig(id);
      return `${config.label}<br>${config.description}<br>Cost: 1 Annihilation Perk`;
    },
    updatePerkNetwork() {
      if (this.nodes === undefined) return;
      this.nodes.update(PLACEHOLDER_PERKS.map(perk => {
        const isBought = Annihilation.isPerkBought(perk.id);
        const canBuy = Annihilation.canBuyPerk(perk.id);
        let background = "#333";
        if (canBuy) background = "#ddd";
        if (isBought) background = "#888";
        return {
          id: perk.id,
          title: this.perkTooltip(perk.id),
          color: {
            background,
            border: canBuy || isBought ? "#aaa" : "#666",
            hover: {
              background: canBuy || isBought ? "#aaa" : "#555",
              border: "#ccc",
            },
            highlight: {
              background: isBought ? "#888" : "#ddd",
              border: "#ccc",
            },
          },
        };
      }));
    },
  },
};
</script>

<template>
  <div class="l-annihilation-tab">
    <h2>Annihilation Perks</h2>
    <div class="c-annihilation-tab__amount">
      {{ formatAnnihilation(availablePerks, 0) }}
    </div>
    <p>
      You have {{ formatAnnihilation(power, 0) }} total Annihilations and
      {{ formatAnnihilation(availablePerks, 0) }} available Perks.
    </p>
    <p>Each node costs 1 Annihilation Perk. Hover over a perk to see its effect.</p>
    <div
      ref="tree"
      class="c-annihilation-perk-network"
    />
  </div>
</template>

<style scoped>
.l-annihilation-tab {
  text-align: center;
  color: #aaa;
}

.c-annihilation-tab__amount {
  font-size: 3rem;
  font-weight: bold;
}

.c-annihilation-perk-network {
  width: 90rem;
  max-width: calc(100vw - 6rem);
  height: 60rem;
  margin: 2rem auto;
  overflow: hidden;
  background: var(--color-base, #111);
  border: var(--var-border-width, 0.2rem) solid #888;
  border-radius: var(--var-border-radius, 0.4rem);
  touch-action: pan-y;
}
</style>
