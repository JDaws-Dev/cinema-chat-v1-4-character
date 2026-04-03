"use client";

interface Notification {
  id: number;
  text: string;
}

interface NotificationStackProps {
  notifications: Notification[];
}

export function NotificationStack({ notifications }: NotificationStackProps) {
  return (
    <div className="g3-quest-notif-stack" style={{ position: 'fixed', top: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 9999, pointerEvents: 'none' }}>
      {notifications.map((n) => (
        <div key={n.id} className="g3-quest-notif" style={{ position: 'relative', animation: 'g3-notif-in 0.3s ease-out' }}>{n.text}</div>
      ))}
    </div>
  );
}
