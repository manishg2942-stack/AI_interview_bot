export const INTERVIEW_TYPES = [
  { value: 'dsa', label: 'DSA', detail: 'Algorithms, data structures, complexity' },
  { value: 'lld', label: 'LLD', detail: 'Classes, APIs, entities, design tradeoffs' },
  { value: 'hld', label: 'HLD', detail: 'Scale, architecture, storage, reliability' },
  { value: 'behavioral', label: 'Behavioral', detail: 'Projects, ownership, communication' },
];

export const COMPANIES = ['Amazon', 'Google', 'Microsoft', 'Meta', 'Netflix', 'Startup'];
export const LEVELS = ['Fresher', 'SDE 1', 'SDE 2', 'Senior'];
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export const LLD_QUESTIONS = [
  'Parking lot system',
  'Splitwise-style expense sharing',
  'Ride booking core flow',
  'Food delivery order management',
  'Meeting scheduler',
  'Rate limiter library',
  'Cache with eviction policy',
  'BookMyShow-style seat booking',
];

export const HLD_QUESTIONS = [
  'URL shortener',
  'Chat or messaging system',
  'Video streaming platform',
  'Ride matching system',
  'Food delivery platform',
  'News feed',
  'Payment processing system',
  'Notification delivery system',
];

export const DEFAULT_INTERVIEW_SETUP = {
  type: 'dsa',
  company: 'Amazon',
  level: 'SDE 1',
  difficulty: 'Medium',
  room: 'demo-room',
  designQuestion: LLD_QUESTIONS[0],
  resumeText: '',
};

export const QUESTION_STATUS_TEXT = {
  checking: 'Checking matching DSA question...',
  ready: 'Matching DSA question ready.',
  empty: 'No exact DSA question match found. Backend will try fallback questions.',
  unknown: 'Question check unavailable. You can still start.',
};

export const MAX_RESUME_LENGTH = 8000;
