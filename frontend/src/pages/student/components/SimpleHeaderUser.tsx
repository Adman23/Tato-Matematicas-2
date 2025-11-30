import {
  IonToolbar,
  IonHeader,
  IonButtons,
} from '@ionic/react';
import './SimpleHeaderUser.css';
import { useHistory } from 'react-router-dom';
import { setupIonicReact } from '@ionic/react';
import { useAuth } from '../../../contexts/AuthContext';

import { Button3Dtext } from '../../global_components/PushableButtons';

setupIonicReact();

interface Props {
  userName: string;
  photoUrl?: string;
  url?: string;
}


const SimpleHeaderUser: React.FC<Props> = ({
  userName,
  photoUrl,
  url
}) => {
  const history = useHistory();
  const { user, logout } = useAuth();

  const handleProfile = () => {
    if (url != null) {
      history.replace(url);
    } else if (user?.role === "teacher") {
      history.replace('/teacher/profile');
    } else {
      history.replace('/student/profile');
    }
  }

  const handleLogout = async () => {
    await logout();
    history.replace('/home');
  }

  return (
    <IonHeader className="ion-no-border">
      <IonToolbar className="toolbar-header-user">

        {/* IZQUIERDA: Restaurado al estilo original */}
        <IonButtons slot="start">
          <img
            src={photoUrl || "/assets/pictograms/user_default.png"}
            alt="tu avatar"
            className="user-dashborad-img"
          />
          <div className="header-text">{userName}</div>
        </IonButtons>

        <IonButtons slot="end">
          <Button3Dtext onClick={handleLogout}>
            <>
              <span className="btn-text">CERRAR SESIÓN</span>
              <img
                src="/assets/pictograms/salir.png"
                alt="Cerrar sesión"
                className="btn-icon-header-user"
              />
            </>
          </Button3Dtext>
          <Button3Dtext onClick={handleProfile}>
            {url != null ? (
              <>
                <span className="btn-text">JUEGOS</span>
                <img
                  src="/assets/pictograms/juegos.png"
                  alt="Ir al dashboard"
                  className="btn-icon-header-user"
                />
              </>
            ) : (
              <>
                <span className="btn-text">MI PERFIL</span>
                <img
                  src="/assets/pictograms/yo.png"
                  alt="Ir a mi perfil"
                  className="btn-icon-header-user"
                />
              </>
            )}
          </Button3Dtext>
        </IonButtons>

      </IonToolbar>
    </IonHeader>
  );
}

export default SimpleHeaderUser;