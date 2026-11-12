<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AuthPanel from '../components/AuthPanel.vue';
import SetupForm from '../components/SetupForm.vue';
import { useAuth } from '../composables/useAuth';
import {
  createDraft,
  joinWithCode,
  leaveMatch,
  listMatches,
  mySeats,
  restoreSeats,
  type MatchInfo,
} from '../lib/api';
import { HOST, type DraftSettings } from '../logic';

const POLL_MS = 5000;

const route = useRoute();
const router = useRouter();
const { playerName, isLoggedIn, logout } = useAuth();

const matches = ref<MatchInfo[]>([]);
const seats = ref<Record<string, string>>({});
const loading = ref(true);
const serverError = ref('');
const createError = ref('');
const creating = ref(false);

/** A code from an invite link (?code=...) fills the box, and survives signing in. */
const code = ref(typeof route.query.code === 'string' ? route.query.code : '');
const codeError = ref('');
const joining = ref(false);

const mine = computed(() =>
  matches.value
    .filter((m) => m.matchID in seats.value)
    .sort((a, b) => b.updatedAt - a.updatedAt),
);

function describe(m: MatchInfo): string {
  const names = m.setupData?.names ?? [];
  const parts = [names.length ? names.join(', ') : `${m.players.length} players`];
  if (m.setupData?.mode === 'dealt') parts.push('dealt hand');
  if (m.gameover) parts.push('lineup locked');
  if (seats.value[m.matchID] === HOST) parts.push('you are hosting');
  return parts.join(' · ');
}

async function refresh() {
  if (!isLoggedIn.value) return;
  try {
    matches.value = await listMatches();
    seats.value = mySeats();
    serverError.value = '';
  } catch {
    serverError.value = 'Could not reach the game server.';
  } finally {
    loading.value = false;
  }
}

async function signedIn() {
  await restoreSeats();
  await refresh();
  if (code.value) await join();
}

async function create(settings: DraftSettings, names: string[]) {
  creating.value = true;
  createError.value = '';
  try {
    const { players: _players, ...setupData } = settings;
    const matchID = await createDraft(setupData, names);
    router.push(`/game/${matchID}/${HOST}`);
  } catch (e) {
    createError.value = e instanceof Error ? e.message : 'Could not create the draft.';
  } finally {
    creating.value = false;
  }
}

async function join() {
  if (!code.value.trim()) return;
  joining.value = true;
  codeError.value = '';
  try {
    const { matchID, playerID } = await joinWithCode(code.value);
    router.push(`/game/${matchID}/${playerID}`);
  } catch (e) {
    codeError.value = e instanceof Error ? e.message : 'Could not join with that code.';
  } finally {
    joining.value = false;
  }
}

async function leave(matchID: string) {
  await leaveMatch(matchID);
  await refresh();
}

let timer: ReturnType<typeof setInterval> | null = null;
onMounted(async () => {
  if (isLoggedIn.value) await signedIn();
  timer = setInterval(refresh, POLL_MS);
});
onUnmounted(() => timer && clearInterval(timer));
</script>

<template>
  <AuthPanel
    v-if="!isLoggedIn"
    :reason="
      code
        ? 'Sign in, and you will go straight to your seat in the draft.'
        : 'Sign in to host a draft or to enter the code your host gave you.'
    "
    @done="signedIn"
  />

  <div v-else class="stack">
    <div class="grid2">
      <section class="panel">
        <div class="row" style="justify-content: space-between">
          <h2 style="margin: 0">Your drafts</h2>
          <span class="row hint" style="margin: 0">
            Signed in as <b>{{ playerName }}</b>
            <button type="button" class="btn small" @click="logout">Sign out</button>
          </span>
        </div>
        <p v-if="serverError" class="no" style="font-size: 14px">{{ serverError }}</p>
        <p v-else-if="loading" class="hint">Loading...</p>
        <p v-else-if="!mine.length" class="hint">
          None yet. Enter the code your host gave you, or start a draft below.
        </p>
        <ul v-else class="matches">
          <li v-for="m in mine" :key="m.matchID">
            <span class="n">{{ describe(m) }}</span>
            <span class="row">
              <RouterLink class="btn small primary" :to="`/game/${m.matchID}/${seats[m.matchID]}`">
                Open
              </RouterLink>
              <button type="button" class="btn small" @click="leave(m.matchID)">Leave</button>
            </span>
          </li>
        </ul>
      </section>

      <section class="panel">
        <h2>Join with a code</h2>
        <form @submit.prevent="join">
          <input
            v-model="code"
            class="code-input"
            type="text"
            maxlength="12"
            placeholder="TQ4M-2K7QF"
            autocomplete="off"
            aria-label="Your draft code"
          />
          <p v-if="codeError" class="no" style="font-size: 14px; margin: 8px 0 0">{{ codeError }}</p>
          <p style="margin: 10px 0 0">
            <button type="submit" class="btn primary" :disabled="joining || !code.trim()">
              {{ joining ? 'Finding your seat...' : 'Take my seat' }}
            </button>
          </p>
        </form>
      </section>
    </div>

    <SetupForm :error="createError" :busy="creating" :host-name="playerName" @start="create" />
  </div>
</template>
