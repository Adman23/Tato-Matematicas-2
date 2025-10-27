import {
    IonItem,
    IonSelect,
    IonSelectOption,
    IonLabel

} from '@ionic/react';

import './TeacherSelect.css';
import { setupIonicReact } from '@ionic/react';

setupIonicReact();

interface Teacher {
    id: string;
    username: string;
}

interface TeacherSelectProps {
    teachers: Teacher[];
    value?: string;
    onChange?: (value: string) => void;
    label?: string;
}

const TeacherSelect: React.FC<TeacherSelectProps> = ({
    teachers,
    value,
    onChange,
    label = "Profesor:",
}) => {

    return (
        <div className='teacher-select-container'>
            <IonLabel className='select-teacher-label'>{label}</IonLabel>
            <IonSelect
                className='select-teacher'
                value={value}
                placeholder="Selecciona un profesor"
                onIonChange={e => onChange && onChange(e.detail.value)}
            >
                {teachers.map(teacher => (
                    <IonSelectOption key={teacher.id} value={teacher.id}>
                        {teacher.username}
                    </IonSelectOption>
                ))}
            </IonSelect>
        </div>
    );
}

export default TeacherSelect;
