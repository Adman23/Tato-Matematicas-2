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
    IonButton,
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonIcon

} from '@ionic/react';
import { close } from 'ionicons/icons';
import './EditColors.css';
import { Redirect } from 'react-router-dom';
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
import { getColorPreferences, saveColorPalette } from '../../../lib/api';
import { AccessibilityDashboard } from './components/AccesibilityDashboard';
import { evaluateContrast } from './utils/contrast';
import type { AccessibilityReport } from './types/report';


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
    const { id } = useParams<{ id: string }>();
    const { name } = useParams<{ name: string }>();

    //Predefined color palettes
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
    
    //Colors of each palette
      const [colorPrincipal] = useState("#FFFFFF");
      const [colorTextoPrincipal] = useState("#FFFFFF");
      const [colorFondo] = useState("#FFFFFF");
      const [colorTextoFondo] = useState("#FFFFFF");
      const [colorBubble] = useState("#FFFFFF");
      const [colorBubbleSelected] = useState("#FFFFFF");
      const [colorBubbleCorrect] = useState("#FFFFFF");
      const [colorBubbleIncorrect] = useState("#FFFFFF");
      const [colorCorrectFed] = useState("#FFFFFF");
      const [colorIncorrectFed] = useState("#FFFFFF");
    
    //Palette index
    const [selectedPaletteIdx, setSelectedPaletteIdx] = useState<number | null>(0); // 0..N para predefinidas, null para personalizada
    //Custom palette- the final palette that is going to be in the data base
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

    //The palette that initially loads on the page
    const [originalPalette, setOriginalPalette] = useState(customPalette);

    //Accesibility report for analyzing the accesibility of the customPalette in detail
    const [accessibilityReport, setAccessibilityReport] = useState<AccessibilityReport>({
    textOnPrimary: "checking",
    textOnBackground: "checking",
    primaryOnBackground: "checking",
    bubbleOnBackground: "checking",
    selectedBubbleOnBackground: "checking",
    feedbackOnBackground: "checking",
    feedbackIncOnBackground: "checking"
    });

    //State for the modal
    const [showModal, setShowModal] = useState(false);

    //Function that updates the preview of the final palette
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

    //Function that initialize the custom palette with the palette used by the student that is being edit
    useEffect(() => {
    const loadColors = async () => {
        try {
            const prefs = await getColorPreferences(id);

            //Updates the preview of the customPalette
            setCustomPalette({
                primary: prefs.primary,
                text_on_primary: prefs.text_on_primary,
                background: prefs.background,
                text_on_bg: prefs.text_on_bg,
                bubble: prefs.bubble,
                bubble_selected: prefs.bubble_selected,
                bubble_correct: prefs.bubble_correct,
                bubble_incorrect: prefs.bubble_incorrect,
                feedback_correct: prefs.feedback_correct,
                feedback_incorrect: prefs.feedback_incorrect,
            });
            
            //Updates the original palette 
             setOriginalPalette({
                primary: prefs.primary,
                text_on_primary: prefs.text_on_primary,
                background: prefs.background,
                text_on_bg: prefs.text_on_bg,
                bubble: prefs.bubble,
                bubble_selected: prefs.bubble_selected,
                bubble_correct: prefs.bubble_correct,
                bubble_incorrect: prefs.bubble_incorrect,
                feedback_correct: prefs.feedback_correct,
                feedback_incorrect: prefs.feedback_incorrect,
            });

        } catch (err) {
            console.error("Error cargando color_preferences", err);
        }
    };

    loadColors();
}, [id]);

    //variable for checking the accesibility of the customPalette.
    const [accessibilityStatus, setAccessibilityStatus] = useState<"aaa" | "aa" | "fail" | "checking">("checking");

    useEffect(() => {
        const status = analyzePalette({
            primary: customPalette.primary,
            text_on_primary: customPalette.text_on_primary,
            background: customPalette.background,
            text_on_bg: customPalette.text_on_bg,
        });
        setAccessibilityStatus(status);

        setAccessibilityReport({
            textOnPrimary: evaluateContrast(customPalette.text_on_primary, customPalette.primary),
            textOnBackground: evaluateContrast(customPalette.text_on_bg, customPalette.background),
            primaryOnBackground: evaluateContrast(customPalette.primary, customPalette.background),
            bubbleOnBackground: evaluateContrast(customPalette.bubble, customPalette.background),
            selectedBubbleOnBackground: evaluateContrast(customPalette.bubble_selected, customPalette.background),
            feedbackOnBackground: evaluateContrast(customPalette.feedback_correct, customPalette.background), 
            feedbackIncOnBackground: evaluateContrast(customPalette.feedback_incorrect, customPalette.background),
        });
    }, [customPalette]);

    //Function for saving the palette in the data base
    const savePalette = async () => {
        try {
            await saveColorPalette(id, customPalette);
            //Updates the original palette
            setOriginalPalette({
                primary: customPalette.primary,
                text_on_primary: customPalette.text_on_primary,
                background: customPalette.background,
                text_on_bg: customPalette.text_on_bg,
                bubble: customPalette.bubble,
                bubble_selected: customPalette.bubble_selected,
                bubble_correct: customPalette.bubble_correct,
                bubble_incorrect: customPalette.bubble_incorrect,
                feedback_correct: customPalette.feedback_correct,
                feedback_incorrect: customPalette.feedback_incorrect,
            });
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
                            onClick={()=> setCustomPalette(originalPalette)}
                        >
                            Cancelar
                        </IonButton>
                        <IonButton type="button" className='LinkProfiles-button' onClick={() => setShowModal(true)}>
                            Informe accesibilidad
                        </IonButton>

                    </div>

                </div>

                <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Informe de accesibilidad</IonTitle>
                        <IonButtons slot="end">
                        <IonButton onClick={() => setShowModal(false)}>
                            <IonIcon icon={close} />
                        </IonButton>
                        </IonButtons>
                    </IonToolbar>
                    </IonHeader>
                    <IonContent className="ion-padding">
                    <AccessibilityDashboard report={accessibilityReport} />
                    </IonContent>
                </IonModal>
            </IonContent>
        </IonPage>
    );
}