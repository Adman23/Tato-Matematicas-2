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

/**
 * Componente que muestra un encabezado simple con el nombre del usuario,
 * su imagen de perfil y un botón para acceder a la página de perfil.
 *
 * Este encabezado se utiliza normalmente en vistas donde el usuario
 * necesita una referencia rápida a su identidad y un acceso directo
 * a su perfil personal.
 *
 * @component
 * @param {Props} props - Propiedades del componente.
 * @param {string} props.userName - Nombre del usuario.
 * @param {string} [props.photoUrl] - URL de la imagen de perfil del usuario.
 *
 * @example
 * ```tsx
 * <SimpleHeaderUser
 *   userName="Juan Pérez"
 *   photoUrl="https://example.com/avatar.jpg"
 * />
 * ```
 */
const SimpleHeaderUser: React.FC<Props> = ({
  userName,
  photoUrl
}) => {

  const history = useHistory();
  const { user } = useAuth();


 /**
   * Redirige al usuario a su página de perfil correspondiente.
   * 
   * Actualmente, solo se contempla la ruta `/teacher-profile` para usuarios con rol `teacher`.
   * En el futuro se pueden añadir más roles o rutas según el tipo de usuario.
   */
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
