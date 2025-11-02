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

const DEFAULT_AVATAR = "https://ionicframework.com/docs/img/demos/avatar.svg";

export default function TeacherRegister() {
  const history = useHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('danger');

  const isFullNameValid = fullName.trim().length >= 3;
  const isUserNameValid = userName.trim().length >= 3;
  const isPasswordValid = password.length >= 6;
  const doPasswordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let errorMsg = '';
    if (!isFullNameValid) errorMsg += 'El nombre debe tener al menos 3 caracteres. ';
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

  return (
    <IonPage>
      <div className="teacher-register-main-container">
        <div className="teacher-register-title">
          <h1>Tato matematicas 2</h1>
        </div>

        <form className="teacher-register-grid-container" onSubmit={handleSubmit}>
          <div className="teacher-register-form-container-header">
            <h1>Registro</h1>
            <h2>Rellene los siguientes campos, por favor</h2>
          </div>

          <div className="teacher-register-grid-content">
            <div className="teacher-register-form-left">
              <div className="teacher-register-input-with-icon">
                <IonInput
                  label="Usuario *"
                  labelPlacement="floating"
                  placeholder="Escribir aquí..."
                  value={userName}
                  onIonInput={(e) => setUserName(e.detail.value || '')}
                  required
                  className="teacher-register-input"
                />
                <IonIcon icon={isUserNameValid ? checkmarkOutline : closeOutline} />
              </div>

              <div className="teacher-register-input-with-icon">
                <IonInput
                  label="Contraseña *"
                  labelPlacement="floating"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value || '')}
                  required
                />
                <IonIcon
                  icon={showPassword ? eyeOffOutline : eyeOutline}
                  slot="end"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: 'pointer' }}
                />
              </div>

              <div className="teacher-register-input-with-icon">
                <IonInput
                  label="Repita la contraseña *"
                  labelPlacement="floating"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onIonInput={(e) => setConfirmPassword(e.detail.value || '')}
                  required
                />
                <IonIcon
                  icon={showConfirmPassword ? eyeOffOutline : eyeOutline}
                  slot="end"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className="teacher-register-form-right">
              <p>Seleccione una foto</p>
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

          <div className="teacher-register-form-button-container">
            <IonButton
              expand="block"
              type="submit"
              className="teacher-register-confirm-button"
              disabled={
                !isFullNameValid ||
                !isUserNameValid ||
                !isPasswordValid ||
                !doPasswordsMatch
              }
            >
              Confirmar
            </IonButton>
          </div>
        </form>

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