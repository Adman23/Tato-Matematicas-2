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
import { useEffect, useState } from 'react';
import { PopoverPicker } from './components/PopoverPicker';
import ColorPaletteCard from './components/ColorPaletteCard';
import type { Palette } from './types/palette';
import AccessibilityIndicator from './components/AccesibilityIndicator';
import { analyzePalette } from './utils/analyzePalette';
import { saveColorPalette } from '../../../lib/api';

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

    const { user } = useAuth();
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
            colors: ["#76B875", "#1A1A1A", "#e3fde6ff", "#1A1A1A", "#FFFFFF", "#80c3eaff", "#c8d9e6ff", "#FFCDD2", "#3B82F6", "#D32F2F"]
        },
        {
            id: 4,
            colors: ["#005f73", "#FFFFFF", "#f0f0f0", "#0a0a0a", "#94d2bd", "#ee9b00", "#52b788", "#d62828", "#006d5b", "#9d0208"]
        },

    ];
    
      const [colorPrincipal] = useState("var(--ion-color-primary)");
      const [colorTextoPrincipal] = useState("var(--ion-color-primary-contrast)");
      const [colorFondo] = useState("var(--ion-color-primary-contrast)");
      const [colorTextoFondo] = useState("var(--tatomaths-text)");
      const [colorBubble] = useState("var(--bubble-bg)");
      const [colorBubbleSelected] = useState("var(--bubble-selected-bg)");
      const [colorBubbleCorrect] = useState("var(--bubble-correct-bg)");
      const [colorBubbleIncorrect] = useState("var(--bubble-incorrect-bg)");
      const [colorCorrectFed] = useState("var(--bubble-feedback-correct)");
      const [colorIncorrectFed] = useState("var(--bubble-feedback-incorrect)");
    
    const [selectedPaletteIdx, setSelectedPaletteIdx] = useState<number | null>(0); // 0..N para predefinidas, null para personalizada
    const [customPalette, setCustomPalette] = useState({
        primary: colorPrincipal,
        text_on_primary: colorTextoPrincipal,
        background: colorFondo,
        text_on_bg: colorTextoFondo,
        bubble: colorBubble,
        bubble_selected: colorBubbleSelected,
        bubble_correct: colorBubbleCorrect,
        bubble_incorrect: colorBubbleIncorrect,
        feedback_correct: colorCorrectFed,
        feedback_incorrect: colorIncorrectFed,
    });

    const applyPalette = (palette: Palette) => {
    setSelectedPaletteIdx(palette.id); // marca la paleta seleccionada
    setCustomPalette({
        primary: palette.colors[0],
        text_on_primary: palette.colors[1],
        background: palette.colors[2],
        text_on_bg: palette.colors[3],
        bubble: palette.colors[4],
        bubble_selected: palette.colors[5],
        bubble_correct: palette.colors[6],
        bubble_incorrect: palette.colors[7],
        feedback_correct: palette.colors[8],
        feedback_incorrect: palette.colors[9],
    });
    };

    const [accessibilityStatus, setAccessibilityStatus] = useState<"aaa" | "aa" | "fail" | "checking">("checking");

    useEffect(() => {
        const status = analyzePalette({
            primary: customPalette.primary,
            text_on_primary: customPalette.text_on_primary,
            background: customPalette.background,
            text_on_bg: customPalette.text_on_bg,
        });
        setAccessibilityStatus(status);
    }, [customPalette]);

    const savePalette = async () => {
        try {
            console.log(user?.username);
            await saveColorPalette(id, customPalette);
            console.log("Paleta guardada correctamente!", customPalette);
        } catch (err) {
            console.error("Error al guardar la paleta", err);
        }
    };
    // Show spinner while loading
    /*if (loading) {
        return (
            <IonPage>
                <IonContent className="ion-padding ion-text-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IonSpinner name="crescent" />
                </IonContent>
            </IonPage>
        );
    }*/

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

                    <PaletteSelector palettes={examplePalette} onSelect={applyPalette}></PaletteSelector>

                </div>
                <div className="studentEditProfile-editcolors-outer-container">
                    <IonTitle className='studentEditColor-ionTitle'>Personalización avanzada</IonTitle>
                    
                    <div className='studenEditColors-personalizacionAvanzada'>

                        <IonGrid>
                            <IonRow>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Color principal</IonLabel>
                                <PopoverPicker color={customPalette.primary} onChange={(c) => setCustomPalette({...customPalette, primary: c})}/>
                            </IonCol>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Texto principal</IonLabel>
                                <PopoverPicker color={customPalette.text_on_primary} onChange={(c) => setCustomPalette({...customPalette, text_on_primary: c})}/>
                            </IonCol>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Fondo</IonLabel>
                                <PopoverPicker color={customPalette.background} onChange={(c) => setCustomPalette({...customPalette, background: c})}/>
                            </IonCol>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Texto fondo</IonLabel>
                                <PopoverPicker color={customPalette.text_on_bg} onChange={(c) => setCustomPalette({...customPalette, text_on_bg: c})}/>
                            </IonCol>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Burbujas</IonLabel>
                                <PopoverPicker color={customPalette.bubble} onChange={(c) => setCustomPalette({...customPalette, bubble: c})}/>
                            </IonCol>
                            
                            </IonRow>

                            <IonRow>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Burbuja seleccionada</IonLabel>
                                <PopoverPicker color={customPalette.bubble_selected} onChange={(c) => setCustomPalette({...customPalette, bubble_selected: c})}/>
                            </IonCol>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Burbuja correcta</IonLabel>
                                <PopoverPicker color={customPalette.bubble_correct} onChange={(c) => setCustomPalette({...customPalette, bubble_correct: c})}/>
                            </IonCol>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Burbuja incorrecta</IonLabel>
                                <PopoverPicker color={customPalette.bubble_incorrect} onChange={(c) => setCustomPalette({...customPalette, bubble_incorrect: c})}/>
                            </IonCol>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Feedback positivo</IonLabel>
                                <PopoverPicker color={customPalette.feedback_correct} onChange={(c) => setCustomPalette({...customPalette, feedback_correct: c})}/>
                            </IonCol>
                            <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Feedback negativo</IonLabel>
                                <PopoverPicker color={customPalette.feedback_incorrect} onChange={(c) => setCustomPalette({...customPalette, feedback_incorrect: c})}/>
                            </IonCol>
                            </IonRow>
                        </IonGrid>
                        <div className='EditColor-PalettePreview'>
                            <ColorPaletteCard
                                palette={{
                                    id: 999,
                                    colors: [
                                        customPalette.primary,
                                        customPalette.text_on_primary,
                                        customPalette.background,
                                        customPalette.text_on_bg,
                                        customPalette.bubble,
                                        customPalette.bubble_selected,
                                        customPalette.bubble_correct,
                                        customPalette.bubble_incorrect,
                                        customPalette.feedback_correct,
                                        customPalette.feedback_incorrect,
                                    ]
                                }}
                            />
                            <AccessibilityIndicator status={accessibilityStatus} />

                        </div>
                        

                    </div>
                    <div className='LinkProfiles-buttons'>
                        <IonButton
                            type="submit"
                            className='LinkProfiles-button'
                            onClick={savePalette}
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