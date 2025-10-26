import {
    IonPage,
    IonContent,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonButton

} from '@ionic/react';

import './MenuAdmin.css';
import { useHistory } from 'react-router-dom';
import HeaderAdmin from './HeaderAdmin';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {

    const { loading } = useAuth();
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
    // if (!user) {
    //     return <Redirect to="/login" />;
    // }

    return (
        <IonPage>
            <HeaderAdmin />
            <IonContent className="ion-padding">
                <div className="admin-dashboard-outer-container">
                    <IonCard className="admin-dashboard-card">
                        <IonCardContent>
                            <div className='admin-dashboard-main-container'>

                                <IonButton
                                    expand="block"
                                    type="submit"
                                    className='admin-dashboard-button'
                                //onClick={() => history.push('/list-teachers')}
                                >
                                    Ver profesores
                                </IonButton>

                                <IonButton
                                    className='admin-dashboard-button'
                                    expand="block"
                                    fill="clear"
                                //onClick={() => history.push('/list-students')}
                                >
                                    Ver alumnos
                                </IonButton>

                                <IonButton
                                    className='admin-dashboard-button'
                                    expand="block"
                                    fill="clear"
                                    onClick={() => history.push('/admin-dashboard/link-profiles')}
                                >
                                    Vincular perfiles
                                </IonButton>

                            </div>
                        </IonCardContent>
                    </IonCard>
                </div>
            </IonContent>
        </IonPage>
    );
}
