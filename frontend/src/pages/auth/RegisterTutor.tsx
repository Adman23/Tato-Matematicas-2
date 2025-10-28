import './RegisterTutor.css';

import {
  IonPage,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonLabel,
  IonList,
  IonToast,
} from '@ionic/react';
import {
  checkmarkOutline,
  closeOutline,
  eyeOutline,
  eyeOffOutline,
  personCircleOutline,
} from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterTutor() {
  const history = useHistory();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Toast
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('danger');

  // Validaciones básicas
  const isFullNameValid = fullName.trim().length > 2;
  const isUserNameValid = userName.trim().length > 2;
  const isPasswordValid = password.length >= 6;
  const doPasswordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación antes de enviar
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
      await register({
        full_name: fullName,
        username: userName,
        password,
        role: 'tutor',
      });

      setToastMessage('Registro completado correctamente 🎉');
      setToastColor('success');
      setIsToastOpen(true);

      setTimeout(() => history.push('/tutor-dashboard'), 1500);
    } catch (err: any) {
      console.error('Error en el registro:', err);
      setToastMessage(err.message || 'Error al registrar usuario');
      setToastColor('danger');
      setIsToastOpen(true);
    }
  };

  return (
    <IonPage>
      <div className="main-container">
        <div className="title">
          <h1>Tato matematicas 2</h1>
        </div>

        <form className="grid-container" onSubmit={handleSubmit}>
          <div className="form-container-header">
            <h1>Registro</h1>
            <h2>Rellene los siguientes campos, por favor</h2>
          </div>
          <div className="grid-content">
            <div className="form-left">
              <IonList>
                <div className="input-with-icon">
                  <IonInput
                    label="Usuario *"
                    labelPlacement="floating"
                    placeholder="Escribir aquí..."
                    value={userName}
                    onIonInput={(e) => setUserName(e.detail.value!)}
                    required
                    className='input'
                  />
                  <IonIcon
                    icon={isUserNameValid ? checkmarkOutline : closeOutline}
                  />
                </div>

                <div className="input-with-icon">
                  <IonInput
                    label="Contraseña *"
                    labelPlacement="floating"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onIonInput={(e) => setPassword(e.detail.value!)}
                    required
                  />
                  <IonIcon
                    icon={showPassword ? eyeOffOutline : eyeOutline}
                    slot="end"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>

                <div className="input-with-icon">
                  <IonInput
                    label="Repita la contraseña *"
                    labelPlacement="floating"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onIonInput={(e) => setConfirmPassword(e.detail.value!)}
                    required
                  />
                  <IonIcon
                    icon={showConfirmPassword ? eyeOffOutline : eyeOutline}
                    slot="end"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </IonList>
            </div>

            <div className="form-right">
              <p>Seleccione una foto</p>
              <div className="profile-image-container">
                <label className="profile-icon-label">
                  {selectedImage ? (
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Perfil"
                      className="selected-image"
                    />
                  ) : (
                    <IonIcon icon={personCircleOutline} className="profile-placeholder" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedImage(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="form-button-container">
            <IonButton expand="block" type="submit" className="confirm-button">
              Confirmar
            </IonButton>
          </div>
        </form>

        {/* Toast */}
        <IonToast
          isOpen={isToastOpen}
          message={toastMessage}
          color={toastColor}
          duration={3000}
          onDidDismiss={() => setIsToastOpen(false)}
          className='toast'
        />
      </div>
    </IonPage>
  );
}
