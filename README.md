# Tu PAES IA

Aplicación móvil web para preparación de la **PAES** (Prueba de Acceso a la
Educación Superior, Chile), enfocada en estudiantes de 1° a 4° medio,
diseñada con principios de accesibilidad para personas con TDAH.

**Autor:** Manuel Valenzuela · Chile · 2026
**Materias actuales:** Lenguaje (Competencia Lectora) y Matemáticas (M1)
**Stack:** React 19 · TypeScript · Vite · Tailwind v4 · shadcn/ui · Wouter · Express

---

## Estructura del proyecto

```
tu-paes-ia/
├── client/
│   ├── src/
│   │   ├── App.tsx                  # Router principal
│   │   ├── main.tsx                 # Entry point
│   │   ├── index.css                # Tailwind + variables de color + animaciones
│   │   ├── pages/
│   │   │   ├── Login.tsx            # Login / Registro
│   │   │   ├── Home.tsx             # Selección de materia
│   │   │   ├── Level.tsx            # Selección de nivel (1°-4° medio)
│   │   │   ├── Config.tsx           # Selección de cantidad de preguntas
│   │   │   ├── Quiz.tsx             # Quiz + Resultados (con repaso)
│   │   │   └── NotFound.tsx
│   │   ├── contexts/
│   │   │   ├── QuizContext.tsx      # Estado del quiz (incluye streak)
│   │   │   └── ThemeContext.tsx
│   │   ├── data/                    # 🆕 Bancos de preguntas modulares
│   │   │   ├── types.ts             # Tipos compartidos
│   │   │   ├── lenguaje.ts          # 40 preguntas Lenguaje
│   │   │   ├── matematicas.ts       # 40 preguntas Matemáticas
│   │   │   └── index.ts             # Agregador y utilidades
│   │   ├── lib/
│   │   │   ├── userStorage.ts       # Auth local con SHA-256 + salt
│   │   │   ├── aiClient.ts          # 🆕 Stub Anthropic (listo para Fase 2)
│   │   │   ├── motivationalMessages.ts
│   │   │   └── utils.ts
│   │   └── components/ui/           # shadcn/ui
│   └── public/
├── server/
│   └── index.ts                     # Express server (sirve estáticos)
├── shared/
│   └── const.ts
├── ideas.md                         # Visión y decisiones de diseño
└── package.json
```

---

## Cambios de la Fase 1 (versión actual)

### 🐛 Bugs arreglados

1. **Repetición de preguntas:** antes, si pedías 100 preguntas y el banco tenía 5,
   te mostraban las mismas 5 en loop. Ahora `pickQuestions` mezcla y entrega
   solo las disponibles, sin repetir.
2. **Inconsistencia en pregunta de promedio (m4_6):** la respuesta marcada
   no coincidía con la explicación. Reescrita y verificada.

### 🔐 Seguridad

- Las contraseñas ya **no se guardan en texto plano** en localStorage. Ahora
  usan **SHA-256 + salt aleatorio por usuario** (`crypto.subtle.digest` del
  navegador). El usuario en sesión solo guarda email + fecha de creación,
  nunca el hash ni el salt.
- Nota: esto sigue siendo auth local. En Fase 2 se reemplaza por Firebase Auth.

### 📚 Banco de preguntas

- **De 40 preguntas básicas (nivel enseñanza básica) → a 80 preguntas nivel PAES real**:
  - Lenguaje: comprensión lectora con textos breves, inferencia, evaluación de
    argumentos, identificación de tono/ironía. NO gramática aislada.
  - Matemáticas: porcentajes en contexto financiero, sistemas de ecuaciones
    aplicados, interpretación de funciones, probabilidad, estadística.
- Modular: cada materia es un archivo independiente. Agregar preguntas
  generadas por IA (Fase 2) es solo concatenar al `QUESTION_BANK`.
- Cada pregunta lleva metadata (`source: "manual" | "ai"`, `topic`).

### 🔥 Mejoras UX para TDAH

- **Indicador de racha (streak)** visible durante el quiz: cuando el estudiante
  responde correcto varias veces seguidas, aparece un contador con llama
  naranja. Mejor racha se muestra al final.
- **Animaciones más sutiles y rápidas**: shake en respuesta incorrecta,
  fade-in/slide-in en preguntas nuevas, zoom-in en el porcentaje final.
- **Respeto a `prefers-reduced-motion`**: si el usuario tiene activado
  "reducir animaciones" en su sistema, las animaciones se desactivan
  (importante para TDAH severo y trastornos vestibulares).
- **Pantalla de resultados con repaso completo**: cada pregunta con la
  respuesta del estudiante, la correcta y la explicación. Botones de
  "Reintentar" (mismo nivel) y "Volver al inicio".
- **Config muestra preguntas disponibles**: si el banco tiene 10 preguntas y
  pides 100, se avisa visualmente "(jugarás 10)" en vez de simular 100.

### 🤖 Preparación para IA (stub)

- Nuevo archivo `client/src/lib/aiClient.ts` con la estructura completa
  para llamar a la API de Anthropic. Comentado y listo para activar.
- Define tipos (`GenerateQuestionsParams`, `GenerateQuestionsResult`,
  `AIError`) y la interfaz que el resto de la app puede importar sin
  romperse mientras el stub no esté activo.

---

## Cómo correr localmente

```bash
# 1. Instalar dependencias (usa pnpm)
pnpm install

# 2. Modo desarrollo (frontend)
pnpm dev

# 3. Build para producción
pnpm build

# 4. Servidor de producción
pnpm start
```

La app corre en `http://localhost:5173` en dev.

---

## Plan de Fase 2 (siguiente paso)

### Objetivo: hacer realidad el "IA" del nombre

1. **Conectar Anthropic API**
   - Crear cuenta en [console.anthropic.com](https://console.anthropic.com)
     y comprar créditos (USD $5 inicial alcanza para ~1500 quizzes con Haiku).
   - Crear `.env` con `VITE_ANTHROPIC_KEY=sk-ant-...`.
   - Descomentar la implementación en `aiClient.ts`.
   - **Mejor práctica:** mover la llamada al `server/` (Express) para no
     exponer la API key. El cliente le pega al backend, el backend a Anthropic.

2. **Reemplazar auth local por Firebase Auth con Google**
   - Crear proyecto en Firebase Console.
   - Habilitar Authentication → Google provider.
   - `pnpm add firebase`.
   - Reemplazar `userStorage.ts` con wrappers de Firebase Auth.

3. **Deploy en Vercel**
   - Conectar el repo de GitHub a Vercel.
   - Agregar variables de entorno (`VITE_ANTHROPIC_KEY` no porque vive en el
     server, pero sí las de Firebase).
   - Cada `git push origin main` deploya automáticamente.

### Objetivo: guardar progreso real

4. **Persistir resultados de quizzes**
   - Si el usuario está logueado con Google, guardar cada quiz en Firestore
     con: materia, nivel, score, fecha, mejor racha.
   - Pantalla de "Mis estadísticas" en Home con histórico.

---

## Ideas para Fase 3+

- Modo "PAES Ensayo": simulación con 65 preguntas y tiempo de 2.5 horas.
- Modo "Repaso de errores": solo las preguntas que fallaste antes.
- Preguntas con desarrollo (texto libre) evaluadas por Claude Sonnet.
- Sonidos sutiles de feedback (toggle on/off).
- Streak diario (gamificación tipo Duolingo).
- Compartir resultado por imagen (Instagram stories).

---

## Notas de diseño (resumen de `ideas.md`)

- **Movimiento:** Minimalismo Oscuro Funcional.
- **Colores:** fondo `#0a0e27`, primario `#00a8ff`, éxito `#00d084`,
  error `#ff4757`. Alto contraste, baja fatiga.
- **Tipografía:** Poppins (display/heading/button), Inter (body/caption).
- **Layout:** una acción por pantalla, botones grandes (60-70% del ancho),
  espaciado generoso.
- **Animaciones:** rápidas (200-300ms), respetan `prefers-reduced-motion`.
