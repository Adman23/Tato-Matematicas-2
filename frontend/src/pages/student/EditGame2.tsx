/**
 * @file EditGame2.tsx
 * @description Pantalla de configuración del Juego 2 para estudiantes.
 *
 * Permite al usuario personalizar los parámetros del Juego 2 (Ordena la Secuencia)
 * antes de jugar. La configuración se guarda en el backend y se aplica al iniciar el juego.
 *
 * Flujo de la pantalla:
 * 1. Carga la configuración actual del usuario desde el backend
 * 2. Muestra 3 botones de configuración (Cantidad, Rango, Orden)
 * 3. Al pulsar cada botón, abre un modal para seleccionar el valor
 * 4. Valida la configuración (cantidad no puede exceder el rango)
 * 5. Guarda la configuración en el backend
 * 6. Vuelve al perfil del estudiante
 *
 * Parámetros configurables:
 * - Orden: Ascendente (menor a mayor) o Descendente (mayor a menor)
 * - Cantidad: Número de elementos a ordenar (3-12)
 * - Rango: Rango de números disponibles (0-10, 0-20, 0-100, 0-1000)
 *
 * @returns Componente React con UI de configuración
 */

import {
    IonPage,
    IonContent,
    useIonRouter,
    IonIcon,
    IonSpinner
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { gamesAPI, type GameConfig } from '../../lib/api';
import SimpleHeaderUser from './components/SimpleHeaderUser';
import { Button3Dtext } from '../global_components/PushableButtons';
import LoadingSpinner from '../global_components/LoadingSpinner';
import './EditGame2.css';
import '../games/components/GameHeader.css';
import { arrowBack } from 'ionicons/icons';

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
 * Componente principal de configuración del Juego 2.
 *
 * Resumen funcional:
 * Interfaz de configuración que permite al estudiante personalizar los parámetros
 * del Juego 2 mediante tres botones principales que abren modales de selección.
 *
 * Flujo de ejecución:
 * 1. Carga configuración actual (`loadGameConfig`)
 * 2. Usuario selecciona valores mediante modales
 * 3. Valida la configuración (`validateInputs`)
 * 4. Guarda en backend y vuelve al perfil (`handleSave`)
 *
 * Contrato mínimo:
 * - Entradas: acciones del usuario (clicks en botones y opciones)
 * - Salidas: llamada API para guardar configuración
 * - Modos de error: validación de rango vs cantidad
 *
 * @returns Componente React con UI de configuración
 *
 * @example
 * <Route path="/student/edit-game2" component={EditGame2} />
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
   * Resumen funcional:
   * Carga la configuración actual del juego desde el backend y la muestra en la UI.
   *
   * Flujo de ejecución:
   * 1. Verifica que existe usuario autenticado
   * 2. Llama a la API para obtener config de 'order_sequence'
   * 3. Extrae valores de orden, cantidad y rango
   * 4. Actualiza estados y desactiva spinner de carga
   *
   * @returns Promise<void> que resuelve cuando se carga la configuración
   *
   * @example
   * await loadGameConfig();
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
   * Resumen funcional:
   * Valida que la cantidad seleccionada sea compatible con el rango de números.
   *
   * Flujo de ejecución:
   * 1. Extrae min y max del rango seleccionado
   * 2. Calcula el tamaño del rango (números disponibles)
   * 3. Verifica que la cantidad no exceda el rango
   * 4. Verifica que la cantidad esté entre 3 y 12
   *
   * @returns boolean - true si la configuración es válida, false si no
   *
   * @example
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
   * Resumen funcional:
   * Guarda la configuración validada en el backend y vuelve al perfil.
   *
   * Flujo de ejecución:
   * 1. Valida la configuración con `validateInputs()`
   * 2. Construye objeto GameConfig con los valores actuales
   * 3. Envía la configuración al backend mediante API
   * 4. Redirige al perfil del estudiante
   *
   * @returns Promise<void> que resuelve cuando se guarda la configuración
   *
   * @example
   * await handleSave();
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
   * Resumen funcional:
   * Cierra todos los modales de selección.
   *
   * @returns void
   *
   * @example
   * closeAllModals();
   */
    const closeAllModals = () => {
        setShowQuantityModal(false);
        setShowRangeModal(false);
        setShowOrderModal(false);
    };

  /**
   * Resumen funcional:
   * Obtiene el label descriptivo del rango de números seleccionado.
   *
   * @returns string - Label del rango (ej: "De 0 a 10") o el valor del rango si no se encuentra
   *
   * @example
   * getSelectedRangeLabel(); // "De 0 a 10"
   */
    const getSelectedRangeLabel = () => {
        return RANGE_OPTIONS.find(opt => opt.value === numberRange)?.label || numberRange;
    };

    const getRangeSize = () => {
        const [min, max] = numberRange.split('-').map(Number);
        return max - min + 1;
    };

    const isQuantityDisabled = (num: number) => num > getRangeSize();

    // Mostrar spinner mientras carga
    if (loading) {
        return (
            <IonPage>
                <IonContent className="ion-padding ion-text-center">
                    <LoadingSpinner message="Cargando configuración del juego 2" />
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage className="EditGame2-page">
            <SimpleHeaderUser
                userName={user?.username || "username"}
                photoUrl={user?.photo_url}
                hidden={true}
            />

            <IonContent className="EditGame2-content" fullscreen scrollY={false}>
                <div className="EditGame2-wrapper">
                    <div className="EditGame2-back-button">
                        <Button3Dtext
                            onClick={() => router.push('/student/profile', "back", "pop")}
                            aria-label="Volver atrás">
                            <IonIcon icon={arrowBack} />
                        </Button3Dtext>
                    </div>

                    {/* 3 Botones principales */}
                    <div className="EditGame2-config-buttons">
                        <div className="EditGame2-buttons-result">
                            {/* Cantidad elegida */}
                            <div className="EditGame2-config-button-value">
                                {quantity <= 10 ? (
                                    <img
                                        src={`/assets/numbers/${quantity}.png`}
                                        alt={`Número ${quantity}`}
                                        className="EditGame2-config-button-image"
                                    />
                                ) : (
                                    <span className="modal-number-text">{quantity}</span>
                                )}
                            </div>

                            {/* Botón Cantidad */}
                            <Button3Dtext
                                className="EditGame2-config-button-3d"
                                onClick={() => { setShowQuantityModal(true); setError(''); }}
                            >
                                <div className="EditGame2-config-button-content">
                                    <img
                                        src="/assets/pictograms/cantidad.png"
                                        alt="Cantidad"
                                        className="EditGame2-config-button-image"
                                    />
                                    <span className="btn-text">CANTIDAD</span>
                                </div>
                            </Button3Dtext>
                        </div>

                        <div className="EditGame2-buttons-result">
                            {/* Rango elegido */}
                            <div className="EditGame2-config-button-value">
                                <div className="range-chosen">
                                    <span className="modal-range-text">{getSelectedRangeLabel()}</span>
                                </div>
                            </div>
                            {/* Botón Rango */}
                            <Button3Dtext
                                className="EditGame2-config-button-3d"
                                onClick={() => { setShowRangeModal(true); setError(''); }}
                            >
                                <div className="EditGame2-config-button-content">
                                    <img
                                        src="/assets/pictograms/rango.png"
                                        alt="Rango"
                                        className="EditGame2-config-button-image"
                                    />
                                    <span className="btn-text">RANGO</span>
                                </div>
                            </Button3Dtext>
                        </div>

                        <div className="EditGame2-buttons-result">
                            {/* Orden elegido */}
                            <div className="EditGame2-config-button-value">
                                <img
                                    src={order === 'ascending' ? "/assets/editarJuegos/botón arriba.png" : "/assets/editarJuegos/botón abajo.png"}
                                    alt={order === 'ascending' ? 'Ascendente' : 'Descendente'}
                                    className="EditGame2-config-button-image"
                                />
                                <span className="modal-range-text">{order === 'ascending' ? 'Ascendente' : 'Descendente'}</span>
                            </div>
                            {/* Botón Orden */}
                            <Button3Dtext
                                className="EditGame2-config-button-3d"
                                onClick={() => { setShowOrderModal(true); setError(''); }}
                            >
                                <div className="EditGame2-config-button-content">
                                    <img
                                        src="/assets/editarJuegos/nums.png"
                                        alt="Orden"
                                        className="EditGame2-config-button-image"
                                    />
                                    <span className="btn-text">ORDEN</span>
                                </div>
                            </Button3Dtext>
                        </div>
                    </div>

                    {error && (
                        <div className="EditGame2-error-message">
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Botón Guardar cambios */}
                    <div className="EditGame2-save-button">
                        <Button3Dtext onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <IonSpinner name="crescent" />
                            ) : (
                                <>
                                    <img
                                        src="/assets/pictograms/correctoS.png"
                                        alt="Guardar cambios"
                                        className="EditGame2-config-button-image"
                                    />
                                    <span className="btn-text">GUARDAR</span>
                                </>
                            )}
                        </Button3Dtext>
                    </div>
                </div>


                {/* MODAL: Cantidad */}
                {showQuantityModal && (
                    <div className="modal-overlay" onClick={closeAllModals}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close-btn" onClick={closeAllModals}>✕</button>
                            <div className="modal-options-grid quantity-grid">
                                {QUANTITY_OPTIONS.map((num) => {
                                    const pictogram = num <= 10 ? `/assets/numbers/${num}.png` : null;
                                    const isDisabled = isQuantityDisabled(num);
                                    return (
                                        <div
                                            key={num}
                                            className={`modal-option ${quantity === num ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                            onClick={() => {
                                                if (!isDisabled) {
                                                    setQuantity(num);
                                                    setError('');
                                                    closeAllModals();
                                                }
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
                            <div className="modal-options-grid range-grid">
                                {RANGE_OPTIONS.map((option) => (
                                    <div
                                        key={option.value}
                                        className={`modal-option large ${numberRange === option.value ? 'selected' : ''}`}
                                        onClick={() => {
                                            setNumberRange(option.value);
                                            // Ajustar cantidad si el rango es más pequeño
                                            const [minRange, maxRange] = option.value.split('-').map(Number);
                                            const maxQuantity = maxRange - minRange + 1;
                                            if (quantity > maxQuantity) {
                                                setQuantity(Math.min(quantity, maxQuantity));
                                            }
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
