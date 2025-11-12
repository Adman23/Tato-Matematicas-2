/**
 * Pantalla de Paso 1: Selección de Grupo
 * ---------------------------------------------------------
 * El estudiante selecciona su grupo de la lista disponible.
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
import { useHistory } from 'react-router-dom';
import { authAPI, getImages } from '../../lib/api';
import type { Group } from '../../lib/api';
import './StudentLogin.css';

export default function StudentLoginStep1() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claseImageUrl, setClaseImageUrl] = useState<string | null>(null);
  const [arrowImageUrl, setArrowImageUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const history = useHistory();

  const GROUPS_PER_PAGE = 4;

  const loadGroupsAndImage = async () => {
    try {
      setLoading(true);
      const groupsData = await authAPI.getGroups();
      const images = await getImages();

      const claseUrl = images['clase.png'] || null;
      const arrowUrl = images['direccion.png'] || null;

      setGroups(groupsData);
      setClaseImageUrl(claseUrl);
      setArrowImageUrl(arrowUrl);
      setError('');
    } catch (err: any) {
      setError('Error al cargar los grupos o las imágenes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupsAndImage();
  }, []);

  useIonViewWillEnter(() => {
    setSelectedGroup(null);
    setError('');
    setCurrentPage(0);
  });

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

  const totalPages = Math.ceil(groups.length / GROUPS_PER_PAGE);
  const startIndex = currentPage * GROUPS_PER_PAGE;
  const currentGroups = groups.slice(startIndex, startIndex + GROUPS_PER_PAGE);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
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
              onClick={() => history.push('/home')}
            >
              <img
                src="/assets/pictograms/boton_volver.png"
                alt="Volver"
                className="student-boton-imagen"
              />
            </IonButton>

            <IonButton
              fill="clear"
              className="default-action-button"
              onClick={() => history.push('/home')}
            >
              <img
                src="/assets/pictograms/home.png"
                alt="Volver a la pagina principal"
                className="student-boton-imagen"
              />
            </IonButton>

            <IonButton
              fill="clear"
              className="default-action-button"
              onClick={handleAdvance}
              disabled={loading || !selectedGroup}
            >
              <img
                src="/assets/pictograms/correcto.png"
                alt="Avanzar"
                className="student-boton-imagen student-boton-rotado"
              />
            </IonButton>
          </div>

          <div className="student-login-header">
            <h1 className="student-login-title">Selecciona tu clase</h1>
          </div>

          {/* Grid de grupos con paginación — CENTERED 2x2 */}
          {loading ? (
            <div className="student-loading">
              <IonSpinner name="crescent" />
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
                {currentGroups.map((group) => (
                  <div className="student-group-wrapper" key={group.id}>
                    <button
                      onClick={() => handleGroupClick(group)}
                      disabled={loading}
                      className={`student-pictogram-button ${selectedGroup?.id === group.id ? 'selected' : ''}`}
                      aria-label={group.alias}
                    >
                      <div className="student-group-card">
                        {claseImageUrl ? (
                          <div className="student-group-image-container">
                            <img
                              src={claseImageUrl}
                              alt=""
                              className="student-group-image"
                            />
                            <span className="student-group-letter">
                              {group.alias.trim().split(' ').pop()?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        ) : (
                          <h2>{group.alias}</h2>
                        )}
                      </div>
                    </button>
                    <div className="student-group-caption">
                      {group.alias.toUpperCase()}
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