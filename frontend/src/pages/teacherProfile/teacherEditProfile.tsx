import './teacherEditProfile.css';

import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonToast,
  IonImg,
  useIonViewWillEnter,
  IonSpinner,
  useIonRouter, // ✅ Añadido
} from '@ionic/react';
import {
  checkmarkOutline,
  closeOutline,
  eyeOutline,
  eyeOffOutline,
  person,
  addOutline,
  arrowBack,    
  arrowForward, 
} from 'ionicons/icons';
import { useState, useRef, useEffect } from 'react';
import { authAPI, uploadImage, getImages } from '../../lib/api';
import HeaderTeacherItem from './components/HeaderTeacherItem';
import { useAuth } from '../../contexts/AuthContext';
import { createPortal } from 'react-dom';

const DEFAULT_AVATAR = "https://ionicframework.com/docs/img/demos/avatar.svg";

export default function TeacherEditProfile() {
  const router = useIonRouter(); // ✅ Reemplaza useHistory
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

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('danger');

  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const usernameCheckIdRef = useRef(0);

  const [avatarOptions, setAvatarOptions] = useState<{ id: string; name: string; imageUrl: string }[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(true);

  const { user, logout } = useAuth();

  useIonViewWillEnter(() => {
    if (user) {
      setUserName(user.username || '');
      setAvatarPreview(user.photo_url || DEFAULT_AVATAR);
      setSelectedAvatar(user.photo_url ? 'custom' : '');
    }
  });

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
        setShowToast(true);
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

    if (trimmed === user?.username) {
      setIsUsernameAvailable(true);
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
  }, [userName, user?.username]);

  const isUserNameLong = userName.trim().length >= 3;
  const isUserNameSpaceless = !userName.includes(' ');
  const isPasswordLong = password.length >= 6;
  const isPasswordValid = /\d/.test(password);
  const doPasswordsMatch = password === confirmPassword;
  const canSubmit =
    isUserNameLong &&
    isUserNameSpaceless &&
    (userName === user?.username || isUsernameAvailable === true) &&
    (password === '' || (isPasswordLong && isPasswordValid && doPasswordsMatch));

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

  const updateAvatarModalPosition = () => {
    if (showAvatarModal && formCardRef.current && avatarPickerRef.current) {
      const cardRect = formCardRef.current.getBoundingClientRect();
      const modal = avatarPickerRef.current;
      
      modal.style.position = 'fixed';
      modal.style.left = `${cardRect.left}px`;
      modal.style.top = `${cardRect.top}px`;
      modal.style.width = `${cardRect.width}px`;
      modal.style.height = `${cardRect.height}px`;
      modal.style.zIndex = '1002';
      modal.style.margin = '0'; 
    }
  };

  useEffect(() => {
    if (showAvatarModal) {
      const id = requestAnimationFrame(updateAvatarModalPosition);
      const handleResize = () => updateAvatarModalPosition();
      window.addEventListener('resize', handleResize);
      return () => {
        cancelAnimationFrame(id);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showAvatarModal]);

  const handleLogout = async () => {
    await logout();
    router.push('/', 'none', 'replace'); // ✅ sin animación, reemplaza historial
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let errorMsg = '';
    if (!isUserNameLong) errorMsg += 'El nombre de usuario debe tener al menos 3 caracteres. ';
    if (!isUserNameSpaceless) errorMsg += 'El nombre de usuario no puede contener espacios. ';
    if (userName !== user?.username && isUsernameAvailable === false) errorMsg += 'El nombre de usuario ya está en uso. ';
    if (password !== '' && !isPasswordLong) errorMsg += 'La contraseña debe tener al menos 6 caracteres. ';
    if (password !== '' && !isPasswordValid) errorMsg += 'La contraseña debe contener al menos un número. ';
    if (password !== '' && !doPasswordsMatch) errorMsg += 'Las contraseñas no coinciden. ';

    if (errorMsg) {
      setToastMessage(errorMsg);
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    try {
      let photoUrl = user?.photo_url || DEFAULT_AVATAR;

      if (avatarOptions.some(a => a.id === selectedAvatar)) {
        const selected = avatarOptions.find(a => a.id === selectedAvatar);
        photoUrl = selected?.imageUrl || DEFAULT_AVATAR;
      } else if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        const uniqueFilename = `${userName.trim()}_${Date.now()}_${file.name}`;
        photoUrl = await uploadImage(file, uniqueFilename);
      }

      if (user) {
        const updatedUser = {
          ...user,
          username: userName,
          photo_url: photoUrl,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setToastMessage('¡Perfil actualizado correctamente!');
      setToastColor('success');
      setShowToast(true);

      // Opcional: ir a color tras guardar
      // setTimeout(() => {
      //   router.push('/teacheredit/color', 'none', 'push');
      // }, 2000);
    } catch (err: any) {
      console.error('Error al actualizar perfil:', err);
      setToastMessage('Error al actualizar perfil');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  const handleCancel = () => {
    setUserName(user?.username || '');
    setPassword('');
    setConfirmPassword('');
    setAvatarPreview(user?.photo_url || DEFAULT_AVATAR);
    router.push('/teacher/profile', 'none', 'pop'); // ✅ volver sin animación
  };

  if (!user) {
    return (
      <IonPage>
        <IonContent className="ion-text-center">
          <div className="teacher-edit-profile-spinner">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage style={{ backgroundColor: '#f4f5f8' }}>
      <HeaderTeacherItem
        teacherName={user.username}
        teacherAvatar={user.photo_url || "/assets/pictograms/user_default.png"}
        onLogoutClick={handleLogout}
      />

      <IonContent className="teacher-edit-profile-content">
        <div className="teacher-edit-profile-layout-wrapper">
          
          {/* ⬅️ Flecha Izquierda: Volver sin animación */}
          <div 
            className="teacher-edit-profile-side-arrow left disabled"
            onClick={() => router.push('/teacheredit/profile', 'none', 'pop')}
          >
            <IonIcon icon={arrowBack} />
          </div>

          <div className="teacher-edit-profile-main-container">
            <div className="teacher-edit-profile-form-card" ref={formCardRef}>
              <div className="teacher-edit-profile-form-container-header">
                <h2>Edición</h2>
                <p>Actualice sus datos, por favor</p>
              </div>

              <div className="teacher-edit-profile-grid-content">
                <div className="teacher-edit-profile-form-left">
                  <div className="teacher-edit-profile-field-wrapper">
                    <div className="teacher-edit-profile-field-label">Nombre completo*</div>
                    <div className="teacher-edit-profile-input-with-icon">
                      <IonInput
                        placeholder={userName ? "" : "Escribir aquí..."}
                        value={userName}
                        onIonInput={(e) => setUserName(e.detail.value || '')}
                        className="teacher-edit-profile-input-item"
                      />
                      <IonIcon icon={
                        userName.trim().length === 0 ? closeOutline :
                          (!isUserNameLong || !isUserNameSpaceless) ? closeOutline :
                            isUsernameAvailable === true ? checkmarkOutline : closeOutline
                      } />
                    </div>
                  </div>

                  <div className="teacher-edit-profile-field-wrapper">
                    <div className="teacher-edit-profile-field-label">Contraseña</div>
                    <div className="teacher-edit-profile-input-with-icon">
                      <IonInput
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onIonInput={(e) => setPassword(e.detail.value || '')}
                        className="teacher-edit-profile-input-item"
                      />
                      <IonIcon
                        icon={showPassword ? eyeOffOutline : eyeOutline}
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <div className="teacher-edit-profile-field-wrapper">
                    <div className="teacher-edit-profile-field-label">Repita la contraseña</div>
                    <div className="teacher-edit-profile-input-with-icon">
                      <IonInput
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onIonInput={(e) => setConfirmPassword(e.detail.value || '')}
                        className="teacher-edit-profile-input-item"
                      />
                      <IonIcon
                        icon={showConfirmPassword ? eyeOffOutline : eyeOutline}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="teacher-edit-profile-form-right">
                  <div className="teacher-edit-profile-field-wrapper">
                    <div className="teacher-edit-profile-field-label">Seleccione una foto</div>
                    <div className="teacher-edit-profile-profile-image-container" onClick={openAvatarModal}>
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Perfil"
                          className="teacher-edit-profile-selected-image"
                        />
                      ) : (
                        <IonIcon icon={person} className="teacher-edit-profile-profile-placeholder" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="teacher-edit-profile-form-button-container">
                <IonButton
                  expand="block"
                  className="teacher-edit-profile-cancel-button"
                  onClick={handleCancel}
                >
                  Cancelar
                </IonButton>
                <IonButton
                  expand="block"
                  className={`teacher-edit-profile-confirm-button ${!canSubmit ? 'teacher-edit-profile-confirm-button--disabled' : ''}`}
                  onClick={handleSubmit}
                >
                  Guardar cambios
                </IonButton>
              </div>
            </div>
          </div>

          {/* ➡️ Flecha Derecha: Ir a color SIN animación, pero con historial (push) */}
          <div 
            className="teacher-edit-profile-side-arrow right"
            onClick={() => router.push('/teacheredit/color', 'none', 'push')}
          >
            <IonIcon icon={arrowForward} />
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
          isOpen={showToast}
          message={toastMessage}
          color={toastColor}
          duration={3000}
          onDidDismiss={() => setShowToast(false)}
          className="teacher-edit-profile-toast"
        />
      </IonContent>

      {/* Modal de selección de avatar */}
      {showAvatarModal &&
        createPortal(
          <div className="teacher-edit-profile-avatar-picker-overlay" onClick={closeAvatarModal}>
            <div
              ref={avatarPickerRef}
              className={`teacher-edit-profile-avatar-picker ${isAvatarModalVisible ? 'teacher-edit-profile-avatar-picker-visible' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="teacher-edit-profile-picto-picker-header">
                <h3>Selecciona un avatar</h3>
                <IonButton fill="clear" size="small" onClick={closeAvatarModal}>
                  Cerrar
                </IonButton>
              </div>
              <div className="teacher-edit-profile-picto-grid">
                <div className="teacher-edit-profile-picto-option" onClick={triggerFileInput}>
                  <div className="teacher-edit-profile-upload-avatar-placeholder">
                    <IonIcon icon={addOutline} className="teacher-edit-profile-upload-icon" />
                  </div>
                  <span>Subir imagen</span>
                </div>

                {loadingAvatars ? (
                  <div className="teacher-edit-profile-avatar-loading">Cargando avatares...</div>
                ) : (
                  avatarOptions.map((avatar) => (
                    <div
                      key={avatar.id}
                      className="teacher-edit-profile-picto-option"
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