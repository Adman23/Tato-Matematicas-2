/**
 * Pantalla de Paso 2: Selección de Usuario
 * ---------------------------------------------------------
 * El estudiante selecciona su username de la lista de estudiantes del grupo.
 */

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonButton,
  IonText,
  IonSpinner,
  useIonViewWillEnter,
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { authAPI } from '../../lib/api';
import type { StudentBasicInfo } from '../../lib/api';
import './StudentLogin.css';

/**
 * Paso 2 del login de estudiante: Selección de username.
 *
 * Flujo:
 * 1) Carga la lista de estudiantes del grupo
 * 2) El alumno selecciona su usuario (con foto si está disponible)
 * 3) Navega al paso 3 con el group_id y username
 */
export default function StudentLoginStep2() {
  const { groupId } = useParams<{ groupId: string }>();
  const [students, setStudents] = useState<StudentBasicInfo[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentBasicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const history = useHistory();

  useEffect(() => {
    if (groupId) {
      loadStudents();
    }
  }, [groupId]);

  // Resetear selección cada vez que la vista se muestra
  useIonViewWillEnter(() => {
    setSelectedStudent(null);
    setError('');
  });

  const loadStudents = async () => {
    try {
      setLoading(true);
      const studentsData = await authAPI.getStudentsByGroup(groupId);
      setStudents(studentsData);
      setError('');
    } catch (err: any) {
      setError('Error al cargar los estudiantes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = (student: StudentBasicInfo) => {
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
      <IonHeader>
        <IonToolbar color="secondary">
        </IonToolbar>
      </IonHeader>

      <IonContent className="student-login-content">
        <div className="student-login-container">
          <IonButton
            fill="clear"
            className="student-volver-boton"
            onClick={() => history.goBack()}
          >
            <img
              src="/assets/pictograms/boton_volver.png"
              alt="Volver"
              className="student-boton-imagen"
            />
          </IonButton>

          {/* Título y arriba */}
          <div className="student-login-header">


            <h1 className="student-login-title">¿Quién eres?</h1>
            <p className="student-login-subtitle">
              Toca tu foto o nombre
            </p>
          </div>

          {/* Grid de estudiantes */}
          {loading ? (
            <div className="student-loading">
              <IonSpinner name="crescent" />
            </div>
          ) : students.length === 0 ? (
            <div className="student-error-message ">
              <IonText color="warning">
                <p>No hay estudiantes en este grupo</p>
              </IonText>
            </div>
          ) : (
            <div className="student-pictograms-grid">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleStudentClick(student)}
                  disabled={loading}
                  className={`student-pictogram-button ${selectedStudent?.id === student.id ? 'selected' : ''}`}
                  aria-label={student.username}
                >
                  <div className="student-user-card">
                    {student.photo_url ? (
                      <img
                        src={student.photo_url}
                        alt={student.username}
                        className="student-user-photo"
                      />
                    ) : (
                      <img
                        src="/assets/pictograms/user_default.png"
                        alt={student.username}
                        className="student-user-photo"
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
              <div className="student-error-message">
                <p>{error}</p>
              </div>
            </IonText>
          )}

          {/* Botón de avanzar */}
          <div className="student-actions">
            <IonButton
              fill="clear"
              className="student-avance-boton"
              onClick={handleAdvance}
              disabled={loading}
            >
              <img
                src="/assets/pictograms/correcto.png"
                alt="Avanzar"
                className="student-boton-imagen student-boton-rotado"
              />
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
