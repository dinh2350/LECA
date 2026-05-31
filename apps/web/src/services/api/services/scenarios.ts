import { useCallback } from 'react';
import useFetch from '../use-fetch';
import { API_URL } from '../config';
import wrapperFetchJsonResponse from '../wrapper-fetch-json-response';
import { RequestConfigType } from './types/request-config';

// ─── Types ────────────────────────────────────────────────────

export type ScenarioPhrase = {
  id: string;
  phrase: string;
  exampleSentence: string;
  audioUrl?: string | null;
  difficulty?: string | null;
  displayOrder: number;
};

export type ScenarioListItem = {
  id: string;
  title: string;
  description?: string | null;
  difficulty: string;
  situationType: string;
  tags: string[];
  ratingAvg?: number | null;
  ratingCount: number;
  useCount: number;
  authorName?: string | null;
};

export type ScenarioDetail = ScenarioListItem & {
  aiRole: string;
  context: string;
  openingLine?: string | null;
  phrases: ScenarioPhrase[];
};

export type ScenarioListResponse = {
  data: ScenarioListItem[];
  total: number;
  page: number;
  limit: number;
};

export type ListScenariosParams = {
  q?: string;
  category?: 'everyday' | 'work';
  difficulty?: string;
  page?: number;
  limit?: number;
};

// ─── List ─────────────────────────────────────────────────────

export function useListScenariosService() {
  const fetch = useFetch();

  return useCallback(
    (params?: ListScenariosParams, requestConfig?: RequestConfigType) => {
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.set('q', params.q);
      if (params?.category) searchParams.set('category', params.category);
      if (params?.difficulty) searchParams.set('difficulty', params.difficulty);
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      const qs = searchParams.toString();

      return fetch(`${API_URL}/v1/scenarios${qs ? `?${qs}` : ''}`, {
        method: 'GET',
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ScenarioListResponse>);
    },
    [fetch],
  );
}

// ─── Detail ───────────────────────────────────────────────────

export function useGetScenarioService() {
  const fetch = useFetch();

  return useCallback(
    (id: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/scenarios/${encodeURIComponent(id)}`, {
        method: 'GET',
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ScenarioDetail>);
    },
    [fetch],
  );
}

// ─── UGC types ────────────────────────────────────────────────

export type CreateScenarioPhrasePayload = {
  phrase: string;
  exampleSentence: string;
  difficulty?: string;
};

export type CreateScenarioPayload = {
  title: string;
  description?: string;
  aiRole: string;
  context: string;
  difficulty: string;
  situationType: string;
  tags?: string[];
  phrases: CreateScenarioPhrasePayload[];
};

export type CreateScenarioResponse = {
  id: string;
  status: string;
  title: string;
};

export type MyScenarioItem = {
  id: string;
  title: string;
  status: string;
  difficulty: string;
  situationType: string;
  ratingAvg: number | null;
  ratingCount: number;
  createdAt: string;
};

export type PendingReviewResponse = {
  data: ScenarioListItem[];
  total: number;
};

// ─── Create ───────────────────────────────────────────────────

export function useCreateScenarioService() {
  const fetch = useFetch();

  return useCallback(
    (payload: CreateScenarioPayload, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/scenarios`, {
        method: 'POST',
        body: JSON.stringify(payload),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<CreateScenarioResponse>);
    },
    [fetch],
  );
}

// ─── Mine ─────────────────────────────────────────────────────

export function useListMyScenariosService() {
  const fetch = useFetch();

  return useCallback(
    (requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/scenarios/mine`, {
        method: 'GET',
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<MyScenarioItem[]>);
    },
    [fetch],
  );
}

// ─── Rate ─────────────────────────────────────────────────────

export function useRateScenarioService() {
  const fetch = useFetch();

  return useCallback(
    (id: string, rating: number, requestConfig?: RequestConfigType) => {
      return fetch(
        `${API_URL}/v1/scenarios/${encodeURIComponent(id)}/ratings`,
        {
          method: 'POST',
          body: JSON.stringify({ rating }),
          ...requestConfig,
        },
      ).then(wrapperFetchJsonResponse<void>);
    },
    [fetch],
  );
}

// ─── Admin: pending review ─────────────────────────────────────

export function useListPendingReviewService() {
  const fetch = useFetch();

  return useCallback(
    (requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/scenarios/pending-review`, {
        method: 'GET',
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<PendingReviewResponse>);
    },
    [fetch],
  );
}

// ─── Admin: review decision ────────────────────────────────────

export function useReviewScenarioService() {
  const fetch = useFetch();

  return useCallback(
    (
      id: string,
      decision: 'approved' | 'rejected',
      notes?: string,
      requestConfig?: RequestConfigType,
    ) => {
      return fetch(
        `${API_URL}/v1/scenarios/${encodeURIComponent(id)}/reviews`,
        {
          method: 'POST',
          body: JSON.stringify({ decision, notes }),
          ...requestConfig,
        },
      ).then(wrapperFetchJsonResponse<void>);
    },
    [fetch],
  );
}
