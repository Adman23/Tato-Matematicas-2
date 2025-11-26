import {
  IonPage,
  IonContent,
  IonButton,
  IonText,
  IonSpinner,
  IonIcon,
  useIonViewWillEnter,
} from '@ionic/react';
import { arrowBack, arrowForward } from 'ionicons/icons';
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

  // Determinar tamaño de Grid (2 para móvil, 4 para desktop)
  const getGridSize = () => (window.innerWidth <= 650 ? 2 : 4);
  const [visibleCount, setVisibleCount] = useState(getGridSize());

  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getGridSize());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      const maxPage = Math.max(0, Math.ceil(students.length / visibleCount) - 1);
      if (currentPage > maxPage) {
        setCurrentPage(maxPage);
      }
    }
  }, [students.length, currentPage, visibleCount]);

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

  const startIndex = currentPage * visibleCount;
  const visibleStudents = students.slice(startIndex, startIndex + visibleCount);
  const emptySlots = visibleCount - visibleStudents.length;

  const showArrows = students.length > visibleCount;
  const canGoPrev = currentPage > 0;
  const canGoNext = (currentPage + 1) * visibleCount < students.length;

  const goToPrevPage = () => canGoPrev && setCurrentPage(prev => prev - 1);
  const goToNextPage = () => canGoNext && setCurrentPage(prev => prev + 1);

  return (
    <IonPage>
      <IonContent className="student-login-content" scrollY={false}>
        <div className="sel-login-container">
          
          <div className="sel-button-row">
            <IonButton fill="clear" className="sel-action-button" onClick={() => history.goBack()}>
              <img src="/assets/pictograms/boton_volver.png" alt="Volver" className="sel-boton-imagen" />
            </IonButton>

            <IonButton fill="clear" className="sel-action-button" onClick={() => history.push('/')}>
              <img src="/assets/pictograms/home.png" alt="Inicio" className="sel-boton-imagen" />
            </IonButton>

            <IonButton fill="clear" className="sel-action-button" onClick={handleAdvance} disabled={loading || !selectedStudent}>
              <img src="/assets/pictograms/si.png" alt="Avanzar" className="sel-boton-imagen" />
            </IonButton>
          </div>

          <div className="sel-login-header">
            <h1 className="sel-login-title">Selecciona tu usuario</h1>
          </div>

          <div className="sel-group-grid-wrapper">
            {showArrows && (
              <button className="sel-group-grid-arrow" onClick={goToPrevPage} disabled={!canGoPrev}>
                <IonIcon icon={arrowBack} style={{ fontSize: '5vmin' }} />
              </button>
            )}

            <div className="sel-classes-card">
              {loading ? (
                <IonSpinner name="crescent" color="light" style={{ transform: 'scale(2)' }} />
              ) : students.length === 0 ? (
                <IonText color="light"><h2>No hay estudiantes</h2></IonText>
              ) : (
                <div className="sel-group-grid">
                  {visibleStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleTileClick(student)}
                      className={`sel-group-tile ${selectedStudent?.id === student.id ? 'selected' : ''}`}
                    >
                      <div className="sel-student-content">
                        <img
                          src={student.photo_url || "/assets/pictograms/user_default.png"}
                          alt={student.username}
                          className="sel-student-photo"
                        />
                        <span className="sel-student-name">
                          {student.username}
                        </span>
                      </div>

                      {confirmPendingId === String(student.id) && (
                        <div className="sel-confirm-overlay">
                          <img src="/assets/pictograms/si.png" alt="Confirmar" className="sel-confirm-icon" />
                        </div>
                      )}
                    </button>
                  ))}

                  {Array.from({ length: emptySlots }).map((_, i) => (
                    <div key={`empty-${i}`} className="sel-group-ghost"></div>
                  ))}
                </div>
              )}
            </div>

            {showArrows && (
              <button className="sel-group-grid-arrow" onClick={goToNextPage} disabled={!canGoNext}>
                <IonIcon icon={arrowForward} style={{ fontSize: '5vmin' }} />
              </button>
            )}
          </div>

          <ul 
            className="sel-page-indicators" 
            style={{ visibility: (showArrows && students.length > 0) ? 'visible' : 'hidden' }}
          >
            {Array.from({ length: Math.ceil(students.length / visibleCount) }, (_, i) => (
              <li key={i}>
                <button
                  className="sel-page-indicator"
                  onClick={() => setCurrentPage(i)}
                  aria-selected={currentPage === i}
                  tabIndex={(showArrows && students.length > 0) ? 0 : -1}
                />
              </li>
            ))}
          </ul>

          {error && (
            <div className="sel-error-message">
              {error}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}