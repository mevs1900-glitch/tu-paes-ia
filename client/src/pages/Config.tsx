import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useQuiz } from "@/contexts/QuizContext";
import { getQuestions, type Subject, type Level } from "@/data";

interface ConfigProps {
  subject: Subject;
  level: Level;
}

const QUESTION_OPTIONS = [5, 10, 15, 20, 50, 100] as const;

export default function Config({ subject, level }: ConfigProps) {
  const [, setLocation] = useLocation();
  const [selectedQuestions, setSelectedQuestions] = useState<number | null>(null);
  const { startQuiz } = useQuiz();

  const available = useMemo(
    () => getQuestions(subject, level).length,
    [subject, level]
  );

  const handleStartQuiz = () => {
    if (selectedQuestions) {
      startQuiz(subject, level, selectedQuestions);
      setLocation("/quiz");
    }
  };

  const subjectLabel = subject === "lenguaje" ? "Lenguaje" : "Matemáticas";
  const levelLabel = `${level}° Medio`;

  return (
    <div className="w-full min-h-full bg-background flex flex-col items-center px-6 py-6 gap-6 overflow-y-auto">
      <div className="w-full flex items-center">
        <button
          onClick={() => setLocation(`/nivel/${subject}`)}
          className="p-2 hover:bg-border rounded-lg transition-colors"
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

      <div className="text-center space-y-1 mt-4">
        <p className="text-sm text-muted-foreground">{subjectLabel}</p>
        <p
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: "Poppins" }}
        >
          {levelLabel}
        </p>
        <p className="text-xs text-muted-foreground/80 pt-1">
          Disponibles: {available} preguntas
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        {QUESTION_OPTIONS.map((num) => {
          const isAvailable = num <= available;
          const isSelected = selectedQuestions === num;
          const effectiveNum = Math.min(num, available);

          return (
            <button
              key={num}
              onClick={() => setSelectedQuestions(num)}
              disabled={available === 0}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 border-2 flex items-center justify-between ${
                isSelected
                  ? "bg-primary text-background border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/50"
              }`}
              style={{ fontFamily: "Poppins" }}
            >
              <span>{num} preguntas</span>
              {!isAvailable && available > 0 && (
                <span
                  className={`text-xs font-normal ${
                    isSelected ? "text-background/80" : "text-muted-foreground"
                  }`}
                >
                  (jugarás {effectiveNum})
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Button
        onClick={handleStartQuiz}
        disabled={!selectedQuestions || available === 0}
        className="w-full max-w-md h-14 bg-primary hover:bg-primary/90 text-background font-bold text-lg rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2 mb-4"
        style={{ fontFamily: "Poppins" }}
      >
        {available === 0 ? "Sin preguntas disponibles" : "Iniciar quiz"}
      </Button>
    </div>
  );
}