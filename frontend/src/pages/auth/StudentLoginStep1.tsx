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
import './StudentLogin.css';

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
  const history = useHistory();

  useEffect(() => {
    loadGroups();
  }, []);

  // Resetear selección cada vez que la vista se muestra
  useIonViewWillEnter(() => {
    setSelectedGroup(null);
    setError('');
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

            {/* Botón de avanzar */}

            <IonButton
              fill="clear"
              className="default-action-button"
              onClick={handleAdvance}
              disabled={loading}
            >
              <img
                src="/assets/pictograms/correcto.png"
                alt="Avanzar"
                className="student-boton-imagen student-boton-rotado"
              />
            </IonButton>


          </div>

          {/* Título y arriba */}
          <div className="student-login-header">

            <h1 className="student-login-title">Seleccion de grupo</h1>
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
                    <h2>{group.alias}</h2>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <IonText color="danger">
              <div className="student-error-message ">
                <p>{error}</p>
              </div>
            </IonText>
          )}

        </div>
      </IonContent>
    </IonPage>
  );
}
