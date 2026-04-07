import { connectBD } from "@/lib/db";
import { AppError, handleApiError } from "@/lib/api-error";
import { requireAPISession } from "@/lib/server-auth";
import { Question, Year } from "@/models/QuestionModel";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_UPLOAD_FILES = 8;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
]);
const ALLOWED_QUESTION_TYPES = new Set(["MCQ", "MSQ", "NAT"]);

type GeminiPart = {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
};
type GeminiCandidate = { content?: { parts?: GeminiPart[] } };
type GeminiResponse = {
  candidates?: GeminiCandidate[];
  error?: { message?: string };
};

type UploadedFilePayload = {
  fileName: string;
  mimeType: string;
  base64Data: string;
  size: number;
};

type RawQuestion = {
  QuesNo?: unknown;
  Ques?: unknown;
  Quetype?: unknown;
  options?: unknown;
  subject?: unknown;
  ans?: unknown;
  basedonImage?: unknown;
  ImageUrl?: unknown;
  pos?: unknown;
  neg?: unknown;
};

type NormalizedQuestion = {
  QuesNo: number;
  Ques: string;
  Quetype: "MCQ" | "MSQ" | "NAT";
  options: Record<string, string>;
  subject: string;
  ans: string | string[] | number;
  basedonImage: boolean;
  ImageUrl: string;
  year: number;
  set: number;
  branch: string;
  pos: number;
  neg: number;
};

const toNumberOrNull = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const normalizeBranch = (value: string) => value.trim().toLowerCase();

const normalizeQuestionType = (
  rawType: unknown,
  normalizedOptions: Record<string, string>,
  rawAnswer: unknown,
): "MCQ" | "MSQ" | "NAT" => {
  const candidateType =
    typeof rawType === "string" ? rawType.trim().toUpperCase() : "";
  if (ALLOWED_QUESTION_TYPES.has(candidateType)) {
    return candidateType as "MCQ" | "MSQ" | "NAT";
  }

  if (Array.isArray(rawAnswer)) return "MSQ";
  if (Object.keys(normalizedOptions).length === 0) return "NAT";
  return "MCQ";
};

const normalizeOptions = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const optionsRecord = value as Record<string, unknown>;
  const normalized: Record<string, string> = {};
  Object.entries(optionsRecord).forEach(([key, optionValue]) => {
    const normalizedKey = String(key).trim().toUpperCase();
    const normalizedValue = String(optionValue ?? "").trim();
    if (!normalizedKey || !normalizedValue) return;
    normalized[normalizedKey] = normalizedValue;
  });
  return normalized;
};

const normalizeMsqAnswer = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) =>
          String(item ?? "")
            .trim()
            .toUpperCase(),
        )
        .filter((item) => item.length > 0),
    ),
  ).sort();
};

const normalizeAnswer = (
  questionType: "MCQ" | "MSQ" | "NAT",
  value: unknown,
): string | string[] | number => {
  if (questionType === "MSQ") {
    return normalizeMsqAnswer(value);
  }

  if (questionType === "NAT") {
    const numberValue = toNumberOrNull(value);
    if (numberValue !== null) return numberValue;
    return String(value ?? "").trim();
  }

  return String(value ?? "")
    .trim()
    .toUpperCase();
};

const stripCodeFence = (value: string) => {
  const codeFenceMatch = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeFenceMatch?.[1]) return codeFenceMatch[1].trim();
  return value.trim();
};

const parseGeminiJson = (text: string): unknown => {
  const candidates = [stripCodeFence(text), text];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // Keep trying with fallback candidates.
    }

    const startIndex = candidate.indexOf("{");
    const endIndex = candidate.lastIndexOf("}");
    if (startIndex >= 0 && endIndex > startIndex) {
      const slice = candidate.slice(startIndex, endIndex + 1);
      try {
        return JSON.parse(slice);
      } catch {
        // Continue and throw below if nothing works.
      }
    }
  }

  throw new AppError({
    message: "Unable to parse paper parsing response.",
    status: 422,
    code: "EXTERNAL_SERVICE_ERROR",
    details: "Gemini output was not valid JSON.",
  });
};

const getRawQuestions = (parsed: unknown): RawQuestion[] => {
  if (Array.isArray(parsed)) return parsed as RawQuestion[];

  if (parsed && typeof parsed === "object") {
    const parsedObject = parsed as { questions?: unknown };
    if (Array.isArray(parsedObject.questions)) {
      return parsedObject.questions as RawQuestion[];
    }
  }

  return [];
};

const normalizeQuestions = (
  rawQuestions: RawQuestion[],
  year: number,
  set: number,
  branch: string,
): NormalizedQuestion[] => {
  const normalizedQuestions = rawQuestions
    .map((rawQuestion, index) => {
      const questionText = String(rawQuestion.Ques ?? "").trim();
      if (!questionText) return null;

      const options = normalizeOptions(rawQuestion.options);
      const questionType = normalizeQuestionType(
        rawQuestion.Quetype,
        options,
        rawQuestion.ans,
      );
      const answer = normalizeAnswer(questionType, rawQuestion.ans);
      const parsedQuestionNo = toNumberOrNull(rawQuestion.QuesNo);
      const positiveMarks = toNumberOrNull(rawQuestion.pos) ?? 1;
      const negativeMarks = Math.max(toNumberOrNull(rawQuestion.neg) ?? 0, 0);

      return {
        QuesNo:
          parsedQuestionNo !== null && parsedQuestionNo > 0
            ? Math.floor(parsedQuestionNo)
            : index + 1,
        Ques: questionText,
        Quetype: questionType,
        options: questionType === "NAT" ? {} : options,
        subject: String(rawQuestion.subject ?? "General").trim() || "General",
        ans: answer,
        basedonImage: Boolean(rawQuestion.basedonImage),
        ImageUrl:
          typeof rawQuestion.ImageUrl === "string"
            ? rawQuestion.ImageUrl.trim()
            : "",
        year,
        set,
        branch,
        pos: Number(positiveMarks.toFixed(2)),
        neg: Number(negativeMarks.toFixed(2)),
      } satisfies NormalizedQuestion;
    })
    .filter((question): question is NormalizedQuestion => question !== null)
    .sort((left, right) => left.QuesNo - right.QuesNo)
    .map((question, index) => ({ ...question, QuesNo: index + 1 }));

  return normalizedQuestions;
};

const buildGeminiPrompt = (
  year: number,
  set: number,
  branch: string,
  fileCount: number,
) => `
Extract all questions by combining all uploaded files and return strictly valid JSON.
Some files may contain only questions and some may contain only answers. Merge them using question number and context.

Context:
- Year: ${year}
- Set: ${set}
- Branch: ${branch}
- Number of files: ${fileCount}

Required output format:
{
  "questions": [
    {
      "QuesNo": 1,
      "Ques": "question text",
      "Quetype": "MCQ | MSQ | NAT",
      "options": { "A": "option text", "B": "option text", "C": "option text", "D": "option text" },
      "subject": "subject name",
      "ans": "A for MCQ, [\\"A\\",\\"C\\"] for MSQ, numeric or string for NAT",
      "basedonImage": false,
      "ImageUrl": "",
      "pos": 1,
      "neg": 0.33
    }
  ]
}

Rules:
- Return JSON only. Do not include markdown or commentary.
- Keep the order of questions exactly as in the file.
- For NAT, keep "options" as an empty object.
- If marks are missing, use pos=1 and neg=0.
- If answers are in separate files, resolve and attach them to matching QuesNo.
`;

const extractQuestionsFromGemini = async (params: {
  files: UploadedFilePayload[];
  year: number;
  set: number;
  branch: string;
}) => {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new AppError({
      message: "Paper parsing service is not configured.",
      status: 500,
      code: "EXTERNAL_SERVICE_ERROR",
      details: "Missing GEMINI_API_KEY in environment.",
    });
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const endpoint = `${GEMINI_API_URL}/models/${model}:generateContent?key=${geminiApiKey}`;
  const prompt = buildGeminiPrompt(
    params.year,
    params.set,
    params.branch,
    params.files.length,
  );

  const parts: GeminiPart[] = [{ text: prompt }];
  params.files.forEach((file, index) => {
    parts.push({
      text: `File ${index + 1}: ${file.fileName} (${file.mimeType}, ${file.size} bytes)`,
    });
    parts.push({
      inline_data: {
        mime_type: file.mimeType,
        data: file.base64Data,
      },
    });
  });

  const geminiResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts,
        },
      ],
      generationConfig: {
        temperature: 0.1,
      },
    }),
  });

  const geminiResult = (await geminiResponse.json()) as GeminiResponse;
  if (!geminiResponse.ok) {
    const message =
      geminiResult?.error?.message ??
      `Gemini request failed with status ${geminiResponse.status}`;
    throw new AppError({
      message: "Paper parsing service failed to process uploaded files.",
      status: 502,
      code: "EXTERNAL_SERVICE_ERROR",
      details: message,
    });
  }

  const textOutput =
    geminiResult.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("\n")
      .trim() ?? "";

  if (!textOutput) {
    throw new AppError({
      message: "Paper parsing service returned empty content.",
      status: 502,
      code: "EXTERNAL_SERVICE_ERROR",
    });
  }

  const parsed = parseGeminiJson(textOutput);
  const rawQuestions = getRawQuestions(parsed);

  return rawQuestions;
};

export async function POST(req: NextRequest) {
  try {
    const sessionOrResponse = await requireAPISession({ roles: ["admin"] });
    if (sessionOrResponse instanceof NextResponse) {
      return sessionOrResponse;
    }

    const formData = await req.formData();
    const rawFiles = formData.getAll("files");
    const year = Number(formData.get("year"));
    const set = Number(formData.get("set"));
    const branch = normalizeBranch(String(formData.get("branch") ?? ""));
    const replaceExisting =
      String(formData.get("replaceExisting") ?? "true") === "true";

    let files = rawFiles.filter(
      (value): value is File => value instanceof File,
    );
    if (files.length === 0) {
      const legacyFile = formData.get("file");
      if (legacyFile instanceof File) {
        files = [legacyFile];
      }
    }

    if (files.length < 2) {
      throw new AppError({
        message:
          "Please upload at least 2 files (for example: one questions file and one answers file).",
        status: 400,
        code: "VALIDATION_ERROR",
      });
    }

    if (files.length > MAX_UPLOAD_FILES) {
      throw new AppError({
        message: `Too many files. Maximum allowed is ${MAX_UPLOAD_FILES}.`,
        status: 400,
        code: "VALIDATION_ERROR",
      });
    }

    if (!year || !set || !branch) {
      throw new AppError({
        message: "Year, set, and branch are required.",
        status: 400,
        code: "VALIDATION_ERROR",
      });
    }

    const totalUploadSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalUploadSize > MAX_TOTAL_UPLOAD_SIZE_BYTES) {
      throw new AppError({
        message: "Combined file size is too large. Maximum allowed is 25MB.",
        status: 400,
        code: "VALIDATION_ERROR",
      });
    }

    const uploadedFilePayloads = await Promise.all(
      files.map(async (file) => {
        if (file.size > MAX_UPLOAD_SIZE_BYTES) {
          throw new AppError({
            message: `File "${file.name}" is too large.`,
            status: 400,
            code: "VALIDATION_ERROR",
            details: "Max allowed per file is 10MB.",
          });
        }

        const mimeType = file.type || "application/pdf";
        if (!ALLOWED_MIME_TYPES.has(mimeType)) {
          throw new AppError({
            message: `Unsupported file type for "${file.name}".`,
            status: 400,
            code: "VALIDATION_ERROR",
            details: "Allowed file types: PDF, TXT, Markdown.",
          });
        }

        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        return {
          fileName: file.name,
          mimeType,
          base64Data,
          size: file.size,
        } satisfies UploadedFilePayload;
      }),
    );

    const rawQuestions = await extractQuestionsFromGemini({
      files: uploadedFilePayloads,
      year,
      set,
      branch,
    });

    const normalizedQuestions = normalizeQuestions(
      rawQuestions,
      year,
      set,
      branch,
    );
    if (normalizedQuestions.length === 0) {
      throw new AppError({
        message: "No valid questions were extracted from uploaded files.",
        status: 422,
        code: "VALIDATION_ERROR",
      });
    }

    await connectBD();

    let removedCount = 0;
    if (replaceExisting) {
      const deleteResult = await Question.deleteMany({ year, set, branch });
      removedCount = deleteResult.deletedCount ?? 0;
    }

    const insertedDocuments = await Question.insertMany(normalizedQuestions, {
      ordered: true,
    });

    await Year.updateOne(
      { year, set, branch },
      { $set: { year, set, branch } },
      { upsert: true },
    );

    return NextResponse.json(
      {
        message: "Paper files uploaded and processed successfully.",
        paper: { year, set, branch },
        fileCount: uploadedFilePayloads.length,
        insertedCount: insertedDocuments.length,
        removedCount,
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError({
      context: "api.admin.paper.POST",
      error,
    });
  }
}
