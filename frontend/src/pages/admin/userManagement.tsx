import { IonSearchbar, IonTitle, setupIonicReact } from '@ionic/react';
setupIonicReact();

import { IonPage, IonContent, IonSpinner, IonList, IonButton } from '@ionic/react';
import { Redirect, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { fetchStudents, fetchTeachers } from '../../lib/api';
import SimpleHeaderAdmin from './components/SimpleHeaderAdmin';
import TeacherManagementItem from './components/TeacherManagementItem';
import './userManagement.css';

import { useHistory } from 'react-router-dom';

/**
 * Componente principal de la pantalla "User Management".
 * Permite:
 * - Cargar la lista de profesores o alumnos, según el tipo de usuario que se quiera consultar.
 * - Buscar (filtrar) por nombre/alias de grupo.
 * - Editar o eliminar usuarios.
 *
 * No recibe props; obtiene el usuario actual del contexto de autenticación.
 */
export default function UserManagement() {

  // Obtiene el parámetro "tipo" desde la URL (puede ser "profesores" o "alumnos")
  const { tipo } = useParams<{ tipo: string }>();
  // Obtiene el usuario autenticado y el estado de carga del contexto
  const { user, loading: authLoading } = useAuth();
  // Estados locales
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ id: string; username: string; photo_url: string }[]>([]);
  const [userQuery, setUserQuery] = useState<string>('');
  // Hook para navegar entre rutas
  const history = useHistory();

  // Redirige si el tipo no es válido
  if (tipo !== 'profesores' && tipo !== 'alumnos') {
    return <Redirect to="/admin-dashboard" />;
  }

  // useEffect: carga los datos cuando el componente se monta o cambia el tipo de usuario
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        if (tipo === "profesores") {
          // Llama a la API para obtener los profesores
          const teachers = await fetchTeachers();
          console.log("Profesores recibidos:", teachers);
          setUsers(teachers);
        } else {
          // Llama a la API para obtener los alumnos
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
  }, [tipo]); // Se ejecuta cada vez que cambia "tipo"

  // Si la autenticación o los datos aún están cargando, muestra un spinner
  if (authLoading || loading) {
    return (
      <IonPage>
        <IonContent className="ion-text-center">
          <div className='user-management-spinner'>
            <IonSpinner name='crescent' />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Si no hay usuario o el rol no es "admin", redirige al login
  if (!user || user.role !== 'admin') {
    return <Redirect to="/login" />;
  }

  /**
   * Función para manejar el borrado de usuarios
   * @param id 
   */
  const handleDeleteUser = async (id: string) => {
    try {
      if (tipo === 'profesores') {
        //await deleteTeacher(id);
      } else {
        //await deleteStudent(id);
      }
      // Filtra el usuario eliminado del estado
      setUsers((prev) => prev.filter((u) => String(u.id) !== String(id)));
    } catch (error) {
      console.error('Error eliminando usuario:', error);
    }
  };

  // Render principal de la página
  return (
    <IonPage>
      <SimpleHeaderAdmin adminName={user.username} />
      <IonContent>
        <div className="teacherManagement-MainContainer">
          <div className="teacherManagement-TextAddButton">
            <IonTitle className="teacherManagement-TextTeacher">
              <h2>{tipo === 'profesores' ? 'Profesores' : 'Alumnos'}</h2>
            </IonTitle>

            <IonSearchbar className='userManagement-buscador'
              placeholder={`Buscar ${tipo === 'profesores' ? 'profesores' : 'alumnos'}`}
              value={userQuery}
              onIonInput={(e) => setUserQuery(e.detail.value ?? '')}
              onIonClear={() => setUserQuery('')}
              onIonCancel={() => setUserQuery('')}>
            </IonSearchbar>

            <IonButton
              className="teacherManagement-AddButoon"
              onClick={() =>
                tipo === 'profesores'
                  ? history.push('/teacher-register')
                  : history.push('/student-register')
              }
            >
              Añadir nuevo {tipo === 'profesores' ? 'profesor' : 'alumno'}
            </IonButton>
          </div>
          <div className="teacherManagement-teacherTable">
            <IonList>
              {(
                  (userQuery === '' ? users : users.filter(s => {
                    const q = userQuery.toLowerCase();
                    const uname = (s.username || '').toLowerCase();
                    const inUsername = uname.includes(q);
                    return inUsername;
                  }))
                ).map((user) => (
                <TeacherManagementItem
                  key={user.id}
                  id={user.id}
                  teacherAvatar={user.photo_url}
                  teacherName={user.username}
                  onDelete={() => handleDeleteUser(user.id)}
                />
              ))}
            </IonList>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
