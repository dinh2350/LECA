import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AssessmentsScorer {
  private readonly logger = new Logger(AssessmentsScorer.name);
  private readonly ollamaUrl: string;

  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL ?? 'http://localhost:11434';
  }

  /**
   * Score a learner's transcript for a given prompt index.
   * Returns a score 0–100.
   * Falls back to a heuristic if Ollama is unavailable.
   */
  async score(promptIndex: number, transcript: string): Promise<number> {
    if (!transcript || transcript.trim().length === 0) {
      return 30; // Minimal score for no response
    }

    try {
      return await this.scoreViaOllama(promptIndex, transcript);
    } catch (err) {
      this.logger.warn(
        `Ollama unavailable, using heuristic fallback: ${(err as Error).message}`,
      );
      return this.heuristicScore(transcript);
    }
  }

  private async scoreViaOllama(
    promptIndex: number,
    transcript: string,
  ): Promise<number> {
    const difficultyLabel =
      promptIndex < 2
        ? 'Beginner'
        : promptIndex < 4
          ? 'Intermediate'
          : 'Advanced';

    const prompt = `You are an English language assessor. Score the following learner response to an assessment prompt on a scale of 0 to 100, where 0 is completely unintelligible and 100 is native-level fluency. Consider grammar, vocabulary, clarity, and completeness. Respond with ONLY a number between 0 and 100.

Prompt difficulty: ${difficultyLabel}
Learner response: "${transcript}"
Score:`;

    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    const data = (await response.json()) as { response: string };
    const match = data.response.match(/\d+/);
    if (!match) throw new Error('Could not parse Ollama score');

    return Math.min(100, Math.max(0, parseInt(match[0], 10)));
  }

  /**
   * Simple heuristic: word count + avg word length as a proxy for complexity.
   * Only used when Ollama is down.
   */
  private heuristicScore(transcript: string): number {
    const words = transcript.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const avgLen =
      wordCount > 0
        ? words.reduce((sum, w) => sum + w.length, 0) / wordCount
        : 0;

    const lengthScore = Math.min(60, wordCount * 2);
    const complexityScore = Math.min(40, Math.round(avgLen * 5));
    return Math.min(100, lengthScore + complexityScore);
  }

  /** Map average score to a CEFR level (must match DB check constraint). */
  classify(avgScore: number): { level: 'A2' | 'B1' | 'C1'; label: string } {
    if (avgScore < 40) return { level: 'A2', label: 'Beginner' };
    if (avgScore < 70) return { level: 'B1', label: 'Intermediate' };
    return { level: 'C1', label: 'Advanced' };
  }
}
