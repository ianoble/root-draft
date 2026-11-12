<script setup lang="ts">
import type { Faction } from "../data/factions";
import type { FactionOption } from "../logic";
import FactionDot from "./FactionDot.vue";

defineProps<{
  faction: Faction;
  /** Draft status; omit when just browsing. */
  option?: FactionOption;
  /** Name of the player who took it, when option.state is "taken". */
  owner?: string;
  /** Whether this viewer may pick right now. */
  canPick?: boolean;
}>();
defineEmits<{ pick: [id: string]; detail: [id: string] }>();
</script>

<template>
  <article
    class="card"
    :class="{
      taken: option?.state === 'taken',
      blocked: option?.state === 'blocked' || option?.state === 'unused',
    }"
  >
    <div class="band" :style="{ background: faction.color }"></div>
    <div class="body">
      <h3><FactionDot :faction="faction" />{{ faction.name }}</h3>
      <div class="meta">
        <span class="tag reach">Reach {{ faction.reach }}</span>
        <span class="tag">{{ faction.type }}</span>
        <span class="tag">{{ faction.animal }}</span>
      </div>
      <div class="acts">
        <button type="button" class="btn small" @click="$emit('detail', faction.id)">
          Lore and play style
        </button>
        <template v-if="option">
          <span v-if="option.state === 'taken'" class="owner">Taken by {{ owner }}</span>
          <span v-else-if="option.state === 'blocked'" class="why">{{ option.why }}</span>
          <span v-else-if="option.state === 'unused'" class="why">Not drafted</span>
          <template v-else>
            <button
              v-if="canPick"
              type="button"
              class="btn small primary"
              @click="$emit('pick', faction.id)"
            >
              Pick
            </button>
            <span v-else class="why">Not your pick yet</span>
            <span v-if="option.warn" class="why warn">{{ option.warn }}</span>
          </template>
        </template>
      </div>
    </div>
  </article>
</template>
