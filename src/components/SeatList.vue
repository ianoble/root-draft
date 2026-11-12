<script setup lang="ts">
import { computed } from 'vue';
import { FACTION_BY_ID, currentSeat, pickOfSeat, type DraftState } from '../logic';
import FactionDot from './FactionDot.vue';

export interface SeatPlayer {
  name: string;
  you: boolean;
  host: boolean;
  /** Whether the player has entered their code. */
  joined: boolean;
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
const tags = (p: SeatPlayer) =>
  [p.you && 'you', p.host && 'host', !p.joined && 'not joined yet'].filter(Boolean).join(', ');
</script>

<template>
  <ul class="seats">
    <li v-for="s in seats" :key="s.seat" :class="{ now: s.seat === now }">
      <span class="n" :class="{ open: !s.player.joined }">
        {{ s.seat + 1 }}. {{ s.player.name }}
        <small v-if="tags(s.player)">({{ tags(s.player) }})</small>
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
