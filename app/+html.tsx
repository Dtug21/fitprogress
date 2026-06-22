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
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no, viewport-fit=cover"
        />

        <meta name="application-name" content="FitProgress" />
        <meta name="description" content="Tu app de entrenamiento con progresión inteligente" />
        <meta name="theme-color" content="#0B0B0C" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href={`${BASE}/manifest.webmanifest`} />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
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
  width: 100%;
  height: 100%;
  height: -webkit-fill-available;
  background-color: #0B0B0C;
  overflow: hidden;
}
body {
  background-color: #0B0B0C;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  height: -webkit-fill-available;
  overflow: hidden;
  overscroll-behavior: none;
  -webkit-text-size-adjust: 100%;
  touch-action: manipulation;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
#root {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: -webkit-fill-available;
  background-color: #0B0B0C;
  box-sizing: border-box;
  overflow: hidden;
}
* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
input, textarea, select { font-size: 16px; }
@media (display-mode: standalone) {
  body { user-select: none; -webkit-user-select: none; }
}`;
