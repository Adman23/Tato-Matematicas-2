import React from 'react';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonAvatar,
  useIonRouter
} from '@ionic/react';
import { homeOutline } from 'ionicons/icons';
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
  const router = useIonRouter();

  const handleEditClick = () => {
    router.push('/teacheredit/profile');
  };

  const handleHomeClick = () => {
    router.push('/teacher/dashboard');
  };

  return (
    <IonHeader className="headerBackground-teacherProfile">
      <IonToolbar className="toolbarTransparent-teacherProfile">
        
        {/* Contenedor principal flex */}
        <div className="container-teacherProfile">
          
          <IonButton className="homeButton-teacherProfile" onClick={handleHomeClick}>
            <IonIcon slot="icon-only" md={homeOutline} />
          </IonButton>

          <IonAvatar className="profileAvatar-teacherProfile">
            <img src={teacherAvatar} alt="Avatar del profesor" />
          </IonAvatar>

          {/* Contenedor de Info (Nombre + Botones) */}
          <div className="infoButtons-teacherProfile">
            {/* CORREGIDO: Usamos div en lugar de IonTitle para evitar conflictos de layout */}
            <div className="profileName-teacherProfile">
              {teacherName}
            </div>

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