import { setupIonicReact } from '@ionic/react';
setupIonicReact();

import { IonPage, IonContent, IonSpinner, IonList, IonLabel, IonButton, useIonRouter } from '@ionic/react';
import { Redirect, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { fetchStudents, fetchTeachers } from '../../lib/api';
import SimpleHeaderAdmin from './components/SimpleHeaderAdmin';
import TeacherManagementItem from './components/TeacherManagementItem';
import './userManagement.css';


// Nota: interface User no usada — eliminada para evitar error de lint/ts

export default function UserManagement() {

  const { tipo } = useParams<{ tipo: string }>();
  const { user, loadingAuth: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ id: string; username: string; photo_url: string }[]>([]);

  const router = useIonRouter();

  /*
  // Redirige si el tipo no es válido
  if (tipo !== 'profesores' && tipo !== 'alumnos') {
    return <Redirect to="/admin/dashboard" />;
  }
  */

  /*useEffect(() => {
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
  }, [tipo]);*/


  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        if (tipo === "profesores") {
          const teachers = await fetchTeachers();
          console.log("Profesores recibidos:", teachers);
          setUsers(teachers);
        } else {
          const students = await fetchStudents();
          console.log("Estudiantes recibidos:", students);
          setUsers(students);
        }
      } catch (error) {
        console.error("Error cargando usuarios:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tipo]);

  // Redirige si no está autenticado 
  if (!user || user.role !== 'admin') {
    return <Redirect to="/login" />;
  }

  return (
    <IonPage>
      <SimpleHeaderAdmin adminName={user.username} />
      <IonContent scrollY={!(authLoading || loading)}>
        {(authLoading || loading) ? (
          <div className='user-management-spinner'>
            <IonSpinner name='crescent' />
          </div>
        ) : (
          <div className="teacherManagement-MainContainer">
            <div className="teacherManagement-TextAddButton">
              <IonLabel className="teacherManagement-TextTeacher">
                <h2>{tipo === 'profesores' ? 'Profesores' : 'Alumnos'}</h2>
              </IonLabel>
              <IonButton
                className="teacherManagement-AddButoon"
                onClick={() =>
                  tipo === 'profesores'
                    ? router.push('/teacher/register')
                    : router.push('/student/register')
                }
              >
                Añadir nuevo {tipo === 'profesores' ? 'profesor' : 'alumno'}
              </IonButton>
            </div>
            <div className="teacherManagement-teacherTable">
              <IonList>
                {users.map((user) => (
                  <TeacherManagementItem
                    key={user.id}
                    teacherAvatar={user.photo_url}
                    teacherName={user.username}
                    userId={user.id}
                    tipo={tipo}
                  />
                ))}
              </IonList>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
