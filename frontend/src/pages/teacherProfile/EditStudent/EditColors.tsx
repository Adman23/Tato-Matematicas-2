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
    IonIcon,
    IonFooter,
    useIonRouter

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
import { evaluateContrast, evaluateContrastForElements } from './utils/contrast';
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

    const router = useIonRouter();

    const handleHome = () => {
        router.push(`/student-edit-menu/${id}/${name}`);
    }

    //Predefined color palettes
    const examplePalette = [
        {
            id: 1,
            colors: ["#1863A3", "#ffffff", "#ffffff", "#000000", "#A9DAF3", "#4793AB", "#D76FBF"]
        },
        {
            id: 2,
            colors: ["#6A1B9A", "#FFFFFF", "#f3e8f7ff", "#1A1A1A","#E8D6F3", "#AF65EB", "#0F8F8F"]
        },
        {
            id: 3,
            colors: ["#006B33", "#FFFFFF", "#effff0ff", "#1A1A1A","#b1ecb1ff", "#4E8F4E", "#B8653C"]
        },
        {
            id: 4,
            colors: ["#005f73", "#FFFFFF", "#f0f0f0", "#0a0a0a","#9AF5F9", "#4E967F", "#e06200"]
        },

    ];
    
    //Colors of each palette
      const [colorPrincipal] = useState("#FFFFFF");
      const [colorTextoPrincipal] = useState("#FFFFFF");
      const [colorFondo] = useState("#FFFFFF");
      const [colorTextoFondo] = useState("#FFFFFF");
      const [colorButton] = useState("#FFFFFF");
      const [colorBubble] = useState("#FFFFFF");
      const [colorBubbleSelected] = useState("#FFFFFF");
    
    //Palette index
    //const [selectedPaletteIdx, setSelectedPaletteIdx] = useState<number | null>(0); // 0..N para predefinidas, null para personalizada
    //Custom palette- the final palette that is going to be in the data base
    const [customPalette, setCustomPalette] = useState({
        primary: colorPrincipal,
        text_on_primary: colorTextoPrincipal,
        background: colorFondo,
        text_on_bg: colorTextoFondo,
        button : colorButton,
        bubble: colorBubble,
        bubble_selected: colorBubbleSelected,

    });

    //The palette that initially loads on the page
    const [originalPalette, setOriginalPalette] = useState(customPalette);

    //Accesibility report for analyzing the accesibility of the customPalette in detail
    const [accessibilityReport, setAccessibilityReport] = useState<AccessibilityReport>({
    textOnPrimary: "checking",
    textOnBackground: "checking",
    PrimaryOnBackgroud: "checking",
    buttonOnPrimary: "checking",
    textOnBubble: "checking",
    textOnBubbleSelected: "checking",
    bubbleOnBackground: "checking",
    selectedBubbleOnBackground: "checking"
    });

    //State for the modal
    const [showModal, setShowModal] = useState(false);
    const [showToast, setShowToast] = useState(false);


    //Function that updates the preview of the final palette
    const applyPalette = (palette: Palette) => {
    //setSelectedPaletteIdx(palette.id); // marca la paleta seleccionada
    setCustomPalette({
        primary: palette.colors[0],
        text_on_primary: palette.colors[1],
        background: palette.colors[2],
        text_on_bg: palette.colors[3],
        button: palette.colors[4],
        bubble: palette.colors[5],
        bubble_selected: palette.colors[6]
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
                button: prefs.button,
                text_on_bg: prefs.text_on_bg,
                bubble: prefs.bubble,
                bubble_selected: prefs.bubble_selected
            });
            
            //Updates the original palette 
             setOriginalPalette({
                primary: prefs.primary,
                text_on_primary: prefs.text_on_primary,
                background: prefs.background,
                button: prefs.button,
                text_on_bg: prefs.text_on_bg,
                bubble: prefs.bubble,
                bubble_selected: prefs.bubble_selected
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
            button: customPalette.button,
            text_on_bg: customPalette.text_on_bg,
            bubble: customPalette.bubble,
            bubble_selected: customPalette.bubble_selected
        });
        setAccessibilityStatus(status);

        setAccessibilityReport({
            textOnPrimary: evaluateContrast(customPalette.text_on_primary, customPalette.primary),
            textOnBackground: evaluateContrast(customPalette.text_on_bg, customPalette.background),
            PrimaryOnBackgroud: evaluateContrastForElements(customPalette.primary, customPalette.background),
            buttonOnPrimary: evaluateContrastForElements(customPalette.button, customPalette.primary),
            textOnBubble: evaluateContrast(customPalette.bubble, "#000000"),
            textOnBubbleSelected: evaluateContrast(customPalette.bubble_selected, "#000000"),
            bubbleOnBackground: evaluateContrastForElements(customPalette.bubble, customPalette.background),
            selectedBubbleOnBackground: evaluateContrastForElements(customPalette.bubble_selected, customPalette.background),
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
                button: customPalette.button,
                bubble: customPalette.bubble,
                bubble_selected: customPalette.bubble_selected
            });
            setShowToast(true);
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
            <SimpleHeaderEdit studentName={name} Editing={"Editar colores"} onHome={handleHome}/>
            <IonContent className="ion-padding">
                <div className="studentEditProfile-editcolors-outer-container">
                    <div className='studentEditColor-ionTitle'>Paletas predefinidas</div>

                    <PaletteSelector palettes={examplePalette} onSelect={applyPalette}></PaletteSelector>

                </div>
                <div className="studentEditProfile-editcolors-outer-container">
                    <div className='studentEditColor-ionTitle'>Personalización avanzada</div>
                    
                    <div className='studenEditColors-personalizacionAvanzada'>
                        <div className='EditColor-PalettePreview'>
                            <ColorPaletteCard
                                palette={{
                                    id: 999,
                                    colors: [
                                        customPalette.primary,
                                        customPalette.text_on_primary,
                                        customPalette.background,
                                        customPalette.text_on_bg,
                                        customPalette.button,
                                        customPalette.bubble,
                                        customPalette.bubble_selected
                                    ]
                                }}
                            />
                            <AccessibilityIndicator status={accessibilityStatus} />

                        </div>

                        <IonGrid>
                            <IonRow>
                                <IonCol  className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Color principal</IonLabel>
                                <PopoverPicker color={customPalette.primary} onChange={(c) => setCustomPalette({...customPalette, primary: c})}/>
                                </IonCol>
                                <IonCol  className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Texto principal</IonLabel>
                                <PopoverPicker color={customPalette.text_on_primary} onChange={(c) => setCustomPalette({...customPalette, text_on_primary: c})}/>
                                </IonCol>
                                <IonCol  className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Fondo</IonLabel>
                                <PopoverPicker color={customPalette.background} onChange={(c) => setCustomPalette({...customPalette, background: c})}/>
                                </IonCol>
                                <IonCol  className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Texto fondo</IonLabel>
                                <PopoverPicker color={customPalette.text_on_bg} onChange={(c) => setCustomPalette({...customPalette, text_on_bg: c})}/>
                                </IonCol>
                            </IonRow>

                            <IonRow>
                                <IonCol  className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Botón</IonLabel>
                                <PopoverPicker color={customPalette.button} onChange={(c) => setCustomPalette({...customPalette, button: c})}/>
                                </IonCol>
                                <IonCol className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Burbujas</IonLabel>
                                <PopoverPicker color={customPalette.bubble} onChange={(c) => setCustomPalette({...customPalette, bubble: c})}/>
                                </IonCol>
                                <IonCol  className='EditColor-IonCol'>
                                <IonLabel className='EditColor-label'>Burbuja seleccionada</IonLabel>
                                <PopoverPicker color={customPalette.bubble_selected} onChange={(c) => setCustomPalette({...customPalette, bubble_selected: c})}/>
                                </IonCol>
                            </IonRow>
                            </IonGrid>
                        
                        

                    </div>
                    <div className='LinkProfiles-buttons editColorsButtons'>
                        <IonButton type="button" className='LinkProfiles-button' onClick={() => setShowModal(true)}>
                            Guardar
                        </IonButton>
                        <IonButton
                            type="submit"
                            className='LinkProfiles-button'
                            onClick={()=> setCustomPalette(originalPalette)}
                        >
                            Cancelar
                        </IonButton>
                        

                    </div>

                </div>

                <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
                <IonHeader className='Modal-EditColors-toolbar'>
                    <IonToolbar >
                    <IonTitle>Informe de accesibilidad</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => {setShowModal(false); setShowToast(false);}}>
                        <IonIcon icon={close} />
                        </IonButton>
                    </IonButtons>
                    </IonToolbar>
                </IonHeader>

                <IonContent className="ion-padding ModalColorEditContent">
                    <AccessibilityDashboard report={accessibilityReport} />

                    {showToast && (
                        <div className="SuccessEditColor" >
                        Cambios guardados correctamente ✔️
                        </div>
                    )}
                </IonContent>

                <IonFooter>
                    <IonToolbar>
                    <IonButton
                        expand="block"
                        onClick={savePalette}
                        disabled={accessibilityStatus == "fail"}
                    >
                        Aceptar
                    </IonButton>
                    </IonToolbar>
                </IonFooter>
                </IonModal>

            </IonContent>
        </IonPage>
    );
}