<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';

defineProps<{ reason: string }>();
const emit = defineEmits<{ done: [] }>();

const { loginError, loading, register, login } = useAuth();
const mode = ref<'login' | 'register'>('login');
const name = ref('');
const pin = ref('');

async function submit() {
  if (loading.value || !name.value.trim() || pin.value.length < 4) return;
  const ok =
    mode.value === 'register'
      ? await register(name.value.trim(), pin.value)
      : await login(name.value.trim(), pin.value);
  if (ok) emit('done');
}

function swap() {
  mode.value = mode.value === 'login' ? 'register' : 'login';
  loginError.value = '';
}
</script>

<template>
  <section class="panel narrow">
    <h2>{{ mode === 'login' ? 'Sign in' : 'Create an account' }}</h2>
    <p class="hint" style="margin: 0">{{ reason }} Accounts are shared with the other Noble Games.</p>
    <form @submit.prevent="submit">
      <label class="f" for="auth-name">Name</label>
      <input id="auth-name" v-model="name" type="text" maxlength="24" autocomplete="username" />
      <label class="f" for="auth-pin">PIN (4 to 8 characters)</label>
      <input
        id="auth-pin"
        v-model="pin"
        type="password"
        maxlength="8"
        :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
      />
      <p v-if="loginError" class="no" style="font-size: 14px; margin: 10px 0 0">{{ loginError }}</p>
      <p class="row" style="margin: 14px 0 0">
        <button class="btn primary" type="submit" :disabled="loading || !name.trim() || pin.length < 4">
          {{ loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account' }}
        </button>
        <button class="btn small" type="button" @click="swap">
          {{ mode === 'login' ? 'New here? Create an account' : 'Have an account? Sign in' }}
        </button>
      </p>
    </form>
  </section>
</template>
