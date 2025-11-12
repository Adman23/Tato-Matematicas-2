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
  const history = useHistory();

  const loadGroupsAndImage = async () => {
    try {
      setLoading(true);
      const groupsData = await authAPI.getGroups();
      const images = await getImages();
      const url = images['clase.png'] || null;
      setGroups(groupsData);
      setClaseImageUrl(url);
      setError('');
    } catch (err: any) {
      setError('Error al cargar los grupos o la imagen');
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
            <h1 className="student-login-title">Selección de grupo</h1>
            <p className="student-login-subtitle">
              Selecciona un grupo y pulsa avanzar
            </p>
          </div>

          {/* Grid de grupos */}
          {loading ? (
            <div className="student-loading">
              <IonSpinner name="crescent" />
            </div>
          ) : (
            <div className="student-pictograms-grid">
              {groups.map((group) => (
                <button
                  key={group.id}
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
                          alt={group.alias}
                          className="student-group-image"
                        />
                        <span className="student-group-letter">
                          {group.alias.trim().charAt(0).toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <h2>{group.alias.toUpperCase()}</h2>
                    )}
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
        </div>
      </IonContent>
    </IonPage>
  );
}