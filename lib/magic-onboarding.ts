// ==============================================
// Magic Onboarding - Animated Walkthrough
// Phase J: Supernova v1.16.0
// ==============================================

export type OnboardingStepType =
  | 'welcome'
  | 'profile'
  | 'preferences'
  | 'quiz'
  | 'tour'
  | 'connections'
  | 'complete';

export interface OnboardingStep {
  id: string;
  type: OnboardingStepType;
  title: string;
  subtitle: string;
  animation: AnimationType;
  content: StepContent;
  isRequired: boolean;
  estimatedSeconds: number;
}

export type AnimationType =
  | 'fade-up'
  | 'slide-left'
  | 'slide-right'
  | 'scale-up'
  | 'bounce'
  | 'confetti'
  | 'particles';

export interface StepContent {
  type: 'text' | 'quiz' | 'input' | 'selection' | 'tour' | 'celebration';
  data: unknown;
}

export interface PreferenceQuiz {
  questions: QuizQuestion[];
  results: QuizResults;
}

export interface QuizQuestion {
  id: string;
  text: string;
  emoji: string;
  type: 'single' | 'multiple' | 'scale' | 'emoji';
  options: QuizOption[];
  category: PreferenceCategory;
}

export interface QuizOption {
  id: string;
  label: string;
  emoji?: string;
  value: string | number;
  imageUrl?: string;
}

export type PreferenceCategory =
  | 'event_types'
  | 'music_styles'
  | 'energy_level'
  | 'social_style'
  | 'schedule'
  | 'goals';

export interface QuizResults {
  eventTypes: string[];
  musicStyles: string[];
  energyLevel: 'low' | 'medium' | 'high' | 'varies';
  socialStyle: 'solo' | 'small_group' | 'big_crowd' | 'flexible';
  preferredTimes: string[];
  communityGoals: string[];
}

export interface OnboardingProgress {
  userId: string;
  currentStepIndex: number;
  completedSteps: string[];
  skippedSteps: string[];
  quizAnswers: Record<string, string | string[]>;
  startedAt: Date;
  completedAt: Date | null;
  totalTimeSeconds: number;
}

// The Magic Onboarding Flow
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    type: 'welcome',
    title: 'Welcome to Fernhill! 🌲',
    subtitle: 'Your journey into community begins here',
    animation: 'fade-up',
    content: {
      type: 'text',
      data: {
        paragraphs: [
          "You've just stepped into a vibrant community of movers, shakers, and connection makers.",
          "Let's take a quick journey to personalize your experience.",
        ],
        ctaText: "Let's Begin ✨",
      },
    },
    isRequired: true,
    estimatedSeconds: 15,
  },
  {
    id: 'profile-basics',
    type: 'profile',
    title: 'Show Your True Self 🌟',
    subtitle: 'A little about you goes a long way',
    animation: 'slide-left',
    content: {
      type: 'input',
      data: {
        fields: [
          { name: 'displayName', label: 'What should we call you?', type: 'text', required: true },
          { name: 'pronouns', label: 'Your pronouns', type: 'select', options: ['He/Him', 'She/Her', 'They/Them', 'Custom...'] },
          { name: 'avatar', label: 'Add a photo', type: 'avatar', required: false },
        ],
      },
    },
    isRequired: true,
    estimatedSeconds: 45,
  },
  {
    id: 'vibe-check',
    type: 'quiz',
    title: 'Vibe Check 🎯',
    subtitle: 'Help us match you with the perfect events',
    animation: 'scale-up',
    content: {
      type: 'quiz',
      data: {
        questions: PREFERENCE_QUESTIONS,
      },
    },
    isRequired: false,
    estimatedSeconds: 90,
  },
  {
    id: 'app-tour',
    type: 'tour',
    title: 'Quick Tour 🗺️',
    subtitle: 'See what magic awaits',
    animation: 'slide-right',
    content: {
      type: 'tour',
      data: {
        stops: TOUR_STOPS,
      },
    },
    isRequired: false,
    estimatedSeconds: 60,
  },
  {
    id: 'find-friends',
    type: 'connections',
    title: 'Find Your People 👥',
    subtitle: 'Connect with friends already here',
    animation: 'bounce',
    content: {
      type: 'selection',
      data: {
        type: 'contacts',
        allowSkip: true,
      },
    },
    isRequired: false,
    estimatedSeconds: 30,
  },
  {
    id: 'complete',
    type: 'complete',
    title: "You're All Set! 🎉",
    subtitle: 'Welcome to the community',
    animation: 'confetti',
    content: {
      type: 'celebration',
      data: {
        xpAwarded: 50,
        badge: 'newcomer',
        nextSteps: [
          { label: 'Browse Events', path: '/events', icon: '📅' },
          { label: 'Explore Community', path: '/hearth', icon: '🏠' },
          { label: 'Complete Profile', path: '/profile', icon: '✨' },
        ],
      },
    },
    isRequired: true,
    estimatedSeconds: 15,
  },
];

// Preference Quiz Questions
export const PREFERENCE_QUESTIONS: QuizQuestion[] = [
  {
    id: 'event-types',
    text: 'What kinds of events excite you?',
    emoji: '🎭',
    type: 'multiple',
    category: 'event_types',
    options: [
      { id: 'ecstatic', label: 'Ecstatic Dance', emoji: '💃', value: 'ecstatic' },
      { id: 'workshop', label: 'Workshops', emoji: '📚', value: 'workshop' },
      { id: 'meditation', label: 'Meditation', emoji: '🧘', value: 'meditation' },
      { id: 'social', label: 'Social Gatherings', emoji: '🎉', value: 'social' },
      { id: 'outdoor', label: 'Outdoor Adventures', emoji: '🌲', value: 'outdoor' },
      { id: 'music', label: 'Live Music', emoji: '🎵', value: 'music' },
    ],
  },
  {
    id: 'energy-level',
    text: 'What energy level do you usually vibe with?',
    emoji: '⚡',
    type: 'single',
    category: 'energy_level',
    options: [
      { id: 'chill', label: 'Chill & Mellow', emoji: '🌙', value: 'low' },
      { id: 'balanced', label: 'Balanced Flow', emoji: '☯️', value: 'medium' },
      { id: 'high', label: 'High Energy!', emoji: '🔥', value: 'high' },
      { id: 'depends', label: 'Depends on my mood', emoji: '🌊', value: 'varies' },
    ],
  },
  {
    id: 'social-style',
    text: 'How do you like to connect?',
    emoji: '👥',
    type: 'single',
    category: 'social_style',
    options: [
      { id: 'solo', label: 'Flying Solo', emoji: '🦅', value: 'solo' },
      { id: 'small', label: 'Small Circles', emoji: '🤝', value: 'small_group' },
      { id: 'crowd', label: 'Big Gatherings', emoji: '🎪', value: 'big_crowd' },
      { id: 'flex', label: 'All of the Above', emoji: '✨', value: 'flexible' },
    ],
  },
  {
    id: 'best-times',
    text: 'When are you most likely to attend?',
    emoji: '🕐',
    type: 'multiple',
    category: 'schedule',
    options: [
      { id: 'weekday-morning', label: 'Weekday Mornings', emoji: '🌅', value: 'weekday_am' },
      { id: 'weekday-evening', label: 'Weekday Evenings', emoji: '🌆', value: 'weekday_pm' },
      { id: 'weekend-day', label: 'Weekend Days', emoji: '☀️', value: 'weekend_day' },
      { id: 'weekend-night', label: 'Weekend Nights', emoji: '🌙', value: 'weekend_night' },
    ],
  },
  {
    id: 'goals',
    text: 'What brings you to Fernhill?',
    emoji: '🎯',
    type: 'multiple',
    category: 'goals',
    options: [
      { id: 'move', label: 'Move My Body', emoji: '💃', value: 'movement' },
      { id: 'friends', label: 'Make Friends', emoji: '❤️', value: 'connection' },
      { id: 'grow', label: 'Personal Growth', emoji: '🌱', value: 'growth' },
      { id: 'fun', label: 'Just Have Fun!', emoji: '🎉', value: 'fun' },
      { id: 'heal', label: 'Healing Journey', emoji: '🦋', value: 'healing' },
      { id: 'belong', label: 'Find Belonging', emoji: '🏠', value: 'belonging' },
    ],
  },
];

// App Tour Stops
export const TOUR_STOPS = [
  {
    id: 'events',
    target: 'nav-events',
    title: 'Events 📅',
    description: 'Discover dances, workshops, and gatherings happening near you.',
    position: 'bottom',
  },
  {
    id: 'hearth',
    target: 'nav-hearth',
    title: 'The Hearth 🏠',
    description: 'Your community home—share posts, see updates, connect with others.',
    position: 'bottom',
  },
  {
    id: 'messages',
    target: 'nav-messages',
    title: 'Messages 💬',
    description: 'Chat with friends and coordinate meetups.',
    position: 'bottom',
  },
  {
    id: 'profile',
    target: 'nav-profile',
    title: 'Your Profile 🌟',
    description: "Express yourself and track your community journey.",
    position: 'left',
  },
];

/**
 * Calculate completion percentage
 */
export function calculateProgress(progress: OnboardingProgress): number {
  const totalSteps = ONBOARDING_STEPS.length;
  const completed = progress.completedSteps.length + progress.skippedSteps.length;
  return Math.round((completed / totalSteps) * 100);
}

/**
 * Get next uncompleted step
 */
export function getNextStep(progress: OnboardingProgress): OnboardingStep | null {
  const completedIds = new Set([...progress.completedSteps, ...progress.skippedSteps]);
  return ONBOARDING_STEPS.find(step => !completedIds.has(step.id)) || null;
}

/**
 * Check if onboarding is complete
 */
export function isOnboardingComplete(progress: OnboardingProgress): boolean {
  const requiredSteps = ONBOARDING_STEPS.filter(s => s.isRequired);
  return requiredSteps.every(step => progress.completedSteps.includes(step.id));
}

/**
 * Generate personalized welcome message based on quiz results
 */
export function generateWelcomeMessage(results: QuizResults): string {
  const energy = results.energyLevel;
  const social = results.socialStyle;
  
  if (energy === 'high' && social === 'big_crowd') {
    return "You're a social butterfly ready to fly! 🦋 We've got plenty of big events waiting for you.";
  }
  if (energy === 'low' && social === 'solo') {
    return "A peaceful soul seeking space to breathe. 🧘 We've curated calm experiences just for you.";
  }
  if (results.communityGoals.includes('healing')) {
    return "Welcome to a safe space for your journey. 💜 We're honored to walk alongside you.";
  }
  
  return "You're going to love it here! 🌟 Let's find your perfect first event.";
}

/**
 * Animation keyframes for step transitions
 */
export const STEP_ANIMATIONS = {
  'fade-up': {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4 },
  },
  'slide-left': {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
    transition: { duration: 0.3 },
  },
  'slide-right': {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
    transition: { duration: 0.3 },
  },
  'scale-up': {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 },
    transition: { duration: 0.3 },
  },
  'bounce': {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1, transition: { type: 'spring', bounce: 0.5 } },
    exit: { opacity: 0, scale: 0.3 },
  },
  'confetti': {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.5 },
  },
  'particles': {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.4 },
  },
} as const;
