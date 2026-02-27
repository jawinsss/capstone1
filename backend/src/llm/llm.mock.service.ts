import { Injectable } from '@nestjs/common';

@Injectable()
export class MockLlmService {
  async generateResponse(userMessage: string, _context: string) {
    if (userMessage && userMessage.toLowerCase().includes('phân tích')) {
      return JSON.stringify({ type: 'water_pipe', floors: 2, length: 25, notes: [] });
    }

    return 'Dựa trên yêu cầu, nên dùng ống PPR PN20 D25 cho nhà 2 tầng.';
  }
}
