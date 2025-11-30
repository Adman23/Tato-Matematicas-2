import { setupIonicReact } from '@ionic/react'

setupIonicReact();

import { IonPage, IonContent, IonSpinner, IonList, IonSearchbar, useIonRouter } from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import './teacherProfilePage.css';
import StudentItem from './components/StudentItem';
import HeaderTeacherItem from './components/HeaderTeacherItem';
import { useUserData } from '../../contexts/UserContext';
import { useManager } from '../../contexts/ManagerContext';


export default function TeacherProfilePage() {
  const { user } = useAuth();
  const router = useIonRouter();
  const { logout } = useAuth();
  
  const [studentQuery, setStudentQuery] = useState<string>('');


  const { loadingUser } = useUserData();
  const { users: students, loadingUsers } = useManager();


  const handleLogout = async () => {
    await logout();
    router.push('/student/login',"none","replace");
  };

  return (
    <IonPage>
      {!user || loadingUser || loadingUsers ? (
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
                  (studentQuery === '' ? Array.from(students.values()) : Array.from(students.values()).filter(entry => {
                    const s = entry.user; 
                    const q = studentQuery.toLowerCase();
                    const uname = (s.username || '').toLowerCase();
                    const inUsername = uname.includes(q);
                    const inGroup = (s.group_id && s.group_alias) ? (s.group_alias || '').toLowerCase().includes(q) : false;
                    return inUsername || inGroup;
                  }))
                ).map(entry => (
                  <StudentItem
                    key={entry.user.id}
                    studentAvatar={entry.user.photo_url || "no image"}
                    studentName={entry.user.username}
                    studentClass={entry.user.group_alias || "no group alias"}
                    onEditClick={() => router.push(`/student-edit-menu/${entry.user.id}/${entry.user.username}`)}
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
