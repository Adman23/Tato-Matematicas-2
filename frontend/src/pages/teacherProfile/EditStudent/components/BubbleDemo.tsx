import React from 'react';
import ExampleBubble from './ExampleBubble';

/**
 * BubbleDemo component: renders a group of 4 bubbles, each one with a different property
 * in order to visualize the colors used in each state.
 *
 * @example
 * <BubbleDemo colors=[] />
 *
 * @param colors 
 */
const BubbleDemo: React.FC <{colors: string[] }> = ({ colors }) => {
    return (

        <div
            style={{
                "--bubble-demo-bg": colors[0],
                "--bubble-demo-selected-bg": colors[1]
            } as React.CSSProperties}
        >
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '1rem' }}>
                {/* Base */}
                <ExampleBubble value={1} className='bubble-demo' />
                
                {/* Selected */}
                <ExampleBubble value={3} isSelected className='bubble-demo' />

            </div>
        </div>
        
    );
};

export default BubbleDemo;
