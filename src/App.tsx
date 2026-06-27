import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Clock, 
  Battery, 
  Wifi, 
  Signal, 
  Trash2, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  BookOpen,
  Sparkles,
  Smartphone,
  ChevronRight,
  Info,
  Sliders,
  CheckCircle2,
  Lock
} from 'lucide-react';

import { AppSettings, iOSNotification, ScreenTimeHistory } from './types';
import { shouldReset, getSecondsUntilNextFourAM, formatDuration, formatDigitalTime } from './utils/timeUtils';
import ScreenTimeApp from './components/ScreenTimeApp';
import NotificationCenter from './components/NotificationCenter';

// Default initial state
const DEFAULT_SETTINGS: AppSettings = {
  targetLimit: 1800, // 30 minutes in seconds
  instagramTime: 0,
  twitterTime: 0,
  langflixTime: 0,
  lastResetTime: new Date().toISOString(),
  studyGoalRatio: 1.0, // 1:1 ratio
  resetHour: 5 // default 5:00 AM
};

const DEFAULT_HISTORY: ScreenTimeHistory[] = [];

export default function App() {
  // Load state from localStorage or defaults
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('screentime_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.resetHour = 5;
        return parsed;
      } catch (e) { /* ignore */ }
    }
    return DEFAULT_SETTINGS;
  });

  const [history, setHistory] = useState<ScreenTimeHistory[]>(() => {
    const saved = localStorage.getItem('screentime_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DEFAULT_HISTORY;
  });

  const [notifications, setNotifications] = useState<iOSNotification[]>(() => {
    const saved = localStorage.getItem('screentime_notifications');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      {
        id: 'init-1',
        title: '스크린타임 연동 완료',
        body: '기기 사용량의 직접 터치 측정이 실시간 적용되었습니다! 🚀',
        timestamp: '방금',
        appName: 'System',
        isRead: false
      }
    ];
  });

  // Simulated system time & background recording
  const [simulatedTime, setSimulatedTime] = useState<Date>(new Date());
  const [secondsUntilReset, setSecondsUntilReset] = useState(0);

  // Active manual measurement state restored from localStorage on launch
  const [activeTimer, setActiveTimer] = useState<'none' | 'instagram' | 'twitter' | 'langflix'>(() => {
    const savedActive = localStorage.getItem('screentime_active_timer');
    if (savedActive && ['instagram', 'twitter', 'langflix'].includes(savedActive)) {
      return savedActive as 'instagram' | 'twitter' | 'langflix';
    }
    return 'none';
  });
  const [sessionSeconds, setSessionSeconds] = useState<number>(() => {
    const savedStart = localStorage.getItem('screentime_timer_start');
    if (savedStart) {
      const elapsed = Math.floor((Date.now() - Number(savedStart)) / 1000);
      return Math.max(0, elapsed);
    }
    return 0;
  });

  // Sound/Vibe indicator
  const [vibeMessage, setVibeMessage] = useState<string | null>(null);

  // Keep tracking of 15 minute blocks of social media usage to trigger periodic alerts
  const last15MinBlock = useRef<number>(0);
  const lastSession15MinTriggered = useRef<number>(0);

  // Silent audio loop to keep iOS PWA process awake in background
  const SILENT_AUDIO_URI = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startSilentAudio = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(SILENT_AUDIO_URI);
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(err => {
        console.log("Audio play deferred or blocked until user interaction", err);
      });
    } catch (e) {
      console.error("Silent audio initiation error", e);
    }
  };

  const stopSilentAudio = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch (e) {
      console.error("Silent audio stop error", e);
    }
  };

  // Pre-schedule future standard timeouts for notifications (multi-reservation)
  const scheduledTimeoutIds = useRef<any[]>([]);

  const cancelScheduledNotifications = () => {
    scheduledTimeoutIds.current.forEach(id => clearTimeout(id));
    scheduledTimeoutIds.current = [];
  };

  const scheduleBackgroundNotifications = (appName: 'instagram' | 'twitter', startTime: number) => {
    cancelScheduledNotifications();
    const appLabel = appName === 'instagram' ? '인스타그램' : '트위터';
    
    // Schedule alerts at 15m, 30m, 45m, 60m, 75m, 90m intervals
    const intervals = [15, 30, 45, 60, 75, 90];
    
    intervals.forEach(minutes => {
      const delayMs = minutes * 60 * 1000;
      
      const timeoutId = setTimeout(() => {
        sendPushNotification(
          `⚠️ ${appLabel} 연속 사용 경고 (${minutes}분)`,
          `측정을 시작한 지 ${minutes}분이 경과했습니다! 소셜 미디어를 끄고 영어 공부를 시작해보는 건 어떨까요?`,
          'ScreenTime'
        );
      }, delayMs);
      
      scheduledTimeoutIds.current.push(timeoutId);
    });
  };

  // Synchronizes react settings state with absolute timer timestamp difference (foolproof background tracking)
  const syncTimerWithTimestamp = () => {
    const currentActiveTimer = localStorage.getItem('screentime_active_timer') as 'none' | 'instagram' | 'twitter' | 'langflix' | null;
    if (!currentActiveTimer || currentActiveTimer === 'none') return;
    
    const savedStart = localStorage.getItem('screentime_timer_start');
    const savedBase = localStorage.getItem('screentime_base_time');
    
    if (savedStart && savedBase) {
      const elapsed = Math.floor((Date.now() - Number(savedStart)) / 1000);
      const currentElapsed = Math.max(0, elapsed);
      
      setSessionSeconds(currentElapsed);
      
      setSettings(prev => {
        const nextSettings = { ...prev };
        const nextTime = Number(savedBase) + currentElapsed;
        
        if (currentActiveTimer === 'langflix') {
          nextSettings.langflixTime = nextTime;
        } else if (currentActiveTimer === 'instagram') {
          nextSettings.instagramTime = nextTime;
        } else if (currentActiveTimer === 'twitter') {
          nextSettings.twitterTime = nextTime;
        }
        
        const totalSocialBefore = prev.instagramTime + prev.twitterTime;
        const totalSocialAfter = nextSettings.instagramTime + nextSettings.twitterTime;
        
        if (totalSocialBefore <= prev.targetLimit && totalSocialAfter > prev.targetLimit) {
          triggerVibration("⏱️ 일일 목표 소셜 시간을 초과했습니다!");
          sendPushNotification(
            '⚠️ 오늘의 소셜 사용 한도 초과!',
            `설정하신 ${prev.targetLimit / 60}분 제한을 초과했습니다. 지금 즉시 영어 공부를 시작해야 합니다!`,
            'ScreenTime'
          );
        }
        
        return nextSettings;
      });

      // Handle periodic 15 minute warning notifications
      if (currentActiveTimer === 'instagram' || currentActiveTimer === 'twitter') {
        const currentSessionBlock = Math.floor(currentElapsed / 900);
        if (currentSessionBlock > lastSession15MinTriggered.current) {
          for (let block = lastSession15MinTriggered.current + 1; block <= currentSessionBlock; block++) {
            const minutes = block * 15;
            const appLabel = currentActiveTimer === 'instagram' ? '인스타그램' : '트위터';
            sendPushNotification(
              `⚠️ ${appLabel} 연속 사용 경고 (${minutes}분)`,
              `측정을 시작한 지 ${minutes}분이 경과했습니다! 소셜 미디어를 끄고 영어 공부를 시작해보는 건 어떨까요?`,
              'ScreenTime'
            );
          }
          lastSession15MinTriggered.current = currentSessionBlock;
        }
      }
    }
  };

  // Computed metrics
  const totalSocial = settings.instagramTime + settings.twitterTime;
  const targetStudyTime = Math.floor(totalSocial * settings.studyGoalRatio);
  const studyDebt = Math.max(0, targetStudyTime - settings.langflixTime);
  const isGoalExceeded = totalSocial > settings.targetLimit;
  const currentResetHour = 5;

  // Save settings on changes
  useEffect(() => {
    localStorage.setItem('screentime_settings', JSON.stringify(settings));
  }, [settings]);

  // Save history on changes
  useEffect(() => {
    localStorage.setItem('screentime_history', JSON.stringify(history));
  }, [history]);

  // Save notifications on changes
  useEffect(() => {
    localStorage.setItem('screentime_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Core system clock: ticks every real-world second
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedTime(prev => {
        const nextTime = new Date(prev.getTime() + 1000);
        
        // 1. Check if configured reset hour threshold is crossed
        if (shouldReset(settings.lastResetTime, nextTime, currentResetHour)) {
          triggerDailyReset(nextTime);
        }
        
        // 2. Refresh seconds until next configured reset hour
        setSecondsUntilReset(getSecondsUntilNextFourAM(nextTime, currentResetHour));

        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [settings, currentResetHour]);

  // Direct touch update handler
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      const prevTotal = prev.instagramTime + prev.twitterTime;
      const nextTotal = (updated.instagramTime ?? prev.instagramTime) + (updated.twitterTime ?? prev.twitterTime);
      
      if (prevTotal <= prev.targetLimit && nextTotal > prev.targetLimit) {
        triggerVibration("⏱️ 일일 목표 소셜 시간을 초과했습니다!");
        sendPushNotification(
          '⚠️ 오늘의 소셜 사용 한도 초과!',
          `설정하신 ${prev.targetLimit / 60}분 제한을 초과했습니다. 지금 즉시 영어 공부를 시작해야 합니다!`,
          'ScreenTime'
        );
      }
      
      return updated;
    });
  };

  // Wrapper function to change the active timer with full sync, silent audio loop & notification schedules
  const handleSetActiveTimer = (newTimer: 'none' | 'instagram' | 'twitter' | 'langflix') => {
    if (newTimer === activeTimer) return;
    
    // 1. If there was a timer active before, finalize its settings
    if (activeTimer !== 'none') {
      const savedStart = localStorage.getItem('screentime_timer_start');
      const savedBase = localStorage.getItem('screentime_base_time');
      
      if (savedStart && savedBase) {
        const elapsed = Math.floor((Date.now() - Number(savedStart)) / 1000);
        const currentElapsed = Math.max(0, elapsed);
        const finalTime = Number(savedBase) + currentElapsed;
        
        setSettings(prev => {
          const updated = { ...prev };
          if (activeTimer === 'instagram') updated.instagramTime = finalTime;
          if (activeTimer === 'twitter') updated.twitterTime = finalTime;
          if (activeTimer === 'langflix') updated.langflixTime = finalTime;
          return updated;
        });
      }
      
      localStorage.removeItem('screentime_active_timer');
      localStorage.removeItem('screentime_timer_start');
      localStorage.removeItem('screentime_base_time');
      
      cancelScheduledNotifications();
      stopSilentAudio();
    }
    
    // 2. Set new active timer
    if (newTimer !== 'none') {
      const baseValue = newTimer === 'instagram' 
        ? settings.instagramTime 
        : newTimer === 'twitter' 
          ? settings.twitterTime 
          : settings.langflixTime;
      
      const now = Date.now();
      localStorage.setItem('screentime_active_timer', newTimer);
      localStorage.setItem('screentime_timer_start', String(now));
      localStorage.setItem('screentime_base_time', String(baseValue));
      
      setSessionSeconds(0);
      lastSession15MinTriggered.current = 0;
      
      startSilentAudio();
      
      if (newTimer === 'instagram' || newTimer === 'twitter') {
        scheduleBackgroundNotifications(newTimer, now);
      }
    }
    
    setActiveTimer(newTimer);
  };

  // Sync timer on focus / visibility change (iOS PWA return to foreground)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncTimerWithTimestamp();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', syncTimerWithTimestamp);
    
    // If a timer was already active on mount (PWA resume/reload), start background audio and schedule notifications
    if (activeTimer !== 'none') {
      startSilentAudio();
      const savedStart = localStorage.getItem('screentime_timer_start');
      if (savedStart) {
        const elapsed = Math.floor((Date.now() - Number(savedStart)) / 1000);
        lastSession15MinTriggered.current = Math.floor(elapsed / 900);
        if (activeTimer === 'instagram' || activeTimer === 'twitter') {
          scheduleBackgroundNotifications(activeTimer, Number(savedStart));
        }
      }
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', syncTimerWithTimestamp);
    };
  }, [activeTimer]);

  // Run synchronization interval every second when activeTimer is running
  useEffect(() => {
    if (activeTimer === 'none') {
      lastSession15MinTriggered.current = 0;
      return;
    }

    syncTimerWithTimestamp();

    const interval = setInterval(() => {
      syncTimerWithTimestamp();
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  // Periodic notifications every 15 mins of combined social media usage
  useEffect(() => {
    const currentBlock = Math.floor(totalSocial / 900); // 900 seconds = 15 minutes
    
    if (last15MinBlock.current === 0 && currentBlock > 0) {
      last15MinBlock.current = currentBlock;
    }

    if (currentBlock > last15MinBlock.current) {
      const debt = Math.max(0, totalSocial - settings.langflixTime);
      sendPushNotification(
        '🚨 소셜 미디어 15분 경과 알림',
        `현재 소셜 합산 사용시간은 ${formatDuration(totalSocial)}입니다. 소셜 미디어 제어를 위해 ${formatDuration(debt)} 만큼 영어 공부(랭플릭스)를 진행해 주세요!`,
        'ScreenTime'
      );
      last15MinBlock.current = currentBlock;
    } else if (currentBlock < last15MinBlock.current) {
      last15MinBlock.current = currentBlock;
    }
  }, [totalSocial, settings.langflixTime]);

  // Utility to send notification
  const sendPushNotification = (title: string, body: string, appName: 'ScreenTime' | 'LangFlix' | 'System') => {
    const newNotif: iOSNotification = {
      id: `notif-${Date.now()}`,
      title,
      body,
      timestamp: '방금',
      appName,
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    triggerVibration(`🔔 알림: ${title}`);
    
    // Attempt actual native OS push notification
    if ('Notification' in window && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body,
            icon: '/apple-touch-icon.png',
            badge: '/favicon.png'
          });
        }).catch(() => {
          new Notification(title, { body });
        });
      } else {
        new Notification(title, { body });
      }
    }
  };

  // Request browser notification permission the very first time the app is opened
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          sendPushNotification(
            '🔔 알림 활성화 완료',
            '스크린디톡스 실시간 15분 경고 알림이 성공적으로 설정되었습니다!',
            'System'
          );
        }
      });
    }
  }, []);

  const triggerVibration = (msg: string) => {
    setVibeMessage(msg);
    setTimeout(() => setVibeMessage(null), 3000);
  };

  // Perform reset based on configured hour
  const triggerDailyReset = (timeToCheck: Date) => {
    const settledDate = new Date(timeToCheck.getTime());
    settledDate.setDate(settledDate.getDate() - 1);
    const formattedDate = `${settledDate.getMonth() + 1}월 ${settledDate.getDate()}일`;
    const totalSocial = settings.instagramTime + settings.twitterTime;
    
    const newRecord: ScreenTimeHistory = {
      date: formattedDate,
      socialTime: totalSocial,
      studyTime: settings.langflixTime,
      isGoalAchieved: totalSocial <= settings.targetLimit
    };

    setHistory(prev => {
      const updated = [newRecord, ...prev];
      if (updated.length > 7) updated.pop(); // keep last 7 days
      return updated;
    });

    setSettings(prev => ({
      ...prev,
      instagramTime: 0,
      twitterTime: 0,
      langflixTime: 0,
      lastResetTime: timeToCheck.toISOString()
    }));

    sendPushNotification(
      `🌅 새벽 ${currentResetHour}:00 일일 정산 완료`,
      `새로운 하루가 시작되어 사용 기록이 초기화되었습니다. 어제 소셜 사용량: ${formatDuration(totalSocial)}`,
      'System'
    );
    triggerVibration(`🌅 새벽 ${currentResetHour}:00 정각 스크린타임 리셋`);
  };

  // Change configured reset hour
  const handleSetResetHour = (hour: number) => {
    setSettings(prev => ({
      ...prev,
      resetHour: hour
    }));
    triggerVibration(`⚙️ 일일 강제 초기화 시간이 새벽 ${hour}시로 설정되었습니다.`);
  };

  // UI Handlers
  const handleForceReset = () => {
    const targetTime = new Date(simulatedTime);
    targetTime.setHours(currentResetHour, 0, 5, 0); // slightly pastconfigured reset hour
    setSimulatedTime(targetTime);
    triggerDailyReset(targetTime);
  };

  const handleClearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (appName: 'ScreenTime' | 'LangFlix' | 'System') => {
    const appNameKo = appName === 'LangFlix' ? 'LangFlix 영어학습' : '스크린타임';
    triggerVibration(`🔗 ${appNameKo} 알림을 확인했습니다.`);
  };

  const clearAllData = () => {
    localStorage.removeItem('screentime_settings');
    localStorage.removeItem('screentime_history');
    localStorage.removeItem('screentime_notifications');
    setSettings(DEFAULT_SETTINGS);
    setHistory(DEFAULT_HISTORY);
    setNotifications([
      {
        id: 'reset-1',
        title: '데이터 초기화 완료',
        body: '시뮬레이터의 모든 설정과 스크린타임 기록이 초기화되었습니다.',
        timestamp: '방금',
        appName: 'System',
        isRead: false
      }
    ]);
    triggerVibration("🧹 모든 데이터 초기화 완료");
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center font-sans antialiased">
      
      {/* Vibration Indicator */}
      {vibeMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-950 text-white px-6 py-2.5 rounded-full text-xs font-black tracking-widest uppercase shadow-xl flex items-center gap-2 border border-zinc-800 animate-bounce font-space">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span>{vibeMessage}</span>
        </div>
      )}

      {/* Main app shell: Full height on mobile PWA, beautifully framed on desktop */}
      <div className="w-full max-w-md min-h-screen md:min-h-[700px] md:my-8 bg-white md:rounded-[32px] md:shadow-2xl border border-zinc-100 relative overflow-hidden flex flex-col shrink-0 select-none">
        
        {/* iOS-style Notifications overlay banner inside the app */}
        <NotificationCenter 
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onClearNotification={handleClearNotification}
        />

        {/* Main Content Area */}
        <div className="flex-1 relative flex flex-col overflow-hidden">
          
          <ScreenTimeApp 
            settings={settings}
            updateSettings={handleUpdateSettings}
            history={history}
            secondsUntilReset={secondsUntilReset}
            activeTimer={activeTimer}
            setActiveTimer={handleSetActiveTimer}
          />

          {/* Time-limit warning overlay inside the app when target is exceeded */}
          {isGoalExceeded && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-40 p-6 flex flex-col justify-center items-center text-center space-y-6 animate-fade-in">
              <div className="w-14 h-14 bg-rose-50 border border-rose-100 text-rose-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-zinc-900 font-space">시간 한도 초과</h3>
                <p className="text-xs text-zinc-500 leading-relaxed max-w-[200px]">
                  오늘 허용된 소셜 미디어 시간을 초과했습니다. 공부를 진행하여 잠금을 해제하십시오.
                </p>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl w-full max-w-[220px]">
                <span className="text-[8px] font-black text-rose-600 tracking-wider block uppercase mb-0.5 font-space">남은 영어 공부 시간</span>
                <span className="text-2xl font-black text-rose-600 font-outfit tracking-widest">{formatDigitalTime(studyDebt)}</span>
              </div>
              <p className="text-[9px] text-zinc-400 max-w-[180px]">
                ※ 상단의 📚 <strong>STUDY DEBT DUE</strong> 카드를 터치하여 공부 시간을 채우고 공부 빚을 줄여보세요!
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
