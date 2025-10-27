import {
    IonContent,
    IonSpinner,
    IonPage,

} from '@ionic/react';

import './LinkProfiles.css';
import { useState } from 'react';
import SimpleHeaderAdmin from './components/SimpleHeaderAdmin';
import { useAuth } from '../../contexts/AuthContext';
import TeacherSelect from './components/TeacherSelect';

export default function LinkProfiles() {

    const { loading } = useAuth();

    // Mostrar spinner mientras carga
    if (loading) {
        return (
            <IonPage>
                <IonContent className="ion-padding ion-text-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IonSpinner name="crescent" />
                </IonContent>
            </IonPage>
        );
    }

    // Redirigir si no hay usuario autenticado
    // if (!user) {
    //     return <Redirect to="/login" />;
    // }


    const [selectedTeacher, setSelectedTeacher] = useState<string>("");

    const teachers = [
        { id: '1', username: 'profesor1' },
        { id: '2', username: 'profesor2' },
        { id: '3', username: 'profesor3' },
    ]

    return (
        <IonPage>
            <SimpleHeaderAdmin adminName="Admin" />
            <IonContent className="ion-padding">
                <TeacherSelect
                    teachers={teachers}
                    value={selectedTeacher}
                    onChange={setSelectedTeacher}
                />
            </IonContent>
        </IonPage>

    );
}
