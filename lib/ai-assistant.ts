// ==============================================
// AI Assistant - Natural Language Event Search
// Phase J: Supernova v1.16.0
// ==============================================

export type IntentType =
  | 'search_events'
  | 'get_recommendations'
  | 'check_schedule'
  | 'find_people'
  | 'ask_about_event'
  | 'get_directions'
  | 'unknown';

export interface ParsedIntent {
  type: IntentType;
  confidence: number;
  entities: ExtractedEntities;
  originalQuery: string;
  suggestedResponse?: string;
}

export interface ExtractedEntities {
  eventTypes?: string[];
  dates?: DateEntity[];
  locations?: string[];
  people?: string[];
  moods?: string[];
  keywords?: string[];
}

export interface DateEntity {
  text: string;
  resolved: Date | null;
  isRange: boolean;
  endDate?: Date | null;
}

export interface SmartRecommendation {
  eventId: string;
  score: number;
  reasons: RecommendationReason[];
  matchedPreferences: string[];
}

export interface RecommendationReason {
  type: 'interest' | 'history' | 'friends' | 'trending' | 'mood' | 'location';
  description: string;
  weight: number;
}

// Intent patterns for natural language parsing
const INTENT_PATTERNS: Record<IntentType, RegExp[]> = {
  search_events: [
    /(?:find|search|show|what|any|looking for).*(?:event|dance|class|workshop)/i,
    /(?:what'?s|what is).*(?:happening|going on|scheduled)/i,
    /(?:events?).*(?:near|around|in|at)/i,
  ],
  get_recommendations: [
    /(?:recommend|suggest|what should|help me find)/i,
    /(?:something|anything).*(?:fun|interesting|new)/i,
    /(?:i'?m|i am).*(?:bored|looking|interested)/i,
  ],
  check_schedule: [
    /(?:my|when|am i).*(?:schedule|calendar|attending|going)/i,
    /(?:what|which).*(?:signed up|registered|rsvp)/i,
    /(?:upcoming|next).*(?:event|dance)/i,
  ],
  find_people: [
    /(?:find|who|looking for|search).*(?:people|person|friend|member)/i,
    /(?:connect|meet).*(?:with|someone)/i,
    /(?:who'?s|who is).*(?:going|attending|coming)/i,
  ],
  ask_about_event: [
    /(?:tell me|what is|info|details|about).*(?:event|this)/i,
    /(?:when|where|how|who).*(?:is|does|will)/i,
    /(?:more).*(?:info|details|about)/i,
  ],
  get_directions: [
    /(?:how|where).*(?:get|go|find|directions)/i,
    /(?:directions|navigate|map).*(?:to|for)/i,
    /(?:take me|guide me)/i,
  ],
  unknown: [],
};

// Date parsing patterns
const DATE_PATTERNS: Array<{ pattern: RegExp; resolver: (match: RegExpMatchArray) => Date | null }> = [
  {
    pattern: /today/i,
    resolver: () => new Date(),
  },
  {
    pattern: /tomorrow/i,
    resolver: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d;
    },
  },
  {
    pattern: /this\s+(weekend|week)/i,
    resolver: (match) => {
      const d = new Date();
      if (match[1].toLowerCase() === 'weekend') {
        const day = d.getDay();
        d.setDate(d.getDate() + (6 - day));
      }
      return d;
    },
  },
  {
    pattern: /next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    resolver: (match) => {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = days.indexOf(match[1].toLowerCase());
      const d = new Date();
      const currentDay = d.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7;
      d.setDate(d.getDate() + daysToAdd);
      return d;
    },
  },
  {
    pattern: /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/,
    resolver: (match) => {
      const month = parseInt(match[1]) - 1;
      const day = parseInt(match[2]);
      const year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
      return new Date(year < 100 ? 2000 + year : year, month, day);
    },
  },
];

// Event type keywords
const EVENT_TYPE_KEYWORDS: Record<string, string[]> = {
  dance: ['dance', 'dancing', 'ecstatic', 'movement', 'groove', 'flow'],
  workshop: ['workshop', 'class', 'learn', 'teaching', 'session'],
  social: ['social', 'gathering', 'meetup', 'hangout', 'mixer'],
  meditation: ['meditation', 'mindful', 'breathwork', 'yoga', 'zen'],
  music: ['music', 'concert', 'live', 'dj', 'jam', 'performance'],
  outdoor: ['outdoor', 'nature', 'park', 'hike', 'forest'],
};

// Mood keywords
const MOOD_KEYWORDS: Record<string, string[]> = {
  energetic: ['energetic', 'high energy', 'intense', 'wild', 'pumped'],
  chill: ['chill', 'relaxed', 'calm', 'mellow', 'easy'],
  social: ['social', 'connect', 'meet', 'friends', 'community'],
  spiritual: ['spiritual', 'sacred', 'ceremony', 'ritual', 'healing'],
  playful: ['playful', 'fun', 'silly', 'joy', 'laugh'],
};

/**
 * Parse natural language query into structured intent
 */
export function parseIntent(query: string): ParsedIntent {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Detect intent
  let detectedIntent: IntentType = 'unknown';
  let highestConfidence = 0;
  
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedQuery)) {
        const confidence = calculateConfidence(normalizedQuery, pattern);
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          detectedIntent = intent as IntentType;
        }
      }
    }
  }
  
  // Extract entities
  const entities = extractEntities(normalizedQuery);
  
  // Generate suggested response
  const suggestedResponse = generateSuggestedResponse(detectedIntent, entities);
  
  return {
    type: detectedIntent,
    confidence: highestConfidence || 0.3, // Default low confidence for unknown
    entities,
    originalQuery: query,
    suggestedResponse,
  };
}

function calculateConfidence(query: string, pattern: RegExp): number {
  const match = query.match(pattern);
  if (!match) return 0;
  
  // More specific matches = higher confidence
  const matchLength = match[0].length;
  const queryLength = query.length;
  const baseConfidence = matchLength / queryLength;
  
  return Math.min(0.95, baseConfidence + 0.5);
}

function extractEntities(query: string): ExtractedEntities {
  const entities: ExtractedEntities = {};
  
  // Extract dates
  const dates: DateEntity[] = [];
  for (const { pattern, resolver } of DATE_PATTERNS) {
    const match = query.match(pattern);
    if (match) {
      dates.push({
        text: match[0],
        resolved: resolver(match),
        isRange: false,
      });
    }
  }
  if (dates.length > 0) entities.dates = dates;
  
  // Extract event types
  const eventTypes: string[] = [];
  for (const [type, keywords] of Object.entries(EVENT_TYPE_KEYWORDS)) {
    if (keywords.some(kw => query.includes(kw))) {
      eventTypes.push(type);
    }
  }
  if (eventTypes.length > 0) entities.eventTypes = eventTypes;
  
  // Extract moods
  const moods: string[] = [];
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    if (keywords.some(kw => query.includes(kw))) {
      moods.push(mood);
    }
  }
  if (moods.length > 0) entities.moods = moods;
  
  // Extract quoted keywords
  const quotedMatches = query.match(/"([^"]+)"/g);
  if (quotedMatches) {
    entities.keywords = quotedMatches.map(m => m.replace(/"/g, ''));
  }
  
  return entities;
}

function generateSuggestedResponse(intent: IntentType, entities: ExtractedEntities): string {
  switch (intent) {
    case 'search_events':
      const eventType = entities.eventTypes?.[0] || 'events';
      const dateStr = entities.dates?.[0]?.text || 'upcoming';
      return `Here are ${eventType} ${dateStr}...`;
    
    case 'get_recommendations':
      return `Based on your preferences, I recommend...`;
    
    case 'check_schedule':
      return `Here's your upcoming schedule...`;
    
    case 'find_people':
      return `Here are community members who match...`;
    
    case 'ask_about_event':
      return `Here's what I know about this event...`;
    
    case 'get_directions':
      return `Here are directions to the venue...`;
    
    default:
      return `I'm not sure I understand. Try asking about events, recommendations, or your schedule!`;
  }
}

/**
 * Generate smart recommendations based on user profile and history
 */
export function generateRecommendations(
  userId: string,
  userInterests: string[],
  attendedEventTypes: string[],
  friendsAttending: Map<string, string[]>,
  currentMood?: string
): SmartRecommendation[] {
  // This would normally query the database
  // Here we define the scoring algorithm
  
  const recommendations: SmartRecommendation[] = [];
  
  // Scoring weights
  const WEIGHTS = {
    interest: 0.35,
    history: 0.25,
    friends: 0.20,
    trending: 0.10,
    mood: 0.10,
  };
  
  // Algorithm would:
  // 1. Score events by matching user interests
  // 2. Boost events similar to ones they've attended
  // 3. Boost events friends are attending
  // 4. Consider trending events
  // 5. Match current mood if provided
  
  return recommendations;
}

// Quick action suggestions based on context
export const QUICK_ACTIONS = [
  { label: "What's happening this weekend?", icon: '📅' },
  { label: 'Find dance events near me', icon: '💃' },
  { label: 'Show my upcoming events', icon: '📋' },
  { label: 'Recommend something fun', icon: '✨' },
  { label: "Who's going to the next event?", icon: '👥' },
  { label: 'Find a chill event', icon: '🧘' },
] as const;

// AI response templates
export const AI_RESPONSES = {
  greeting: [
    "Hey there! 👋 How can I help you today?",
    "Hi! Ready to find your next dance? 💃",
    "Hello! What kind of event are you in the mood for?",
  ],
  noResults: [
    "I couldn't find any events matching that. Want to try different criteria?",
    "Hmm, nothing matches right now. Check back soon or try a broader search!",
    "No events found, but I can help you explore other options!",
  ],
  error: [
    "Oops! Something went wrong. Let me try that again.",
    "I hit a snag. Can you rephrase that?",
    "My circuits got tangled! Try asking in a different way.",
  ],
  thinking: [
    "Let me find that for you... 🔍",
    "Searching the dance floor... 💫",
    "One moment while I look... ✨",
  ],
} as const;

export function getRandomResponse(category: keyof typeof AI_RESPONSES): string {
  const responses = AI_RESPONSES[category];
  return responses[Math.floor(Math.random() * responses.length)];
}
