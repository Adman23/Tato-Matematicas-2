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
  url?: string;
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
 * @param {string} [props.url] - URL para cambiar la ruta cuando esta en el perfil a los juegos
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
  photoUrl,
  url
}) => {

  const history = useHistory();
  const { user } = useAuth();


/**
   * Redirige al usuario a su página de perfil correspondiente.
   * 
   * En caso de que esté en la vista, ya sea student profile o teacher profile
   * se acepta una url para redirigir de vuelta al dashboard correspondiente
   * 
   * También, en caso de que se pase dicha url se cambia la imagen del boton
   */
  const handleProfile = () => {

    if (url != null){
      history.replace(url);
    }
    else
    if(user?.role === "teacher"){
      history.replace('/teacher/profile');
    }
    else{
      history.replace('/student/profile');
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
            onClick={handleProfile}>
            <div className="profile-button-content">
              { url != null ? (
                <>
                  <div className="header-text">JUEGOS</div>
                  <img
                    src="/assets/pictograms/juegos.png"
                    alt="Ir al dashboard"
                    className="user-dashborad-img"
                  />
                </> ) : (
                <>
                  <div className="header-text">MI PERFIL</div>
                  <img
                    src="/assets/pictograms/yo.png"
                    alt="Ir a mi perfil"
                    className="user-dashborad-img"
                  />
                </>
              )}
            </div>
          </IonButton>
        </IonButtons>

      </IonToolbar>
    </IonHeader>

  );
}

export default SimpleHeaderUser;
