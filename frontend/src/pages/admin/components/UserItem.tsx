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
    /** Si true, resalta el fondo del item (por ejemplo: pertenece a la clase seleccionada) */
    highlight?: boolean;

    isChecked?: boolean;
    onCheckChange?: (checked: boolean) => void;

}

/**
 * Resumen Funcional.
 *
 * Componente visual para mostrar un usuario con avatar, nombre y lista de
 * clases. Incluye un checkbox que notifica cambios mediante `onCheckChange`.
 *
 * Flujo de ejecución.
 *
 * - Renderiza un avatar, el alias del usuario y una lista de clases.
 * - El checkbox refleja `isChecked` y al cambiar ejecuta `onCheckChange`.
 *
 * @param {Props} props - Propiedades del componente (avatar, alias, classes, isChecked, onCheckChange, highlight).
 * @returns {JSX.Element} Item visual que representa un usuario.
 *
 * @example
 * ```tsx
 * <UserItem avatar="/me.png" alias="Juan" classes={["1A"]} onCheckChange={(c)=>{}} />
 * ```
 */
const UserItem: React.FC<Props> = ({
    avatar,
    alias,
    classes = [],
    isChecked = false,
    onCheckChange,
    highlight = false,

}) => {
    return (

        <IonItem lines="none" className="userItem-item ">

            {/* Contenedor interno para controlar flex sin tocar el ion-item por fuera */}
            <div className={`userItem-mainContainer ${highlight ? 'userItem-highlight' : ''}`}>

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