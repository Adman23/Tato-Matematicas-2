/**
 * !! NEW FILE
 * 	-> Component that every page can use
 * 	-> One of the buttons that will be used
 * 
 */

import React from 'react';

interface button3DtextProps {
onClick?: () => void;
className?: string;
children: React.ReactNode;
color?:string;
}

/**
 * @brief Button with 3D css, that uses the css variables and you can change the content
 * 
 * @information btn-icon y btn-text are the classes for span text and img elements in the content
 * @param children The content of the button, it should be a span and a img elements
 * @param onClick The function that happens when you click 
 * @param className if you need to add more css to the button
 * @returns 
 */
export const Button3Dtext: React.FC<button3DtextProps> = ({ 
onClick, 
children, 
className = '', 
color = 'var(--bubble-bg)'
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
				margin-left: clamp(10px, 2vw, 20px);
				flex-shrink: 0;
				/* Asegura que el botón no tenga el estilo default de iOS/Android */
				-webkit-tap-highlight-color: transparent;
				user-select: none;
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
				background-color: ${color};
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
				background: ${color}; /* Color dinámico o default */
				padding: clamp(8px, 1.5vh, 16px) clamp(16px, 3vw, 42px);
				color: white;
				font-weight: 700;
				transform: translateY(-6px);
				transition: transform 100ms cubic-bezier(0.3, 0.7, 0.4, 1), background-color 250ms;
			}

			/* Contenido del botón */
			.pushable-button .button-content {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: clamp(10px, 2vw, 20px);
			}

			/* Clases utilitarias internas para el contenido (opcional si las pasas como hijos) */
			.pushable-button .btn-text {
				font-size: clamp(0.9rem, 3vmin, 1.8rem);
				white-space: nowrap;
			}

			.pushable-button .btn-icon {
				height: clamp(30px, 8vh, 70px);
				width: auto;
				object-fit: contain;
				filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.2));
			}

			/* --- Animaciones de interacción --- */
			
			/* Hover (Solo si el dispositivo soporta hover para evitar sticky hover en móbiles) */
			@media (hover: hover) {
				.pushable-button:hover .front {
					transform: translateY(-8px);
					filter: brightness(1.1);
				}
				
				.pushable-button:hover .shadow {
					transform: translateY(8px);
					filter: blur(6px);
				}
			}

			/* Active (Click/Tap) */
			.pushable-button:active .front {
				transform: translateY(-2px);
			}

			.pushable-button:active .shadow {
				transform: translateY(2px);
				filter: blur(2px);
			}
			
			/* Focus visible para accesibilidad */
			.pushable-button:focus:not(:focus-visible) {
				outline: none;
			}
		`}</style>

		<button className={`pushable-button ${className}`} onClick={onClick} type="button">
			<span className="shadow"></span>
			<span className="edge"></span>
			<span className="front">
				<div className="button-content">
					{children}
				</div>
			</span>
		</button>
	</>
);
};
