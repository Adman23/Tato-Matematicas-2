/**
 * @file EditAdmin.tsx
 * @description Dashboard / main menu for the edit section for teachers.
 * Provides quick links to edit colors, texts,
 * game configurations, and sounds for one particular student. 
 * Protects the view by checking authentication context.
 */

import {
    IonPage,
    IonContent,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonButton

} from '@ionic/react';

import './EditMenu.css';
import { useHistory, Redirect } from 'react-router-dom';
import SimpleHeaderEdit from './components/SimpleHeaderEdit';
import { useAuth } from '../../../contexts/AuthContext';
import { useParams } from "react-router-dom";

/**
 * Functional Summary.
 *
 * Main component of the admin dashboard. Provides quick links to manage teachers, students, enrollments, and groups. Protects the view by checking the authentication context.
 *
 * Execution flow.
 *
 * - If `loading` is active in the auth context, shows a spinner.
 * - If there is no `user`, redirects to `/login`.
 * - Renders `SimpleHeaderAdmin` with the user's name and buttons that
 *   navigate to the administrative pages.
 *
 * @param {void}
 * @returns {JSX.Element} Admin dashboard / main menu.
 *
 * @example
 * ```tsx
 * <Route path="/admin" component={AdminDashboard} />
 * ```
 */
export default function AdminDashboard() {

    const { user, loading } = useAuth();
    const history = useHistory();
    //const { id, name } = useParams();
    const { id } = useParams<{ id: string }>();
    const { name } = useParams<{ name: string }>();

    // Show spinner while loading
    if (loading) {
        return (
            <IonPage>
                <IonContent className="ion-padding ion-text-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IonSpinner name="crescent" />
                </IonContent>
            </IonPage>
        );
    }

    // Redirect if there is no authenticated user
    if (!user) {
        return <Redirect to="/login" />;
    }

    return (
        <IonPage>
            <SimpleHeaderEdit studentName={name} Editing={"Menú de edición"} />
            <IonContent className="ion-padding">
                <div className="studentEditProfile-dashboard-outer-container">
                    <IonCard className="studentEditProfile-dashboard-card">
                        <IonCardContent>
                            <div className='studentEditProfile-dashboard-main-container'>

                                <IonButton
                                    className='studentEditProfile-dashboard-button'
                                    expand="block"
                                    type="submit"
                                    onClick={() => history.push(`/student-edit-profile/${id}/${name}`)}
                                >
                                    Datos del alumno
                                </IonButton>

                                <IonButton
                                    className='studentEditProfile-dashboard-button'
                                    expand="block"
                                    fill="clear"
                                    onClick={() => history.push('/admin-dashboard/alumnos')}
                                >
                                    Colores
                                </IonButton>

                                <IonButton
                                    className='studentEditProfile-dashboard-button'
                                    expand="block"
                                    fill="clear"
                                    onClick={() => history.push('/admin-dashboard/link-profiles')}
                                >
                                    Sonidos
                                </IonButton>

                                <IonButton
                                    className='studentEditProfile-dashboard-button'
                                    expand="block"
                                    fill="clear"
                                    onClick={() => history.push('/admin-dashboard/groups-management')}
                                >
                                    Juego 1
                                </IonButton>

                                <IonButton
                                    className='studentEditProfile-dashboard-button'
                                    expand="block"
                                    fill="clear"
                                    onClick={() => history.push('/admin-dashboard/groups-management')}
                                >
                                    Juego 2
                                </IonButton>

                                <IonButton
                                    className='studentEditProfile-dashboard-button'
                                    expand="block"
                                    fill="clear"
                                    onClick={() => history.push('/admin-dashboard/groups-management')}
                                >
                                    Juego 3
                                </IonButton>

                                <IonButton
                                    className='studentEditProfile-dashboard-button'
                                    expand="block"
                                    fill="clear"
                                    onClick={() => history.push('/admin-dashboard/groups-management')}
                                >
                                    Juego 4
                                </IonButton>

                                <IonButton
                                    className='studentEditProfile-dashboard-button'
                                    expand="block"
                                    fill="clear"
                                    onClick={() => history.push('/admin-dashboard/groups-management')}
                                >
                                    Mensajes
                                </IonButton>

                            </div>
                        </IonCardContent>
                    </IonCard>
                </div>
            </IonContent>
        </IonPage>
    );
}
