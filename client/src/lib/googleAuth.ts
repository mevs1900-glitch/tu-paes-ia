// Google OAuth Configuration
// Para usar en producción, reemplaza con tu CLIENT_ID de Google Cloud Console

export const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

export interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
}

// Simular Google OAuth para desarrollo
export function initiateGoogleLogin(): Promise<GoogleUser> {
  return new Promise((resolve) => {
    // En producción, aquí iría la librería de Google OAuth
    // Para este ejemplo, simulamos el flujo
    
    // Simular selector de cuenta
    const accounts = [
      { email: "usuario@gmail.com", name: "Usuario Test" },
      { email: "otro@gmail.com", name: "Otro Usuario" },
    ];

    // Simular que el usuario selecciona una cuenta
    const selectedAccount = accounts[0];
    
    resolve({
      email: selectedAccount.email,
      name: selectedAccount.name,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAccount.name)}&background=random`,
    });
  });
}

export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: window.location.origin,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account", // Fuerza selector de cuenta
    access_type: "offline",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
