/**
 * @file UserItem.tsx
 * @description Reuse item to display a user with avatar, name, classes
 * along with a checkbox for selection.
 */
import React from 'react';
import { IonAvatar, IonItem, IonCheckbox } from '@ionic/react';
import './UserItem.css';

/**
 * Props for UserItem
 * @property avatar - URL of the image/avatar
 * @property alias - Text to display (name/alias)
 * @property classes - List of class aliases to display
 * @property isChecked - State of the checkbox
 * @property onCheckChange - Callback when the checkbox changes
 */
interface Props {
    avatar: string;
    alias: string;
    classes: string[];
    /** If true, highlights the background of the item (e.g., belongs to the selected class) */
    highlight?: boolean;

    isChecked?: boolean;
    onCheckChange?: (checked: boolean) => void;

}

/**
 * Functional Summary.
 *
 * Visual component to display a user with avatar, name, and list of
 * classes. Includes a checkbox that notifies changes via `onCheckChange`.
 *
 * Execution flow.
 *
 * - Renders an avatar, the user's alias, and a list of classes.
 * - The checkbox reflects `isChecked` and on change executes `onCheckChange`.
 *
 * @param {Props} props - Component properties (avatar, alias, classes, isChecked, onCheckChange, highlight).
 * @returns {JSX.Element} Visual item representing a user.
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

            {/* Internal container to control flex without touching the outer ion-item */}
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