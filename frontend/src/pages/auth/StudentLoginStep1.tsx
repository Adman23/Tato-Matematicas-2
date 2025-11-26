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
import { useHistory } from 'react-router-dom';
import { authAPI } from '../../lib/api';
import type { Group } from '../../lib/api';
import './StudentLoginSelection.css';

export default function StudentLoginStep1() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [confirmPendingId, setConfirmPendingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  const history = useHistory();

  // Función para determinar cuántos items mostrar según ancho de pantalla
  const getGridSize = () => (window.innerWidth <= 650 ? 2 : 4);

  // Inicializamos con el tamaño actual
  const [visibleCount, setVisibleCount] = useState(getGridSize());

  // Listener para detectar cambios de tamaño (Móvil vs Desktop)
  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getGridSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (groups.length > 0) {
      const maxPage = Math.max(0, Math.ceil(groups.length / visibleCount) - 1);
      if (currentPage > maxPage) setCurrentPage(maxPage);
    }
  }, [groups.length, currentPage, visibleCount]);

  useEffect(() => {
    if (!hasLoaded) {
      loadGroups();
      setHasLoaded(true);
    }
  }, [hasLoaded]);

  useIonViewWillEnter(() => {
    setSelectedGroup(null);
    setConfirmPendingId(null);
    setError('');
    setHasLoaded(false);
    setCurrentPage(0);
  });

  const loadGroups = async () => {
    try {
      setLoading(true);
      const groupsData = await authAPI.getGroups();
      setGroups(groupsData);
      setError('');
    } catch (err: any) {
      setError('Error al cargar los grupos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTileClick = (group: Group) => {
    if (loading) return;

    if (selectedGroup?.id === group.id && confirmPendingId === String(group.id)) {
      handleAdvance();
      return;
    }
    setSelectedGroup(group);
    setConfirmPendingId(String(group.id));
    setError('');
  };

  const handleAdvance = () => {
    if (!selectedGroup) {
      setError('Selecciona un grupo');
      return;
    }
    history.push(`/student/login/step2/${selectedGroup.id}`);
  };

  const startIndex = currentPage * visibleCount;
  const visibleGroups = groups.slice(startIndex, startIndex + visibleCount);

  // Calculamos huecos vacíos para mantener estructura (2 o 4 según pantalla)
  const emptySlots = visibleCount - visibleGroups.length;

  const showArrows = groups.length > visibleCount;
  const canGoPrev = currentPage > 0;
  const canGoNext = (currentPage + 1) * visibleCount < groups.length;

  const goToPrevPage = () => canGoPrev && setCurrentPage(prev => prev - 1);
  const goToNextPage = () => canGoNext && setCurrentPage(prev => prev + 1);

  const getLetterFromAlias = (alias: string) => {
    const parts = alias.split(' ');
    return parts.length > 1 ? parts[1].charAt(0).toUpperCase() : alias.charAt(0).toUpperCase();
  };

  return (
    <IonPage>
      <IonContent className="student-login-content" scrollY={false}>
        <div className="sel-login-container">
          
          <div className="sel-button-row">
            <IonButton fill="clear" className="sel-action-button" onClick={() => history.push('/home')}>
              <img src="/assets/pictograms/boton_volver.png" alt="Volver" className="sel-boton-imagen" />
            </IonButton>
            <IonButton fill="clear" className="sel-action-button" onClick={() => history.push('/')}>
              <img src="/assets/pictograms/home.png" alt="Inicio" className="sel-boton-imagen" />
            </IonButton>
            <IonButton fill="clear" className="sel-action-button" onClick={handleAdvance} disabled={loading || !selectedGroup}>
              <img src="/assets/pictograms/si.png" alt="Avanzar" className="sel-boton-imagen" />
            </IonButton>
          </div>

          <div className="sel-login-header">
            <h1 className="sel-login-title">Selecciona tu clase</h1>
          </div>

          <div className="sel-group-grid-wrapper">
            {showArrows && (
              <button 
                className="sel-group-grid-arrow" 
                onClick={goToPrevPage} 
                disabled={!canGoPrev}
              >
                <IonIcon icon={arrowBack} style={{ fontSize: '5vmin' }} />
              </button>
            )}

            <div className="sel-classes-card">
              {loading ? (
                <IonSpinner name="crescent" color="light" style={{ transform: 'scale(2)' }} />
              ) : groups.length === 0 ? (
                <IonText color="light"><h2>No hay clases</h2></IonText>
              ) : (
                <div className="sel-group-grid">
                  {visibleGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => handleTileClick(group)}
                      className={`sel-group-tile ${selectedGroup?.id === group.id ? 'selected' : ''}`}
                    >
                      <img src="/assets/pictograms/clase.png" alt={group.alias} className="sel-group-icon" />
                      <span className="sel-group-letter">{getLetterFromAlias(group.alias)}</span>
                      
                      {confirmPendingId === String(group.id) && (
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
              <button 
                className="sel-group-grid-arrow" 
                onClick={goToNextPage} 
                disabled={!canGoNext}
              >
                <IonIcon icon={arrowForward} style={{ fontSize: '5vmin' }} />
              </button>
            )}
          </div>

          <ul 
            className="sel-page-indicators" 
            style={{ visibility: (showArrows && groups.length > 0) ? 'visible' : 'hidden' }}
          >
            {Array.from({ length: Math.ceil(groups.length / visibleCount) }, (_, i) => (
              <li key={i}>
                <button
                  className="sel-page-indicator"
                  onClick={() => setCurrentPage(i)}
                  aria-selected={currentPage === i}
                  tabIndex={(showArrows && groups.length > 0) ? 0 : -1}
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