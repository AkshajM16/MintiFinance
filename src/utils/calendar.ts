import { EVENT_CATEGORIES } from '@/constants';

export async function fetchGoogleCalendarEvents(accessToken: string, retries = 3): Promise<any[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=2500&singleEvents=true&orderBy=startTime&timeMin=" +
          new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!res.ok) {
        if (res.status === 401) {
          // Token expired or invalid
          if (typeof window !== 'undefined') {
            localStorage.removeItem('google_id_token');
            localStorage.removeItem('google_access_token');
            alert('Your Google session expired. Please log in again to sync your calendar.');
            window.location.reload();
          }
          throw new Error("Google session expired. Please log in again.");
        }
        throw new Error(`Google API error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      return data.items || [];
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  return [];
}

// Enhanced categorization with spending prediction
export interface EventAnalysis {
  category: string;
  spendingProbability: number; // 0-1 scale
  expectedSpendingRange: [number, number]; // min, max in dollars
  spendingCategories: string[];
  confidence: number; // 0-1 scale
  keywords: string[];
}

// Function to detect college class codes
function detectCollegeClassCode(text: string): boolean {
  if (!text) return false;
  
  const classCodePatterns = [
    // 3-4 letter codes followed by numbers (e.g., RHET 101, MATH 201)
    /\b[A-Z]{3,4}\s+\d{3,4}\b/,
    // Standalone 3-4 letter codes (e.g., RHET, ECON, MATH)
    /\b[A-Z]{3,4}\b/,
    // Common course prefixes
    /\b(CS|MATH|PHYS|CHEM|BIO|HIST|ENGL|SPAN|FREN|GERM|ECON|PSYC|SOCI|POLI|GOVT|LAW|MED|NURS|BUS|MKT|FIN|ACC|MGMT|HR|OPS|SUPPLY|LOG|PSYCH|SOC|ANTH|POL|GOV|LAW|MED|NURS|PHARM|DENT|VET|AGRI|ENV|GEO|MET|OCEAN|RHE|THEA|FILM|PHOTO|DRAW|PAINT|SCULPT|ARCH|DESIGN|MUS|DRAM|ART|SCI|TECH|INFO|DATA|COMP|ALG|GEOM|TRIG|CALC|STAT)\b/
  ];
  
  return classCodePatterns.some(pattern => pattern.test(text.toUpperCase()));
}

export function analyzeEvent(event: any): EventAnalysis {
  const summary = event.summary || '';
  const description = event.description || '';
  const location = (event.location || "").toLowerCase();
  const text = `${summary} ${description} ${location}`;
  
  // Check for college class codes first (highest priority)
  if (detectCollegeClassCode(summary) || detectCollegeClassCode(description)) {
    return {
      category: EVENT_CATEGORIES.COLLEGE_CLASSES,
      spendingProbability: 0.2,
      expectedSpendingRange: [0, 100] as [number, number],
      spendingCategories: ['Education'],
      confidence: 0.98,
      keywords: ['college class code detected']
    };
  }
  
  // Define spending patterns for different event types
  const spendingPatterns = {
    'Dining & Social': {
      keywords: ['dinner', 'lunch', 'breakfast', 'brunch', 'restaurant', 'cafe', 'coffee', 'bar', 'pub', 'party', 'social', 'meet', 'date', 'food', 'eat', 'dining'],
      spendingProbability: 0.8,
      expectedSpendingRange: [15, 80],
      spendingCategories: ['Food & Dining'],
      confidence: 0.85
    },
    'Travel & Transportation': {
      keywords: ['flight', 'train', 'bus', 'taxi', 'uber', 'lyft', 'travel', 'trip', 'vacation', 'hotel', 'airbnb', 'transport', 'commute', 'drive', 'parking'],
      spendingProbability: 0.9,
      expectedSpendingRange: [20, 500],
      spendingCategories: ['Transportation', 'Travel'],
      confidence: 0.9
    },
    'Shopping & Retail': {
      keywords: ['shopping', 'store', 'mall', 'buy', 'purchase', 'retail', 'clothes', 'shoes', 'electronics', 'grocery', 'market', 'shop'],
      spendingProbability: 0.7,
      expectedSpendingRange: [25, 200],
      spendingCategories: ['Shopping'],
      confidence: 0.8
    },
    'Entertainment & Recreation': {
      keywords: ['movie', 'theater', 'concert', 'show', 'game', 'sports', 'gym', 'fitness', 'workout', 'entertainment', 'fun', 'play', 'activity', 'hobby'],
      spendingProbability: 0.6,
      expectedSpendingRange: [10, 150],
      spendingCategories: ['Entertainment'],
      confidence: 0.75
    },
    'Health & Medical': {
      keywords: ['doctor', 'dentist', 'medical', 'health', 'appointment', 'checkup', 'therapy', 'pharmacy', 'medicine', 'hospital', 'clinic'],
      spendingProbability: 0.5,
      expectedSpendingRange: [50, 300],
      spendingCategories: ['Healthcare'],
      confidence: 0.8
    },
    'Education & Training': {
      keywords: ['class', 'course', 'training', 'workshop', 'seminar', 'lecture', 'study', 'learning', 'education', 'school', 'tutorial'],
      spendingProbability: 0.4,
      expectedSpendingRange: [0, 200],
      spendingCategories: ['Education'],
      confidence: 0.7
    },
    'College Classes': {
      keywords: [
        'class', 'lecture', 'lab', 'seminar', 'tutorial', 'professor', 'midterm', 'final', 'exam', 'syllabus', 
        'university', 'college', 'campus', 'course', 'assignment', 'homework', 'quiz', 'test',
        // College class codes
        'rhet', 'econ', 'math', 'cs', 'bio', 'chem', 'phys', 'hist', 'engl', 'span', 'fren', 'germ',
        'calc', 'stat', 'alg', 'geom', 'trig', 'comp', 'data', 'info', 'tech', 'eng', 'sci', 'art',
        'mus', 'dram', 'thea', 'film', 'photo', 'draw', 'paint', 'sculpt', 'arch', 'design', 'bus',
        'mkt', 'fin', 'acc', 'mgmt', 'hr', 'ops', 'supply', 'log', 'psych', 'soc', 'anth', 'pol',
        'gov', 'law', 'med', 'nurs', 'pharm', 'dent', 'vet', 'agri', 'env', 'geo', 'met', 'ocean'
      ],
      spendingProbability: 0.2,
      expectedSpendingRange: [0, 100],
      spendingCategories: ['Education'],
      confidence: 0.95
    },
    'Work & Business': {
      keywords: ['meeting', 'work', 'business', 'office', 'client', 'presentation', 'conference', 'interview', 'job', 'career', 'professional'],
      spendingProbability: 0.3,
      expectedSpendingRange: [0, 100],
      spendingCategories: ['Business'],
      confidence: 0.7
    },
    'Personal & Social': {
      keywords: ['personal', 'family', 'friend', 'social', 'gathering', 'celebration', 'birthday', 'anniversary', 'wedding', 'event'],
      spendingProbability: 0.5,
      expectedSpendingRange: [20, 150],
      spendingCategories: ['Personal'],
      confidence: 0.6
    }
  };
  
  let bestMatch: EventAnalysis = {
    category: EVENT_CATEGORIES.OTHER,
    spendingProbability: 0.1,
    expectedSpendingRange: [0, 0],
    spendingCategories: [],
    confidence: 0.1,
    keywords: []
  };
  
  for (const [category, pattern] of Object.entries(spendingPatterns)) {
    const matchedKeywords = pattern.keywords.filter(keyword => 
      text.includes(keyword)
    );
    
    if (matchedKeywords.length > 0) {
      const score = matchedKeywords.length / pattern.keywords.length;
      if (score > bestMatch.confidence) {
        bestMatch = {
          category: category as string,
          spendingProbability: pattern.spendingProbability,
          expectedSpendingRange: pattern.expectedSpendingRange as [number, number],
          spendingCategories: pattern.spendingCategories as string[],
          confidence: pattern.confidence * score,
          keywords: matchedKeywords as string[]
        };
      }
    }
  }
  
  // Adjust spending probability based on event duration and time
  const startTime = new Date(event.start?.dateTime || event.start?.date);
  const endTime = new Date(event.end?.dateTime || event.end?.date);
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours
  
  // Longer events might have higher spending
  if (duration > 4) {
    bestMatch.expectedSpendingRange[1] *= 1.5;
  }
  
  // Weekend events might have higher spending
  const dayOfWeek = startTime.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
    bestMatch.spendingProbability *= 1.2;
    bestMatch.expectedSpendingRange[1] *= 1.3;
  }
  
  // Evening events might have higher spending
  const hour = startTime.getHours();
  if (hour >= 18 || hour <= 6) { // Evening/night
    bestMatch.spendingProbability *= 1.1;
  }
  
  return bestMatch;
}

export function categorizeEvent(event: any): string {
  return analyzeEvent(event).category;
}

export function formatEventDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Tomorrow";
    } else if (diffDays === -1) {
      return "Yesterday";
    } else if (diffDays > 0 && diffDays <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  } catch {
    return "Invalid date";
  }
} 