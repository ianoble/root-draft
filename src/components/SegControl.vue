<script setup lang="ts" generic="T extends string | number">
defineProps<{ options: { value: T; label: string }[] }>();
const model = defineModel<T>({ required: true });
</script>

<template>
  <div class="seg">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      class="btn small"
      :class="{ on: model === o.value }"
      :aria-pressed="model === o.value"
      @click="model = o.value"
    >
      {{ o.label }}
    </button>
  </div>
</template>
