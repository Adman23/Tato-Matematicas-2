import { IonContent, IonIcon, IonPage, useIonRouter } from "@ionic/react";
import { useAuth } from '../../../contexts/AuthContext';
import { Button3Dtext } from "../../global_components/PushableButtons";
import { arrowBack } from "ionicons/icons";
import { useState, useEffect } from 'react';

import './EditGame1.css';
import { gamesAPI, type GameConfig } from "../../../lib/api";
import SimpleHeaderUser from "../../student/components/SimpleHeaderUser";
import LoadingSpinner from "../../global_components/LoadingSpinner";

// Opciones de rango (de acuerdo a la DB)
const RANGE_OPTIONS = [
    { value: '0-10', label: 'De 0 a 10' },
    { value: '0-20', label: 'De 0 a 20' },
    { value: '0-100', label: 'De 0 a 100' },
    { value: '0-1000', label: 'De 0 a 1000' }
];

// Opciones de cantidad (3-12)
const QUANTITY_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function EditGame1() {
    const { user } = useAuth();
    const router = useIonRouter();

    const [loading, setLoading] = useState(true);

    // Estados de configuración
    const [voice, setVoice] = useState<'woman' | 'man'>('woman');
    const [quantity, setQuantity] = useState<number>(5);
    const [numberRange, setNumberRange] = useState<string>('0-10');

    // Estados de modales
    const [showQuantityModal, setShowQuantityModal] = useState(false);
    const [showRangeModal, setShowRangeModal] = useState(false);
    const [showVoiceModal, setShowVoiceModal] = useState(false);

    useEffect(() => {
        loadGameConfig();
    }, []);

    /**
      * Resumen funcional:
      * Carga la configuración actual del juego desde el backend y la muestra en la UI.
      *
      * Flujo de ejecución:
      * 1. Verifica que existe usuario autenticado
      * 2. Llama a la API para obtener config de 'touch_number'
      * 3. Extrae valores de voz, cantidad y rango
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

            const data = await gamesAPI.getGameConfig(user.id, 'touch_number');

            // Cargar valores actuales
            setVoice(data.settings?.voice || 'woman');
            setQuantity(data.settings?.options_count || 9);
            setNumberRange(data.number_range || '0-10');

            setLoading(false);
        } catch (error) {
            console.error('Error loading game config:', error);
            setLoading(false);
        }
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

        try {
            if (!user?.id) return;

            const config: GameConfig = {
                game_id: 0,
                game_key: 'touch_number',
                user_id: user.id,
                number_range: numberRange,
                settings: {
                    voice,
                    options_count: quantity
                }
            };

            await gamesAPI.updateGameConfig(user.id, 'touch_number', config);

            // Volver al perfil
            router.push('/student/profile', 'back');
        } catch (error) {
            console.error('Error saving config:', error);
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
        setShowVoiceModal(false);
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

    // Mostrar spinner mientras carga
    if (loading) {
        return (
            <IonPage>
                <IonContent className="ion-padding ion-text-center">
                    <LoadingSpinner message="Cargando configuración del juego 1" />
                </IonContent>
            </IonPage >
        );
    }

    return (
        <IonPage className="EditGame1-page">
            <SimpleHeaderUser userName={user?.username || "username"}
                photoUrl={user?.photo_url} hidden={true} />
            <IonContent className="EditGame1-content">
                <div className="EditGame1-wrapper">
                    <div className="EditGame1-back-button">
                        <Button3Dtext
                            onClick={() => router.push('/student/dashboard', "back", "pop")}
                            aria-label="Volver atrás">
                            <IonIcon icon={arrowBack} />
                        </Button3Dtext>
                    </div>

                    {/* 3 Botones principales */}
                    <div className="EditGame1-config-buttons">
                        <div className="EditGame1-buttons-result">
                            {/* Voz elegida */}
                            <div className="EditGame1-config-button-value">
                                <img
                                    src={voice === 'woman' ? '/assets/pictograms/mujer.png' : '/assets/pictograms/hombre.png'}
                                    alt={voice === 'woman' ? 'Mujer' : 'Hombre'}
                                    className="EditGame1-config-button-image"
                                />
                                <span className="modal-range-text">{voice === 'woman' ? 'Mujer' : 'Hombre'}</span>
                            </div>
                            {/* Botón Voz */}
                            <Button3Dtext
                                className="EditGame1-config-button-3d"
                                onClick={() => { setShowVoiceModal(true) }}
                            >
                                <div className="EditGame1-config-button-content">
                                    <img
                                        src={"/assets/pictograms/voz.png"}
                                        alt="Voz"
                                        className="EditGame1-config-button-image"
                                    />
                                    <span className="btn-text">VOZ</span>
                                </div>
                            </Button3Dtext>
                        </div>

                        <div className="EditGame1-buttons-result">
                            {/* Cantidad elegida */}
                            <div className="EditGame1-config-button-value">
                                {quantity <= 10 ? (
                                    <img
                                        src={`/assets/numbers/${quantity}.png`}
                                        alt={`Número ${quantity}`}
                                        className="EditGame1-config-button-image"
                                    />
                                ) : (
                                    <span className="modal-number-text">{quantity}</span>
                                )}
                            </div>

                            {/* Botón Cantidad */}
                            <Button3Dtext
                                className="EditGame1-config-button-3d"
                                onClick={() => { setShowQuantityModal(true) }}
                            >
                                <div className="EditGame1-config-button-content">
                                    <img
                                        src="/assets/pictograms/cantidad.png"
                                        alt="Cantidad"
                                        className="EditGame1-config-button-image"
                                    />
                                    <span className="btn-text">CANTIDAD</span>
                                </div>
                            </Button3Dtext>
                        </div>

                        <div className="EditGame1-buttons-result">
                            {/* Rango elegido */}
                            <div className="EditGame1-config-button-value">
                                <div className="range-chosen">
                                    <span className="modal-range-text">{getSelectedRangeLabel()}</span>
                                </div>
                            </div>
                            {/* Botón Rango */}
                            <Button3Dtext
                                className="EditGame1-config-button-3d"
                                onClick={() => { setShowRangeModal(true) }}
                            >
                                <div className="EditGame1-config-button-content">
                                    <img
                                        src="/assets/pictograms/rango.png"
                                        alt="Rango"
                                        className="EditGame1-config-button-image"
                                    />
                                    <span className="btn-text">RANGO</span>
                                </div>
                            </Button3Dtext>
                        </div>
                    </div>

                    {/* Botón Guardar cambios */}
                    <div className="EditGame1-save-button">
                        <Button3Dtext onClick={handleSave}>
                            <img
                                src="/assets/pictograms/correctoS.png"
                                alt="Guardar cambios"
                                className="EditGame1-config-button-image"
                            />
                            <span className="btn-text">GUARDAR</span>
                        </Button3Dtext>
                    </div>
                </div>{/* Cierre de EditGame1-wrapper */}


                {/* MODAL: Cantidad */}
                {showQuantityModal && (
                    <div className="modal-overlay" onClick={closeAllModals}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close-btn" onClick={closeAllModals}>✕</button>
                            <div className="modal-options-grid quantity-grid">
                                {QUANTITY_OPTIONS.map((num) => {
                                    const pictogram = num <= 10 ? `/assets/numbers/${num}.png` : null;
                                    // Deshabilitar opciones mayores a 10 si el rango es 0-10
                                    const isDisabled = numberRange === '0-10' && num > 10;
                                    return (
                                        <div
                                            key={num}
                                            className={`modal-option ${quantity === num ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                            onClick={() => {
                                                if (!isDisabled) {
                                                    setQuantity(num);
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
                                            // Si el rango es 0-10 y la cantidad es mayor a 10, ajustar a 10
                                            if (option.value === '0-10' && quantity > 10) {
                                                setQuantity(10);
                                            }
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

                {/* MODAL: Voz */}
                {showVoiceModal && (
                    <div className="modal-overlay" onClick={closeAllModals}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close-btn" onClick={closeAllModals}>✕</button>
                            <div className="modal-options-grid order-grid">
                                <div
                                    className={`modal-option large ${voice === 'woman' ? 'selected' : ''}`}
                                    onClick={() => {
                                        setVoice('woman');
                                        closeAllModals();
                                    }}
                                >
                                    <div className="order-content">
                                        <img
                                            src="/assets/pictograms/mujer.png"
                                            alt="woman"
                                            className="EditGame1-config-button-image"
                                        />
                                        <span className="modal-range-text">Mujer</span>
                                    </div>
                                </div>
                                <div
                                    className={`modal-option large ${voice === 'man' ? 'selected' : ''}`}
                                    onClick={() => {
                                        setVoice('man');
                                        closeAllModals();
                                    }}
                                >
                                    <div className="order-content">
                                        <img
                                            src="/assets/pictograms/hombre.png"
                                            alt="man"
                                            className="EditGame1-config-button-image"
                                        />
                                        <span className="modal-range-text">Hombre</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </IonContent>
        </IonPage >
    );
}