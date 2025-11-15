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
import { authAPI } from '../../lib/api';
import type { Group } from '../../lib/api';
import './StudentLoginSelection.css';

/**
 * Paso 1 del login de estudiante: Selección de grupo.
 *
 * Flujo:
 * 1) Carga la lista de grupos disponibles
 * 2) El alumno selecciona su grupo
 * 3) Navega al paso 2 con el group_id seleccionado
 */
export default function StudentLoginStep1() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const history = useHistory();

  // Cargar grupos solo una vez
  useEffect(() => {
    if (!hasLoaded) {
      loadGroups();
      setHasLoaded(true);
    }
  }, [hasLoaded]);

  // Resetear selección y recargar grupos cada vez que la vista se muestra
  useIonViewWillEnter(() => {
    setSelectedGroup(null);
    setError('');
    setHasLoaded(false); // Permite recargar grupos cuando se vuelve a la vista
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
    // Navegar al paso 2 con el group_id
    history.push(`/student-login/step2/${selectedGroup.id}`);
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
              onClick={() => history.push('/home')}
            >
              <img
                src="/assets/pictograms/home.png"
                alt="Volver a la página principal"
                className="sel-boton-imagen"
              />
            </IonButton>

            {/* Botón de avanzar */}
            <IonButton
              fill="clear"
              className="sel-action-button"
              onClick={handleAdvance}
              disabled={loading}
            >
              <img
                src="/assets/pictograms/correcto.png"
                alt="Avanzar"
                className="sel-boton-imagen student-boton-rotado" /* rotado no está en CSS nuevo — considera renombrarlo o moverlo a sel- si se usa */
              />
            </IonButton>
          </div>

          {/* Título y subtítulo */}
          <div className="sel-login-header">
            <h1 className="sel-login-title">Selección de grupo</h1>
            <p className="sel-login-subtitle">
              Selecciona un grupo y pulsa avanzar
            </p>
          </div>

          {/* Grid de grupos */}
          {loading ? (
            <div className="sel-loading">
              <IonSpinner name="crescent" />
            </div>
          ) : (
            <div className="sel-pictograms-grid">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleGroupClick(group)}
                  disabled={loading}
                  className={`sel-pictogram-button ${
                    selectedGroup?.id === group.id ? 'selected' : ''
                  }`}
                  aria-label={group.alias}
                >
                  <div className="sel-group-card">
                    <h2>{group.alias}</h2>
                  </div>
                </button>
              ))}
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