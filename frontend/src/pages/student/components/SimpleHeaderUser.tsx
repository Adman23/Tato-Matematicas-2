import {
  IonToolbar,
  IonButton,
  IonHeader,
  IonButtons,
} from '@ionic/react';

import './SimpleHeaderUser.css';
import { useHistory } from 'react-router-dom';
import { setupIonicReact } from '@ionic/react';
import { useAuth } from '../../../contexts/AuthContext';

setupIonicReact();

interface Props {
  userName: string;
  photoUrl?: string;
}

const SimpleHeaderUser: React.FC<Props> = ({
  userName,
  photoUrl
}) => {

  const history = useHistory();
  const { user } = useAuth();



  const handleProfile = () => {
    //REDIRIGIR AL PERFIL DEL USUARIO
    /*if (history.location.pathname !== '/admin-dashboard') {
      history.replace('/admin-dashboard');
    }
    else {
      history.replace('/admin-dashboard');
    }*/

      if(user?.role === "teacher"){

        history.replace('/teacher-profile');
      }
  }

  return (
    <IonHeader>
      <IonToolbar className="toolbar-header-user">
        <IonButtons slot="start">
          <img
            src={photoUrl || "/assets/pictograms/user_default.png"}
            alt="tu avatar"
            className="user-dashborad-img"
          />

          <div className="header-text">{userName}</div>
        </IonButtons>

        <IonButtons slot="end">
          <IonButton className="header-profile-button"
            fill="clear"
            onClick={handleProfile}
          >
            <div className="profile-button-content">
              <div className="header-text">MI PERFIL</div>
              <img
                src="/assets/pictograms/yo.png"
                alt="Ir a mi perfil"
                className="user-dashborad-img"
              />
            </div>
          </IonButton>
        </IonButtons>

      </IonToolbar>
    </IonHeader>

  );
}

export default SimpleHeaderUser;
