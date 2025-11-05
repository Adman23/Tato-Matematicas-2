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
import { personOutline, addOutline, closeOutline, checkmarkOutline } from 'ionicons/icons';
import { useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI, uploadImage, getImages } from '../../lib/api';
import { setupIonicReact } from '@ionic/react';
import SimpleHeaderAdmin from '../admin/components/SimpleHeaderAdmin';
import { createPortal } from 'react-dom';

setupIonicReact();

const PICTOGRAMS = [
  { id: 'perro', name: 'Perro', image: '/assets/pictograms/perro.png' },
  { id: 'gato', name: 'Gato', image: '/assets/pictograms/gato.png' },
  { id: 'tortuga', name: 'Tortuga', image: '/assets/pictograms/tortuga.png' },
  { id: 'león', name: 'León', image: '/assets/pictograms/león.png' },
  { id: 'elefante', name: 'Elefante', image: '/assets/pictograms/elefante.png' },
];

const MAX_PICTOGRAMS = 3;

const DEFAULT_AVATAR = "https://ionicframework.com/docs/img/demos/avatar.svg";

export default function StudentRegister() {
  const history = useHistory();
  const { register } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pictoPickerRef = useRef<HTMLDivElement>(null);
  const avatarPickerRef = useRef<HTMLDivElement>(null);
  const formCardRef = useRef<HTMLDivElement>(null);

  const [userName, setUserName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [avatarPreview, setAvatarPreview] = useState<string>(DEFAULT_AVATAR);
  const [pictograms, setPictograms] = useState<string[]>([]);

  const [showPictoModal, setShowPictoModal] = useState(false);
  const [isPictoModalVisible, setIsPictoModalVisible] = useState(false);

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);

  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('danger');

  const { user } = useAuth();

  const [avatarOptions, setAvatarOptions] = useState<{ id: string; name: string; imageUrl: string }[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(true);

  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const usernameCheckIdRef = useRef(0);

  const isUserNameLong = userName.trim().length >= 3;
  const isUserNameSpaceless = !userName.includes(' ');
  const isUsernameValid = isUserNameLong && isUserNameSpaceless && isUsernameAvailable === true;
  const hasExactlyThreePictograms = pictograms.length === 3;
  const isAvatarSelected = selectedAvatar !== '';
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(DEFAULT_AVATAR);

  useEffect(() => {
    const trimmed = userName.trim();

    if (trimmed.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }

    const currentId = ++usernameCheckIdRef.current;

    const handler = setTimeout(() => {
      authAPI.checkUsername(trimmed)
        .then(res => {
          if (currentId === usernameCheckIdRef.current) {
            setIsUsernameAvailable(!res.exists);
          }
        })
        .catch(() => {
          if (currentId === usernameCheckIdRef.current) {
            setIsUsernameAvailable(false);
          }
        });
    }, 400);

    return () => clearTimeout(handler);
  }, [userName]);

  useEffect(() => {
    const loadAvatars = async () => {
      try {
        const imagesMap = await getImages();
        const options = Object.entries(imagesMap).map(([filename, url]) => ({
          id: filename,
          name: filename.replace('.png', '').replace(/_/g, ' ').split(' ')[0],
          imageUrl: url as string,
        }));
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

    loadAvatars();
  }, []);

  const getUsernameIcon = () => {
    if (userName.trim().length === 0) return closeOutline;
    if (!isUserNameLong || !isUserNameSpaceless) return closeOutline;
    if (isUsernameAvailable === true) return checkmarkOutline;
    return closeOutline;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let errorMsg = '';

    if (!isUserNameLong) {
      errorMsg = 'El nombre de usuario debe tener al menos 3 caracteres.';
    } else if (!isUserNameSpaceless) {
      errorMsg = 'El nombre de usuario no puede contener espacios.';
    } else if (isUsernameAvailable === false) {
      errorMsg = 'El nombre de usuario ya está en uso.';
    } else if (!hasExactlyThreePictograms) {
      errorMsg = 'Debes seleccionar exactamente 3 pictogramas.';
    } else if (!isAvatarSelected) {
      errorMsg = 'Debes seleccionar una imagen de perfil.';
    }

    if (errorMsg) {
      setToastMessage(errorMsg);
      setToastColor('danger');
      setIsToastOpen(true);
      return;
    }

    try {
      const password = pictograms.join('-');
      let photoUrl = DEFAULT_AVATAR;

      // 👇 Si se seleccionó un avatar del modal, usamos su URL completa
      if (avatarOptions.some(a => a.id === selectedAvatar)) {
        photoUrl = selectedAvatarUrl;
      } else if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        const uniqueFilename = `${userName.trim()}_${Date.now()}_${file.name}`;
        photoUrl = await uploadImage(file, uniqueFilename);
      }

      await authAPI.register({
        username: userName,
        password: password,
        role: "student",
        photo_url: photoUrl, // ✅ Ahora siempre es una URL válida
      });

      setToastMessage('Estudiante registrado correctamente 🎉');
      setToastColor('success');
      setIsToastOpen(true);

      setTimeout(() => {
        window.location.href = '/admin/alumnos';
      }, 1500);
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

  const handleCancel = () => {
    setUserName('');
    setSelectedAvatar('');
    setAvatarPreview(DEFAULT_AVATAR);
    setPictograms([]);
    if (showPictoModal) closePictoModal();
    if (showAvatarModal) closeAvatarModal();
    history.replace('/admin/alumnos');
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
      if (avatarPreview && !avatarPreview.startsWith('http')) {
        URL.revokeObjectURL(avatarPreview);
      }
      setSelectedAvatar(file.name);
      setAvatarPreview(URL.createObjectURL(file));
      closeAvatarModal();
    }
  };

  const handleAvatarSelect = (avatarId: string) => {
    if (avatarPreview && !avatarPreview.startsWith('http')) {
      URL.revokeObjectURL(avatarPreview);
    }
    const selected = avatarOptions.find(a => a.id === avatarId);
    setSelectedAvatar(avatarId);
    setAvatarPreview(selected?.imageUrl || DEFAULT_AVATAR);
    setSelectedAvatarUrl(selected?.imageUrl || DEFAULT_AVATAR); // 👈 Guardamos la URL completa aquí
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

  // === POSICIONAMIENTO MODALES ===
  const updatePictoModalPosition = useCallback(() => {
    if (showPictoModal && formCardRef.current && pictoPickerRef.current) {
      const cardRect = formCardRef.current.getBoundingClientRect();
      const modal = pictoPickerRef.current;
      const modalHeight = Math.min(cardRect.height, 460);
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

  const getAvatarDisplayName = () => {
    const predefined = avatarOptions.find(a => a.id === selectedAvatar);
    if (predefined) {
      return predefined.name;
    }
    if (selectedAvatar && !selectedAvatar.includes('http')) {
      return selectedAvatar;
    }
    return 'Seleccionar imagen...';
  };

  const handleConfirmClick = () => {
    let errorMsg = '';

    if (!isUserNameLong) {
      errorMsg = 'El nombre de usuario debe tener al menos 3 caracteres.';
    } else if (!isUserNameSpaceless) {
      errorMsg = 'El nombre de usuario no puede contener espacios.';
    } else if (isUsernameAvailable === false) {
      errorMsg = 'El nombre de usuario ya está en uso.';
    } else if (!hasExactlyThreePictograms) {
      errorMsg = 'Debes seleccionar exactamente 3 pictogramas.';
    } else if (!isAvatarSelected) {
      errorMsg = 'Debes seleccionar una imagen de perfil.';
    }

    if (errorMsg) {
      setToastMessage(errorMsg);
      setToastColor('danger');
      setIsToastOpen(true);
      return;
    }

    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const avatarDisplayName = getAvatarDisplayName();

  return (
    <IonPage>
      {user && user.role === 'admin' && (
        <SimpleHeaderAdmin adminName={user.username} />
      )}

      <div className="student-register-main-container">
        <div className="student-register-form-card" ref={formCardRef}>
          <h2>Registro Alumno</h2>

          <div className="student-register-avatar-section">
            <div className="student-register-avatar-preview">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="student-register-avatar-image" />
              ) : (
                <IonIcon icon={personOutline} className="student-register-avatar-icon" />
              )}
            </div>

            <div className="student-register-field-wrapper">
              <div className="student-register-field-label">Avatar *</div>
              <div className="student-register-avatar-select-field" onClick={openAvatarModal}>
                <IonText>{avatarDisplayName}</IonText>
              </div>
            </div>
          </div>

          <div className="student-register-field-wrapper">
            <div className="student-register-field-label">Usuario *</div>
            <div className="student-register-input-with-icon">
              <IonInput
                className="student-register-input-item"
                placeholder="Escribir aquí..."
                value={userName}
                onIonInput={(e) => setUserName(e.detail.value || '')}
              />
              <IonIcon
                icon={getUsernameIcon()}
                className="student-register-input-status-icon"
              />
            </div>
          </div>

          <div className="student-register-field-wrapper">
            <div className="student-register-field-label">Código acceso *</div>
            <div className="student-register-pictogram-container">
              {pictograms.map((pictoId, index) => {
                const picto = PICTOGRAMS.find(p => p.id === pictoId);
                return (
                  <div key={index} className="student-register-pictogram-box" onClick={() => removePictogram(index)}>
                    <IonImg src={picto?.image} alt={picto?.name} />
                    <IonIcon icon={closeOutline} className="student-register-pictogram-remove" />
                  </div>
                );
              })}
              <div 
                className={`student-register-pictogram-add ${pictograms.length >= MAX_PICTOGRAMS ? 'disabled' : ''}`} 
                onClick={handleAddPictogram}
              >
                <IonIcon icon={addOutline} />
              </div>
            </div>
          </div>

          <div className="student-register-field-wrapper-buttons">
            <IonButton 
              expand="block" 
              className={`student-register-confirm-button ${
                !isUsernameValid || !hasExactlyThreePictograms || !isAvatarSelected 
                  ? 'student-register-confirm-button--disabled' 
                  : ''
              }`}
              onClick={handleConfirmClick}
            >
              Confirmar
            </IonButton>
            <IonButton expand="block" className="student-register-cancel-button" onClick={handleCancel}>
              Cancelar
            </IonButton>
          </div>
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />

        <div className="student-register-toast">
          <IonToast
            isOpen={isToastOpen}
            message={toastMessage}
            color={toastColor}
            duration={3000}
            onDidDismiss={() => setIsToastOpen(false)}
          />
        </div>
      </div>

      {/* Modales */}
      {showPictoModal &&
        createPortal(
          <div className="student-register-picto-picker-overlay" onClick={closePictoModal}>
            <div
              ref={pictoPickerRef}
              className={`student-register-picto-picker-custom ${
                isPictoModalVisible ? 'student-register-picto-picker-visible' : ''
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="student-register-picto-picker-header">
                <h3>Selecciona un pictograma</h3>
                <IonButton fill="clear" size="small" onClick={closePictoModal}>
                  Cerrar
                </IonButton>
              </div>
              <div className="student-register-picto-grid">
                {PICTOGRAMS.map((picto) => (
                  <div
                    key={picto.id}
                    className="student-register-picto-option"
                    onClick={() => selectPictogram(picto.id)}
                  >
                    <IonImg src={picto.image} alt={picto.name} />
                    <span>{picto.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.getElementById('modal-root')!
        )}

      {showAvatarModal &&
        createPortal(
          <div className="student-register-avatar-picker-overlay" onClick={closeAvatarModal}>
            <div
              ref={avatarPickerRef}
              className={`student-register-avatar-picker ${
                isAvatarModalVisible ? 'student-register-avatar-picker-visible' : ''
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="student-register-picto-picker-header">
                <h3>Selecciona un avatar</h3>
                <IonButton fill="clear" size="small" onClick={closeAvatarModal}>
                  Cerrar
                </IonButton>
              </div>
              <div className="student-register-picto-grid">
                <div className="student-register-picto-option" onClick={triggerFileInput}>
                  <div className="student-register-upload-avatar-placeholder">
                    <IonIcon icon={addOutline} className="student-register-upload-icon" />
                  </div>
                  <span>Subir imagen</span>
                </div>

                {loadingAvatars ? (
                  <div className="student-register-avatar-loading">Cargando avatares...</div>
                ) : (
                  avatarOptions.map((avatar) => (
                    <div
                      key={avatar.id}
                      className="student-register-picto-option"
                      onClick={() => handleAvatarSelect(avatar.id)}
                    >
                      <IonImg src={avatar.imageUrl} alt={avatar.name} />
                      <span>{avatar.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.getElementById('modal-root')!
        )}
    </IonPage>
  );
}