/**
 * @file EditColorsStudent.tsx
 * @description Screen for the color configuration.
 *
 * It allows the student to change the colors of the application. The colors are 
 * saved in the data base.
 *
 * Screen flow:
 * 1. Loads the actual configuration of the user from the backend.
 * 2. Shows 4 options of color palettes.
 * 3. It allows to choose one of them.
 * 4. Then, it allows a more advanced configuration, letting the student choose between 
 *    some options for the primary color.
 * 5. Saves the new configuration.
 * 6. Redirect to the student profile.

 *
 * @returns React component with the configuration UI.
 */

import {
  IonPage,
  IonContent,
  IonGrid,
  IonCol,
  useIonRouter,
  IonIcon,
} from '@ionic/react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SimpleHeaderUser from './components/SimpleHeaderUser';
import { Button3Dtext } from '../global_components/PushableButtons';
import './EditColorsStudent.css';
import type { Palette } from '../teacherProfile/EditStudent/types/palette';
import { saveColorPalette } from '../../lib/api';
import PaletteSelector from '../teacherProfile/EditStudent/components/PaletteSelector';
import { useUserData } from '../../contexts/UserContext';
import { arrowBack } from 'ionicons/icons';
import iconCorrect from '/assets/juegosImg/correct.png';

/**
 * Principal component of the color configuration.
 *
 * Functional summary:
 * Configuration interface that lets the studen personalice the colors of the app, selecting between
 * predefined options in order to maintain accesibility.
 *
 * Execution flow:
 * 1. Loads the current colors
 * 2. The students choose the color palette
 * 3. The students choose other color for the primary color
 * 4. The students clicks on the button "Aceptar"
 * 5. The new configuration is saved in the data base, refresh the app and returns to 
 *    the profile.
 *
 * @returns React component with the configuration UI.
 *
 * @example
 * <Route path="/student/edit-colors" component={EditColorsStudent} />
 */

export default function EditColorsStudent(){

  const { user } = useAuth();
  const { refreshUserData } = useUserData();

  //aria labels for aria-live
  const [ariaMessage, setAriaMessage] = useState('');
  const router = useIonRouter();



  //Predefined color palettes
    const examplePalette = [
        {
            id: 1,
            name: "Paleta azul predeterminada",
            colors: ["#1863A3", "#ffffff", "#ffffff", "#000000", "#A9DAF3", "#4793AB", "#D76FBF"]
        },
        {
            id: 2,
            name: "Paleta morada",
            colors: ["#6A1B9A", "#FFFFFF", "#f3e8f7ff", "#1A1A1A","#E8D6F3", "#AF65EB", "#0F8F8F"]
        },
        {
            id: 3,
            name: "Paleta verde",
            colors: ["#006B33", "#FFFFFF", "#effff0ff", "#1A1A1A","#b1ecb1ff", "#4E8F4E", "#B8653C"]
        },
        {
            id: 4,
            name: "Paleta turquesa y gris",
            colors: ["#005f73", "#FFFFFF", "#f0f0f0", "#0a0a0a","#9AF5F9", "#4E967F", "#e06200"]
        },

    ];

    const rootStyles = getComputedStyle(document.documentElement);

    //Colors of each palette
      const [colorPrincipal] = useState(rootStyles.getPropertyValue('--ion-color-primary').trim());
      const [colorTextoPrincipal] = useState(rootStyles.getPropertyValue('--tatomaths-text-primary').trim());
      const [colorFondo] = useState(rootStyles.getPropertyValue('--ion-color-primary-contrast').trim());
      const [colorTextoFondo] = useState(rootStyles.getPropertyValue('--tatomaths-text').trim());
      const [colorButton] = useState(rootStyles.getPropertyValue('--button-profile-bg').trim());
      const [colorBubble] = useState(rootStyles.getPropertyValue('--bubble-bg').trim());
      const [colorBubbleSelected] = useState(rootStyles.getPropertyValue('--bubble-selected-bg').trim());

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

        //Function for saving the palette in the data base
        const savePalette = async () => {
            try {
              if (!user?.id) return;

                await saveColorPalette(user.id, customPalette);
                
                setAriaMessage('Paleta guardada correctamente');
                
                console.log("Paleta guardada correctamente!", customPalette);
            } catch (err) {
                console.error("Error al guardar la paleta", err);
                setAriaMessage('Error al guardar la paleta');
            }
        };

        /**
         * @brief Its used by the refresh button
         */
        const handleRefresh = async () => {
            await refreshUserData();
        }

        return(

          <IonPage>
            <SimpleHeaderUser
                title="Colores"
                title_image="/assets/pictograms/editar.png"
                userName={user?.username || "username"}
                photoUrl={user?.photo_url} hidden={true} />

            <IonContent className="ion-padding EditColorsStudent-Content">
                <Button3Dtext 
                    onClick={() => router.push('/student/profile', 'back', 'pop')} 
                    aria-label="Volver atrás">
                    <IonIcon icon={arrowBack} />
                </Button3Dtext>

                <div className='EditColor-Container'>

                  <div className='SelectorContainer-EditColorsStudent'>

                    <PaletteSelector palettes={examplePalette} onSelect={applyPalette}></PaletteSelector>

                  </div>

                  <div className='AdvancedConfiguration-PrimaryColors_example'>

                    <div className='Preview-PrimaryColors-Example' style={{ backgroundColor: customPalette.primary }}>
                      <span className='Text-PrimaryColors-Example' style={{ color: customPalette.text_on_primary }}>Hola!</span>
                      <Button3Dtext className='Button-PrimaryColors-Example' aria-hidden="true" tabIndex={-1} color={customPalette.button}><span></span></Button3Dtext>
                    </div>

                    <IonGrid className="ion-grid-custom">
                      <IonCol className='colgrid-PrimaryColors-Example'>
                        <Button3Dtext className='Button-PrimaryColors-Grid' 
                          color="#1863A3"
                          aria-label='color azul'
                          onClick={()=>{setCustomPalette({...customPalette, primary: "#1863A3", text_on_primary:"#FFFFFF", button: "#A9DAF3"})}}>
                          <span></span>
                        </Button3Dtext>
                      </IonCol>

                      <IonCol className='colgrid-PrimaryColors-Example'>
                        <Button3Dtext className='Button-PrimaryColors-Grid'
                          color="#6A1B9A"
                          aria-label='color morado' 
                          onClick={()=>{setCustomPalette({...customPalette, primary: "#6A1B9A", text_on_primary:"#FFFFFF", button: "#E8D6F3"})}}>
                          <span></span>
                        </Button3Dtext>
                      </IonCol>

                      <IonCol className='colgrid-PrimaryColors-Example'>
                        <Button3Dtext className='Button-PrimaryColors-Grid' 
                          color="#006B33"
                          aria-label='color verde'
                          onClick={()=>{setCustomPalette({...customPalette, primary: "#006B33", text_on_primary:"#FFFFFF", button: "#b1ecb1ff"})}}>
                          <span></span>
                        </Button3Dtext>
                      </IonCol>

                      <IonCol className='colgrid-PrimaryColors-Example'>
                        <Button3Dtext className='Button-PrimaryColors-Grid' 
                          color="#005F73"
                          aria-label='color turquesa'
                          onClick={()=>{setCustomPalette({...customPalette, primary: "#005F73", text_on_primary:"#FFFFFF", button: "#9AF5F9"})}}>
                          <span></span>
                        </Button3Dtext>
                      </IonCol>

                      <IonCol className='colgrid-PrimaryColors-Example'>
                        <Button3Dtext className='Button-PrimaryColors-Grid' 
                          color="#D9384E"
                          aria-label='color rosa'
                          onClick={()=>{setCustomPalette({...customPalette, primary: "#D9384E", text_on_primary:"#FFFFFF", button: "#FADCDF"})}}>
                          <span></span>
                        </Button3Dtext>
                      </IonCol>

                      <IonCol className='colgrid-PrimaryColors-Example'>
                        <Button3Dtext className='Button-PrimaryColors-Grid' 
                          color="#B76e00"
                          aria-label='color naranja'
                          onClick={()=>{setCustomPalette({...customPalette, primary: "#B76e00", text_on_primary:"#000000", button: "#FFDCA8"})}}>
                          <span></span>
                        </Button3Dtext>
                      </IonCol>
                    </IonGrid>

                  </div>  

                </div>

                <div className='Accept-button-container-editColorsStudent'>

                  <Button3Dtext className="exit-btn accepChanges-EditColor" 
                  onClick={async () => {
                    await savePalette();      // ejecuta y espera a que termine
                    await handleRefresh();    // ejecuta y espera a que termine
                  }} 
                  aria-label="¡Hecho!">
                      <img src={iconCorrect} alt="Guardar los cambios" />
                  </Button3Dtext>

                </div>

                {/*Aria-live div*/}
                <div
                  aria-live="polite"
                  style={{
                    position: 'absolute',
                    left: '-9999px',
                    height: 0,
                    overflow: 'hidden'
                  }}
                >
                  {ariaMessage}
                </div>

            </IonContent>

          </IonPage>

        );

}

