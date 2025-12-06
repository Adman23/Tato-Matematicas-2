import React from 'react';
import { IonButton } from '@ionic/react';
import './SimpleButton.css';

interface SimpleButtonProps extends React.ButtonHTMLAttributes<HTMLIonButtonElement> {
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
}

/**
 * @brief Simple button component with image and text, styled like Dashboard buttons
 * @param children The content of the button (image and text elements)
 * @param className Additional CSS classes
 * @param onClick Click handler
 * @param props Any standard HTML button attributes
 */
export const SimpleButton: React.FC<SimpleButtonProps> = ({ 
    children, 
    className = '',
    onClick,
    ...props 
}) => {
return (
    <div className="simple-button-wrapper">
        <IonButton
            className={`simple-button ${className}`}
            onClick={onClick}
            {...props}
        >
            <div className="simple-button-content">
            {children}
            </div>
        </IonButton>
    </div>
);
};
