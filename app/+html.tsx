import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

const BASE = '/fitprogress';

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* PWA */}
        <meta name="application-name" content="FitProgress" />
        <meta name="description" content="Tu app de entrenamiento con progresión inteligente" />
        <meta name="theme-color" content="#0B0B0C" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href={`${BASE}/manifest.webmanifest`} />

        {/* iOS PWA — abrir desde pantalla de inicio oculta Safari */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FitProgress" />
        <link rel="apple-touch-icon" href={`${BASE}/apple-touch-icon.png`} />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const globalStyles = `
html {
  height: 100%;
  height: 100dvh;
}
body {
  background-color: #0B0B0C;
  margin: 0;
  padding: 0;
  overscroll-behavior: none;
  min-height: 100%;
  min-height: 100dvh;
}
#root {
  min-height: 100%;
  min-height: 100dvh;
}
* { -webkit-tap-highlight-color: transparent; }
@media (display-mode: standalone) {
  body { user-select: none; -webkit-user-select: none; }
}`;
