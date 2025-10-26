import { IonPage, IonContent, IonSpinner, IonList } from '@ionic/react';
import { useHistory, Redirect } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './teacherProfilePage.css';
import StudentItem from './components/StudentItem';
import HeaderTeacherItem from './components/HeaderTeacherItem';

export default function TeacherProfilePage() {
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

  const students = [
  {
    studentAvatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
    studentName: 'Lucas Marín',
    studentClass: 'Clase A',
  },
  {
    studentAvatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
    studentName: 'Ana Pérez',
    studentClass: 'Clase B',
  },
  {
    studentAvatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
    studentName: 'Lucas Marín',
    studentClass: 'Clase A',
  },
  {
    studentAvatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
    studentName: 'Ana Pérez',
    studentClass: 'Clase B',
  },
  {
    studentAvatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
    studentName: 'Lucas Marín',
    studentClass: 'Clase A',
  },
  {
    studentAvatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
    studentName: 'Ana Pérez',
    studentClass: 'Clase B',
  },
  // agrega más estudiantes o tráelos del backend
];


  // Usuario autenticado - muestra contenido
  return (
    <IonPage>

      <HeaderTeacherItem teacherName="profesor"teacherAvatar="https://ionicframework.com/docs/img/demos/avatar.svg" />
      <IonContent>
        <div className='studentTable'>

          <IonList>
            {students.map(student => (
                <StudentItem
                  studentAvatar={student.studentAvatar}
                  studentName={student.studentName}
                  studentClass={student.studentClass}
                />
              ))}
          </IonList>
        </div>
      </IonContent>
    </IonPage>
  );
}