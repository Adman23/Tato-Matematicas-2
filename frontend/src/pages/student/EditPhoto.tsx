/**
 * Edit Game 1: Touch Number Configuration Page
 *
 */

import { IonCol, IonContent, IonGrid, IonIcon, IonImg, IonPage, IonRow, IonSpinner, IonText, IonToast, useIonRouter } from "@ionic/react";
import { useAuth } from '../../contexts/AuthContext';
import { Button3Dtext } from "../global_components/PushableButtons";
import { arrowBack, personOutline } from "ionicons/icons";
import { useState, useEffect, useRef } from 'react';

import './EditPhoto.css';
import SimpleHeaderUser from "../student/components/SimpleHeaderUser";
import LoadingSpinner from "../global_components/LoadingSpinner";
import { getImages } from "../../lib/api";
import { useParams } from "react-router";
import { SimpleButton } from "../global_components/SimpleButton";

const DEFAULT_AVATAR = "https://ionicframework.com/docs/img/demos/avatar.svg";
interface AvatarOption {
  id: string;
  name: string;
  imageUrl: string;
}
export default function EditPhoto() {
    const { user } = useAuth();
    const userName = user?.username || '';

    const { id } = useParams<{ id: string }>();
    const router = useIonRouter();

      const [avatarOptions, setAvatarOptions] = useState<AvatarOption[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] =
    useState<'success' | 'danger'>('success');
  const [isToastOpen, setIsToastOpen] = useState(false);

  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption | null>(null);


  useEffect(() => {
    loadAvatars();
  }, []);

  const loadAvatars = async () => {
    try {
      const sanitize = (str: string) =>
        str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9]/g, '')
          .toLowerCase();

      const imagesMap = await getImages();

      const options: AvatarOption[] = Object.entries(imagesMap).map(
        ([filename, url]) => {
          const firstWord = filename
            .replace(/\.[^/.]+$/, '')
            .replace(/_/g, ' ')
            .split(' ')[0];

          return {
            id: filename,
            name:
              sanitize(firstWord) === sanitize(userName)
                ? `Avatar personalizado de ${firstWord}`
                : firstWord,
            imageUrl: url as string
          };
        }
      );

      setAvatarOptions(options);
    } catch (err) {
      console.error('Error al cargar avatares:', err);
      setToastMessage('No se pudieron cargar los avatares.');
      setToastColor('danger');
      setIsToastOpen(true);
    } finally {
      setLoadingAvatars(false);
    }
  };
    // Accessibility announcement state
    const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');


    const announce = (message: string) => {
        setLiveAnnouncement('');
        setTimeout(() => {
            setLiveAnnouncement(message);
        }, 100);
    };

    /*if (loading) {
        return (
            <IonPage>
                <IonContent className="ion-padding ion-text-center">
                    <LoadingSpinner message="Cargando configuración de la foto" />
                </IonContent>
            </IonPage >
        );
    }*/

    return(

        <IonPage>
            <SimpleHeaderUser
                    title="FOTO DE PERFIL"
                    title_image="/assets/pictograms/editar.png"
                    userName={user?.username || "username"}
                    photoUrl={user?.photo_url} hidden={true} />

            <IonContent className="EditGame1-content">

                <div
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                    style={{
                        position: 'absolute',
                        width: '1px',
                        height: '1px',
                        padding: 0,
                        margin: '-1px',
                        overflow: 'hidden',
                        clip: 'rect(0, 0, 0, 0)',
                        whiteSpace: 'nowrap',
                        border: 0
                    }}
                >
                    {liveAnnouncement}
                </div>
                <div className="EditGame1-back-button-content">
                        {user?.role === 'student' && (
                        <Button3Dtext
                            onClick={() => {router.push('/student/profile', 'back', 'pop')}}
                            aria-label="Volver atrás"
                        >
                            <IonIcon icon={arrowBack} />
                        </Button3Dtext>)}
                    </div>
                    

                {loadingAvatars ? (
                    <IonSpinner name="crescent" />
                ) : (
                    <IonGrid>
                        <IonRow>
                            {avatarOptions.slice(0, 6).map((avatar) => (
                            <IonCol size="4" key={avatar.id}>
                                <div style={{ textAlign: 'center' }}>
                                <SimpleButton
                                    className={`avatar-wrapper ${selectedAvatar?.id === avatar.id ? 'avatar-selected' : ''}`}
                                    onClick={() => {
                                    setSelectedAvatar(avatar);
                                    announce(`Avatar ${avatar.name} seleccionado`);
                                    }}
                                >
                                    <IonImg
                                    src={avatar.imageUrl}
                                    alt={avatar.name}
                                    className="avatar-img"
                                    />
                                </SimpleButton>

                                <IonText>
                                    <p style={{ fontSize: '14px', marginTop: '8px' }}>
                                    {avatar.name}
                                    </p>
                                </IonText>
                                </div>
                            </IonCol>
                            ))}
                        </IonRow>
                        </IonGrid>

                )}

                <IonToast
                    isOpen={isToastOpen}
                    message={toastMessage}
                    color={toastColor}
                    duration={2500}
                    onDidDismiss={() => setIsToastOpen(false)}
                />
                
               
                    {/* Save Changes Button */}
                    <div className="EditGame1-save-button">
                        <Button3Dtext
                            aria-label="Guardar cambios"
                            onClick={() =>""}
                        >
                            <img
                                src="/assets/pictograms/correctoS.png"
                                alt=""
                                aria-hidden="true"
                                className="EditGame1-config-button-image"
                            />
                            <span className="btn-text" aria-hidden="true">GUARDAR</span>
                        </Button3Dtext>
                    </div>
            </IonContent>

        </IonPage>
    );

}