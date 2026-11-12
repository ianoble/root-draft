<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { NobleProvider } from '@engine/client';
import { SERVER_URL } from './config';

const route = useRoute();
/** boardgame.io debug panel: add ?debug to the URL to show it. */
const showDebug = new URLSearchParams(window.location.search).has('debug');
</script>

<template>
  <NobleProvider :server-url="SERVER_URL" :debug="showDebug">
    <div class="wrap">
      <header class="top">
        <h1><small>Woodland war council</small>Root Faction Draft</h1>
        <nav>
          <RouterLink class="btn small" :class="{ on: route.name !== 'browse' }" to="/">Drafts</RouterLink>
          <RouterLink class="btn small" :class="{ on: route.name === 'browse' }" to="/factions">
            Factions
          </RouterLink>
        </nav>
      </header>
      <main><RouterView /></main>
      <footer>
        Unofficial fan tool. Root is designed by Cole Wehrle and published by Leder Games. Faction
        descriptions here are original summaries; follow the links in each faction for the actual
        rules. Reach values and minimums come from the Law of Root, section 5.2.
      </footer>
    </div>
  </NobleProvider>
</template>
