<script setup lang="ts">
import { computed } from 'vue';
import { FACTION_BY_ID, currentSeat, pickOfSeat, type DraftState } from '../logic';
import FactionDot from './FactionDot.vue';

export interface SeatPlayer {
  /** Display name, or null while the seat is open. */
  name: string | null;
  you: boolean;
  host: boolean;
}

/** `players` is in turn order, one entry per seat. */
const props = defineProps<{ state: DraftState; players: SeatPlayer[] }>();

const now = computed(() => currentSeat(props.state));
const seats = computed(() =>
  props.players.map((player, seat) => {
    const id = pickOfSeat(props.state, seat);
    return { seat, player, faction: id ? FACTION_BY_ID[id] : undefined };
  }),
);
</script>

<template>
  <ul class="seats">
    <li v-for="s in seats" :key="s.seat" :class="{ now: s.seat === now }">
      <span class="n" :class="{ open: !s.player.name }">
        {{ s.seat + 1 }}. {{ s.player.name ?? 'Open seat' }}
        <small v-if="s.player.you || s.player.host">
          ({{ [s.player.you && 'you', s.player.host && 'host'].filter(Boolean).join(', ') }})
        </small>
      </span>
      <span class="p">
        <template v-if="s.faction">
          <FactionDot :faction="s.faction" />{{ s.faction.name }} ({{ s.faction.reach }})
        </template>
        <template v-else>{{ s.seat === now ? 'picking now' : 'waiting' }}</template>
      </span>
    </li>
  </ul>
</template>
