/**
 * Edit Game 2: Order Sequence Configuration Page
 *
 * The student (or teacher editing for a student) configures the "Order Sequence" game settings,
 * including order direction, number of elements, range of numbers, and accessibility mode.
 *
 * Functional Summary:
 * - Load current game configuration on component mount.
 * - Display buttons to configure order, quantity, range, and accessibility mode.
 * - Open modals for each configuration option.
 * - Validate configuration (quantity cannot exceed available numbers in range).
 * - Save updated configuration to backend and navigate back to appropriate profile.
 * - For students: if teacher sets range to 0-10, hide range and mode options (locked configuration).
 *
 * @returns {JSX.Element} Game 2 configuration page with selection modals
 *
 * @example
 * // Usage in app router for students
 * <Route path="/student/edit-game2" component={EditGame2} />
 *
 * // Usage in app router for teachers editing student configuration
 * <Route path="/student-edit-game2/:id/:name" component={EditGame2} />
 */

import {
    IonPage,
    IonContent,
    useIonRouter,
    IonIcon,
    IonSpinner
} from '@ionic/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { gamesAPI, type GameConfig } from '../../lib/api';
import SimpleHeaderUser from './components/SimpleHeaderUser';
import SimpleHeaderEdit from '../teacherProfile/EditStudent/components/SimpleHeaderEdit';
import { Button3Dtext } from '../global_components/PushableButtons';
import LoadingSpinner from '../global_components/LoadingSpinner';
import './EditGame2.css';
import '../games/components/GameHeader.css';
import { arrowBack, accessibilityOutline } from 'ionicons/icons';
import { useParams } from "react-router-dom";

/**
 * Range options available for the game.
 * These correspond to the number ranges stored in the database.
 */
const RANGE_OPTIONS = [
  { value: '0-10', label: 'De 0 a 10' },
  { value: '0-20', label: 'De 0 a 20' },
  { value: '0-100', label: 'De 0 a 100' },
  { value: '0-1000', label: 'De 0 a 1000' }
];

/**
 * Quantity options available for the game.
 * Allowed range: from 3 to 12 elements to order.
 * Note: quantity cannot exceed the number of available numbers in the selected range.
 * For range 0-10, only quantities 3-10 are allowed (11 and 12 are disabled).
 */
const QUANTITY_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * Accessibility mode options for the game.
 * Different interaction methods to accommodate various user needs:
 * - drag_drop: Standard drag & drop + click and Enter key
 * - drag_follow: Click and the object follows the cursor
 * - hover_select: Selects by hovering over the target
 */
const ACCESSIBILITY_OPTIONS = [
    {
        value: 'drag_drop',
        label: 'Arrastrar o Click/Enter',
        description: 'Drag & drop y también click + Enter'
    },
    {
        value: 'drag_follow',
        label: 'Click y seguir',
        description: 'Click y el objeto sigue al cursor'
    },
    {
        value: 'hover_select',
        label: 'Permanece encima',
        description: 'Selecciona al permanecer encima'
    }
];

/**
 * Functional Summary:
 * Edit Game 2 (Order Sequence) configuration component.
 *
 * Lets users (students or teachers) customize the parameters of the "Order Sequence" game,
 * including the order direction, the number of elements to order, the range of numbers,
 * and the accessibility interaction mode.
 *
 * Execution Flow:
 * 1. On component mount, loads the current game configuration from the backend.
 * 2. Displays four main buttons to configure: Order, Quantity, Range, and Mode.
 * 3. When each button is pressed, a modal with available options opens.
 * 4. The user selects the desired options and validates them.
 * 5. Upon saving, the configuration is sent to the backend and the user is redirected.
 * 6. For students: if teacher sets range to 0-10, Range and Mode options are hidden.
 *
 * Teacher vs Student behavior:
 * - Teachers editing a student: can see and modify all options, uses student ID from URL
 * - Students: can modify all options unless teacher locked range to 0-10
 * - When range is 0-10 (set by teacher): students cannot see/modify Range and Mode options
 *
 * @returns {JSX.Element} Game 2 configuration page with selection modals
 *
 * @example
 * // Student editing their own configuration
 * <Route path="/student/edit-game2" component={EditGame2} />
 *
 * // Teacher editing student configuration
 * <Route path="/student-edit-game2/:id/:name" component={EditGame2} />
 */
export default function EditGame2() {
    const { user } = useAuth();
    const router = useIonRouter();
    const { id, name } = useParams<{ id?: string; name?: string }>();
    const { role } = useParams<{ role?: string }>();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Estados de configuración
  const [order, setOrder] = useState<'ascending' | 'descending'>('ascending');
  const [quantity, setQuantity] = useState<number>(5);
  const [numberRange, setNumberRange] = useState<string>('0-10');
    const [accessibilityMode, setAccessibilityMode] = useState<string>('drag_drop');

    // Estado para determinar si las opciones de rango y modo deben ocultarse para estudiantes
    // NUNCA se bloquea - el alumno siempre puede editar desde su perfil
    // Solo se bloquean las cantidades 11 y 12 cuando el rango es 0-10 (restricción lógica)
    const [isRangeAndModeLockedForStudent, setIsRangeAndModeLockedForStudent] = useState<boolean>(false);

  // Estados de modales
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
    const [showAccessibilityModal, setShowAccessibilityModal] = useState(false);

    // Estado de validación
    const [error, setError] = useState<string>('');

    // Ref para focus trapping
    const modalRef = useRef<HTMLDivElement>(null);

    /**
     * Focus trapping effect for modals.
     * Keeps Tab navigation inside the modal when it's open.
     * Allows closing modal with Escape key.
     *
     * Execution Flow:
     * 1. Identifies all focusable elements in the modal
     * 2. Sets focus to the first element when modal opens
     * 3. Traps Tab/Shift+Tab navigation within modal boundaries
     * 4. Listens for Escape key to close modal
     */
    useEffect(() => {
        const isAnyModalOpen = showQuantityModal || showRangeModal || showOrderModal || showAccessibilityModal;

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
    }, [showQuantityModal, showRangeModal, showOrderModal, showAccessibilityModal]);

    /**
     * Functional Summary:
     * Handle keyboard selection for modal options (accessibility feature).
     *
     * Execution Flow:
     * 1. Listens for Enter or Space key events
     * 2. Prevents default browser behavior
     * 3. Executes the provided action (selection callback)
     *
     * @param e - Keyboard event
     * @param action - Callback function to execute on selection
     *
     * @example
     * handleKeySelect(e, () => setQuantity(5));
     */
    const handleKeySelect = useCallback((e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action();
        }
    }, []);

    useEffect(() => {
        loadGameConfig();
    }, []);

  /**
   * Functional Summary:
   * Load the current game configuration from the backend and display it in the UI.
   *
   * Execution Flow:
   * 1. Checks if an authenticated user exists
   * 2. Determines target user ID (from URL for teachers, or current user for students)
   * 3. Calls the API to get the 'order_sequence' config for the target user
   * 4. Extracts values for order, quantity, range, and accessibility mode
   * 5. If student AND range 0-10 AND teacher was last modifier, lock range/mode
   * 6. Updates states and disables loading spinner
   *
   * Teacher behavior: Loads configuration for the student specified in URL params (id)
   * Student behavior: Loads own configuration, may be locked if teacher set 0-10
   *
   * @returns {Promise<void>} Promise that resolves when the configuration is loaded
   *
   * @example
   * await loadGameConfig();
   */
    const loadGameConfig = async () => {
        try {
            if (!user?.id) return;

            // Usar el id de la URL (del alumno) o el del usuario actual si no hay id en la URL
            const targetUserId = id || user.id;

            const data = await gamesAPI.getGameConfig(targetUserId, 'order_sequence');

            // Cargar valores actuales
            setOrder(data.settings?.order || 'ascending');
            setQuantity(data.settings?.quantity || 5);
            setNumberRange(data.number_range || '0-10');
            setAccessibilityMode(data.settings?.accessibility_mode || 'drag_drop');

            // Si es estudiante, rango 0-10 Y el tutor fue quien modificó, bloquear
            if (user?.role !== 'teacher' && data.number_range === '0-10' && data.last_modified_by === 'teacher') {
                setIsRangeAndModeLockedForStudent(true);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading game config:', error);
            setLoading(false);
        }
    };

  /**
   * Functional Summary:
   * Validates that the selected quantity is compatible with the number range.
   *
   * Execution Flow:
   * 1. Extracts min and max from the selected range (e.g., "0-10" -> min=0, max=10)
   * 2. Calculates the range size (available numbers)
   * 3. Verifies that quantity does not exceed the range size
   * 4. Verifies that quantity is between 3 and 12
   * 5. Sets error message if validation fails, clears it if validation passes
   *
   * @returns {boolean} - true if configuration is valid, false otherwise
   *
   * @example
   * // Range "0-10" has 11 numbers, quantity 12 would fail validation
   * if (validateInputs()) {
   *   // Proceed with saving
   * }
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
   * Functional Summary:
   * Saves the validated game configuration to the backend and navigates back.
   *
   * Execution Flow:
   * 1. Validates the configuration with `validateInputs()`
   * 2. Returns early if validation fails
   * 3. Determines target user ID (from URL for teachers, or current user for students)
   * 4. Constructs a GameConfig object with last_modified_by set appropriately
   * 5. Sends the configuration to the backend via the API
   * 6. Redirects based on user role
   *
   * Teacher behavior: Sets last_modified_by = 'teacher'
   * Student behavior: Sets last_modified_by = 'student'
   *
   * @returns {Promise<void>} Promise that resolves when the configuration is saved
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
            if (!user?.id || !id && !user?.id) return;

            // Usar el id de la URL (del alumno) para guardar la configuración
            const targetUserId = id || user.id;

            const config: GameConfig = {
                game_id: 0,
                game_key: 'order_sequence',
                user_id: targetUserId,
                number_range: numberRange,
                last_modified_by: user.role === 'teacher' ? 'teacher' : 'student',
                settings: {
                    order,
                    quantity,
                    accessibility_mode: accessibilityMode
        }
      };

            await gamesAPI.updateGameConfig(targetUserId, 'order_sequence', config);

            // Redirigir según el rol del usuario
            if (user.role === 'teacher') {
                router.push(`/student-edit-menu/${id}/${name}/${role}`, 'back', 'pop');
            } else {
                router.push('/student/profile', 'back');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            setError('Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

  /**
   * Functional Summary:
   * Closes all open selection modals.
   *
   * Execution Flow:
   * 1. Sets the state of all modals (quantity, range, order, accessibility) to `false`
   *
   * @returns {void}
   *
   * @example
   * closeAllModals(); // Closes any open modal
   */
    const closeAllModals = () => {
    setShowQuantityModal(false);
    setShowRangeModal(false);
    setShowOrderModal(false);
        setShowAccessibilityModal(false);
    };

  /**
   * Functional Summary:
   * Obtains the descriptive label of the currently selected number range.
   *
   * Execution Flow:
   * 1. Searches in RANGE_OPTIONS for the option that matches the current value of numberRange
   * 2. Returns the corresponding label or the range value if not found
   *
   * @returns {string} Descriptive label of the range (e.g., "De 0 a 10") or the range value if not found
   *
   * @example
   * // If numberRange === '0-10'
   * getSelectedRangeLabel(); // Returns "De 0 a 10"
   */
    const getSelectedRangeLabel = () => {
        return RANGE_OPTIONS.find(opt => opt.value === numberRange)?.label || numberRange;
    };

    /**
     * Functional Summary:
     * Calculates the size of the currently selected range (number of available numbers).
     *
     * @returns {number} Number of available numbers in the range
     *
     * @example
     * // If numberRange === '0-10'
     * getRangeSize(); // Returns 11 (numbers from 0 to 10 inclusive)
     */
    const getRangeSize = () => {
        const [min, max] = numberRange.split('-').map(Number);
        return max - min + 1;
    };

    /**
     * Functional Summary:
     * Obtains the descriptive label of the currently selected accessibility mode.
     *
     * @returns {string} Label of the accessibility mode or 'Accesibilidad' if not found
     *
     * @example
     * getAccessibilityLabel(); // Returns "Arrastrar o Click/Enter"
     */
    const getAccessibilityLabel = () => {
        return ACCESSIBILITY_OPTIONS.find(opt => opt.value === accessibilityMode)?.label || 'Accesibilidad';
    };

    /**
     * Functional Summary:
     * Determines if a quantity option should be disabled based on the current range.
     *
     * @param {number} num - The quantity to check
     * @returns {boolean} True if the quantity exceeds the range size, false otherwise
     *
     * @example
     * // If range is '0-10' (11 numbers available)
     * isQuantityDisabled(12); // Returns true
     * isQuantityDisabled(10); // Returns false
     */
    const isQuantityDisabled = (num: number) => num > getRangeSize();

    // Show spinner while loading
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
            {/* Cabecera para edición por profesor */}
            {id && name ? (
            <SimpleHeaderEdit
                studentName={name}
                Editing={"Editar Juego 2"}
                onHome={() => router.push(`/student-edit-menu/${id}/${name}/${role}`, 'back', 'pop')}
            />
            ) : (
            <SimpleHeaderUser
                title="JUEGO 2"
                title_image="/assets/pictograms/editar.png"
                userName={user?.username || "username"}
                photoUrl={user?.photo_url} hidden={true}
            />
            )}


            <IonContent className="EditGame2-content" fullscreen scrollY={false}>
                <div className="EditGame2-wrapper">
                    {/* Back button - navigates to student edit menu (teacher) or student profile (student) */}
                    <div className="EditGame2-back-button">
                        <Button3Dtext
                            onClick={() => {
                                if (user?.role === 'teacher') {
                                    router.push(`/student-edit-menu/${id}/${name}`, 'back', 'pop');
                                } else {
                                    router.push('/student/profile', 'back', 'pop');
                                }
                            }}
                            aria-label="Volver atrás">
                            <IonIcon icon={arrowBack} aria-hidden="true" />
                        </Button3Dtext>
                    </div>

                    {/* Main configuration buttons (Quantity, Range, Order, Mode) */}
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
                                tabIndex={0}
                                aria-label="Configurar cantidad de números"
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

                        {/* Solo mostrar la opción de rango si el estudiante tiene permitido modificarla */}
                        {/* Si el tutor estableció el rango a 0-10, esta opción se oculta para los estudiantes */}
                        {!isRangeAndModeLockedForStudent && (
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
                                    tabIndex={0}
                                    aria-label="Configurar rango de números"
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
                        )}

                        <div className="EditGame2-buttons-result">
                            {/* Orden elegido */}
                            <div className="EditGame2-config-button-value">
                                <img
                                    src={order === 'ascending' ? "/assets/editarJuegos/botón arriba.png" : "/assets/editarJuegos/botón abajo.png"}
                                    alt={order === 'ascending' ? 'Ascendente' : 'Descendente'}
                                    className="EditGame2-config-button-image"
                                />
                               
                            </div>
                            {/* Botón Orden */}
                            <Button3Dtext
                                className="EditGame2-config-button-3d"
                                onClick={() => { setShowOrderModal(true); setError(''); }}
                                tabIndex={0}
                                aria-label="Configurar orden de números"
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

                        {/* Solo mostrar la opción de modo de accesibilidad si el estudiante tiene permitido modificarla */}
                        {/* Si el tutor estableció el rango a 0-10, esta opción se oculta para los estudiantes */}
                        {!isRangeAndModeLockedForStudent && (
                            <div className="EditGame2-buttons-result">
                                {/* Accesibilidad elegida */}
                                <div className="EditGame2-config-button-value">
                                    <span className="EditGame2-accessibility-text">{getAccessibilityLabel()}</span>
                                </div>
                                {/* Botón Accesibilidad */}
                                <Button3Dtext
                                    className="EditGame2-config-button-3d"
                                    onClick={() => { setShowAccessibilityModal(true); setError(''); }}
                                    aria-label="Configurar modo de accesibilidad"
                                >
                                    <div className="EditGame2-config-button-content">
                                        <IonIcon icon={accessibilityOutline} className="EditGame2-accessibility-icon" aria-hidden="true" />
                                        <span className="btn-text">MODO</span>
                                    </div>
                                </Button3Dtext>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="EditGame2-error-message">
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Botón Guardar cambios */}
                    <div className="EditGame2-save-button">
                        <Button3Dtext onClick={handleSave} disabled={saving} tabIndex={0} aria-label="Guardar configuración">
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
                        <div
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                            ref={modalRef}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Seleccionar cantidad"
                        >
                            <button
                                className="modal-close-btn"
                                onClick={closeAllModals}
                                aria-label="Cerrar selección de cantidad"
                            >✕</button>
                            <div className="modal-options-grid quantity-grid">
                                {QUANTITY_OPTIONS.map((num) => {
                                    const pictogram = num <= 10 ? `/assets/numbers/${num}.png` : null;
                                    const isDisabled = isQuantityDisabled(num);
                                    return (
                                        <div
                                            key={num}
                                            className={`modal-option ${quantity === num ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                            tabIndex={isDisabled ? -1 : 0}
                                            role="button"
                                            aria-pressed={quantity === num}
                                            aria-disabled={isDisabled}
                                            aria-label={`Seleccionar cantidad ${num}`}
                                            onClick={() => {
                                                if (!isDisabled) {
                                                    setQuantity(num);
                                                    setError('');
                                                    closeAllModals();
                                                }
                                            }}
                                            onKeyDown={(e) => handleKeySelect(e, () => {
                                                if (!isDisabled) {
                                                    setQuantity(num);
                                                    setError('');
                                                    closeAllModals();
                                                }
                                            })}
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
                        <div
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                            ref={modalRef}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Seleccionar rango"
                        >
                            <button
                                className="modal-close-btn"
                                onClick={closeAllModals}
                                aria-label="Cerrar selección de rango"
                            >✕</button>
                            <div className="modal-options-grid range-grid">
                                {RANGE_OPTIONS.map((option) => (
                                    <div
                                        key={option.value}
                                        className={`modal-option large ${numberRange === option.value ? 'selected' : ''}`}
                                        tabIndex={0}
                                        role="button"
                                        aria-pressed={numberRange === option.value}
                                        aria-label={`Seleccionar rango ${option.label}`}
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
                                        onKeyDown={(e) => handleKeySelect(e, () => {
                                            setNumberRange(option.value);
                                            const [minRange, maxRange] = option.value.split('-').map(Number);
                                            const maxQuantity = maxRange - minRange + 1;
                                            if (quantity > maxQuantity) {
                                                setQuantity(Math.min(quantity, maxQuantity));
                                            }
                                            setError('');
                                            closeAllModals();
                                        })}
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
                        <div
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                            ref={modalRef}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Seleccionar orden"
                        >
                            <button
                                className="modal-close-btn"
                                onClick={closeAllModals}
                                aria-label="Cerrar selección de orden"
                            >✕</button>
                            <div className="modal-options-grid order-grid">
                                <div
                                    className={`modal-option large ${order === 'ascending' ? 'selected' : ''}`}
                                    tabIndex={0}
                                    role="button"
                                    aria-pressed={order === 'ascending'}
                                    aria-label="Seleccionar orden ascendente"
                                    onClick={() => {
                                        setOrder('ascending');
                                        closeAllModals();
                                    }}
                                    onKeyDown={(e) => handleKeySelect(e, () => {
                                        setOrder('ascending');
                                        closeAllModals();
                                    })}
                                >
                                    <div className="order-content">
                                        <div className="order-arrow-large">↑</div>
                                        <span className="order-label-large">Ascendente</span>
                                        <span className="order-sublabel">Menor a Mayor</span>
                                    </div>
                                </div>
                                <div
                                    className={`modal-option large ${order === 'descending' ? 'selected' : ''}`}
                                    tabIndex={0}
                                    role="button"
                                    aria-pressed={order === 'descending'}
                                    aria-label="Seleccionar orden descendente"
                                    onClick={() => {
                                        setOrder('descending');
                                        closeAllModals();
                                    }}
                                    onKeyDown={(e) => handleKeySelect(e, () => {
                                        setOrder('descending');
                                        closeAllModals();
                                    })}
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

                {/* MODAL: Accesibilidad */}
                {showAccessibilityModal && (
                    <div className="modal-overlay" onClick={closeAllModals}>
                        <div
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                            ref={modalRef}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Seleccionar modo de accesibilidad"
                        >
                            <button
                                className="modal-close-btn"
                                onClick={closeAllModals}
                                aria-label="Cerrar selección de modo de accesibilidad"
                            >✕</button>
                            <div className="modal-options-grid accessibility-grid">
                                {ACCESSIBILITY_OPTIONS.map((option) => (
                                    <div
                                        key={option.value}
                                        className={`modal-option large ${accessibilityMode === option.value ? 'selected' : ''}`}
                                        tabIndex={0}
                                        role="button"
                                        aria-pressed={accessibilityMode === option.value}
                                        aria-label={`Seleccionar modo ${option.label}`}
                                        onClick={() => {
                                            setAccessibilityMode(option.value);
                                            closeAllModals();
                                        }}
                                        onKeyDown={(e) => handleKeySelect(e, () => {
                                            setAccessibilityMode(option.value);
                                            closeAllModals();
                                        })}
                                    >
                                        <div className="order-content">
                                            <span className="order-label-large">{option.label}</span>
                                            <span className="order-sublabel">{option.description}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
}
