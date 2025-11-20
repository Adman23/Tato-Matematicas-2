/**
 * @file StudentProfile.tsx
 * @description Component for the student profile page.
 * @author Adam
 */


// Imports--------------------------------------------------------------
import { useState } from 'react';
import {
    IonPage, 
    IonContent, 
    IonButton,
    IonSpinner,
    IonIcon,
} from '@ionic/react';

import { 
    volumeMute,   
    volumeMedium, 
    volumeHigh    
} from 'ionicons/icons';
import { Redirect } from 'react-router-dom';         // Used for redirection
import { useAuth } from '../../contexts/AuthContext';// Authentication context
//import { useUserData } from "../../contexts/UserContext"

import SimpleHeaderUser from './components/SimpleHeaderUser';
import './StudentProfile.css';
// End of Imports-------------------------------------------------------

/**
 * !! EDITED
 *  -> Fixed some problems with the UI
 *  -> Integrated with the backend
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
     *           }  
     */ 
    const { user, loading } = useAuth();
    //const { userData, loading } = useUserData();

    // Variables and functions---------------------------------
    const [color, setColor] = useState('original');
    const [sound, setSound] = useState('medio');
    const [text, setText] = useState('normal');
    // End of variables and functions--------------------------

    // Show loading icon
    if (loading) {
        return (
            <IonPage>
                <IonContent className="ion-padding ion-text-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IonSpinner name="crescent" />
                </IonContent>
            </IonPage>
        );
    }

    // Redirect if not authenticated
    if (!user) {
        return <Redirect to="/student-login" />;
    }

    // Component-----------------------------------------------
    return (
        <IonPage>
            {/* Header */}
            <SimpleHeaderUser userName={user.username} 
                    photoUrl={user.photo_url} url="/student-dashboard" />

            {/* Main Content */}
            <IonContent className="ion-padding">
                    
                <div className='main-container'>
                    {/* COLOR */}
                    <div className="settings-section">
                        <img
                            src="/assets/pictograms/color.png"
                            alt="Eligir entre las opciones de color"
                            className="image-icon"
                        />
                        <p className="section-title">Colores</p>
                        <div className="options-container">
                        <IonButton fill={color === 'original' ? 'solid' : 'outline'} 
                            onClick={() => setColor('original')} className="color-btn palette-original"></IonButton>

                        <IonButton fill={color === 'pastel' ? 'solid' : 'outline'} 
                            onClick={() => setColor('pastel')} className="color-btn palette-pastel"></IonButton>

                        <IonButton fill={color === 'vibrante' ? 'solid' : 'outline'} 
                            onClick={() => setColor('vibrante')} className="color-btn palette-vibrante"></IonButton>
                        </div>
                    </div>

                    {/* 2. SOUND */}
                    <div className="settings-section">
                        <img
                            src="/assets/pictograms/sound.png"
                            alt="Eligir entre las opciones de color"
                            className="image-icon"
                        />                            
                        <p className="section-title">Sonido</p>
                        <div className="options-container">
                        <IonButton className="sound-btn" fill={sound === 'mudo' ? 'solid' : 'outline'} 
                            onClick={() => setSound('mudo')}> Mudo
                            <IonIcon slot="icon-only" icon={volumeMute}></IonIcon>    
                        </IonButton>

                        <IonButton className="sound-btn" fill={sound === 'medio' ? 'solid' : 'outline'} 
                            onClick={() => setSound('medio')}> Medio
                            <IonIcon slot="icon-only" icon={volumeMedium}></IonIcon>    
                        </IonButton>

                        <IonButton className="sound-btn" fill={sound === 'alto' ? 'solid' : 'outline'} 
                            onClick={() => setSound('alto')}> Alto
                            <IonIcon slot="icon-only" icon={volumeHigh}></IonIcon>    
                        </IonButton>
                        </div>
                    </div>

                    {/* 2. TEXT */}
                    <div className="settings-section">
                        <img
                            src="/assets/pictograms/text.png"
                            alt="Eligir entre las opciones de color"
                            className="image-icon"
                        />                            
                        <p className="section-title">Texto</p>
                        <div className="options-container">
                        <IonButton fill={text === 'normal' ? 'solid' : 'outline'} 
                            onClick={() => setText('normal')} className="text-normal">Normal</IonButton>
                        <IonButton fill={text === 'grande' ? 'solid' : 'outline'} 
                            onClick={() => setText('grande')} className="text-grande">Grande</IonButton>
                        </div>
                    </div>

                </div> 

                {/* Text preview */}
                <div className={`text-preview ${text}`}>
                    Texto de ejemplo para previsualizar los cambios.
                </div>

                </IonContent>
        </IonPage> 
    ); 
    // End of component--------------------------------------------
}
