import axios from "axios";

type ApiErrorPayload = {
  message?: string;
  code?: string;
  supportId?: string;
  details?: string;
};

export const toUserFacingError = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiErrorPayload | undefined;
    const message = payload?.message ?? fallbackMessage;
    const code = payload?.code ? ` [${payload.code}]` : "";
    const supportId = payload?.supportId
      ? ` Support ID: ${payload.supportId}.`
      : "";
    const details = payload?.details ? ` Details: ${payload.details}.` : "";
    return `${message}${code}.${supportId}${details}`.replace("..", ".");
  }

  return fallbackMessage;
};
