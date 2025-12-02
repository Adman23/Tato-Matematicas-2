import React from 'react';

// 1. Extendemos las propiedades nativas de un botón HTML para aceptar aria-label, onClick, etc. automáticamente.
interface button3DtextProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  frontClassName?: string;
  children: React.ReactNode;
  color?: string;
  // 'disabled' y 'onClick' ya vienen incluidos en ButtonHTMLAttributes, no hace falta re-declararlos obligatoriamente,
  // pero podemos dejarlos si queremos tipado explícito o JSDoc específico.
}

/**
 * @brief Button with 3D css, that uses the css variables and you can change the content
 * @information btn-icon y btn-text are the classes for span text and img elements in the content
 * @param children The content of the button, it should be a span and a img elements
 * @param props Any standard HTML button attribute (onClick, aria-label, disabled, etc.)
 * @param className if you need to add more css to the button container
 * @param frontClassName if you need to add classes specifically to the front face
 * @param color Background color for the 3D effect
 */
export const Button3Dtext: React.FC<button3DtextProps> = ({ 
  children, 
  className = '', 
  frontClassName = '',
  color = 'var(--button-profile-bg)',
  ...props // 2. Capturamos el resto de props (incluyendo aria-label, disabled, onClick)
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
          margin: 0; 
          flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }

        .pushable-button:disabled {
          cursor: default;
          pointer-events: none;
          opacity: 0.5;
          filter: grayscale(0.8);
        }

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

        .pushable-button .front {
          display: block;
          position: relative;
          border-radius: 12px;
          padding: 12px 20px;
          color: white;
          width: 100%;
          height: 100%;
          font-weight: 700;
          transform: translateY(-6px);
          transition: transform 100ms cubic-bezier(0.3, 0.7, 0.4, 1), background-color 250ms;
        }

        .pushable-button:disabled .front {
           transform: translateY(-6px);
           background: #999;
        }
        .pushable-button:disabled .edge {
          background: #777;
        }

        .pushable-button .button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        /* Clases utilitarias internas */
        .btn-text {
          font-size: 1.2rem;
          font-weight: bold;
          white-space: nowrap;
          color: #000000;
          border: 2px solid #1e3a8a;
          padding: 4px 12px;
          border-radius: 6px;
          background-color: rgba(255, 255, 255, 0.9);
          max-width: 95%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: clip;
          font-size: clamp(12px, 1.7vw, 20px);
          line-height: 1.2;
          flex-shrink: 0;
        }

        .btn-icon {
          font-size: 1.8rem;
          display: block;
        }

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
        type="button"
        {...props} // 3. IMPORTANTE: Aquí pasamos aria-label, disabled, onClick, etc. al elemento DOM real
      >
        <span className="shadow"></span>
        <span className="edge" style={{ backgroundColor: color }}></span>
        <span className={`front ${frontClassName}`} style={{ background: color }}>
          <div className="button-content">
            {children}
          </div>
        </span>
      </button>
    </>
  );
};