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
//import { useHistory } from 'react-router';

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
  //onHomeClick
}) => {


    return(

        <IonHeader className="headerBackground-teacherProfile">

            <IonToolbar className="toolbarTransparent-teacherProfile">

                <div className='container-teacherProfile'>

                    <IonButton className='homeButton-teacherProfile' >
                        <IonIcon slot="icon-only" md={homeOutline}></IonIcon>
                    </IonButton>

                    <IonAvatar className="profileAvatar-teacherProfile">
                        <img src={teacherAvatar} alt="Avatar"/>
                    </IonAvatar>

                    <div className='infoButtons-teacherProfile'>

                        <IonTitle className="profileName-teacherProfile">{teacherName}</IonTitle>
                        <IonButtons slot="end" className="actionButtons-teacherProfile">
                            <IonButton className="editButton-teacherProfile" onClick={onEditClick}>
                            Editar
                            </IonButton>
                            <IonButton className="logoutButton-teacherProfile" onClick={onLogoutClick}>
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