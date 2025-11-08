import React from 'react';
import { IonItem, IonIcon, IonButton } from '@ionic/react';
import { create, trashOutline } from 'ionicons/icons';
import './GroupItem.css';

interface Props {
    groupName: string;
    onEditClick?: () => void;

}

const GroupItem: React.FC<Props> = ({
    groupName
}) => {
    return (

        <IonItem lines="none" className="groupItem-item">

            {/* Contenedor interno para controlar flex sin tocar el ion-item por fuera */}
            <div className="groupItem-mainContainer">

                <div className="groupItem-name">{groupName}</div>

                <div className='groupItem-icons'>

                    <IonButton className='groupItem-IconButton'>
                        <IonIcon slot="icon-only" md={create}></IonIcon>
                    </IonButton>

                    <IonButton className='groupItem-IconButton'>
                        <IonIcon slot="icon-only" md={trashOutline}></IonIcon>
                    </IonButton>
                </div>

            </div>

        </IonItem >
    );
};

export default GroupItem;