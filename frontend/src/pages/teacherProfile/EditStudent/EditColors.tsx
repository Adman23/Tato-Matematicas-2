/**
 * @file EditColors.tsx
 * @description edit page where teachers can change the colors of the app
 * They can choose between predefine palettes or access to a more advanced 
 * configuration.
 * Protects the view by checking authentication context.
 */

import {
    IonPage,
    IonContent,
    IonSpinner,
    IonTitle,
    IonGrid,
    IonRow,
    IonCol,
    IonLabel,
    IonButton

} from '@ionic/react';

import './EditColors.css';
import { useHistory, Redirect } from 'react-router-dom';
import SimpleHeaderEdit from './components/SimpleHeaderEdit';
import { useAuth } from '../../../contexts/AuthContext';
import { useParams } from "react-router-dom";
import PaletteSelector from './components/PaletteSelector';
import { useState } from 'react';
import { PopoverPicker } from './components/PopoverPicker';
import ColorPaletteCard from './components/ColorPaletteCard';


/**
 * Functional Summary.
 *
 * From this page, a teacher can change the color configuration for a certain student
 * Execution flow.
 *
 * - If `loading` is active in the auth context, shows a spinner.
 * - If there is no `user`, redirects to `/login`.
 * - Renders `SimpleHeaderEdit` with the user's name and buttons that
 *   navigate to back.
 *
 * @param {void}
 * @returns {JSX.Element} edit page
 *
 * @example
 * ```tsx
 * <Route path="/student-edit-color" component={EditColor} />
 * ```
 */
export default function EditColor() {

    const { user, loading } = useAuth();
    const history = useHistory();
    //const { id, name } = useParams();
    const { id } = useParams<{ id: string }>();
    const { name } = useParams<{ name: string }>();

    const examplePalette = [
        {
            id: 1,
            colors: ["#50BFE6", "#ffffff", "#ffffff", "#000000", "#A9DAF3", "#FFB7FA", "#34D399", "#F87171", "#059669", "#b91c1c" ]
        },
        {
            id: 2,
            colors: ["#6A1B9A", "#FFFFFF", "#FDF7FF", "#1A1A1A", "#EDE7F6", "#FFCA28", "#C8E6C9", "#FFCDD2", "#2E7D32", "#D32F2F"]
        },
        {
            id: 3,
            colors: ["#00ACC1", "#FFFFFF", "#F4F4F4", "#212121", "#FFFFFF", "#80DEEA", "#C8E6C9", "#FFCDD2", "#388E3C", "#E53935"]
        },
        {
            id: 4,
            colors: ["#005f73", "#FFFFFF", "#f0f0f0", "#0a0a0a", "#94d2bd", "#ee9b00", "#52b788", "#d62828", "#006d5b", "#9d0208"]
        },

    ];
    
      const [colorPrincipal, setColorPrincipal] = useState("var(--ion-color-primary)");
      const [colorTextoPrincipal, setColorTextoPrincipal] = useState("var(--ion-color-primary-contrast)");
      const [colorFondo, setColorFondo] = useState("var(--ion-color-primary-contrast)");
      const [colorTextoFondo, setColorTextoFondo] = useState("var(--tatomaths-text)");
      const [colorBubble, setColorBubble] = useState("var(--bubble-bg)");
      const [colorBubbleSelected, setColorBubbleSelected] = useState("var(--bubble-selected-bg)");
      const [colorBubbleCorrect, setColorBubbleCorrect] = useState("var(--bubble-correct-bg)");
      const [colorBubbleIncorrect, setColorBubbleIncorrect] = useState("var(--bubble-incorrect-bg)");
      const [colorCorrectFed, setColorCorrectFed] = useState("var(--bubble-feedback-correct)");
      const [colorIncorrectFed, setColorIncorrectFed] = useState("var(--bubble-feedback-incorrect)");
    
    

    // Show spinner while loading
    if (loading) {
        return (
            <IonPage>
                <IonContent className="ion-padding ion-text-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IonSpinner name="crescent" />
                </IonContent>
            </IonPage>
        );
    }

    // Redirect if there is no authenticated user
    if (!user) {
        return <Redirect to="/login" />;
    }

    return (
        <IonPage>
            <SimpleHeaderEdit studentName={name} Editing={"Editar colores"} />
            <IonContent className="ion-padding">
                <div className="studentEditProfile-editcolors-outer-container">
                    <IonTitle className='studentEditColor-ionTitle'>Paletas predefinidas</IonTitle>

                    <PaletteSelector palettes={examplePalette}></PaletteSelector>

                </div>
                <div className="studentEditProfile-editcolors-outer-container">
                    <IonTitle className='studentEditColor-ionTitle'>Personalización avanzada</IonTitle>
                    
                    <div className='studenEditColors-personalizacionAvanzada'>

                        <IonGrid>
                            <IonRow>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Color principal</IonLabel>
                                <PopoverPicker color={colorPrincipal} onChange={setColorPrincipal}/>
                            </IonCol>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Texto principal</IonLabel>
                                <PopoverPicker color={colorTextoPrincipal} onChange={setColorTextoPrincipal}/>
                            </IonCol>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Fondo</IonLabel>
                                <PopoverPicker color={colorFondo} onChange={setColorFondo}/>
                            </IonCol>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Texto fondo</IonLabel>
                                <PopoverPicker color={colorTextoFondo} onChange={setColorTextoFondo}/>
                            </IonCol>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Burbujas</IonLabel>
                                <PopoverPicker color={colorBubble} onChange={setColorBubble}/>
                            </IonCol>
                            
                            </IonRow>

                            <IonRow>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Burbuja seleccionada</IonLabel>
                                <PopoverPicker color={colorBubbleSelected} onChange={setColorBubbleSelected}/>
                            </IonCol>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Burbuja correcta</IonLabel>
                                <PopoverPicker color={colorBubbleCorrect} onChange={setColorBubbleCorrect}/>
                            </IonCol>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Burbuja incorrecta</IonLabel>
                                <PopoverPicker color={colorBubbleIncorrect} onChange={setColorBubbleIncorrect}/>
                            </IonCol>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Feedback positivo</IonLabel>
                                <PopoverPicker color={colorCorrectFed} onChange={setColorCorrectFed}/>
                            </IonCol>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Feedback negativo</IonLabel>
                                <PopoverPicker color={colorIncorrectFed} onChange={setColorIncorrectFed}/>
                            </IonCol>
                            </IonRow>
                        </IonGrid>
                        <ColorPaletteCard
                            palette={{
                                id: 999,
                                colors: [
                                    colorPrincipal,
                                    colorTextoPrincipal,
                                    colorFondo,
                                    colorTextoFondo,
                                    colorBubble,
                                    colorBubbleSelected,
                                    colorBubbleCorrect,
                                    colorBubbleIncorrect,
                                    colorCorrectFed,
                                    colorIncorrectFed,
                                ]
                            }}
                        />

                    </div>
                    <div className='LinkProfiles-buttons'>
                        <IonButton
                            type="submit"
                            className='LinkProfiles-button'
                            onClick={()=> console.log("Acepta")}
                        >
                            Aceptar
                        </IonButton>
                        <IonButton
                            type="submit"
                            className='LinkProfiles-button'
                            onClick={()=> console.log("Cancela")}
                        >
                            Cancelar
                        </IonButton>
                    </div>

                </div>
            </IonContent>
        </IonPage>
    );
}