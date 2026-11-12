import { createRouter, createWebHistory } from 'vue-router';
import LobbyView from './views/LobbyView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'lobby', component: LobbyView },
    { path: '/factions', name: 'browse', component: () => import('./views/BrowseView.vue') },
    // Old invite links: players now enter a code in the lobby.
    { path: '/join/:matchID', redirect: '/' },
    { path: '/game/:matchID/:playerID', name: 'game', component: () => import('./views/GameView.vue'), props: true },
    { path: '/:rest(.*)*', redirect: '/' },
  ],
});
