<script setup lang="ts">
import { computed } from "vue";
import { isComplete, maxReach, reachOf, remaining, targetOf, type DraftState } from "../logic";

const props = defineProps<{ state: DraftState }>();

const target = computed(() => targetOf(props.state));
const total = computed(() => reachOf(props.state.picks));
const done = computed(() => isComplete(props.state));
/** Best total still reachable by the seats yet to pick; -1 if there is no legal way to finish. */
const best = computed(() =>
  done.value
    ? total.value
    : maxReach(props.state.picks, remaining(props.state), props.state.players - props.state.picks.length),
);
const scale = computed(() => Math.max(target.value, best.value, total.value, 1) * 1.1);
const pct = (v: number) => Math.min(100, (v / scale.value) * 100) + "%";
</script>

<template>
  <section class="panel">
    <h2>Reach</h2>
    <div class="big">
      {{ total }} <small>of {{ target }}+ for {{ state.players }} players</small>
    </div>
    <div class="meter">
      <em v-if="best > 0" :style="{ width: pct(best) }"></em>
      <i :style="{ width: pct(total) }"></i>
    </div>
    <p class="hint">
      <template v-if="done && total >= target">
        <span class="ok">Target met.</span> This lineup is good to play.
      </template>
      <template v-else-if="done">
        <span class="no">Below target by {{ target - total }}.</span>
        The Law suggests a mix with more board presence.
      </template>
      <template v-else-if="best >= target">On track: up to {{ best }} still possible.</template>
      <span v-else class="wn">
        Target is out of reach: best possible is {{ best < 0 ? "none" : best }}.
      </span>
    </p>
  </section>
</template>
