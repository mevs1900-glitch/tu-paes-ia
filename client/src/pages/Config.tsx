import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ChevronLeft, Sparkles, Loader2 } from "lucide-react";
import { useQuiz } from "@/contexts/QuizContext";
import type { Subject, Level } from "@/data";

interface ConfigProps {
  subject: Subject;
  level: Level;
}

const QUESTION_OPTIONS = [5, 10, 15, 20] as const;

export default function Config({ subject, level }: ConfigProps) {
  const [, setLocation] = useLocation();
  const [selectedQuestions, setSelectedQuestions] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { startQuiz } = useQuiz();

  const handleStartQuiz = async () => {
    if (!selectedQuestions || isLoading) return;
    setIsLoading(true);
    try {
      await startQuiz(subject, level, selectedQuestions);
      setLocation("/quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const subjectLabel = subject === "lenguaje" ? "Lenguaje" : "Matemáticas";
  const levelLabel = `${level}° Medio`;

  // Estimación de tiempo: ~1-2 segundos por pregunta generada por IA
  const estimateSeconds = (count: number) => Math.ceil(count * 1.5);

  return (
    <div className="w-full min-h-full bg-background flex flex-col items-center px-6 py-6 gap-6 overflow-y-auto">
      {/* Header */}
      <div className="w-full flex items-center">
        <button
          onClick={() => setLocation(`/nivel/${subject}`)}
          disabled={isLoading}
          className="p-2 hover:bg-border rounded-lg transition-colors disabled:opacity-50"
          aria-label="Volver"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1
          className="flex-1 text-center text-xl font-bold text-foreground"
          style={{ fontFamily: "Poppins" }}
        >
          Cantidad de preguntas
        </h1>
        <div className="w-10" />
      </div>

      {/* Información del contexto */}
      <div className="text-center space-y-1 mt-4">
        <p className="text-sm text-muted-foreground">{subjectLabel}</p>
        <p
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: "Poppins" }}
        >
          {levelLabel}
        </p>
        <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">
            Preguntas generadas con IA
          </span>
        </div>
      </div>

      {/* Opciones de cantidad */}
      <div className="w-full max-w-md space-y-3">
        {QUESTION_OPTIONS.map((num) => {
          const isSelected = selectedQuestions === num;
          return (
            <button
              key={num}
              onClick={() => setSelectedQuestions(num)}
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 border-2 flex items-center justify-between disabled:opacity-50 ${
                isSelected
                  ? "bg-primary text-background border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/50"
              }`}
              style={{ fontFamily: "Poppins" }}
            >
              <span>{num} preguntas</span>
              <span className={`text-xs font-normal ${isSelected ? "text-background/80" : "text-muted-foreground"}`}>
                ~{estimateSeconds(num)}s
              </span>
            </button>
          );
        })}
      </div>

      {/* Botón Iniciar */}
      <Button
        onClick={handleStartQuiz}
        disabled={!selectedQuestions || isLoading}
        className="w-full max-w-md h-14 bg-primary hover:bg-primary/90 text-background font-bold text-lg rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2 mb-4 flex items-center justify-center gap-2"
        style={{ fontFamily: "Poppins" }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Generando preguntas...</span>
          </>
        ) : (
          "Iniciar quiz"
        )}
      </Button>

      {/* Nota */}
      <p className="text-xs text-muted-foreground/60 text-center max-w-md -mt-2">
        La IA genera preguntas personalizadas según tu nivel.
        Si la IA no está disponible, usaremos preguntas de respaldo.
      </p>
    </div>
  );
}
