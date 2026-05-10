import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { loginUser, registerUser, loginAsGuest } from "@/lib/userStorage";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryConfirmed, setRecoveryConfirmed] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const result = await loginUser(email, password);
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        setTimeout(() => {
          setLocation("/home");
        }, 500);
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const result = await registerUser(email, password);
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        setTimeout(() => {
          setEmail("");
          setPassword("");
          setIsLoginMode(true);
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    loginAsGuest("Invitado Google");
    setLocation("/home");
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryConfirmed(true);
    setTimeout(() => {
      setRecoveryConfirmed(false);
      setShowRecovery(false);
      setRecoveryEmail("");
    }, 3000);
  };

  if (showRecovery) {
    return (
      <div className="w-full h-full bg-background flex flex-col items-center justify-between px-6 py-6">
        <div className="w-full flex items-center">
          <button
            onClick={() => {
              setShowRecovery(false);
              setRecoveryConfirmed(false);
              setRecoveryEmail("");
            }}
            className="p-2 hover:bg-border rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="flex-1 text-center text-xl font-bold text-foreground" style={{ fontFamily: "Poppins" }}>
            Recuperar contraseña
          </h1>
          <div className="w-10" />
        </div>

        <div className="w-full max-w-md bg-card rounded-3xl border border-border p-6 space-y-5">
          {!recoveryConfirmed ? (
            <>
              <p className="text-muted-foreground text-base text-center">
                Ingresa tu correo para recibir un enlace de recuperación
              </p>

              <form onSubmit={handleRecoverySubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    required
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground h-12 rounded-2xl text-base"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-background font-bold text-base rounded-2xl transition-all duration-200"
                  style={{ fontFamily: "Poppins" }}
                >
                  Enviar enlace de recuperacion
                </Button>
              </form>
            </>
          ) : (
            <div className="space-y-4 py-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-foreground" style={{ fontFamily: "Poppins" }}>
                  Enlace enviado
                </p>
                <p className="text-muted-foreground text-base mt-2">
                  Te enviamos un enlace para recuperar tu contraseña.
                </p>
              </div>
            </div>
          )}
        </div>

        <div />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background flex flex-col items-center px-6 py-6">
      {/* Header compacto */}
      <div className="w-full max-w-md flex flex-col items-center text-center pt-4 pb-6">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Poppins" }}>
          Tu PAES <span className="text-primary">IA</span>
        </h1>
        <p className="text-[10px] text-muted-foreground/70 mt-1.5 tracking-[0.2em] uppercase" style={{ fontFamily: "Inter" }}>
          Creado por Manu
        </p>
      </div>

      {/* Formulario centrado */}
      <div className="w-full max-w-md">
        <div className="w-full bg-card rounded-3xl border border-border p-6 space-y-5">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsLoginMode(true);
                setMessage(null);
                setEmail("");
                setPassword("");
              }}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold text-base transition-all duration-200 ${
                isLoginMode
                  ? "bg-primary text-background"
                  : "bg-transparent text-muted-foreground hover:bg-border/50"
              }`}
              style={{ fontFamily: "Poppins" }}
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setIsLoginMode(false);
                setMessage(null);
                setEmail("");
                setPassword("");
              }}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold text-base transition-all duration-200 ${
                !isLoginMode
                  ? "bg-primary text-background"
                  : "bg-transparent text-muted-foreground hover:bg-border/50"
              }`}
              style={{ fontFamily: "Poppins" }}
            >
              Registrar
            </button>
          </div>

          {message && (
            <div
              className={`p-4 rounded-2xl text-sm font-semibold text-center ${
                message.type === "success"
                  ? "bg-secondary/20 text-secondary border border-secondary/30"
                  : "bg-destructive/20 text-destructive border border-destructive/30"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={isLoginMode ? handleLogin : handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Email
              </label>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background border-border text-foreground placeholder:text-muted-foreground h-12 rounded-2xl text-base"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Contraseña
              </label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background border-border text-foreground placeholder:text-muted-foreground h-12 rounded-2xl text-base"
              />
              {isLoginMode && (
                <button
                  type="button"
                  onClick={() => setShowRecovery(true)}
                  className="text-xs text-primary hover:text-primary/80 transition-colors font-semibold"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-background font-bold text-base rounded-2xl transition-all duration-200 mt-4"
              style={{ fontFamily: "Poppins" }}
            >
              {isLoading
                ? "Procesando..."
                : isLoginMode
                  ? "Entrar y practicar"
                  : "Crear cuenta"}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">o</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full h-12 bg-white hover:bg-gray-100 text-background font-bold text-base rounded-2xl transition-all duration-200 flex items-center justify-center gap-3"
            style={{ fontFamily: "Poppins" }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span style={{ color: "#1f2937" }}>Entrar con Google</span>
          </button>
        </div>
      </div>

      {/* Footer minimalista */}
      <footer className="w-full max-w-md text-center mt-12 pb-4">
        <p className="text-[10px] text-muted-foreground/50 tracking-wide" style={{ fontFamily: "Inter" }}>
          © 2026 Tu PAES IA · Todos los derechos reservados
        </p>
      </footer>
    </div>
  );
}