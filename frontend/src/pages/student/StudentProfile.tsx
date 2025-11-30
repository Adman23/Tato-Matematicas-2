/**
 * !! EDITED
 *  -> Now there is a new UI, its in figma
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
    const { user } = useAuth();
    const { loadingUser } = useUserData();
    const router = useIonRouter();

    const handleDirection = (url: string) => {
        router.push(url);
    }
    
    /*
    !! DEPRECATED, not useful
    // Variables and functions---------------------------------
    const [color, setColor] = useState('original');
    const [sound, setSound] = useState('medio');
    const [text, setText] = useState('normal');
    // End of variables and functions--------------------------
    */

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
                        
                        {/* Edit colors */}
                        <Button3Dtext className="vertical-card" onClick={() => handleDirection("/student/dashboard")}>
                            <img
                            src="/assets/pictograms/yo.png"
                            alt="Ir a editar colores"
                            className="btn-icon-header-user"
                            />
                            <span className="btn-text">COLORES</span>
                        </Button3Dtext>
                        
                        {/* Edit colors */}
                        <Button3Dtext className="vertical-card" onClick={() => handleDirection("/student/dashboard")}>
                            <img
                            src="/assets/pictograms/yo.png"
                            alt="Ir a editar colores"
                            className="btn-icon-header-user"
                            />
                            <span className="btn-text">COLORES</span>
                        </Button3Dtext>

                        {/* Edit colors */}
                        <Button3Dtext className="vertical-card" onClick={() => handleDirection("/student/dashboard")}>
                            <img
                            src="/assets/pictograms/yo.png"
                            alt="Ir a editar colores"
                            className="btn-icon-header-user"
                            />
                            <span className="btn-text">COLORES</span>
                        </Button3Dtext>

                        {/* Edit colors */}
                        <Button3Dtext className="vertical-card" onClick={() => handleDirection("/student/dashboard")}>
                            <img
                            src="/assets/pictograms/yo.png"
                            alt="Ir a editar colores"
                            className="btn-icon-header-user"
                            />
                            <span className="btn-text">COLORES</span>
                        </Button3Dtext>

                        {/* Edit colors */}
                        <Button3Dtext className="vertical-card" onClick={() => handleDirection("/student/dashboard")}>
                            <img
                            src="/assets/pictograms/yo.png"
                            alt="Ir a editar colores"
                            className="btn-icon-header-user"
                            />
                            <span className="btn-text">COLORES</span>
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

                    </section>
                    
            </IonContent>
        </IonPage> 
    ); 
    // End of component--------------------------------------------
}
