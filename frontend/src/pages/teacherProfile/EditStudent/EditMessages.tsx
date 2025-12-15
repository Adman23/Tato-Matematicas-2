import {
    IonContent,
    IonList,
    IonPage,
    IonInput,
    IonButton,
    IonIcon,
    useIonRouter,
    IonToast

} from '@ionic/react';
import { add } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import './EditMessages.css';
import SimpleHeaderEdit from './components/SimpleHeaderEdit';
import { useAuth } from '../../../contexts/AuthContext';
import { Redirect, useParams } from 'react-router-dom';
import MessageItem from './components/MessageItem';
import type { StudentMessage } from '../../../lib/api';
import { userAPI, studentMessageAPI } from '../../../lib/api';
import LoadingSpinner from '../../global_components/LoadingSpinner';

export default function EditMessages() {
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const { name } = useParams<{ name: string }>();
    const router = useIonRouter();

    const [messagesPositive, setMessagesPositive] = useState<StudentMessage[]>([]);
    const [messagesReinforcement, setMessagesReinforcement] = useState<StudentMessage[]>([]);
    const [newPositiveMessage, setNewPositiveMessage] = useState<string>('');
    const [newReinforcementMessage, setNewReinforcementMessage] = useState<string>('');
    const [loadingMessages, setLoadingMessages] = useState<boolean>(true);
    const [isAddingMessage, setIsAddingMessage] = useState<boolean>(false);
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');
    const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

    /**
     * Normaliza un texto para comparación: quita tildes, mayúsculas y signos de puntuación
     */
    const normalizeTextForComparison = (text: string): string => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Quita tildes
            .replace(/[¡!¿?.,;:'"()]/g, '')  // Quita signos de puntuación
            .trim();
    };

    /**
     * Comprueba si un mensaje ya existe en la lista (ignorando mayúsculas, tildes y puntuación)
     */
    const messageExists = (newMessage: string, existingMessages: StudentMessage[]): boolean => {
        const normalizedNew = normalizeTextForComparison(newMessage);
        return existingMessages.some(msg =>
            normalizeTextForComparison(msg.text_message) === normalizedNew
        );
    };

    /**
     * Normaliza los mensajes crudos del backend a StudentMessage[]
     */
    const normalizeMessages = (raw: any[]): StudentMessage[] => {
        if (!raw || !Array.isArray(raw)) return [];

        return raw.map((r: any) => {
            if (!r) return null;

            // El row puede ser { messages: {...} } o el objeto mensaje directamente
            const m = r.messages ? r.messages : r;
            if (!m) return null;

            const msgId = m.id !== undefined && m.id !== null ? String(m.id) : undefined;
            const type = m.type || 'unknown';
            const text_message = m.text_message || '';
            const icon_url = m.icon_url ?? null;
            const sound_url = m.sound_url ?? null;

            return {
                id: msgId,
                type,
                text_message,
                icon_url,
                sound_url,
            } as StudentMessage;
        }).filter(Boolean) as StudentMessage[];
    };

    const loadMessages = async () => {
        try {
            if (!id) return;

            // Obtener los datos del estudiante que se está editando (no del usuario logueado)
            const studentData = await userAPI.fetchUserData(id);
            console.log('Loaded student data:', studentData);

            const rawMessages = studentData?.reinforcement_messages || [];
            const allMessages = normalizeMessages(rawMessages);
            console.log('Normalized messages:', allMessages);

            // Separar mensajes por tipo
            const positive = allMessages.filter(msg => msg.type === 'positive');
            const reinforcement = allMessages.filter(msg => msg.type === 'reinforcement');

            setMessagesPositive(positive);
            setMessagesReinforcement(reinforcement);
            setLoadingMessages(false);

        } catch (error) {
            console.error('Error loading messages:', error);
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        loadMessages();
    }, [id]); // Depende del id del estudiante


    const handleAddPositiveMessage = async () => {
        if (!newPositiveMessage.trim()) {
            setToastMessage('El mensaje no puede estar vacío');
            setToastColor('danger');
            setShowToast(true);
            return;
        }

        if (!id || isAddingMessage) {
            return;
        }

        // Verificar si el mensaje ya existe (ignorando mayúsculas, tildes y puntuación)
        if (messageExists(newPositiveMessage, messagesPositive)) {
            setToastMessage('Este mensaje ya existe (o es similar a uno existente)');
            setToastColor('danger');
            setShowToast(true);
            setNewPositiveMessage('');
            return;
        }

        setIsAddingMessage(true);
        try {
            const response = await studentMessageAPI.addMessage(id, {
                text_message: newPositiveMessage.trim(),
                type: 'positive'
            });

            const newMessage: StudentMessage = {
                id: response.message_id,
                type: 'positive',
                text_message: newPositiveMessage.trim(),
            };
            setMessagesPositive([...messagesPositive, newMessage]);
            setToastMessage('¡Mensaje añadido correctamente!');
            setToastColor('success');
            setShowToast(true);
            setNewPositiveMessage('');
        } catch (error: any) {
            console.error('Error adding positive message:', error);
            // Si el mensaje ya está asignado al estudiante (409 Conflict)
            if (error.response?.status === 409) {
                setToastMessage('Este mensaje ya está asignado a este estudiante');
                setNewPositiveMessage('');
            } else {
                setToastMessage('Error al añadir el mensaje');
                setNewPositiveMessage('');
            }
            setToastColor('danger');
            setShowToast(true);
        } finally {
            setIsAddingMessage(false);
        }
    };

    const handleAddReinforcementMessage = async () => {
        if (!newReinforcementMessage.trim()) {
            setToastMessage('El mensaje no puede estar vacío');
            setToastColor('danger');
            setShowToast(true);
            return;
        }

        if (!id || isAddingMessage) {
            return;
        }

        // Verificar si el mensaje ya existe (ignorando mayúsculas, tildes y puntuación)
        if (messageExists(newReinforcementMessage, messagesReinforcement)) {
            setToastMessage('Este mensaje ya existe (o es similar a uno existente)');
            setToastColor('danger');
            setShowToast(true);
            setNewReinforcementMessage('');
            return;
        }

        setIsAddingMessage(true);
        try {
            const response = await studentMessageAPI.addMessage(id, {
                text_message: newReinforcementMessage.trim(),
                type: 'reinforcement'
            });

            const newMessage: StudentMessage = {
                id: response.message_id,
                type: 'reinforcement',
                text_message: newReinforcementMessage.trim(),
            };
            setMessagesReinforcement([...messagesReinforcement, newMessage]);
            setNewReinforcementMessage('');
            setToastMessage('¡Mensaje añadido correctamente!');
            setToastColor('success');
            setShowToast(true);
        } catch (error: any) {
            console.error('Error adding reinforcement message:', error);
            // Si el mensaje ya está asignado al estudiante (409 Conflict)
            if (error.response?.status === 409) {
                setToastMessage('Este mensaje ya está asignado a este estudiante');
            } else {
                setToastMessage('Error al añadir el mensaje');
            }
            setToastColor('danger');
            setShowToast(true);
        } finally {
            setIsAddingMessage(false);
        }
    };

    const handleHome = () => {
        router.push(`/student-edit-menu/${id}/${name}`);
    }

    if (!user) {
        return <Redirect to="/login" />;
    }

    return (
        <IonPage>
            <SimpleHeaderEdit studentName={name} Editing={"Editar mensajes"} onHome={handleHome} />
            <IonContent>
                {loadingMessages ? (
                    <div className='Game1-spinner'>
                        <LoadingSpinner message="Cargando mensajes" />
                    </div>
                ) : (
                    <div className="edit-messages-columns">
                        <div className="edit-messages-column">
                            <h2>Mensajes positivos</h2>
                            <div className="edit-messages-table">
                                <div className="edit-messages-items">
                                    <IonList>
                                        {messagesPositive.map((message, index) => (
                                            <MessageItem key={message.id || index} message={message} />
                                        ))}
                                    </IonList>
                                </div>
                                <div className="edit-messages-input-container">
                                    <IonInput
                                        placeholder="Añadir mensaje..."
                                        value={newPositiveMessage}
                                        onIonInput={(e) => setNewPositiveMessage(e.detail.value || '')}
                                        onKeyUp={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddPositiveMessage();
                                            }
                                        }}
                                        className="edit-messages-input"
                                    />
                                    <IonButton
                                        type="button"
                                        onClick={() => handleAddPositiveMessage()}
                                        className="edit-messages-add-btn"
                                        disabled={isAddingMessage}
                                    >
                                        <IonIcon icon={add} />
                                    </IonButton>
                                </div>
                            </div>
                        </div>
                        <div className="edit-messages-column">
                            <h2>Mensajes de refuerzo</h2>
                            <div className="edit-messages-table">
                                <div className="edit-messages-items">
                                    <IonList>
                                        {messagesReinforcement.map((message, index) => (
                                            <MessageItem key={message.id || index} message={message} />
                                        ))}
                                    </IonList>
                                </div>
                                <div className="edit-messages-input-container">
                                    <IonInput
                                        placeholder="Añadir mensaje..."
                                        value={newReinforcementMessage}
                                        onIonInput={(e) => setNewReinforcementMessage(e.detail.value || '')}
                                        onKeyUp={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddReinforcementMessage();
                                            }
                                        }}
                                        className="edit-messages-input"
                                    />
                                    <IonButton
                                        type="button"
                                        onClick={() => handleAddReinforcementMessage()}
                                        className="edit-messages-add-btn"
                                        disabled={isAddingMessage}
                                    >
                                        <IonIcon icon={add} />
                                    </IonButton>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
                <IonToast className='edit-messages-toast'
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={toastMessage}
                    duration={2000}
                    position="bottom"
                    color={toastColor}
                />
            </IonContent>
        </IonPage>
    )
}