// src/pages/GroupRegister.tsx

/**
 * Functional Summary.
 *
 * Screen to register a new group. Allows entering an alias, validating
 * its availability, and sending the registration request to the backend.
 *
 * Execution flow.
 *
 * - The name field is validated locally (minimum 3 characters) and through
 *   a debounce request to `authAPI.checkGroup` to check availability.
 * - On submit, `handleSubmit` validates the data, calls the API, and shows an
 *   `IonToast` with the result. On success, it redirects to the confirmation.
 *
 * @param {void}
 * @returns {JSX.Element} Group registration screen.
 *
 * @example
 * ```tsx
 * <Route path="/admin/group/register" component={GroupRegister} />
 * ```
 */

import './GroupRegister.css';

import {
    IonPage,
    IonInput,
    IonButton,
    IonIcon,
    IonToast,
    useIonRouter,
} from '@ionic/react';
import {
    checkmarkOutline,
    closeOutline,

} from 'ionicons/icons';
import { useState, useRef, useEffect } from 'react';
import { authAPI } from '../../lib/api';
import SimpleHeaderAdmin from './components/SimpleHeaderAdmin';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmationModal from '../global_components/ConfirmationModal';


export default function GroupRegister() {
    const router = useIonRouter();
    const formCardRef = useRef<HTMLDivElement>(null);

    const [groupName, setGroupName] = useState('');

    const [isToastOpen, setIsToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastColor, setToastColor] = useState<'success' | 'danger'>('danger');
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [isGroupNameAvailable, setIsGroupNameAvailable] = useState<boolean | null>(null);
    const groupCheckIdRef = useRef(0);

    const { user } = useAuth();

    const isGroupNameLong = groupName.trim().length >= 3;

    useEffect(() => {
        const trimmed = groupName.trim();

        if (trimmed.length < 3) {
            setIsGroupNameAvailable(false);
            return;
        }

        const currentId = ++groupCheckIdRef.current;

        const handler = setTimeout(() => {
            authAPI.checkGroup(trimmed)
                .then(res => {
                    if (currentId === groupCheckIdRef.current) {
                        setIsGroupNameAvailable(!res.exists);
                    }
                })
                .catch(() => {
                    if (currentId === groupCheckIdRef.current) {
                        setIsGroupNameAvailable(false);
                    }
                });
        }, 400);

        return () => clearTimeout(handler);
    }, [groupName]);

    /**
     * Functional Summary.
     *
     * Effect that validates the availability of the group name with debounce.
     *
     * Execution flow.
     *
     * - If the name is less than 3 characters, it marks as unavailable locally.
     * - After 400ms without changes, it calls `authAPI.checkGroup(trimmed)` and updates
     *   `isGroupNameAvailable` only if the response corresponds to the last
     *   `groupCheckIdRef` (to avoid race conditions).
     *
     * @param {void}
     * @returns {void}
     *
     * @example
     * ```ts
     * // Automatically executed when `groupName` changes
     * ```
     */

    const canSubmit =
        isGroupNameLong &&
        isGroupNameAvailable === true;


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let errorMsg = '';
        if (!isGroupNameLong) errorMsg += 'El nombre del grupo debe tener al menos 3 caracteres. ';
        if (isGroupNameAvailable === false) errorMsg += 'El nombre del grupo ya está en uso. ';

        if (errorMsg) {
            setToastMessage(errorMsg);
            setToastColor('danger');
            setIsToastOpen(true);
            return;
        }

        try {
            setIsLoading(true);

            await authAPI.register_group({
                alias: groupName
            });

            setIsLoading(false);
            setShowConfirmationModal(true);
        } catch (err: any) {
            setIsLoading(false);
            console.error('Error en el registro:', err);
            const message =
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                'Error al registrar grupo';
            setToastMessage(message);
            setToastColor('danger');
            setIsToastOpen(true);
        }
    };

    /**
     * Functional summary.
     *
     * Handles the submission of the group registration form. Validates the fields,
     * calls the `authAPI.register_group` API, and shows a toast with the
     * result. On success, it redirects to the confirmation page.
     *
     * Execution flow.
     *
     * - Prevents the default form behavior.
     * - Checks the length and availability of the name.
     * - If there are errors, it shows an `IonToast` with the corresponding messages.
     * - If everything is correct, it makes the request and redirects after 2s.
     *
     * @param {React.FormEvent} e - Form submission event.
     * @returns {Promise<void>} Promise that resolves upon completion of the operation.
     *
     * @example
     * ```tsx
     * <form onSubmit={handleSubmit}>...</form>
     * ```
     */

    const handleCancel = () => {
        setGroupName('');
        router.push('/admin/dashboard/groups-management',"back","pop");
    };

    /**
     * Functional summary.
     *
     * Cancels the registration, clears the form, and returns to group management.
     *
     * @param {void}
     * @returns {void}
     *
     * @example
     * ```ts
     * handleCancel();
     * ```
     */

    return (
        <IonPage>
            {user && user.role === 'admin' && (
                <SimpleHeaderAdmin adminName={user.username} />
            )}
            {!showConfirmationModal && !isLoading && (
            <div className="group-register-main-container">
                <div className="group-register-form-card" ref={formCardRef}>
                    <div className="group-register-form-container-header">
                        <h2>Registro</h2>
                        <p>Rellene los siguientes campos, por favor</p>
                    </div>


                    <div className="group-register-form-container">

                        <div className="group-register-field-wrapper">
                            <div className="group-register-field-label">Nombre del grupo *</div>
                            <div className="group-register-input-with-icon">
                                <IonInput
                                    placeholder="Escribir aquí..."
                                    value={groupName}
                                    onIonInput={(e) => setGroupName(e.detail.value || '')}
                                    className="group-register-input-item"
                                />
                                <IonIcon icon={
                                    groupName.trim().length === 0 ? closeOutline :
                                        !isGroupNameLong ? closeOutline :
                                            isGroupNameAvailable === true ? checkmarkOutline : closeOutline
                                } />
                            </div>
                        </div>

                        <div className="group-register-buttons">
                            <IonButton
                                expand="block"
                                className={`group-register-confirm-button ${!canSubmit ? 'group-register-confirm-button--disabled' : ''
                                    }`}
                                onClick={handleSubmit}
                            >
                                Confirmar
                            </IonButton>
                            <IonButton expand="block" className="group-register-cancel-button" onClick={handleCancel}>
                                Cancelar
                            </IonButton>
                        </div>
                    </div>
                </div>

                <IonToast
                    isOpen={isToastOpen}
                    message={toastMessage}
                    color={toastColor}
                    duration={3000}
                    onDidDismiss={() => setIsToastOpen(false)}
                    className="group-register-toast"
                />
            </div>
            )}

            {(showConfirmationModal || isLoading) && (
                <ConfirmationModal
                    title="Grupo registrado"
                    message="Grupo registrado con éxito."
                    redirectPath="/admin/dashboard/groups-management"
                    isLoading={isLoading}
                    loadingMessage="Registrando grupo..."
                />
            )}
        </IonPage>
    );
}