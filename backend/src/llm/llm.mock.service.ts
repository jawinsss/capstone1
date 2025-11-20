import { Injectable } from '@nestjs/common';

@Injectable()
export class MockLlmService {
  /**
   * Simple mock that returns a JSON string for parsing prompt
   * and a human-readable explanation for subsequent calls.
   * Tests may override these via jest.fn() if needed.
   */
  async generateResponse(userMessage: string, _context: string) {
    // If the prompt contains the phrase 'Phân tích' we return a JSON parse result
    if (userMessage && userMessage.toLowerCase().includes('phân tích')) {
      return JSON.stringify({ type: 'water_pipe', floors: 2, length: 25, notes: [] });
    }

    // Default explanation text
    return 'Dựa trên yêu cầu, nên dùng ống PPR PN20 D25 cho nhà 2 tầng.';
  }
}
