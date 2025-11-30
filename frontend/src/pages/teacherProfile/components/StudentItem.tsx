import React from 'react';
import { IonAvatar, IonItem, IonIcon, IonButton } from '@ionic/react';
import { trendingUpSharp, create } from 'ionicons/icons';
import './StudentItem.css';

interface Props {
  studentAvatar: string;
  studentName: string;
  studentClass: string;
  onEditClick?: () => void;
  onInfoClick?: () => void;
  onStatisticsClick?: () => void;
}

const StudentItem: React.FC<Props> = ({
  studentAvatar,
  studentName,
  studentClass,
  onStatisticsClick,
  onEditClick
}) => {
  return (

    <IonItem lines="none" className="student-item">

      {/* Contenedor interno para controlar flex sin tocar el ion-item por fuera */}
      <div className="student-item__inner">

            <IonAvatar className="student-item__avatar">
            <img src={studentAvatar} alt={studentName} />
            </IonAvatar>

            {/* Usamos un div normal para el texto (no dependemos exclusivamente de IonLabel)
                así evitamos que alguna regla de IonLabel nos haga saltar la línea. */}
            <div className="student-item__text">

                <div className="student-item__name">{studentName}</div>
                <div className='student-item__class'>{studentClass}</div>
                
                <div className='student-item__icons'>

                    <IonButton className='StudentItem_perfilProfesor_Button' onClick={onStatisticsClick}>
                        <IonIcon slot="icon-only" md={trendingUpSharp}></IonIcon>
                    </IonButton>

                    <IonButton className='StudentItem_perfilProfesor_Button' onClick={onEditClick}>
                        <IonIcon slot="icon-only" md={create}></IonIcon>
                    </IonButton>

                </div>
            {/* puedes añadir subtítulo, curso, etc. aquí */}
            </div>

      </div>

    </IonItem>
  );
};

export default StudentItem;
