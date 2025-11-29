import './teacherEditProfile.css';

import {
  IonPage, IonContent, IonInput, IonButton, IonIcon,
  IonToast, IonImg, IonSpinner, useIonRouter,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  useIonViewWillEnter, // Detecta cuando entras
  useIonViewDidLeave,  // Detecta cuando sales
} from '@ionic/react';
import {
  checkmarkOutline, closeOutline, eyeOutline, eyeOffOutline,
  person, addOutline, checkmarkCircle
} from 'ionicons/icons';
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// Importación de tipos y APIs
import { authAPI, uploadImage, getImages, userAPI, type User } from '../../lib/api';
import HeaderTeacherItem from './components/HeaderTeacherItem';
import { useAuth } from '../../contexts/AuthContext';

const DEFAULT_AVATAR = "https://ionicframework.com/docs/img/demos/avatar.svg";

export default function TeacherEditProfile() {
  const router = useIonRouter();
  const { user, logout, updateUser } = useAuth();
  
  // Refs para DOM
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarPickerRef = useRef<HTMLDivElement>(null);
  const formCardRef = useRef<HTMLDivElement>(null);

  // --- ESTADOS ---
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdateSuccess, setIsUpdateSuccess] = useState(false); 
  
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);

  // Imágenes
  const [selectedAvatar, setSelectedAvatar] = useState<string>(''); 
  const [avatarPreview, setAvatarPreview] = useState<string>(DEFAULT_AVATAR); 
  //const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(DEFAULT_AVATAR);

  // Feedback
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('danger');
  
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const usernameCheckIdRef = useRef(0);
  
  const [avatarOptions, setAvatarOptions] = useState<{ id: string; name: string; imageUrl: string }[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(true);

  // --- CICLO DE VIDA IONIC (LA SOLUCIÓN) ---

  // 1. AL ENTRAR: Sincronizar datos por si cambiaron fuera
  useIonViewWillEnter(() => {
    if (user) {
      setUserName(user.username || '');
      setAvatarPreview(user.photo_url || DEFAULT_AVATAR);
      //setSelectedAvatarUrl(user.photo_url || DEFAULT_AVATAR);
    }
  });

  // 2. AL SALIR: Resetear el estado de "Éxito" para que la próxima vez salga el formulario
  useIonViewDidLeave(() => {
    setIsUpdateSuccess(false); 
    setPassword('');
    setConfirmPassword('');
    setShowAvatarModal(false);
  });

  // --- EFECTOS ---

  // Carga inicial estándar
  useEffect(() => {
    if (user) {
      setUserName(user.username || '');
      setAvatarPreview(user.photo_url || DEFAULT_AVATAR);
      //setSelectedAvatarUrl(user.photo_url || DEFAULT_AVATAR);
    }
  }, [user]);

  // Cargar avatares
  useEffect(() => {
    getImages()
      .then(imagesMap => {
        const options = Object.entries(imagesMap).map(([filename, url]) => ({
          id: filename,
          name: filename.replace('.png', '').replace(/_/g, ' ').split(' ')[0],
          imageUrl: url as string,
        }));
        setAvatarOptions(options);
      })
      .catch(err => console.error('Error cargando avatares:', err))
      .finally(() => setLoadingAvatars(false));
  }, []);

  // Validación usuario
  useEffect(() => {
    const trimmed = userName.trim();
    if (trimmed.length < 3 || trimmed.includes(' ')) {
      setIsUsernameAvailable(false);
      return;
    }
    if (user && trimmed === user.username) {
      setIsUsernameAvailable(true);
      return;
    }

    const currentId = ++usernameCheckIdRef.current;
    const handler = setTimeout(() => {
      authAPI.checkUsername(trimmed)
        .then(res => {
          if (currentId === usernameCheckIdRef.current) setIsUsernameAvailable(!res.exists);
        })
        .catch(() => {
          if (currentId === usernameCheckIdRef.current) setIsUsernameAvailable(false);
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
    (userName === (user?.username || '') || isUsernameAvailable === true) &&
    (password === '' || (isPasswordLong && isPasswordValid && doPasswordsMatch));

  // --- HANDLERS ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (avatarPreview && !avatarPreview.startsWith('http')) URL.revokeObjectURL(avatarPreview);
      
      setSelectedAvatar(file.name);
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
      //setSelectedAvatarUrl(objectUrl);
      closeAvatarModal();
    }
  };

  const handleAvatarSelect = (avatarId: string) => {
    if (avatarPreview && !avatarPreview.startsWith('http')) URL.revokeObjectURL(avatarPreview);
    
    const selected = avatarOptions.find(a => a.id === avatarId);
    const url = selected?.imageUrl || DEFAULT_AVATAR;
    
    setSelectedAvatar(avatarId);
    setAvatarPreview(url);
    //setSelectedAvatarUrl(url);
    closeAvatarModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let errorMsg = '';
    if (!isUserNameLong) errorMsg += 'Nombre: min 3 caracteres. ';
    if (!isUserNameSpaceless) errorMsg += 'Nombre: sin espacios. ';
    if (userName !== user.username && isUsernameAvailable === false) errorMsg += 'Nombre en uso. ';
    if (password && (!isPasswordLong || !isPasswordValid)) errorMsg += 'Contraseña insegura. ';
    if (password && !doPasswordsMatch) errorMsg += 'Las contraseñas no coinciden. ';

    if (errorMsg) {
      showFeedback(errorMsg, 'danger');
      return;
    }

    try {
      let filenameToSend = null;
      //let fullUrlForContext = user.photo_url || DEFAULT_AVATAR;

      if (selectedAvatar && avatarOptions.some(a => a.id === selectedAvatar)) {
        filenameToSend = selectedAvatar; 
        //fullUrlForContext = selectedAvatarUrl; 
      } 
      else if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        const sanitize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "");
        const uniqueFilename = `${sanitize(userName.trim())}_${Date.now()}_${sanitize(file.name)}`;
        
        filenameToSend = await uploadImage(file, uniqueFilename);
        //fullUrlForContext = avatarPreview; 
      }

      const payload: any = {};
      if (userName !== user.username) payload.username = userName;
      if (password) payload.password = password;
      if (filenameToSend) payload.photo_url = filenameToSend;

      if (Object.keys(payload).length === 0) {
        showFeedback('No se detectaron cambios.', 'warning');
        return;
      }

      await userAPI.updateUser(user.id, payload);
      
      // Re-fetch para asegurar datos y URL
      const freshUser = await authAPI.fetchBasicUserInfo();
      const timestamp = Date.now();
      let freshUrl = freshUser.photo_url || DEFAULT_AVATAR;
      freshUrl = freshUrl.includes('?') ? `${freshUrl}&t=${timestamp}` : `${freshUrl}?t=${timestamp}`;

      const userForContext: User = {
        ...freshUser,
        photo_url: freshUrl
      };

      updateUser(userForContext);
      setIsUpdateSuccess(true);
      setPassword('');
      setConfirmPassword('');

    } catch (err: any) {
      console.error('Update Error:', err);
      showFeedback(err.response?.data?.detail || 'Error al actualizar perfil', 'danger');
    }
  };

  // ✅ Navegación corregida: al aceptar, volvemos atrás.
  const handleSuccessAccept = () => {
    window.location.href = '/teacher/profile';
  };

  const handleCancel = () => {
    setPassword('');
    setConfirmPassword('');
    router.goBack();
  };

  const handleLogout = async () => {
    await logout();
    router.push('/', 'none', 'replace');
  };

  const showFeedback = (msg: string, color: 'success' | 'danger' | 'warning') => {
    setToastMessage(msg); setToastColor(color); setShowToast(true);
  };
  
  const triggerFileInput = () => fileInputRef.current?.click();
  const openAvatarModal = () => { setShowAvatarModal(true); requestAnimationFrame(() => setIsAvatarModalVisible(true)); };
  const closeAvatarModal = () => { setIsAvatarModalVisible(false); setTimeout(() => setShowAvatarModal(false), 200); };

  const updateModalPos = useCallback(() => {
    if (showAvatarModal && formCardRef.current && avatarPickerRef.current) {
      const rect = formCardRef.current.getBoundingClientRect();
      const modal = avatarPickerRef.current;
      Object.assign(modal.style, {
        position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`,
        width: `${rect.width}px`, height: `${rect.height}px`, zIndex: '1002'
      });
    }
  }, [showAvatarModal]);

  useLayoutEffect(() => {
    if (showAvatarModal) {
      const id = requestAnimationFrame(updateModalPos);
      window.addEventListener('resize', updateModalPos);
      return () => { cancelAnimationFrame(id); window.removeEventListener('resize', updateModalPos); };
    }
  }, [showAvatarModal, updateModalPos]);

  if (!user) return <IonPage><IonContent className="ion-text-center"><IonSpinner name="crescent" /></IonContent></IonPage>;

  return (
    <IonPage style={{ backgroundColor: '#f4f5f8' }}>
      <HeaderTeacherItem
        teacherName={user.username || 'Profesor'}
        teacherAvatar={user.photo_url || DEFAULT_AVATAR}
        onLogoutClick={handleLogout}
      />

      <IonContent className="teacher-edit-profile-content">
        <div className="teacher-edit-profile-main-container">
          
          {isUpdateSuccess ? (
            <IonCard className="teacher-edit-profile-confirmation-card">
              <IonCardHeader className="teacher-edit-profile-confirmation-header">
                <div className="teacher-edit-profile-confirmation-icon-container">
                  <IonIcon icon={checkmarkCircle} className="teacher-edit-profile-confirmation-icon" />
                </div>
                <IonCardTitle className="teacher-edit-profile-confirmation-title">Perfil actualizado</IonCardTitle>
              </IonCardHeader>
              <IonCardContent className="teacher-edit-profile-confirmation-message">
                Sus datos se han guardado correctamente.
              </IonCardContent>
              <div className="teacher-edit-profile-confirmation-button-container">
                <IonButton expand="block" className="teacher-edit-profile-confirmation-button" onClick={handleSuccessAccept}>
                  Aceptar
                </IonButton>
              </div>
            </IonCard>
          ) : (
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
                        value={userName}
                        placeholder={userName ? "" : "Escribir aquí..."}
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
                      <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }} />
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
                      <IonIcon icon={showConfirmPassword ? eyeOffOutline : eyeOutline} onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ cursor: 'pointer' }} />
                    </div>
                  </div>
                </div>

                <div className="teacher-edit-profile-form-right">
                  <div className="teacher-edit-profile-field-wrapper">
                    <div className="teacher-edit-profile-field-label">Seleccione una foto</div>
                    <div className="teacher-edit-profile-profile-image-container" onClick={openAvatarModal}>
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Perfil" className="teacher-edit-profile-selected-image" />
                      ) : (
                        <IonIcon icon={person} className="teacher-edit-profile-profile-placeholder" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="teacher-edit-profile-form-button-container">
                <IonButton expand="block" className="teacher-edit-profile-cancel-button" onClick={handleCancel}>Cancelar</IonButton>
                <IonButton
                  expand="block"
                  className={`teacher-edit-profile-confirm-button ${!canSubmit ? 'teacher-edit-profile-confirm-button--disabled' : ''}`}
                  onClick={handleSubmit}
                >
                  Guardar cambios
                </IonButton>
              </div>
            </div>
          )}
        </div>

        <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }} />
        <IonToast isOpen={showToast} message={toastMessage} color={toastColor} duration={3000} onDidDismiss={() => setShowToast(false)} className="teacher-edit-profile-toast" />

        {showAvatarModal && !isUpdateSuccess && createPortal(
          <div className="teacher-edit-profile-avatar-picker-overlay" onClick={closeAvatarModal}>
            <div
              ref={avatarPickerRef}
              className={`teacher-edit-profile-avatar-picker ${isAvatarModalVisible ? 'teacher-edit-profile-avatar-picker-visible' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="teacher-edit-profile-picto-picker-header">
                <h3>Selecciona un avatar</h3>
                <IonButton fill="clear" size="small" onClick={closeAvatarModal}>Cerrar</IonButton>
              </div>
              <div className="teacher-edit-profile-picto-grid">
                <div className="teacher-edit-profile-picto-option" onClick={triggerFileInput}>
                  <div className="teacher-edit-profile-upload-avatar-placeholder">
                    <IonIcon icon={addOutline} className="teacher-edit-profile-upload-icon" />
                  </div>
                  <span>Subir imagen</span>
                </div>
                {!loadingAvatars && avatarOptions.map((avatar) => (
                  <div key={avatar.id} className="teacher-edit-profile-picto-option" onClick={() => handleAvatarSelect(avatar.id)}>
                    <IonImg src={avatar.imageUrl} alt={avatar.name} />
                    <span>{avatar.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.getElementById('modal-root') || document.body
        )}
      </IonContent>
    </IonPage>
  );
}