import {setupIonicReact} from '@ionic/react'

setupIonicReact();

import { IonPage, IonContent, IonSpinner, IonList, IonLabel, IonButton } from '@ionic/react';
import { useHistory, Redirect } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './teacherManagement.css';
import SimpleHeaderAdmin from './components/SimpleHeaderAdmin';
import TeacherManagementItem from './components/TeacherManagementItem';

export default function teacherManagement() {
  const { /*user,*/ loading } = useAuth();

  // Espera mientras verifica autenticación
  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-text-center">
          <IonSpinner />
        </IonContent>
      </IonPage>
    );
  }

  // Redirige si no está autenticado
  /*if (!user) {
    return <Redirect to="/login" />;
  }*/

    const teacher = [
  {
    teacherAvatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
    teacherName: 'Lucas Marín',

  },
  {
    teacherAvatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
    teacherName: 'Ana rodríguez',

  },
  {
    teacherAvatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
    teacherName: 'Lucas Marín',

  },
  {
    teacherAvatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
    teacherName: 'Ana rodríguez',

  },
  {
    teacherAvatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
    teacherName: 'Lucas Marín',

  },
  {
    teacherAvatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
    teacherName: 'Ana rodríguez',

  },
  
  // agrega más estudiantes o tráelos del backend
];

  // Usuario autenticado - muestra contenido
  return (
    <IonPage>

      <SimpleHeaderAdmin adminName="administrador" />
      <IonContent>

        <div className='teacherManagement-MainContainer'>

            <div className='teacherManagement-TextAddButton'>

                <IonLabel className='teacherManagement-TextTeacher'><h2>Profesores</h2></IonLabel>

                <IonButton className='teacherManagement-AddButoon'>Añadir nuevo profesor</IonButton>

            </div>

            <div className='teacherManagement-teacherTable'>

                <IonList>
                    {teacher.map(teacher => (
                        <TeacherManagementItem
                        teacherAvatar={teacher.teacherAvatar}
                        teacherName={teacher.teacherName}
                        />
                    ))}
                </IonList>

            </div>
          
        </div>

      </IonContent>
    </IonPage>
  );
}