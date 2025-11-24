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
  const [visibleCount, setVisibleCount] = useState(4);
  const history = useHistory();

  const calculateVisibleCount = () => {
    const isMobile = window.innerWidth <= 860;
    return isMobile ? 2 : 4;
  };

  useEffect(() => {
    if (groups.length > 0) {
      const maxPage = Math.max(0, Math.ceil(groups.length / visibleCount) - 1);
      if (currentPage > maxPage) {
        setCurrentPage(maxPage);
      }
    }
  }, [visibleCount, groups.length, currentPage]);

  useEffect(() => {
    const updateCount = () => {
      setVisibleCount(calculateVisibleCount());
    };
    updateCount();
    window.addEventListener('resize', updateCount);
    return () => window.removeEventListener('resize', updateCount);
  }, []);

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

  const showArrows = groups.length > visibleCount;
  const canGoPrev = currentPage > 0;
  const canGoNext = (currentPage + 1) * visibleCount < groups.length;

  const goToPrevPage = () => {
    if (canGoPrev) setCurrentPage(prev => prev - 1);
  };

  const goToNextPage = () => {
    if (canGoNext) setCurrentPage(prev => prev + 1);
  };

  const getLetterFromAlias = (alias: string) => {
    const parts = alias.split(' ');
    return parts.length > 1 ? parts[1].charAt(0).toUpperCase() : alias.charAt(0).toUpperCase();
  };

  return (
    <IonPage>
      <IonContent className="student-login-content">
        <div className="sel-login-container">
          <div className="sel-button-row">
            <IonButton
              fill="clear"
              className="sel-action-button"
              onClick={() => history.push('/home')}
            >
              <img
                src="/assets/pictograms/boton_volver.png"
                alt="Volver"
                className="sel-boton-imagen"
              />
            </IonButton>

            <IonButton
              fill="clear"
              className="sel-action-button"
              onClick={() => history.push('/')}
            >
              <img
                src="/assets/pictograms/home.png"
                alt="Inicio"
                className="sel-boton-imagen"
              />
            </IonButton>

            <IonButton
              fill="clear"
              className="sel-action-button"
              onClick={handleAdvance}
              disabled={loading || !selectedGroup}
            >
              <img
                src="/assets/pictograms/si.png"
                alt="Avanzar"
                className="sel-boton-imagen"
              />
            </IonButton>
          </div>

          <div className="sel-login-header">
            <h1 className="sel-login-title">Selecciona tu clase</h1>
          </div>

          <div className="sel-group-grid-wrapper">
            {showArrows && (
              <button
                className="sel-group-grid-arrow left-outside"
                onClick={goToPrevPage}
                disabled={!canGoPrev}
                aria-label="Clases anteriores"
              >
                {/* ✅ Icono Flecha Izquierda */}
                <IonIcon icon={arrowBack} style={{ fontSize: '3rem' }} />
              </button>
            )}

            <div className="sel-classes-card">
              {loading ? (
                <div className="sel-loading">
                  <IonSpinner name="crescent" />
                </div>
              ) : groups.length === 0 ? (
                <div className="sel-error">
                  <p>No hay clases disponibles</p>
                </div>
              ) : (
                <div className="sel-group-grid">
                  {visibleGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => handleTileClick(group)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleTileClick(group);
                        }
                      }}
                      disabled={loading}
                      className={`sel-group-tile ${
                        selectedGroup?.id === group.id ? 'selected' : ''
                      }`}
                      aria-label={`${group.alias} — ${
                        selectedGroup?.id === group.id
                          ? confirmPendingId === String(group.id)
                            ? 'listo para confirmar: presiona Enter o haz clic para continuar'
                            : 'seleccionado'
                          : 'no seleccionado'
                      }`}
                      aria-pressed={selectedGroup?.id === group.id ? 'true' : 'false'}
                      tabIndex={0}
                    >
                      <img
                        src="/assets/pictograms/clase.png"
                        alt={group.alias}
                        className="sel-group-icon"
                      />
                      <span className="sel-group-letter">
                        {getLetterFromAlias(group.alias)}
                      </span>

                      {confirmPendingId === String(group.id) && (
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
              )}
            </div>

            {showArrows && (
              <button
                className="sel-group-grid-arrow right-outside"
                onClick={goToNextPage}
                disabled={!canGoNext}
                aria-label="Más clases"
              >
                {/* ✅ Icono Flecha Derecha */}
                <IonIcon icon={arrowForward} style={{ fontSize: '3rem' }} />
              </button>
            )}
          </div>

          {showArrows && groups.length > 0 && (
            <ul className="sel-page-indicators" role="tablist" aria-label="Navegación por páginas">
              {Array.from({ length: Math.ceil(groups.length / visibleCount) }, (_, i) => (
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