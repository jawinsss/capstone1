import { Test, TestingModule } from '@nestjs/testing';
import { CalculatorService } from './caculator.service';
import { MaterialCalculatorRequestDto } from './dto/material-calculator-request.dto';
import { MaterialCalcFormDto } from './dto/material-calc-form.dto';

describe('CalculatorService (unit)', () => {
  let service: CalculatorService;

  const llmMock = {
    // will be set per-test using mockResolvedValueOnce where needed
    generateResponse: jest.fn(),
  };

  const vectorMock = {
    searchRelevantProducts: jest.fn().mockResolvedValue([
      {
        id: 'p1',
        name: 'Ống PPR PN20 D25',
        category: { name: 'PPR' },
        price: 120000,
        stock: 50,
        images: [{ url: 'vat_tu/vat-tu-kim-khi/img1.jpg' }],
      },
    ]),
  };

  const prismaMock = {
    product: {
      findMany: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalculatorService,
        { provide: 'LlmService', useValue: llmMock },
        { provide: 'VectorService', useValue: vectorMock },
        { provide: 'PrismaService', useValue: prismaMock },
      ],
    })
      // override tokens used by actual imports
      .overrideProvider('LlmService')
      .useValue(llmMock)
      .overrideProvider('VectorService')
      .useValue(vectorMock)
      .overrideProvider('PrismaService')
      .useValue(prismaMock)
      .compile();

    service = module.get<CalculatorService>(CalculatorService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('calculateMaterials should parse LLM JSON and return suggestions', async () => {
    // First call (parse) returns JSON; second call (explanation) returns text
    llmMock.generateResponse.mockResolvedValueOnce(
      JSON.stringify({ type: 'water_pipe', floors: 2, length: 25, notes: [] }),
    );
    llmMock.generateResponse.mockResolvedValueOnce('Giải thích ngắn gọn');

    const dto: MaterialCalculatorRequestDto = { question: 'Tôi cần ống PPR cho nhà 2 tầng' } as any;

    const res = await service.calculateMaterials(dto);

    expect(res).toBeDefined();
    expect(res.aiExplanation).toBe('Giải thích ngắn gọn');
    expect(Array.isArray(res.suggestions)).toBe(true);
    expect(res.suggestions.length).toBeGreaterThan(0);
    expect(res.suggestions[0].name).toContain('Ống PPR');
  });

  it('calculateFromForm should fetch products and compute quantities', async () => {
    // Mock prisma product results
    prismaMock.product.findMany.mockResolvedValueOnce([
      {
        id: 'p1',
        name: 'Ống PPR 4m',
        images: [{ url: 'vat_tu/bao-ho-lao-dong/img1.jpg' }],
        category: { name: 'PPR' },
        price: 50000,
        stock: 100,
      },
    ]);

    const payload: MaterialCalcFormDto = {
      categoryId: 'cat1',
      subCategoryId: 'sub1',
      productType: 'ppr',
      length: 25,
      quantity: 1,
    } as any;

    const out = await service.calculateFromForm(payload);

    expect(out).toBeDefined();
    expect(out.success).toBe(true);
    expect(out.totalProducts).toBeGreaterThanOrEqual(0);
    expect(out.results[0].calculatedQuantity).toBeGreaterThan(0);
  });
});
