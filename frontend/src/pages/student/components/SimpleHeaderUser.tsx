import {
  IonToolbar,
  IonHeader,
  IonButtons,
  useIonRouter
} from '@ionic/react';
import './SimpleHeaderUser.css';
import { setupIonicReact } from '@ionic/react';
import { useAuth } from '../../../contexts/AuthContext';

import { Button3Dtext } from '../../global_components/PushableButtons';


setupIonicReact();

interface Props {
  userName: string;
  photoUrl?: string;
  hidden?: boolean;
}


const SimpleHeaderUser: React.FC<Props> = ({
  userName,
  photoUrl,
  hidden = false,
}) => {
  const router = useIonRouter();
  const { } = useAuth();



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

        {!hidden && (
          <IonButtons slot="end">
            <Button3Dtext color="var(--button-profile-bg)" onClick={()=>router.push('/student/profile', "back", "pop")}>
                <img
                  src="/assets/pictograms/yo.png"
                  alt="Ir a mi perfil"
                  className="btn-icon-header-user"
                />
                <span className="btn-text">MI PERFIL</span>
            </Button3Dtext>
          </IonButtons>
        )}

      </IonToolbar>
    </IonHeader>
  );
}

export default SimpleHeaderUser;