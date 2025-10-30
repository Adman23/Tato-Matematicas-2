import {
    IonTitle,
    IonToolbar,
    IonButton,
    IonHeader,
    IonButtons,
    IonIcon,

} from '@ionic/react';

import './HeaderAdmin.css';
import { homeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { setupIonicReact } from '@ionic/react';

setupIonicReact();

const HeaderAdmin: React.FC = () => {

    const history = useHistory();
    const { logout } = useAuth();

    /**
* Cierra la sesión del usuario y redirige a la página principal.
*/
    const handleLogout = async () => {
        await logout();
        history.replace('/');
    };

    const handleHome = () => {
        if (history.location.pathname !== '/admin-dashboard') {
            history.goBack();
        }
        else {
            history.replace('/admin-dashboard');
        }
    }

    return (
        <IonHeader>
            <IonToolbar className="toolbar-link-profiles">
                <IonButtons slot='start'>
                    <IonButton className='homeButton-link-profiles' onClick={handleHome} >
                        <IonIcon slot="icon-only" md={homeOutline}></IonIcon>
                    </IonButton>
                </IonButtons>
                <IonTitle className='title-link-profiles'>Admin</IonTitle>
                <IonButtons slot="end">
                    <IonButton
                        className='logout-button'
                        expand="block"
                        fill="clear"
                        onClick={handleLogout}
                    >
                        Cerrar sesión
                    </IonButton>
                </IonButtons>
            </IonToolbar>
        </IonHeader>
    );
}

export default HeaderAdmin;
