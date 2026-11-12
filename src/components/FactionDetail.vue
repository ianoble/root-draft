<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from "vue";
import type { Faction } from "../data/factions";

const props = defineProps<{ faction: Faction }>();
const emit = defineEmits<{ close: [] }>();

const lawUrl = computed(() => `https://www.therootdatabase.com/law/${props.faction.lawSlug}/en/`);
// Search URLs, not verified direct pages.
const wikiUrl = computed(
  () =>
    "https://root.fandom.com/wiki/Special:Search?query=" +
    encodeURIComponent(props.faction.secondVagabond ? "Vagabond" : props.faction.name),
);

const onKey = (e: KeyboardEvent) => {
  if (e.key === "Escape") emit("close");
};
onMounted(() => document.addEventListener("keydown", onKey));
onBeforeUnmount(() => document.removeEventListener("keydown", onKey));
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="sheet" role="dialog" aria-modal="true" :aria-label="faction.name">
      <div class="hero" :style="{ background: faction.color, color: faction.ink }">
        <h2>{{ faction.name }}</h2>
        <p>{{ faction.expansion }} · {{ faction.animal }}</p>
      </div>
      <div class="in">
        <div class="stats">
          <div>Reach<b>{{ faction.reach }}</b></div>
          <div>Type<b>{{ faction.type }}</b></div>
          <div>Learning curve<b>{{ faction.learningCurve }}</b></div>
        </div>
        <h4>Lore</h4>
        <p>{{ faction.lore }}</p>
        <h4>How it plays</h4>
        <p>{{ faction.plays }}</p>
        <div class="cols">
          <div>
            <h4>Good at</h4>
            <ul class="points good">
              <li v-for="x in faction.goodAt" :key="x">{{ x }}</li>
            </ul>
          </div>
          <div>
            <h4>Watch out for</h4>
            <ul class="points bad">
              <li v-for="x in faction.watchOut" :key="x">{{ x }}</li>
            </ul>
          </div>
        </div>
        <h4>Your first turns</h4>
        <ol class="steps">
          <li v-for="x in faction.firstTurns" :key="x">{{ x }}</li>
        </ol>
        <p class="hint">One sensible opening, not the only one. Adapt it to the map and your neighbours.</p>
        <h4>At the table</h4>
        <p>{{ faction.tip }}</p>
        <p v-if="faction.homeland" class="hint">
          Homeland is the newest box, so treat this as an overview and read the linked Law section
          before your first game.
        </p>
        <h4>Rules and more</h4>
        <div class="links">
          <a class="btn small" :href="lawUrl" target="_blank" rel="noopener">Law of Root section</a>
          <a class="btn small" :href="wikiUrl" target="_blank" rel="noopener">Root wiki</a>
        </div>
        <p class="hint">Learning curve is this tool's own rough estimate, not an official rating.</p>
        <p style="margin: 18px 0 0">
          <button type="button" class="btn" @click="emit('close')">Close</button>
        </p>
      </div>
    </div>
  </div>
</template>
