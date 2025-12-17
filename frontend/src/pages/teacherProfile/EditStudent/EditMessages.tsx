/**
 * Edit Messages: Edit Student Reinforcement Messages Page
 *
 */
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

/**
 * Page component for editing student reinforcement messages.
 *
 * This component allows teachers to manage positive and reinforcement messages
 * assigned to a specific student. It provides functionality to view existing
 * messages and add new ones, with duplicate detection that ignores case,
 * accents, and punctuation.
 *
 * Flow:
 * 1. Component mounts and extracts student ID and name from URL params
 * 2. Fetches student data and normalizes reinforcement messages
 * 3. Separates messages into positive and reinforcement categories
 * 4. Renders two columns with message lists and input fields
 * 5. Handles message addition with validation and duplicate checking
 * 6. Displays toast notifications for success/error feedback
 *
 * @returns {JSX.Element} The EditMessages page component
 *
 * @example
 * // Route usage
 * <Route path="/edit-messages/:id/:name" component={EditMessages} />
 *
 * // Navigation to this page
 * router.push('/edit-messages/123/John');
 */
export default function EditMessages() {
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const { name } = useParams<{ name: string }>();
    const { role } = useParams<{ role: string }>();
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
     * Normalizes text for comparison by removing accents, punctuation, and converting to lowercase.
     *
     * Flow:
     * 1. Converts text to lowercase
     * 2. Normalizes Unicode characters (NFD decomposition)
     * 3. Removes diacritical marks (accents)
     * 4. Removes common punctuation marks
     * 5. Trims whitespace
     *
     * @param {string} text - The text to normalize
     * @returns {string} The normalized text for comparison
     *
     * @example
     * normalizeTextForComparison('¡Muy bien!') // Returns 'muy bien'
     * normalizeTextForComparison('Fantástico') // Returns 'fantastico'
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
     * Checks if a message already exists in the list, ignoring case, accents, and punctuation.
     *
     * Flow:
     * 1. Normalizes the new message text
     * 2. Iterates through existing messages
     * 3. Compares normalized versions of each message
     * 4. Returns true if a match is found
     *
     * @param {string} newMessage - The new message text to check
     * @param {StudentMessage[]} existingMessages - Array of existing messages to compare against
     * @returns {boolean} True if the message already exists, false otherwise
     *
     * @example
     * const messages = [{ text_message: '¡Muy bien!' }];
     * messageExists('muy bien', messages) // Returns true
     * messageExists('Excelente', messages) // Returns false
     */
    const messageExists = (newMessage: string, existingMessages: StudentMessage[]): boolean => {
        const normalizedNew = normalizeTextForComparison(newMessage);
        return existingMessages.some(msg =>
            normalizeTextForComparison(msg.text_message) === normalizedNew
        );
    };

    /**
     * Normalizes raw message data from the backend into StudentMessage objects.
     *
     * Flow:
     * 1. Validates input is a non-empty array
     * 2. Maps each raw object to extract message properties
     * 3. Handles nested message structure ({ messages: {...} })
     * 4. Filters out null/invalid entries
     *
     * @param {any[]} raw - Raw message data from the backend API
     * @returns {StudentMessage[]} Array of normalized StudentMessage objects
     *
     * @example
     * const raw = [{ messages: { id: 1, type: 'positive', text_message: 'Great!' } }];
     * normalizeMessages(raw) // Returns [{ id: '1', type: 'positive', text_message: 'Great!', ... }]
     */
    const normalizeMessages = (raw: any[]): StudentMessage[] => {
        if (!raw || !Array.isArray(raw)) return [];

        return raw.map((r: any) => {
            if (!r) return null;

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

    /**
     * Loads and processes messages for the current student.
     *
     * Flow:
     * 1. Validates student ID exists
     * 2. Fetches student data from the API
     * 3. Normalizes raw reinforcement messages
     * 4. Separates messages by type (positive/reinforcement)
     * 5. Updates component state with categorized messages
     * 6. Handles loading state and errors
     *
     * @returns {Promise<void>}
     *
     * @example
     * // Called automatically on component mount
     * useEffect(() => { loadMessages(); }, [id]);
     */
    const loadMessages = async () => {
        try {
            if (!id) return;

            // Get student data
            const studentData = await userAPI.fetchUserData(id);
            console.log('Loaded student data:', studentData);

            const rawMessages = studentData?.reinforcement_messages || [];
            const allMessages = normalizeMessages(rawMessages);
            console.log('Normalized messages:', allMessages);

            // Separate messages by type
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
    }, [id]); // Depends on student ID


    /**
     * Handles adding a new positive message for the student.
     *
     * Flow:
     * 1. Validates message is not empty
     * 2. Checks for duplicate messages (ignoring case, accents, punctuation)
     * 3. Sends API request to add the message
     * 4. Updates local state with the new message on success
     * 5. Displays appropriate toast notification
     * 6. Clears input field after operation
     *
     * @returns {Promise<void>}
     *
     * @example
     * // Called via button click or Enter key
     * <IonButton onClick={() => handleAddPositiveMessage()}>Add</IonButton>
     */
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

        // Check if the message already exists (ignoring case, accents, and punctuation)
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
            // If the message is already assigned to the student (409 Conflict)
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

    /**
     * Handles adding a new reinforcement message for the student.
     *
     * Flow:
     * 1. Validates message is not empty
     * 2. Checks for duplicate messages (ignoring case, accents, punctuation)
     * 3. Sends API request to add the message
     * 4. Updates local state with the new message on success
     * 5. Displays appropriate toast notification
     * 6. Clears input field after operation
     *
     * @returns {Promise<void>}
     *
     * @example
     * // Called via button click or Enter key
     * <IonButton onClick={() => handleAddReinforcementMessage()}>Add</IonButton>
     */
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

        // Check if the message already exists (ignoring case, accents, and punctuation)
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
            // If the message is already assigned to the student (409 Conflict)
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

    /**
     * Navigates back to the student edit menu.
     *
     * Flow:
     * 1. Constructs the URL with student ID and name
     * 2. Uses Ionic router to navigate to the menu page
     *
     * @returns {void}
     *
     * @example
     * // Used as callback for home button
     * <SimpleHeaderEdit onHome={handleHome} />
     */
    const handleHome = () => {
        router.push(`/student-edit-menu/${id}/${name}/${role}`, 'back', 'pop');
    }

    if (!user) {
        return <Redirect to="/login" />;
    }

    return (
        <IonPage>
            <SimpleHeaderEdit studentName={name} Editing={"Editar mensajes"} onHome={handleHome} />
            <IonContent className='ContentEditMessagesProfesor'>
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
                                    <IonList className='List-EditMessages'>
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
                                    <IonList className='List-EditMessages'>
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