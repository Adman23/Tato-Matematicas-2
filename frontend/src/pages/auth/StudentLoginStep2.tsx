/**
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
import { authAPI, getImages } from '../../lib/api'; 
import type { StudentBasicInfo } from '../../lib/api';
import './StudentLogin.css';

export default function StudentLoginStep2() {
  const { groupId } = useParams<{ groupId: string }>();
  const [students, setStudents] = useState<StudentBasicInfo[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentBasicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [arrowImageUrl, setArrowImageUrl] = useState<string | null>(null); 
  const [currentPage, setCurrentPage] = useState(0);
  const history = useHistory();

  const STUDENTS_PER_PAGE = 4;

  // Load students + arrow image (same as Step1)
  const loadStudentsAndImages = async () => {
    try {
      setLoading(true);
      const studentsData = await authAPI.getStudentsByGroup(groupId);

      // Load arrow for pagination (optional but consistent)
      const images = await getImages();
      const arrowUrl = images['direccion.png'] || null;
      setArrowImageUrl(arrowUrl);

      setStudents(studentsData);
      setError('');
    } catch (err: any) {
      setError('Error al cargar los estudiantes o imágenes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      loadStudentsAndImages();
    }
  }, [groupId]);

  useIonViewWillEnter(() => {
    setSelectedStudent(null);
    setError('');
    setCurrentPage(0);
  });

  const handleStudentClick = (student: StudentBasicInfo) => {
    setSelectedStudent(student);
    setError('');
  };

  const handleAdvance = () => {
    if (!selectedStudent) {
      setError('Selecciona un estudiante');
      return;
    }
    history.push(`/student-login/step3/${groupId}/${selectedStudent.username}`);
  };

  // Pagination logic
  const totalPages = Math.ceil(students.length / STUDENTS_PER_PAGE);
  const startIndex = currentPage * STUDENTS_PER_PAGE;
  const currentStudents = students.slice(startIndex, startIndex + STUDENTS_PER_PAGE);

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };

  return (
    <IonPage>
      <IonContent className="student-login-content">
        <div className="student-login-container">
          {/* Fila de botones superior */}
          <div className="student-button-row">
            <IonButton
              fill="clear"
              className="default-action-button"
              onClick={() => history.goBack()}
            >
              <img
                src="/assets/pictograms/boton_volver.png"
                alt="Volver"
                className="student-boton-imagen"
              />
            </IonButton>

            <div className="action-card">
              <IonButton
                fill="clear"
                className="default-action-button"
                onClick={() => history.push('/')}
              >
                <img
                  src="/assets/pictograms/home.png"
                  alt="Volver a la pagina principal"
                  className="student-boton-imagen"
                />
              </IonButton>
              <span className="default-action-button-label">Ir a inicio</span>
            </div>

            <IonButton
              fill="clear"
              className="default-action-button"
              onClick={handleAdvance}
              disabled={loading || !selectedStudent} // ✅ improved
            >
              <img
                src="/assets/pictograms/correcto.png"
                alt="Avanzar"
                className="student-boton-imagen student-boton-rotado"
              />
            </IonButton>
          </div>

          {/* Título */}
          <div className="student-login-header">
            <h1 className="student-login-title">Selección de usuario</h1>
            <p className="student-login-subtitle">
              Toca tu foto o nombre y pulsa avanzar
            </p>
          </div>

          {/* 2x2 Grid with Pagination — SAME AS STEP1 */}
          {loading ? (
            <div className="student-loading">
              <IonSpinner name="crescent" />
            </div>
          ) : students.length === 0 ? (
            <div className="student-error-message">
              <IonText color="warning">
                <p>No hay estudiantes en este grupo</p>
              </IonText>
            </div>
          ) : (
            <div className="student-group-pagination-container-centered">
              {/* Left Arrow */}
              <IonButton
                fill="clear"
                className="pagination-arrow-button"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
              >
                <img
                  src={arrowImageUrl || '/assets/pictograms/flecha_izquierda.png'}
                  alt="Anterior"
                  className="pagination-arrow-image pagination-arrow-flip"
                />
              </IonButton>

              {/* 2x2 Grid */}
              <div className="student-group-grid-2x2">
                {currentStudents.map((student) => (
                  <div className="student-group-wrapper" key={student.id}>
                    <button
                      onClick={() => handleStudentClick(student)}
                      disabled={loading}
                      className={`student-pictogram-button ${selectedStudent?.id === student.id ? 'selected' : ''}`}
                      aria-label={student.username}
                    >
                      <div className="student-user-card">
                        {student.photo_url ? (
                          <img
                            src={student.photo_url}
                            alt=""
                            className="student-user-photo"
                          />
                        ) : (
                          <img
                            src="/assets/pictograms/user_default.png"
                            alt=""
                            className="student-user-photo"
                          />
                        )}
                      </div>
                    </button>
                    <div className="student-group-caption">
                      {student.username.length > 15
                      ? (student.username.substring(0, 12) + '...').toUpperCase()
                      : student.username.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Arrow */}
              <IonButton
                fill="clear"
                className="pagination-arrow-button"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1}
              >
                <img
                  src={arrowImageUrl || '/assets/pictograms/flecha_derecha.png'}
                  alt="Siguiente"
                  className="pagination-arrow-image"
                />
              </IonButton>
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
        </div>
      </IonContent>
    </IonPage>
  );
}