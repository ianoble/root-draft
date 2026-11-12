import { onUnmounted, ref, watch, type Ref } from 'vue';
import { getMatch } from '../lib/api';

/**
 * Player names come from the match metadata, not the game state, so fetch them from the
 * server. Polls while any seat is still open.
 */
export function useMatchPlayers(matchID: Ref<string>) {
  /** Name by player id; missing while the seat is open. */
  const names = ref<Record<string, string>>({});
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function load() {
    try {
      const match = await getMatch(matchID.value);
      if (!match) throw new Error();
      const next: Record<string, string> = {};
      for (const p of match.players) if (p.name) next[String(p.id)] = p.name;
      names.value = next;
      if (match.players.some((p) => !p.name)) schedule(4000);
    } catch {
      schedule(5000);
    }
  }

  function schedule(ms: number) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(load, ms);
  }

  watch(matchID, load, { immediate: true });
  onUnmounted(() => timer && clearTimeout(timer));

  return { names };
}
