<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { loadSession, useGame } from '@engine/client';
import FactionCard from '../components/FactionCard.vue';
import FactionDetail from '../components/FactionDetail.vue';
import ReachMeter from '../components/ReachMeter.vue';
import SeatList, { type SeatPlayer } from '../components/SeatList.vue';
import { usePickNotifications } from '../composables/usePickNotifications';
import { codeLink, saveCode, savedCode } from '../lib/api';
import {
  FACTION_BY_ID,
  GAME_ID,
  HOST,
  isComplete,
  normalizeCode,
  options,
  parseCode,
  pickOfSeat,
  pickerOf,
  playerCode,
  type FactionOption,
  type RootDraftState,
} from '../logic';

const props = defineProps<{ matchID: string; playerID: string }>();
const router = useRouter();

const { state, isConnected, reconnecting, connect, disconnect, move } = useGame<RootDraftState>();

/** The synced game state; null until the first update arrives. */
const G = computed(() => (state.value?.draft ? state.value : null));
const draft = computed(() => G.value?.draft ?? null);

const isHost = computed(() => props.playerID === HOST);
const seated = computed(() => !!G.value?.claimed[props.playerID]);
const done = computed(() => !!draft.value && isComplete(draft.value));
const locked = computed(() => !!G.value?.locked);
const picker = computed(() => (G.value ? pickerOf(G.value) : null));
const isMyPick = computed(() => seated.value && !locked.value && picker.value === props.playerID);
const canPick = computed(
  () => !locked.value && picker.value !== null && (isHost.value || isMyPick.value),
);

const nameOf = (playerID: string) => G.value?.names[Number(playerID)] ?? `Player ${Number(playerID) + 1}`;

const seatPlayers = computed<SeatPlayer[]>(() =>
  (G.value?.turnOrder ?? []).map((id) => ({
    name: nameOf(id),
    you: id === props.playerID,
    host: id === HOST,
    joined: !!G.value?.claimed[id],
  })),
);

const RANK: Record<FactionOption['state'], number> = { open: 0, blocked: 1, taken: 2, unused: 3 };
const cards = computed(() => {
  const g = G.value;
  if (!g) return [];
  return options(g.draft)
    .map((option) => ({
      option,
      faction: FACTION_BY_ID[option.id],
      owner: option.state === 'taken' ? nameOf(g.turnOrder[option.seat]) : undefined,
    }))
    .sort((a, b) => RANK[a.option.state] - RANK[b.option.state]);
});

/* ---------- Host: player codes ---------- */

const guestCodes = computed(() => {
  const g = G.value;
  if (!g || !isHost.value) return [];
  return g.names
    .map((name, i) => ({ id: String(i), name, code: playerCode(g, String(i)), joined: !!g.claimed[String(i)] }))
    .filter((p) => p.id !== HOST && p.code);
});

function invite(name: string, code: string): string {
  return (
    `${name}, you're in our Root faction draft. Open ${codeLink(code)} ` +
    `(or go to ${window.location.host}), sign in, and enter your code ${code}.`
  );
}

/* ---------- Guest: confirming the code ---------- */

const codeInput = ref('');
const claiming = ref(false);
const claimFailed = ref(false);
let claimTimer: ReturnType<typeof setTimeout> | null = null;

/** Accepts the whole code (TQ4M-2K7QF) or just its last part (K7QF). */
function secretFrom(text: string): string {
  const parsed = parseCode(text);
  return parsed && parsed.playerID === props.playerID ? parsed.secret : normalizeCode(text);
}

function claim(secret: string) {
  if (!secret) return;
  claiming.value = true;
  claimFailed.value = false;
  move('claim', secret);
  if (claimTimer) clearTimeout(claimTimer);
  // The server answers by updating the state; no update in time means the code was refused.
  claimTimer = setTimeout(() => {
    claiming.value = false;
    if (!seated.value) claimFailed.value = true;
  }, 3000);
}

function submitCode() {
  const secret = secretFrom(codeInput.value);
  saveCode(props.matchID, secret);
  claim(secret);
}

// Confirm the seat with the code used to join, as soon as the draft has loaded.
let autoClaimed = false;
watch([G, isConnected], () => {
  if (autoClaimed || isHost.value || !G.value || !isConnected.value || seated.value) return;
  autoClaimed = true;
  const secret = savedCode(props.matchID);
  if (secret) claim(secret);
});
watch(seated, (now) => {
  if (now) {
    claiming.value = false;
    claimFailed.value = false;
  }
});

/* ---------- Sharing ---------- */

const lineup = computed(() => {
  const g = G.value;
  if (!g || !done.value) return '';
  return (
    'Root draft, in turn order: ' +
    g.turnOrder
      .map((id, seat) => `${seat + 1}. ${nameOf(id)} - ${FACTION_BY_ID[pickOfSeat(g.draft, seat)!].name}`)
      .join(', ')
  );
});

const detail = ref<string | null>(null);
const copied = ref('');
async function copy(key: string, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = key;
    setTimeout(() => (copied.value = copied.value === key ? '' : copied.value), 2000);
  } catch {
    copied.value = '';
  }
}

const notify = usePickNotifications(isMyPick, 'Root Faction Draft');

onMounted(() => {
  const session = loadSession(GAME_ID, props.matchID);
  if (session?.playerID !== props.playerID) {
    // No seat in this browser: back to the lobby, where a code can be entered.
    router.replace('/');
    return;
  }
  connect(GAME_ID, props.matchID, props.playerID, session.credentials);
});
onUnmounted(() => {
  if (claimTimer) clearTimeout(claimTimer);
  disconnect();
});
</script>

<template>
  <p v-if="!G" class="turn">
    {{ reconnecting || !isConnected ? 'Connecting to the draft...' : 'Loading draft...' }}
  </p>

  <div v-else-if="draft" class="grid2">
    <div>
      <section v-if="!isHost && !seated" class="panel" style="margin-bottom: 14px">
        <h2>Enter your code</h2>
        <p v-if="claiming" class="hint" style="margin: 0">Checking your code...</p>
        <template v-else>
          <p class="hint" style="margin: 0 0 8px">
            <span v-if="claimFailed" class="no">That code does not match this seat.</span>
            Enter the code {{ nameOf(HOST) }} sent you to take your seat as
            <b>{{ nameOf(playerID) }}</b>.
          </p>
          <form class="row" @submit.prevent="submitCode">
            <input
              v-model="codeInput"
              class="code-input"
              type="text"
              maxlength="12"
              placeholder="TQ4M-2K7QF"
              autocomplete="off"
              aria-label="Your draft code"
              style="max-width: 220px"
            />
            <button type="submit" class="btn primary" :disabled="!codeInput.trim()">Confirm</button>
          </form>
        </template>
      </section>

      <p v-if="locked" class="turn"><b>Lineup locked.</b> Seats are listed in turn order.</p>
      <p v-else-if="done" class="turn">
        <b>Draft complete.</b>
        {{ isHost ? 'Lock the lineup when everyone is happy, or undo to change it.' : 'Waiting for the host to lock the lineup.' }}
      </p>
      <p v-else-if="isMyPick" class="turn">
        <b>It's your pick</b> (pick {{ draft.picks.length + 1 }} of {{ draft.players }}).
      </p>
      <p v-else class="turn">
        Waiting for <b>{{ picker ? nameOf(picker) : '' }}</b> to pick
        (pick {{ draft.picks.length + 1 }} of {{ draft.players }}).
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
            You are the host. You can pick for whoever is up (handy if someone is away), undo picks
            and restart. Locking the lineup finishes the draft for everyone.
          </p>
        </template>

        <p v-if="notify.supported && notify.permission.value === 'default' && !locked && seated" style="margin: 10px 0 0">
          <button type="button" class="btn small" @click="notify.enable">Notify me when it is my pick</button>
        </p>
      </section>

      <section v-if="isHost && guestCodes.length && !locked" class="panel">
        <h2>Player codes</h2>
        <p class="hint" style="margin: 0 0 10px">
          Send each player their own code. They sign in at this site and enter it to take their seat.
        </p>
        <ul class="codes">
          <li v-for="p in guestCodes" :key="p.id">
            <span class="n">{{ p.name }}</span>
            <span class="st" :class="p.joined ? 'ok' : 'wn'">{{ p.joined ? 'Joined' : 'Not joined yet' }}</span>
            <code>{{ p.code }}</code>
            <button type="button" class="btn small" @click="copy(p.id, invite(p.name, p.code!))">
              {{ copied === p.id ? 'Copied' : 'Copy invite' }}
            </button>
          </li>
        </ul>
      </section>

      <section v-if="done" class="panel">
        <h2>Share the result</h2>
        <div class="code">{{ lineup }}</div>
        <div class="row">
          <button type="button" class="btn primary small" @click="copy('lineup', lineup)">Copy lineup</button>
          <span v-if="copied === 'lineup'" class="toast-note">Copied.</span>
        </div>
      </section>
    </aside>
  </div>

  <FactionDetail v-if="detail" :faction="FACTION_BY_ID[detail]" @close="detail = null" />
</template>
