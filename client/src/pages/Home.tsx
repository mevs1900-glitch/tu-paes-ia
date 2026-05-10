import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { BookOpen, Calculator } from "lucide-react";
import { logoutUser, getCurrentUser } from "@/lib/userStorage";

export default function Home() {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logoutUser();
    setLocation("/login");
  };

  const user = getCurrentUser();

  const handleSelectSubject = (subject: "lenguaje" | "matematicas") => {
    setLocation(`/nivel/${subject}`);
  };

  return (
    <div className="w-full h-full bg-background flex flex-col">
      <div className="bg-card border-b border-border px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between flex-shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate" style={{ fontFamily: "Poppins" }}>
            Tu PAES <span className="text-primary">IA</span>
          </h1>
          {user && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {user.email}
            </p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="ml-2 px-3 sm:px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-xl transition-colors font-semibold text-xs sm:text-sm border border-destructive/30 flex-shrink-0"
          title="Cerrar sesion"
        >
          Salir
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12">
        <div className="text-center space-y-2 sm:space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground" style={{ fontFamily: "Poppins" }}>
            Elige
          </h2>
        </div>

        <div className="w-full max-w-sm space-y-4 sm:space-y-6">
          {/* Tarjeta Lenguaje */}
          <button
            onClick={() => handleSelectSubject("lenguaje")}
            className="w-full bg-card border-2 border-border hover:border-primary hover:bg-card/80 rounded-3xl p-6 sm:p-8 transition-all duration-200 group"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/20 rounded-2xl flex items-center justify-center group-hover:bg-primary/30 transition-colors flex-shrink-0">
                <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
              <div className="text-center sm:text-left flex-1 min-w-0">
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground break-words" style={{ fontFamily: "Poppins" }}>
                  Lenguaje
                </h3>
              </div>
            </div>
          </button>

          {/* Tarjeta Matemáticas */}
          <button
            onClick={() => handleSelectSubject("matematicas")}
            className="w-full bg-card border-2 border-border hover:border-secondary hover:bg-card/80 rounded-3xl p-6 sm:p-8 transition-all duration-200 group"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-secondary/20 rounded-2xl flex items-center justify-center group-hover:bg-secondary/30 transition-colors flex-shrink-0">
                <Calculator className="w-8 h-8 sm:w-10 sm:h-10 text-secondary" />
              </div>
              <div className="text-center sm:text-left flex-1 min-w-0">
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground break-words" style={{ fontFamily: "Poppins" }}>
                  Matemáticas
                </h3>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
