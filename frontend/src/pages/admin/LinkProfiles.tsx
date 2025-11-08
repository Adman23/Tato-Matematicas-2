/**
 * @file LinkProfiles.tsx
 * @description Página de administración para vincular perfiles (alumnos y profesores) a clases.
 * Provee UI para listar, buscar, seleccionar y (des)asignar usuarios a grupos.
 *
 * Componente principal: LinkProfiles
 */

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
import { authAPI, fetchTeachersWithGroups, fetchStudentsWithGroups, assignStudentsToGroup, assignTeachersToGroup, unassignStudentsFromGroup, unassignTeachersFromGroup } from '../../lib/api';
import type { Group } from '../../lib/api';

/**
 * Representa un usuario en la UI de selección (alumno o profesor).
 * - `groups` se usa para profesores (lista de grupos asociados).
 * - `group` se usa para estudiantes (grupo asignado único).
 */
interface User {
    /** UUID del usuario */
    id: string;
    /** Nombre de usuario (extracto del email) */
    username: string;
    /** URL de la foto de perfil */
    photo_url: string;
    /** Grupos asociados (solo profesores) */
    groups?: Group[];
    /** Grupo asignado (solo estudiantes) */
    group?: Group | null;
}

/**
 * Componente principal de la pantalla "Link Profiles".
 * Permite:
 * - Cargar la lista de grupos, profesores y alumnos.
 * - Buscar (filtrar) por nombre/alias de grupo en cliente.
 * - Seleccionar varios usuarios y asignarlos/desasignarlos a un grupo.
 *
 * No recibe props; obtiene el usuario actual del contexto de autenticación.
 */
export default function LinkProfiles() {

    const { user, loading } = useAuth();

    const [students, setStudents] = useState<User[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [_error, setError] = useState('');
    const [studentQuery, setStudentQuery] = useState<string>('');
    const [teacherQuery, setTeacherQuery] = useState<string>('');
    const history = useHistory();



    // Estado para la selección de la clase (id del grupo)
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    // Estado para los estudiantes seleccionados (ids)
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
    // Flags de carga por recurso para evitar que un fetch independiente apague
    // el spinner global antes de que todos los recursos hayan terminado.
    const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
    const [loadingUsers, setLoadingUsers] = useState<boolean>(true);

    useEffect(() => {
        /**
         * Carga la lista de grupos desde el backend y actualiza el estado `groups`.
         * Ejecutado una vez al montar el componente.
         */
        // Esperar a que el AuthProvider termine de rehidratar
        if (loading) return;
        // Solo cargar grupos si es admin autenticado
        if (!user || user.role !== 'admin') {
            setLoadingGroups(false);
            return;
        }

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
    }, [loading, user]);

    // Carga (o recarga) de usuarios. Se reruneará en mount y cada vez que
    // cambie `selectedClass`, tal y como pide el requisito.
    useEffect(() => {
        /**
         * Carga los usuarios (profesores y estudiantes) desde el backend y actualiza
         * los estados `teachers` y `students`.
         * Ejecutado al montar el componente y cuando cambia `selectedClass`.
         */
        // Esperar a que el AuthProvider termine de rehidratar
        if (loading) return;
        // Solo cargar usuarios si es admin autenticado
        if (!user || user.role !== 'admin') {
            setLoadingUsers(false);
            return;
        }

        const loadData = async () => {
            try {
                setLoadingUsers(true);

                const teachers = await fetchTeachersWithGroups();
                console.log("Profesores recibidos:", teachers);
                setTeachers(teachers);

                const students = await fetchStudentsWithGroups();
                console.log("Estudiantes recibidos:", students);
                setStudents(students);

            } catch (error) {
                console.error("Error cargando usuarios:", error);
            } finally {
                setLoadingUsers(false);
            }

        };

        loadData();
    }, [loading, user]);

    /**
     * Asigna los usuarios seleccionados a la clase actualmente seleccionada.
     * - Valida que exista `selectedClass`.
     * - Llama a las APIs de asignación y refresca las listas.
     */
    const handleAssign = async () => {
        if (!selectedClass) {
            setError('Selecciona una clase');
            return;
        }

        if (selectedStudentIds.length === 0 && selectedTeacherIds.length === 0) {
            setError('Selecciona al menos un alumno o profesor');
            return;
        }

        try {
            setLoadingUsers(true);
            if (selectedStudentIds.length > 0) {
                await assignStudentsToGroup(selectedClass, selectedStudentIds);
            }
            if (selectedTeacherIds.length > 0) {
                await assignTeachersToGroup(selectedClass, selectedTeacherIds);
            }
            // refrescar la lista de estudiantes para mostrar cambios
            const refreshedStudents = await fetchStudentsWithGroups();
            const refreshedTeachers = await fetchTeachersWithGroups();
            setStudents(refreshedStudents);
            setTeachers(refreshedTeachers);
            // limpiar selección
            setSelectedStudentIds([]);
            setSelectedTeacherIds([]);
            setError('');
        } catch (err) {
            console.error('Error asignando alumnos o profesores:', err);
            setError('Error al asignar alumnos o profesores');
        } finally {
            setLoadingUsers(false);
        }
    };

    /**
     * Desasigna los usuarios seleccionados de sus clases (o del grupo indicado para profesores).
     * - Llama a las APIs de desasignación y refresca las listas.
     */
    const handleUnassign = async () => {

        if (selectedStudentIds.length === 0 && selectedTeacherIds.length === 0) {
            setError('Selecciona al menos un alumno o profesor');
            return;
        }

        if (selectedTeacherIds.length > 0 && !selectedClass) {
            setError('Selecciona una clase para desasignar profesores');
            return;
        }

        try {
            setLoadingUsers(true);
            if (selectedStudentIds.length > 0) {
                await unassignStudentsFromGroup(selectedStudentIds);
            }
            if (selectedTeacherIds.length > 0 && selectedClass) {
                await unassignTeachersFromGroup(selectedClass, selectedTeacherIds);
            }
            // refrescar la lista de estudiantes para mostrar cambios
            const refreshedStudents = await fetchStudentsWithGroups();
            const refreshedTeachers = await fetchTeachersWithGroups();
            setStudents(refreshedStudents);
            setTeachers(refreshedTeachers);
            // limpiar selección
            setSelectedStudentIds([]);
            setSelectedTeacherIds([]);
            setError('');
        } catch (err) {
            console.error('Error desasignando alumnos o profesores:', err);
            setError('Error al desasignar alumnos o profesores');
        } finally {
            setLoadingUsers(false);
        }
    };

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
            <SimpleHeaderAdmin adminName={user.username} />
            <IonContent className="ion-padding">
                <ClassSelect
                    classes={groups}
                    value={selectedClass}
                    onChange={setSelectedClass}
                    label='Clase:'
                    max_width='40%'
                    placeholder_text='Selecciona una clase'
                />

                <div className='LinkProfiles-tables'>
                    <div className='LinkProfiles-table'>
                        <div className='LinkProfiles-searchbar'>
                            <IonTitle className='LinkProfiles-title'>Alumnos</IonTitle>
                            <IonSearchbar
                                placeholder="Buscar alumno"
                                value={studentQuery}
                                onIonInput={(e) => setStudentQuery(e.detail.value ?? '')}
                                onIonClear={() => setStudentQuery('')}
                                onIonCancel={() => setStudentQuery('')}
                            />
                        </div>
                        <div className='LinkProfiles-items'>
                            <IonList>
                                {(
                                    (studentQuery === '' ? students : students.filter(s => {
                                        const q = studentQuery.toLowerCase();
                                        const uname = (s.username || '').toLowerCase();
                                        const inUsername = uname.includes(q);
                                        const inGroup = (s.group && s.group.alias) ? (s.group.alias || '').toLowerCase().includes(q) : false;
                                        return inUsername || inGroup;
                                    }))
                                ).map(student => (
                                    <UserItem
                                        key={student.id}
                                        avatar={student.photo_url}
                                        alias={student.username}
                                        classes={student.group ? [student.group.alias] : []}
                                        highlight={selectedClass !== null && student.group?.id === selectedClass}
                                        isChecked={selectedStudentIds.includes(student.id)}
                                        onCheckChange={(checked) => {
                                            setSelectedStudentIds(prev => {
                                                if (checked) {
                                                    return [...prev, student.id];
                                                }
                                                return prev.filter(id => id !== student.id);
                                            });
                                        }}
                                    />
                                ))}
                            </IonList>

                        </div>
                    </div>

                    <div className='LinkProfiles-table'>
                        <div className='LinkProfiles-searchbar'>
                            <IonTitle className='LinkProfiles-title'>Profesores</IonTitle>
                            <IonSearchbar
                                placeholder="Buscar profesor"
                                value={teacherQuery}
                                onIonInput={(e) => setTeacherQuery(e.detail.value ?? '')}
                                onIonClear={() => setTeacherQuery('')}
                                onIonCancel={() => setTeacherQuery('')}
                            />
                        </div>
                        <div className='LinkProfiles-items'>

                            <IonList>
                                {(
                                    // Filter teachers client-side (by username and group alias).
                                    // Use debounced query for better UX.
                                    (teacherQuery === '' ? teachers : teachers.filter(t => {
                                        const q = teacherQuery.toLowerCase();
                                        const uname = (t.username || '').toLowerCase();
                                        const inUsername = uname.includes(q);
                                        const inGroups = (t.groups || []).some(g => (g.alias || '').toLowerCase().includes(q));
                                        return inUsername || inGroups;
                                    }))
                                ).map(teacher => (
                                    <UserItem
                                        key={teacher.id}
                                        avatar={teacher.photo_url}
                                        alias={teacher.username}
                                        classes={teacher.groups?.map(g => g.alias) || []}
                                        highlight={selectedClass !== null && teacher.groups?.some(g => g.id === selectedClass)}
                                        isChecked={selectedTeacherIds.includes(teacher.id)}
                                        onCheckChange={(checked) => {
                                            setSelectedTeacherIds(prev => {
                                                if (checked) {
                                                    return [...prev, teacher.id];
                                                }
                                                return prev.filter(id => id !== teacher.id);
                                            });
                                        }}
                                    />
                                ))}
                            </IonList>

                        </div>
                    </div>
                </div>

                <div className='LinkProfiles-buttons'>
                    <IonButton
                        expand="block"
                        type="button"
                        className='LinkProfiles-button'
                        onClick={handleAssign}
                        disabled={!(
                            selectedClass &&
                            (
                                (selectedStudentIds?.length ?? 0) > 0 ||
                                (selectedTeacherIds?.length ?? 0) > 0
                            )
                        )}
                    >
                        Matricular
                    </IonButton>

                    <IonButton
                        expand="block"
                        type="button"
                        className='LinkProfiles-button'
                        onClick={handleUnassign}
                        disabled={!(
                            (
                                (selectedStudentIds?.length ?? 0) > 0 ||
                                (selectedTeacherIds?.length ?? 0) > 0
                            )
                        )}
                    >
                        Desmatricular
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
