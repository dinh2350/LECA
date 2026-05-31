import { useCallback } from 'react';
import useFetch from '../use-fetch';
import { API_URL } from '../config';
import wrapperFetchJsonResponse from '../wrapper-fetch-json-response';
import { RequestConfigType } from './types/request-config';

// ─── Types ────────────────────────────────────────────────────

export type MissedPhrase = {
  phrase: string;
  exampleSentence: string;
};

export type SessionSummary = {
  sessionId: string;
  scenarioTitle: string | null;
  fluencyScore: number | null;
  pronunciationScore: number | null;
  vocabularyScore: number | null;
  durationSeconds: number | null;
  turnCount: number;
  speakingMs: number;
  phrasesUsed: string[];
  phrasesMissed: MissedPhrase[];
  topPhonemeError: string | null;
  phonemeErrorCount: number;
};

export type PhonemeErrors = {
  topPhoneme: string | null;
  errorCount: number;
  wordPairs: Array<{
    targetWord: string;
    foilWord: string;
    targetIpa: string;
    foilIpa: string;
  }>;
};

// ─── Get summary ──────────────────────────────────────────────

export function useGetSessionSummaryService() {
  const fetch = useFetch();

  return useCallback(
    (sessionId: string, requestConfig?: RequestConfigType) => {
      return fetch(
        `${API_URL}/v1/conversation-sessions/${encodeURIComponent(sessionId)}/summary`,
        { method: 'GET', ...requestConfig },
      ).then(wrapperFetchJsonResponse<SessionSummary>);
    },
    [fetch],
  );
}

// ─── Get phoneme errors ───────────────────────────────────────

export function useGetPhonemeErrorsService() {
  const fetch = useFetch();

  return useCallback(
    (sessionId: string, requestConfig?: RequestConfigType) => {
      return fetch(
        `${API_URL}/v1/conversation-sessions/${encodeURIComponent(sessionId)}/phoneme-errors`,
        { method: 'GET', ...requestConfig },
      ).then(wrapperFetchJsonResponse<PhonemeErrors>);
    },
    [fetch],
  );
}
