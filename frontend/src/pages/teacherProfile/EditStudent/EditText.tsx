/**
 * @file EditText.tsx
 * @description edit page where teachers can change the text configuration of the app
 * They can choose different fonts and the font weight.
 * Protects the view by checking authentication context.
 */

import {
    IonPage,
    IonContent,
    IonTitle,
    IonLabel,
    IonButton,
    IonButtons,
    IonIcon,
    useIonRouter,
    IonItem,
    IonSelect,
    IonSelectOption

} from '@ionic/react';
import './EditText.css';
import { Redirect } from 'react-router-dom';
import SimpleHeaderEdit from './components/SimpleHeaderEdit';
import { useAuth } from '../../../contexts/AuthContext';
import { useParams } from "react-router-dom";
import { useEffect, useState } from 'react';
import FontSelector from './components/FontSelector';


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

    const router = useIonRouter();

    const [weight, setWeight] = useState();
    const [currentFont, setcurrentFont] = useState<string>("Arial");

    const handleHome = () => {
        router.push(`/student-edit-menu/${id}/${name}`);
    }

    if (!user) {
        return <Redirect to="/login" />;
    }

    return(
        <IonPage>

            <SimpleHeaderEdit studentName={name} Editing={"Editar texto"} onHome={handleHome}/>
            <IonContent className="ion-padding">
                <div className='MainContainer-EditText'>
                    
                    <div role="radiogroup" aria-label="Selecciona una fuente">
                        <FontSelector onSelect={(p)=> {console.log(p); setcurrentFont(p)}}/>
                    </div>

                    <div className='fontWeightContainer'>

                        <div className="previewBox" style={{ fontFamily: currentFont, fontWeight: weight, fontSize: "25px" }}>Texto de ejemplo</div>

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
                        <IonButton type="submit" className='LinkProfiles-button' onClick={() => ""}>
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
                

            </IonContent>
        </IonPage>
    );
}