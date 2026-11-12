import { ref, watch, type Ref } from 'vue';

/**
 * Browser notification when it becomes this player's pick while the tab is in the background.
 * (The engine's useTurnNotifications follows boardgame.io turns, which this game does not use.)
 */
export function usePickNotifications(isMyPick: Ref<boolean>, title: string) {
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const permission = ref<NotificationPermission>(supported ? Notification.permission : 'denied');

  async function enable() {
    if (supported) permission.value = await Notification.requestPermission();
  }

  watch(isMyPick, (mine, was) => {
    if (!mine || was || !supported || permission.value !== 'granted' || !document.hidden) return;
    const n = new Notification(title, { body: "It's your pick.", tag: 'root-draft-pick' });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  });

  return { supported, permission, enable };
}
