import React from 'react';
import { IonItem, IonIcon, IonButton } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import './GroupItem.css';

/**
 * Resumen Funcional.
 *
 * Item de lista que representa un grupo en la UI. Muestra el nombre del
 * grupo y proporciona botones para editar o eliminar.
 *
 * Flujo de ejecución.
 *
 * - Rinde el nombre del grupo y dos botones: editar y eliminar.
 * - `handleDelete` pide confirmación al usuario y, si se confirma, llama a
 *   `onDelete` (si se proporcionó) con el id del grupo.
 *
 * @param {Props} props - Propiedades del componente (id, groupName, onDelete).
 * @returns {JSX.Element} Elemento de lista que representa un grupo.
 *
 * @example
 * ```tsx
 * <GroupItem id={1} groupName="1A" onDelete={(id)=>{}} />
 * ```
 */

interface Props {
    id: number | string;
    groupName: string;
    onEditClick?: () => void;
    onDelete?: (id: number | string) => void;
}

const GroupItem: React.FC<Props> = ({
    id,
    groupName,
    onDelete
}) => {
    /**
     * Resumen Funcional.
     *
     * Solicita confirmación y notifica al padre para eliminar el grupo.
     *
     * Flujo de ejecución.
     *
     * - Muestra un `window.confirm` con el nombre del grupo.
     * - Si el usuario confirma y existe la prop `onDelete`, la invoca con
     *   el `id` del grupo.
     *
     * @param {void}
     * @returns {void}
     *
     * @example
     * ```ts
     * handleDelete();
     * ```
     */
    const handleDelete = () => {
        const confirmed = window.confirm(`¿Eliminar el grupo "${groupName}"? Esta acción no se puede deshacer.`);
        if (!confirmed) return;
        if (onDelete) onDelete(id);
    };
    return (

        <IonItem lines="none" className="groupItem-item">

            {/* Contenedor interno para controlar flex sin tocar el ion-item por fuera */}
            <div className="groupItem-mainContainer">

                <div className="groupItem-name">{groupName}</div>

                <div className='groupItem-icons'>
                    <IonButton className='groupItem-IconButton' onClick={handleDelete}>
                        <IonIcon slot="icon-only" md={trashOutline}></IonIcon>
                    </IonButton>
                </div>

            </div>

        </IonItem >
    );
};

export default GroupItem;