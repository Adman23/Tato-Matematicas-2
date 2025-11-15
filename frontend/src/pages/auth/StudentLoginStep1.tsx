import {
  IonPage,
  IonContent,
  IonButton,
  IonText,
  IonSpinner,
  useIonViewWillEnter,
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { authAPI } from '../../lib/api';
import type { Group } from '../../lib/api';
import './StudentLoginSelection.css';

export default function StudentLoginStep1() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4); // Valor inicial optimista (desktop)
  const history = useHistory();

  // ✅ Nueva lógica: basada en ancho (sincronizada con @media (max-width: 600px))
  const calculateVisibleCount = () => {
    const isMobile = window.innerWidth <= 600;
    return isMobile ? 2 : 4;
  };

    // ⚠️ Si cambia visibleCount (por resize), resetea currentIndex para evitar páginas inválidas
  useEffect(() => {
    if (groups.length > 0) {
      // Asegurar que currentIndex sea válido para el nuevo visibleCount
      const maxIndex = Math.max(0, groups.length - visibleCount);
      if (currentIndex > maxIndex) {
        setCurrentIndex(maxIndex);
      }
    }
  }, [visibleCount, groups.length, currentIndex]);

  // Recalcular visibleCount al montar y en resize
  useEffect(() => {
    const updateCount = () => {
      setVisibleCount(calculateVisibleCount());
    };

    updateCount(); // Inicial
    window.addEventListener('resize', updateCount);
    return () => window.removeEventListener('resize', updateCount);
  }, []);

  // Cargar grupos
  useEffect(() => {
    if (!hasLoaded) {
      loadGroups();
      setHasLoaded(true);
    }
  }, [hasLoaded]);

  useIonViewWillEnter(() => {
    setSelectedGroup(null);
    setError('');
    setHasLoaded(false);
    setCurrentIndex(0);
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

  const handleGroupClick = (group: Group) => {
    setSelectedGroup(group);
    setError('');
  };

  const handleAdvance = () => {
    if (!selectedGroup) {
      setError('Selecciona un grupo');
      return;
    }
    history.push(`/student-login/step2/${selectedGroup.id}`);
  };

  // ✅ Flechas: visible si hay más grupos que los que caben actualmente
  const showArrows = groups.length > visibleCount;

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex + visibleCount < groups.length;

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

  const getLetterFromAlias = (alias: string) => {
    const parts = alias.split(' ');
    return parts.length > 1 ? parts[1].charAt(0).toUpperCase() : alias.charAt(0).toUpperCase();
  };

  const visibleGroups = groups.slice(currentIndex, currentIndex + visibleCount);

  return (
    <IonPage>
      <IonContent className="student-login-content">
        <div className="sel-login-container">
          {/* Fila de botones superior */}
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
                src="/assets/pictograms/correcto.png"
                alt="Avanzar"
                className="sel-boton-imagen"
              />
            </IonButton>
          </div>

          {/* Título y subtítulo */}
          <div className="sel-login-header">
            <h1 className="sel-login-title">Selecciona tu clase</h1>
            <p className="sel-login-subtitle">Toca tu clase y pulsa avanzar</p>
          </div>

          {/* Grid de grupos con flechas (condicional) */}
          {loading ? (
            <div className="sel-loading">
              <IonSpinner name="crescent" />
            </div>
          ) : groups.length === 0 ? (
            <div className="sel-error">
              <p>No hay clases disponibles</p>
            </div>
          ) : (
            <div className="sel-group-grid-container">
              {/* Flecha izquierda */}
              {showArrows && (
                <button
                  className="sel-group-grid-arrow"
                  onClick={goToPrevPage}
                  disabled={!canGoPrev}
                  aria-label="Clases anteriores"
                >
                  <img src="/assets/pictograms/flecha.png" alt="Anterior" />
                </button>
              )}

              {/* Grid ✅ Sin ref */}
              <div className="sel-group-grid">
                {visibleGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleGroupClick(group)}
                    disabled={loading}
                    className={`sel-group-tile ${selectedGroup?.id === group.id ? 'selected' : ''}`}
                    aria-label={group.alias}
                  >
                    <img
                      src="/assets/pictograms/clase.png"
                      alt={group.alias}
                      className="sel-group-icon"
                    />
                    <span className="sel-group-letter">
                      {getLetterFromAlias(group.alias)}
                    </span>
                    <span className="sel-group-label">{group.alias}</span>
                  </button>
                ))}
              </div>

              {/* Flecha derecha */}
              {showArrows && (
                <button
                  className="sel-group-grid-arrow right"
                  onClick={goToNextPage}
                  disabled={!canGoNext}
                  aria-label="Más clases"
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