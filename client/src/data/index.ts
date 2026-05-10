import type { Question, Subject, Level } from "./types";
import { LENGUAJE_QUESTIONS } from "./lenguaje";
import { MATEMATICAS_QUESTIONS } from "./matematicas";

/**
 * Banco completo de preguntas, agregando todas las materias.
 * Cuando agreguemos preguntas generadas por IA, se concatenan aquí también.
 */
export const QUESTION_BANK: Question[] = [
  ...LENGUAJE_QUESTIONS,
  ...MATEMATICAS_QUESTIONS,
];

/**
 * Devuelve todas las preguntas disponibles para una materia y nivel.
 */
export function getQuestions(subject: Subject, level: Level): Question[] {
  return QUESTION_BANK.filter((q) => q.subject === subject && q.level === level);
}

/**
 * Mezcla un arreglo de forma aleatoria (Fisher-Yates).
 * Inmutable: devuelve un arreglo nuevo.
 */
export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Selecciona N preguntas para un quiz, mezcladas, sin repetir si hay suficientes.
 * Si se piden más preguntas de las disponibles, devuelve TODAS las disponibles
 * mezcladas (no rellena con repeticiones, lo cual era el bug de la versión anterior).
 *
 * El llamador debe usar `quiz.totalQuestions` (longitud real) y no la cantidad pedida.
 */
export function pickQuestions(
  subject: Subject,
  level: Level,
  requested: number
): Question[] {
  const pool = getQuestions(subject, level);
  const shuffled = shuffle(pool);
  return shuffled.slice(0, Math.min(requested, shuffled.length));
}

export type { Question, Subject, Level };
