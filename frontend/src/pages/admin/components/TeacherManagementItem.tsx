import React from 'react';
import { IonAvatar, IonItem, IonIcon, IonButton, useIonRouter } from '@ionic/react';
import { create } from 'ionicons/icons';
import './TeacherManagementItem.css';

interface Props {
  teacherAvatar: string;
  teacherName: string;
  userId: string;
  tipo: string;
}

const TeacherManagementItem: React.FC<Props> = ({
  teacherAvatar,
  teacherName,
  userId,
  tipo,
}) => {
  const router = useIonRouter();

  const handleEdit = () => {
    if (tipo === 'profesores') {
      router.push(`/teacher/edit-profile/${userId}`, 'forward');
    } else {
      router.push(`/student-edit-profile/${userId}/${teacherName}`, 'forward');
    }
  };

  return (

    <IonItem lines="none" className="teacherManagementItem-item">

      {/* Contenedor interno para controlar flex sin tocar el ion-item por fuera */}
      <div className="teacherManagementItem-mainContainer">

        <IonAvatar className="teacherManagementItem-avatar">
          <img src={teacherAvatar} alt={teacherName} />
        </IonAvatar>

        <div className="teacherManagementItem-name">{teacherName}</div>

        <IonButton className='teacherManagementItme-EditButton' onClick={handleEdit}>
          <IonIcon slot="icon-only" md={create}></IonIcon>
        </IonButton>

      </div>

    </IonItem>
  );
};

export default TeacherManagementItem;