<script setup lang="ts">
import { computed, reactive } from "vue";
import { EXPANSIONS, FACTIONS, REACH_TARGETS, type Expansion } from "../data/factions";
import {
  MAX_NAME_LENGTH,
  MAX_PLAYERS,
  maxReach,
  normalizePool,
  poolProblem,
  targetOf,
  type DraftMode,
  type DraftSettings,
  type GuardMode,
  type PickOrder,
  type ReachGoal,
} from "../logic";
import FactionDot from "./FactionDot.vue";
import SegControl from "./SegControl.vue";

const props = defineProps<{ error?: string; busy?: boolean; hostName?: string }>();
const emit = defineEmits<{ start: [settings: DraftSettings, names: string[]] }>();

const form = reactive({
  players: 4,
  mode: "open" as DraftMode,
  guard: "block" as GuardMode,
  goal: "recommended" as ReachGoal,
  order: "reverse" as PickOrder,
  off: {} as Record<string, boolean>,
  /** Player names; the first is the host. */
  names: Array.from({ length: MAX_PLAYERS }, (_, i) => (i === 0 ? props.hostName ?? "" : "")),
});

const names = computed(() => form.names.slice(0, form.players).map((n) => n.trim()));
const missingNames = computed(() => names.value.some((n) => !n));
const duplicateNames = computed(
  () => new Set(names.value.map((n) => n.toLowerCase())).size !== names.value.length,
);

const settings = computed<DraftSettings>(() => ({
  players: form.players,
  mode: form.mode,
  guard: form.guard,
  goal: form.goal,
  order: form.order,
  pool: normalizePool(FACTIONS.filter((f) => !form.off[f.id]).map((f) => f.id)),
}));
const target = computed(() => targetOf(settings.value));
const best = computed(() => maxReach([], settings.value.pool, form.players));
const problem = computed(
  () =>
    poolProblem(settings.value) ??
    (missingNames.value
      ? "Enter a name for every player."
      : duplicateNames.value
        ? "Give every player a different name."
        : null),
);

const expansions = computed(() =>
  EXPANSIONS.map((name) => {
    const factions = FACTIONS.filter((f) => f.expansion === name);
    return { name, factions, allOff: factions.every((f) => form.off[f.id]) };
  }),
);
/** The second Vagabond is unavailable whenever the first is excluded. */
const isOff = (id: string) => !!form.off[id] || (id === "w" && !!form.off.v);

function toggleExpansion(name: Expansion, allOff: boolean) {
  for (const f of FACTIONS) if (f.expansion === name) form.off[f.id] = !allOff;
}

function start() {
  if (!problem.value) emit("start", settings.value, names.value);
}
</script>

<template>
  <div class="grid2">
    <div class="stack">
      <section class="panel">
        <h2>Start a new draft</h2>
        <label class="f">Players</label>
        <SegControl
          v-model="form.players"
          :options="[2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))"
        />
        <label class="f">Who is playing?</label>
        <div class="names">
          <div v-for="i in form.players" :key="i" class="name-row">
            <span>{{ i === 1 ? "You (host)" : `Player ${i}` }}</span>
            <input
              v-model="form.names[i - 1]"
              type="text"
              :maxlength="MAX_NAME_LENGTH"
              :placeholder="i === 1 ? 'Your name' : 'Name'"
              :aria-label="i === 1 ? 'Your name' : `Player ${i} name`"
            />
          </div>
        </div>
        <p class="hint">
          Each player gets a personal code to share with them. Turn order is shuffled when the draft
          is created.
        </p>
        <label class="f">Draft style</label>
        <SegControl
          v-model="form.mode"
          :options="[
            { value: 'open', label: 'Open pick' },
            { value: 'dealt', label: 'Dealt hand' },
          ]"
        />
        <p class="hint">
          <template v-if="form.mode === 'open'">Everyone picks from the whole pool.</template>
          <template v-else>
            The app deals {{ form.players + 1 }} random factions (at least one militant) and
            everyone picks from those, in the spirit of Advanced Setup. It re-deals until the reach
            target is reachable.
          </template>
        </p>
        <label class="f">Pick order</label>
        <SegControl
          v-model="form.order"
          :options="[
            { value: 'reverse', label: 'Last seat picks first' },
            { value: 'forward', label: 'First seat picks first' },
          ]"
        />
        <label class="f">Reach target</label>
        <SegControl
          v-model="form.goal"
          :options="[
            { value: 'recommended', label: `Recommended (${REACH_TARGETS[form.players]}+)` },
            { value: 'adventurous', label: 'Adventurous (17+)' },
          ]"
        />
        <label class="f">If a pick would make the target impossible</label>
        <SegControl
          v-model="form.guard"
          :options="[
            { value: 'block', label: 'Block it' },
            { value: 'warn', label: 'Just warn' },
          ]"
        />
      </section>

      <section class="panel">
        <h2>Faction pool</h2>
        <p class="hint" style="margin: 0 0 10px">
          Tap a faction to leave it out, for example boxes nobody owns. The number is its reach.
        </p>
        <div class="pool">
          <div v-for="x in expansions" :key="x.name" class="exp">
            <div class="row" style="justify-content: space-between">
              <b>{{ x.name }}</b>
              <button type="button" class="btn small" @click="toggleExpansion(x.name, x.allOff)">
                {{ x.allOff ? "Include all" : "Exclude all" }}
              </button>
            </div>
            <div class="chips">
              <button
                v-for="f in x.factions"
                :key="f.id"
                type="button"
                class="chip"
                :class="{ off: isOff(f.id) }"
                :aria-pressed="!isOff(f.id)"
                @click="form.off[f.id] = !form.off[f.id]"
              >
                <FactionDot :faction="f" />{{ f.name }} · {{ f.reach }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <aside class="stack">
      <section class="panel">
        <h2>Ready?</h2>
        <div class="big">
          {{ target }}+ <small>reach for {{ form.players }} players</small>
        </div>
        <p class="hint">
          {{ settings.pool.length }} factions in the pool. Best possible total:
          {{ best < 0 ? "none" : best }}.
        </p>
        <p v-if="problem || error" class="no" style="font-size: 14px">{{ problem || error }}</p>
        <p style="margin: 14px 0 0">
          <button type="button" class="btn primary" :disabled="!!problem || busy" @click="start">
            {{ busy ? "Creating..." : "Create draft" }}
          </button>
        </p>
      </section>

      <section class="panel">
        <h2>Reach reference</h2>
        <table class="t">
          <tbody>
            <tr><th>Players</th><th>Minimum total</th></tr>
            <tr v-for="n in [2, 3, 4, 5, 6]" :key="n">
              <td>{{ n }}</td>
              <td>{{ REACH_TARGETS[n] }}+</td>
            </tr>
          </tbody>
        </table>
        <p class="hint">
          Law of Root 5.2. The first Vagabond counts 5 and a second counts 2. Any mix with 17+ is
          allowed for adventurous tables.
        </p>
      </section>
    </aside>
  </div>
</template>
