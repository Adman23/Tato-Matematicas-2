import React from 'react';

interface BackgroundProps {
  /** * Color base para el fondo y los patrones. 
   * Por defecto usa: var(--ion-color-primary) 
   */
  color?: string;
  className?: string;
}

/**
 * @brief Componente de fondo dinámico con patrones matemáticos.
 * Utiliza CSS Masks y color-mix para adaptarse al color primario de la app.
 */
export const Background: React.FC<BackgroundProps> = ({ 
  color = 'var(--ion-color-primary)',
  className = ''
}) => {

  // SVG del patrón matemático codificado
  const svgPattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cg fill='black' font-family='sans-serif' font-weight='bold'%3E%3Ctext x='40' y='120' font-size='140' transform='rotate(-10 40 120)'%3E+%3C/text%3E%3Ctext x='240' y='150' font-size='160' transform='rotate(10 240 150)'%3E-%3C/text%3E%3Ctext x='60' y='350' font-size='150' transform='rotate(5 60 350)'%3Ex%3C/text%3E%3Ctext x='260' y='340' font-size='140' transform='rotate(-15 260 340)'%3E%C3%B7%3C/text%3E%3Ctext x='180' y='80' font-size='100' transform='rotate(20 180 80)'%3E1%3C/text%3E%3Ctext x='20' y='240' font-size='110' transform='rotate(-25 20 240)'%3E2%3C/text%3E%3Ctext x='200' y='250' font-size='90' transform='rotate(15 200 250)'%3E3%3C/text%3E%3C/g%3E%3C/svg%3E")`;

  return (
    <>
      <style>{`
        .st-background-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 0; /* Se queda al fondo */
          pointer-events: none;
          
          /* 1. Fondo base: mezcla muy suave (92% blanco) */
          background-color: color-mix(in srgb, ${color}, white 92%);
        }

        .st-background-pattern {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          
          /* 2. Color del patrón: mezcla media (80% blanco) */
          background-color: color-mix(in srgb, ${color}, white 80%);
          
          /* 3. Máscara SVG */
          -webkit-mask-image: ${svgPattern};
          mask-image: ${svgPattern};
          
          -webkit-mask-size: 400px 400px;
          mask-size: 400px 400px;
          -webkit-mask-repeat: repeat;
          mask-repeat: repeat;
        }
      `}</style>

      <div className={`st-background-container ${className}`}>
        <div className="st-background-pattern"></div>
      </div>
    </>
  );
};