/**
 * @file EditMenu.tsx
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
 * Main component of the edit dashboard. Provides quick links to edit the different configurations of the app.
 * Protects the view by checking the authentication context.
 *
 * Execution flow.
 *
 * - If `loading` is active in the auth context, shows a spinner.
 * - If there is no `user`, redirects to `/login`.
 * - Renders `SimpleHeaderEdit` with the user's name that is being edit and buttons that
 *   navigate to the edit pages.
 *
 * @param {void}
 * @returns {JSX.Element} edit menu.
 *
 * @example
 * ```tsx
 * <Route path="/student-edit-menu/:id/:name" exact component={EditMenu} />
 * ```
 */
export default function EditMenu() {

    const { user } = useAuth();
    const history = useHistory();
    //const { id, name } = useParams();
    const { id } = useParams<{ id: string }>();
    const { name } = useParams<{ name: string }>();

    // Show spinner while loading
    /*if (loading) {
        return (
            <IonPage>
                <IonContent className="ion-padding ion-text-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IonSpinner name="crescent" />
                </IonContent>
            </IonPage>
        );
    }*/

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
                                    expand="block"
                                    type="submit"
                                    className='studentEditProfile-dashboard-button'
                                    onClick={() => history.push('/admin-dashboard/profesores')}
                                >
                                    Datos del alumno
                                </IonButton>

                                <IonButton
                                    className='studentEditProfile-dashboard-button'
                                    expand="block"
                                    fill="clear"
                                    onClick={() => history.push(`/student-edit-color/${id}/${name}`)}
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
