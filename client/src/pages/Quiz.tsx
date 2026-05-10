import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, CheckCircle, XCircle, Flame } from "lucide-react";
import { useQuiz } from "@/contexts/QuizContext";
import {
  getMotivationalMessage,
  getResultMessage,
} from "@/lib/motivationalMessages";

// =========================================================================
// Pantalla de resultados
// =========================================================================

function Results() {
  const [, setLocation] = useLocation();
  const { quizState, questions, resetQuiz } = useQuiz();

  if (!quizState) return null;

  const percentage = Math.round(
    (quizState.score / quizState.totalQuestions) * 100
  );
  const resultMessage = getResultMessage(percentage);

  const handleRestart = () => {
    resetQuiz();
    setLocation("/home");
  };

  const handleRetry = () => {
    // Reinicia el quiz con la misma materia, nivel y cantidad solicitada
    resetQuiz();
    setLocation(`/config/${quizState.subject}/${quizState.level}`);
  };

  return (
    <div className="w-full h-full bg-background flex flex-col px-4 sm:px-6 py-6 overflow-y-auto">
      <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-6">
        {/* Hero del resultado */}
        <div className="text-center space-y-4 pt-4">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-500">
            <span
              className="text-4xl font-bold text-primary"
              style={{ fontFamily: "Poppins" }}
            >
              {percentage}%
            </span>
          </div>

          <h1
            className="text-2xl sm:text-3xl font-bold text-foreground"
            style={{ fontFamily: "Poppins" }}
          >
            {resultMessage}
          </h1>

          <p className="text-base text-muted-foreground">
            Respondiste correctamente {quizState.score} de{" "}
            {quizState.totalQuestions} preguntas
          </p>
        </div>

        {/* Resumen */}
        <div className="w-full bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Correctas</span>
            <span className="font-bold text-secondary text-lg">
              {quizState.score}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Incorrectas</span>
            <span className="font-bold text-destructive text-lg">
              {quizState.totalQuestions - quizState.score}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              Mejor racha
            </span>
            <span className="font-bold text-orange-400 text-lg">
              {quizState.bestStreak}
            </span>
          </div>
        </div>

        {/* Repaso por pregunta */}
        <div className="w-full space-y-3">
          <h3
            className="text-sm font-bold text-muted-foreground uppercase tracking-wider"
            style={{ fontFamily: "Poppins" }}
          >
            Repaso
          </h3>
          {questions.map((q, idx) => {
            const userAnswer = quizState.answers[idx];
            const isCorrect = userAnswer === q.correctAnswer;
            return (
              <div
                key={q.id}
                className={`bg-card rounded-2xl border p-4 space-y-2 ${
                  isCorrect ? "border-secondary/30" : "border-destructive/30"
                }`}
              >
                <div className="flex items-start gap-2">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1.5">
                    <p className="text-sm font-semibold text-foreground">
                      {idx + 1}. {q.text}
                    </p>
                    {!isCorrect && userAnswer !== null && (
                      <p className="text-xs text-destructive/90">
                        Tu respuesta: {q.options[userAnswer]}
                      </p>
                    )}
                    <p className="text-xs text-secondary">
                      Correcta: {q.options[q.correctAnswer]}
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Acciones */}
        <div className="w-full grid grid-cols-2 gap-3 pt-2 pb-4">
          <button
            onClick={handleRetry}
            className="h-12 bg-card border-2 border-primary text-primary hover:bg-primary/10 font-bold rounded-2xl transition-all duration-200"
            style={{ fontFamily: "Poppins" }}
          >
            Reintentar
          </button>
          <button
            onClick={handleRestart}
            className="h-12 bg-primary hover:bg-primary/90 text-background font-bold rounded-2xl transition-all duration-200"
            style={{ fontFamily: "Poppins" }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// Pantalla principal del quiz
// =========================================================================

export default function Quiz() {
  const [, setLocation] = useLocation();
  const { quizState, questions, answerQuestion, nextQuestion, resetQuiz } =
    useQuiz();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (!quizState) {
      setLocation("/home");
    }
  }, [quizState, setLocation]);

  if (!quizState || questions.length === 0) {
    return (
      <div className="w-full h-full bg-background flex items-center justify-center">
        <p className="text-foreground text-xl">Cargando...</p>
      </div>
    );
  }

  if (quizState.isFinished) {
    return <Results />;
  }

  const currentQuestion = questions[quizState.currentQuestionIndex];
  const isAnswered = selectedAnswer !== null;
  const isCorrect =
    isAnswered && selectedAnswer === currentQuestion.correctAnswer;
  const motivationalMessage = getMotivationalMessage(
    quizState.currentQuestionIndex,
    quizState.totalQuestions
  );

  const progressPercentage = Math.round(
    ((quizState.currentQuestionIndex + 1) / quizState.totalQuestions) * 100
  );

  const handleSelectAnswer = (index: number) => {
    if (!showFeedback) {
      setSelectedAnswer(index);
      answerQuestion(index);
      setShowFeedback(true);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    nextQuestion();
  };

  return (
    <div
      className="w-full h-full bg-background flex flex-col items-center px-4 sm:px-6 py-6"
      style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
    >
      {/* Top bar: progreso + racha */}
      <div className="w-full space-y-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <p
            className="text-xs sm:text-sm font-bold text-foreground"
            style={{ fontFamily: "Poppins" }}
          >
            Pregunta {quizState.currentQuestionIndex + 1} de{" "}
            {quizState.totalQuestions}
          </p>

          {/* Indicador de racha — clave para motivación TDAH */}
          {quizState.currentStreak > 0 && (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 animate-in zoom-in duration-300"
              aria-label={`Racha de ${quizState.currentStreak} respuestas correctas`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-bold text-orange-400">
                {quizState.currentStreak}
              </span>
            </div>
          )}

          <p
            className="text-xs sm:text-sm font-bold text-primary"
            style={{ fontFamily: "Poppins" }}
          >
            {progressPercentage}%
          </p>
        </div>

        <div className="w-full h-3 bg-card border border-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Botón atrás */}
      <div className="w-full flex items-center justify-start mb-3">
        <button
          onClick={() => {
            resetQuiz();
            setLocation("/home");
          }}
          className="p-2 hover:bg-border rounded-lg transition-colors"
          aria-label="Salir del quiz"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col items-center justify-start w-full max-w-md space-y-5 overflow-y-auto">
        {/* Mensaje motivacional */}
        {motivationalMessage && (
          <p
            className="text-sm sm:text-base font-semibold text-secondary text-center animate-in fade-in duration-500"
            style={{ fontFamily: "Poppins" }}
          >
            {motivationalMessage}
          </p>
        )}

        {/* Tarjeta con pregunta */}
        <div
          key={currentQuestion.id}
          className="bg-card rounded-2xl border border-border p-4 sm:p-6 space-y-4 w-full animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <p
            className="text-base sm:text-lg font-bold text-foreground"
            style={{ fontFamily: "Poppins" }}
          >
            {currentQuestion.text}
          </p>

          {/* Opciones */}
          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => {
              const isCorrectOption =
                showFeedback && index === currentQuestion.correctAnswer;
              const isWrongPick =
                showFeedback &&
                index === selectedAnswer &&
                index !== currentQuestion.correctAnswer;

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={showFeedback}
                  className={`w-full p-3 sm:p-4 rounded-2xl font-semibold text-sm sm:text-base transition-all duration-200 border-2 flex items-center gap-2 sm:gap-3 active:scale-[0.98] ${
                    showFeedback
                      ? isCorrectOption
                        ? "bg-secondary/20 border-secondary text-secondary"
                        : isWrongPick
                          ? "bg-destructive/20 border-destructive text-destructive animate-shake"
                          : "bg-card border-border text-muted-foreground"
                      : selectedAnswer === index
                        ? "bg-primary border-primary text-background"
                        : "bg-background border-border text-foreground hover:border-primary/50"
                  }`}
                  style={{ fontFamily: "Poppins" }}
                >
                  {isCorrectOption && (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  )}
                  {isWrongPick && (
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  )}
                  <span className="text-left flex-1">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {showFeedback && (
            <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div
                className={`p-3 sm:p-4 rounded-2xl text-xs sm:text-sm ${
                  isCorrect
                    ? "bg-secondary/20 text-secondary border border-secondary/30"
                    : "bg-destructive/20 text-destructive border border-destructive/30"
                }`}
              >
                <p className="font-semibold mb-1 sm:mb-2">
                  {isCorrect ? "¡Correcto!" : "Incorrecto"}
                </p>
                <p>{currentQuestion.explanation}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botón siguiente */}
      {showFeedback && (
        <button
          onClick={handleNext}
          className="w-full max-w-md py-3 sm:py-4 px-4 bg-primary hover:bg-primary/90 text-background rounded-2xl font-bold transition-all duration-200 mt-6 active:scale-[0.98] animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={{
            fontFamily: "Poppins",
            marginBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {quizState.currentQuestionIndex === quizState.totalQuestions - 1
            ? "Ver resultados"
            : "Siguiente"}
        </button>
      )}
    </div>
  );
}
