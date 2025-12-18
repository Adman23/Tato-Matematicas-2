/**
 * Message Item: Component to display a single student message in a list.
 *
 */
import React from 'react';
import { IonItem } from '@ionic/react';
import './MessageItem.css';
import type { StudentMessage } from '../../../../lib/api';

/**
 * Props interface for the MessageItem component.
 *
 * @property {StudentMessage} message - The student message object to display
 */
interface Props {
    message: StudentMessage
}

/**
 * Displays a single student message item in a list.
 *
 * Flow:
 * 1. Receives a StudentMessage object via props
 * 2. Renders the message text inside an Ionic item container
 * 3. Applies custom styling via MessageItem.css
 *
 * @param {Props} props - Component props
 * @param {StudentMessage} props.message - The message object containing text_message to display
 * @returns {JSX.Element} An IonItem containing the formatted message text
 *
 * @example
 * const message = { id: '1', type: 'positive', text_message: 'Great job!' };
 * <MessageItem message={message} />
 */
const StudentItem: React.FC<Props> = ({
    message
}) => {
    return (

        <IonItem lines="none" className='messageitem-Item'>
            <div className="message-item-content">
                <div>{message.text_message}</div>
            </div>
        </IonItem>
    );
};

export default StudentItem;
