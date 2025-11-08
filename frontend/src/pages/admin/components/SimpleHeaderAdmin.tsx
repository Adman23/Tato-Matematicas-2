/**
 * @file SimpleHeaderAdmin.tsx
 * @description Header simple para vistas de admin. Muestra el nombre del admin,
 * un botón home y un botón para cerrar sesión.
 */

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

/**
 * Props del SimpleHeaderAdmin
 * @property adminName - Nombre a mostrar en el header
 */
interface Props {
    adminName: String;
}

/**
 * Componente de encabezado simple para la sección de administración.
 * - `handleLogout` cierra la sesión y redirige a la raíz.
 * - `handleHome` redirige al dashboard del admin.
 */
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
        history.replace('/admin-dashboard');
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
