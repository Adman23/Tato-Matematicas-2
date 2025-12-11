/**
 * Edit Game 1: Touch Number Configuration Page
 *
 * The student configures the "Touch Number" game settings,
 * including audio voice, number of options, and number range.
 *
 * Functional Summary:
 * - Load current game configuration on component mount.
 * - Display buttons to configure voice, quantity, and range.
 * - Open modals for each configuration option.
 * - Save updated configuration to backend and navigate back to student profile.
 *
 * @returns {JSX.Element} Game 1 configuration page with selection modals
 *
 * @example
 * // Usage in app router
 * <Route path="/student/edit-game1" component={EditGame1} />   
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
 * Allowed range: from 1 to 12 options.
 */
const QUANTITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * Functional Summary:
 * Edit Game 1 (Touch Number) configuration component.
 * 
 * Lets users customize the parameters of the "Touch Number" game,
 * including the audio voice, the number of options displayed, and the range
 * of numbers to practice.
 * 
 * Execution Flow:
 * 1. On component mount, loads the current game configuration from the backend.
 * 2. Displays three main buttons to configure: Voice, Quantity, and Range.
 * 3. When each button is pressed, a modal with available options opens.
 * 4. The user selects the desired options and saves the changes.
 * 5. Upon saving, the configuration is sent to the backend and the user is redirected to the student profile.
 * 
 * @returns {JSX.Element} Game 1 configuration page with selection modals
 * 
 * @example
 * // Usage in app router
 * <Route path="/student/edit-game1" component={EditGame1} />
 */
export default function EditGame1() {
    const { user } = useAuth();
    const { id, name } = useParams<{ id: string; name: string }>();
    const router = useIonRouter();

    const [loading, setLoading] = useState(true);

    // Game configuration states
    const [voice, setVoice] = useState<'woman' | 'man'>('woman');
    const [quantity, setQuantity] = useState<number>(5);
    const [numberRange, setNumberRange] = useState<string>('0-10');

    // State to determine if the range option should be hidden for students
    // When teacher sets range to '0-10', students cannot modify it
    const [isRangeLockedForStudent, setIsRangeLockedForStudent] = useState<boolean>(false);

    // Modal states
    const [showQuantityModal, setShowQuantityModal] = useState(false);
    const [showRangeModal, setShowRangeModal] = useState(false);
    const [showVoiceModal, setShowVoiceModal] = useState(false);

    // Accessibility announcement state
    const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

    /**
     * Function to make accessible announcements using aria-live.
     * Waits for the current announcement to finish before announcing the change.
     * 
     * @param message - Message to announce
     */
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
     * Keeps Tab navigation inside the modal when it's open.
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

        // Focus first element when modal opens
        setTimeout(() => firstElement?.focus(), 0);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeAllModals();
                return;
            }

            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showQuantityModal, showRangeModal, showVoiceModal]);

    /**
     * 
     */
    useEffect(() => {
        loadGameConfig();
    }, []);

    /**
     * Functional Summary:
     * Load the current game configuration from the backend and display it in the UI.
     *
     * Execution Flow:
     * 1. Checks if an authenticated user exists
     * 2. Calls the API to get the 'touch_number' config
     * 3. Extracts voice, quantity, and range values
     * 4. Updates states and disables loading spinner
     *
     * @returns {Promise<void>} Promise that resolves when the configuration is loaded
     *
     * @example
     * await loadGameConfig();
     */
    const loadGameConfig = async () => {
        try {
            if (!user?.id) return;

            const data = await gamesAPI.getGameConfig(id, 'touch_number');

            // Load current values
            setVoice(data.settings?.voice || 'woman');
            setQuantity(data.settings?.options_count || 9);
            setNumberRange(data.number_range || '0-10');

            // If the user is a student and the range is '0-10', lock the range option
            // This means the teacher has configured the range to 0-10 and the student cannot change it
            if (user?.role !== 'teacher' && data.number_range === '0-10') {
                setIsRangeLockedForStudent(true);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading game config:', error);
            setLoading(false);
        }
    };

    /**
     * Functional Summary:
     * Saves the game configuration to the backend and navigates to the student profile.
     *
     * Execution Flow:
     * 1. Checks if an authenticated user exists
     * 2. Constructs a GameConfig object with the current voice, quantity, and range values
     * 3. Sends the configuration to the backend via the API
     * 4. Redirects to the student profile after successful save
     *
     * @returns {Promise<void>} Promise that resolves when the configuration is saved
     *
     * @example
     * await handleSave();
     */
    const handleSave = async () => {

        try {
            if (!user?.id || !id) return;

            // Usar el id de la URL (del alumno) para guardar la configuración
            const targetUserId = id;

            const config: GameConfig = {
                game_id: 0,
                game_key: 'touch_number',
                user_id: targetUserId,
                number_range: numberRange,
                settings: {
                    voice,
                    options_count: quantity
                }
            };

            await gamesAPI.updateGameConfig(targetUserId, 'touch_number', config);

            // Anunciar que se guardó la configuración
            announce('Configuración guardada correctamente');

            // Redirigir según el rol del usuario
            if (user.role === 'teacher') {
                router.push(`/student-edit-menu/${id}/${name}`, 'back');
            } else {
                router.push('/student/profile', 'back');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            announce('Error al guardar la configuración');
        }
    };

    /**
     * Functional Summary:
     * Closes all open selection modals.
     *
     * Execution Flow:
     * 1. Sets the state of all modals (quantity, range, voice) to `false`
     *
     * @returns {void}
     *
     * @example
     * closeAllModals(); // Closes any open modal
     */
    const closeAllModals = () => {
        setShowQuantityModal(false);
        setShowRangeModal(false);
        setShowVoiceModal(false);
    };

    /**
     * Functional Summary:
     * Obtains the descriptive label of the currently selected number range.
     *
     * Execution Flow:
     * 1. Searches in RANGE_OPTIONS for the option that matches the current value of numberRange
     * 2. Returns the corresponding label or the range value if not found
     *
     * @returns {string} Descriptive label of the range (e.g., "From 0 to 10") or the range value if not found
     *
     * @example
     * // If numberRange === '0-10'
     * getSelectedRangeLabel(); // Returns "From 0 to 10"
     */
    const getSelectedRangeLabel = () => {
        return RANGE_OPTIONS.find(opt => opt.value === numberRange)?.label || numberRange;
    };

    // Show spinner while loading
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
                {/* Aria live region for accessibility announcements */}
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

                {/*className="EditGame1-back-button" estaba comentado como clase para el boton*/}
                <div className="EditGame1-wrapper">
                    <div className="EditGame1-back-button-content">
                        <Button3Dtext
                            onClick={() => {
                                if (user?.role === 'teacher') {
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
                        {/* If teacher set range to 0-10, hide this option for students */}
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
                            <Button3Dtext
                                onClick={closeAllModals}
                                className="EditGame1-modal-close-btn"
                                aria-label="Cerrar selección de cantidad"
                            >
                                <IonIcon icon={arrowBack} />
                            </Button3Dtext>
                            <div className="EditGame1-modal-options-grid EditGame1-quantity-grid">
                                {QUANTITY_OPTIONS.map((num) => {
                                    const pictogram = num <= 10 ? `/assets/numbers/${num}.png` : null;
                                    // Disable options greater than 10 if the range is 0-10
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
                                                // If the range is 0-10 and the quantity is greater than 10, adjust to 10
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