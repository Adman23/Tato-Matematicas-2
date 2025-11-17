import React from 'react';
import { IonItem, IonIcon, IonButton } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import './GroupItem.css';

/**
 * Functional Summary.
 *
 * List item representing a group in the UI. Displays the group's name and provides buttons to edit or delete.
 *
 * Execution flow.
 *
 * - Renders the group's name and two buttons: edit and delete.
 * - `handleDelete` asks the user for confirmation and, if confirmed, calls
 *   `onDelete` (if provided) with the group's id.
 *
 * @param {Props} props - Component props (id, groupName, onDelete).
 * @returns {JSX.Element} List item representing a group.
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
     * Functional Summary.
     *
     * Requests confirmation and notifies the parent to delete the group.
     *
     * Execution flow.
     *
     * - Shows a `window.confirm` with the group's name.
     * - If the user confirms and the `onDelete` prop exists, it invokes it with
     *   the group's `id`.
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

            {/* Internal container to control flex without touching the outer ion-item */}
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