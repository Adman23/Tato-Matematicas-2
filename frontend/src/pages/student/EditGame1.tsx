/**
 * Edit Game 1: Touch Number Configuration Page
 *
 */

import { IonContent, IonIcon, IonPage, useIonRouter } from "@ionic/react";
import { useAuth } from '../../contexts/AuthContext';
import { Button3Dtext } from "../global_components/PushableButtons";
import { arrowBack } from "ionicons/icons";
import { useState, useEffect, useRef } from 'react';

import './EditGame1.css';
import { gamesAPI, type GameConfig } from "../../lib/api";
import SimpleHeaderUser from "../student/components/SimpleHeaderUser";
import LoadingSpinner from "../global_components/LoadingSpinner";
import { useParams } from "react-router-dom";

/**
 * Range options available for the game.
 */
const RANGE_OPTIONS = [
    { value: '0-10', label: 'De 0 a 10' },
    { value: '0-20', label: 'De 0 a 20' },
    { value: '0-100', label: 'De 0 a 100' },
    { value: '0-1000', label: 'De 0 a 1000' }
];

/**
 * Quantity options available for the game.
 */
const QUANTITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function EditGame1() {
    const { user } = useAuth();
    // Obtenemos parámetros (pueden ser undefined si entra un alumno directamente)
    const { id, name } = useParams<{ id: string; name: string }>();
    const router = useIonRouter();

    const [loading, setLoading] = useState(true);

    // Game configuration states
    const [voice, setVoice] = useState<'woman' | 'man'>('woman');
    const [quantity, setQuantity] = useState<number>(5);
    const [numberRange, setNumberRange] = useState<string>('0-10');

    // State to determine if the range option should be hidden for students
    const [isRangeLockedForStudent, setIsRangeLockedForStudent] = useState<boolean>(false);

    // Modal states
    const [showQuantityModal, setShowQuantityModal] = useState(false);
    const [showRangeModal, setShowRangeModal] = useState(false);
    const [showVoiceModal, setShowVoiceModal] = useState(false);

    // Accessibility announcement state
    const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

    const announce = (message: string) => {
        setLiveAnnouncement('');
        setTimeout(() => {
            setLiveAnnouncement(message);
        }, 100);
    };

    // Refs for focus trapping
    const modalRef = useRef<HTMLDivElement>(null);

    /**
     * Focus trapping effect for modals.
     */
    useEffect(() => {
        const isAnyModalOpen = showQuantityModal || showRangeModal || showVoiceModal;

        if (!isAnyModalOpen || !modalRef.current) return;

        const modal = modalRef.current;
        const focusableElements = modal.querySelectorAll<HTMLElement>(
            'button, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        setTimeout(() => firstElement?.focus(), 0);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeAllModals();
                return;
            }

            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showQuantityModal, showRangeModal, showVoiceModal]);

    useEffect(() => {
        loadGameConfig();
    }, []);

    /**
     * Load the current game configuration
     */
    const loadGameConfig = async () => {
        try {
            // CORRECCIÓN: Definir el ID objetivo (URL o Usuario actual)
            const targetUserId = id || user?.id;

            if (!targetUserId) {
                // Si no hay usuario logueado ni ID en url, salimos
                return;
            }

            // Usamos targetUserId en lugar de id
            const data = await gamesAPI.getGameConfig(targetUserId, 'touch_number');

            if (data) {
                // Load current values
                setVoice(data.settings?.voice || 'woman');
                setQuantity(data.settings?.options_count || 9);
                setNumberRange(data.number_range || '0-10');

                // Si es estudiante, rango 0-10 Y el tutor fue quien modificó, bloquear
                if (user?.role !== 'teacher' && data.number_range === '0-10' && data.last_modified_by === 'teacher') {
                    setIsRangeLockedForStudent(true);
                }
            }
            setLoading(false);
        } catch (error: any) {
            // Manejo de error 404 (config no encontrada, usar defaults)
            if (error.response && error.response.status === 404) {
                console.log('No existe configuración previa, usando valores por defecto.');
                setLoading(false);
            } else {
                console.error('Error loading game config:', error);
                setLoading(false);
            }
        }
    };

    /**
     * Saves the game configuration
     */
    const handleSave = async () => {
        try {
            // CORRECCIÓN: Definir el ID objetivo
            const targetUserId = id || user?.id;

            if (!targetUserId || !user) return;

            const config: GameConfig = {
                game_id: 0,
                game_key: 'touch_number',
                user_id: targetUserId, // Usamos targetUserId
                number_range: numberRange,
                last_modified_by: user.role === 'teacher' ? 'teacher' : 'student',
                settings: {
                    voice,
                    options_count: quantity
                }
            };

            await gamesAPI.updateGameConfig(targetUserId, 'touch_number', config);

            announce('Configuración guardada correctamente');

            // Redirigir según el rol del usuario Y si hay parámetros en la URL
            if (user?.role === 'teacher' && id && name) {
                router.push(`/student-edit-menu/${id}/${name}`, 'back');
            } else {
                router.push('/student/profile', 'back');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            announce('Error al guardar la configuración');
        }
    };

    const closeAllModals = () => {
        setShowQuantityModal(false);
        setShowRangeModal(false);
        setShowVoiceModal(false);
    };

    const getSelectedRangeLabel = () => {
        return RANGE_OPTIONS.find(opt => opt.value === numberRange)?.label || numberRange;
    };

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
            <SimpleHeaderUser
                title="Juego 1"
                title_image="/assets/pictograms/editar.png"
                userName={user?.username || "username"}
                photoUrl={user?.photo_url} hidden={true} />
            <IonContent className="EditGame1-content">
                <div
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                    style={{
                        position: 'absolute',
                        width: '1px',
                        height: '1px',
                        padding: 0,
                        margin: '-1px',
                        overflow: 'hidden',
                        clip: 'rect(0, 0, 0, 0)',
                        whiteSpace: 'nowrap',
                        border: 0
                    }}
                >
                    {liveAnnouncement}
                </div>

                <div className="EditGame1-wrapper">
                    <div className="EditGame1-back-button-content">
                        <Button3Dtext
                            onClick={() => {
                                if (user?.role === 'teacher' && id && name) {
                                    router.push(`/student-edit-menu/${id}/${name}`, 'back', 'pop');
                                } else {
                                    router.push('/student/profile', 'back', 'pop');
                                }
                            }}
                            aria-label="Volver atrás"
                        >
                            <IonIcon icon={arrowBack} />
                        </Button3Dtext>
                    </div>

                    {/* 3 Main Buttons */}
                    <div className="EditGame1-config-buttons">
                        <div className="EditGame1-buttons-result">
                            {/* Selected Voice */}
                            <div
                                className="EditGame1-config-button-value"
                                role="status"
                                aria-label={`Voz seleccionada: ${voice === 'woman' ? 'Mujer' : 'Hombre'}`}
                            >
                                <img
                                    src={voice === 'woman' ? '/assets/pictograms/mujer.png' : '/assets/pictograms/hombre.png'}
                                    alt=""
                                    aria-hidden="true"
                                    className="EditGame1-config-button-image"
                                />
                                <span className="EditGame1-modal-range-text" aria-hidden="true">{voice === 'woman' ? 'Mujer' : 'Hombre'}</span>
                            </div>
                            {/* Voice Button */}
                            <Button3Dtext
                                aria-label="Configurar voz"
                                className="EditGame1-config-button-3d"
                                onClick={() => { setShowVoiceModal(true) }}
                            >
                                <div className="EditGame1-config-button-content" aria-hidden="true">
                                    <img
                                        src={"/assets/pictograms/voz.png"}
                                        alt=""
                                        className="EditGame1-config-button-image"
                                    />
                                    <span className="btn-text">VOZ</span>
                                </div>
                            </Button3Dtext>
                        </div>

                        <div className="EditGame1-buttons-result">
                            {/* Selected Quantity */}
                            <div
                                className="EditGame1-config-button-value"
                                role="status"
                                aria-label={`Cantidad seleccionada: ${quantity} opciones`}
                            >
                                {quantity <= 10 ? (
                                    <img
                                        src={`/assets/numbers/${quantity}.png`}
                                        alt=""
                                        aria-hidden="true"
                                        className="EditGame1-config-button-image"
                                    />
                                ) : (
                                    <span className="EditGame1-modal-number-text" aria-hidden="true">{quantity}</span>
                                )}
                            </div>

                            {/* Quantity Button */}
                            <Button3Dtext
                                aria-label="Configurar cantidad"
                                className="EditGame1-config-button-3d"
                                onClick={() => { setShowQuantityModal(true) }}
                            >
                                <div className="EditGame1-config-button-content" aria-hidden="true">
                                    <img
                                        src="/assets/pictograms/cantidad.png"
                                        alt=""
                                        className="EditGame1-config-button-image"
                                    />
                                    <span className="btn-text">CANTIDAD</span>
                                </div>
                            </Button3Dtext>
                        </div>

                        {/* Only show range option if the student is allowed to modify it */}
                        {!isRangeLockedForStudent && (
                            <div className="EditGame1-buttons-result">
                                {/* Selected Range */}
                                <div
                                    className="EditGame1-config-button-value"
                                    role="status"
                                    aria-label={`Rango seleccionado: ${getSelectedRangeLabel()}`}
                                >
                                    <div className="range-chosen" aria-hidden="true">
                                        <span className="EditGame1-modal-range-text">{getSelectedRangeLabel()}</span>
                                    </div>
                                </div>
                                {/* Range Button */}
                                <Button3Dtext
                                    aria-label="Configurar rango"
                                    className="EditGame1-config-button-3d"
                                    onClick={() => { setShowRangeModal(true) }}
                                >
                                    <div className="EditGame1-config-button-content" aria-hidden="true">
                                        <img
                                            src="/assets/pictograms/rango.png"
                                            alt=""
                                            className="EditGame1-config-button-image"
                                        />
                                        <span className="btn-text">RANGO</span>
                                    </div>
                                </Button3Dtext>
                            </div>
                        )}
                    </div>

                    {/* Save Changes Button */}
                    <div className="EditGame1-save-button">
                        <Button3Dtext
                            aria-label="Guardar cambios"
                            onClick={handleSave}
                        >
                            <img
                                src="/assets/pictograms/correctoS.png"
                                alt=""
                                aria-hidden="true"
                                className="EditGame1-config-button-image"
                            />
                            <span className="btn-text" aria-hidden="true">GUARDAR</span>
                        </Button3Dtext>
                    </div>
                </div>

                {/* MODAL: Quantity */}
                {showQuantityModal && (
                    <div className="EditGame1-modal-overlay" onClick={closeAllModals}>
                        <div
                            className="EditGame1-modal-content"
                            onClick={(e) => e.stopPropagation()}
                            ref={modalRef}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Seleccionar cantidad"
                        >
                            <button
                                className="EditGame1-modal-close-btn"
                                onClick={closeAllModals}
                                aria-label="Cerrar selección de cantidad">✕</button>
                            <div className="EditGame1-modal-options-grid EditGame1-quantity-grid">
                                {QUANTITY_OPTIONS.map((num) => {
                                    const pictogram = num <= 10 ? `/assets/numbers/${num}.png` : null;
                                    const isDisabled = numberRange === '0-10' && num > 10;
                                    const isSelected = quantity === num;
                                    return (
                                        <button
                                            type="button"
                                            key={num}
                                            className={`EditGame1-modal-option ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                            aria-label={`${num} opciones${isSelected ? ', seleccionado' : ''}`}
                                            disabled={isDisabled}
                                            onClick={() => {
                                                if (!isDisabled) {
                                                    setQuantity(num);
                                                    announce(`Cantidad seleccionada: ${num} opciones`);
                                                    closeAllModals();
                                                }
                                            }}
                                        >
                                            {pictogram ? (
                                                <img src={pictogram} alt="" aria-hidden="true" className="EditGame1-modal-number-img" />
                                            ) : (
                                                <span className="EditGame1-modal-number-text" aria-hidden="true">{num}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: Range */}
                {showRangeModal && (
                    <div className="EditGame1-modal-overlay" onClick={closeAllModals}>
                        <div
                            className="EditGame1-modal-content"
                            onClick={(e) => e.stopPropagation()}
                            ref={modalRef}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Seleccionar rango"
                        >
                            <button
                                className="EditGame1-modal-close-btn"
                                onClick={closeAllModals}
                                aria-label="Cerrar selección de rango">✕</button>
                            <div className="EditGame1-modal-options-grid EditGame1-range-grid">
                                {RANGE_OPTIONS.map((option) => {
                                    const isSelected = numberRange === option.value;
                                    return (
                                        <button
                                            type="button"
                                            key={option.value}
                                            className={`EditGame1-modal-option large ${isSelected ? 'selected' : ''}`}
                                            aria-label={`${option.label}${isSelected ? ', seleccionado' : ''}`}
                                            onClick={() => {
                                                setNumberRange(option.value);
                                                if (option.value === '0-10' && quantity > 10) {
                                                    setQuantity(10);
                                                    announce(`Rango seleccionado: ${option.label}. La cantidad se ha ajustado a 10.`);
                                                } else {
                                                    announce(`Rango seleccionado: ${option.label}`);
                                                }
                                                closeAllModals();
                                            }}
                                        >
                                            <span className="EditGame1-modal-range-text" aria-hidden="true">{option.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: Voice */}
                {showVoiceModal && (
                    <div className="EditGame1-modal-overlay" onClick={closeAllModals}>
                        <div
                            className="EditGame1-modal-content"
                            onClick={(e) => e.stopPropagation()}
                            ref={modalRef}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Seleccionar voz"
                        >
                            <button
                                className="EditGame1-modal-close-btn"
                                onClick={closeAllModals}
                                aria-label="Cerrar selección de voz">✕</button>
                            <div className="EditGame1-modal-options-grid EditGame1-voice-grid">
                                <button
                                    type="button"
                                    className={`EditGame1-modal-option voice ${voice === 'woman' ? 'selected' : ''}`}
                                    aria-label={`Mujer${voice === 'woman' ? ', seleccionado' : ''}`}
                                    onClick={() => {
                                        setVoice('woman');
                                        announce('Voz seleccionada: Mujer');
                                        closeAllModals();
                                    }}
                                >
                                    <div className="EditGame1-voice-content" aria-hidden="true">
                                        <img
                                            src="/assets/pictograms/mujer.png"
                                            alt=""
                                            className="EditGame1-config-button-image"
                                        />
                                        <span className="EditGame1-modal-range-text">Mujer</span>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    className={`EditGame1-modal-option voice ${voice === 'man' ? 'selected' : ''}`}
                                    aria-label={`Hombre${voice === 'man' ? ', seleccionado' : ''}`}
                                    onClick={() => {
                                        setVoice('man');
                                        announce('Voz seleccionada: Hombre');
                                        closeAllModals();
                                    }}
                                >
                                    <div className="EditGame1-voice-content" aria-hidden="true">
                                        <img
                                            src="/assets/pictograms/hombre.png"
                                            alt=""
                                            className="EditGame1-config-button-image"
                                        />
                                        <span className="EditGame1-modal-range-text">Hombre</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </IonContent>
        </IonPage >
    );
}