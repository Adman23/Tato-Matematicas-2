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
    useIonRouter
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
            <IonContent className="main-container">

                    {/* Edit section */}
                    <section className="edit-section">
                        {/* Edit colors */}
                        <Button3Dtext className="vertical-card" onClick={() => handleDirection("/student/dashboard")}>
                            <img
                            src="/assets/pictograms/yo.png"
                            alt="Ir a editar colores"
                            className="btn-icon-header-user"
                            />
                            <span className="btn-text">COLORES</span>
                        </Button3Dtext>
                        
                        {/* Edit game_1 */}
                        <Button3Dtext className="vertical-card" onClick={() => handleDirection("/student/dashboard")}>
                            <img
                            src="/assets/pictograms/yo.png"
                            alt="Ir a editar juego uno"
                            className="btn-icon-header-user"
                            />
                            <span className="btn-text">JUEGO 1</span>
                        </Button3Dtext>
                        
                        {/* Edit game_2 */}
                        <Button3Dtext className="vertical-card" onClick={() => handleDirection("/student/dashboard")}>
                            <img
                            src="/assets/pictograms/yo.png"
                            alt="Ir a editar Juego dos"
                            className="btn-icon-header-user"
                            />
                            <span className="btn-text">JUEGO 2</span>
                        </Button3Dtext>

                        {/* Edit sound */}
                        <Button3Dtext className="vertical-card" onClick={() => handleDirection("/student/dashboard")}>
                            <img
                            src="/assets/pictograms/yo.png"
                            alt="Ir a editar sonido"
                            className="btn-icon-header-user"
                            />
                            <span className="btn-text">SONIDO</span>
                        </Button3Dtext>

                        {/* Edit game_3 */}
                        <Button3Dtext className="vertical-card" onClick={() => handleDirection("/student/dashboard")}>
                            <img
                            src="/assets/pictograms/yo.png"
                            alt="Ir a editar juego tres"
                            className="btn-icon-header-user"
                            />
                            <span className="btn-text">JUEGO 3</span>
                        </Button3Dtext>

                        {/* Edit game_4 */}
                        <Button3Dtext className="vertical-card" onClick={() => handleDirection("/student/dashboard")}>
                            <img
                            src="/assets/pictograms/yo.png"
                            alt="Ir a editar juego cuatro"
                            className="btn-icon-header-user"
                            />
                            <span className="btn-text">JUEGO 4</span>
                        </Button3Dtext>                  

                        {/* 
                        <div className="settings-section">
                            <img
                                src="/assets/pictograms/color.png"
                                alt="Eligir entre las opciones de color"
                                className="image-icon"
                            />
                            <p className="section-title">Colores</p>
                            <div className="options-container">

                            </div>
                        </div>

                        <div className="settings-section">
                            <img
                                src="/assets/pictograms/sound.png"
                                alt="Eligir entre las opciones de color"
                                className="image-icon"
                            />                            
                            <p className="section-title">Sonido</p>
                            <div className="options-container">

                            </div>
                        </div>

                        <div className="settings-section">
                            <img
                                src="/assets/pictograms/text.png"
                                alt="Eligir entre las opciones de color"
                                className="image-icon"
                            />                            
                            <p className="section-title">Texto</p>
                            <div className="options-container">
                            
                            </div>
                        </div>*/}
                    </section>


                    {/* Button section */}
                    <section className="button-section">
                        {/* Logout button */}
                        <Button3Dtext className="small-button" onClick={handleRefresh}>
                            <img
                            src="/assets/pictograms/yo.png"
                            alt="Ir a editar juego cuatro"
                            className="btn-icon-header-user"
                            />
                            <span className="btn-text">RECARGAR</span>
                        </Button3Dtext>  
                        
                        {/* Exit button */}
                        <Button3Dtext className="small-button" onClick={handleLogout}>
                            <img
                            src="/assets/pictograms/yo.png"
                            alt="Ir a editar juego cuatro"
                            className="btn-icon-header-user"
                            />
                            <span className="btn-text">SALIR</span>
                        </Button3Dtext>     
                    </section>
                    
            </IonContent>
        </IonPage> 
    ); 
    // End of component--------------------------------------------
}
