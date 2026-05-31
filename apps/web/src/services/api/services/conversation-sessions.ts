import { useCallback } from 'react';
import useFetch from '../use-fetch';
import { API_URL } from '../config';
import wrapperFetchJsonResponse from '../wrapper-fetch-json-response';
import { RequestConfigType } from './types/request-config';

// ─── Types ────────────────────────────────────────────────────

export type CreateSessionResponse = {
  sessionId: string;
  livekitToken: string;
  livekitUrl: string;
};

// ─── Create session ───────────────────────────────────────────

export function useCreateSessionService() {
  const fetch = useFetch();

  return useCallback(
    (scenarioId?: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/conversation-sessions`, {
        method: 'POST',
        body: JSON.stringify({ scenarioId }),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<CreateSessionResponse>);
    },
    [fetch],
  );
}

// ─── End session ─────────────────────────────────────────────

export function useEndSessionService() {
  const fetch = useFetch();

  return useCallback(
    (sessionId: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/conversation-sessions/${sessionId}`, {
        method: 'DELETE',
        ...requestConfig,
      });
    },
    [fetch],
  );
}
