export interface AppSettings {
  targetLimit: number; // in seconds
  instagramTime: number; // in seconds
  twitterTime: number; // in seconds
  langflixTime: number; // in seconds
  lastResetTime: string; // ISO String or Date
  studyGoalRatio: number; // ratio of social media time to study time (default 1.0 = 1:1 ratio)
  resetHour?: number; // hour of day to trigger reset (0-23, default 4)
}

export interface AppSession {
  appId: 'home' | 'instagram' | 'twitter' | 'langflix' | 'screentime-app';
  startTime: number; // timestamp in ms
  elapsedSeconds: number; // elapsed time in seconds
}

export interface iOSNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  appName: 'ScreenTime' | 'LangFlix' | 'System';
  isRead: boolean;
}

export interface EnglishWord {
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
}

export interface ScreenTimeHistory {
  date: string;
  socialTime: number;
  studyTime: number;
  isGoalAchieved: boolean;
}

export const VOCABULARY_LIST: EnglishWord[] = [
  {
    word: "Procrastinate",
    phonetic: "/prəˈkræstɪneɪt/",
    meaning: "미루다, 늑장 부리다",
    example: "Don't procrastinate! Study on LangFlix instead of scrolling social media."
  },
  {
    word: "Ambitious",
    phonetic: "/æmˈbɪʃəs/",
    meaning: "야심 있는, 원대한",
    example: "Setting a screen time limit is an ambitious step for self-improvement."
  },
  {
    word: "Discipline",
    phonetic: "/ˈdɪsəplɪn/",
    meaning: "규율, 절제력",
    example: "Digital discipline will help you focus on your long-term goals."
  },
  {
    word: "Accumulate",
    phonetic: "/əˈkjuːmjəleɪt/",
    meaning: "모으다, 축적하다",
    example: "Your Instagram and Twitter usage hours accumulate quickly throughout the day."
  },
  {
    word: "Sufficient",
    phonetic: "/səˈfɪʃnt/",
    meaning: "충분한",
    example: "Have you spent sufficient time studying English today?"
  },
  {
    word: "Consistent",
    phonetic: "/kənˈsɪstənt/",
    meaning: "한결같은, 일관된",
    example: "Consistent vocabulary review is the key to mastering English."
  },
  {
    word: "Prioritize",
    phonetic: "/praɪˈɔːrətaɪz/",
    meaning: "우선순위를 매기다, 우선시하다",
    example: "Prioritize your language study over scrolling endless feeds."
  },
  {
    word: "Substitute",
    phonetic: "/ˈsʌbstɪtuːt/",
    meaning: "대체하다, 대신하다",
    example: "Substitute 10 minutes of social media with a quick LangFlix lesson."
  },
  {
    word: "Habitual",
    phonetic: "/həˈbɪtʃuəl/",
    meaning: "습관적인",
    example: "Checking Twitter is often a habitual action without conscious thought."
  },
  {
    word: "Productivity",
    phonetic: "/ˌproʊdʌkˈtɪvəti/",
    meaning: "생산성",
    example: "By limiting social media, you can boost your productivity significantly."
  }
];
