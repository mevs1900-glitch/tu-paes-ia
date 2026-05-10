import { Button } from "@/components/ui/button";
import { useLocation, useRoute } from "wouter";
import { ChevronLeft } from "lucide-react";

export default function Level() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/nivel/:subject");
  const subject = params?.subject || "lenguaje";

  const subjectNames: Record<string, string> = {
    lenguaje: "Lenguaje",
    matematicas: "Matematicas",
  };

  const levels = [
    { id: 1, name: "1 Medio" },
    { id: 2, name: "2 Medio" },
    { id: 3, name: "3 Medio" },
    { id: 4, name: "4 Medio" },
  ];

  const handleSelectLevel = (level: number) => {
    setLocation(`/config/${subject}/${level}`);
  };

  return (
    <div className="w-full h-full bg-background flex flex-col">
      <div className="bg-card border-b border-border px-6 py-6 flex items-center gap-4 flex-shrink-0">
        <button
          onClick={() => setLocation("/home")}
          className="p-3 hover:bg-border rounded-xl transition-colors flex-shrink-0"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "Poppins" }}>
          {subjectNames[subject]}
        </h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-bold text-foreground" style={{ fontFamily: "Poppins" }}>
            Tu nivel
          </h2>
        </div>

        <div className="w-full max-w-sm space-y-4">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => handleSelectLevel(level.id)}
              className="w-full bg-card border-2 border-border hover:border-primary hover:bg-card/80 rounded-3xl p-8 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-bold text-foreground" style={{ fontFamily: "Poppins" }}>
                  {level.name}
                </h3>
                <div className="text-3xl group-hover:scale-110 transition-transform">
                  →
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
