import React, { useEffect, useState } from 'react';
import { Bell, Sparkles, BookOpen, AlertTriangle } from 'lucide-react';
import { iOSNotification } from '../types';

interface NotificationCenterProps {
  notifications: iOSNotification[];
  onNotificationClick: (appName: 'ScreenTime' | 'LangFlix' | 'System') => void;
  onClearNotification: (id: string) => void;
}

export default function NotificationCenter({ notifications, onNotificationClick, onClearNotification }: NotificationCenterProps) {
  const [activeBanner, setActiveBanner] = useState<iOSNotification | null>(null);

  // Monitor notifications to display the latest unread one as a drop-down banner
  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length > 0) {
      const latest = unread[unread.length - 1];
      setActiveBanner(latest);
      
      // Auto-dismiss the drop-down banner after 5 seconds
      const timer = setTimeout(() => {
        setActiveBanner(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const handleBannerClick = () => {
    if (activeBanner) {
      onNotificationClick(activeBanner.appName);
      onClearNotification(activeBanner.id);
      setActiveBanner(null);
    }
  };

  return (
    <div className="absolute top-12 left-0 right-0 z-50 px-4 pointer-events-none">
      {activeBanner && (
        <div 
          onClick={handleBannerClick}
          className="w-full bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-3.5 shadow-2xl flex gap-3 cursor-pointer pointer-events-auto select-none transition-all active:scale-[0.98] animate-bounce"
        >
          {/* App Icon Circle */}
          <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-lg bg-zinc-950 border border-zinc-800">
            {activeBanner.appName === 'LangFlix' ? (
              <span className="text-sm font-bold text-rose-500">LF</span>
            ) : activeBanner.appName === 'ScreenTime' ? (
              <span>⏱️</span>
            ) : (
              <span>📱</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                {activeBanner.appName === 'LangFlix' ? 'LangFlix 영어학습' : '스크린타임'}
              </span>
              <span className="text-[10px] text-zinc-500">{activeBanner.timestamp}</span>
            </div>
            <h4 className="text-xs font-bold text-white truncate">{activeBanner.title}</h4>
            <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug line-clamp-2">{activeBanner.body}</p>
          </div>

          {/* Bullet */}
          <div className="flex items-center shrink-0">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
          </div>
        </div>
      )}
    </div>
  );
}
