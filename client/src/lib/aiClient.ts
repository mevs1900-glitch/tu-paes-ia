/**
 * Cliente de IA para generación de preguntas y explicaciones.
 *
 * ====================================================================
 * ESTADO: STUB / PENDIENTE DE FASE 2
 * ====================================================================
 *
 * Este archivo está listo para conectar la API de Anthropic (Claude) en Fase 2.
 * Por ahora exporta funciones que devuelven un error controlado, pero define
 * los tipos y la estructura de la llamada para que el resto de la app pueda
 * importarlo sin romper.
 *
 * Para activarlo en Fase 2:
 *   1. Crea un archivo .env en la raíz del proyecto:
 *      VITE_ANTHROPIC_KEY=sk-ant-tu-api-key
 *   2. Descomenta la implementación real en `generateQuestions` más abajo.
 *   3. (Recomendado) Mueve la llamada al backend (server/) para no exponer la
 *      API key en el cliente. Ver server/index.ts.
 *
 * Costos estimados (referencia EduQuiz IA):
 *   - Claude Haiku 4.5: ~$0.001 por quiz de 10 preguntas
 *   - Claude Sonnet 4: ~$0.003 por evaluación de respuesta abierta
 */

import type { Question, Subject, Level } from "@/data/types";

export interface GenerateQuestionsParams {
  subject: Subject;
  level: Level;
  count: number;
  /** Opcional: tema específico (ej. "comprension lectora", "algebra") */
  topic?: string;
}

export interface GenerateQuestionsResult {
  questions: Question[];
  /** Modelo usado (claude-haiku-4-5, etc.) */
  model: string;
}

export class AIError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "no_api_key"
      | "network"
      | "rate_limit"
      | "invalid_response"
      | "unknown"
  ) {
    super(message);
    this.name = "AIError";
  }
}

/**
 * Genera preguntas usando IA (Claude Haiku, por economía).
 *
 * STUB: en Fase 2, conectar con la API real.
 */
export async function generateQuestions(
  _params: GenerateQuestionsParams
): Promise<GenerateQuestionsResult> {
  throw new AIError(
    "La generación con IA aún no está activada. Se conectará en Fase 2.",
    "no_api_key"
  );

  /* ------------------------------------------------------------------
   * IMPLEMENTACIÓN REAL DE FASE 2 (descomentar cuando haya API key):
   * ------------------------------------------------------------------
   *
   * const apiKey = import.meta.env.VITE_ANTHROPIC_KEY;
   * if (!apiKey) {
   *   throw new AIError("Falta VITE_ANTHROPIC_KEY", "no_api_key");
   * }
   *
   * const subjectLabel = params.subject === "lenguaje" ? "Competencia Lectora" : "Competencia Matemática 1";
   * const prompt = `Genera ${params.count} preguntas de ${subjectLabel} nivel PAES (Chile)
   *   para ${params.level}° medio${params.topic ? `, tema: ${params.topic}` : ""}.
   *   Devuelve SOLO JSON válido con esta estructura:
   *   { "questions": [{ "text": "...", "options": ["a","b","c","d"], "correctAnswer": 0, "explanation": "..." }] }
   *   - 4 opciones por pregunta
   *   - explicación breve y clara
   *   - dificultad apropiada para ${params.level}° medio
   *   - en español de Chile`;
   *
   * const response = await fetch("https://api.anthropic.com/v1/messages", {
   *   method: "POST",
   *   headers: {
   *     "x-api-key": apiKey,
   *     "anthropic-version": "2023-06-01",
   *     "content-type": "application/json",
   *     "anthropic-dangerous-direct-browser-access": "true",
   *   },
   *   body: JSON.stringify({
   *     model: "claude-haiku-4-5",
   *     max_tokens: 4000,
   *     messages: [{ role: "user", content: prompt }],
   *   }),
   * });
   *
   * if (!response.ok) {
   *   if (response.status === 429) throw new AIError("Rate limit", "rate_limit");
   *   throw new AIError(`HTTP ${response.status}`, "network");
   * }
   *
   * const data = await response.json();
   * const text = data.content?.[0]?.text ?? "";
   * const json = JSON.parse(text.replace(/```json|```/g, "").trim());
   *
   * const questions: Question[] = json.questions.map((q: any, i: number) => ({
   *   id: `ai_${Date.now()}_${i}`,
   *   subject: params.subject,
   *   level: params.level,
   *   text: q.text,
   *   options: q.options,
   *   correctAnswer: q.correctAnswer,
   *   explanation: q.explanation,
   *   source: "ai" as const,
   *   topic: params.topic,
   * }));
   *
   * return { questions, model: "claude-haiku-4-5" };
   * ------------------------------------------------------------------
   */
}

/**
 * Evalúa una respuesta abierta del estudiante (no usado todavía, pero queda
 * preparado por si en Fase 3 se agregan preguntas de desarrollo).
 *
 * STUB: en Fase 2 o 3, conectar con Claude Sonnet.
 */
export async function evaluateOpenAnswer(_params: {
  question: string;
  studentAnswer: string;
  expectedTopics: string[];
}): Promise<{ score: 0 | 1 | 2 | 3 | 4 | 5; feedback: string }> {
  throw new AIError(
    "La evaluación con IA aún no está activada. Se conectará en Fase 2/3.",
    "no_api_key"
  );
}
