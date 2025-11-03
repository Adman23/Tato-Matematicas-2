import {setupIonicReact} from '@ionic/react'

setupIonicReact();

import { IonPage, IonContent, IonSpinner, IonList,IonSearchbar } from '@ionic/react';
import { useHistory, Redirect } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import './teacherProfilePage.css';
import StudentItem from './components/StudentItem';
import HeaderTeacherItem from './components/HeaderTeacherItem';
import { authAPI, fetchStudentsByTeacher } from '../../lib/api';

interface Student{

  id: string;
  username: string;
  photo_url: string;
  group_alias: string;

}

export default function TeacherProfilePage() {
  const { user, loading } = useAuth();
  const history = useHistory();
  const { logout } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoadingGroups(true);
        const data = await fetchStudentsByTeacher();
        setStudents(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoadingGroups(false);
      }
    };
    loadGroups();
  }, []);

  const handleLogout = async () => {
    await logout();
    history.replace('/');
  };

  return (
    <IonPage>
      {!user || loading || loadingGroups? (
        <IonContent className="ion-text-center">
          <IonSpinner />
        </IonContent>
      ) : (
        <>
          <HeaderTeacherItem 
            teacherName={user.username} 
            teacherAvatar="https://ionicframework.com/docs/img/demos/avatar.svg" 
            onLogoutClick={handleLogout}
          />
          <IonContent>
            <IonSearchbar className='perfilProfesor-buscador' placeholder="Buscar alumno"></IonSearchbar>
            <div className='studentTable'>
              <IonList>
                {students.map(student => (
                  <StudentItem
                    key={student.id}
                    studentAvatar={student.photo_url}
                    studentName={student.username}
                    studentClass={student.group_alias}
                  />
                ))}
              </IonList>
            </div>
          </IonContent>
        </>
      )}
    </IonPage>
  );
}
