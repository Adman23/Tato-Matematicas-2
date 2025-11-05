/**
 * @file UserItem.tsx
 * @description Item reutilizable que muestra avatar, nombre y clases de un usuario
 * junto a un checkbox para selección.
 */
import React from 'react';
import { IonAvatar, IonItem, IonCheckbox } from '@ionic/react';
import './UserItem.css';

/**
 * Props para UserItem
 * @property avatar - URL de la imagen/avatar
 * @property alias - Texto a mostrar (nombre/alias)
 * @property classes - Lista de alias de clase a mostrar
 * @property isChecked - Estado del checkbox
 * @property onCheckChange - Callback cuando cambia el checkbox
 */
interface Props {
    avatar: string;
    alias: string;
    classes: string[];

    isChecked?: boolean;
    onCheckChange?: (checked: boolean) => void;

}

/**
 * Componente visual para mostrar un usuario con avatar, nombre y lista de clases.
 * Incluye un checkbox y lanza `onCheckChange` con el nuevo estado.
 */
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
                    {classes.map((className, idx) => (
                        <div key={`${className}-${idx}`} className="userItem-classItem">{className}</div>
                    ))}

                </div>
            </div>
        </IonItem>
    );
};

export default UserItem;