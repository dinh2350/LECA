import { useCallback } from 'react';
import useFetch from '../use-fetch';
import { API_URL } from '../config';
import wrapperFetchJsonResponse from '../wrapper-fetch-json-response';
import { RequestConfigType } from './types/request-config';

export type SendEmailRequest = {
  to: string;
  subject: string;
  body: string;
};

export type EmailLog = {
  id: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt: string;
};

export type EmailLogsResponse = {
  data: EmailLog[];
};

export function useSendEmailService() {
  const fetchClient = useFetch();

  return useCallback(
    async (data: SendEmailRequest, requestConfig?: RequestConfigType) => {
      return fetchClient(`${API_URL}/v1/email/send`, {
        method: 'POST',
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<undefined>);
    },
    [fetchClient],
  );
}

export function useGetEmailLogsService() {
  const fetchClient = useFetch();

  return useCallback(
    async (requestConfig?: RequestConfigType) => {
      return fetchClient(`${API_URL}/v1/email/logs`, {
        method: 'GET',
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<EmailLogsResponse>);
    },
    [fetchClient],
  );
}
