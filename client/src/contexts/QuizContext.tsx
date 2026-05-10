import React, { createContext, useContext, useState } from "react";
import { pickQuestions, type Question, type Subject, type Level } from "@/data";

export type { Question };

export interface QuizState {
  subject: Subject;
  level: Level;
  /** Cantidad solicitada por el usuario (puede ser mayor a la disponible). */
  requestedQuestions: number;
  currentQuestionIndex: number;
  score: number;
  totalQuestions: number;
  answers: (number | null)[];
  isFinished: boolean;
  /** Racha actual de respuestas correctas consecutivas. */
  currentStreak: number;
  /** Mejor racha alcanzada en este quiz. */
  bestStreak: number;
}

interface QuizContextType {
  quizState: QuizState | null;
  questions: Question[];
  /** Devuelve la cantidad real disponible vs la solicitada (para avisar al usuario). */
  startQuiz: (
    subject: Subject,
    level: Level,
    requestedQuestions: number
  ) => { delivered: number; requested: number };
  answerQuestion: (answerIndex: number) => void;
  nextQuestion: () => void;
  finishQuiz: () => void;
  resetQuiz: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  const startQuiz = (
    subject: Subject,
    level: Level,
    requestedQuestions: number
  ) => {
    // pickQuestions hace shuffle y limita al disponible (no rellena con repetidas).
    const selected = pickQuestions(subject, level, requestedQuestions);

    setQuestions(selected);
    setQuizState({
      subject,
      level,
      requestedQuestions,
      currentQuestionIndex: 0,
      score: 0,
      totalQuestions: selected.length,
      answers: new Array(selected.length).fill(null),
      isFinished: false,
      currentStreak: 0,
      bestStreak: 0,
    });

    return { delivered: selected.length, requested: requestedQuestions };
  };

  const answerQuestion = (answerIndex: number) => {
    if (!quizState) return;

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
    setQuizState({
      ...quizState,
      isFinished: true,
    });
  };

  const resetQuiz = () => {
    setQuizState(null);
    setQuestions([]);
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
