<script setup lang="ts">
import { ref } from "vue";
import FactionCard from "../components/FactionCard.vue";
import FactionDetail from "../components/FactionDetail.vue";
import { EXPANSIONS, FACTIONS } from "../data/factions";
import { FACTION_BY_ID } from "../logic";

const detail = ref<string | null>(null);
const groups = EXPANSIONS.map((name) => ({
  name,
  factions: FACTIONS.filter((f) => f.expansion === name),
}));
</script>

<template>
  <p class="turn">
    All {{ FACTIONS.length - 1 }} factions across the base game and four expansions, plus the second
    Vagabond seat. Open any of them for lore, play style and rules links.
  </p>
  <template v-for="g in groups" :key="g.name">
    <h2 style="margin: 22px 0 10px; font-size: 20px">{{ g.name }}</h2>
    <div class="cards">
      <FactionCard v-for="f in g.factions" :key="f.id" :faction="f" @detail="detail = $event" />
    </div>
  </template>
  <FactionDetail v-if="detail" :faction="FACTION_BY_ID[detail]" @close="detail = null" />
</template>
