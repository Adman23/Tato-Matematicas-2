import {
  IonPage,
  IonContent,
  IonText,
  IonSpinner,
  IonIcon,
  useIonRouter,
  useIonViewWillEnter,
} from '@ionic/react';
import { arrowBack, arrowForward, person, checkmark } from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { authAPI } from '../../lib/api';
import type { Group, User } from '../../lib/api';
import { Button3Dtext } from '../global_components/PushableButtons'; 
import './StudentLoginSelection.css';

// Tipo unión para manejar ambos tipos de datos
type GridItem = Group | User;

export default function StudentLoginUnified() {
  const router = useIonRouter();
  
  // ESTADO: null = Viendo Grupos, string = Viendo Alumnos de ese grupo
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Estados de datos e interfaz
  const [items, setItems] = useState<GridItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GridItem | null>(null);
  const [confirmPendingId, setConfirmPendingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  // --- Grid Responsivo ---
  const getGridSize = () => (window.innerWidth <= 650 ? 2 : 4);
  const [visibleCount, setVisibleCount] = useState(getGridSize());

  useEffect(() => {
    const handleResize = () => setVisibleCount(getGridSize());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Carga de Datos (Reactiva al cambio de Modo) ---
  useEffect(() => {
    loadData();
    // Reseteamos selecciones al cambiar de modo (Grupo <-> Alumno)
    setSelectedItem(null);
    setConfirmPendingId(null);
    setError('');
    setCurrentPage(0);
  }, [activeGroupId]); // <-- Se ejecuta cada vez que cambiamos entre Grupo y Alumno

  // Reset inicial al entrar a la página por primera vez
  useIonViewWillEnter(() => {
    setActiveGroupId(null); // Siempre empezamos en selección de grupos
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (!activeGroupId) {
        // MODO GRUPO: Cargar lista de clases
        const groups = await authAPI.getGroups();
        setItems(groups);
      } else {
        // MODO ALUMNO: Cargar estudiantes del grupo activo
        const students = await authAPI.getStudentsByGroup(activeGroupId);
        setItems(students);
      }
    } catch (err) {
      console.error(err);
      setError(!activeGroupId ? 'Error cargando grupos' : 'Error cargando estudiantes');
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica de Interacción ---

  const handleTileClick = (item: GridItem) => {
    if (loading) return;

    if (selectedItem?.id === item.id && confirmPendingId === String(item.id)) {
      handleAdvance();
      return;
    }

    setSelectedItem(item);
    setConfirmPendingId(String(item.id));
    setError('');
  };

  const handleBack = () => {
    if (!activeGroupId) {
      // Estamos en GRUPOS -> Ir al login de Admin (Salimos de esta pantalla)
      router.push('/login', 'back');
    } else {
      // Estamos en ALUMNOS -> Volver a GRUPOS
      // Solo cambiamos el estado, NO la ruta. La animación de fondo no se corta.
      setActiveGroupId(null); 
    }
  };

  const handleAdvance = () => {
    if (!selectedItem) return;

    if (!activeGroupId) {
      // Estamos en GRUPOS -> Avanzar a ALUMNOS
      // Cambiamos el estado local. El componente se actualiza suavemente.
      setActiveGroupId(String(selectedItem.id));
    } else {
      // Estamos en ALUMNOS -> Ir al Login Final (Paso 3)
      // Aquí sí cambiamos de ruta porque es una pantalla distinta
      const student = selectedItem as User;
      router.push(`/student/login/step3/${activeGroupId}/${student.username}`, 'forward');
    }
  };

  // --- Helpers ---
  const isGroupItem = (item: GridItem): item is Group => {
    return (item as Group).alias !== undefined;
  };

  const getLetterFromAlias = (alias: string) => {
    const parts = alias.split(' ');
    return parts.length > 1 ? parts[1].charAt(0).toUpperCase() : alias.charAt(0).toUpperCase();
  };

  // --- Paginación ---
  const totalPages = Math.ceil(items.length / visibleCount);
  const startIndex = currentPage * visibleCount;
  const visibleItems = items.slice(startIndex, startIndex + visibleCount);
  const emptySlots = visibleCount - visibleItems.length;

  const goToPrev = () => currentPage > 0 && setCurrentPage(p => p - 1);
  const goToNext = () => currentPage < totalPages - 1 && setCurrentPage(p => p + 1);

  return (
    <IonPage>
      <IonContent className="student-login-content" scrollY={false}>
        <div className="sel-login-container">
          
          {/* HEADER */}
          <div className="sel-header-row">
            <Button3Dtext 
              color="var(--ion-color-primary)" 
              onClick={handleBack}
            >
               {/* Cambiamos el icono dinámicamente */}
               <IonIcon icon={!activeGroupId ? person : arrowBack} className="btn-icon" />
            </Button3Dtext>

            {/* El título NO se recarga, la animación 'floating' continua perfecta */}
            <img 
              src="/assets/Tato/Tatitulo.png" 
              alt="Tato Matemáticas" 
              className="sel-logo-title" 
            />

            <Button3Dtext 
              color="var(--ion-color-success)" 
              onClick={handleAdvance}
              disabled={loading || !selectedItem}
            >
               <IonIcon icon={checkmark} className="btn-icon" />
            </Button3Dtext>
          </div>

          {/* MAIN CARD */}
          <div className="sel-main-wrapper">
            {/* Agregamos una animación CSS simple de fade al contenedor interno */}
            <div className="sel-classes-card animate-fade-in" key={activeGroupId || 'groups'}>
              
              {loading ? (
                <IonSpinner name="crescent" color="light" style={{ transform: 'scale(2)' }} />
              ) : items.length === 0 ? (
                <IonText color="light">
                    <h2>{!activeGroupId ? 'No hay clases' : 'No hay estudiantes'}</h2>
                </IonText>
              ) : (
                <div className="sel-group-grid">
                  {visibleItems.map((item) => {
                    const isSelected = selectedItem?.id === item.id;
                    const isGroup = isGroupItem(item);

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTileClick(item)}
                        className={`sel-group-tile ${isSelected ? 'selected' : ''}`}
                        style={{ 
                            flexDirection: isGroup ? 'row' : 'column',
                            gap: isGroup ? '0' : '5%'
                        }}
                      >
                        {isGroup ? (
                            <>
                                <img src="/assets/pictograms/clase.png" alt={item.alias} className="sel-group-icon" />
                                <span className="sel-group-letter">{getLetterFromAlias(item.alias)}</span>
                            </>
                        ) : (
                            <>
                                <img
                                    src={(item as User).photo_url || "/assets/pictograms/user_default.png"}
                                    alt={(item as User).username}
                                    style={{
                                        width: '60%', height: '60%', objectFit: 'contain',
                                        borderRadius: '50%', pointerEvents: 'none'
                                    }}
                                />
                                <span style={{
                                    fontSize: 'clamp(1rem, 2.5vh, 1.5rem)',
                                    fontWeight: 'bold', color: '#333',
                                    pointerEvents: 'none', lineHeight: 1.2
                                }}>
                                    {(item as User).username}
                                </span>
                            </>
                        )}

                        {confirmPendingId === String(item.id) && (
                          <div className="sel-confirm-overlay">
                            <img src="/assets/pictograms/si.png" alt="Confirmar" className="sel-confirm-icon" />
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {Array.from({ length: emptySlots }).map((_, i) => (
                    <div key={`empty-${i}`} className="sel-group-ghost"></div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="sel-footer-controls">
            <div style={{ visibility: (items.length > visibleCount) ? 'visible' : 'hidden' }}>
              <Button3Dtext color="var(--ion-color-primary)" onClick={goToPrev} disabled={currentPage === 0}>
                <IonIcon icon={arrowBack} className="btn-icon" />
              </Button3Dtext>
            </div>

            <ul className="sel-page-indicators" style={{ visibility: (items.length > visibleCount) ? 'visible' : 'hidden' }}>
              {Array.from({ length: totalPages }, (_, i) => (
                <li key={i}>
                  <button className="sel-page-indicator" onClick={() => setCurrentPage(i)} aria-selected={currentPage === i} />
                </li>
              ))}
            </ul>

            <div style={{ visibility: (items.length > visibleCount) ? 'visible' : 'hidden' }}>
              <Button3Dtext color="var(--ion-color-primary)" onClick={goToNext} disabled={currentPage >= totalPages - 1}>
                <IonIcon icon={arrowForward} className="btn-icon" />
              </Button3Dtext>
            </div>
          </div>

          {error && <div className="sel-error-message">{error}</div>}
        </div>
      </IonContent>
    </IonPage>
  );
}