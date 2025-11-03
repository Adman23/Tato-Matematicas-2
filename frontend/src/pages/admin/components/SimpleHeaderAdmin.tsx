import {
    IonTitle,
    IonToolbar,
    IonButton,
    IonHeader,
    IonButtons,
    IonIcon
} from '@ionic/react';

import './SimpleHeaderAdmin.css';
import { homeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { setupIonicReact } from '@ionic/react';

setupIonicReact();

interface Props {
    adminName: String;
}

const SimpleHeaderAdmin: React.FC<Props> = ({
    adminName
}) => {

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
        history.replace('/admin/dashboard');
    }

    return (
        <IonHeader>
            <IonToolbar className="toolbar-header-admin">
                <IonButtons slot='start'>
                    <IonButton className='homeButton-header-admin' onClick={handleHome} >
                        <IonIcon slot="icon-only" md={homeOutline}></IonIcon>
                    </IonButton>
                </IonButtons>
                <IonTitle className='title-header-admin'>{adminName}</IonTitle>
                <IonButtons slot="end">
                    <IonButton
                        className='logout-header-admin'
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

export default SimpleHeaderAdmin;
