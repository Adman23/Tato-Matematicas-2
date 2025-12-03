/**
 * Functional summary.
 *
 * Administration screen for linking profiles (students and teachers) to
 * classes (groups). Provides interfaces to search, select, assign, and
 * unassign users to groups, as well as to reload data from the
 * backend.
 *
 * Execution flow.
 *
 * 1. On component mount, loads the list of groups (`authAPI.getGroups`) and
 *    the lists of teachers and students (`fetchTeachersWithGroups`,
 *    `fetchStudentsWithGroups`). Uses flags per resource to control independent spinners
 *    (`loadingGroups`, `loadingUsers`).
 * 2. The user can filter the list of students/teachers using search bars (client-side). Multiple users can be selected.
 * 3. `handleAssign` assigns the selected users to the chosen class; if
 *    there are errors, it shows messages and refreshes the lists after success/failure.
 * 4. `handleUnassign` unassigns the selected users (with similar validations).
 *
 * Contract (summary):
 * - Inputs: user interaction with the UI (selection, search, buttons).
 * - Outputs: calls to backend APIs to assign/unassign and update
 *   the states `students`, `teachers`, `groups`.
 * - Errors: displayed on screen using the `_error` state.
 *
 * @param {void} Does not receive props; uses authentication context and internal hooks.
 * @returns {JSX.Element} Component that renders the link profiles UI.
 *
 * @example Example usage
 *
 * ```tsx
 * <Route path="/admin/dashboard/link-profiles" component={LinkProfiles} />
 * ```
 */

import {
    IonContent,
    IonSpinner,
    IonPage,
    IonList,
    IonTitle,
    IonButton,
    IonSearchbar,
    useIonRouter,

} from '@ionic/react';
import { setupIonicReact } from '@ionic/react';
setupIonicReact();

import './LinkProfiles.css';
import { Redirect } from 'react-router-dom';
import { useState, useEffect } from 'react';
import SimpleHeaderAdmin from './components/SimpleHeaderAdmin';
import { useAuth } from '../../contexts/AuthContext';
import ClassSelect from './components/ClassSelect';
import UserItem from './components/UserItem';
import { authAPI, fetchTeachersWithGroups, fetchStudentsWithGroups, assignStudentsToGroup, assignTeachersToGroup, unassignStudentsFromGroup, unassignTeachersFromGroup } from '../../lib/api';
import type { Group } from '../../lib/api';

/**
 * Represents a user in the selection UI (student or teacher).
 * - `groups` is used for teachers (list of associated groups).
 * - `group` is used for students (single assigned group).
 */
interface User {
    /** UUID of the user */
    id: string;
    /** Username (extracted from email) */
    username: string;
    /** URL of the profile picture */
    photo_url: string;
    /** Associated groups (teachers only) */
    groups?: Group[];
    /** Assigned group (students only) */
    group?: Group | null;
}

/**
 * Main component for the "Link Profiles" screen.
 * Allows:
 * - Loading the list of groups, teachers, and students.
 * - Searching (filtering) by group name/alias on the client side.
 * - Selecting multiple users and assigning/unassigning them to a group.
 *
 * Does not receive props; obtains the current user from the authentication context.
 */
export default function LinkProfiles() {

    const { user, loadingAuth: loading } = useAuth();

    const [students, setStudents] = useState<User[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [_error, setError] = useState('');
    const [studentQuery, setStudentQuery] = useState<string>('');
    const [teacherQuery, setTeacherQuery] = useState<string>('');
    const router = useIonRouter();



    // State for the class selection (group id)
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    // State for selected students (ids)
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
    // Loading flags per resource to prevent an independent fetch from turning off
    // the global spinner before all resources have finished.
    //const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
    const [loadingUsers, setLoadingUsers] = useState<boolean>(true);

    /**
     * Functional Summary.
     *
     * Effect that loads the list of groups from the backend when the component
     * mounts or when the authentication state changes.
     *
     * Execution flow.
     *
     * - Waits for the `AuthProvider` to finish (if `loading` is true, exits early).
     * - If there is no authenticated user or the user is not an admin, disables the local loading flag and does not make the request.
     * - Calls `authAPI.getGroups()` and stores the response in `groups`.
     * - Handles errors by updating `_error` and always clears the `loadingGroups` flag at the end.
     *
     * @param {void}
     * @returns {void}
     *
     * @example
     * ```ts
     * // Automatically executed when the component mounts
     * ```
     */
    useEffect(() => {
        // Wait for the AuthProvider to finish rehydrating
        if (loading) return;
        // Only load groups if the user is an authenticated admin
        if (!user || user.role !== 'admin') {
            //setLoadingGroups(false);
            return;
        }

        const loadGroups = async () => {
            try {
                //setLoadingGroups(true);
                const groupsData = await authAPI.getGroups();
                setGroups(groupsData);
                setError('');
            } catch (err: any) {
                setError('Error al cargar los grupos');
                console.error(err);
            } finally {
                //setLoadingGroups(false);
            }
        };
        loadGroups();
    }, [loading, user]);

    /**
     * Functional Summary.
     *
     * Effect responsible for loading (or reloading) the list of teachers and
     * students. It runs when the component mounts and when `selectedClass`
     * changes (i.e., when the admin changes the target class).
     *
     * Execution flow.
     *
     * - If `loading` from the AuthProvider is true, exits early.
     * - If there is no user or the user is not an admin, disables the `loadingUsers` flag.
     * - Calls `fetchTeachersWithGroups()` and `fetchStudentsWithGroups()` and
     *   updates the `teachers` and `students` states respectively.
     * - Handles errors with console.error and always clears the loading flag.
     *
     * Performance/UX considerations:
     * - This loading is done client-side and refreshes the entire list; for
     *   large datasets, pagination or server-side searches could be applied.
     *
     * @param {void}
     * @returns {void}
     *
     * @example
     * ```ts
     * // Automatically executed; do not call manually
     * ```
     */
    useEffect(() => {
        // Wait for the AuthProvider to finish rehydrating
        if (loading) return;
        // Only load users if authenticated admin
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
     * Functional Summary.
     *
     * Assigns the selected students and/or teachers to the currently selected
     * class (`selectedClass`). Validates inputs, calls the assignment APIs,
     * and refreshes the local lists after the operation.
     *
     * Execution flow.
     *
     * - If there is no `selectedClass` or no users selected, sets `_error` and aborts.
     * - Activates the `loadingUsers` flag and calls `assignStudentsToGroup` and/or
     *   `assignTeachersToGroup` as appropriate.
     * - Upon success, reloads the data (`fetchStudentsWithGroups`,
     *   `fetchTeachersWithGroups`) and clears the selection.
     * - In case of error, logs to console and updates `_error`.
     *
     * @param {void}
     * @returns {Promise<void>} Promise that resolves upon completion of the operation.
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
            // refresh the students list to show changes
            const refreshedStudents = await fetchStudentsWithGroups();
            const refreshedTeachers = await fetchTeachersWithGroups();
            setStudents(refreshedStudents);
            setTeachers(refreshedTeachers);
            // clear selection
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
     * Functional Summary.
     *
     * Unassigns the selected students and/or teachers from their classes. Validates
     * the selection and class (when applicable), calls the unassignment APIs,
     * and refreshes the lists.
     *
     * Execution flow.
     *
     * - If there are no selected users, sets `_error` and aborts.
     * - If there are selected teachers, requires that `selectedClass` is
     *   defined.
     * - Calls `unassignStudentsFromGroup` and/or `unassignTeachersFromGroup`.
     * - Refreshes `students` and `teachers`, clears the selection, and handles errors.
     *
     * @param {void}
     * @returns {Promise<void>} Promise that resolves upon completion of the operation.
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
            // refresh the students list to show changes
            const refreshedStudents = await fetchStudentsWithGroups();
            const refreshedTeachers = await fetchTeachersWithGroups();
            setStudents(refreshedStudents);
            setTeachers(refreshedTeachers);
            // clear selection
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

    // Redirect if no authenticated user
    if (!user || user.role !== 'admin') {
        return <Redirect to="/login" />;
    }

    // Prepare the list of students to display: filter by query and, if there is
    // a selected class, sort so that students belonging to that class appear first.
    // We do not mutate `students`.
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
            if (aIn !== bIn) return aIn - bIn; // those belonging to the class appear first
            // Fallback: sort by username for consistency
            return (a.username || '').localeCompare(b.username || '');
        });
    })();

    // Prepare the list of teachers to display: filter by query and, if there is
    // a selected class, sort so that teachers belonging to that class appear first.
    // We do not mutate `teachers`.
    const displayedTeachers = (() => {
        const filtered = teacherQuery === '' ? teachers : teachers.filter(t => {
            const q = teacherQuery.toLowerCase();
            const uname = (t.username || '').toLowerCase();
            const inUsername = uname.includes(q);
            // Teachers may belong to multiple groups; check any group's alias
            const inGroup = (t.groups && t.groups.length > 0)
                ? t.groups.some(g => (g.alias || '').toLowerCase().includes(q))
                : false;
            return inUsername || inGroup;
        });

        if (selectedClass === null) return filtered;

        return [...filtered].sort((a, b) => {
            const aIn = a.groups?.some(g => g.id === selectedClass) ? 0 : 1;
            const bIn = b.groups?.some(g => g.id === selectedClass) ? 0 : 1;
            if (aIn !== bIn) return aIn - bIn; // those belonging to the class appear first
            // Fallback: sort by username for consistency
            return (a.username || '').localeCompare(b.username || '');
        });
    })();

    return (
        <IonPage>
            <SimpleHeaderAdmin adminName={user.username} />
            <IonContent className="ion-text-center ion-padding">
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
                                placeholder="Buscar"
                                value={studentQuery}
                                onIonInput={(e) => setStudentQuery(e.detail.value ?? '')}
                                onIonClear={() => setStudentQuery('')}
                                onIonCancel={() => setStudentQuery('')}
                            />
                        </div>
                        <div className='LinkProfiles-items'>
                            {loadingUsers ? (
                                <div className='LinkProfiles-spinner'>
                                    <IonSpinner name="crescent" />
                                </div>
                            ) : (
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
                            )}
                        </div>
                    </div>

                    <div className='LinkProfiles-table'>
                        <div className='LinkProfiles-searchbar'>
                            <IonTitle className='LinkProfiles-title'>Profesores</IonTitle>
                            <IonSearchbar
                                placeholder="Buscar"
                                value={teacherQuery}
                                onIonInput={(e) => setTeacherQuery(e.detail.value ?? '')}
                                onIonClear={() => setTeacherQuery('')}
                                onIonCancel={() => setTeacherQuery('')}
                            />
                        </div>
                        <div className='LinkProfiles-items'>
                            {loadingUsers ? (
                                <div className='LinkProfiles-spinner'>
                                    <IonSpinner name="crescent" />
                                </div>
                            ) : (
                                <IonList>
                                    {displayedTeachers.map(teacher => (
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
                            )}
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
                        onClick={() => router.push('/admin/dashboard', "forward", "pop")}
                    >
                        Cancelar
                    </IonButton>
                </div>
            </IonContent>
        </IonPage>

    );
}
