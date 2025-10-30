// src/pages/StudentRegister.tsx

import './StudentRegister.css';

import {
  IonPage,
  IonInput,
  IonButton,
  IonIcon,
  IonToast,
  IonImg,
  IonText,
} from '@ionic/react';
import { personOutline, addOutline, closeOutline } from 'ionicons/icons';
import { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { setupIonicReact } from '@ionic/react';
setupIonicReact();


const PICTOGRAMS = [
  { id: 'perro', name: 'Perro', image: '/assets/pictograms/perro.png' },
  { id: 'gato', name: 'Gato', image: '/assets/pictograms/gato.png' },
  { id: 'tortuga', name: 'Tortuga', image: '/assets/pictograms/tortuga.png' },
  { id: 'león', name: 'León', image: '/assets/pictograms/león.png' },
  { id: 'elefante', name: 'Elefante', image: '/assets/pictograms/elefante.png' },
];

const MAX_PICTOGRAMS = 3;

export default function StudentRegister() {
  const history = useHistory();
  const { register } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pictoPickerRef = useRef<HTMLDivElement>(null);
  const avatarPickerRef = useRef<HTMLDivElement>(null);
  const formCardRef = useRef<HTMLDivElement>(null);

  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('Perfil.png');
  const [avatarPreview, setAvatarPreview] = useState<string>('/assets/perfiles/Perfil.png');
  const [pictograms, setPictograms] = useState<string[]>([]);

  const [showPictoModal, setShowPictoModal] = useState(false);
  const [isPictoModalVisible, setIsPictoModalVisible] = useState(false);

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);

  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('danger');

  const AVATAR_OPTIONS = [
    'Perfil.png',
    'Aventurero.png',
    'Batman.png',
    'Bufón.png',
    'Centauro.png',
    'Dragón.png',
    'Gato.png',
    'Hércules.png',
    'Lobo.png',
    'Mago.png',
    'Maga.png',
    'Olentzero.png',
    'Pinocho.png',
    'Presidenta.png',
    'Presidente.png',
    'Princesa.png',
    'Sirena.png',
    'Spiderman.png',
    'Supermán.png',
    'Tutankhamon.png',
    'Vampiro.png',
  ].map(file => ({
    id: file,
    name: file.replace('.png', '').replace(/_/g, ' '),
    image: `/assets/perfiles/${file}`,
  }));

  const isUserNameValid = userName.trim().length >= 3;
  const hasAtLeastOnePictogram = pictograms.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let errorMsg = '';
    if (!isUserNameValid) errorMsg += 'El nombre de usuario debe tener al menos 3 caracteres. ';
    if (!hasAtLeastOnePictogram) errorMsg += 'Debe seleccionar al menos un pictograma. ';

    if (errorMsg) {
      setToastMessage(errorMsg);
      setToastColor('danger');
      setIsToastOpen(true);
      return;
    }

    try {
      const password = pictograms.join('-');

      await register({
        username: userName,
        password: password,
        role: "student",
      });

      setToastMessage('Estudiante registrado correctamente 🎉');
      setToastColor('success');
      setIsToastOpen(true);

      setTimeout(() => history.push('/student-login'), 1500);
    } catch (err: any) {
      console.error('Error en el registro:', err);
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Error al registrar estudiante';
      setToastMessage(message);
      setToastColor('danger');
      setIsToastOpen(true);
    }
  };

  // === PICTOGRAMAS ===
  const openPictoModal = () => {
    setShowPictoModal(true);
    requestAnimationFrame(() => {
      setIsPictoModalVisible(true);
    });
  };

  const closePictoModal = () => {
    setIsPictoModalVisible(false);
    setTimeout(() => {
      setShowPictoModal(false);
    }, 200);
  };

  const selectPictogram = (id: string) => {
    const newPictograms = [...pictograms, id];
    setPictograms(newPictograms);
    if (newPictograms.length >= MAX_PICTOGRAMS) {
      closePictoModal();
    }
  };

  const handleAddPictogram = () => {
    if (pictograms.length < MAX_PICTOGRAMS) {
      openPictoModal();
    } else {
      setToastMessage(`Máximo ${MAX_PICTOGRAMS} pictogramas permitidos`);
      setToastColor('danger');
      setIsToastOpen(true);
    }
  };

  const removePictogram = (index: number) => {
    setPictograms(pictograms.filter((_, i) => i !== index));
  };

  // === AVATAR ===
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (avatarPreview && !avatarPreview.startsWith('/assets/')) {
        URL.revokeObjectURL(avatarPreview);
      }
      setSelectedAvatar(file.name);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarSelect = (avatarId: string) => {
    if (avatarPreview && !avatarPreview.startsWith('/assets/')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setSelectedAvatar(avatarId);
    setAvatarPreview(`/assets/perfiles/${avatarId}`);
    closeAvatarModal();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const openAvatarModal = () => {
    setShowAvatarModal(true);
    requestAnimationFrame(() => {
      setIsAvatarModalVisible(true);
    });
  };

  const closeAvatarModal = () => {
    setIsAvatarModalVisible(false);
    setTimeout(() => {
      setShowAvatarModal(false);
    }, 200);
  };

  // === POSICIONAMIENTO MODAL PICTOGRAMAS ===
  const updatePictoModalPosition = useCallback(() => {
    if (showPictoModal && formCardRef.current && pictoPickerRef.current) {
      const cardRect = formCardRef.current.getBoundingClientRect();
      const modal = pictoPickerRef.current;
      // ✅ Reducido de 0.7 a 0.6 para no tapar "Código acceso *"
      const modalHeight = Math.min(cardRect.height * 0.62, 360); // máximo 360px
      modal.style.position = 'fixed';
      modal.style.left = `${cardRect.left + window.scrollX}px`;
      modal.style.top = `${cardRect.top + window.scrollY}px`;
      modal.style.width = `${cardRect.width}px`;
      modal.style.height = `${modalHeight}px`;
      modal.style.zIndex = '1001';
    }
  }, [showPictoModal]);

  useLayoutEffect(() => {
    if (showPictoModal) {
      const id = requestAnimationFrame(updatePictoModalPosition);
      const handleResize = () => updatePictoModalPosition();
      window.addEventListener('resize', handleResize);
      return () => {
        cancelAnimationFrame(id);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showPictoModal, updatePictoModalPosition]);

  // === POSICIONAMIENTO MODAL AVATAR ===
  const updateAvatarModalPosition = useCallback(() => {
    if (showAvatarModal && formCardRef.current && avatarPickerRef.current) {
      const cardRect = formCardRef.current.getBoundingClientRect();
      const modal = avatarPickerRef.current;
      modal.style.position = 'fixed';
      modal.style.left = `${cardRect.left + window.scrollX}px`;
      modal.style.top = `${cardRect.top + window.scrollY}px`;
      modal.style.width = `${cardRect.width}px`;
      modal.style.height = `${cardRect.height}px`;
      modal.style.zIndex = '1002';
    }
  }, [showAvatarModal]);

  useLayoutEffect(() => {
    if (showAvatarModal) {
      const id = requestAnimationFrame(updateAvatarModalPosition);
      const handleResize = () => updateAvatarModalPosition();
      window.addEventListener('resize', handleResize);
      return () => {
        cancelAnimationFrame(id);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showAvatarModal, updateAvatarModalPosition]);

  const avatarDisplayName = AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.name || 'Selecciona un avatar...';

  return (
    <IonPage>
      <div className="main-container">
        <h1>Tato matemáticas 2</h1>

        <div className="form-card" ref={formCardRef}>
          <h2>Registro Alumno</h2>

          <div className="avatar-section">
            <div className="avatar-preview" onClick={triggerFileInput}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="avatar-image" />
              ) : (
                <IonIcon icon={personOutline} className="avatar-icon" />
              )}
            </div>

            <div className="field-wrapper">
              <div className="field-label">Avatar *</div>
              <div className="avatar-select-field" onClick={openAvatarModal}>
                <IonText>{avatarDisplayName}</IonText>
              </div>
            </div>
          </div>

          <div className="field-wrapper">
            <div className="field-label">Usuario *</div>
            <IonInput
              className="input-item"
              placeholder="Escribir aquí..."
              value={userName}
              onIonInput={(e) => setUserName(e.detail.value || '')}
            />
          </div>

          <div className="field-wrapper">
            <div className="field-label">Código acceso *</div>
            <div className="pictogram-container">
              {pictograms.map((pictoId, index) => {
                const picto = PICTOGRAMS.find(p => p.id === pictoId);
                return (
                  <div key={index} className="pictogram-box" onClick={() => removePictogram(index)}>
                    <IonImg src={picto?.image} alt={picto?.name} />
                    <IonIcon icon={closeOutline} className="pictogram-remove" />
                  </div>
                );
              })}
              <div 
                className={`pictogram-add ${pictograms.length >= MAX_PICTOGRAMS ? 'disabled' : ''}`} 
                onClick={handleAddPictogram}
              >
                <IonIcon icon={addOutline} />
              </div>
            </div>
          </div>

          <div className="field-wrapper">
            <IonButton expand="block" className="confirm-button" onClick={handleSubmit}>
              Confirmar
            </IonButton>
          </div>
        </div>

        {/* Modal de pictogramas - tapa parte superior del formulario */}
        {showPictoModal && (
          <div className="picto-picker-overlay" onClick={closePictoModal}>
            <div
              ref={pictoPickerRef}
              className={`picto-picker-custom ${
                isPictoModalVisible ? 'picto-picker-visible' : ''
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="picto-picker-header">
                <h3>Selecciona un pictograma</h3>
                <IonButton fill="clear" size="small" onClick={closePictoModal}>
                  Cerrar
                </IonButton>
              </div>
              <div className="picto-grid">
                {PICTOGRAMS.map((picto) => (
                  <div key={picto.id} className="picto-option" onClick={() => selectPictogram(picto.id)}>
                    <IonImg src={picto.image} alt={picto.name} />
                    <span>{picto.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal de avatares - tapa todo el formulario */}
        {showAvatarModal && (
          <div className="avatar-picker-overlay" onClick={closeAvatarModal}>
            <div
              ref={avatarPickerRef}
              className={`avatar-picker ${
                isAvatarModalVisible ? 'avatar-picker-visible' : ''
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="picto-picker-header">
                <h3>Selecciona un avatar</h3>
                <IonButton fill="clear" size="small" onClick={closeAvatarModal}>
                  Cerrar
                </IonButton>
              </div>
              <div className="picto-grid">
                {AVATAR_OPTIONS.map((avatar) => (
                  <div
                    key={avatar.id}
                    className="picto-option"
                    onClick={() => handleAvatarSelect(avatar.id)}
                  >
                    <IonImg src={avatar.image} alt={avatar.name} />
                    <span>{avatar.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />

        <IonToast
          isOpen={isToastOpen}
          message={toastMessage}
          color={toastColor}
          duration={3000}
          onDidDismiss={() => setIsToastOpen(false)}
        />
      </div>
    </IonPage>
  );
}