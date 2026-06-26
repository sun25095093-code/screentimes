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
  const studyDebt = Math.max(0, totalSocialTime - settings.langflixTime);
  const isDebtCleared = studyDebt <= 0;

  // Slice the most recent 6 days and reverse them so that left-to-right goes from oldest to newest (most recent on the right)
  const displayHistory = [...history].slice(0, 6).reverse();

  // Find max value in history to scale the bar chart properly
  const maxHistoryValue = Math.max(
    ...displayHistory.map(d => Math.max(d.socialTime, d.studyTime)),
    300 // default minimum peak (5 minutes) for scaling
  );

  const resetHour = 5;

  return (
    <div id="screentime-app-container" className="h-full flex flex-col bg-white text-zinc-950 select-none relative overflow-hidden font-sans">
      
      {/* Header */}
      <div className="pt-10 pb-3 px-5 bg-white border-b border-zinc-100 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-zinc-800" />
          <span className="text-[10px] font-black tracking-widest text-zinc-900 uppercase font-space">SCREEN TIME</span>
        </div>
      </div>

      {/* Main Container - No-Scroll Design */}
      <div className="flex-1 flex flex-col justify-between p-4 pb-8 overflow-hidden">
        
        {viewMode === 'today' ? (
          /* TODAY VIEW MODE */
          <div className="flex-1 flex flex-col justify-between space-y-4">
            
            {/* 1. Study Required Debt Box (Huge Callout) */}
            <div 
              onClick={() => setActiveTimer(activeTimer === 'langflix' ? 'none' : 'langflix')}
              className={`border ${
                isDebtCleared 
                  ? 'border-emerald-100 bg-emerald-50/20' 
                  : activeTimer === 'langflix'
                    ? 'border-emerald-500 bg-emerald-100/35 ring-2 ring-emerald-500/20 animate-pulse'
                    : 'border-rose-100 bg-rose-50/20'
              } p-4 rounded-xl flex flex-col justify-between transition-all duration-300 h-[120px] cursor-pointer hover:scale-[1.01] active:scale-[0.99] select-none`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-[8.5px] font-black tracking-widest uppercase font-space ${
                  isDebtCleared ? 'text-emerald-600' : activeTimer === 'langflix' ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  STUDY DEBT DUE
                </span>
                {activeTimer === 'langflix' ? (
                  <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[7px] font-black tracking-wider uppercase font-space animate-pulse">
                    ● STUDYING
                  </span>
                ) : isDebtCleared ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[7px] font-black tracking-wider uppercase font-space">
                    CLEARED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[7px] font-black tracking-wider uppercase font-space animate-pulse">
                    REQUIRED
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className={`text-4xl font-black tracking-tight font-outfit ${
                  isDebtCleared ? 'text-emerald-600' : activeTimer === 'langflix' ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  {formatDigitalTime(studyDebt)}
                </div>
                <p className="text-[9.5px] text-zinc-500 font-medium leading-relaxed">
                  {activeTimer === 'langflix'
                    ? '공부 시간을 측정 중입니다... (누르면 정지)'
                    : isDebtCleared 
                      ? '완벽합니다! 오늘의 소셜 빚을 모두 갚았습니다.' 
                      : '영어 공부(랭플릭스)가 밀려있습니다. (누르면 측정 시작)'
                  }
                </p>
              </div>
            </div>

            {/* 2. Individual App Breakdowns */}
            <div className="grid grid-cols-2 gap-3">
              <div 
                onClick={() => setActiveTimer(activeTimer === 'instagram' ? 'none' : 'instagram')}
                className={`border ${
                  activeTimer === 'instagram'
                    ? 'border-pink-500 bg-pink-100/40 ring-2 ring-pink-500/20 animate-pulse text-pink-950'
                    : 'border-pink-200 bg-pink-50/30 text-pink-950'
                } rounded-xl p-3.5 flex flex-col justify-between h-[80px] transition hover:bg-pink-50/50 cursor-pointer hover:scale-[1.01] active:scale-[0.99] select-none`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[8.5px] font-black tracking-widest text-pink-500 uppercase font-space">
                    INSTAGRAM
                  </span>
                  {activeTimer === 'instagram' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
                  )}
                </div>
                <div className="text-xl font-black font-outfit tracking-tight">
                  {formatDigitalTime(settings.instagramTime)}
                </div>
              </div>

              <div 
                onClick={() => setActiveTimer(activeTimer === 'twitter' ? 'none' : 'twitter')}
                className={`border ${
                  activeTimer === 'twitter'
                    ? 'border-sky-500 bg-sky-100/40 ring-2 ring-sky-500/20 animate-pulse text-sky-950'
                    : 'border-sky-200 bg-sky-50/30 text-sky-950'
                } rounded-xl p-3.5 flex flex-col justify-between h-[80px] transition hover:bg-sky-50/50 cursor-pointer hover:scale-[1.01] active:scale-[0.99] select-none`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[8.5px] font-black tracking-widest text-sky-400 uppercase font-space">
                    TWITTER (X)
                  </span>
                  {activeTimer === 'twitter' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                  )}
                </div>
                <div className="text-xl font-black font-outfit tracking-tight">
                  {formatDigitalTime(settings.twitterTime)}
                </div>
              </div>
            </div>

            {/* 3. Main Combined Social Time (Huge Bold Visual) */}
            <div className="text-center py-2 space-y-1">
              <span className="text-[10px] font-black tracking-[0.25em] text-zinc-400 uppercase flex items-center justify-center gap-1.5 font-space">
                {(activeTimer === 'instagram' || activeTimer === 'twitter') && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
                <span>COMBINED SOCIAL TIME</span>
              </span>
              {/* Stylish Hip font display: Outfit */}
              <div className="text-4xl font-black tracking-tight text-zinc-950 font-outfit select-all leading-none py-1 drop-shadow-sm">
                {formatDigitalTime(totalSocialTime)}
              </div>
            </div>

            {/* 4. Action Button to Weekly View */}
            <button
              onClick={() => setViewMode('weekly')}
              className="w-full py-3 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
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
              <span className="text-[8px] font-black tracking-[0.2em] text-zinc-400 uppercase font-space">
                WEEKLY REPORT
              </span>
            </div>

            {/* Weekly Bar Chart Panel */}
            <div className="border border-zinc-100 bg-zinc-50/30 rounded-2xl p-4 flex-1 flex flex-col justify-between min-h-[220px]">
              
              <div className="space-y-1">
                <span className="text-[8px] font-black tracking-widest text-zinc-400 uppercase block font-space">
                  AVERAGE SNS VS STUDY
                </span>
                <h4 className="text-lg font-black text-zinc-900">최근 일주일간의 변화</h4>
              </div>

              {/* Clean Vertical Bar Chart */}
              <div className="h-32 flex items-end justify-between pt-4 relative">
                {/* Background Guidelines */}
                <div className="absolute inset-x-0 top-0 border-t border-zinc-100" />
                <div className="absolute inset-x-0 top-1/2 border-t border-zinc-100" />

                {displayHistory.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <span className="text-[10px] font-bold text-zinc-400">아직 정산된 기록이 없습니다.</span>
                    <span className="text-[8px] text-zinc-400 mt-1">매일 새벽 5시에 오늘 사용량이 정산되어 차례대로 기록됩니다!</span>
                  </div>
                ) : (
                  displayHistory.map((day, idx) => {
                    const socialHeight = Math.max(4, Math.min(80, (day.socialTime / maxHistoryValue) * 80));
                    const studyHeight = Math.max(4, Math.min(80, (day.studyTime / maxHistoryValue) * 80));

                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 space-y-2">
                        <div className="flex gap-1.5 items-end h-20">
                          
                          {/* Social Time Bar */}
                          <div className="group relative">
                            <div 
                              className="w-2.5 bg-rose-400 rounded-t-sm transition-all duration-300 hover:bg-rose-500 cursor-pointer"
                              style={{ height: `${socialHeight}px` }}
                            />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-zinc-950 text-[7px] font-bold text-white px-1.5 py-0.5 rounded whitespace-nowrap z-40 pointer-events-none">
                              SNS: {Math.round(day.socialTime / 60)}분
                            </div>
                          </div>

                          {/* Study Time Bar */}
                          <div className="group relative">
                            <div 
                              className="w-2.5 bg-emerald-500 rounded-t-sm transition-all duration-300 hover:bg-emerald-600 cursor-pointer"
                              style={{ height: `${studyHeight}px` }}
                            />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-zinc-950 text-[7px] font-bold text-white px-1.5 py-0.5 rounded whitespace-nowrap z-40 pointer-events-none">
                              공부: {Math.round(day.studyTime / 60)}분
                            </div>
                          </div>

                        </div>

                        {/* Day Label */}
                        <span className="text-[7px] font-extrabold tracking-wider text-zinc-400 uppercase font-space">
                          {day.date.includes('(') ? day.date.split(' ')[0] : day.date}
                        </span>
                      </div>
                    );
                  })
                )}

              </div>

              {/* Custom Legend */}
              <div className="flex justify-center gap-4 pt-3 border-t border-zinc-100 text-[8px] font-bold tracking-wider text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-rose-400 rounded-sm" />
                  <span>소셜 미디어 사용</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                  <span>영어 공부 (랭플릭스)</span>
                </div>
              </div>

            </div>

            {/* Back Button */}
            <button
              onClick={() => setViewMode('today')}
              className="w-full py-3 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl text-[10px] font-black tracking-widest uppercase transition cursor-pointer font-space"
            >
              오늘 기록 보기
            </button>

          </div>
        )}

        {/* Dawn Countdown info footer (Shared) */}
        <div className="text-center text-[7px] font-extrabold tracking-[0.2em] text-zinc-300 uppercase mt-4 pt-3 border-t border-zinc-50 font-space">
          RESETS DAILY AT {resetHour.toString().padStart(2, '0')}:00 AM · NEXT RESET IN {formatDigitalTime(secondsUntilReset)}
        </div>

      </div>
    </div>
  );
}
