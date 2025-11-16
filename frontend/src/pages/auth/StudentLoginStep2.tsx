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

  // Paginación para estudiantes (dinámica según dispositivo)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4); // Valor inicial optimista (desktop)

  // Calcular estudiantes visibles
  const visibleStudents = students.slice(currentIndex, currentIndex + visibleCount);

  // Verificar si hay más estudiantes para mostrar flechas
  const showArrows = students.length > visibleCount;

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex + visibleCount < students.length;

  const goToPrevPage = () => {
    if (canGoPrev) {
      setCurrentIndex(prev => Math.max(0, prev - visibleCount));
    }
  };

  const goToNextPage = () => {
    if (canGoNext) {
      setCurrentIndex(prev => prev + visibleCount);
    }
  };

  // ✅ Lógica responsive: basada en ancho (sincronizada con @media (max-width: 600px))
  const calculateVisibleCount = () => {
    const isMobile = window.innerWidth <= 715;
    return isMobile ? 2 : 4;
  };

  // Recalcular visibleCount al montar y en resize
  useEffect(() => {
    const updateCount = () => {
      setVisibleCount(calculateVisibleCount());
    };

    updateCount(); // Inicial
    window.addEventListener('resize', updateCount);
    return () => window.removeEventListener('resize', updateCount);
  }, []);

  // ⚠️ Si cambia visibleCount (por resize), resetea currentIndex para evitar páginas inválidas
  useEffect(() => {
    if (students.length > 0) {
      const maxIndex = Math.max(0, students.length - visibleCount);
      if (currentIndex > maxIndex) {
        setCurrentIndex(maxIndex);
      }
    }
  }, [visibleCount, students.length, currentIndex]);

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
              disabled={loading || !selectedStudent}
            >
              <img
                src="/assets/pictograms/correcto.png"
                alt="Avanzar"
                className="sel-boton-imagen"
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

          {/* Contenedor de grid + flechas (fuera del card) */}
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
              {/* Flecha izquierda */}
              {showArrows && (
                <button
                  className="sel-group-grid-arrow left-outside"
                  onClick={goToPrevPage}
                  disabled={!canGoPrev}
                  aria-label="Estudiantes anteriores"
                >
                  <img src="/assets/pictograms/flecha.png" alt="Anterior" />
                </button>
              )}

              {/* Card con solo el grid */}
              <div className="sel-classes-card">
                <div className="sel-group-grid">
                  {visibleStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleStudentClick(student)}
                      disabled={loading}
                      className={`sel-group-tile ${
                        selectedStudent?.id === student.id ? 'selected' : ''
                      }`}
                      aria-label={student.username}
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
                    </button>
                  ))}
                </div>
              </div>

              {/* Flecha derecha */}
              {showArrows && (
                <button
                  className="sel-group-grid-arrow right-outside"
                  onClick={goToNextPage}
                  disabled={!canGoNext}
                  aria-label="Más estudiantes"
                >
                  <img src="/assets/pictograms/flecha.png" alt="Siguiente" />
                </button>
              )}
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