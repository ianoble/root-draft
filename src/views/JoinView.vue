<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { loadSession } from '@engine/client';
import AuthPanel from '../components/AuthPanel.vue';
import { useAuth } from '../composables/useAuth';
import { getMatch, joinMatch, restoreSeats, type MatchInfo } from '../lib/api';
import { GAME_ID } from '../logic';

const props = defineProps<{ matchID: string }>();
const router = useRouter();
const { playerName, isLoggedIn } = useAuth();

const match = ref<MatchInfo | null>(null);
const loading = ref(true);
const joining = ref(false);
const error = ref('');

/** Go straight to the draft if this browser (or this account) already holds a seat. */
function resume(): boolean {
  const session = loadSession(GAME_ID, props.matchID);
  if (session) router.replace(`/game/${props.matchID}/${session.playerID}`);
  return !!session;
}

async function load() {
  if (resume()) return;
  if (isLoggedIn.value) {
    await restoreSeats();
    if (resume()) return;
  }
  match.value = await getMatch(props.matchID);
  loading.value = false;
}
onMounted(load);

async function join() {
  joining.value = true;
  error.value = '';
  try {
    const playerID = await joinMatch(props.matchID, playerName.value.trim() || 'Player');
    router.replace(`/game/${props.matchID}/${playerID}`);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not join the draft.';
    match.value = await getMatch(props.matchID);
  } finally {
    joining.value = false;
  }
}
</script>

<template>
  <p v-if="loading" class="turn">Loading draft...</p>

  <section v-else-if="!match" class="panel narrow">
    <h2>Draft not found</h2>
    <p class="hint" style="margin: 0 0 12px">This invite link does not match a draft on the server.</p>
    <RouterLink class="btn primary" to="/">Back to drafts</RouterLink>
  </section>

  <AuthPanel v-else-if="!isLoggedIn" reason="Sign in to take your seat in this draft." @done="load" />

  <section v-else class="panel narrow">
    <h2>Join this draft</h2>
    <ul class="seats">
      <li v-for="p in match.players" :key="p.id">
        <span class="n" :class="{ open: !p.name }">{{ p.name ?? 'Open seat' }}</span>
      </li>
    </ul>
    <p class="hint">
      Seats above are in joining order. The turn order was shuffled when the draft was created.
    </p>
    <p v-if="error" class="no" style="font-size: 14px">{{ error }}</p>
    <p class="row" style="margin: 14px 0 0">
      <button
        type="button"
        class="btn primary"
        :disabled="joining || match.players.every((p) => p.name)"
        @click="join"
      >
        {{ joining ? 'Joining...' : `Join as ${playerName}` }}
      </button>
      <RouterLink class="btn" to="/">Back to drafts</RouterLink>
    </p>
    <p v-if="match.players.every((p) => p.name)" class="hint">Every seat is taken.</p>
  </section>
</template>
