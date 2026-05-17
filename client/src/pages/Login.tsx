import { useLocation } from "wouter";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function Login() {
  const [, setLocation] = useLocation();

  const handleSuccess = (credentialResponse: any) => {
    // Guardamos el token en localStorage para saber que está autenticado
    if (credentialResponse.credential) {
      localStorage.setItem("google_token", credentialResponse.credential);
      // Decodificar el JWT para obtener nombre y email
      try {
        const payload = JSON.parse(atob(credentialResponse.credential.split(".")[1]));
        localStorage.setItem("user_name", payload.name || "Usuario");
        localStorage.setItem("user_email", payload.email || "");
        localStorage.setItem("user_picture", payload.picture || "");
      } catch {}
    }
    setLocation("/home");
  };

  const handleError = () => {
    console.error("Error al iniciar sesión con Google");
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="w-full min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-xs flex flex-col items-center space-y-10">

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "Poppins" }}>
              Tu PAES <span className="text-primary">IA</span>
            </h1>
            <p className="text-[10px] text-muted-foreground/60 tracking-[0.2em] uppercase" style={{ fontFamily: "Inter" }}>
              Creado por Manu
            </p>
            <p className="text-xs text-muted-foreground/80 pt-1" style={{ fontFamily: "Inter" }}>
              Preguntas elaboradas con inteligencia artificial
            </p>
          </div>

          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              useOneTap={false}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              locale="es"
            />
          </div>

        </div>

        <p className="absolute bottom-4 text-[10px] text-muted-foreground/50 tracking-wide" style={{ fontFamily: "Inter" }}>
          © Tu PAES IA · Todos los derechos reservados
        </p>
      </div>
    </GoogleOAuthProvider>
  );
}
