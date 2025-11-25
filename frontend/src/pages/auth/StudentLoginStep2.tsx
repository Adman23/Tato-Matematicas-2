import {
  IonPage,
  IonContent,
  IonButton,
  IonText,
  IonSpinner,
  IonIcon, // ✅ Importamos IonIcon
  useIonViewWillEnter,
} from '@ionic/react';
import { arrowBack, arrowForward } from 'ionicons/icons'; // ✅ Importamos las flechas
import { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { authAPI } from '../../lib/api';
import type { User } from '../../lib/api';
import './StudentLoginSelection.css';

export default function StudentLoginStep2() {
  const params = useParams<{ groupId: string }>();
  const history = useHistory();
  const groupId = params.groupId || history.location.pathname.split('/').pop() || '';

  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [confirmPendingId, setConfirmPendingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);

  const startIndex = currentPage * visibleCount;
  const visibleStudents = students.slice(startIndex, startIndex + visibleCount);

  const showArrows = students.length > visibleCount;
  const canGoPrev = currentPage > 0;
  const canGoNext = (currentPage + 1) * visibleCount < students.length;

  const goToPrevPage = () => {
    if (canGoPrev) setCurrentPage(prev => prev - 1);
  };

  const goToNextPage = () => {
    if (canGoNext) setCurrentPage(prev => prev + 1);
  };

  const calculateVisibleCount = () => {
    const isMobile = window.innerWidth <= 860;
    return isMobile ? 2 : 4;
  };

  useEffect(() => {
    if (students.length > 0) {
      const maxPage = Math.max(0, Math.ceil(students.length / visibleCount) - 1);
      if (currentPage > maxPage) {
        setCurrentPage(maxPage);
      }
    }
  }, [visibleCount, students.length, currentPage]);

  useEffect(() => {
    const updateCount = () => {
      setVisibleCount(calculateVisibleCount());
    };
    updateCount();
    window.addEventListener('resize', updateCount);
    return () => window.removeEventListener('resize', updateCount);
  }, []);

  useEffect(() => {
    if (groupId && !hasLoaded) {
      loadStudents();
      setHasLoaded(true);
    }
  }, [groupId, hasLoaded]);

  useIonViewWillEnter(() => {
    setSelectedStudent(null);
    setConfirmPendingId(null);
    setError('');
    setHasLoaded(false);
    setCurrentPage(0);
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

  const handleTileClick = (student: User) => {
    if (loading) return;

    if (selectedStudent?.id === student.id && confirmPendingId === String(student.id)) {
      handleAdvance();
      return;
    }

    setSelectedStudent(student);
    setConfirmPendingId(String(student.id));
    setError('');
  };

  const handleAdvance = () => {
    if (!selectedStudent) {
      setError('Selecciona un estudiante');
      return;
    }
    history.push(`/student/login/step3/${groupId}/${selectedStudent.username}`);
  };

  return (
    <IonPage>
      <IonContent className="student-login-content">
        <div className="sel-login-container">
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
            </div>

            <IonButton
              fill="clear"
              className="sel-action-button"
              onClick={handleAdvance}
              disabled={loading || !selectedStudent}
            >
              <img
                src="/assets/pictograms/si.png"
                alt="Avanzar"
                className="sel-boton-imagen"
              />
            </IonButton>
          </div>

          <div className="sel-login-header">
            <h1 className="sel-login-title">Selecciona tu usuario</h1>
          </div>

          {loading ? (
            <div className="sel-loading">
              <IonSpinner name="crescent" />
            </div>
          ) : students.length === 0 ? (
            <div className="sel-error">
              <p>No hay estudiantes en este grupo</p>
            </div>
          ) : (
            <div className="sel-group-grid-wrapper">
              {showArrows && (
                <button
                  className="sel-group-grid-arrow left-outside"
                  onClick={goToPrevPage}
                  disabled={!canGoPrev}
                  aria-label="Estudiantes anteriores"
                >
                  {/* ✅ Icono Flecha Izquierda */}
                  <IonIcon icon={arrowBack} style={{ fontSize: '3rem' }} />
                </button>
              )}

              <div className="sel-classes-card">
                <div className="sel-group-grid">
                  {visibleStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleTileClick(student)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleTileClick(student);
                        }
                      }}
                      disabled={loading}
                      className={`sel-group-tile ${
                        selectedStudent?.id === student.id ? 'selected' : ''
                      }`}
                      aria-label={`${student.username} — ${
                        selectedStudent?.id === student.id
                          ? confirmPendingId === String(student.id)
                            ? 'listo para confirmar: presiona Enter o haz clic para continuar'
                            : 'seleccionado'
                          : 'no seleccionado'
                      }`}
                      aria-pressed={selectedStudent?.id === student.id ? 'true' : 'false'}
                      tabIndex={0}
                    >
                      <div className="sel-user-content">
                        {student.photo_url ? (
                          <img
                            src={student.photo_url}
                            alt={student.username}
                            className="sel-group-icon"
                          />
                        ) : (
                          <img
                            src="/assets/pictograms/user_default.png"
                            alt={student.username}
                            className="sel-group-icon"
                          />
                        )}
                        <span className="sel-group-label">{student.username}</span>
                      </div>

                      {confirmPendingId === String(student.id) && (
                        <div className="sel-confirm-overlay">
                          <img
                            src="/assets/pictograms/si.png"
                            alt=""
                            className="sel-confirm-icon"
                          />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {showArrows && (
                <button
                  className="sel-group-grid-arrow right-outside"
                  onClick={goToNextPage}
                  disabled={!canGoNext}
                  aria-label="Más estudiantes"
                >
                  {/* ✅ Icono Flecha Derecha */}
                  <IonIcon icon={arrowForward} style={{ fontSize: '3rem' }} />
                </button>
              )}
            </div>
          )}

          {showArrows && students.length > 0 && (
            <ul className="sel-page-indicators" role="tablist" aria-label="Navegación por páginas">
              {Array.from({ length: Math.ceil(students.length / visibleCount) }, (_, i) => (
                <li key={i}>
                  <button
                    className="sel-page-indicator"
                    onClick={() => setCurrentPage(i)}
                    aria-label={`Ir a la página ${i + 1}`}
                    aria-selected={currentPage === i}
                    role="tab"
                    tabIndex={currentPage === i ? 0 : -1}
                  />
                </li>
              ))}
            </ul>
          )}

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