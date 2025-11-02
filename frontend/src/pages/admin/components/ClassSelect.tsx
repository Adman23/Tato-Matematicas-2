import {
    IonSelect,
    IonSelectOption,
    IonLabel

} from '@ionic/react';

import './ClassSelect.css';
import { setupIonicReact } from '@ionic/react';

setupIonicReact();

interface Class {
    id: string;
    name: string;
}

interface ClassSelectProps {
    classes: Class[];
    value?: string;
    onChange?: (value: string) => void;
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
                        {c.name}
                    </IonSelectOption>
                ))}
            </IonSelect>
        </div>
    );
}

export default ClassSelect;
