import {
    IonContent,
    IonList,
    IonPage,
    IonInput,
    IonButton,
    IonIcon,
    useIonRouter

} from '@ionic/react';
import { add } from 'ionicons/icons';
import { useState } from 'react';
import './EditMessages.css';
import SimpleHeaderEdit from './components/SimpleHeaderEdit';
import { useAuth } from '../../../contexts/AuthContext';
import { Redirect, useParams } from 'react-router-dom';
import MessageItem from './components/MessageItem';

const initialMessagesPositive = [
    "¡Buen trabajo!",
    "¡Sigue así!",
    "¡Excelente esfuerzo!"
];

const initialMessagesReinforcement = [
    "Inténtalo de nuevo.",
    "No te rindas.",
    "Puedes hacerlo mejor la próxima vez."
];


export default function EditMessages() {
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const { name } = useParams<{ name: string }>();

    const [messagesPositive, setMessagesPositive] = useState<string[]>(initialMessagesPositive);
    const [messagesReinforcement, setMessagesReinforcement] = useState<string[]>(initialMessagesReinforcement);
    const [newPositiveMessage, setNewPositiveMessage] = useState<string>('');
    const [newReinforcementMessage, setNewReinforcementMessage] = useState<string>('');

    const router = useIonRouter();

    const handleAddPositiveMessage = () => {
        if (newPositiveMessage.trim()) {
            setMessagesPositive([...messagesPositive, newPositiveMessage.trim()]);
            setNewPositiveMessage('');
        }
    };

    const handleAddReinforcementMessage = () => {
        if (newReinforcementMessage.trim()) {
            setMessagesReinforcement([...messagesReinforcement, newReinforcementMessage.trim()]);
            setNewReinforcementMessage('');
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
                <div className="edit-messages-columns">
                    <div className="edit-messages-column">
                        <h2>Mensajes positivos</h2>
                        <div className="edit-messages-table">
                            <div className="edit-messages-items">
                                <IonList>
                                    {messagesPositive.map((message, index) => (
                                        <MessageItem key={index} message={message} />
                                    ))}
                                </IonList>
                            </div>
                            <div className="edit-messages-input-container">
                                <IonInput
                                    placeholder="Añadir mensaje..."
                                    value={newPositiveMessage}
                                    onIonChange={(e) => setNewPositiveMessage(e.detail.value || '')}
                                    className="edit-messages-input"
                                />
                                <IonButton onClick={handleAddPositiveMessage} className="edit-messages-add-btn">
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
                                        <MessageItem key={index} message={message} />
                                    ))}
                                </IonList>
                            </div>
                            <div className="edit-messages-input-container">
                                <IonInput
                                    placeholder="Añadir mensaje..."
                                    value={newReinforcementMessage}
                                    onIonChange={(e) => setNewReinforcementMessage(e.detail.value || '')}
                                    className="edit-messages-input"
                                />
                                <IonButton onClick={handleAddReinforcementMessage} className="edit-messages-add-btn">
                                    <IonIcon icon={add} />
                                </IonButton>
                            </div>
                        </div>
                    </div>

                </div>
            </IonContent>
        </IonPage>
    )
}