import React from "react";
import { IonHeader, IonButton, IonIcon, IonTitle, IonToolbar } from "@ionic/react";
import { homeOutline } from "ionicons/icons";
import './SimpleHeaderAdmin.css'

interface Props{

    adminName: String;
}

const SimpleHeaderAdmin: React.FC<Props> = ({

    adminName

}) => {

    return(

        <IonHeader className="simpleHeader-header">

            <IonToolbar color="#50BFE6" className="simpleHeader-toolbar">

                <IonButton className="simpleHeader-homeButton">

                    <IonIcon slot="icon-only" md={homeOutline}></IonIcon>

                </IonButton>

                <IonTitle className="simpleHeader-adminName">{adminName}</IonTitle>

                <IonButton slot="end" className="simpleHeader-logoutButton">Cerrar sesión</IonButton>

            </IonToolbar>

        </IonHeader>
    )
};

export default SimpleHeaderAdmin;