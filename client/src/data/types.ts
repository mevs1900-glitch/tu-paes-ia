// Tipos compartidos para el banco de preguntas
// Permite que los archivos de banco se importen sin acoplarse al QuizContext

export type Subject = "lenguaje" | "matematicas";
export type Level = 1 | 2 | 3 | 4;

export interface Question {
  id: string;
  subject: Subject;
  level: Level;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  /** Origen de la pregunta: "manual" = escrita por humanos, "ai" = generada por IA */
  source?: "manual" | "ai";
  /** Tema o eje del contenido (ej. "comprension lectora", "algebra", "geometria") */
  topic?: string;
}
