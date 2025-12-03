import SimpleHeaderEdit from "./components/SimpleHeaderEdit";
import { IonContent, IonIcon, IonPage, IonSpinner, useIonRouter } from "@ionic/react";
import { useAuth } from '../../../contexts/AuthContext';
import { Button3Dtext } from "../../global_components/PushableButtons";
import { arrowBack, checkmark } from "ionicons/icons";
import { useState, useEffect } from 'react';

import './EditGame1.css';
import { gamesAPI, type GameConfig } from "../../../lib/api";

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
    const [saving, setSaving] = useState(false);

    // Estados de configuración
    const [voice, setVoice] = useState<'woman' | 'man'>('woman');
    const [quantity, setQuantity] = useState<number>(5);
    const [numberRange, setNumberRange] = useState<string>('0-10');

    // Estados de modales
    const [showQuantityModal, setShowQuantityModal] = useState(false);
    const [showRangeModal, setShowRangeModal] = useState(false);
    const [showVoiceModal, setShowVoiceModal] = useState(false);

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

        setSaving(true);
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
                <IonContent className="ion-padding ion-text-center"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IonSpinner name="crescent" />
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <SimpleHeaderEdit studentName={user!.username} Editing="Juego 1" />
            <IonContent className="EditGame1-content">
                <div className="EditGame1-buttons">
                    <Button3Dtext
                        color="var(--ion-color-primary)"
                        onClick={() => router.push('/student/profile', 'back')}
                        aria-label="Volver atrás"
                    >
                        <IonIcon icon={arrowBack} aria-hidden="true" />
                    </Button3Dtext>

                    <Button3Dtext
                        color="var(--ion-color-primary)"
                        onClick={() => { handleSave() }}
                        aria-label="Guardar cambios"
                    >
                        <IonIcon icon={checkmark} aria-hidden="true" />
                    </Button3Dtext>
                </div>

                {/* 3 Botones principales */}
                <div className="EditGame1-config-buttons">
                    <div className="EditGame1-buttons-result">
                        {/* Botón Cantidad */}
                        <Button3Dtext
                            color="var(--ion-color-primary)"
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
                    </div>

                    <div className="EditGame1-buttons-result">
                        {/* Botón Rango */}
                        <Button3Dtext
                            color="var(--ion-color-primary)"
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

                        {/* Rango elegido */}
                        <div className="EditGame1-config-button-value">
                            <div className="range-chosen">
                                <span className="modal-range-text">{getSelectedRangeLabel()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="EditGame1-buttons-result">
                        {/* Botón Orden */}
                        <Button3Dtext
                            color="var(--ion-color-primary)"
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

                        {/* Voz elegida */}
                        <div className="EditGame1-config-button-value">
                            <div className="voice-chosen">
                                <img
                                    src={voice === 'woman' ? '/assets/pictograms/mujer.png' : '/assets/pictograms/hombre.png'}
                                    alt={voice === 'woman' ? 'Mujer' : 'Hombre'}
                                    className="EditGame1-config-button-image"
                                />
                                <span className="voice-label">{voice === 'woman' ? 'Mujer' : 'Hombre'}</span>
                            </div>
                        </div>
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
                                        <img src="/assets/pictograms/mujer.png" alt="Mujer" />
                                        <span className="order-label-large">Mujer</span>
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
                                        <img src="/assets/pictograms/hombre.png" alt="Hombre" />
                                        <span className="order-label-large">Hombre</span>
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