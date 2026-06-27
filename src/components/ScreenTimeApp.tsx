import React, { useState } from 'react';
import { AppSettings, ScreenTimeHistory } from '../types';
import { formatDigitalTime } from '../utils/timeUtils';
import { 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  Clock, 
  Settings,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface ScreenTimeAppProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  history: ScreenTimeHistory[];
  secondsUntilReset: number;
  activeTimer: 'none' | 'instagram' | 'twitter' | 'langflix';
  setActiveTimer: (timer: 'none' | 'instagram' | 'twitter' | 'langflix') => void;
}

export default function ScreenTimeApp({ 
  settings, 
  updateSettings, 
  history, 
  secondsUntilReset,
  activeTimer,
  setActiveTimer
}: ScreenTimeAppProps) {
  const [viewMode, setViewMode] = useState<'today' | 'weekly'>('today');

  const totalSocialTime = settings.instagramTime + settings.twitterTime;
  
  // Study debt calculation based on exact user's formula: (Instagram time + Twitter time) - Langflix study time
  // Allows negative values to represent credit (studying first or studying more than social media use)
  const studyDebt = totalSocialTime - settings.langflixTime;
  const isDebtCleared = studyDebt <= 0;

  // Slice the most recent 5 past days from history and reverse them so that left-to-right goes from oldest to newest, then append today's record at the end
  const todayRecord: ScreenTimeHistory = {
    date: '오늘',
    socialTime: totalSocialTime,
    studyTime: settings.langflixTime,
    isGoalAchieved: isDebtCleared
  };
  const displayHistory = [...[...history].slice(0, 5).reverse(), todayRecord];

  // Find max value in history to scale the bar chart properly
  const maxHistoryValue = Math.max(
    ...displayHistory.map(d => Math.max(d.socialTime, d.studyTime)),
    300 // default minimum peak (5 minutes) for scaling
  );

  const resetHour = 5;

  return (
    <div id="screentime-app-container" className="h-screen max-h-screen flex flex-col bg-white text-zinc-950 select-none relative overflow-hidden font-sans">
      
      {/* Header */}
      <div className="pt-8 pb-3 px-6 bg-white border-b border-zinc-100 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-800" />
          <span className="text-[11px] font-black tracking-widest text-zinc-900 uppercase font-space">SCREEN TIME</span>
        </div>
      </div>

      {/* Main Container - No-Scroll Design */}
      <div className="flex-1 flex flex-col justify-between p-5 pb-4 overflow-hidden space-y-4">
        
        {viewMode === 'today' ? (
          /* TODAY VIEW MODE */
          <div className="flex-1 flex flex-col justify-between space-y-4">
            
            {/* 1. Study Required Debt Box (Huge Callout) with 1:1 Langflix Shortcut */}
            <div className="flex items-center gap-3">
              <div 
                onClick={() => setActiveTimer(activeTimer === 'langflix' ? 'none' : 'langflix')}
                className={`border flex-1 ${
                  isDebtCleared 
                    ? 'border-emerald-100 bg-emerald-50/20' 
                    : activeTimer === 'langflix'
                      ? 'border-emerald-500 bg-emerald-100/35 ring-2 ring-emerald-500/20 animate-pulse'
                      : 'border-rose-100 bg-rose-50/20'
                } p-3.5 rounded-2xl flex flex-col justify-between transition-all duration-300 h-24 cursor-pointer hover:scale-[1.01] active:scale-[0.99] select-none shadow-sm`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] font-black tracking-widest uppercase font-space ${
                    isDebtCleared ? 'text-emerald-600' : activeTimer === 'langflix' ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    STUDY DEBT DUE
                  </span>
                  {activeTimer === 'langflix' ? (
                    <span className="px-1.5 py-0.5 bg-emerald-500 text-white rounded text-[7px] font-black tracking-wider uppercase font-space animate-pulse">
                      ● STUDYING
                    </span>
                  ) : isDebtCleared ? (
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[7px] font-black tracking-wider uppercase font-space">
                      CLEARED
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[7px] font-black tracking-wider uppercase font-space animate-pulse">
                      REQUIRED
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className={`text-3xl font-black tracking-tight font-outfit ${
                    isDebtCleared ? 'text-emerald-600' : activeTimer === 'langflix' ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    {formatDigitalTime(studyDebt)}
                  </div>
                  <p className="text-[9px] text-zinc-500 font-semibold leading-none truncate">
                    {activeTimer === 'langflix'
                      ? '공부 시간을 측정 중입니다...'
                      : studyDebt < 0
                        ? '초과 공부 축적! 소셜 미디어 여유 확보'
                        : isDebtCleared 
                          ? '완벽합니다! 오늘의 소셜 빚을 모두 갚았습니다.' 
                          : '영어 공부(랭플릭스)가 밀려있습니다.'
                    }
                  </p>
                </div>
              </div>
 
              {/* 1:1 Langflix Shortcut App Icon */}
              <a
                href="https://apps.apple.com/kr/app/%EB%9E%AD%ED%94%8C%EB%A6%AD%EC%8A%A4-%EC%98%81%EC%96%B4%EA%B3%B5%EB%B6%80-%EC%98%81%EC%96%B4%ED%9A%8C%ED%99%94-%EC%98%81%EB%8B%A8%EC%96%B4-%EB%8B%A8%EC%96%B4%EC%9E%A5/id6739905184"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  if (activeTimer !== 'langflix') {
                    setActiveTimer('langflix');
                  }
                  
                  // Custom URL Scheme deep-linking launch attempt for iOS native application.
                  const customScheme = "langflix://";
                  const appStoreUrl = "https://apps.apple.com/kr/app/%EB%9E%AD%ED%94%8C%EB%A6%AD%EC%8A%A4-%EC%98%81%EC%96%B4%EA%B3%B5%EB%B6%80-%EC%98%81%EC%96%B4%ED%9A%8C%ED%99%94-%EC%98%81%EB%8B%A8%EC%96%B4-%EB%8B%A8%EC%96%B4%EC%9E%A5/id6739905184";
                  
                  const start = Date.now();
                  window.location.href = customScheme;
                  
                  // Fallback: If the browser is still active after 1.2s (indicating the app wasn't installed or couldn't launch),
                  // we open the App Store URL in a new tab.
                  setTimeout(() => {
                    if (Date.now() - start < 1500) {
                      window.open(appStoreUrl, '_blank');
                    }
                  }, 1200);
                }}
                className="w-24 h-24 shrink-0 rounded-2xl bg-[#E16539] flex flex-col items-center justify-center text-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] active:scale-95 cursor-pointer relative group overflow-hidden"
                title="랭플릭스 바로가기 (공부 자동 시작)"
              >
                {/* Glossy light effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/5 to-transparent pointer-events-none" />
                <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
                
                {/* Langflix Custom Cute Character SVG based on provided image */}
                <svg viewBox="0 0 100 100" className="w-[76px] h-[76px] drop-shadow-[0_4px_10px_rgba(0,0,0,0.25)]" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Stripes (hair/waves) on top-right */}
                  <path d="M 46 17 C 59 19, 74 29, 80 43" stroke="black" strokeWidth="4.8" strokeLinecap="round" />
                  <path d="M 53 13 C 68 16, 83 28, 88 45" stroke="black" strokeWidth="4.8" strokeLinecap="round" />
                  <path d="M 62 10 C 80 14, 93 28, 95 48" stroke="black" strokeWidth="4.8" strokeLinecap="round" />

                  {/* Character Body (chubby black play button/pebble) */}
                  <path d="M 28 32
                           C 21 44, 19 61, 28 72
                           C 37 83, 61 83, 71 72
                           C 79 61, 77 44, 67 29
                           C 57 14, 37 17, 28 32 Z" 
                        fill="black" />

                  {/* Left Eye */}
                  <circle cx="41.5" cy="51.5" r="10" fill="white" />
                  <circle cx="42.5" cy="51.5" r="5.2" fill="black" />
                  <circle cx="41" cy="49.5" r="2" fill="white" />

                  {/* Right Eye */}
                  <circle cx="61.5" cy="51.5" r="10" fill="white" />
                  <circle cx="60.5" cy="51.5" r="5.2" fill="black" />
                  <circle cx="59" cy="49.5" r="2" fill="white" />
                </svg>
              </a>
            </div>

            {/* 2. Individual App Breakdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Instagram */}
              <div className="flex items-center gap-2">
                <div 
                  onClick={() => setActiveTimer(activeTimer === 'instagram' ? 'none' : 'instagram')}
                  className={`border flex-1 ${
                    activeTimer === 'instagram'
                      ? 'border-pink-500 bg-pink-100/40 ring-2 ring-pink-500/20 animate-pulse text-pink-950'
                      : 'border-pink-200 bg-pink-50/30 text-pink-950'
                  } rounded-2xl p-3 flex flex-col justify-between h-20 transition hover:bg-pink-50/50 cursor-pointer hover:scale-[1.01] active:scale-[0.99] select-none shadow-sm`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black tracking-widest text-pink-500 uppercase font-space flex items-center gap-1">
                      INSTAGRAM
                      {activeTimer === 'instagram' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                      )}
                    </span>
                    {activeTimer === 'instagram' && (
                      <span className="text-[8px] font-bold text-pink-600 bg-pink-100/60 px-1 py-0.5 rounded">측정중</span>
                    )}
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-outfit tracking-tight tabular-nums">
                    {formatDigitalTime(settings.instagramTime)}
                  </div>
                </div>

                {/* 1:1 Instagram Shortcut App Icon */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (activeTimer !== 'instagram') {
                      setActiveTimer('instagram');
                    }
                  }}
                  className="w-20 h-20 shrink-0 rounded-2xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] active:scale-95 cursor-pointer relative group overflow-hidden"
                  title="인스타그램 바로가기 (측정 자동 시작)"
                >
                  {/* Glossy light effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/5 to-transparent pointer-events-none" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
                  
                  {/* Instagram Camera Logo SVG */}
                  <svg className="w-9 h-9 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              </div>

              {/* Twitter */}
              <div className="flex items-center gap-2">
                <div 
                  onClick={() => setActiveTimer(activeTimer === 'twitter' ? 'none' : 'twitter')}
                  className={`border flex-1 ${
                    activeTimer === 'twitter'
                      ? 'border-sky-500 bg-sky-100/40 ring-2 ring-sky-500/20 animate-pulse text-sky-950'
                      : 'border-sky-200 bg-sky-50/30 text-sky-950'
                  } rounded-2xl p-3 flex flex-col justify-between h-20 transition hover:bg-sky-50/50 cursor-pointer hover:scale-[1.01] active:scale-[0.99] select-none shadow-sm`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black tracking-widest text-sky-400 uppercase font-space flex items-center gap-1">
                      TWITTER (X)
                      {activeTimer === 'twitter' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                      )}
                    </span>
                    {activeTimer === 'twitter' && (
                      <span className="text-[8px] font-bold text-sky-600 bg-sky-100/60 px-1 py-0.5 rounded">측정중</span>
                    )}
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-outfit tracking-tight tabular-nums">
                    {formatDigitalTime(settings.twitterTime)}
                  </div>
                </div>

                {/* 1:1 Twitter/X Shortcut App Icon - Classic Blue Bird */}
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (activeTimer !== 'twitter') {
                      setActiveTimer('twitter');
                    }
                  }}
                  className="w-20 h-20 shrink-0 rounded-2xl bg-[#1DA1F2] flex items-center justify-center text-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] active:scale-95 cursor-pointer relative group overflow-hidden"
                  title="트위터 바로가기 (측정 자동 시작)"
                >
                  {/* Glossy light effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
                  
                  {/* Classic Twitter Bird Logo SVG */}
                  <svg className="w-9 h-9 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] fill-current text-white" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* 3. Main Combined Social Time (Huge Bold Visual) */}
            <div className="text-center py-6 space-y-3">
              <span className="text-[11px] font-black tracking-[0.25em] text-zinc-400 uppercase flex items-center justify-center gap-2 font-space">
                {(activeTimer === 'instagram' || activeTimer === 'twitter') && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
                <span>COMBINED SOCIAL TIME</span>
              </span>
              <div className="text-4xl font-black tracking-tight text-zinc-950 font-outfit select-all leading-none py-1 drop-shadow-sm">
                {formatDigitalTime(totalSocialTime)}
              </div>
            </div>

            {/* 4. Action Button to Weekly View */}
            <button
              onClick={() => setViewMode('weekly')}
              className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-900 text-white rounded-2xl flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer shadow-md"
            >
              <Calendar className="w-4 h-4 text-zinc-400" />
              <span className="text-[10px] font-black tracking-widest uppercase font-space">일주일 분석 리포트 보기</span>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>

          </div>
        ) : (
          /* WEEKLY HISTORY VIEW MODE */
          <div className="flex-1 flex flex-col justify-between space-y-4">
            
            {/* Header / Top Back Button */}
            <div className="flex items-center justify-between py-1">
              <button
                onClick={() => setViewMode('today')}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-950 text-[10px] font-black tracking-wider uppercase cursor-pointer font-space"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>오늘 분석으로</span>
              </button>
              <span className="text-[9px] font-black tracking-[0.2em] text-zinc-400 uppercase font-space">
                WEEKLY REPORT
              </span>
            </div>

            {/* Weekly Bar Chart Panel */}
            <div className="border border-zinc-100 bg-zinc-50/30 rounded-2xl p-4 flex-1 flex flex-col justify-between min-h-[280px] shadow-sm">
              
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black tracking-widest text-zinc-400 uppercase block font-space">
                    AVERAGE SNS VS STUDY
                  </span>
                  <h4 className="text-lg font-black text-zinc-900">최근 일주일간의 변화</h4>
                </div>
              </div>

              {/* Clean Vertical Bar Chart */}
              <div className="h-40 flex items-end justify-between pt-4 relative">
                {/* Background Guidelines */}
                <div className="absolute inset-x-0 top-0 border-t border-zinc-100/80" />
                <div className="absolute inset-x-0 top-1/2 border-t border-zinc-100/80" />

                {history.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <span className="text-[11px] font-bold text-zinc-400">아직 정산된 기록이 없습니다.</span>
                    <span className="text-[9px] text-zinc-400 mt-1 leading-relaxed max-w-[240px]">매일 새벽 5시에 오늘 사용량이 정산되어 차례대로 기록됩니다!</span>
                  </div>
                ) : (
                  displayHistory.map((day, idx) => {
                    const socialHeight = Math.max(6, Math.min(100, (day.socialTime / maxHistoryValue) * 100));
                    const studyHeight = Math.max(6, Math.min(100, (day.studyTime / maxHistoryValue) * 100));

                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 space-y-2">
                        <div className="flex gap-1.5 items-end h-28">
                          
                          {/* Social Time Bar */}
                          <div className="group relative">
                            <div 
                              className="w-3 bg-zinc-300 rounded-t-sm transition-all duration-300 hover:bg-zinc-400 cursor-pointer"
                              style={{ height: `${socialHeight}px` }}
                            />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-zinc-950 text-[8px] font-bold text-white px-2 py-0.5 rounded whitespace-nowrap z-40 pointer-events-none shadow-md">
                              SNS: {Math.round(day.socialTime / 60)}분
                            </div>
                          </div>

                          {/* Study Time Bar */}
                          <div className="group relative">
                            <div 
                              className="w-3 bg-orange-500 rounded-t-sm transition-all duration-300 hover:bg-orange-600 cursor-pointer"
                              style={{ height: `${studyHeight}px` }}
                            />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-zinc-950 text-[8px] font-bold text-white px-2 py-0.5 rounded whitespace-nowrap z-40 pointer-events-none shadow-md">
                              공부: {Math.round(day.studyTime / 60)}분
                            </div>
                          </div>

                        </div>

                        {/* Day Label */}
                        <span className="text-[8px] font-black tracking-wider text-zinc-400 uppercase font-space">
                          {day.date.includes('(') ? day.date.split(' ')[0] : day.date}
                        </span>
                      </div>
                    );
                  })
                )}

              </div>

              {/* Custom Legend */}
              <div className="flex justify-center gap-5 pt-3 border-t border-zinc-100 text-[9px] font-bold tracking-wider text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-zinc-300 rounded-sm" />
                  <span>소셜 미디어 사용</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-orange-500 rounded-sm" />
                  <span>영어 공부 (랭플릭스)</span>
                </div>
              </div>

            </div>

            {/* Back Button */}
            <button
              onClick={() => setViewMode('today')}
              className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-900 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase transition cursor-pointer font-space shadow-md"
            >
              오늘 기록 보기
            </button>

          </div>
        )}

        {/* Dawn Countdown info footer (Shared) */}
        <div className="text-center text-[8px] font-extrabold tracking-[0.2em] text-zinc-400 uppercase mt-2 pt-2 border-t border-zinc-100 font-space pb-1">
          RESETS DAILY AT {resetHour.toString().padStart(2, '0')}:00 AM · NEXT RESET IN {formatDigitalTime(secondsUntilReset)}
        </div>

      </div>
    </div>
  );
}
