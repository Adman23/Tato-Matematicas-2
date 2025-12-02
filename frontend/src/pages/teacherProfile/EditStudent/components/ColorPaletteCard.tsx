import React from 'react';
import './ColorPaletteCard.css';
import { IonCard, IonCardContent, IonCardHeader } from '@ionic/react';
import { type Palette } from "../types/palette.ts";
import BubbleDemo from './BubbleDemo';
import { Button3Dtext } from '../../../global_components/PushableButtons.tsx';

/**
 * Props for the ColorCard component.
 *
 * @remarks
 * A ColorCard represents a single selectable color palette option in the configuration of colors
 *
 * @property palette - The colors of the palette this card is representing
 * @property onclick - The action when being click
 */

type Props = {

    palette: Palette;
    isSelected?: boolean;
    onClick?: (palette: Palette) => void;
};

/**
 * Colorcard component: renders a selectable card.
 *
 * @example
 * <ColorPaletteCard palette={id:1, colors[-,-,-,-]} onClick={(v) => console.log(v)} />
 *
 * @param props - See {@link Props}
 */
const ColorPaletteCard: React.FC<Props> = ({
    palette,
    isSelected,
    onClick
}) => {

    //Definition of the colors we are going to use in the example card
    const [headerBg, headerText, contentBg, contentText, buttonBg,
        bubbleBg, bubbleSelected] = palette.colors;

    //Definition of the colors from the bubbles examples
    const bubbleColors = [bubbleBg, bubbleSelected];

    return(
        
        <IonCard  button onClick={() => onClick?.(palette)}
            className={isSelected ? "ColorPaletteCard-studentEditColor-IonCardSelected" : "ColorPaletteCard-studentEditColor-IonCard"}>
            <IonCardHeader className='ColorPaletteCard-studentEditColor-IonCardHeader'
            style={{
                background: headerBg,
                color: headerText
            }}>Título
            <Button3Dtext className='Boton-header_ColorPaletteCard' color={buttonBg}><span></span></Button3Dtext>
            </IonCardHeader>
            <IonCardContent className='ColorPaletteCard-studentEditColor-IonCardContent'
            style={{
                background: contentBg,
                color: contentText
            }}>Texto de ejemplo
            <BubbleDemo colors = {bubbleColors}></BubbleDemo>
            </IonCardContent>
            
        </IonCard>

    );
    
};

export default ColorPaletteCard;