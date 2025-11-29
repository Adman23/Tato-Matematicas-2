
import { HexColorPicker } from 'react-colorful';
import { useState } from 'react';
import { PopoverPicker } from './components/PopoverPicker';

export default function Prueba() {
    const [color, setColor] = useState('#aabbcc');

    return (
        <div style={{ padding: '20px' }}>
            <h1>Color Picker Test</h1>
            <HexColorPicker color={color} onChange={setColor} />
            <p>Selected Color: <span style={{ color }}>{color}</span></p>

            <PopoverPicker color={color} onChange={setColor} />
        </div>
        
    );
}
