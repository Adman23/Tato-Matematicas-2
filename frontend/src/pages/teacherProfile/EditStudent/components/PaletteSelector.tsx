import React from 'react';
import { useState } from 'react';
import { type Palette } from "../types/palette.ts";
import ColorPaletteCard from './ColorPaletteCard.tsx';
import "./PaletteSelector.css"

/**
 * Props for the PaletteSelector component.
 *
 * @remarks
 * A Selector that displays different predetermined palettes, they can be
 * color palettes, sound palettes, text-font... 
 *
 * @property palette - an array of palettes
 * @property onSelect - The action when Selecting a palette
 */

type Props = {

    palettes: Palette[];
    onSelect?: (palette: Palette) => void;
};

/**
 * PaletteSelector component: renders a selector for the cards.
 *
 * @example
 * <PaletteSelector palettes=[] onSelect={() => } />
 *
 * @param props - See {@link Props}
 */
const PaletteSelector: React.FC<Props> = ({
    palettes,
    onSelect
}) => {

    const [selectedId, setSelectedId] = useState<number | null>(null);

    return(
        
        <div className='PaletteSelector-container'>
            {palettes.map((p) =>
                <ColorPaletteCard
                    key={p.id}
                    isSelected={p.id === selectedId}
                    palette={p}
                    onClick={() => {
                        setSelectedId(p.id);
                        onSelect?.(p);
                    }}
                />
            )}
        </div>

    );
    
};

export default PaletteSelector;