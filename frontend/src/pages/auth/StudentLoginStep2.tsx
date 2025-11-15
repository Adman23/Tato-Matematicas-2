/**
 * !! EDITED
 *  -> Now there is no student
 * Pantalla de Paso 2: Selección de Usuario
 * ---------------------------------------------------------
 * El estudiante selecciona su username de la lista de estudiantes del grupo.
 */

import {
  IonPage,
  IonContent,
  IonButton,
  IonText,
  IonSpinner,
  useIonViewWillEnter,
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { authAPI } from '../../lib/api';
import type { User } from '../../lib/api';
import './StudentLoginSelection.css';

/**
 * Paso 2 del login de estudiante: Selección de username.
 *
 * Flujo:
 * 1) Carga la lista de estudiantes del grupo
 * 2) El alumno selecciona su usuario (con foto si está disponible)
 * 3) Navega al paso 3 con el group_id y username
 */
export default function StudentLoginStep2() {
  const params = useParams<{ groupId: string }>();
  const history = useHistory();

  // Extract groupId from URL pathname as fallback (IonReactRouter issue workaround)
  const groupId = params.groupId || history.location.pathname.split('/').pop() || '';

  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  // Cargar estudiantes cuando groupId esté disponible (solo una vez)
  useEffect(() => {
    if (groupId && !hasLoaded) {
      loadStudents();
      setHasLoaded(true);
    }
  }, [groupId, hasLoaded]);

  // Resetear selección y recargar estudiantes cada vez que la vista se muestra
  useIonViewWillEnter(() => {
    setSelectedStudent(null);
    setError('');
    setHasLoaded(false); // Permite recargar estudiantes cuando se vuelve a la vista
  });

  const loadStudents = async () => {
    try {
      setLoading(true);
      const studentsData = await authAPI.getStudentsByGroup(groupId);
      setStudents(studentsData);
      setError('');
    } catch (err: any) {
      console.error('Error loading students:', err);
      setError('Error al cargar los estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = (student: User) => {
    setSelectedStudent(student);
    setError('');
  };

  const handleAdvance = () => {
    if (!selectedStudent) {
      setError('Selecciona un estudiante');
      return;
    }
    // Navegar al paso 3 con el group_id y username
    history.push(`/student-login/step3/${groupId}/${selectedStudent.username}`);
  };

  return (
    <IonPage>
      <IonContent className="student-login-content">
        <div className="sel-login-container">
          {/* Fila de botones superior */}
          <div className="sel-button-row">
            <IonButton
              fill="clear"
              className="sel-action-button"
              onClick={() => history.goBack()}
            >
              <img
                src="/assets/pictograms/boton_volver.png"
                alt="Volver"
                className="sel-boton-imagen"
              />
            </IonButton>

            <div className="sel-action-card">
              <IonButton
                fill="clear"
                className="sel-action-button"
                onClick={() => history.push('/')}
              >
                <img
                  src="/assets/pictograms/home.png"
                  alt="Volver a la página principal"
                  className="sel-boton-imagen"
                />
              </IonButton>
              <span className="sel-action-button-label">Ir a inicio</span>
            </div>

            {/* Botón de avanzar */}
            <IonButton
              fill="clear"
              className="sel-action-button"
              onClick={handleAdvance}
              disabled={loading}
            >
              <img
                src="/assets/pictograms/correcto.png"
                alt="Avanzar"
                className="sel-boton-imagen student-boton-rotado"
              />
            </IonButton>
          </div>

          {/* Título y subtítulo */}
          <div className="sel-login-header">
            <h1 className="sel-login-title">Selección de usuario</h1>
            <p className="sel-login-subtitle">
              Toca tu foto o nombre y pulsa avanzar
            </p>
          </div>

          {/* Grid de estudiantes */}
          {loading ? (
            <div className="sel-loading">
              <IonSpinner name="crescent" />
            </div>
          ) : students.length === 0 ? (
            <div className="sel-error-message">
              <IonText color="warning">
                <p>No hay estudiantes en este grupo</p>
              </IonText>
            </div>
          ) : (
            <div className="sel-pictograms-grid">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleStudentClick(student)}
                  disabled={loading}
                  className={`sel-pictogram-button ${
                    selectedStudent?.id === student.id ? 'selected' : ''
                  }`}
                  aria-label={student.username}
                >
                  <div className="sel-user-card">
                    {student.photo_url ? (
                      <img
                        src={student.photo_url}
                        alt={student.username}
                        className="sel-user-photo"
                      />
                    ) : (
                      <img
                        src="/assets/pictograms/user_default.png"
                        alt={student.username}
                        className="sel-user-photo"
                      />
                    )}
                    <h3>{student.username}</h3>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <IonText color="danger">
              <div className="sel-error-message">
                <p>{error}</p>
              </div>
            </IonText>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}