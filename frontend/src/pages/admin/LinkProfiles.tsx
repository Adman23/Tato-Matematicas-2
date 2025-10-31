import {
    IonContent,
    IonSpinner,
    IonPage,
    IonList,
    IonTitle,
    IonButton,
    IonSearchbar

} from '@ionic/react';

import './LinkProfiles.css';
import { Redirect, useHistory } from 'react-router-dom';
import { useState, useEffect } from 'react';
import SimpleHeaderAdmin from './components/SimpleHeaderAdmin';
import { useAuth } from '../../contexts/AuthContext';
import ClassSelect from './components/ClassSelect';
import UserItem from './components/UserItem';
import { fetchStudents, fetchTeachers, authAPI } from '../../lib/api';
import type { Group } from '../../lib/api';

interface User {
    id: string;
    username: string;
    photo_url: string;
}

export default function LinkProfiles() {

    const { user } = useAuth();

    const [students, setStudents] = useState<User[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [error, setError] = useState('');
    const history = useHistory();



    // Estado para la selección del profesor (mover aquí para mantener orden de Hooks)
    const [selectedTeacher, setSelectedTeacher] = useState<string>("");
    // Flags de carga por recurso para evitar que un fetch independiente apague
    // el spinner global antes de que todos los recursos hayan terminado.
    const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
    const [loadingUsers, setLoadingUsers] = useState<boolean>(true);

    useEffect(() => {
        const loadGroups = async () => {
            try {
                setLoadingGroups(true);
                const groupsData = await authAPI.getGroups();
                setGroups(groupsData);
                setError('');
            } catch (err: any) {
                setError('Error al cargar los grupos');
                console.error(err);
            } finally {
                setLoadingGroups(false);
            }
        };
        loadGroups();
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingUsers(true);

                const teachers = await fetchTeachers();
                console.log("Profesores recibidos:", teachers);
                setTeachers(teachers);

                const students = await fetchStudents();
                console.log("Estudiantes recibidos:", students);
                setStudents(students);

            } catch (error) {
                console.error("Error cargando usuarios:", error);
            } finally {
                setLoadingUsers(false);
            }

        };

        loadData();
    }, []);


    // Mostrar spinner mientras carga
    if (loadingGroups || loadingUsers) {
        return (
            <IonPage>
                <IonContent>
                    <div className='LinkProfiles-spinner'>
                        <IonSpinner name="crescent" />
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    // Redirigir si no hay usuario autenticado
    if (!user || user.role !== 'admin') {
        return <Redirect to="/login" />;
    }

    return (
        <IonPage>
            <SimpleHeaderAdmin adminName="Admin" />
            <IonContent className="ion-padding">
                <ClassSelect
                    classes={groups}
                    value={selectedTeacher}
                    onChange={setSelectedTeacher}
                    label='Clase:'
                    max_width='40%'
                    placeholder_text='Selecciona una clase'
                />

                <div className='LinkProfiles-tables'>
                    <div className='LinkProfiles-table'>
                        <div className='LinkProfiles-searchbar'>
                            <IonTitle className='LinkProfiles-title'>Alumnos</IonTitle>
                            <IonSearchbar placeholder="Buscar alumno"></IonSearchbar>
                        </div>
                        <div className='LinkProfiles-items'>

                            <IonList>
                                {students.map(student => (
                                    <UserItem
                                        key={student.id}
                                        avatar={student.photo_url}
                                        alias={student.username}
                                        classes={[]}
                                    />
                                ))}
                            </IonList>

                        </div>
                    </div>

                    <div className='LinkProfiles-table'>
                        <div className='LinkProfiles-searchbar'>
                            <IonTitle className='LinkProfiles-title'>Profesores</IonTitle>
                            <IonSearchbar placeholder="Buscar profesor"></IonSearchbar>
                        </div>
                        <div className='LinkProfiles-items'>

                            <IonList>
                                {teachers.map(teacher => (
                                    <UserItem
                                        key={teacher.id}
                                        avatar={teacher.photo_url}
                                        alias={teacher.username}
                                        classes={[]}
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
                        onClick={() => history.push('/admin-dashboard')}
                    >
                        Cancelar
                    </IonButton>
                </div>
            </IonContent>
        </IonPage>

    );
}
