/**
 * !! NEW FILE
 * -> Component that every page can use
 * -> One of the buttons that will be used
 */

import React from 'react';

interface button3DtextProps {
  onClick?: () => void;
  className?: string;
  frontClassName?: string;
  children: React.ReactNode;
  color?: string;
  disabled?: boolean; // Added disabled prop for logic handling
}

/**
 * @brief Button with 3D css, that uses the css variables and you can change the content
 * * @information btn-icon y btn-text are the classes for span text and img elements in the content
 * @param children The content of the button, it should be a span and a img elements
 * @param onClick The function that happens when you click 
 * @param className if you need to add more css to the button
 * @param disabled Disables interaction and changes visual state
 * @returns 
 */
export const Button3Dtext: React.FC<button3DtextProps> = ({ 
  onClick, 
  children, 
  className = '', 
  frontClassName = '',
  color = 'var(--bubble-selected-bg)',
  disabled = false
}) => {

  return (
    <>
      <style>{`
        .pushable-button {
          position: relative;
          background: transparent;
          padding: 0;
          border: none;
          cursor: pointer;
          outline-offset: 4px;
          transition: filter 250ms;
          /* Margin removed from here to control it via parent layout if needed */
          margin: 0; 
          flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }

        /* Disabled State */
        .pushable-button:disabled {
          cursor: default;
          pointer-events: none;
          opacity: 0.5;
          filter: grayscale(0.8);
        }

        /* 1. La Sombra */
        .pushable-button .shadow {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 100%;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 12px;
          transform: translateY(6px);
          filter: blur(4px);
          transition: transform 250ms cubic-bezier(.3, .7, .4, 1);
        }

        /* 2. El Borde/Grosor 3D */
        .pushable-button .edge {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 100%;
          border-radius: 12px;
          filter: brightness(0.7);
          background-image: linear-gradient(
            to left,
            rgba(0, 0, 0, 0.25) 0%,  
            rgba(0, 0, 0, 0) 8%,     
            rgba(0, 0, 0, 0) 92%,    
            rgba(0, 0, 0, 0.25) 100% 
          );
        }

        /* 3. La Cara Frontal */
        .pushable-button .front {
          display: block;
          position: relative;
          border-radius: 12px;
          /* Padding ajustado para que no sea tan ancho si solo tiene icono */
          padding: 12px 20px;
          color: white;
          width: 100%;
          height: 100%;
          font-weight: 700;
          transform: translateY(-6px);
          transition: transform 100ms cubic-bezier(0.3, 0.7, 0.4, 1), background-color 250ms;
        }

        .pushable-button:disabled .front {
           transform: translateY(-6px); /* Stay up if disabled, or move down? usually stay up but grayed */
           background: #999; /* Fallback gray */
        }
        .pushable-button:disabled .edge {
          background: #777;
        }

        /* Contenido del botón */
        .pushable-button .button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        /* Clases utilitarias */
        .btn-text {
          font-size: 1.2rem;
          font-weight: bold;
          white-space: nowrap;
        }

        .btn-icon {
          font-size: 1.8rem; /* Tamaño para IonIcon */
          display: block;
        }

        /* --- Animaciones de interacción --- */
        @media (hover: hover) {
          .pushable-button:not(:disabled):hover .front {
            transform: translateY(-8px);
            filter: brightness(1.1);
          }
          
          .pushable-button:not(:disabled):hover .shadow {
            transform: translateY(8px);
            filter: blur(6px);
          }
        }

        .pushable-button:not(:disabled):active .front {
          transform: translateY(-2px);

        }

        .pushable-button:not(:disabled):active .shadow {
          transform: translateY(2px);
          filter: blur(2px);
        }
        
        .pushable-button:focus:not(:focus-visible) {
          outline: none;
        }
      `}</style>

      <button 
        className={`pushable-button ${className}`} 
        onClick={onClick} 
        type="button"
        disabled={disabled}
      >
        <span className={`shadow`}></span>
        <span className={`edge`} style={{ backgroundColor: color }}></span>
        <span className={`front ${frontClassName}`} style={{ background: color }}>
          <div className={`button-content`}>
            {children}
          </div>
        </span>
      </button>
    </>
  );
};