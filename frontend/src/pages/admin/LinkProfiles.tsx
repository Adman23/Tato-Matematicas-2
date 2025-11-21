/**
 * Resumen Funcional.
 *
 * Pantalla de administración para vincular perfiles (alumnos y profesores) a
 * clases (grupos). Proporciona interfaces para buscar, seleccionar, asignar y
 * desasignar usuarios a grupos, así como para recargar los datos desde el
 * backend.
 *
 * Flujo de ejecución.
 *
 * 1. Al montar el componente carga la lista de grupos (`authAPI.getGroups`) y
 *    las listas de profesores y alumnos (`fetchTeachersWithGroups`,
 *    `fetchStudentsWithGroups`). Usa flags por recurso para controlar spinners
 *    independientes (`loadingGroups`, `loadingUsers`).
 * 2. El usuario puede filtrar la lista de alumnos/profesores mediante barras
 *    de búsqueda (client-side). Puede seleccionar múltiples usuarios.
 * 3. `handleAssign` asigna los usuarios seleccionados a la clase escogida; si
 *    hay errores muestra mensajes y refresca las listas tras éxito/fracaso.
 * 4. `handleUnassign` desasigna los seleccionados (con validaciones similares).
 *
 * Contrato (resumen):
 * - Entradas: interacción del usuario con la UI (selección, búsqueda, botones).
 * - Salidas: llamadas a las APIs de backend para asignar/desasignar y actualización
 *   de los estados `students`, `teachers`, `groups`.
 * - Errores: se muestran en pantalla mediante el estado `_error`.
 *
 * @param {void} No recibe props; usa el contexto de autenticación y hooks internos.
 * @returns {JSX.Element} Componente que renderiza la UI de vinculación de perfiles.
 *
 * @example Ejemplo de uso
 *
 * ```tsx
 * <Route path="/admin-dashboard/link-profiles" component={LinkProfiles} />
 * ```
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

    const { user, loadingAuth: loading } = useAuth();

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

    /**
     * Resumen Funcional.
     *
     * Efecto que carga la lista de grupos desde el backend cuando el componente
     * se monta o cuando cambia el estado de autenticación.
     *
     * Flujo de ejecución.
     *
     * - Espera a que el `AuthProvider` haya terminado (si `loading` es true
     *   sale temprano).
     * - Si no hay usuario autenticado o no es admin, desactiva la flag de
     *   carga local y no realiza la petición.
     * - Llama a `authAPI.getGroups()` y guarda la respuesta en `groups`.
     * - Gestiona errores actualizando `_error` y siempre limpia la flag
     *   `loadingGroups` al finalizar.
     *
     * @param {void}
     * @returns {void}
     *
     * @example
     * ```ts
     * // Ejecutado automáticamente al montar el componente
     * ```
     */
    useEffect(() => {
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

    /**
     * Resumen Funcional.
     *
     * Efecto responsable de cargar (o recargar) la lista de profesores y
     * estudiantes. Se ejecuta al montar el componente y cuando cambia
     * `selectedClass` (es decir, cuando el admin cambia la clase objetivo).
     *
     * Flujo de ejecución.
     *
     * - Si `loading` del AuthProvider es true, sale temprano.
     * - Si no hay usuario o no es admin, desactiva la flag `loadingUsers`.
     * - Llama a `fetchTeachersWithGroups()` y `fetchStudentsWithGroups()` y
     *   actualiza los estados `teachers` y `students` respectivamente.
     * - Maneja errores con console.error y siempre limpia la flag de carga.
     *
     * Consideraciones de rendimiento/UX:
     * - Esta carga se realiza en cliente y refresca toda la lista; para
     *   datasets grandes se podría paginar o aplicar búsquedas server-side.
     *
     * @param {void}
     * @returns {void}
     *
     * @example
     * ```ts
     * // Ejecutado automáticamente; no llamar manualmente
     * ```
     */
    useEffect(() => {
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
     * Resumen Funcional.
     *
     * Asigna los alumnos y/o profesores seleccionados a la clase actualmente
     * seleccionada (`selectedClass`). Valida entradas, llama a las APIs de
     * asignación y refresca las listas locales tras la operación.
     *
     * Flujo de ejecución.
     *
     * - Si no hay `selectedClass` o no hay usuarios seleccionados, establece
     *   `_error` y aborta.
     * - Activa la flag `loadingUsers` y llama a `assignStudentsToGroup` y/o
     *   `assignTeachersToGroup` según corresponda.
     * - Tras éxito, recarga los datos (`fetchStudentsWithGroups`,
     *   `fetchTeachersWithGroups`) y limpia la selección.
     * - En caso de error registra en consola y actualiza `_error`.
     *
     * @param {void}
     * @returns {Promise<void>} Promesa que se resuelve al completar la operación.
     *
     * @example
     * ```ts
     * await handleAssign();
     * ```
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
     * Resumen Funcional.
     *
     * Desasigna los alumnos y/o profesores seleccionados de sus clases. Valida
     * la selección y clase (cuando procede), llama a las APIs de desasignación
     * y refresca las listas.
     *
     * Flujo de ejecución.
     *
     * - Si no hay usuarios seleccionados establece `_error` y aborta.
     * - Si hay profesores seleccionados, exige que `selectedClass` esté
     *   definida.
     * - Llama a `unassignStudentsFromGroup` y/o `unassignTeachersFromGroup`.
     * - Refresca `students` y `teachers`, limpia la selección y gestiona errores.
     *
     * @param {void}
     * @returns {Promise<void>} Promesa que se resuelve al completar la operación.
     *
     * @example
     * ```ts
     * await handleUnassign();
     * ```
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

    // Preparar la lista de estudiantes a mostrar: filtrar por query y, si hay
    // una clase seleccionada, ordenar para que los alumnos que pertenezcan a
    // esa clase aparezcan primero. No mutamos `students`.
    const displayedStudents = (() => {
        const filtered = studentQuery === '' ? students : students.filter(s => {
            const q = studentQuery.toLowerCase();
            const uname = (s.username || '').toLowerCase();
            const inUsername = uname.includes(q);
            const inGroup = (s.group && s.group.alias) ? (s.group.alias || '').toLowerCase().includes(q) : false;
            return inUsername || inGroup;
        });

        if (selectedClass === null) return filtered;

        return [...filtered].sort((a, b) => {
            const aIn = a.group?.id === selectedClass ? 0 : 1;
            const bIn = b.group?.id === selectedClass ? 0 : 1;
            if (aIn !== bIn) return aIn - bIn; // los que pertenecen a la clase van primero
            // Fallback: ordenar por username para consistencia
            return (a.username || '').localeCompare(b.username || '');
        });
    })();

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
                                {displayedStudents.map(student => (
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
