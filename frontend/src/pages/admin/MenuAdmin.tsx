/**
 * @file MenuAdmin.tsx
 * @description Dashboard / menú de administración. Provee rutas rápidas para
 * ver profesores, ver alumnos y gestionar matrículas. Utiliza `SimpleHeaderAdmin`
 * y el contexto de autenticación para mostrar el nombre del admin y proteger
 * la vista.
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
 * Componente principal del Dashboard de administración.
 * - Protegido: redirige al login si no hay usuario autenticado.
 * - Muestra un spinner mientras `loading` esté activo en el contexto de auth.
 * - Contiene botones que navegan a las pantallas de profesores, alumnos y gestión de matrículas.
 */
export default function AdminDashboard() {

    const { user, loading } = useAuth();
    const history = useHistory();

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
                                    onClick={() => history.push('/admin-dashboard/groups-management')}
                                >
                                    Gestionar grupos
                                </IonButton>

                                <IonButton
                                    className='admin-dashboard-button'
                                    expand="block"
                                    fill="clear"
                                    onClick={() => history.push('/admin-dashboard/link-profiles')}
                                >
                                    Gestionar matrículas
                                </IonButton>

                            </div>
                        </IonCardContent>
                    </IonCard>
                </div>
            </IonContent>
        </IonPage>
    );
}
