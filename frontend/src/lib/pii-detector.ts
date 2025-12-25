/**
 * PII Detection Service
 * Uses the internal Next.js API route which leverages LLMs (GPT-4o-mini)
 * for accurate detection of sensitive information.
 */

export interface PIIMatch {
  type: 'email' | 'phone' | 'name';
  start: number;
  end: number;
  text: string;
}

/**
 * Async PII detection
 * Calls the internal /api/detect-pii route.
 */
export async function detectPIIAsync(text: string): Promise<PIIMatch[]> {
  try {
    // In production on Vercel, this calls the relative /api/detect-pii route
    // In local development, it does the same.
    const response = await fetch('/api/detect-pii', {
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
    console.error('Failed to use PII API route:', error);
    return [];
  }
}


