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
import { useHistory } from 'react-router-dom'; // ✅ nuevo
import './HeaderTeacherItem.css';

interface Props {
  teacherName: string;
  teacherAvatar: string;
  onLogoutClick?: () => void;
}

const HeaderItem: React.FC<Props> = ({
  teacherName,
  teacherAvatar,
  onLogoutClick,
}) => {
  const history = useHistory(); // ✅ hook de navegación

  const handleEditClick = () => {
    history.push('/teacheredit/profile'); // ✅ redirige
  };

  const handleHomeClick = () => {
    history.push('/home'); // ✅ también activamos el botón home
  };

  return (
    <IonHeader className="headerBackground-teacherProfile">
      <IonToolbar className="toolbarTransparent-teacherProfile">
        <div className="container-teacherProfile">
          <IonButton className="homeButton-teacherProfile" onClick={handleHomeClick}>
            <IonIcon slot="icon-only" md={homeOutline} />
          </IonButton>

          <IonAvatar className="profileAvatar-teacherProfile">
            <img src={teacherAvatar} alt="Avatar del profesor" />
          </IonAvatar>

          <div className="infoButtons-teacherProfile">
            <IonTitle className="profileName-teacherProfile">{teacherName}</IonTitle>
            <IonButtons slot="end" className="actionButtons-teacherProfile">
              <IonButton className="editButton-teacherProfile" onClick={handleEditClick}>
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
  );
};

export default HeaderItem;