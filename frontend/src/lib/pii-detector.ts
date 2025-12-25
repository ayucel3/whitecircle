/**
 * PII Detection Service
 * Detects sensitive information like emails, phone numbers, and common names
 */

export interface PIIMatch {
  type: 'email' | 'phone' | 'name';
  start: number;
  end: number;
  text: string;
}

// Common first names pattern (expanded list for better detection)
const COMMON_NAMES = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua',
  'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan',
  'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon',
  'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle',
  'Carol', 'Amanda', 'Dorothy', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia',
  'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna', 'Brenda', 'Pamela', 'Emma', 'Nicole', 'Helen',
  'Samantha', 'Katherine', 'Christine', 'Debra', 'Rachel', 'Carolyn', 'Janet', 'Catherine', 'Maria', 'Heather'
];

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

const PHONE_REGEX = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

/**
 * Detect PII in text using regex patterns
 */
export function detectPII(text: string): PIIMatch[] {
  const matches: PIIMatch[] = [];

  // Detect emails
  let match;
  const emailRegex = new RegExp(EMAIL_REGEX);
  while ((match = emailRegex.exec(text)) !== null) {
    matches.push({
      type: 'email',
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
    });
  }

  // Detect phone numbers
  const phoneRegex = new RegExp(PHONE_REGEX);
  while ((match = phoneRegex.exec(text)) !== null) {
    matches.push({
      type: 'phone',
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
    });
  }

  // Detect common names (word boundaries to avoid false positives)
  COMMON_NAMES.forEach((name) => {
    const nameRegex = new RegExp(`\\b${name}\\b`, 'g');
    while ((match = nameRegex.exec(text)) !== null) {
      matches.push({
        type: 'name',
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      });
    }
  });

  // Sort by start position
  return matches.sort((a, b) => a.start - b.start);
}

/**
 * Async PII detection (simulates delay for real-world scenarios)
 * Extra credit: Uses separate microservice
 */
export async function detectPIIAsync(text: string): Promise<PIIMatch[]> {
  try {
    const piiServiceUrl = process.env.PII_SERVICE_URL || 'http://localhost:3001';
    const response = await fetch(`${piiServiceUrl}/detect-pii`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`PII service error: ${response.statusText}`);
    }

    const { detections } = await response.json();
    
    // Map service response to our PIIMatch interface
    return detections.map((d: any) => ({
      type: d.type,
      start: d.start,
      end: d.end,
      text: d.value,
    }));
  } catch (error) {
    console.error('Failed to use PII microservice, falling back to local detection:', error);
    // Fallback to local detection
    await new Promise(resolve => setTimeout(resolve, 50));
    return detectPII(text);
  }
}

