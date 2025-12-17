/**
 * @file EditText.tsx
 * @description edit page where teachers can change the text configuration of the app
 * They can choose different fonts and the font weight.
 * Protects the view by checking authentication context.
 */

import {
    IonPage,
    IonContent,
    IonLabel,
    IonButton,
    useIonRouter,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonToast

} from '@ionic/react';
import './EditText.css';
import { Redirect } from 'react-router-dom';
import SimpleHeaderEdit from './components/SimpleHeaderEdit';
import { useAuth } from '../../../contexts/AuthContext';
import { useParams } from "react-router-dom";
import { useEffect, useState } from 'react';
import FontSelector from './components/FontSelector';
import { saveFont } from '../../../lib/api';


/**
 * Functional Summary.
 *
 * From this page, a teacher can change the text configuration for a certain student
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
 * <Route path="/student-edit-text" component={EditText} />
 * ```
 */

export default function EditText(){

    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const { name } = useParams<{ name: string }>();
    const { role } = useParams<{ role: string }>();

    const router = useIonRouter();

    const [showToast, setShowToast] = useState(false);


    const [weight, setWeight] = useState("400");
    const [currentFont, setcurrentFont] = useState<string>("'Atkinson Hyperlegible', sans-serif");

    const [textConfig, settextConfig] = useState({
        
        font: currentFont,
        weight: weight,
    });

    const handleHome = () => {
        router.push(`/student-edit-menu/${id}/${name}/${role}`, 'back', 'pop');
    }

    if (!user) {
        return <Redirect to="/login" />;
    }

    useEffect(() => {
        settextConfig({
            font: currentFont,
            weight: weight,
        });
        console.log("Cambio", textConfig);
    }, [currentFont, weight]);


    const saveTextConfiguration = async () => {
        try {
            await saveFont(id, textConfig);
            setShowToast(true);

            router.push(`/student-edit-menu/${id}/${name}`, 'back');
           
            //console.log("Configuración guardada correctamente!", customPalette);
        } catch (err) {
            console.error("Error al guardar la paleta", err);
        }
    };

    return(
        <IonPage>

            <SimpleHeaderEdit studentName={name} Editing={"Editar texto"} onHome={handleHome}/>
            <IonContent className="ion-padding">
                <div className='MainContainer-EditText'>
                    
                    <div role="radiogroup" aria-label="Selecciona una fuente">
                        <FontSelector onSelect={(p)=> {console.log(p); setcurrentFont(p)}}/>
                    </div>

                    <div className='fontWeightContainer'>

                        <div className="previewBox" style={{ fontFamily: currentFont, fontWeight: weight, fontSize: "25px" }}>
                            Este es un texto de ejemplo para previsualizar
                            la fuente escogida.
                        </div>

                        <IonItem className='DropDown-EditText'>
                            <IonLabel>Peso del texto</IonLabel>
                            <IonSelect
                            className='weightSelector'
                                interface="popover"
                                value={weight}
                                aria-label="Selector de grosor de fuente"
                                onIonChange={(e) => {
                                    setWeight(e.detail.value);
                                }}
                            >
                                <IonSelectOption value="300">Fino (300)</IonSelectOption>
                                <IonSelectOption value="400">Normal (400)</IonSelectOption>
                                <IonSelectOption value="600">Negrita (600)</IonSelectOption>
                            </IonSelect>
                            </IonItem>

                            
                    </div>
                    <div className='LinkProfiles-buttons editTextButtons'>
                        <IonButton type="submit" className='LinkProfiles-button' onClick={saveTextConfiguration}>
                            Guardar
                        </IonButton>
                        <IonButton
                            type="submit"
                            className='LinkProfiles-button'
                            onClick={()=> ""}
                        >
                            Cancelar
                        </IonButton>
                        

                    </div>

                </div>

                <IonToast className='Iontoast-EditarText'
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message="¡Cambios guardados correctamente!"
                    duration={2000}
                    position="bottom"
                    color="success"
                />
                

            </IonContent>
        </IonPage>
    );
}