/**
 * Cliente IA para Tu PAES IA — generación de preguntas con Claude.
 *
 * Arquitectura anti-alucinación (5 capas):
 *   1. Prompt blindado con instrucciones precisas y ejemplos.
 *   2. Retry automático (3 intentos) si la API falla.
 *   3. Validador estructural — descarta preguntas mal formadas.
 *   4. Verificador semántico con Sonnet — segunda opinión para descartar dudosas.
 *   5. Anti-duplicados — descarta preguntas demasiado similares en texto.
 *
 * Modelos:
 *   - claude-haiku-4-5 → generación (rápido, barato, ~$0.001/quiz)
 *   - claude-sonnet-4-5 → verificación (más preciso, ~$0.003/quiz)
 */

import type { Question, Subject, Level } from "@/data/types";

// =========================================================================
// Tipos públicos
// =========================================================================

export interface GenerateQuestionsParams {
  subject: Subject;
  level: Level;
  count: number;
  /** Preguntas previas vistas en esta sesión, para evitar repetir */
  seenQuestionTexts?: string[];
  /** Si true, hace doble verificación con Sonnet (más caro, más seguro) */
  verifyWithSonnet?: boolean;
}

export interface GenerateQuestionsResult {
  questions: Question[];
  model: string;
  /** Cuántas preguntas se descartaron por validación o duplicación */
  discarded: number;
}

export class AIError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "no_api_key"
      | "network"
      | "rate_limit"
      | "invalid_response"
      | "all_discarded"
      | "unknown",
    public readonly retriable: boolean = false
  ) {
    super(message);
    this.name = "AIError";
  }
}

// =========================================================================
// Configuración
// =========================================================================

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL_HAIKU = "claude-haiku-4-5";
const MODEL_SONNET = "claude-sonnet-4-5";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function getApiKey(): string {
  const key = import.meta.env.VITE_ANTHROPIC_KEY;
  if (!key) {
    throw new AIError(
      "Falta VITE_ANTHROPIC_KEY en las variables de entorno",
      "no_api_key"
    );
  }
  return key;
}

// =========================================================================
// Prompts
// =========================================================================

function getLevelDescription(level: Level): string {
  switch (level) {
    case 1: return "1° Medio (estudiantes de 14-15 años, contenido inicial)";
    case 2: return "2° Medio (estudiantes de 15-16 años, contenido intermedio)";
    case 3: return "3° Medio (estudiantes de 16-17 años, contenido avanzado)";
    case 4: return "4° Medio (preparación PAES real, máxima dificultad)";
  }
}

function getSubjectGuidance(subject: Subject, level: Level): string {
  if (subject === "matematicas") {
    const topics: Record<Level, string> = {
      1: "operaciones combinadas, fracciones, proporciones, ecuaciones lineales simples, porcentajes básicos, perímetros, áreas",
      2: "ecuaciones lineales y cuadráticas, productos notables, sistemas, porcentajes en contexto, geometría plana, interés simple",
      3: "funciones lineales y cuadráticas, sistemas de ecuaciones, probabilidad básica, logaritmos, estadística descriptiva",
      4: "problemas contextualizados (financieros, demográficos, científicos), interpretación de gráficas, funciones aplicadas, probabilidad condicional, estadística inferencial",
    };
    return `Tema: Competencia Matemática 1 (M1) de la PAES Chile.
Contenidos apropiados para ${getLevelDescription(level)}: ${topics[level]}.
- Las preguntas deben tener UNA respuesta numérica o algebraica inequívoca.
- Verifica matemáticamente cada respuesta antes de incluirla.
- Usa números realistas (precios en pesos chilenos cuando aplique).
- Incluye contexto de la vida real cuando sea posible.`;
  } else {
    const topics: Record<Level, string> = {
      1: "localizar información explícita en textos breves, vocabulario contextual, identificar idea principal, tipos básicos de texto",
      2: "inferencias simples, propósito del autor, conectores, figuras literarias básicas, tipos de texto",
      3: "evaluación de argumentos, intención del autor, tipos de texto complejos, conectores avanzados, falacias",
      4: "síntesis crítica, intención del autor con tono/ironía, evaluación de argumentos complejos, análisis de discurso (nivel PAES real)",
    };
    return `Tema: Competencia Lectora de la PAES Chile.
Contenidos apropiados para ${getLevelDescription(level)}: ${topics[level]}.
- Incluye textos breves embebidos (1-3 oraciones) cuando sea apropiado, así las preguntas son sobre comprensión de texto, NO gramática aislada.
- La respuesta correcta debe ser inequívoca, derivable del texto presentado.
- Evita preguntas opinables. La PAES evalúa comprensión, no opinión.`;
  }
}

function buildGenerationPrompt(params: GenerateQuestionsParams): string {
  const subjectGuide = getSubjectGuidance(params.subject, params.level);
  const avoidList = params.seenQuestionTexts && params.seenQuestionTexts.length > 0
    ? `\n\nIMPORTANTE: NO generes preguntas similares a estas (ya vistas):\n${params.seenQuestionTexts.slice(0, 10).map((t, i) => `${i + 1}. ${t.slice(0, 80)}`).join("\n")}\n`
    : "";

  return `Eres un experto en la PAES (Prueba de Acceso a la Educación Superior de Chile).

Genera EXACTAMENTE ${params.count} preguntas de selección múltiple, DISTINTAS entre sí en tema, contexto y dificultad.

${subjectGuide}${avoidList}

REGLAS ESTRICTAS:
1. Cada pregunta tiene EXACTAMENTE 4 alternativas (a, b, c, d).
2. SOLO UNA alternativa es correcta, sin ambigüedad.
3. Las 4 alternativas deben ser distintas entre sí (no duplicadas).
4. La explicación debe ser clara, en español de Chile, y mencionar por qué la correcta es correcta.
5. Si tienes CUALQUIER duda sobre si una pregunta es correcta, NO la incluyas.
6. Verifica matemáticamente cada operación antes de marcar la respuesta correcta.
7. Las preguntas deben variar en tema y dificultad dentro del nivel pedido.

DEVUELVE ÚNICAMENTE JSON VÁLIDO, sin texto adicional, sin markdown, sin \`\`\`json:

{
  "questions": [
    {
      "text": "enunciado de la pregunta",
      "options": ["opción a", "opción b", "opción c", "opción d"],
      "correctAnswer": 0,
      "explanation": "explicación breve y clara",
      "topic": "tema específico (ej. 'ecuaciones lineales', 'inferencia textual')"
    }
  ]
}

correctAnswer es el ÍNDICE (0, 1, 2 o 3) de la opción correcta.`;
}

function buildVerificationPrompt(questions: Question[], subject: Subject): string {
  const list = questions.map((q, i) => `
Pregunta ${i + 1}: ${q.text}
Opciones:
  0) ${q.options[0]}
  1) ${q.options[1]}
  2) ${q.options[2]}
  3) ${q.options[3]}
Respuesta marcada como correcta: ${q.correctAnswer}) ${q.options[q.correctAnswer]}
Explicación: ${q.explanation}
`).join("\n---\n");

  return `Eres un experto pedagógico revisando preguntas de la PAES ${subject === "matematicas" ? "Matemáticas (M1)" : "Competencia Lectora"} de Chile.

Para cada pregunta, evalúa si:
- La respuesta marcada como correcta ES realmente correcta (verifica matemáticamente si aplica)
- Las opciones no son ambiguas
- La explicación es coherente
- La pregunta es apropiada para el nivel PAES

${list}

DEVUELVE ÚNICAMENTE JSON VÁLIDO con esta estructura (un objeto por cada pregunta, en orden):

{
  "evaluations": [
    { "valid": true, "reason": "" },
    { "valid": false, "reason": "La respuesta correcta debería ser 2, no 1, porque..." }
  ]
}

valid debe ser true SOLO si la pregunta es totalmente correcta. Ante CUALQUIER duda, marca false.`;
}

// =========================================================================
// Llamada base a Anthropic
// =========================================================================

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

async function callAnthropic(
  model: string,
  messages: AnthropicMessage[],
  maxTokens: number = 4000
): Promise<string> {
  const apiKey = getApiKey();

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
          "content-type": "application/json",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages,
        }),
      });

      if (response.status === 429) {
        // Rate limit — esperar y reintentar
        await sleep(RETRY_DELAY_MS * attempt * 2);
        lastError = new AIError("Rate limit, reintentando...", "rate_limit", true);
        continue;
      }

      if (response.status === 401) {
        throw new AIError("API Key inválida o sin saldo", "no_api_key", false);
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        lastError = new AIError(`HTTP ${response.status}: ${text.slice(0, 200)}`, "network", true);
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      const data = await response.json();
      const textContent = data.content?.[0]?.text;
      if (typeof textContent !== "string") {
        throw new AIError("Respuesta sin contenido de texto", "invalid_response", false);
      }

      return textContent;
    } catch (err) {
      if (err instanceof AIError && !err.retriable) throw err;
      lastError = err as Error;
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError || new AIError("Falló después de varios reintentos", "unknown", false);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =========================================================================
// Parsing y validación
// =========================================================================

interface RawQuestion {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic?: string;
}

function parseJsonResponse(text: string): unknown {
  // Limpia posibles markdown fences
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // Intenta extraer el primer objeto JSON válido
  const match = cleaned.match(/\{[\s\S]*\}/);
  const jsonStr = match ? match[0] : cleaned;

  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new AIError(
      `JSON inválido en respuesta de IA: ${cleaned.slice(0, 100)}...`,
      "invalid_response",
      true
    );
  }
}

/**
 * Valida estructuralmente una pregunta.
 * Devuelve null si es válida, o un string con la razón del descarte.
 */
function validateQuestion(q: RawQuestion): string | null {
  if (!q || typeof q !== "object") return "no es objeto";
  if (typeof q.text !== "string" || q.text.trim().length < 10) return "texto demasiado corto";
  if (!Array.isArray(q.options) || q.options.length !== 4) return "no tiene exactamente 4 opciones";
  if (q.options.some((o) => typeof o !== "string" || o.trim().length === 0)) return "alguna opción está vacía";
  if (typeof q.correctAnswer !== "number" || q.correctAnswer < 0 || q.correctAnswer > 3) return "correctAnswer fuera de rango";
  if (!Number.isInteger(q.correctAnswer)) return "correctAnswer no es entero";
  if (typeof q.explanation !== "string" || q.explanation.trim().length < 15) return "explicación demasiado corta";

  // Opciones duplicadas
  const normalized = q.options.map((o) => o.trim().toLowerCase());
  if (new Set(normalized).size !== 4) return "tiene opciones duplicadas";

  return null;
}

/**
 * Detecta si dos preguntas son demasiado similares (anti-duplicados).
 * Compara texto normalizado por palabras significativas.
 */
function areSimilar(a: string, b: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^\wáéíóúñ\s]/g, " ").split(/\s+/).filter((w) => w.length > 3);

  const wordsA = new Set(normalize(a));
  const wordsB = new Set(normalize(b));
  if (wordsA.size === 0 || wordsB.size === 0) return false;

  let common = 0;
  wordsA.forEach((w) => { if (wordsB.has(w)) common++; });

  const similarity = common / Math.min(wordsA.size, wordsB.size);
  return similarity > 0.7; // 70% de palabras en común → considerar duplicada
}

// =========================================================================
// API pública
// =========================================================================

/**
 * Genera preguntas con Claude.
 *
 * Flujo:
 *   1. Pide a Haiku que genere `count` preguntas (con buffer extra para descartes).
 *   2. Valida estructuralmente cada una.
 *   3. Elimina duplicados internos y contra `seenQuestionTexts`.
 *   4. Si `verifyWithSonnet`, usa Sonnet para una segunda revisión.
 *   5. Devuelve hasta `count` preguntas válidas.
 *
 * Si después de validar no hay suficientes, lanza AIError con código "all_discarded"
 * o devuelve las que sí pasaron (decisión del llamador).
 */
export async function generateQuestions(
  params: GenerateQuestionsParams
): Promise<GenerateQuestionsResult> {
  // Pedimos 50% más para tener buffer de descartes
  const requestCount = Math.min(params.count + Math.ceil(params.count * 0.5), 30);
  const prompt = buildGenerationPrompt({ ...params, count: requestCount });

  const responseText = await callAnthropic(
    MODEL_HAIKU,
    [{ role: "user", content: prompt }],
    Math.min(800 * requestCount, 8000)
  );

  const parsed = parseJsonResponse(responseText) as { questions?: RawQuestion[] };
  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new AIError("Respuesta sin campo 'questions'", "invalid_response", true);
  }

  let discarded = 0;
  const validQuestions: Question[] = [];
  const seenInThisBatch: string[] = [];

  for (const raw of parsed.questions) {
    const validationError = validateQuestion(raw);
    if (validationError) {
      discarded++;
      continue;
    }

    // Anti-duplicados contra historial
    const allSeen = [...(params.seenQuestionTexts || []), ...seenInThisBatch];
    if (allSeen.some((seen) => areSimilar(seen, raw.text))) {
      discarded++;
      continue;
    }

    seenInThisBatch.push(raw.text);
    validQuestions.push({
      id: `ai_${Date.now()}_${validQuestions.length}_${Math.random().toString(36).slice(2, 7)}`,
      subject: params.subject,
      level: params.level,
      text: raw.text.trim(),
      options: raw.options.map((o) => o.trim()),
      correctAnswer: raw.correctAnswer,
      explanation: raw.explanation.trim(),
      source: "ai",
      topic: raw.topic?.trim(),
    });

    if (validQuestions.length >= params.count) break;
  }

  // Verificación opcional con Sonnet (segunda capa de calidad)
  if (params.verifyWithSonnet && validQuestions.length > 0) {
    try {
      const verifyPrompt = buildVerificationPrompt(validQuestions, params.subject);
      const verifyText = await callAnthropic(
        MODEL_SONNET,
        [{ role: "user", content: verifyPrompt }],
        Math.min(300 * validQuestions.length, 4000)
      );
      const verifyParsed = parseJsonResponse(verifyText) as {
        evaluations?: { valid: boolean; reason: string }[];
      };

      if (verifyParsed.evaluations && Array.isArray(verifyParsed.evaluations)) {
        const filtered: Question[] = [];
        for (let i = 0; i < validQuestions.length; i++) {
          const eval_ = verifyParsed.evaluations[i];
          if (eval_ && eval_.valid !== false) {
            filtered.push(validQuestions[i]);
          } else {
            discarded++;
          }
        }
        return {
          questions: filtered.slice(0, params.count),
          model: `${MODEL_HAIKU} + ${MODEL_SONNET} (verificado)`,
          discarded,
        };
      }
    } catch (verifyErr) {
      // Si la verificación falla, mejor devolver las validadas estructuralmente
      // que perder todo el trabajo.
      console.warn("Verificación con Sonnet falló, usando validación estructural:", verifyErr);
    }
  }

  if (validQuestions.length === 0) {
    throw new AIError(
      "Todas las preguntas generadas fueron descartadas por validación",
      "all_discarded",
      true
    );
  }

  return {
    questions: validQuestions.slice(0, params.count),
    model: MODEL_HAIKU,
    discarded,
  };
}

/**
 * Reporta una pregunta como problemática (para análisis posterior).
 * Por ahora solo se guarda en localStorage; en Fase 3 se enviará al backend.
 */
export function reportBadQuestion(question: Question, reason?: string): void {
  try {
    const key = "tu_paes_ia_reported_questions";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push({
      ...question,
      reportedAt: new Date().toISOString(),
      reason: reason || "no especificado",
    });
    // Limitar a últimas 100 reportadas para no saturar
    localStorage.setItem(key, JSON.stringify(existing.slice(-100)));
  } catch {
    // Falla silenciosa, no es crítico
  }
}
