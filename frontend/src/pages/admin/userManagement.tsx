import { setupIonicReact } from '@ionic/react';
setupIonicReact();

import { IonPage, IonContent, IonSpinner, IonList, IonLabel, IonButton } from '@ionic/react';
import { Redirect, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import SimpleHeaderAdmin from './components/SimpleHeaderAdmin';
import TeacherManagementItem from './components/TeacherManagementItem';
import './userManagement.css';

interface User {
  userAvatar: string;
  userName: string;
}

export default function UserManagement() {

  const { tipo } = useParams<{ tipo: string }>();
  const { loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  // Redirige si el tipo no es válido
  if (tipo !== 'profesores' && tipo !== 'alumnos') {
    return <Redirect to="/admin-dashboard" />;
  }

  useEffect(() => {
    let isMounted = true; // evita actualizar estado si se desmonta

    const loadData = async () => {
      setLoading(true);

      let data: User[] = [];

      if (tipo === 'profesores') {
        data = [
          { userAvatar: 'https://ionicframework.com/docs/img/demos/avatar.svg', userName: 'Lucas Marín' },
          { userAvatar: 'https://ionicframework.com/docs/img/demos/avatar.svg', userName: 'Ana Rodríguez' },
        ];
      } else {
        data = [
          { userAvatar: 'https://ionicframework.com/docs/img/demos/avatar.svg', userName: 'Maria' },
          { userAvatar: 'https://ionicframework.com/docs/img/demos/avatar.svg', userName: 'Juan' },
        ];
      }

      if (isMounted) {
        setUsers(data);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false; // limpia el efecto al desmontar
    };
  }, [tipo]);

  if (authLoading || loading) {
    return (
      <IonPage>
        <IonContent className="ion-text-center">
          <IonSpinner />
        </IonContent>
      </IonPage>
    );
  }

  // Redirige si no está autenticado 
  // /*if (!user) { 
  //  return <Redirect to="/login" />; 
  // }*/

  return (
    <IonPage>
      <SimpleHeaderAdmin adminName="Admin" />
      <IonContent>
        <div className="teacherManagement-MainContainer">
          <div className="teacherManagement-TextAddButton">
            <IonLabel className="teacherManagement-TextTeacher">
              <h2>{tipo === 'profesores' ? 'Profesores' : 'Alumnos'}</h2>
            </IonLabel>
            <IonButton className="teacherManagement-AddButoon">
              Añadir nuevo {tipo === 'profesores' ? 'profesor' : 'alumno'}
            </IonButton>
          </div>
          <div className="teacherManagement-teacherTable">
            <IonList>
              {users.map((user, index) => (
                <TeacherManagementItem
                  key={index}
                  teacherAvatar={user.userAvatar}
                  teacherName={user.userName}
                />
              ))}
            </IonList>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
