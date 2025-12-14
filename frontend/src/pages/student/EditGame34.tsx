/**
 * Edit Game 3/4: Configuration for Distribute & Remove Equal
 * * CORRECCIÓN FINAL:
 * - Los datos (container_count, etc.) se guardan DENTRO del JSON 'settings'.
 * - No se usan columnas extra en la BD.
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
import { gamesAPI } from '../../lib/api';
import SimpleHeaderUser from '../student/components/SimpleHeaderUser';
import { Button3Dtext } from '../global_components/PushableButtons';
import LoadingSpinner from '../global_components/LoadingSpinner';
import './EditGame34.css';
import { arrowBack } from 'ionicons/icons';
import { useParams } from "react-router-dom";

// --- Constantes y Opciones ---

const RANGE_OPTIONS = [
    { value: '0-10', label: 'De 0 a 10' },
    { value: '0-20', label: 'De 0 a 20' },
    { value: '0-100', label: 'De 0 a 100' },
    { value: '0-1000', label: 'De 0 a 1000' }
];

const CONTAINER_OPTIONS = [2, 3, 4, 5];

const MODE_OPTIONS = [
    { value: 'drag_click', label: 'Arrastrar o Click/Enter', description: 'Drag & drop y también click + Enter' },
    { value: 'click_follow', label: 'Click y seguir', description: 'Click y el objeto sigue al cursor' },
    { value: 'hover', label: 'Permanece encima', description: 'Selecciona al permanecer encima' }
];

const GAME_KEY_3 = 'distribute_equal';
const GAME_KEY_4 = 'remove_equal';

export default function EditGame34() {
    const { user } = useAuth();
    const router = useIonRouter();
    const { id, name } = useParams<{ id: string; name: string }>();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // --- Estados de Configuración ---
    const [containerCount, setContainerCount] = useState<number>(2);
    const [showNumbers, setShowNumbers] = useState<boolean>(false);
    const [numberRange, setNumberRange] = useState<string>('0-10');
    const [accessibilityMode, setAccessibilityMode] = useState<string>('drag_click');

    const [isRangeLockedForStudent, setIsRangeLockedForStudent] = useState<boolean>(false);

    // --- Estados de Modales ---
    const [showContainerModal, setShowContainerModal] = useState(false);
    const [showNumbersModal, setShowNumbersModal] = useState(false);
    const [showRangeModal, setShowRangeModal] = useState(false);
    const [showModeModal, setShowModeModal] = useState(false);

    const [error, setError] = useState<string>('');
    const modalRef = useRef<HTMLDivElement>(null);

    // --- Focus Trap ---
    useEffect(() => {
        const isAnyModalOpen = showContainerModal || showNumbersModal || showRangeModal || showModeModal;
        if (!isAnyModalOpen || !modalRef.current) return;
        const modal = modalRef.current;
        const focusableElements = modal.querySelectorAll<HTMLElement>('button, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        setTimeout(() => firstElement?.focus(), 0);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { closeAllModals(); return; }
            if (e.key !== 'Tab') return;
            if (e.shiftKey) {
                if (document.activeElement === firstElement) { e.preventDefault(); lastElement?.focus(); }
            } else {
                if (document.activeElement === lastElement) { e.preventDefault(); firstElement?.focus(); }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showContainerModal, showNumbersModal, showRangeModal, showModeModal]);

    const handleKeySelect = useCallback((e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action(); }
    }, []);

    // --- Carga de Configuración ---
    useEffect(() => {
        loadGameConfig();
    }, []);

    const loadGameConfig = async () => {
        try {
            const targetId = id || user?.id;
            if (!targetId) { setLoading(false); return; }

            const data: any = await gamesAPI.getGameConfig(targetId, GAME_KEY_3);

            if (data) {
                setNumberRange(data.number_range || '0-10');

                // CAMBIO: Leemos TODO desde 'settings'
                const settings = data.settings || {};
                setContainerCount(settings.container_count ?? 2);
                setShowNumbers(settings.requires_operations ?? false);
                setAccessibilityMode(settings.accessibility_mode || 'drag_click');

                // Si es estudiante, rango 0-10 Y el tutor fue quien modificó, bloquear
                if (user?.role !== 'teacher' && data.number_range === '0-10' && data.last_modified_by === 'teacher') {
                    setIsRangeLockedForStudent(true);
                }
            }
            setLoading(false);

        } catch (error: any) {
            // Si 404, usamos defaults
            if (error.response && error.response.status === 404) {
                console.log('No existe configuración previa, usando valores por defecto.');
                setLoading(false);
            } else {
                console.error('Error loading game config:', error);
                setError('Error al cargar la configuración');
                setLoading(false);
            }
        }
    };

    // --- Guardado ---
    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const targetId = id || user?.id;
            if (!targetId) return;

            // CAMBIO: Metemos todo dentro de 'settings'
            const settingsJson = {
                accessibility_mode: accessibilityMode,
                container_count: containerCount,
                requires_operations: showNumbers,
                object_count: 8
            };

            const commonConfig = {
                user_id: targetId,
                number_range: numberRange,
                settings: settingsJson // <--- Todo el paquete aquí
            };

            // Guardamos para Juego 3
            const saveGame3 = gamesAPI.updateGameConfig(targetId, GAME_KEY_3, {
                ...commonConfig,
                game_key: GAME_KEY_3,
                game_id: 0
            } as any);

            // Guardamos para Juego 4
            const saveGame4 = gamesAPI.updateGameConfig(targetId, GAME_KEY_4, {
                ...commonConfig,
                game_key: GAME_KEY_4,
                game_id: 0
            } as any);

            await Promise.all([saveGame3, saveGame4]);

            if (user?.role === 'teacher' && id && name) {
                router.push(`/student-edit-menu/${id}/${name}`, 'back', 'pop');
            } else {
                router.push('/student/profile', 'back', 'pop');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            setError('Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    const closeAllModals = () => {
        setShowContainerModal(false);
        setShowNumbersModal(false);
        setShowRangeModal(false);
        setShowModeModal(false);
    };

    const getSelectedRangeLabel = () => RANGE_OPTIONS.find(opt => opt.value === numberRange)?.label || numberRange;
    const getModeLabel = () => MODE_OPTIONS.find(opt => opt.value === accessibilityMode)?.label || 'Modo';

    if (loading) {
        return (
            <IonPage>
                <IonContent className="ion-padding ion-text-center">
                    <LoadingSpinner message="Cargando configuración..." />
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage className="EditGame34-page">
            <SimpleHeaderUser
                userName={user?.username || "username"}
                photoUrl={user?.photo_url}
                hidden={true}
                title={"JUEGO 3 & 4"}
                title_image="/assets/pictograms/editar.png"
            />

            <IonContent className="EditGame34-content" fullscreen scrollY={false}>
                <div className="EditGame34-wrapper">
                    <div className="EditGame34-back-button">
                        <Button3Dtext
                            onClick={() => {
                                if (user?.role === 'teacher' && id && name) {
                                    router.push(`/student-edit-menu/${id}/${name}`, 'back', 'pop');
                                } else {
                                    router.push('/student/profile', 'back', 'pop');
                                }
                            }}
                            aria-label="Volver atrás">
                            <IonIcon icon={arrowBack} aria-hidden="true" />
                        </Button3Dtext>
                    </div>

                    <div className="EditGame34-config-buttons">
                        {/* 1. CONTENEDORES */}
                        <div className="EditGame34-buttons-result">
                            <div className="EditGame34-config-button-value">
                                <span className="EditGame34-display-number">{containerCount}</span>
                            </div>
                            <Button3Dtext
                                className="EditGame34-config-button-3d"
                                onClick={() => { setShowContainerModal(true); setError(''); }}
                                tabIndex={0}
                                aria-label="Configurar contenedores">
                                <div className="EditGame34-config-button-content">
                                    <img src="/assets/pictograms/caja.png" alt="Contenedores" className="EditGame34-config-button-image" />
                                    <span className="btn-text">CAJAS</span>
                                </div>
                            </Button3Dtext>
                        </div>

                        {/* 2. NÚMEROS */}
                        <div className="EditGame34-buttons-result">
                            <div className="EditGame34-config-button-value">
                                <div className={`EditGame34-preview-circle ${showNumbers ? 'with-number' : ''}`}>
                                    {showNumbers && <span>2</span>}
                                </div>
                            </div>
                            <Button3Dtext
                                className="EditGame34-config-button-3d"
                                onClick={() => { setShowNumbersModal(true); setError(''); }}
                                tabIndex={0}
                                aria-label="Configurar números">
                                <div className="EditGame34-config-button-content">
                                    <img src="/assets/pictograms/undefined.png" alt="Números" className="EditGame34-config-button-image" />
                                    <span className="btn-text">NÚMEROS</span>
                                </div>
                            </Button3Dtext>
                        </div>

                        {/* 3. RANGO */}
                        {!isRangeLockedForStudent && (
                            <div className="EditGame34-buttons-result">
                                <div className="EditGame34-config-button-value">
                                    <div className="EditGame34-range-display">
                                        <span className="EditGame34-display-text">{getSelectedRangeLabel()}</span>
                                    </div>
                                </div>
                                <Button3Dtext
                                    className="EditGame34-config-button-3d"
                                    onClick={() => { setShowRangeModal(true); setError(''); }}
                                    tabIndex={0}
                                    aria-label="Configurar rango">
                                    <div className="EditGame34-config-button-content">
                                        <img src="/assets/pictograms/rango.png" alt="Rango" className="EditGame34-config-button-image" />
                                        <span className="btn-text">RANGO</span>
                                    </div>
                                </Button3Dtext>
                            </div>
                        )}

                        {/* 4. MODO */}
                        {!isRangeLockedForStudent && (
                            <div className="EditGame34-buttons-result">
                                <div className="EditGame34-config-button-value">
                                    <span className="EditGame34-display-text-small">{getModeLabel()}</span>
                                </div>
                                <Button3Dtext
                                    className="EditGame34-config-button-3d"
                                    onClick={() => { setShowModeModal(true); setError(''); }}
                                    tabIndex={0}
                                    aria-label="Configurar modo">
                                    <div className="EditGame34-config-button-content">
                                        <img src="/assets/pictograms/accesibilidad.png" alt="Modo" className="EditGame34-config-button-image" />
                                        <span className="btn-text">MODO</span>
                                    </div>
                                </Button3Dtext>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="EditGame34-error-message">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="EditGame34-save-button">
                        <Button3Dtext onClick={handleSave} disabled={saving} tabIndex={0} aria-label="Guardar">
                            {saving ? <IonSpinner name="crescent" /> : (
                                <>
                                    <img src="/assets/pictograms/correctoS.png" alt="" className="EditGame34-config-button-image" />
                                    <span className="btn-text">GUARDAR</span>
                                </>
                            )}
                        </Button3Dtext>
                    </div>
                </div>

                {/* MODALS */}
                {showContainerModal && (
                    <div className="EditGame34-modal-overlay" onClick={closeAllModals}>
                        <div className="EditGame34-modal-content" onClick={e => e.stopPropagation()} ref={modalRef} role="dialog" aria-modal="true">
                            <button className="EditGame34-modal-close-btn" onClick={closeAllModals}>✕</button>
                            <div className="EditGame34-options-grid-2col">
                                {CONTAINER_OPTIONS.map(num => (
                                    <div key={num} className={`EditGame34-modal-option ${containerCount === num ? 'selected' : ''}`} tabIndex={0} role="button" onClick={() => { setContainerCount(num); closeAllModals(); }} onKeyDown={(e) => handleKeySelect(e, () => { setContainerCount(num); closeAllModals(); })}>
                                        <div className="EditGame34-option-content">
                                            <img src={`/assets/numbers/${num}.png`} alt={`${num} dedos`} className="EditGame34-hand-img" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {showNumbersModal && (
                    <div className="EditGame34-modal-overlay" onClick={closeAllModals}>
                        <div className="EditGame34-modal-content" onClick={e => e.stopPropagation()} ref={modalRef} role="dialog" aria-modal="true">
                            <button className="EditGame34-modal-close-btn" onClick={closeAllModals}>✕</button>
                            <div className="EditGame34-options-grid-2col">
                                <div className={`EditGame34-modal-option large ${!showNumbers ? 'selected' : ''}`} tabIndex={0} role="button" onClick={() => { setShowNumbers(false); closeAllModals(); }} onKeyDown={(e) => handleKeySelect(e, () => { setShowNumbers(false); closeAllModals(); })}>
                                    <div className="EditGame34-option-content">
                                        <div className="EditGame34-preview-circle large"></div>
                                        <span className="EditGame34-label-large">Sin números</span>
                                    </div>
                                </div>
                                <div className={`EditGame34-modal-option large ${showNumbers ? 'selected' : ''}`} tabIndex={0} role="button" onClick={() => { setShowNumbers(true); closeAllModals(); }} onKeyDown={(e) => handleKeySelect(e, () => { setShowNumbers(true); closeAllModals(); })}>
                                    <div className="EditGame34-option-content">
                                        <div className="EditGame34-preview-circle large with-number"><span>2</span></div>
                                        <span className="EditGame34-label-large">Con números</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showRangeModal && (
                    <div className="EditGame34-modal-overlay" onClick={closeAllModals}>
                        <div className="EditGame34-modal-content" onClick={e => e.stopPropagation()} ref={modalRef} role="dialog" aria-modal="true">
                            <button className="EditGame34-modal-close-btn" onClick={closeAllModals}>✕</button>
                            <div className="EditGame34-options-grid-2col">
                                {RANGE_OPTIONS.map(opt => (
                                    <div key={opt.value} className={`EditGame34-modal-option large ${numberRange === opt.value ? 'selected' : ''}`} tabIndex={0} role="button" onClick={() => { setNumberRange(opt.value); closeAllModals(); }} onKeyDown={(e) => handleKeySelect(e, () => { setNumberRange(opt.value); closeAllModals(); })}>
                                        <span className="EditGame34-label-medium">{opt.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {showModeModal && (
                    <div className="EditGame34-modal-overlay" onClick={closeAllModals}>
                        <div className="EditGame34-modal-content wide" onClick={e => e.stopPropagation()} ref={modalRef} role="dialog" aria-modal="true">
                            <button className="EditGame34-modal-close-btn" onClick={closeAllModals}>✕</button>
                            <div className="EditGame34-options-grid-3col">
                                {MODE_OPTIONS.map(opt => (
                                    <div key={opt.value} className={`EditGame34-modal-option large ${accessibilityMode === opt.value ? 'selected' : ''}`} tabIndex={0} role="button" onClick={() => { setAccessibilityMode(opt.value); closeAllModals(); }} onKeyDown={(e) => handleKeySelect(e, () => { setAccessibilityMode(opt.value); closeAllModals(); })}>
                                        <div className="EditGame34-option-content">
                                            <span className="EditGame34-label-large">{opt.label}</span>
                                            <span className="EditGame34-label-sub">{opt.description}</span>
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