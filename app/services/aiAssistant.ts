import OpenAI from 'openai';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sustainabilityScore?: number;
  ecoFriendly?: boolean;
  recyclable?: boolean;
  carbonFootprint?: string;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  message?: string;
  error?: string;
  details?: string;
}

export class AIAssistantService {
  private router: any;
  private apiUrl: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor() {
    this.router = null;
    this.apiUrl = '/api/ai/chat';
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  setRouter(router: any) {
    this.router = router;
  }

  private async searchProducts(query: string): Promise<Product[]> {
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&sustainable=true`);
      if (!response.ok) throw new Error('Search failed');
      return await response.json();
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  private async addToCart(productId: string, quantity: number = 1): Promise<boolean> {
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest(message: string, attempt: number = 1): Promise<AIResponse> {
    try {
      console.log(`[AI Assistant] Making request attempt ${attempt}/${this.maxRetries}`);
      console.log('[AI Assistant] Request URL:', this.apiUrl);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      console.log('[AI Assistant] Response status:', response.status);

      const rawResponse = await response.text();
      let data: AIResponse;
      
      try {
        data = JSON.parse(rawResponse);
      } catch (parseError) {
        console.error('[AI Assistant] Failed to parse response:', parseError);
        throw new Error('The AI service returned an invalid response format. Please try again.');
      }

      if (!response.ok) {
        // Handle specific error cases
        if (data.error?.includes('API key') || data.details?.includes('API key')) {
          throw new Error('The AI service needs to be configured with a valid OpenAI API key. Please visit https://platform.openai.com/api-keys to get one.');
        }

        // For other errors, retry if we haven't exceeded max attempts
        if (attempt < this.maxRetries) {
          console.log(`[AI Assistant] Retrying request (attempt ${attempt + 1} of ${this.maxRetries})...`);
          await this.wait(this.retryDelay * attempt); // Exponential backoff
          return this.makeRequest(message, attempt + 1);
        }

        throw new Error(data.error || data.details || 'The AI service encountered an error. Please try again.');
      }

      if (!data.message) {
        throw new Error('The AI service returned an incomplete response. Please try again.');
      }

      return data;
    } catch (error) {
      console.error('[AI Assistant] Request failed:', error);
      
      // Convert all errors to user-friendly messages
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Unable to connect to the AI service. Please check your internet connection.');
        }
        throw error;
      }
      
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }

  async processMessage(message: string): Promise<string> {
    try {
      const data = await this.makeRequest(message);

      if (!data || typeof data.message !== 'string') {
        throw new Error('The AI service returned an invalid response format. Please try again.');
      }

      return data.message;
    } catch (error: unknown) {
      console.error('[AI Assistant] Error:', error);
      
      // Pass through user-friendly error messages
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to process your message. Please try again.');
    }
  }

  private extractSearchTerms(message: string): string {
    const cleanMessage = message.toLowerCase()
      .replace(/can you (help me )?find/g, '')
      .replace(/i('m| am) looking for/g, '')
      .replace(/search for/g, '')
      .replace(/show me/g, '')
      .trim();

    return cleanMessage || '';
  }
}

export async function sendMessage(message: string): Promise<string> {
  console.log('[DEBUG] Sending message to AI assistant:', message);
  
  try {
    console.log('[DEBUG] Making fetch request to /api/ai/chat');
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    console.log('[DEBUG] Response status:', response.status);
    console.log('[DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DEBUG] Error response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error('[DEBUG] Parsed error details:', errorJson);
        throw new Error(errorJson.details || errorJson.error || 'Failed to get AI response');
      } catch (parseError) {
        console.error('[DEBUG] Failed to parse error response:', parseError);
        throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorText}`);
      }
    }

    const rawResponseText = await response.text();
    console.log('[DEBUG] Raw response text:', rawResponseText);

    let data;
    try {
      data = JSON.parse(rawResponseText);
      console.log('[DEBUG] Parsed response data:', data);
    } catch (parseError) {
      console.error('[DEBUG] Failed to parse response as JSON:', parseError);
      throw new Error('Invalid JSON response from server');
    }

    if (!data.message) {
      console.error('[DEBUG] Response missing message field:', data);
      throw new Error('Invalid response format from server');
    }

    console.log('[DEBUG] Successfully received AI response');
    return data.message;
  } catch (error: unknown) {
    console.error('[DEBUG] Request failed:', error);
    throw error instanceof Error ? error : new Error('Failed to get AI response');
  }
} 