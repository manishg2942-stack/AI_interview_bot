export const interviewTypes = [
  { value: 'dsa', label: 'DSA', detail: 'Algorithms, data structures, complexity' },
  { value: 'lld', label: 'LLD', detail: 'Classes, APIs, entities, design tradeoffs' },
  { value: 'hld', label: 'HLD', detail: 'Scale, architecture, storage, reliability' },
  { value: 'behavioral', label: 'Behavioral', detail: 'Projects, ownership, communication' },
];

export const companies = ['Amazon', 'Google', 'Microsoft', 'Meta', 'Netflix', 'Startup'];
export const levels = ['Fresher', 'SDE 1', 'SDE 2', 'Senior'];
export const difficulties = ['Easy', 'Medium', 'Hard'];

export const lldQuestions = [
  'Parking lot system',
  'Splitwise-style expense sharing',
  'Ride booking core flow',
  'Food delivery order management',
  'Meeting scheduler',
  'Rate limiter library',
  'Cache with eviction policy',
  'BookMyShow-style seat booking',
];

export const hldQuestions = [
  'URL shortener',
  'Chat or messaging system',
  'Video streaming platform',
  'Ride matching system',
  'Food delivery platform',
  'News feed',
  'Payment processing system',
  'Notification delivery system',
];

export const defaultInterviewSetup = {
  type: 'dsa',
  company: 'Amazon',
  level: 'SDE 1',
  difficulty: 'Medium',
  room: 'demo-room',
  designQuestion: lldQuestions[0],
  resumeText: '',
};
