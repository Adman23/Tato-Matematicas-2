/**
 * @file ClassSelect.tsx
 * @description Component for selecting a class (group) in the admin panel.
 */

import {
    IonSelect,
    IonSelectOption,
    IonLabel

} from '@ionic/react';

import './ClassSelect.css';
import { setupIonicReact } from '@ionic/react';
import type { Group } from '../../../lib/api';

setupIonicReact();


/**
 * Props of the ClassSelect component
 * @property classes - List of available groups
 * @property value - Id of the selected group
 * @property onChange - Callback when the selection changes (receives id or null)
 * @property label - Label for the control
 * @property max_width - Inline style to limit width
 * @property placeholder_text - Placeholder text
 */
interface ClassSelectProps {
    classes: Group[];
    value?: number | null;
    onChange?: (value: number | null) => void;
    label?: string;
    max_width?: string;
    placeholder_text?: string;
}

/**
 * Select control to choose a group. Renders a list of options
 * coming from `classes`.
 */
/**
 * Functional Summary.
 *
 * Reusable control to select a class (group). Renders an
 * `IonSelect` with options provided through `classes`.
 *
 * Execution flow.
 *
 * - Displays a label and a select control with the options.
 * - When the selection changes, it invokes `onChange` with the selected id or
 *   `null` if there is no selection.
 *
 * @param {ClassSelectProps} props - Props of the component (classes, value, onChange, label, max_width, placeholder_text).
 * @returns {JSX.Element} Class select control.
 *
 * @example
 * ```tsx
 * <ClassSelect classes={groups} value={1} onChange={(v)=>setClass(v)} />
 * ```
 */
const ClassSelect: React.FC<ClassSelectProps> = ({
    classes,
    value,
    onChange,
    label,
    max_width = "50%",
    placeholder_text = "Selecciona un usuario"
}) => {

    return (
        <div className='class-select-container'>
            <IonLabel className='select-class-label'>{label}</IonLabel>
            <IonSelect
                className='select-class'
                value={value}
                placeholder={placeholder_text}
                onIonChange={e => onChange && onChange(e.detail.value)}
                style={{ maxWidth: max_width }}
            >
                {classes.map(c => (
                    <IonSelectOption key={c.id} value={c.id}>
                        {c.alias}
                    </IonSelectOption>
                ))}
            </IonSelect>
        </div>
    );
}

export default ClassSelect;
