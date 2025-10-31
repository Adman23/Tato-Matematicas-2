import React from 'react';
import { IonAvatar, IonItem, IonCheckbox } from '@ionic/react';
import './UserItem.css';

interface Props {
    avatar: string;
    alias: string;
    classes: string[];

    isChecked?: boolean;
    onCheckChange?: (checked: boolean) => void;

}

const UserItem: React.FC<Props> = ({
    avatar,
    alias,
    classes = [[]],
    isChecked = false,
    onCheckChange

}) => {
    return (

        <IonItem lines="none" className="userItem-item">

            {/* Contenedor interno para controlar flex sin tocar el ion-item por fuera */}
            <div className="userItem-mainContainer">

                <IonCheckbox
                    slot='start'
                    checked={isChecked}
                    onIonChange={(e) => onCheckChange && onCheckChange(e.detail.checked)}
                    className='userItem-checkbox'
                />

                <IonAvatar className="userItem-avatar">
                    <img src={avatar} alt={alias} />
                </IonAvatar>

                <div className="userItem-name">{alias}</div>

                <div className='userItem-class'>
                    {classes.map((className) => (
                        <div className="userItem-classItem">{className}</div>
                    ))}

                </div>
            </div>
        </IonItem>
    );
};

export default UserItem;