/**
 * BytePrep Content Studio - Comprehensive Type Definitions
 * Complete Creator Pro System Canonical Models
 */

export type Difficulty = 'easy' | 'medium' | 'hard' | 'Easy' | 'Medium' | 'Hard';

export type ContentStatus =
  | 'IDEA'
  | 'READY'
  | 'GENERATING'
  | 'GENERATED'
  | 'REVIEW'
  | 'APPROVED'
  | 'EXPORTED'
  | 'POSTED'
  | 'ARCHIVED'
  | 'FAILED';

export type PlatformTarget =
  | 'youtube'
  | 'instagram'
  | 'telegram'
  | 'facebook'
  | 'whatsapp'
  | 'other'
  | 'all';

export type ContentLanguage = 'English' | 'Hindi' | 'Hinglish';

export type VoiceStyle =
  | 'Teacher'
  | 'Energetic Creator'
  | 'Exam Coach'
  | 'Calm Educator'
  | 'Rapid Fire'
  | 'News/Announcement'
  | 'Hindi Teacher'
  | 'English Teacher'
  | 'Hinglish Creator';

export interface RawQuestion {
  id?: string;
  question?: string;
  question_text?: string;
  q?: string;
  options?: string[];
  choices?: string[];
  correct_answer?: number | string;
  correctAnswer?: number | string;
  answer?: number | string;
  ansIndex?: number;
  answer_index?: number;
  explanation?: string;
  solution?: string;
  exp?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  difficulty?: Difficulty | string;
  exam?: string | string[];
  year?: number | string;
  sourceFile?: string;
  source?: string;
  tags?: string[];
  contentStatus?: ContentStatus;
  timesUsed?: number;
  lastUsedAt?: string | null;
  posted?: boolean;
}

/**
 * Canonical Question Model (Immutable Source)
 */
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-based index
  explanation?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  exam?: string | string[];
  year?: number;
  source?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'Easy' | 'Medium' | 'Hard';
  tags?: string[];
  originalDataset?: string;
  createdAt?: string;
  updatedAt?: string;
  sourceFile?: string;
  sourceQuestionNumber?: number;
  // Creator Tracking
  contentStatus?: ContentStatus;
  timesUsed?: number;
  lastUsedAt?: string | null;
  posted?: boolean;
  postedAt?: string | null;
  platforms?: PlatformTarget[];
  qualityScore?: number;
  qualityWarnings?: string[];
}

// NormalizedQuestion is canonical Question with required fields for strict UI components
export interface NormalizedQuestion extends Question {
  explanation: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  exam: string;
  sourceFile: string;
}

/**
 * Canonical ContentItem Model (Generated Entity referencing questionId)
 */
export interface ContentItem {
  contentId: string; // e.g. BP-DSSSB-DBMS-2026-001
  questionId: string;
  contentType:
    | 'short'
    | 'reel'
    | 'story'
    | 'carousel'
    | 'flashcard'
    | 'telegram'
    | 'code-challenge'
    | 'debug-challenge'
    | 'pack'
    | string;
  templateId: string;
  themeId: string;
  language: ContentLanguage | string;
  hook: string;
  shortExplanation?: string;
  detailedExplanation?: string;
  caption?: string;
  youtubeTitle?: string;
  youtubeDescription?: string;
  hashtags?: string[];
  cta?: string;
  voiceStyle?: VoiceStyle | string;
  status: ContentStatus;
  campaignId?: string;
  seriesId?: string;
  createdAt: string;
  exportedAt?: string;
  postedAt?: string | null;
  platform?: PlatformTarget;
  postUrl?: string;
  metrics?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    saves: number;
    clicks: number;
  };
}

export interface FactCheckResult {
  status: 'PASS' | 'REVIEW' | 'FAIL';
  score: number; // 0 to 100
  reasons: string[];
  passedChecks: string[];
  failedChecks: string[];
  conflictDetected?: boolean;
  conflictDetails?: string;
  conflictReason?: string;
}

export interface BrandKitConfig {
  brandName: string; // e.g. "BytePrep TGT PGT CS"
  appStoreUrl?: string; // Play store / Web link
  playStoreUrl?: string;
  websiteUrl?: string;
  telegramUrl?: string;
  telegramChannel?: string; // @byteprep_cs
  instagramHandle?: string; // @byteprep.cs
  youtubeChannel?: string; // BytePrep CS
  youtubeHandle?: string;
  tagline?: string;
  brandTagline?: string;
  primaryColor?: string; // #0284c7 (Sky-600)
  secondaryColor?: string;
  accentColor?: string; // #facc15 (Amber-400)
  defaultCtaText?: string; // "📲 Download BytePrep app for 5,000+ CS PYQs!"
  watermarkEnabled?: boolean;
  showWatermark?: boolean;
  watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | string;
  defaultOutroDuration?: number;
  logoDataUrl?: string;
  fontFamily?: string;
}

export interface LanguageSettings {
  preferredLanguage: ContentLanguage;
  hinglishMixRatio: 'light' | 'balanced' | 'heavy';
  preserveTechnicalTerms: boolean;
}

export interface ShortTemplate {
  id: string;
  name: string;
  badge: string;
  tagline?: string;
  defaultHook?: string;
  category?: string;
  description: string;
  layout?: 'split' | 'centered' | 'terminal' | 'exam-paper' | 'story-reel' | 'compact' | string;
  introDuration?: number;
  hookDuration: number;
  questionDuration?: number;
  timerDuration: number;
  revealDuration: number;
  explanationDuration: number;
  ctaDuration: number;
  outroDuration: number;
  recommendedTheme: string;
  sfxPreset: string;
  soundtrack?: string;
}

export interface ShortTheme {
  id: string;
  name: string;
  bgGradient: string[];
  canvasBg: string;
  textColor: string;
  accentColor: string;
  cardBg: string;
  cardBorder: string;
  timerColor: string;
  correctColor: string;
  incorrectColor: string;
  badgeBg?: string;
  backgroundAnimation?: 'stars' | 'matrix' | 'sql' | 'network' | 'os' | 'grid' | 'terminal' | 'cyber';
}

export interface ShortConfig {
  question: NormalizedQuestion;
  timerSeconds: number;
  hookText: string;
  themeId: string;
  templateId?: string;
  backgroundStyle?: 'auto' | 'stars' | 'matrix' | 'sql' | 'network' | 'os' | 'grid' | 'terminal' | 'cyber';
  includeAudio: boolean;
  ctaEnabled: boolean;
  appUrl: string;
  customCta?: string;
  language?: ContentLanguage;
  voiceStyle?: VoiceStyle;
  durationMode?: 'viral' | 'standard' | 'extended';
  renderQuality?: '1080p' | '720p' | 'fast';
  exportFormat?: 'mp4' | 'webm';
  fps?: number;
  phaseDurations?: {
    intro?: number;
    hook?: number;
    question?: number;
    reveal?: number;
    explanation?: number;
    cta?: number;
  };
  // Auto-Sync & Audio Track
  autoSyncAudio?: boolean;
  audioTrackId?: string;
  audioTrackName?: string;
  audioTrackDuration?: number;
  customAudioDataUrl?: string;
  // Permanent Watermark & Logo Overlay
  watermarkType?: 'none' | 'logo' | 'text';
  watermarkLogoUrl?: string;
  watermarkText?: string;
  watermarkPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  watermarkOpacity?: number;
  watermarkScale?: number;
}

export interface GeneratedContentPack {
  id: string;
  contentId?: string;
  questionId: string;
  question: NormalizedQuestion;
  hook: string;
  hooks?: string[];
  shortExplanation?: string;
  detailedExplanation?: string;
  title?: string;
  description?: string;
  caption?: string;
  telegramText?: string;
  whatsappText?: string;
  ctaText?: string;
  youtubeTitle?: string;
  youtubeDescription?: string;
  reelsCaption?: string;
  telegramPostText?: string;
  whatsappBroadcastText?: string;
  hashtags: string[];
  cta?: string;
  voiceScript?: string;
  voiceStyle?: VoiceStyle;
  language?: ContentLanguage;
  templateId?: string;
  themeId?: string;
  createdAt: string;
  status: ContentStatus;
  platforms?: PlatformTarget[];
  postedAt: string | null;
  postUrl?: string;
  qualityScore?: number;
  factCheckResult?: FactCheckResult;
  factCheckStatus?: 'PASS' | 'REVIEW' | 'FAIL';
  factCheckNotes?: string[];
  // Performance metrics
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  followersGained?: number;
  clicks?: number;
  websiteVisits?: number;
  playStoreVisits?: number;
  appInstalls?: number;
  notes?: string;
  seriesId?: string;
  campaignId?: string;
  dayInSeries?: number;
}

export interface DailyChallengeState {
  date?: string;
  dateStr: string;
  questionId: string;
  isCompleted: boolean;
  score: number;
  completedAt: string | null;
}

export interface GeneratedShortRecord {
  id?: string;
  questionId: string;
  createdAt?: string;
  generatedAt?: string;
  videoDuration?: number;
  templateId?: string;
  template?: string;
  themeId?: string;
  theme?: string;
  hook?: string;
  downloaded?: boolean;
}

export interface ContentCampaign {
  campaignId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  targetPlatform: PlatformTarget | 'all';
  targetExam: string;
  topics: string[];
  contentGoal: string;
  targetPosts: number;
  status: 'active' | 'completed' | 'draft' | 'paused';
  createdAt: string;
  contentItemIds: string[];
}

export interface ContentSeries {
  id: string;
  name: string;
  description: string;
  subject: string;
  topic?: string;
  exam?: string;
  totalPosts: number;
  currentDay: number;
  startDate: string;
  frequency: 'daily' | 'weekdays' | 'alternate';
  templateId: string;
  themeId: string;
  questionIds: string[];
  active: boolean;
}

export interface CtaEntry {
  ctaId: string;
  text: string;
  platform?: PlatformTarget | 'all';
  enabled: boolean;
  category:
    | 'direct-app'
    | 'quiz-play'
    | 'study-material'
    | 'exam-urgency'
    | 'custom'
    | 'practice'
    | 'exam_prep'
    | 'download'
    | 'mock_tests'
    | string;
  timesUsed?: number;
  usageCount?: number;
  clicks?: number;
  conversions?: number;
  performanceRating?: number;
}

export interface StoryFrame {
  frameIndex: number;
  title: string;
  headline?: string;
  badge: string;
  content?: string;
  subtext?: string;
  type: 'hook' | 'question' | 'timer' | 'answer' | 'cta';
  highlight?: string;
  options?: string[];
  correctOptionIndex?: number;
  explanation?: string;
  ctaText?: string;
}

export interface CarouselSlide {
  slideIndex: number;
  title: string;
  headline?: string;
  badge: string;
  content: string;
  subtext?: string;
  type: 'hook' | 'question' | 'options' | 'pause' | 'answer' | 'explanation' | 'cta';
  highlight?: string;
  options?: string[];
  correctOptionIndex?: number;
  explanation?: string;
  ctaText?: string;
}

export interface CodeChallengeConfig {
  language: 'c' | 'cpp' | 'java' | 'python' | 'javascript' | 'sql';
  code: string;
  options: string[];
  correctAnswer: number;
  output: string;
  explanation: string;
  isBugHunt?: boolean;
  buggyLine?: number;
  correctedCode?: string;
}

export interface CalendarEntry {
  id: string;
  date: string;
  dayOfWeek: string;
  subject: string;
  topic?: string;
  exam?: string;
  templateId?: string;
  assignedContentId?: string;
  status: 'planned' | 'ready' | 'posted';
  notes?: string;
}

export interface ContentIssueReport {
  id: string;
  questionId: string;
  type: 'wrong_answer' | 'wrong_explanation' | 'typo' | 'duplicate' | 'ambiguous' | 'wrong_exam' | 'other';
  comment: string;
  reportedAt: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface CreatorStats {
  totalQuestions: number;
  unusedQuestions: number;
  totalGeneratedContent: number;
  readyToPostCount: number;
  postedCount: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  totalFollowersGained: number;
  totalClicks: number;
  bestTopic: string;
  bestTemplate: string;
  bestHookCategory: string;
}

export interface ChallengeSettings {
  defaultTimer: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  showExplanation: boolean;
  autoNext: boolean;
  preferredDifficulty: 'mixed' | 'easy' | 'medium' | 'hard';
  defaultShortTheme: string;
  defaultShortHook: string;
  ctaEnabled: boolean;
  appUrl: string;
  defaultLanguage?: ContentLanguage;
  defaultVoiceStyle?: VoiceStyle;
}

export interface UserStats {
  challengesAttempted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalScore: number;
  bestScore: number;
  currentStreak: number;
  longestStreak: number;
  lastChallengeDate: string | null;
  dailyChallengesCompleted: number;
  recentQuestionIds: string[];
  shortsGenerated: number;
  shortsDownloaded: number;
}

export interface PlayResult {
  question: NormalizedQuestion;
  userAnswer: number | null;
  isCorrect: boolean;
  score: number;
  timeRemaining: number;
  timerDuration: number;
}

export interface QueueItem {
  id: string;
  question: NormalizedQuestion;
  config: ShortConfig;
  status: 'pending' | 'rendering' | 'completed' | 'failed';
  progress: number;
  videoUrl?: string;
  blob?: Blob;
  error?: string;
}

export interface SocialAccountConfig {
  id: 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'webhook';
  name: string;
  platform: 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'webhook';
  connected: boolean;
  username?: string;
  avatarUrl?: string;
  channelTitle?: string;
  accountType?: 'creator' | 'business' | 'personal';
  lastSyncAt?: string;
  defaultPrivacy?: 'public' | 'unlisted' | 'private';
  autoAddHashtags?: boolean;
  webhookUrl?: string;
  apiToken?: string;
  pageId?: string;
}

export interface SeriesTitleConfig {
  template: string;
  currentNumber: number;
  zeroPadding: number;
  autoIncrement: boolean;
  customHashtags: string;
  includeSubjectInTitle: boolean;
  includeHookInTitle: boolean;
}

export interface ScheduledPostItem {
  id: string;
  questionId: string;
  question: NormalizedQuestion;
  shortConfig: ShortConfig;
  seriesNumber: number;
  formattedTitle: string;
  caption: string;
  hashtags: string[];
  targetPlatforms: ('youtube' | 'instagram' | 'facebook' | 'tiktok' | 'webhook')[];
  scheduledTime: string;
  status: 'scheduled' | 'rendering' | 'publishing' | 'published' | 'failed' | 'paused';
  publishedAt?: string;
  videoUrl?: string;
  blob?: Blob;
  postUrls?: {
    youtube?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
  error?: string;
}

export interface AutoPilotScheduleSettings {
  enabled: boolean;
  postIntervalHours: number;
  preferredTimeOfDay: string;
  targetPlatforms: ('youtube' | 'instagram' | 'facebook' | 'tiktok' | 'webhook')[];
  seriesConfig: SeriesTitleConfig;
  autoRenderOnSchedule: boolean;
  notifyOnPublish: boolean;
}

