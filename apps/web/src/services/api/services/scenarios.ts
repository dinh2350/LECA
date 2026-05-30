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
