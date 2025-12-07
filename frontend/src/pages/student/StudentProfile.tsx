/**
 * !! EDITED
 *  -> Now there is a new UI, its in figma
 *  -> Almost like a new file
 * 
 * @file StudentProfile.tsx
 * @description Component for the student profile page.
 * @author Adam
 */


// Imports--------------------------------------------------------------
import {
    IonPage,
    IonContent,
    IonSpinner,
    useIonRouter,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon
} from '@ionic/react';

import { useAuth } from '../../contexts/AuthContext';
import { useUserData } from "../../contexts/UserContext"

import SimpleHeaderUser from './components/SimpleHeaderUser';
import { Button3Dtext } from '../global_components/PushableButtons';
import { SimpleButton } from '../global_components/SimpleButton';

import './StudentProfile.css';
import { arrowBack } from 'ionicons/icons';
// End of Imports-------------------------------------------------------

/**
 * !! EDITED
 *  -> Now its 2 buttons that refresh and logout and 6 buttons to navigate to other options
 * 
 * @returns {JSX.Element} Interface of the student profile page.
 */
export default function StudentProfile() {

    /**
     * 'user': Object containing authenticated student data.
     *            it should have the following structure:
     *           {
     *               id: string;
     *               username: string;
     *               role: 'student';
     *               photo_url?: string;
     *               group_id?: string;
     *               group_alias?: string;
     *           }  
     */
    const { user, logout } = useAuth();
    const { loadingUser, refreshUserData } = useUserData();
    const router = useIonRouter();

    /**
     * @brief Its used by the buttons to make redirection
     * @param url the objetive url
     */
    const handleDirection = (url: string) => {
        router.push(url);
    }

    /**
     * @brief Its used by the logout button
     */
    const handleLogout = async () => {
        await logout();
        router.push('/student/login', "none", "replace");
    }

    /**
     * @brief Its used by the refresh button
     */
    const handleRefresh = async () => {
        await refreshUserData();
    }

    // Show loading icon
    if (loadingUser) {
        return (
            <IonPage>
                <IonContent className="ion-padding ion-text-center"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IonSpinner name="crescent" />
                </IonContent>
            </IonPage>
        );
    }

    // Component-----------------------------------------------
    return (
        <IonPage>
            {/* Header */}
            <SimpleHeaderUser userName={user?.username || "username"}
                photoUrl={user?.photo_url} hidden={true} />


            {/* Main Content */}
            <IonContent className="ion-padding" style={{ '--background': 'var(--ion-color-primary-contrast)' }}>
                {/* Back button and main grid container */}
                <Button3Dtext
                    onClick={() => router.push('/student/dashboard', "back", "pop")}
                    aria-label="Volver atrás">
                    <IonIcon icon={arrowBack} />
                </Button3Dtext>
                <IonGrid className="main-container">
                    <IonRow className="ion-align-items-stretch" style={{ height: '100%' }}>
                        {/* Edit section - 80% en desktop, 100% en móvil */}
                        <IonCol size="12" sizeMd="9.6" className="edit-section-col">
                            <div className="edit-section">
                                {/* Edit colors */}
                                <SimpleButton className="big-button" onClick={() => handleDirection("/student/edit-colors")}>
                                    <img
                                        src="/assets/pictograms/colores.png"
                                        alt="Ir a editar colores"
                                        className="simple-button-image"
                                    />
                                    <div className="simple-button-title">COLORES</div>
                                </SimpleButton>

                                {/* Edit game_1 */}
                                <SimpleButton className="big-button" onClick={() => handleDirection("/student/dashboard")}>
                                    <img
                                        src="/assets/juegosImg/juego1.png"
                                        alt="Ir a editar juego uno"
                                        className="simple-button-image"
                                    />
                                    <div className="simple-button-title">JUEGO 1</div>
                                </SimpleButton>

                                {/* Edit game_2 */}
                                <SimpleButton className="big-button" onClick={() => handleDirection("/student/edit-game2")}>
                                    <img
                                        src="/assets/juegosImg/juego2.png"
                                        alt="Ir a editar Juego dos"
                                        className="simple-button-image"
                                    />
                                    <div className="simple-button-title">JUEGO 2</div>
                                </SimpleButton>

                                {/* Edit sound */}
                                <SimpleButton className="big-button" onClick={() => handleDirection("/student/dashboard")}>
                                    <img
                                        src="/assets/pictograms/escucha.png"
                                        alt="Ir a editar sonido"
                                        className="simple-button-image"
                                    />
                                    <div className="simple-button-title">SONIDO</div>
                                </SimpleButton>

                                {/* Edit game_3 */}
                                <SimpleButton className="big-button" onClick={() => handleDirection("/student/dashboard")}>
                                    <img
                                        src="/assets/juegosImg/juego3.png"
                                        alt="Ir a editar juego tres"
                                        className="simple-button-image"
                                    />
                                    <div className="simple-button-title">JUEGO 3</div>
                                </SimpleButton>

                                {/* Edit game_4 */}
                                <SimpleButton className="big-button" onClick={() => handleDirection("/student/dashboard")}>
                                    <img
                                        src="/assets/juegosImg/juego4.png"
                                        alt="Ir a editar juego cuatro"
                                        className="simple-button-image"
                                    />
                                    <div className="simple-button-title">JUEGO 4</div>
                                </SimpleButton>
                            </div>
                        </IonCol>

                        {/* Button section - 20% en desktop, 100% en móvil */}
                        <IonCol size="12" sizeMd="2.4" className="button-section-col">
                            <div className="button-section">
                                {/* Refresh button */}
                                <Button3Dtext frontClassName="small-padding"
                                    className="small-button vertical-card" onClick={handleRefresh}>
                                    <img
                                        src="/assets/pictograms/recargar.png"
                                        alt="Recargar los estilos"
                                        className="btn-icon"
                                    />
                                    <span className="btn-text">RECARGA</span>
                                </Button3Dtext>

                                {/* Exit button */}
                                <Button3Dtext frontClassName="small-padding"
                                    className="small-button vertical-card" onClick={handleLogout}>
                                    <img
                                        src="/assets/pictograms/salir.png"
                                        alt="Cerrar sesión"
                                        className="btn-icon"
                                    />
                                    <span className="btn-text">SALIR</span>
                                </Button3Dtext>
                            </div>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
    // End of component--------------------------------------------
}
