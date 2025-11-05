/**
 * @file ClassSelect.tsx
 * @description Componente reutilizable para seleccionar una clase (grupo).
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
 * Props del componente ClassSelect
 * @property classes - Lista de grupos disponibles
 * @property value - Id del grupo seleccionado
 * @property onChange - Callback cuando cambia la selección (recibe id o null)
 * @property label - Etiqueta para el control
 * @property max_width - Estilo inline para limitar ancho
 * @property placeholder_text - Texto placeholder
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
 * Select control para elegir un grupo. Renderiza una lista de opciones
 * proveniente de `classes`.
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
        <div className='teacher-select-container'>
            <IonLabel className='select-teacher-label'>{label}</IonLabel>
            <IonSelect
                className='select-teacher'
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
