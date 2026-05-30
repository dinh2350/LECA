import { useCallback } from 'react';
import useFetch from '../use-fetch';
import { API_URL } from '../config';
import wrapperFetchJsonResponse from '../wrapper-fetch-json-response';
import { RequestConfigType } from './types/request-config';

// ─── Status ───────────────────────────────────────────────────

export type AssessmentStatusResponse = {
  hasCompleted: boolean;
  level?: 'A2' | 'B1' | 'C1';
  levelLabel?: string;
};

export function useGetAssessmentStatusService() {
  const fetch = useFetch();

  return useCallback(
    (requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/assessments/status`, {
        method: 'GET',
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AssessmentStatusResponse>);
    },
    [fetch],
  );
}

// ─── Start ────────────────────────────────────────────────────

export type StartAssessmentResponse = {
  id: string;
  promptIndex: number;
  promptText: string;
  totalPrompts: number;
};

export function useStartAssessmentService() {
  const fetch = useFetch();

  return useCallback(
    (requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/assessments`, {
        method: 'POST',
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<StartAssessmentResponse>);
    },
    [fetch],
  );
}

// ─── Answer ───────────────────────────────────────────────────

export type AnswerAssessmentRequest = {
  id: string;
  audio?: Blob;
  transcript?: string;
};

export type AnswerAssessmentResponse = {
  isComplete: boolean;
  aiFollowUp?: string;
  nextPromptIndex?: number;
  nextPromptText?: string;
};

export function useAnswerAssessmentService() {
  const fetch = useFetch();

  return useCallback(
    (data: AnswerAssessmentRequest, requestConfig?: RequestConfigType) => {
      const body = new FormData();
      if (data.audio) {
        body.append('audio', data.audio, 'recording.webm');
      }
      if (data.transcript) {
        body.append('transcript', data.transcript);
      }

      return fetch(`${API_URL}/v1/assessments/${data.id}/answer`, {
        method: 'POST',
        body,
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AnswerAssessmentResponse>);
    },
    [fetch],
  );
}

// ─── Complete ─────────────────────────────────────────────────

export type CompleteAssessmentResponse = {
  level: 'A2' | 'B1' | 'C1';
  levelLabel: string;
  score: number;
};

export function useCompleteAssessmentService() {
  const fetch = useFetch();

  return useCallback(
    (id: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/assessments/${id}/complete`, {
        method: 'POST',
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<CompleteAssessmentResponse>);
    },
    [fetch],
  );
}
