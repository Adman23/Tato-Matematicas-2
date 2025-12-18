import './EditPhoto.css';
import { 
  IonCol, IonContent, IonGrid, IonIcon, IonImg, IonPage, 
  IonRow, IonSpinner, IonText, IonToast, useIonRouter 
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { useState, useEffect } from 'react';

// --- Imports de Contexto y Componentes ---
import { useAuth } from '../../contexts/AuthContext';
import { Button3Dtext } from "../global_components/PushableButtons";
import SimpleHeaderUser from "../student/components/SimpleHeaderUser";
import { SimpleButton } from "../global_components/SimpleButton";
import LoadingSpinner from "../global_components/LoadingSpinner"; 

// --- Imports de API ---
import { getImages, userAPI, authAPI, type User } from "../../lib/api";

const DEFAULT_AVATAR = "https://ionicframework.com/docs/img/demos/avatar.svg";

interface AvatarOption {
  id: string; 
  name: string;
  imageUrl: string;
}

export default function EditPhoto() {
  const { user, updateUser } = useAuth(); 
  const router = useIonRouter();

  // Estados
  const [avatarOptions, setAvatarOptions] = useState<AvatarOption[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption | null>(null);
  const [isSaving, setIsSaving] = useState(false); 

  // Feedback (Toast)
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');
  const [isToastOpen, setIsToastOpen] = useState(false);

  // Accesibilidad
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  useEffect(() => {
    loadAvatars();
  }, []);

  const announce = (message: string) => {
    setLiveAnnouncement('');
    setTimeout(() => {
      setLiveAnnouncement(message);
    }, 100);
  };

  const loadAvatars = async () => {
    try {
      const sanitize = (str: string) =>
        str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      const imagesMap = await getImages();
      const currentUserName = user?.username || '';

      const options: AvatarOption[] = Object.entries(imagesMap).map(
        ([filename, url]) => {
          const firstWord = filename
            .replace(/\.[^/.]+$/, '') 
            .replace(/_/g, ' ')
            .split(' ')[0];

          return {
            id: filename,
            name: sanitize(firstWord) === sanitize(currentUserName)
                ? `Avatar personalizado de ${firstWord}`
                : firstWord,
            imageUrl: url as string
          };
        }
      );

      setAvatarOptions(options);

      // Intentar pre-seleccionar el avatar actual si existe en la lista
      if (user?.photo_url) {
        const found = options.find(opt => user.photo_url?.includes(opt.id));
        if (found) setSelectedAvatar(found);
      }

    } catch (err) {
      console.error('Error al cargar avatares:', err);
      setToastMessage('No se pudieron cargar los avatares.');
      setToastColor('danger');
      setIsToastOpen(true);
    } finally {
      setLoadingAvatars(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!selectedAvatar) {
      setToastMessage("Por favor, selecciona una imagen primero.");
      setToastColor("warning");
      setIsToastOpen(true);
      return;
    }

    try {
      setIsSaving(true);
      announce("Guardando cambios...");

      // 1. Enviar actualización al Backend
      await userAPI.updateUser(user.id, {
        photo_url: selectedAvatar.id
      });

      // 2. Refrescar el usuario en el contexto local
      const freshUser = await authAPI.fetchBasicUserInfo();
      const timestamp = Date.now();
      
      let freshUrl = freshUser.photo_url || DEFAULT_AVATAR;
      freshUrl = freshUrl.includes('?') 
        ? `${freshUrl}&t=${timestamp}` 
        : `${freshUrl}?t=${timestamp}`;

      const userForContext: User = {
        ...freshUser,
        photo_url: freshUrl
      };

      updateUser(userForContext);

      // 3. Feedback visual
      setToastMessage("¡Foto actualizada correctamente!");
      setToastColor("success");
      setIsToastOpen(true);
      announce("Foto actualizada con éxito");

      // 4. Volver atrás
      setTimeout(() => {
        router.push('/student/profile', 'back', 'pop');
      }, 1500);

    } catch (error: any) {
      console.error("Error updating photo:", error);
      setToastMessage(error.response?.data?.detail || "Error al guardar la foto");
      setToastColor("danger");
      setIsToastOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  // --- MODAL DE CARGA (Igual que en EditNoiseStudent) ---
  if (loadingAvatars) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <LoadingSpinner message="Cargando avatares..." />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <SimpleHeaderUser
        title="FOTO DE PERFIL"
        title_image="/assets/pictograms/editar.png"
        userName={user?.username || "Estudiante"}
        photoUrl={user?.photo_url} 
        hidden={true} 
      />

      <IonContent className="EditGame1-content">
        {/* Helper de accesibilidad */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          style={{
            position: 'absolute', width: '1px', height: '1px', padding: 0,
            margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap', border: 0
          }}
        >
          {liveAnnouncement}
        </div>

        <div className="EditGame1-back-button-content">
          <Button3Dtext
            onClick={() => { router.push('/student/profile', 'back', 'pop') }}
            aria-label="Volver atrás"
            disabled={isSaving}
          >
            <IonIcon icon={arrowBack} />
          </Button3Dtext>
        </div>

        {/* Grid de Avatares (Ya no necesita check de loading aquí) */}
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
                    disabled={isSaving}
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

        <IonToast
          isOpen={isToastOpen}
          message={toastMessage}
          color={toastColor}
          duration={2500}
          onDidDismiss={() => setIsToastOpen(false)}
        />

        {/* Botón de Guardar */}
        <div className="EditGame1-save-button">
          <Button3Dtext
            aria-label="Guardar cambios"
            onClick={handleSave}
            disabled={isSaving} 
          >
             {isSaving ? (
                <IonSpinner name="dots" style={{color: 'white'}} />
             ) : (
                <>
                  <img
                    src="/assets/pictograms/correctoS.png"
                    alt=""
                    aria-hidden="true"
                    className="EditGame1-config-button-image"
                  />
                  <span className="btn-text" aria-hidden="true">GUARDAR</span>
                </>
             )}
          </Button3Dtext>
        </div>

      </IonContent>
    </IonPage>
  );
}