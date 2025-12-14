import React from 'react';
import { IonItem } from '@ionic/react';
import './MessageItem.css';
import type { StudentMessage } from '../../../../lib/api';

interface Props {
    message: StudentMessage
}

const StudentItem: React.FC<Props> = ({
    message
}) => {
    return (

        <IonItem lines="none">
            <div className="message-item-content">
                <div className="message-item-text">{message.text_message}</div>
            </div>
        </IonItem>
    );
};

export default StudentItem;
