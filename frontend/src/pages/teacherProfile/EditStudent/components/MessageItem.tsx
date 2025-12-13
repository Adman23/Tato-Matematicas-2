import React from 'react';
import { IonItem } from '@ionic/react';
import './MessageItem.css';

interface Props {
    message: string
}

const StudentItem: React.FC<Props> = ({
    message
}) => {
    return (

        <IonItem lines="none">
            <div className="message-item-content">
                <div className="message-item-text">{message}</div>
            </div>
        </IonItem>
    );
};

export default StudentItem;
