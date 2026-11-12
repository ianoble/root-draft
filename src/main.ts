import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { registerGame } from '@engine/client';
import App from './App.vue';
import { router } from './router';
import { gameDef } from './logic';
import './style.css';

registerGame(gameDef);

createApp(App).use(createPinia()).use(router).mount('#app');
