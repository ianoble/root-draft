<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRef } from 'vue';
import { useRouter } from 'vue-router';
import { loadSession, useGame } from '@engine/client';
import FactionCard from '../components/FactionCard.vue';
import FactionDetail from '../components/FactionDetail.vue';
import ReachMeter from '../components/ReachMeter.vue';
import SeatList, { type SeatPlayer } from '../components/SeatList.vue';
import { useMatchPlayers } from '../composables/useMatchPlayers';
import { usePickNotifications } from '../composables/usePickNotifications';
import { inviteLink } from '../lib/api';
import {
  FACTION_BY_ID,
  GAME_ID,
  HOST,
  isComplete,
  options,
  pickOfSeat,
  pickerOf,
  type FactionOption,
  type RootDraftState,
} from '../logic';

const props = defineProps<{ matchID: string; playerID: string }>();
const router = useRouter();

const { state, isConnected, reconnecting, connect, disconnect, move } = useGame<RootDraftState>();
const { names } = useMatchPlayers(toRef(props, 'matchID'));

/** The synced game state; null until the first update arrives. */
const G = computed(() => (state.value?.draft ? state.value : null));
const draft = computed(() => G.value?.draft ?? null);

const isHost = computed(() => props.playerID === HOST);
const done = computed(() => !!draft.value && isComplete(draft.value));
const locked = computed(() => !!G.value?.locked);
const picker = computed(() => (G.value ? pickerOf(G.value) : null));
const isMyPick = computed(() => !locked.value && picker.value === props.playerID);
const canPick = computed(() => !locked.value && picker.value !== null && (isMyPick.value || isHost.value));

const nameOf = (playerID: string, seat: number) => names.value[playerID] ?? `Seat ${seat + 1}`;

const seatPlayers = computed<SeatPlayer[]>(() =>
  (G.value?.turnOrder ?? []).map((id) => ({
    name: names.value[id] ?? null,
    you: id === props.playerID,
    host: id === HOST,
  })),
);
const openSeats = computed(() => seatPlayers.value.filter((p) => !p.name).length);
const pickerName = computed(() =>
  G.value && picker.value ? nameOf(picker.value, G.value.turnOrder.indexOf(picker.value)) : '',
);

const RANK: Record<FactionOption['state'], number> = { open: 0, blocked: 1, taken: 2, unused: 3 };
const cards = computed(() => {
  const g = G.value;
  if (!g) return [];
  return options(g.draft)
    .map((option) => ({
      option,
      faction: FACTION_BY_ID[option.id],
      owner: option.state === 'taken' ? nameOf(g.turnOrder[option.seat], option.seat) : undefined,
    }))
    .sort((a, b) => RANK[a.option.state] - RANK[b.option.state]);
});

const lineup = computed(() => {
  const g = G.value;
  if (!g || !done.value) return '';
  return (
    'Root draft, in turn order: ' +
    g.turnOrder
      .map((id, seat) => `${seat + 1}. ${nameOf(id, seat)} - ${FACTION_BY_ID[pickOfSeat(g.draft, seat)!].name}`)
      .join(', ')
  );
});

const detail = ref<string | null>(null);
const copied = ref('');
async function copy(what: 'invite' | 'lineup') {
  try {
    await navigator.clipboard.writeText(what === 'invite' ? inviteLink(props.matchID) : lineup.value);
    copied.value = what;
    setTimeout(() => (copied.value = ''), 2000);
  } catch {
    copied.value = '';
  }
}

const notify = usePickNotifications(isMyPick, 'Root Faction Draft');

onMounted(() => {
  const session = loadSession(GAME_ID, props.matchID);
  if (session?.playerID !== props.playerID) {
    // No seat in this browser: the join page either resumes the right seat or offers one.
    router.replace(`/join/${props.matchID}`);
    return;
  }
  connect(GAME_ID, props.matchID, props.playerID, session.credentials);
});
onUnmounted(disconnect);
</script>

<template>
  <p v-if="!G" class="turn">
    {{ reconnecting || !isConnected ? 'Connecting to the draft...' : 'Loading draft...' }}
  </p>

  <div v-else-if="draft" class="grid2">
    <div>
      <p v-if="locked" class="turn"><b>Lineup locked.</b> Seats are listed in turn order.</p>
      <p v-else-if="done" class="turn">
        <b>Draft complete.</b>
        {{ isHost ? 'Lock the lineup when everyone is happy, or undo to change it.' : 'Waiting for the host to lock the lineup.' }}
      </p>
      <p v-else class="turn">
        Now picking: <b>{{ pickerName }}</b><template v-if="isMyPick">, that is you</template>
        (pick {{ draft.picks.length + 1 }} of {{ draft.players }})
      </p>
      <div class="cards">
        <FactionCard
          v-for="c in cards"
          :key="c.faction.id"
          :faction="c.faction"
          :option="c.option"
          :owner="c.owner"
          :can-pick="canPick"
          @pick="move('pick', $event)"
          @detail="detail = $event"
        />
      </div>
    </div>

    <aside class="stack">
      <ReachMeter :state="draft" />

      <section class="panel">
        <div class="row" style="justify-content: space-between">
          <h2 style="margin: 0">Seats</h2>
          <span class="pill" :class="isConnected ? 'ok' : 'no'">{{ isConnected ? 'Live' : 'Reconnecting...' }}</span>
        </div>
        <SeatList :state="draft" :players="seatPlayers" style="margin-top: 10px" />

        <template v-if="isHost && !locked">
          <p class="row" style="margin: 12px 0 0">
            <button v-if="done" type="button" class="btn small primary" @click="move('lock')">
              Lock lineup
            </button>
            <button type="button" class="btn small" :disabled="!draft.picks.length" @click="move('undo')">
              Undo last pick
            </button>
            <button type="button" class="btn small" :disabled="!draft.picks.length" @click="move('restart')">
              {{ draft.mode === 'dealt' ? 'Restart and re-deal' : 'Restart' }}
            </button>
          </p>
          <p class="hint">
            You are the host. You can pick for whoever is up, undo picks and restart. Locking the
            lineup finishes the draft for everyone.
          </p>
        </template>
        <p v-else-if="!locked" class="hint">
          You can pick when your seat is up. The host can also pick for a seat, undo and restart.
        </p>

        <p v-if="notify.supported && notify.permission.value === 'default' && !locked" style="margin: 10px 0 0">
          <button type="button" class="btn small" @click="notify.enable">Notify me when it is my pick</button>
        </p>
      </section>

      <section v-if="openSeats && !locked" class="panel">
        <h2>Invite players</h2>
        <p class="hint" style="margin: 0">
          {{ openSeats }} {{ openSeats === 1 ? 'seat is' : 'seats are' }} still open. Send this link;
          each player signs in and takes a seat.
        </p>
        <div class="code">{{ inviteLink(matchID) }}</div>
        <div class="row">
          <button type="button" class="btn primary small" @click="copy('invite')">Copy invite link</button>
          <span v-if="copied === 'invite'" class="toast-note">Copied.</span>
        </div>
      </section>

      <section v-if="done" class="panel">
        <h2>Share the result</h2>
        <div class="code">{{ lineup }}</div>
        <div class="row">
          <button type="button" class="btn primary small" @click="copy('lineup')">Copy lineup</button>
          <span v-if="copied === 'lineup'" class="toast-note">Copied.</span>
        </div>
      </section>
    </aside>
  </div>

  <FactionDetail v-if="detail" :faction="FACTION_BY_ID[detail]" @close="detail = null" />
</template>
