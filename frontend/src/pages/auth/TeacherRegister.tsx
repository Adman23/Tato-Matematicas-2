// src/pages/TeacherRegister.tsx

import './TeacherRegister.css';

import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonToast,
  IonImg,
  useIonRouter
} from '@ionic/react';
import {
  checkmarkOutline,
  closeOutline,
  eyeOutline,
  eyeOffOutline,
  person,
  addOutline,
} from 'ionicons/icons';
import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { authAPI, uploadImage, getImages } from '../../lib/api';
import SimpleHeaderAdmin from '../admin/components/SimpleHeaderAdmin';
import { useAuth } from '../../contexts/AuthContext';
import { createPortal } from 'react-dom';
import ConfirmationModal from '../global_components/ConfirmationModal';

const DEFAULT_AVATAR = "https://ionicframework.com/docs/img/demos/avatar.svg";

export default function TeacherRegister() {
  const router = useIonRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarPickerRef = useRef<HTMLDivElement>(null);
  const formCardRef = useRef<HTMLDivElement>(null);

  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [avatarPreview, setAvatarPreview] = useState<string>(DEFAULT_AVATAR);

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);

  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('danger');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const usernameCheckIdRef = useRef(0);

  const [avatarOptions, setAvatarOptions] = useState<{ id: string; name: string; imageUrl: string }[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(true);

  const { user } = useAuth();

  const isUserNameLong = userName.trim().length >= 3;
  const isUserNameSpaceless = !userName.includes(' ');
  const isPasswordLong = password.length >= 6;
  const isPasswordValid = /\d/.test(password);
  const doPasswordsMatch = password === confirmPassword;
  const isAvatarSelected = selectedAvatar !== '';

  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(DEFAULT_AVATAR);

  useEffect(() => {
    const loadAvatars = async () => {
      try {
        const imagesMap = await getImages();
        const options = Object.entries(imagesMap)
          .filter(([filename]) => filename.toLowerCase().includes('default'))
          .map(([filename, url]) => ({
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

  useEffect(() => {
    const trimmed = userName.trim();

    if (trimmed.length < 3 || trimmed.includes(' ')) {
      setIsUsernameAvailable(false);
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

  const canSubmit =
    isUserNameLong &&
    isUserNameSpaceless &&
    isUsernameAvailable === true &&
    isPasswordLong &&
    isPasswordValid &&
    doPasswordsMatch &&
    isAvatarSelected;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let errorMsg = '';
    if (!isUserNameLong) errorMsg += 'El nombre de usuario debe tener al menos 3 caracteres. ';
    if (!isUserNameSpaceless) errorMsg += 'El nombre de usuario no puede contener espacios. ';
    if (isUsernameAvailable === false) errorMsg += 'El nombre de usuario ya está en uso. ';
    if (!isPasswordLong) errorMsg += 'La contraseña debe tener al menos 6 caracteres. ';
    if (!isPasswordValid) errorMsg += 'La contraseña debe contener al menos un número. ';
    if (!doPasswordsMatch) errorMsg += 'Las contraseñas no coinciden. ';
    if (!isAvatarSelected) errorMsg += 'Debe seleccionar una imagen de perfil. ';

    if (errorMsg) {
      setToastMessage(errorMsg);
      setToastColor('danger');
      setIsToastOpen(true);
      return;
    }

    try {
      setIsLoading(true);
      let photoUrl = DEFAULT_AVATAR;

      // Si se seleccionó un avatar del modal, usamos su URL completa
      if (avatarOptions.some(a => a.id === selectedAvatar)) {
        photoUrl = selectedAvatarUrl;
      } else if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        const uniqueFilename = `${userName.trim()}_${Date.now()}_${file.name}`;
        photoUrl = await uploadImage(file, uniqueFilename);
      }

      const passwordLength = password.length;

      await authAPI.register({
        username: userName,
        password: password,
        password_length: passwordLength,
        role: 'teacher',
        photo_url: photoUrl,
      });

      setIsLoading(false);
      setShowConfirmationModal(true);
    } catch (err: any) {
      setIsLoading(false);
      console.error('Error en el registro:', err);
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Error al registrar tutor';
      setToastMessage(message);
      setToastColor('danger');
      setIsToastOpen(true);
    }
  };

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
    // Guardamos tanto el ID como la URL completa
    setSelectedAvatar(avatarId);
    setAvatarPreview(selected?.imageUrl || DEFAULT_AVATAR);
    setSelectedAvatarUrl(selected?.id || DEFAULT_AVATAR);
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

  const handleCancel = () => {
    setUserName('');
    setPassword('');
    setConfirmPassword('');
    setSelectedAvatar('');
    setAvatarPreview(DEFAULT_AVATAR);
    if (showAvatarModal) closeAvatarModal();
    router.push('/admin/dashboard/profesores', 'none');
  };

  return (
    <IonPage>
      <IonContent className="teacher-register-ion-content">
        {user && user.role === 'admin' && (
          <SimpleHeaderAdmin adminName={user.username} />
        )}
        {!showConfirmationModal && !isLoading && (
        <div className="teacher-register-main-container">
        <div className="teacher-register-form-card" ref={formCardRef}>
          <div className="teacher-register-form-container-header">
            <h2>Registro</h2>
            <p>Rellene los siguientes campos, por favor</p>
          </div>

          <div className="teacher-register-grid-content">
            <div className="teacher-register-form-left">
              <div className="teacher-register-field-wrapper">
                <div className="teacher-register-field-label">Usuario *</div>
                <div className="teacher-register-input-with-icon">
                  <IonInput
                    placeholder="Escribir aquí..."
                    value={userName}
                    onIonInput={(e) => setUserName(e.detail.value || '')}
                    className="teacher-register-input-item"
                  />
                  <IonIcon icon={
                    userName.trim().length === 0 ? closeOutline :
                      (!isUserNameLong || !isUserNameSpaceless) ? closeOutline :
                        isUsernameAvailable === true ? checkmarkOutline : closeOutline
                  } />
                </div>
              </div>

              <div className="teacher-register-field-wrapper">
                <div className="teacher-register-field-label">Contraseña *</div>
                <div className="teacher-register-input-with-icon">
                  <IonInput
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onIonInput={(e) => setPassword(e.detail.value || '')}
                    className="teacher-register-input-item"
                  />
                  <IonIcon
                    icon={showPassword ? eyeOffOutline : eyeOutline}
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div className="teacher-register-field-wrapper">
                <div className="teacher-register-field-label">Repita la contraseña *</div>
                <div className="teacher-register-input-with-icon">
                  <IonInput
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onIonInput={(e) => setConfirmPassword(e.detail.value || '')}
                    className="teacher-register-input-item"
                  />
                  <IonIcon
                    icon={showConfirmPassword ? eyeOffOutline : eyeOutline}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            <div className="teacher-register-form-right">
              <div className="teacher-register-field-wrapper">
                <div className="teacher-register-field-label">Foto de perfil *</div>
                <div className="teacher-register-profile-image-container" onClick={openAvatarModal}>
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Perfil"
                      className="teacher-register-selected-image"
                    />
                  ) : (
                    <IonIcon icon={person} className="teacher-register-profile-placeholder" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="teacher-register-form-button-container">
            <IonButton
              expand="block"
              className={`teacher-register-confirm-button ${!canSubmit ? 'teacher-register-confirm-button--disabled' : ''
                }`}
              onClick={handleSubmit}
            >
              Confirmar
            </IonButton>
            <IonButton expand="block" className="teacher-register-cancel-button" onClick={handleCancel}>
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

        <IonToast
          isOpen={isToastOpen}
          message={toastMessage}
          color={toastColor}
          duration={3000}
          onDidDismiss={() => setIsToastOpen(false)}
          className="teacher-register-toast"
        />
      </div>
        )}
      </IonContent>

      {/* Modal de selección de avatar */}
      {!isLoading && showAvatarModal &&
        createPortal(
          <div className="teacher-register-avatar-picker-overlay" onClick={closeAvatarModal}>
            <div
              ref={avatarPickerRef}
              className={`teacher-register-avatar-picker ${isAvatarModalVisible ? 'teacher-register-avatar-picker-visible' : ''
                }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="teacher-register-picto-picker-header">
                <h3>Selecciona un avatar</h3>
                <IonButton fill="clear" size="small" onClick={closeAvatarModal}>
                  Cerrar
                </IonButton>
              </div>
              <div className="teacher-register-picto-grid">
                <div className="teacher-register-picto-option" onClick={triggerFileInput}>
                  <div className="teacher-register-upload-avatar-placeholder">
                    <IonIcon icon={addOutline} className="teacher-register-upload-icon" />
                  </div>
                  <span>Subir imagen</span>
                </div>

                {loadingAvatars ? (
                  <div className="teacher-register-avatar-loading">Cargando avatares...</div>
                ) : (
                  avatarOptions.map((avatar) => (
                    <div
                      key={avatar.id}
                      className="teacher-register-picto-option"
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

      {(showConfirmationModal || isLoading) && (
        <ConfirmationModal
          title="Profesor registrado"
          message="Profesor registrado con éxito."
          redirectPath="/admin/dashboard/profesores"
          isLoading={isLoading}
          loadingMessage="Registrando profesor..."
        />
      )}
    </IonPage>
  );
}