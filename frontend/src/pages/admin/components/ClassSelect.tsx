import {
    IonSelect,
    IonSelectOption,
    IonLabel

} from '@ionic/react';

import './ClassSelect.css';
import { setupIonicReact } from '@ionic/react';
import type { Group } from '../../../lib/api';

setupIonicReact();


interface ClassSelectProps {
    classes: Group[];
    value?: number | null;
    onChange?: (value: number | null) => void;
    label?: string;
    max_width?: string;
    placeholder_text?: string;
}

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
