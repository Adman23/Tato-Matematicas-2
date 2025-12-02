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
  IonRow,
  IonCol,
  IonButton
} from '@ionic/react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SimpleHeaderUser from './components/SimpleHeaderUser';
import { Button3Dtext } from '../global_components/PushableButtons';
import './EditColorsStudent.css';
import type { Palette } from '../teacherProfile/EditStudent/types/palette';
import { saveColorPalette } from '../../lib/api';
import PaletteSelector from '../teacherProfile/EditStudent/components/PaletteSelector';
import imgAceptar from '/assets/juegosImg/aceptar.png';
import { useUserData } from '../../contexts/UserContext';

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
  //const router = useIonRouter();


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
      const [colorPrincipal] = useState("var(--ion-color-primary)");
      const [colorTextoPrincipal] = useState("var(--tatomaths-text-primary)");
      const [colorFondo] = useState("var(--ion-color-primary-contrast)");
      const [colorTextoFondo] = useState("var(--tatomaths-text)");
      const [colorButton] = useState("var(--button-profile-bg)");
      const [colorBubble] = useState("var(--bubble-bg)");
      const [colorBubbleSelected] = useState("var(--bubble-selected-bg)");

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
                
                console.log("Paleta guardada correctamente!", customPalette);
            } catch (err) {
                console.error("Error al guardar la paleta", err);
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
              userName={user?.username || "username"}
              photoUrl={user?.photo_url}
            />

            <IonContent className="ion-padding">

                <div className='EditColor-Container'>

                  <PaletteSelector palettes={examplePalette} onSelect={applyPalette}></PaletteSelector>

                  <div className='AdvancedConfiguration-PrimaryColors_example'>

                    <div className='Preview-PrimaryColors-Example' style={{ backgroundColor: customPalette.primary }}>
                      <span className='Text-PrimaryColors-Example' style={{ color: customPalette.text_on_primary }}>Hola!</span>
                      <Button3Dtext className='Button-PrimaryColors-Example' color={customPalette.button}><span></span></Button3Dtext>
                    </div>

                    <IonGrid>

                      <IonRow>

                        <IonCol className='colgrid-PrimaryColors-Example'>
                          <Button3Dtext className='Button-PrimaryColors-Example' 
                          color="#1863A3"
                          onClick={()=>{setCustomPalette({...customPalette, primary: "#1863A3", text_on_primary:"#FFFFFF", button: "#A9DAF3"})}}>
                            <span></span>
                          </Button3Dtext>
                        </IonCol>
                        <IonCol className='colgrid-PrimaryColors-Example'>
                          <Button3Dtext className='Button-PrimaryColors-Example' 
                          color="#6A1B9A"
                          onClick={()=>{setCustomPalette({...customPalette, primary: "#6A1B9A", text_on_primary:"#FFFFFF", button: "#E8D6F3"})}}>
                            <span></span>
                          </Button3Dtext>
                        </IonCol>
                        <IonCol className='colgrid-PrimaryColors-Example'>
                          <Button3Dtext className='Button-PrimaryColors-Example' 
                          color="#006B33"
                          onClick={()=>{setCustomPalette({...customPalette, primary: "#006B33", text_on_primary:"#FFFFFF", button: "#b1ecb1ff"})}}>
                            <span></span>
                          </Button3Dtext>
                        </IonCol>
                      </IonRow>

                      <IonRow>

                        <IonCol className='colgrid-PrimaryColors-Example'>
                          <Button3Dtext className='Button-PrimaryColors-Example' 
                          color="#005F73"
                          onClick={()=>{setCustomPalette({...customPalette, primary: "#005F73", text_on_primary:"#FFFFFF", button: "#9AF5F9"})}}>
                            <span></span>
                          </Button3Dtext>
                        </IonCol>
                        <IonCol className='colgrid-PrimaryColors-Example'>
                          <Button3Dtext className='Button-PrimaryColors-Example' 
                          color="#D9384E"
                          onClick={()=>{setCustomPalette({...customPalette, primary: "#D9384E", text_on_primary:"#FFFFFF", button: "#FADCDF"})}}>
                            <span></span>
                          </Button3Dtext>
                        </IonCol>
                        <IonCol className='colgrid-PrimaryColors-Example'>
                          <Button3Dtext className='Button-PrimaryColors-Example' 
                          color="#B76e00"
                          onClick={()=>{setCustomPalette({...customPalette, primary: "#B76e00", text_on_primary:"#000000", button: "#FFDCA8"})}}>
                            <span></span>
                          </Button3Dtext>
                        </IonCol>
                      </IonRow>
                    </IonGrid>
                  </div>  

                </div>

                <div className='Accept-button-container-editColorsStudent'>
                  {/* Accept/Check button */}
                  <IonButton 
                      
                      fill="clear"
                      className="game1-check-button"
                      onClick={async () => {
                        await savePalette();      // ejecuta y espera a que termine
                        await handleRefresh();    // ejecuta y espera a que termine
                      }}
                      
                  >
                      <img
                          src={imgAceptar}
                          alt="Guardar los cambios"
                          className="game1-check-button-image"
                      />
                  </IonButton>

                </div>
                
                

            </IonContent>



          </IonPage>


        );


}

