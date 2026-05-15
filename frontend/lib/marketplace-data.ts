export const MP_NICHES = ['Comedy', 'Devotional', 'Business', 'Motivation', 'News', 'Education', 'Lifestyle', 'Food', 'Fashion'];
export const MP_LANGUAGES = ['Hindi', 'English', 'Hinglish'];

export const MP_CREATORS = [
  { id: 'c1', name: 'Rahul Sharma', handle: '@rahul.motivation', avatar: '🧔🏽', niches: ['Motivation', 'Business'], languages: ['Hindi', 'Hinglish'], followers: '480K', engagement: 6.2, rate: 12000, rating: 4.9, deals: 28, response: '< 4h', verified: ['ig','yt'], grad: 'reel-grad-1', sampleEmoji: '💪' },
  { id: 'c2', name: 'Priya Didi', handle: '@priya.kitchen', avatar: '👩🏽‍🍳', niches: ['Food', 'Lifestyle'], languages: ['Hindi'], followers: '1.2M', engagement: 8.4, rate: 25000, rating: 4.8, deals: 47, response: '< 2h', verified: ['ig','yt'], grad: 'reel-grad-2', sampleEmoji: '🍳' },
  { id: 'c3', name: 'Pandit Vinay', handle: '@daily.shloka', avatar: '🧔🏽‍♂️', niches: ['Devotional'], languages: ['Hindi'], followers: '890K', engagement: 9.1, rate: 18000, rating: 5.0, deals: 19, response: '< 6h', verified: ['ig'], grad: 'reel-grad-3', sampleEmoji: '🕉️' },
  { id: 'c4', name: 'Anjali Rao', handle: '@anjali.fashion', avatar: '👩🏽', niches: ['Fashion', 'Lifestyle'], languages: ['English', 'Hinglish'], followers: '230K', engagement: 5.6, rate: 9500, rating: 4.7, deals: 34, response: '< 8h', verified: ['ig','yt'], grad: 'reel-grad-4', sampleEmoji: '👗' },
  { id: 'c5', name: 'Karan Mehta', handle: '@karan.kirana', avatar: '🧑🏽‍💼', niches: ['Business'], languages: ['Hinglish'], followers: '34K', engagement: 7.8, rate: 5500, rating: 4.6, deals: 12, response: '< 12h', verified: ['ig'], grad: 'reel-grad-6', sampleEmoji: '🛒' },
  { id: 'c6', name: 'Dev Bhai', handle: '@dev.startup', avatar: '🧑🏽‍💻', niches: ['Business', 'Education'], languages: ['Hinglish', 'English'], followers: '92K', engagement: 8.9, rate: 14000, rating: 4.8, deals: 22, response: '< 5h', verified: ['ig','yt'], grad: 'reel-grad-4', sampleEmoji: '🚀' },
  { id: 'c7', name: 'Raju Bhaiya', handle: '@raju.comedy', avatar: '🤣', niches: ['Comedy'], languages: ['Hindi', 'Hinglish'], followers: '2.4M', engagement: 11.2, rate: 45000, rating: 4.9, deals: 64, response: '< 3h', verified: ['ig','yt'], grad: 'reel-grad-2', sampleEmoji: '😂' },
  { id: 'c8', name: 'Anchor Rohit', handle: '@news.rohit', avatar: '📺', niches: ['News'], languages: ['Hindi'], followers: '160K', engagement: 6.8, rate: 11000, rating: 4.5, deals: 16, response: '< 10h', verified: ['ig'], grad: 'reel-grad-5', sampleEmoji: '📰' },
  { id: 'c9', name: 'Meera Joshi', handle: '@meera.yoga', avatar: '🧘🏽‍♀️', niches: ['Lifestyle', 'Motivation'], languages: ['English', 'Hindi'], followers: '320K', engagement: 7.4, rate: 16000, rating: 4.7, deals: 30, response: '< 5h', verified: ['ig','yt'], grad: 'reel-grad-3', sampleEmoji: '🧘' },
];

export const MP_BRIEFS = [
  { id: 'b1', brand: 'FitFlex', industry: 'Fitness app', logo: '💪', color: '#FF5722', title: 'Funny gym reels for app launch', desc: 'Need 5 funny, relatable reels around gym beginners...', budget: 15000, num: 5, timeline: 7, niches: ['Comedy', 'Motivation'], languages: ['Hindi', 'Hinglish'], platforms: ['Instagram', 'YouTube'], match: 94, postedAgo: '2h ago', status: 'new' },
  { id: 'b2', brand: 'Spice & Co.', industry: 'D2C kitchen', logo: '🌶️', color: '#D32F2F', title: 'Recipe reels using our masala', desc: '3 quick recipe reels...', budget: 12000, num: 3, timeline: 10, niches: ['Food', 'Lifestyle'], languages: ['Hindi'], platforms: ['Instagram'], match: 88, postedAgo: '5h ago', status: 'new' },
  { id: 'b3', brand: 'TempleApp', industry: 'Spiritual app', logo: '🕉️', color: '#FF9800', title: 'Daily shloka campaign — 7 reels', desc: 'Devotional reels with Sanskrit shloka...', budget: 8000, num: 7, timeline: 14, niches: ['Devotional'], languages: ['Hindi'], platforms: ['Instagram', 'YouTube'], match: 91, postedAgo: '1d ago', status: 'viewed' },
  { id: 'b4', brand: 'Vidya Edu', industry: 'EdTech', logo: '📚', color: '#7B2CBF', title: 'NEET prep — motivation reels', desc: 'Motivational reels for 12th-grade students...', budget: 10000, num: 4, timeline: 8, niches: ['Motivation', 'Education'], languages: ['Hinglish', 'Hindi'], platforms: ['Instagram', 'YouTube'], match: 86, postedAgo: '1d ago', status: 'new' },
];

export const MP_DEALS = [
  { id: 'd1', brand: 'FitFlex', logo: '💪', color: '#FF5722', title: '5 funny gym reels', amount: 75000, status: 'in_progress', progress: 60, deadline: 'in 4 days', escrow: 37500, delivered: 3, total: 5 },
  { id: 'd2', brand: 'Spice & Co.', logo: '🌶️', color: '#D32F2F', title: '3 recipe reels — chaat masala', amount: 36000, status: 'review', progress: 90, deadline: 'in 2 days', escrow: 18000, delivered: 3, total: 3 },
  { id: 'd3', brand: 'TempleApp', logo: '🕉️', color: '#FF9800', title: '7 daily shloka reels', amount: 56000, status: 'completed', progress: 100, deadline: 'delivered', escrow: 0, delivered: 7, total: 7 },
];
