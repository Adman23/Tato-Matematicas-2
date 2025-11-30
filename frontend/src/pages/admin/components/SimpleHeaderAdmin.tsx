/**
 * Functional Summary.
 *
 * Reusable simple header for admin views. Displays the
 * admin's name, a button to go to the dashboard, and a button to log out.
 *
 * Execution flow.
 *
 * - Renders the title with the admin's name passed via props.
 * - `handleHome` navigates to the admin dashboard.
 * - `handleLogout` calls `logout` from the auth context and redirects
 *   to the login screen.
 *
 * @param {Props} props - Component props (see `Props` interface).
 * @returns {JSX.Element} Header for admin views.
 *
 * @example Example usage
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
    IonIcon,
    useIonRouter
} from '@ionic/react';

import './SimpleHeaderAdmin.css';
import { homeOutline } from 'ionicons/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { setupIonicReact } from '@ionic/react';

setupIonicReact();

/**
 * Props of SimpleHeaderAdmin
 *
 * @property adminName - Name to display in the header
 */
interface Props {
    adminName: String;
}

/**
 * Simple header component for the admin section.
 * - `handleLogout` logs out and redirects to the root.
 * - `handleHome` redirects to the admin dashboard.
 */
const SimpleHeaderAdmin: React.FC<Props> = ({
    adminName
}) => {

    const router = useIonRouter();
    const { logout } = useAuth();

    /**
     * Functional Summary.
     *
     * Logs out the user and redirects to the login screen.
     *
     * Execution flow.
     *
     * - Calls `logout` from the context
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
        router.push('/login');
    };

    /**
     * Functional Summary.
     *
     * Navigates to the admin dashboard.
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
        router.push('/admin/dashboard');
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
