import React from 'react';
import { IonAvatar, IonItem, IonIcon, IonButton } from '@ionic/react';
import { create, trashOutline } from 'ionicons/icons';
import './TeacherManagementItem.css';

interface Props {
  id: number|string;
  teacherAvatar: string;
  teacherName: string;
  onEditClick?: () => void;
  onDelete?: (id: number | string) => void;

}

const TeacherManagementItem: React.FC<Props> = ({
  id,
  teacherAvatar,
  teacherName,
  onDelete

}) => {

  const handleDelete = () => {
      const confirmed = window.confirm(`¿Eliminar a "${teacherName}"? Esta acción no se puede deshacer.`);
      if (!confirmed) return;
      if (onDelete) onDelete(id);
  };

  return (

    <IonItem lines="none" className="teacherManagementItem-item">

      {/* Contenedor interno para controlar flex sin tocar el ion-item por fuera */}
      <div className="teacherManagementItem-mainContainer">

            <IonAvatar className="teacherManagementItem-avatar">
            <img src={teacherAvatar} alt={teacherName} />
            </IonAvatar>

            <div className="teacherManagementItem-name">{teacherName}</div>

            <div className='groupItem-icons'>
            
              <IonButton className='groupItem-IconButton'>
                  <IonIcon slot="icon-only" md={create}></IonIcon>
              </IonButton>

              <IonButton className='groupItem-IconButton' onClick={handleDelete}>
                  <IonIcon slot="icon-only" md={trashOutline}></IonIcon>
              </IonButton>
            </div>

      </div>

    </IonItem>
  );
};

export default TeacherManagementItem;