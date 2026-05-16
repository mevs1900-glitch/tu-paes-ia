import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  Flame,
  Loader2,
  Sparkles,
  AlertTriangle,
  Flag,
} from "lucide-react";
import { useQuiz } from "@/contexts/QuizContext";
import {
  getMotivationalMessage,
  getResultMessage,
} from "@/lib/motivationalMessages";

// =========================================================================
// Pantalla: Loading (mientras se genera con IA)
// =========================================================================

function LoadingScreen({ count }: { count: number }) {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full bg-background flex flex-col items-center justify-center px-6 py-6">
      <div className="text-center space-y-6 max-w-sm">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          <div className="relative w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30">
            <Sparkles className="w-9 h-9 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <p
            className="text-xl font-bold text-foreground"
            style={{ fontFamily: "Poppins" }}
          >
            Generando preguntas{dots}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            La IA está creando {count} preguntas únicas y personalizadas para ti.
            Esto puede tardar unos segundos.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/70">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Por favor espera...</span>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// Pantalla: Error
// =========================================================================

function ErrorScreen({ message }: { message: string }) {
  const [, setLocation] = useLocation();
  const { resetQuiz } = useQuiz();

  const handleBack = () => {
    resetQuiz();
    setLocation("/home");
  };

  return (
    <div className="w-full h-full bg-background flex flex-col items-center justify-center px-6 py-6">
      <div className="text-center space-y-5 max-w-sm">
        <div className="w-20 h-20 mx-auto bg-destructive/15 rounded-full flex items-center justify-center border border-destructive/30">
          <AlertTriangle className="w-9 h-9 text-destructive" />
        </div>

        <div className="space-y-2">
          <p
            className="text-xl font-bold text-foreground"
            style={{ fontFamily: "Poppins" }}
          >
            No pudimos generar preguntas
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>

        <button
          onClick={handleBack}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-background font-bold text-base rounded-2xl"
          style={{ fontFamily: "Poppins" }}
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// Pantalla: Resultados
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
    resetQuiz();
    setLocation(`/config/${quizState.subject}/${quizState.level}`);
  };

  return (
    <div className="w-full h-full bg-background flex flex-col px-4 sm:px-6 py-6 overflow-y-auto">
      <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-6">
        {/* Hero */}
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

        {/* Repaso */}
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
            className="h-12 bg-card border-2 border-primary text-primary hover:bg-primary/10 font-bold rounded-2xl"
            style={{ fontFamily: "Poppins" }}
          >
            Reintentar
          </button>
          <button
            onClick={handleRestart}
            className="h-12 bg-primary hover:bg-primary/90 text-background font-bold rounded-2xl"
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
// Pantalla principal: Quiz
// =========================================================================

export default function Quiz() {
  const [, setLocation] = useLocation();
  const {
    quizState,
    questions,
    answerQuestion,
    nextQuestion,
    resetQuiz,
    reportCurrentQuestion,
  } = useQuiz();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [reportedThis, setReportedThis] = useState(false);

  useEffect(() => {
    if (!quizState) {
      setLocation("/home");
    }
  }, [quizState, setLocation]);

  // Resetea el estado de la pregunta cuando cambia el índice
  useEffect(() => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setReportedThis(false);
  }, [quizState?.currentQuestionIndex]);

  if (!quizState) {
    return (
      <div className="w-full h-full bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Pantallas según phase
  if (quizState.phase === "loading") {
    return <LoadingScreen count={quizState.requestedQuestions} />;
  }

  if (quizState.phase === "error") {
    return <ErrorScreen message={quizState.errorMessage || "Error inesperado"} />;
  }

  if (quizState.phase === "finished") {
    return <Results />;
  }

  // Phase: playing
  if (questions.length === 0) {
    return (
      <div className="w-full h-full bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
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
    nextQuestion();
  };

  const handleReport = () => {
    if (reportedThis) return;
    reportCurrentQuestion("Usuario reportó pregunta incorrecta");
    setReportedThis(true);
  };

  return (
    <div
      className="w-full h-full bg-background flex flex-col items-center px-4 sm:px-6 py-6"
      style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
    >
      {/* Banner de origen (solo si es manual de respaldo) */}
      {quizState.source === "manual" && quizState.errorMessage && (
        <div className="w-full max-w-md mb-3 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30">
          <p className="text-xs text-orange-400 text-center">
            ⚠️ Usando banco de respaldo
          </p>
        </div>
      )}

      {/* Top bar */}
      <div className="w-full space-y-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <p
            className="text-xs sm:text-sm font-bold text-foreground"
            style={{ fontFamily: "Poppins" }}
          >
            Pregunta {quizState.currentQuestionIndex + 1} de{" "}
            {quizState.totalQuestions}
          </p>

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
      <div className="w-full flex items-center justify-between mb-3">
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

        {/* Botón reportar pregunta (solo cuando ya hay feedback visible) */}
        {showFeedback && currentQuestion.source === "ai" && (
          <button
            onClick={handleReport}
            disabled={reportedThis}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
              reportedThis
                ? "bg-secondary/10 text-secondary cursor-default"
                : "bg-card border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50"
            }`}
            aria-label="Reportar pregunta incorrecta"
          >
            <Flag className="w-3 h-3" />
            {reportedThis ? "Reportada" : "Reportar"}
          </button>
        )}
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col items-center justify-start w-full max-w-md space-y-5 overflow-y-auto">
        {motivationalMessage && (
          <p
            className="text-sm sm:text-base font-semibold text-secondary text-center animate-in fade-in duration-500"
            style={{ fontFamily: "Poppins" }}
          >
            {motivationalMessage}
          </p>
        )}

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
