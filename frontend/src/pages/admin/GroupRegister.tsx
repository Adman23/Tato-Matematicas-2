// src/pages/GroupRegister.tsx

/**
 * Resumen Funcional.
 *
 * Pantalla para registrar un nuevo grupo. Permite introducir un alias, validar
 * su disponibilidad y enviar la petición de registro al backend.
 *
 * Flujo de ejecución.
 *
 * - El campo del nombre se valida localmente (mínimo 3 caracteres) y mediante
 *   una petición debounce a `authAPI.checkGroup` para comprobar disponibilidad.
 * - Al enviar, `handleSubmit` valida los datos, llama a la API y muestra un
 *   `IonToast` con el resultado. En caso de éxito, redirige a la confirmación.
 *
 * @param {void}
 * @returns {JSX.Element} Pantalla de registro de grupos.
 *
 * @example
 * ```tsx
 * <Route path="/group-register" component={GroupRegister} />
 * ```
 */

import './GroupRegister.css';

import {
    IonPage,
    IonInput,
    IonButton,
    IonIcon,
    IonToast,
} from '@ionic/react';
import {
    checkmarkOutline,
    closeOutline,

} from 'ionicons/icons';
import { useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { authAPI } from '../../lib/api';
import SimpleHeaderAdmin from './components/SimpleHeaderAdmin';
import { useAuth } from '../../contexts/AuthContext';


export default function GroupRegister() {
    const history = useHistory();
    const formCardRef = useRef<HTMLDivElement>(null);

    const [groupName, setGroupName] = useState('');

    const [isToastOpen, setIsToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastColor, setToastColor] = useState<'success' | 'danger'>('danger');

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
     * Resumen Funcional.
     *
     * Efecto que valida la disponibilidad del nombre del grupo con debounce.
     *
     * Flujo de ejecución.
     *
     * - Si el nombre es menor a 3 caracteres marca como no disponible localmente.
     * - Tras 400ms sin cambios llama a `authAPI.checkGroup(trimmed)` y actualiza
     *   `isGroupNameAvailable` solo si la respuesta corresponde al último
     *   `groupCheckIdRef` (evitar condiciones de carrera).
     *
     * @param {void}
     * @returns {void}
     *
     * @example
     * ```ts
     * // Ejecutado automáticamente al cambiar `groupName`
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

            await authAPI.register_group({
                alias: groupName
            });

            setToastMessage('Registro completado correctamente 🎉');
            setToastColor('success');
            setIsToastOpen(true);

            setTimeout(() => {
                history.push('/register/confirmation/grupos');
            }, 2000);
        } catch (err: any) {
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
     * Resumen Funcional.
     *
     * Maneja el envío del formulario de registro de grupo. Valida los campos,
     * llama a la API `authAPI.register_group` y muestra un toast con el
     * resultado. En caso de éxito redirige a la página de confirmación.
     *
     * Flujo de ejecución.
     *
     * - Previene el comportamiento por defecto del formulario.
     * - Comprueba la longitud y disponibilidad del nombre.
     * - Si hay errores muestra un `IonToast` con los mensajes correspondientes.
     * - Si todo es correcto hace la petición y redirige tras 2s.
     *
     * @param {React.FormEvent} e - Evento de envío del formulario.
     * @returns {Promise<void>} Promesa que se resuelve al completar la operación.
     *
     * @example
     * ```tsx
     * <form onSubmit={handleSubmit}>...</form>
     * ```
     */

    const handleCancel = () => {
        setGroupName('');
        history.replace('/admin-dashboard/groups-management');
    };

    /**
     * Resumen Funcional.
     *
     * Cancela el registro, limpia el formulario y vuelve a la gestión de grupos.
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
        </IonPage>
    );
}