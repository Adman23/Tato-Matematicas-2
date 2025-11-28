import {
  IonToolbar,
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
  url?: string;
}

const SimpleHeaderUser: React.FC<Props> = ({
  userName,
  photoUrl,
  url
}) => {
  const history = useHistory();
  const { user } = useAuth();

  const handleProfile = () => {
    if (url != null) {
      history.replace(url);
    } else if (user?.role === "teacher") {
      history.replace('/teacher/profile');
    } else {
      history.replace('/student/profile');
    }
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

        {/* DERECHA: Nuevo Botón 3D físico */}
        <IonButtons slot="end">
          <button className="pushable-button" onClick={handleProfile}>
            <span className="shadow"></span>
            <span className="edge"></span>
            <span className="front">
              <div className="button-content">
                {url != null ? (
                  <>
                    <span className="btn-text">JUEGOS</span>
                    <img
                      src="/assets/pictograms/juegos.png"
                      alt="Ir al dashboard"
                      className="btn-icon"
                    />
                  </>
                ) : (
                  <>
                    <span className="btn-text">MI PERFIL</span>
                    <img
                      src="/assets/pictograms/yo.png"
                      alt="Ir a mi perfil"
                      className="btn-icon"
                    />
                  </>
                )}
              </div>
            </span>
          </button>
        </IonButtons>

      </IonToolbar>
    </IonHeader>
  );
}

export default SimpleHeaderUser;