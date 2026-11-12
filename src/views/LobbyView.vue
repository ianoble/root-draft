<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AuthPanel from '../components/AuthPanel.vue';
import SetupForm from '../components/SetupForm.vue';
import { useAuth } from '../composables/useAuth';
import {
  createMatch,
  joinMatch,
  leaveMatch,
  listMatches,
  mySeats,
  restoreSeats,
  type MatchInfo,
} from '../lib/api';
import { HOST, type DraftSettings } from '../logic';

const POLL_MS = 5000;

const router = useRouter();
const { playerName, isLoggedIn, logout } = useAuth();

const matches = ref<MatchInfo[]>([]);
const seats = ref<Record<string, string>>({});
const loading = ref(true);
const serverError = ref('');
const actionError = ref('');
const createError = ref('');
const creating = ref(false);

const mine = computed(() =>
  matches.value
    .filter((m) => m.matchID in seats.value)
    .sort((a, b) => b.updatedAt - a.updatedAt),
);
const open = computed(() =>
  matches.value
    .filter((m) => !(m.matchID in seats.value) && !m.gameover && m.players.some((p) => !p.name))
    .sort((a, b) => b.createdAt - a.createdAt),
);

function describe(m: MatchInfo): string {
  const filled = m.players.filter((p) => p.name).length;
  const host = m.players.find((p) => String(p.id) === HOST)?.name;
  const parts = [`${m.players.length} players`];
  if (m.setupData?.mode === 'dealt') parts.push('dealt hand');
  if (m.gameover) parts.push('lineup locked');
  else if (filled < m.players.length) parts.push(`${filled} of ${m.players.length} seated`);
  if (host) parts.push(`hosted by ${host}`);
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
}

async function create(settings: DraftSettings) {
  creating.value = true;
  createError.value = '';
  try {
    const { players, ...setupData } = settings;
    const matchID = await createMatch(players, setupData);
    await joinMatch(matchID, playerName.value.trim() || 'Host', HOST);
    router.push(`/game/${matchID}/${HOST}`);
  } catch (e) {
    createError.value = e instanceof Error ? e.message : 'Could not create the draft.';
  } finally {
    creating.value = false;
  }
}

async function join(matchID: string) {
  actionError.value = '';
  try {
    const playerID = await joinMatch(matchID, playerName.value.trim() || 'Player');
    router.push(`/game/${matchID}/${playerID}`);
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : 'Could not join that draft.';
    await refresh();
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
    reason="Sign in to host or join a draft, so your seat follows you between devices."
    @done="signedIn"
  />

  <div v-else class="stack">
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
        None yet. Start one below, or open an invite link from your host.
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

      <template v-if="open.length">
        <h2 style="margin-top: 18px">Open drafts</h2>
        <ul class="matches">
          <li v-for="m in open" :key="m.matchID">
            <span class="n">{{ describe(m) }}</span>
            <button type="button" class="btn small primary" @click="join(m.matchID)">Join</button>
          </li>
        </ul>
      </template>
      <p v-if="actionError" class="no" style="font-size: 14px">{{ actionError }}</p>
    </section>

    <SetupForm :error="createError" :busy="creating" @start="create" />
  </div>
</template>
