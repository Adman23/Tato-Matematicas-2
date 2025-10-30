import {
    IonContent,
    IonSpinner,
    IonPage,
    IonList,
    IonTitle,
    IonButton

} from '@ionic/react';

import './LinkProfiles.css';
import { useState } from 'react';
import SimpleHeaderAdmin from './components/SimpleHeaderAdmin';
import { useAuth } from '../../contexts/AuthContext';
import ClassSelect from './components/ClassSelect';
import UserItem from './components/UserItem';

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

    const classes = [
        { id: '1', name: 'Clase A' },
        { id: '2', name: 'Clase B' },
        { id: '3', name: 'Clase C' },
    ]

    const students = [
        {
            avatar: "https://ionicframework.com/docs/img/demos/avatar.svg",
            alias: "Alias",
            classes: ['Clase B']
        },
        {
            avatar: "https://ionicframework.com/docs/img/demos/avatar.svg",
            alias: "Alias",
            classes: ['Clase A']
        },
        {
            avatar: "https://ionicframework.com/docs/img/demos/avatar.svg",
            alias: "Alias",
            classes: ['Clase A']
        },
        {
            avatar: "https://ionicframework.com/docs/img/demos/avatar.svg",
            alias: "Alias",
            classes: ['-']
        },
        // agrega más estudiantes o tráelos del backend
    ];

    const teachers = [
        {
            avatar: "https://ionicframework.com/docs/img/demos/avatar.svg",
            alias: "Alias",
            classes: ['Clase B']
        },
        {
            avatar: "https://ionicframework.com/docs/img/demos/avatar.svg",
            alias: "Alias",
            classes: ['Clase A', 'Clase B']
        },
        {
            avatar: "https://ionicframework.com/docs/img/demos/avatar.svg",
            alias: "Alias",
            classes: ['Clase A']
        },
        {
            avatar: "https://ionicframework.com/docs/img/demos/avatar.svg",
            alias: "Alias",
            classes: ['-']
        },
        // agrega más estudiantes o tráelos del backend
    ];

    return (
        <IonPage>
            <SimpleHeaderAdmin adminName="Admin" />
            <IonContent className="ion-padding">
                <ClassSelect
                    classes={classes}
                    value={selectedTeacher}
                    onChange={setSelectedTeacher}
                    label='Clase:'
                    max_width='30%'
                    placeholder_text='Selecciona una clase'
                />

                <div className='LinkProfiles-tables'>
                    <div className='LinkProfiles-table'>
                        <IonTitle className='LinkProfiles-title'>Alumnos</IonTitle>
                        <div className='LinkProfiles-items'>

                            <IonList>
                                {students.map(student => (
                                    <UserItem
                                        avatar={student.avatar}
                                        alias={student.alias}
                                        classes={student.classes}
                                    />
                                ))}
                            </IonList>

                        </div>
                    </div>

                    <div className='LinkProfiles-table'>
                        <IonTitle className='LinkProfiles-title'>Profesores</IonTitle>
                        <div className='LinkProfiles-items'>

                            <IonList>
                                {teachers.map(teacher => (
                                    <UserItem
                                        avatar={teacher.avatar}
                                        alias={teacher.alias}
                                        classes={teacher.classes}
                                    />
                                ))}
                            </IonList>

                        </div>
                    </div>
                </div>

                <div className='LinkProfiles-buttons'>
                    <IonButton
                        expand="block"
                        type="submit"
                        className='LinkProfiles-button'
                    //onClick={() => history.push('/admin-teacher-management')}
                    >
                        Asignar
                    </IonButton>

                    <IonButton
                        expand="block"
                        type="submit"
                        className='LinkProfiles-button'
                    //onClick={() => history.push('/admin-teacher-management')}
                    >
                        Cancelar
                    </IonButton>
                </div>
            </IonContent>
        </IonPage>

    );
}
