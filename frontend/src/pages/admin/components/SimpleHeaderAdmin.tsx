/**
 * Resumen Funcional.
 *
 * Header simple reutilizable para las vistas de administración. Muestra el
 * nombre del admin, un botón para ir al dashboard y un botón para cerrar
 * sesión.
 *
 * Flujo de ejecución.
 *
 * - Se renderiza el título con el nombre del administrador pasado vía props.
 * - `handleHome` redirige al dashboard del administrador.
 * - `handleLogout` llama a `logout` del contexto de autenticación y redirige
 *   a la pantalla de login.
 *
 * @param {Props} props - Propiedades del componente (ver interface `Props`).
 * @returns {JSX.Element} Encabezado para vistas de admin.
 *
 * @example Ejemplo de uso
 *
 * ```tsx
 * <SimpleHeaderAdmin adminName="Admin" />
 * ```
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
 *
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
         * Resumen Funcional.
         *
         * Cierra la sesión del usuario y redirige al login.
         *
         * Flujo de ejecución.
         *
         * - Llama a `logout` del contexto.
         * - Reemplaza la ruta actual por '/login' con `history.replace`.
         *
         * @param {void}
         * @returns {Promise<void>}
         *
         * @example
         * ```ts
         * await handleLogout();
         * ```
         */
        const handleLogout = async () => {
            await logout();
            history.replace('/login');
        };

        /**
         * Resumen Funcional.
         *
         * Navega al dashboard del administrador.
         *
         * @param {void}
         * @returns {void}
         *
         * @example
         * ```ts
         * handleHome();
         * ```
         */
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
