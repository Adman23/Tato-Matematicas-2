import {
    IonTitle,
    IonToolbar,
    IonButton,
    IonHeader,
    IonButtons,
    IonIcon,
    IonAvatar

} from '@ionic/react';

import './LinkProfiles.css';
import { homeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useState } from 'react';
import type { User } from '../../lib/api';

export default function LinkProfiles() {

    const history = useHistory();

    const [selectedProfessor, setSelectedProfessor] = useState<string | null>(null);
    const [profesors, setProfesors] = useState<User[]>([]);

    const handleSelectChange = (event: CustomEvent) => {
        setSelectedProfessor(event.detail.value);
    };

    return (
        <IonHeader className="header-link-profiles">
            <IonToolbar className="toolbar-link-profiles">

                <div className='container-link-profiles'>

                    <IonButton className='homeButton-link-profiles' >
                        <IonIcon slot="icon-only" md={homeOutline}></IonIcon>
                    </IonButton>

                    <IonAvatar className="picture-profile">
                        <img src="https://ionicframework.com/docs/img/demos/avatar.svg" alt="Avatar" />
                    </IonAvatar>

                    <div className='infoButtons-link-profiles'>

                        <IonTitle className='title-link-profiles'>Admin</IonTitle>
                        <IonButtons slot="end" className="actionButtons-link-profiles">
                            <IonButton
                                className='logout-button'
                                expand="block"
                                fill="clear"
                                onClick={() => history.push('/')}
                            >
                                Cerrar sesión
                            </IonButton>
                        </IonButtons>

                    </div>

                </div>

            </IonToolbar>
        </IonHeader>
    );
}
