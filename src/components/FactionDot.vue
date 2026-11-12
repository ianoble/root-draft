<script setup lang="ts">
import type { Faction } from "../data/factions";

defineProps<{ faction: Faction }>();
</script>

<template>
  <span class="dot" :style="{ background: faction.color, color: faction.ink }">{{ faction.mono }}</span>
</template>
