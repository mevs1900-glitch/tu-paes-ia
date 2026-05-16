import React, { createContext, useContext, useState } from "react";
import { pickQuestions, type Question, type Subject, type Level } from "@/data";
import {
  generateQuestions,
  reportBadQuestion as reportBad,
  AIError,
} from "@/lib/aiClient";

export type { Question };

const SEEN_QUESTIONS_KEY = "tu_paes_ia_seen_questions";
const MAX_SEEN_HISTORY = 50;

export type QuizPhase =
  | "idle"
  | "loading"   // Generando con IA
  | "ready"    // Preguntas listas
  | "playing"
  | "finished"
  | "error";   // Algo falló al generar

export interface QuizState {
  subject: Subject;
  level: Level;
  requestedQuestions: number;
  currentQuestionIndex: number;
  score: number;
  totalQuestions: number;
  answers: (number | null)[];
  phase: QuizPhase;
  /** Cómo se generaron las preguntas */
  source: "ai" | "manual" | "mixed";
  /** Modelo IA usado (si aplica) */
  aiModel?: string;
  /** Mensaje de error si phase === 'error' */
  errorMessage?: string;
  /** Racha actual de respuestas correctas consecutivas */
  currentStreak: number;
  bestStreak: number;
}

interface QuizContextType {
  quizState: QuizState | null;
  questions: Question[];
  /**
   * Inicia un quiz nuevo: intenta generar con IA, si falla cae al banco manual.
   * Retorna el resultado del intento.
   */
  startQuiz: (
    subject: Subject,
    level: Level,
    requestedQuestions: number
  ) => Promise<{ delivered: number; source: "ai" | "manual" | "mixed" }>;
  answerQuestion: (answerIndex: number) => void;
  nextQuestion: () => void;
  finishQuiz: () => void;
  resetQuiz: () => void;
  /** Reporta la pregunta actual como problemática */
  reportCurrentQuestion: (reason?: string) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

// =========================================================================
// Historial local de preguntas vistas (para anti-duplicados entre quizzes)
// =========================================================================

function loadSeenQuestions(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_QUESTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSeenQuestions(texts: string[]): void {
  try {
    // Mantener solo las últimas N
    const limited = texts.slice(-MAX_SEEN_HISTORY);
    localStorage.setItem(SEEN_QUESTIONS_KEY, JSON.stringify(limited));
  } catch {
    // Falla silenciosa
  }
}

// =========================================================================
// Provider
// =========================================================================

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  const startQuiz = async (
    subject: Subject,
    level: Level,
    requestedQuestions: number
  ): Promise<{ delivered: number; source: "ai" | "manual" | "mixed" }> => {
    // Estado inicial de loading
    setQuizState({
      subject,
      level,
      requestedQuestions,
      currentQuestionIndex: 0,
      score: 0,
      totalQuestions: 0,
      answers: [],
      phase: "loading",
      source: "ai",
      currentStreak: 0,
      bestStreak: 0,
    });
    setQuestions([]);

    const seenHistory = loadSeenQuestions();

    // ====== Intentar generar con IA ======
    try {
      const result = await generateQuestions({
        subject,
        level,
        count: requestedQuestions,
        seenQuestionTexts: seenHistory,
        verifyWithSonnet: requestedQuestions <= 10, // Solo verificamos quizzes chicos (más caro)
      });

      let finalQuestions = result.questions;
      let source: "ai" | "mixed" = "ai";

      // Si la IA devolvió MENOS de lo pedido, rellenamos con manuales
      if (finalQuestions.length < requestedQuestions) {
        const manualFill = pickQuestions(
          subject,
          level,
          requestedQuestions - finalQuestions.length
        );
        finalQuestions = [...finalQuestions, ...manualFill];
        source = "mixed";
      }

      // Guarda los textos en el historial
      const newSeen = [...seenHistory, ...finalQuestions.map((q) => q.text)];
      saveSeenQuestions(newSeen);

      setQuestions(finalQuestions);
      setQuizState({
        subject,
        level,
        requestedQuestions,
        currentQuestionIndex: 0,
        score: 0,
        totalQuestions: finalQuestions.length,
        answers: new Array(finalQuestions.length).fill(null),
        phase: "playing",
        source,
        aiModel: result.model,
        currentStreak: 0,
        bestStreak: 0,
      });

      return { delivered: finalQuestions.length, source };
    } catch (err) {
      // ====== Fallback al banco manual ======
      const aiError = err instanceof AIError ? err : null;
      const errMessage = aiError?.message || "Error desconocido generando preguntas";

      const manualQuestions = pickQuestions(subject, level, requestedQuestions);

      if (manualQuestions.length === 0) {
        // No hay ni IA ni banco — error real
        setQuizState({
          subject,
          level,
          requestedQuestions,
          currentQuestionIndex: 0,
          score: 0,
          totalQuestions: 0,
          answers: [],
          phase: "error",
          source: "manual",
          errorMessage: errMessage,
          currentStreak: 0,
          bestStreak: 0,
        });
        return { delivered: 0, source: "manual" };
      }

      // Cae al banco manual con aviso
      setQuestions(manualQuestions);
      setQuizState({
        subject,
        level,
        requestedQuestions,
        currentQuestionIndex: 0,
        score: 0,
        totalQuestions: manualQuestions.length,
        answers: new Array(manualQuestions.length).fill(null),
        phase: "playing",
        source: "manual",
        errorMessage: `IA no disponible, usando banco de respaldo (${aiError?.code || "error"})`,
        currentStreak: 0,
        bestStreak: 0,
      });

      return { delivered: manualQuestions.length, source: "manual" };
    }
  };

  const answerQuestion = (answerIndex: number) => {
    if (!quizState || quizState.phase !== "playing") return;

    const newAnswers = [...quizState.answers];
    newAnswers[quizState.currentQuestionIndex] = answerIndex;

    const isCorrect =
      answerIndex === questions[quizState.currentQuestionIndex].correctAnswer;
    const newScore = isCorrect ? quizState.score + 1 : quizState.score;
    const newCurrentStreak = isCorrect ? quizState.currentStreak + 1 : 0;
    const newBestStreak = Math.max(quizState.bestStreak, newCurrentStreak);

    setQuizState({
      ...quizState,
      answers: newAnswers,
      score: newScore,
      currentStreak: newCurrentStreak,
      bestStreak: newBestStreak,
    });
  };

  const nextQuestion = () => {
    if (!quizState) return;
    if (quizState.currentQuestionIndex < quizState.totalQuestions - 1) {
      setQuizState({
        ...quizState,
        currentQuestionIndex: quizState.currentQuestionIndex + 1,
      });
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    if (!quizState) return;
    setQuizState({ ...quizState, phase: "finished" });
  };

  const resetQuiz = () => {
    setQuizState(null);
    setQuestions([]);
  };

  const reportCurrentQuestion = (reason?: string) => {
    if (!quizState || !questions[quizState.currentQuestionIndex]) return;
    reportBad(questions[quizState.currentQuestionIndex], reason);
  };

  return (
    <QuizContext.Provider
      value={{
        quizState,
        questions,
        startQuiz,
        answerQuestion,
        nextQuestion,
        finishQuiz,
        resetQuiz,
        reportCurrentQuestion,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error("useQuiz debe ser usado dentro de QuizProvider");
  }
  return context;
}
