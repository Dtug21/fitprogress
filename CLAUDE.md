# FitProgress — Contexto del Proyecto

## Qué es este proyecto

App móvil de entrenamiento con progresión de dificultad para un usuario intermedio. Tiene dos modos: **Casa** y **Gym**. Permite programar rutinas semanales, registrar entrenamientos, ver progresión de pesos/dificultad y sustituir ejercicios cuando no se tiene el equipo o no se logra completar uno.

## Stack técnico

- **Frontend:** React Native + Expo (managed workflow)
- **State management:** Zustand + AsyncStorage (persistencia local)
- **Navegación:** Expo Router (file-based routing)
- **UI:** Nativewind (Tailwind para React Native) + componentes custom
- **Target:** iOS (iPhone) — prioridad. Android secundario.
- **Idioma de la app:** Español
- **Sin backend.** Todo se guarda localmente en el dispositivo.

## Principios de desarrollo

1. **Mobile-first siempre.** Todo se diseña para pantalla de iPhone. Touch targets mínimos de 44px.
2. **Local-only.** Zustand persiste en AsyncStorage. No hay backend. Los datos viven en el dispositivo.
3. **Una cosa a la vez.** Durante el entrenamiento, la pantalla muestra SOLO el ejercicio actual, no la rutina completa.
4. **Progresión visible.** El usuario debe ver claramente cuánto ha avanzado (gráficos, indicadores, badges).
5. **Sin decisiones innecesarias.** La app sugiere pesos y progresión. El usuario solo confirma o ajusta.

## Convenciones de código

- TypeScript estricto. No `any`.
- Componentes funcionales con hooks.
- Nombres de archivos en kebab-case, componentes en PascalCase.
- Comentarios en español.
- Commits en español con prefijos: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`.

## Perfil del usuario

- **Nivel:** Intermedio (6 meses – 2 años de experiencia)
- **Objetivo:** Pérdida de grasa + fuerza funcional / salud general
- **Días disponibles:** 4-5 por semana
- **Equipamiento en casa:** Mancuernas regulables, banco inclinable (sin rack), barra plana, barra Z, barra W, bandas elásticas largas y cortas, rueda abdominal, cuerda para saltar, hand grippers
- **Limitación clave en casa:** No tiene rack, así que no puede hacer sentadilla con barra en rack ni press de banca con barra pesada sin spotter
