import React from 'react';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonAvatar
} from '@ionic/react';
import { homeOutline } from 'ionicons/icons';
import './HeaderTeacherItem.css';
import { useHistory } from 'react-router';

interface Props {
  teacherName: string;
  teacherAvatar: string;
  onEditClick?: () => void;
  onLogoutClick?: () => void;
  onHomeClick?: () => void;
}

const HeaderItem: React.FC<Props> = ({
  teacherName,
  teacherAvatar,
  onEditClick,
  onLogoutClick,
  onHomeClick
}) => {


    return(

        <IonHeader className="headerBackground">

            <IonToolbar className="toolbarTransparent">

                <div className='container'>

                    <IonButton className='homeButton' >
                        <IonIcon slot="icon-only" md={homeOutline}></IonIcon>
                    </IonButton>

                    <IonAvatar className="profileAvatar">
                        <img src={teacherAvatar} alt="Avatar"/>
                    </IonAvatar>

                    <div className='infoButtons'>

                        <IonTitle className="profileName">{teacherName}</IonTitle>
                        <IonButtons slot="end" className="actionButtons">
                            <IonButton className="editButton" onClick={onEditClick}>
                            Editar
                            </IonButton>
                            <IonButton className="logoutButton" onClick={onLogoutClick}>
                            Cerrar sesión
                            </IonButton>
                        </IonButtons>

                    </div>

                </div>

            </IonToolbar>
        </IonHeader>
    )
};

export default HeaderItem;