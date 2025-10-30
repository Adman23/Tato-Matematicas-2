import React from 'react';
import { IonAvatar, IonItem, IonIcon, IonButton } from '@ionic/react';
import { create } from 'ionicons/icons';
import './TeacherManagementItem.css';

interface Props {
  teacherAvatar: string;
  teacherName: string;
  onEditClick?: () => void;

}

const TeacherManagementItem: React.FC<Props> = ({
  teacherAvatar,
  teacherName,

}) => {
  return (

    <IonItem lines="none" className="teacherManagementItem-item">

      {/* Contenedor interno para controlar flex sin tocar el ion-item por fuera */}
      <div className="teacherManagementItem-mainContainer">

            <IonAvatar className="teacherManagementItem-avatar">
            <img src={teacherAvatar} alt={teacherName} />
            </IonAvatar>

            <div className="teacherManagementItem-name">{teacherName}</div>

            <IonButton className='teacherManagementItme-EditButton'>
                <IonIcon slot="icon-only" md={create}></IonIcon>
            </IonButton>

      </div>

    </IonItem>
  );
};

export default TeacherManagementItem;