import { NextResponse } from "next/server";

type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "EXTERNAL_SERVICE_ERROR"
  | "INTERNAL_ERROR";

type ErrorPayload = {
  message: string;
  code: ErrorCode;
  supportId: string;
  details?: string;
};

const createSupportId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }
};

export class AppError extends Error {
  code: ErrorCode;
  status: number;
  details?: string;

  constructor(params: {
    message: string;
    status: number;
    code: ErrorCode;
    details?: string;
  }) {
    super(params.message);
    this.name = "AppError";
    this.code = params.code;
    this.status = params.status;
    this.details = params.details;
  }
}

export const apiErrorResponse = (params: {
  message: string;
  status: number;
  code: ErrorCode;
  details?: string;
  context: string;
  error?: unknown;
}) => {
  const supportId = createSupportId();
  const payload: ErrorPayload = {
    message: params.message,
    code: params.code,
    supportId,
    ...(params.details ? { details: params.details } : {}),
  };

  if (params.error) {
    console.error(`[${params.context}]`, {
      supportId,
      code: params.code,
      status: params.status,
      message: params.message,
      details: params.details,
      error: params.error,
    });
  } else {
    console.warn(`[${params.context}]`, {
      supportId,
      code: params.code,
      status: params.status,
      message: params.message,
      details: params.details,
    });
  }

  return NextResponse.json(payload, { status: params.status });
};

export const handleApiError = (params: { context: string; error: unknown }) => {
  if (params.error instanceof AppError) {
    return apiErrorResponse({
      message: params.error.message,
      code: params.error.code,
      status: params.error.status,
      details: params.error.details,
      context: params.context,
      error: params.error,
    });
  }

  return apiErrorResponse({
    message: "Something went wrong on our side. Please contact support.",
    code: "INTERNAL_ERROR",
    status: 500,
    context: params.context,
    error: params.error,
  });
};
