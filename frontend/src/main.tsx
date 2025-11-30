/**
 * Archivo de entrada principal de la aplicación React.
 * -----------------------------------------------------
 * Monta el componente raíz `<App />` dentro del elemento HTML con id `"root"`.
 *
 * Utiliza:
 * - **React 18+** con `createRoot` (API concurrente).
 * - **StrictMode**, que activa comprobaciones adicionales en modo desarrollo.
 *
 * También importa los estilos globales desde `index.css`.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { setupIonicReact } from '@ionic/react';

// Inicializa Ionic React (registra los web components y configura la integración)
setupIonicReact();

/**
 * Punto de montaje de la aplicación.
 *
 * Busca el elemento HTML con id `"root"` y renderiza en él la aplicación React,
 * envolviéndola con `React.StrictMode` para detectar posibles problemas
 * en el ciclo de vida de los componentes durante el desarrollo.
 *
 * @example
 * Estructura básica del HTML:
 * ```html
 * <body>
 *   <div id="root"></div>
 *   <script type="module" src="/src/main.tsx"></script>
 * </body>
 * ```
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
