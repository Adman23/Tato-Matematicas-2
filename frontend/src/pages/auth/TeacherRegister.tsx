import './TeacherRegister.css';

import {
  IonPage,
  IonInput,
  IonButton,
  IonIcon,
  IonToast,
} from '@ionic/react';
import {
  checkmarkOutline,
  closeOutline,
  eyeOutline,
  eyeOffOutline,
  personCircleOutline,
} from 'ionicons/icons';
import { useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { authAPI, uploadImage } from '../../lib/api';
import SimpleHeaderAdmin from '../admin/components/SimpleHeaderAdmin';
import { useAuth } from '../../contexts/AuthContext';

const DEFAULT_AVATAR = "https://ionicframework.com/docs/img/demos/avatar.svg";

export default function TeacherRegister() {
  const history = useHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('danger');

  const isUserNameValid = userName.trim().length >= 3;
  const isPasswordValid = password.length >= 6;
  const doPasswordsMatch = password === confirmPassword;
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let errorMsg = '';
    if (!isUserNameValid) errorMsg += 'El nombre de usuario debe tener al menos 3 caracteres. ';
    if (!isPasswordValid) errorMsg += 'La contraseña debe tener al menos 6 caracteres. ';
    if (!doPasswordsMatch) errorMsg += 'Las contraseñas no coinciden. ';

    if (errorMsg) {
      setToastMessage(errorMsg);
      setToastColor('danger');
      setIsToastOpen(true);
      return;
    }

    try {
      let photoUrl = DEFAULT_AVATAR;

      if (selectedImage) {
        const uniqueFilename = `${userName.trim()}_${Date.now()}_${selectedImage.name}`;
        photoUrl = await uploadImage(selectedImage, uniqueFilename);
      }

      await authAPI.register({
        username: userName,
        password: password,
        role: 'teacher',
        photo_url: photoUrl,
      });

      setToastMessage('Registro completado correctamente 🎉');
      setToastColor('success');
      setIsToastOpen(true);

      setTimeout(() => history.push('/tutor-dashboard'), 1500);
    } catch (err: any) {
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleConfirmClick = () => {
    let errorMsg = '';
    if (!isUserNameValid) errorMsg += 'El nombre de usuario debe tener al menos 3 caracteres. ';
    if (!isPasswordValid) errorMsg += 'La contraseña debe tener al menos 6 caracteres. ';
    if (!doPasswordsMatch) errorMsg += 'Las contraseñas no coinciden. ';

    if (errorMsg) {
      setToastMessage(errorMsg);
      setToastColor('danger');
      setIsToastOpen(true);
      return;
    }
    // Si todo es válido, envía el formulario
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleCancel = () => {
    setUserName('');
    setPassword('');
    setConfirmPassword('');
    setSelectedImage(null);
    history.push('/admin/profesores');
  };

  return (
    <IonPage>
      {user && user.role === 'admin' && (
        <SimpleHeaderAdmin adminName={user.username} />
      )}
      <div className="teacher-register-main-container">
        <div className="teacher-register-form-card">
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
                  <IonIcon icon={isUserNameValid ? checkmarkOutline : closeOutline} />
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
                    slot="end"
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
                    slot="end"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            <div className="teacher-register-form-right">
              <div className="teacher-register-field-wrapper">
                <div className="teacher-register-field-label">Foto de perfil</div>
                <div className="teacher-register-profile-image-container" onClick={triggerFileInput}>
                  {selectedImage ? (
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Perfil"
                      className="teacher-register-selected-image"
                    />
                  ) : (
                    <IonIcon icon={personCircleOutline} className="teacher-register-profile-placeholder" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </div>

          <div className="teacher-register-form-button-container">
            <IonButton
              expand="block"
              className={`teacher-register-confirm-button ${
                !isUserNameValid || !isPasswordValid || !doPasswordsMatch
                  ? 'teacher-register-confirm-button--disabled'
                  : ''
              }`}
              onClick={handleConfirmClick}
            >
              Confirmar
            </IonButton>
            <IonButton expand="block" className="teacher-register-cancel-button" onClick={handleCancel}>
              Cancelar
            </IonButton>
          </div>
        </div>

        <IonToast
          isOpen={isToastOpen}
          message={toastMessage}
          color={toastColor}
          duration={3000}
          onDidDismiss={() => setIsToastOpen(false)}
          className="teacher-register-toast"
        />
      </div>
    </IonPage>
  );
}