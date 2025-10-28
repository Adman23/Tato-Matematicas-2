// src/pages/StudentRegister.tsx

import './StudentRegister.css';

import {
  IonPage,
  IonInput,
  IonButton,
  IonIcon,
  IonToast,
  IonSelect,
  IonSelectOption,
  IonModal,
  IonList,
  IonImg,
} from '@ionic/react';
import { personOutline, addOutline, closeOutline } from 'ionicons/icons';
import { useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// ✅ MISMO ARRAY DE PICTOGRAMAS QUE EN StudentLoginStep3.tsx
const PICTOGRAMS = [
  { id: 'perro', name: 'Perro', image: '/assets/pictograms/perro.png' },
  { id: 'gato', name: 'Gato', image: '/assets/pictograms/gato.png' },
  { id: 'tortuga', name: 'Tortuga', image: '/assets/pictograms/tortuga.png' },
  { id: 'león', name: 'León', image: '/assets/pictograms/león.png' },
  { id: 'elefante', name: 'Elefante', image: '/assets/pictograms/elefante.png' },
  { id: 'mariquita', name: 'Mariquita', image: '/assets/pictograms/mariquita.png' },
];

const MAX_PICTOGRAMS = 3;

export default function StudentRegister() {
  const history = useHistory();
  const { registerStudent } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('Imagen_de_monigote');
  const [pictograms, setPictograms] = useState<string[]>([]);

  // Modal de selección de pictogramas
  const [showPictoModal, setShowPictoModal] = useState(false);

  // Toast
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('danger');

  const avatarOptions = [
    'Imagen_de_monigote',
    'Imagen_de_monigote0',
    'Imagen_de_monigote1',
    'Imagen_de_monigote2',
    'Imagen_de_monigote3',
    'Imagen_de_monigote4',
    'Imagen_de_monigote5',
    'Imagen_de_monigote6',
    'Imagen_de_monigote7',
    'Imagen_de_monigote8',
  ];

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
      const password = pictograms.join('-'); // ej: "perro-gato"

      await registerStudent({
        full_name: fullName,
        username: userName,
        password: password,
        group_id: '1',
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

  const handleAddPictogram = () => {
    if (pictograms.length < MAX_PICTOGRAMS) {
      setShowPictoModal(true);
    } else {
      setToastMessage(`Máximo ${MAX_PICTOGRAMS} pictogramas permitidos`);
      setToastColor('danger');
      setIsToastOpen(true);
    }
  };

  const selectPictogram = (id: string) => {
    setPictograms([...pictograms, id]);
    setShowPictoModal(false);
  };

  const removePictogram = (index: number) => {
    setPictograms(pictograms.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedAvatar(file.name);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <IonPage>
      <div className="main-container">
        <h1>Tato matemáticas 2</h1>

        <div className="form-card">
          <h2>Registro Alumno</h2>

          {/* Avatar */}
          <div className="avatar-section">
            <IonIcon
              icon={personOutline}
              className="avatar-icon"
              onClick={triggerFileInput}
            />

            <div className="field-wrapper">
              <div className="field-label">Avatar *</div>
              <IonSelect
                value={selectedAvatar}
                onIonChange={(e) => setSelectedAvatar(e.detail.value)}
                placeholder="Seleccionar avatar"
                interface="popover"
                interfaceOptions={{
                    alignment: 'center',        // ← Centra el popover horizontalmente
                    showBackdrop: false,        // ← Opcional: quita el fondo oscuro
                    cssClass: 'avatar-popover'  // ← Opcional: clase CSS personalizada
                }}
                className="avatar-select"
                >
                {avatarOptions.map((avatar, index) => (
                    <IonSelectOption key={index} value={avatar}>
                    {avatar}
                    </IonSelectOption>
                ))}
              </IonSelect>
            </div>
          </div>

          {/* Usuario */}
          <div className="field-wrapper">
            <div className="field-label">Usuario *</div>
            <IonInput
              className="input-item"
              placeholder="Escribir aquí..."
              value={userName}
              onIonInput={(e) => setUserName(e.detail.value || '')}
              required
            />
          </div>

          {/* Código acceso */}
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

          {/* Botón Confirmar */}
          <div className="field-wrapper">
            <IonButton expand="block" type="submit" className="confirm-button" onClick={handleSubmit}>
              Confirmar
            </IonButton>
          </div>
        </div>

        {/* Modal de selección de pictogramas */}
        <IonModal isOpen={showPictoModal} onDidDismiss={() => setShowPictoModal(false)}>
          <div className="picto-modal-header">
            <h3>Selecciona un pictograma</h3>
            <IonButton fill="clear" onClick={() => setShowPictoModal(false)}>
              Cerrar
            </IonButton>
          </div>
          <IonList>
            <div className="picto-grid">
              {PICTOGRAMS.map((picto) => (
                <div key={picto.id} className="picto-option" onClick={() => selectPictogram(picto.id)}>
                  <IonImg src={picto.image} alt={picto.name} />
                  <span>{picto.name}</span>
                </div>
              ))}
            </div>
          </IonList>
        </IonModal>

        {/* Input oculto para avatar */}
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