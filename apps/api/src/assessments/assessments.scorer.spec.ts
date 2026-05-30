import { Test } from '@nestjs/testing';
import { AssessmentsScorer } from './assessments.scorer';

describe('AssessmentsScorer.classify', () => {
  let scorer: AssessmentsScorer;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AssessmentsScorer],
    }).compile();
    scorer = module.get(AssessmentsScorer);
  });

  it('classifies score < 40 as A2 (Beginner)', () => {
    expect(scorer.classify(0).level).toBe('A2');
    expect(scorer.classify(0).label).toBe('Beginner');
    expect(scorer.classify(39).level).toBe('A2');
  });

  it('classifies score 40–69 as B1 (Intermediate)', () => {
    expect(scorer.classify(40).level).toBe('B1');
    expect(scorer.classify(40).label).toBe('Intermediate');
    expect(scorer.classify(69).level).toBe('B1');
  });

  it('classifies score >= 70 as C1 (Advanced)', () => {
    expect(scorer.classify(70).level).toBe('C1');
    expect(scorer.classify(70).label).toBe('Advanced');
    expect(scorer.classify(100).level).toBe('C1');
  });
});
