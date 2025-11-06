import { setupIonicReact } from '@ionic/react'

setupIonicReact();

import { IonPage, IonContent, IonSpinner, IonList, IonSearchbar } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import './teacherProfilePage.css';
import StudentItem from './components/StudentItem';
import HeaderTeacherItem from './components/HeaderTeacherItem';
import { fetchStudentsByTeacher } from '../../lib/api';

interface Student {

  id: string;
  username: string;
  photo_url: string;
  group_id: string;
  group_alias: string;

}

export default function TeacherProfilePage() {
  const { user, loading } = useAuth();
  const history = useHistory();
  const { logout } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
  const [studentQuery, setStudentQuery] = useState<string>('');

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
      {!user || loading || loadingGroups ? (
        <IonContent className="ion-text-center">
          <div className='teacher-profile-spinner'>
            <IonSpinner name='crescent' />
          </div>
        </IonContent>
      ) : (
        <>
          <HeaderTeacherItem
            teacherName={user.username}
            teacherAvatar={user.photo_url || "/assets/pictograms/user_default.png"}
            onLogoutClick={handleLogout}
          />
          <IonContent>

            <IonSearchbar className='perfilProfesor-buscador'
              placeholder="Buscar alumno"
              value={studentQuery}
              onIonInput={(e) => setStudentQuery(e.detail.value ?? '')}
              onIonClear={() => setStudentQuery('')}
              onIonCancel={() => setStudentQuery('')}></IonSearchbar>

            <div className='studentTable'>
              <IonList>
                {(
                  (studentQuery === '' ? students : students.filter(s => {
                    const q = studentQuery.toLowerCase();
                    const uname = (s.username || '').toLowerCase();
                    const inUsername = uname.includes(q);
                    const inGroup = (s.group_id && s.group_alias) ? (s.group_alias || '').toLowerCase().includes(q) : false;
                    return inUsername || inGroup;
                  }))
                ).map(student => (
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
