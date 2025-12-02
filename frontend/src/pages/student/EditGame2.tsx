/**
 * @file EditGame2.tsx
 * @description Pantalla de configuración del Juego 2 para estudiantes.
 * Permite modificar: sentido (ascendente/descendente), cantidad de números y rango.
 */

import {
  IonPage,
  IonContent,
  IonSpinner,
  useIonRouter
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { gamesAPI } from '../../lib/api';
import type { GameConfig } from '../../lib/api';
import SimpleHeaderUser from './components/SimpleHeaderUser';
import { Button3Dtext } from '../global_components/PushableButtons';
import './EditGame2.css';
import '../games/components/GameHeader.css';

// Opciones de rango (de acuerdo a la DB)
const RANGE_OPTIONS = [
  { value: '0-10', label: 'De 0 a 10' },
  { value: '0-20', label: 'De 0 a 20' },
  { value: '0-100', label: 'De 0 a 100' },
  { value: '0-1000', label: 'De 0 a 1000' }
];

// Opciones de cantidad (3-12)
const QUANTITY_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * Componente de configuración del Juego 2.
 * Diseño con 3 botones principales que abren modales para configurar.
 */
export default function EditGame2() {
  const { user } = useAuth();
  const router = useIonRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados de configuración
  const [order, setOrder] = useState<'ascending' | 'descending'>('ascending');
  const [quantity, setQuantity] = useState<number>(5);
  const [numberRange, setNumberRange] = useState<string>('0-10');

  // Estados de modales
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Estado de validación
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadGameConfig();
  }, []);

  /**
   * Carga la configuración actual del juego desde el backend.
   */
  const loadGameConfig = async () => {
    try {
      if (!user?.id) return;

      const data = await gamesAPI.getGameConfig(user.id, 'order_sequence');

      // Cargar valores actuales
      setOrder(data.settings?.order || 'ascending');
      setQuantity(data.settings?.quantity || 5);
      setNumberRange(data.number_range || '0-10');

      setLoading(false);
    } catch (error) {
      console.error('Error loading game config:', error);
      setLoading(false);
    }
  };

  /**
   * Valida que la cantidad sea válida para el rango seleccionado.
   */
  const validateInputs = (): boolean => {
    const [min, max] = numberRange.split('-').map(Number);
    const rangeSize = max - min + 1;

    if (quantity > rangeSize) {
      setError(`La cantidad no puede ser mayor que el rango (${rangeSize} números disponibles)`);
      return false;
    }

    if (quantity < 3 || quantity > 12) {
      setError('La cantidad debe estar entre 3 y 12');
      return false;
    }

    setError('');
    return true;
  };

  /**
   * Guarda la configuración en el backend.
   */
  const handleSave = async () => {
    if (!validateInputs()) {
      return;
    }

    setSaving(true);
    try {
      if (!user?.id) return;

      const config: GameConfig = {
        game_id: 0,
        game_key: 'order_sequence',
        user_id: user.id,
        number_range: numberRange,
        settings: {
          order,
          quantity
        }
      };

      await gamesAPI.updateGameConfig(user.id, 'order_sequence', config);

      // Volver al perfil
      router.push('/student/profile', 'back');
    } catch (error) {
      console.error('Error saving config:', error);
      setError('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Cierra todos los modales
   */
  const closeAllModals = () => {
    setShowQuantityModal(false);
    setShowRangeModal(false);
    setShowOrderModal(false);
  };

  /**
   * Obtiene el label del rango seleccionado
   */
  const getSelectedRangeLabel = () => {
    return RANGE_OPTIONS.find(opt => opt.value === numberRange)?.label || numberRange;
  };

  // Mostrar spinner mientras carga
  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <SimpleHeaderUser
        userName={user?.username || "username"}
        photoUrl={user?.photo_url}
        url="/student/profile"
      />

      <IonContent className="edit-game2-content" fullscreen scrollY={false}>
        <div className="edit-game2-main-container">
          {/* Cabecera compacta con volver + título */}
          <div className="edit-game2-header-row">
            <button
              className="back-button-arrow"
              onClick={() => router.push('/student/profile', 'back')}
              aria-label="Volver"
            >
              <img src="/assets/pictograms/flecha.png" alt="Volver" className="back-arrow-icon" />
            </button>
            <h2 className="edit-game2-header-title">Modificar JUEGO2</h2>
            <div className="header-spacer" aria-hidden />
          </div>

          {/* 3 Botones principales */}
          <div className="game2-config-buttons">
            {/* Botón Cantidad */}
            <Button3Dtext
              color="rgb(59, 130, 246)"
              className="config-button-3d"
              onClick={() => setShowQuantityModal(true)}
            >
              <div className="config-button-content">
                <img
                  src="/assets/editarJuegos/cantidad.png"
                  alt="Cantidad"
                  className="config-button-image"
                />
                <div className="config-button-label">Cantidad</div>
              </div>
            </Button3Dtext>

            {/* Botón Rango */}
            <Button3Dtext
              color="rgb(59, 130, 246)"
              className="config-button-3d"
              onClick={() => setShowRangeModal(true)}
            >
              <div className="config-button-content">
                <img
                  src="/assets/editarJuegos/nums.png"
                  alt="Rango"
                  className="config-button-image"
                />
                <div className="config-button-label">Rango</div>
              </div>
            </Button3Dtext>

            {/* Botón Orden */}
            <Button3Dtext
              color="rgb(59, 130, 246)"
              className="config-button-3d"
              onClick={() => setShowOrderModal(true)}
            >
              <div className="config-button-content">
                <img
                  src={order === 'ascending' ? "/assets/editarJuegos/botón arriba.png" : "/assets/editarJuegos/botón abajo.png"}
                  alt="Orden"
                  className="config-button-image"
                />
                <div className="config-button-label">Orden</div>
              </div>
            </Button3Dtext>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="error-message-box">
              <span>{error}</span>
            </div>
          )}

          {/* Resumen y botón de guardar en la misma fila */}
          <div className="summary-and-save-row">
            {/* Resumen de configuración actual */}
            <div className="config-summary">
              <div className="summary-item">
                <strong>Cantidad:</strong> {quantity} números
              </div>
              <div className="summary-item">
                <strong>Rango:</strong> {getSelectedRangeLabel()}
              </div>
              <div className="summary-item">
                <strong>Orden:</strong> {order === 'ascending' ? 'Ascendente ↑' : 'Descendente ↓'}
              </div>
            </div>

            {/* Botón Guardar */}
            <div className="save-button-container">
              <Button3Dtext
                color="#4ade80"
                className="save-button-large"
                onClick={handleSave}
              >
                {saving ? (
                  <IonSpinner name="crescent" />
                ) : (
                  <>
                    <img src="/assets/pictograms/correcto.png" alt="Guardar" className="save-icon" />
                    <span>GUARDAR</span>
                  </>
                )}
              </Button3Dtext>
            </div>
          </div>
        </div>

        {/* MODAL: Cantidad */}
        {showQuantityModal && (
          <div className="modal-overlay" onClick={closeAllModals}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={closeAllModals}>✕</button>
              <h2 className="modal-title">SELECCIONA LA CANTIDAD</h2>
              <div className="modal-options-grid quantity-grid">
                {QUANTITY_OPTIONS.map((num) => {
                  const pictogram = num <= 10 ? `/assets/numbers/${num}.png` : null;
                  return (
                    <div
                      key={num}
                      className={`modal-option ${quantity === num ? 'selected' : ''}`}
                      onClick={() => {
                        setQuantity(num);
                        setError('');
                        closeAllModals();
                      }}
                    >
                      {pictogram ? (
                        <img src={pictogram} alt={`${num}`} className="modal-number-img" />
                      ) : (
                        <span className="modal-number-text">{num}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Rango */}
        {showRangeModal && (
          <div className="modal-overlay" onClick={closeAllModals}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={closeAllModals}>✕</button>
              <h2 className="modal-title">SELECCIONA EL RANGO</h2>
              <div className="modal-options-grid range-grid">
                {RANGE_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`modal-option large ${numberRange === option.value ? 'selected' : ''}`}
                    onClick={() => {
                      setNumberRange(option.value);
                      setError('');
                      closeAllModals();
                    }}
                  >
                    <span className="modal-range-text">{option.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Orden */}
        {showOrderModal && (
          <div className="modal-overlay" onClick={closeAllModals}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={closeAllModals}>✕</button>
              <h2 className="modal-title">SELECCIONA EL ORDEN</h2>
              <div className="modal-options-grid order-grid">
                <div
                  className={`modal-option large ${order === 'ascending' ? 'selected' : ''}`}
                  onClick={() => {
                    setOrder('ascending');
                    closeAllModals();
                  }}
                >
                  <div className="order-content">
                    <div className="order-arrow-large">↑</div>
                    <span className="order-label-large">Ascendente</span>
                    <span className="order-sublabel">Menor a Mayor</span>
                  </div>
                </div>
                <div
                  className={`modal-option large ${order === 'descending' ? 'selected' : ''}`}
                  onClick={() => {
                    setOrder('descending');
                    closeAllModals();
                  }}
                >
                  <div className="order-content">
                    <div className="order-arrow-large">↓</div>
                    <span className="order-label-large">Descendente</span>
                    <span className="order-sublabel">Mayor a Menor</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
