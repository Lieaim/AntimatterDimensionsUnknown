<script>
import CelestialQuoteLineBasicInteractable from "./templates/CelestialQuoteLineBasicInteractable";

export default {
  name: "CelestialQuoteModal",
  components: {
    CelestialQuoteLineBasicInteractable
  },
  props: {
    quote: {
      type: Object,
      required: true
    }
  },
  computed: {
    isHigherCelestialQuote() {
      return this.quote.celestial === "annihilation";
    },
  },
};
</script>

<template>
  <div
    class="l-modal-overlay c-modal-overlay"
    :class="{ 'c-modal-overlay--higher-celestial': isHigherCelestialQuote }"
  >
    <CelestialQuoteLineBasicInteractable
      class="c-quote-overlay"
      :quote="quote"
    />
  </div>
</template>

<style scoped>
.c-quote-overlay {
  font-size: 1.4rem;
  padding: 1rem;
  transition-duration: 0.2s;
}

.c-modal-overlay--higher-celestial {
  background-color: #000;
  animation: none;
}
</style>
