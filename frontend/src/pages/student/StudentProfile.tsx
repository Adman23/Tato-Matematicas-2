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
    IonCol
} from '@ionic/react';

import { useAuth } from '../../contexts/AuthContext';
import { useUserData } from "../../contexts/UserContext" 

import SimpleHeaderUser from './components/SimpleHeaderUser';
import { Button3Dtext } from '../global_components/PushableButtons';

import './StudentProfile.css';
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
        router.push('/home',"none","replace");
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
                    photoUrl={user?.photo_url} url="/student/dashboard" />

            {/* Main Content */}
            <IonContent className="ion-padding">
                <IonGrid className="main-container">
                    <IonRow className="ion-align-items-stretch" style={{ height: '100%' }}>
                        {/* Edit section - 80% en desktop, 100% en móvil */}
                        <IonCol size="12" sizeMd="9.6" className="edit-section-col">
                            <div className="edit-section">
                                {/* Edit colors */}
                                <Button3Dtext color='#3b82f6' frontClassName="small-padding" className="big-button vertical-card" onClick={() => handleDirection("/student/dashboard")}>
                                    <img
                                    src="/assets/pictograms/color.png"
                                    alt="Ir a editar colores"
                                    className="btn-icon"
                                    />
                                    <span className="btn-text">COLORES</span>
                                </Button3Dtext>
                                
                                {/* Edit game_1 */}
                                <Button3Dtext color='#3b82f6' frontClassName="small-padding" className="big-button vertical-card" onClick={() => handleDirection("/student/dashboard")}>
                                    <img
                                    src="/assets/juegosImg/juego2.png"
                                    alt="Ir a editar juego uno"
                                    className="btn-icon"
                                    />
                                    <span className="btn-text">JUEGO 1</span>
                                </Button3Dtext>
                                
                                {/* Edit game_2 */}
                                <Button3Dtext color='#3b82f6' frontClassName="small-padding" className="big-button vertical-card" onClick={() => handleDirection("/student/dashboard")}>
                                    <img
                                    src="/assets/juegosImg/juegoX.png"
                                    alt="Ir a editar Juego dos"
                                    className="btn-icon"
                                    />
                                    <span className="btn-text">JUEGO 2</span>
                                </Button3Dtext>

                                {/* Edit sound */}
                                <Button3Dtext color='#3b82f6' frontClassName="small-padding" className="big-button vertical-card" onClick={() => handleDirection("/student/dashboard")}>
                                    <img
                                    src="/assets/pictograms/escuchar.png"
                                    alt="Ir a editar sonido"
                                    className="btn-icon"
                                    />
                                    <span className="btn-text">SONIDO</span>
                                </Button3Dtext>

                                {/* Edit game_3 */}
                                <Button3Dtext color='#3b82f6' frontClassName="small-padding" className="big-button vertical-card" onClick={() => handleDirection("/student/dashboard")}>
                                    <img
                                    src="/assets/juegosImg/meter.png"
                                    alt="Ir a editar juego tres"
                                    className="btn-icon"
                                    />
                                    <span className="btn-text">JUEGO 3</span>
                                </Button3Dtext>

                                {/* Edit game_4 */}
                                <Button3Dtext color='#3b82f6' frontClassName="small-padding" className="big-button vertical-card" onClick={() => handleDirection("/student/dashboard")}>
                                    <img
                                    src="/assets/juegosImg/repartir.png"
                                    alt="Ir a editar juego cuatro"
                                    className="btn-icon"
                                    />
                                    <span className="btn-text">JUEGO 4</span>
                                </Button3Dtext>
                            </div>
                        </IonCol>

                        {/* Button section - 20% en desktop, 100% en móvil */}
                        <IonCol size="12" sizeMd="2.4" className="button-section-col">
                            <div className="button-section">
                                {/* Refresh button */}
                                <Button3Dtext color='#3b82f6' frontClassName="small-padding"
                                        className="small-button vertical-card" onClick={handleRefresh}>
                                    <img
                                    src="/assets/pictograms/recargar.png"
                                    alt="Cerrar sesión"
                                    className="btn-icon"
                                    />
                                    <span className="btn-text">RECARGA</span>
                                </Button3Dtext>  
                                
                                {/* Exit button */}
                                <Button3Dtext color='#3b82f6' frontClassName="small-padding"
                                        className="small-button vertical-card" onClick={handleLogout}>
                                    <img
                                    src="/assets/pictograms/salir.png"
                                    alt="Recargar los estilos"
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
