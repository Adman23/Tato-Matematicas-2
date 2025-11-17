/**
 * @file MenuAdmin.tsx
 * @description Dashboard / main menu for the admin section.
 * Provides quick links to manage teachers, students,
 * profile links, and groups. Protects the view by checking
 * authentication context.
 */

import {
    IonPage,
    IonContent,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonButton

} from '@ionic/react';

import './MenuAdmin.css';
import { useHistory, Redirect } from 'react-router-dom';
import SimpleHeaderAdmin from './components/SimpleHeaderAdmin';
import { useAuth } from '../../contexts/AuthContext';

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
            <SimpleHeaderAdmin adminName={user.username} />
            <IonContent className="ion-padding">
                <div className="admin-dashboard-outer-container">
                    <IonCard className="admin-dashboard-card">
                        <IonCardContent>
                            <div className='admin-dashboard-main-container'>

                                <IonButton
                                    expand="block"
                                    type="submit"
                                    className='admin-dashboard-button'
                                    onClick={() => history.push('/admin-dashboard/profesores')}
                                >
                                    Gestionar profesores
                                </IonButton>

                                <IonButton
                                    className='admin-dashboard-button'
                                    expand="block"
                                    fill="clear"
                                    onClick={() => history.push('/admin-dashboard/alumnos')}
                                >
                                    Gestionar alumnos
                                </IonButton>

                                <IonButton
                                    className='admin-dashboard-button'
                                    expand="block"
                                    fill="clear"
                                    onClick={() => history.push('/admin-dashboard/link-profiles')}
                                >
                                    Gestionar matrículas
                                </IonButton>

                                <IonButton
                                    className='admin-dashboard-button'
                                    expand="block"
                                    fill="clear"
                                    onClick={() => history.push('/admin-dashboard/groups-management')}
                                >
                                    Gestionar grupos
                                </IonButton>

                            </div>
                        </IonCardContent>
                    </IonCard>
                </div>
            </IonContent>
        </IonPage>
    );
}
