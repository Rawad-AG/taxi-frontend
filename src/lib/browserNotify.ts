export type BrowserPermission = NotificationPermission;

export function browserNotifySupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserPermission(): BrowserPermission | null {
  if (!browserNotifySupported()) return null;
  return Notification.permission;
}

export async function requestBrowserPermission(): Promise<BrowserPermission | null> {
  if (!browserNotifySupported()) return null;
  if (Notification.permission === 'default') {
    try {
      return await Notification.requestPermission();
    } catch {
      return null;
    }
  }
  return Notification.permission;
}

export function showBrowserNotification(
  title: string,
  body: string | null,
  onActivate?: () => void,
): boolean {
  if (!browserNotifySupported() || Notification.permission !== 'granted') return false;
  // Only pop a toast when the tab is not in focus — the in-app bell badge covers the foreground case.
  if (document.visibilityState === 'visible') return false;
  try {
    const n = new Notification(title, { body: body ?? undefined });
    n.onclick = () => {
      window.focus();
      n.close();
      onActivate?.();
    };
    return true;
  } catch {
    return false;
  }
}
