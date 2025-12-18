import React from 'react';
import { IonButton } from '@ionic/react';
import './GameControlButton.css';

interface GameControlButtonProps {
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onFocus?: () => void;
    onMouseLeave?: () => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    tabIndex?: number;
    disabled?: boolean;
    noBorder?: boolean;
    text?: string;
}

/**
 * @brief Reusable game control button component
 * 
 * A flexible button component for games that displays images or content
 * and adapts to its container's size. The button is transparent and 
 * designed to show only the content inside (typically images).
 * 
 * @param children The content of the button (typically an img element)
 * @param className Additional CSS classes for specific styling
 * @param onClick Click handler function
 * @param disabled Whether the button is disabled
 * @param noBorder If true, removes the border from the button
 * @param text Optional text to display below the image
 * 
 * @example
 * <GameControlButton onClick={handleClick} text="Escuchar">
 *   <img src="/path/to/image.png" alt="Button" className="game-control-button-image" />
 * </GameControlButton>
 */
export const GameControlButton: React.FC<GameControlButtonProps> = ({ 
    children, 
    className = '',
    onClick,
    onMouseEnter,
    onFocus,
    onMouseLeave,
    onKeyDown,
    disabled = false,
    noBorder = false,
    text,
}) => {
    return (
        <IonButton
            role="button"
            fill="clear"
            className={`game-control-button ${noBorder ? 'no-border' : ''} ${className}`}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onFocus={onFocus}
            onMouseLeave={onMouseLeave}
            onKeyDown={onKeyDown}
            disabled={disabled}
            aria-label={text || "Botón de control de juego"}
        >
            <div aria-hidden="true"tabIndex={-1} className="game-control-button-content" style={{ pointerEvents: 'none' }}>
                {children}
                {text && <p className="game-control-button-text">{text}</p>}
            </div>
        </IonButton>
    );
};
