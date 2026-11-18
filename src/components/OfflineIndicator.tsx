import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-2 right-2 z-[65] pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#121626]/95 border border-[#fbbf24]/55 text-[11px] font-semibold text-[#fde68a] shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
      <span>离线单机模式 · 本地存档正常运行</span>
    </div>
  );
}
