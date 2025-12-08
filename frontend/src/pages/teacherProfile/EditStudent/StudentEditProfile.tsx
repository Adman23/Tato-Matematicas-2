/**
 * @file StudentEditProfile.tsx
 * @description An option in the main menu within the teachers’ edit section 
 * that allows modifying a student's personal data, 
 * such as their avatar, password, and password type configuration 
 * for one particular student.
 */


import './StudentEditProfile.css';

import {
  IonPage,
  IonInput,
  IonButton,
  IonIcon,
  IonToast,
  IonImg,
  IonText,
  useIonViewWillEnter,  // para detectar cuando se entre
  useIonViewDidLeave,   // para detectar cuando se salga
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  useIonRouter,
} from '@ionic/react';

import { personOutline, addOutline, closeOutline, checkmarkOutline, eyeOutline, eyeOffOutline, checkmarkCircle } from 'ionicons/icons';
import { useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { useHistory, Redirect } from 'react-router-dom';
import { useManager } from '../../../contexts/ManagerContext';
import { useAuth } from '../../../contexts/AuthContext';
import { authAPI, uploadImage, getImages, userAPI} from '../../../lib/api';
import type { User } from '../../../lib/api';
import { setupIonicReact } from '@ionic/react';
import SimpleHeaderEdit from './components/SimpleHeaderEdit';
import { createPortal } from 'react-dom';
import { useParams } from "react-router-dom";

setupIonicReact();

const PICTOGRAMS = [
  { id: 'perro', name: 'Perro', image: '/assets/pictograms/perro.png' },
  { id: 'gato', name: 'Gato', image: '/assets/pictograms/gato.png' },
  { id: 'tortuga', name: 'Tortuga', image: '/assets/pictograms/tortuga.png' },
  { id: 'león', name: 'León', image: '/assets/pictograms/león.png' },
  { id: 'elefante', name: 'Elefante', image: '/assets/pictograms/elefante.png' },
];

const MIN_USERNAME_LENGTH = 3;                // mínimo de longitud para el nombre de usuario

const MIN_GRAPHICAL_PASSWORD_LENGTH = 3;      // mínimo de longitud para contraseña gráfica
const MAX_GRAPHICAL_PASSWORD_LENGTH = 5;      // máximo de longitud para contraseña gráfica
const MIN_PIN_PASSWORD_LENGTH = 4;            // mínimo de longitud para PIN
const MAX_PIN_PASSWORD_LENGTH = 10;           // máximo de longitud para PIN
const MIN_ALPHANUMERIC_PASSWORD_LENGTH = 8;   // mínimo de longitud para contraseña alfanumérica
const MAX_ALPHANUMERIC_PASSWORD_LENGTH = 20;  // máximo de longitud para contraseña alfanumérica

const DEFAULT_AVATAR = "https://ionicframework.com/docs/img/demos/avatar.svg";



/**
 * Functional Summary.
 *
 * Main component for editing a student's profile within the teacher's section.
 * Allows teachers to modify personal data such as avatar, password, and password type.
 * Ensures that only authenticated users can access the view.
 *
 * Execution flow.
 *
 * - Displays a spinner while data is loading and a toast for notifications.
 * - If there is no `user`, redirects to `/login`.
 * - Loads student data using `useParams` (`id` and `username`).
 * - Allows updating the avatar via `uploadImage`.
 * - Allows changing the password and configuring the password type.
 * - Renders `SimpleHeaderEdit` with the student's name, the current editing action, and a button to go to the `/student-edit-menu/${id}/${name}`.
 *
 * @component
 * @returns {JSX.Element} View for editing a student's profile.
 *
 * @example
 * ```tsx
 * <Route path="/student-edit-profile/:id/:name" component={StudentEditProfile} />
 * ```
 */
export default function StudentEditProfile() {

  
  const history = useHistory();
  const { users, retrieveUser } = useManager();
  const { user } = useAuth();
  const { id, name } = useParams<{ id: string; name: string }>();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pictoPickerRef = useRef<HTMLDivElement>(null);
  const repeatPictoPickerRef = useRef<HTMLDivElement>(null);
  const avatarPickerRef = useRef<HTMLDivElement>(null);
  const formCardRef = useRef<HTMLDivElement>(null);
  
  const [studentUser, setStudentUser] = useState<User | null>(null);

  const [userName, setUserName] = useState('');

  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [avatarPreview, setAvatarPreview] = useState<string>(DEFAULT_AVATAR);
  const [avatarOptions, setAvatarOptions] = useState<{ id: string; name: string; imageUrl: string }[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(true);

  const [passwordType, setPasswordType] = useState<'graphical' | 'pin' | 'alphanumeric'>('graphical');

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [newPassword, setNewPassword] = useState<string | string[]>('');
  const [repeatNewPassword, setRepeatNewPassword] = useState<string | string[]>('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRepeatNewPassword, setShowRepeatNewPassword] = useState(false);

  const [isPasswordMatch, setIsPasswordMatch] = useState<boolean | null>(null);

  const isEmptyPassword = (val: string | string[]): boolean => {
    if (!val) return true;
    if (Array.isArray(val)) return val.length === 0;
    if (typeof val === 'string') return val.trim() === '';
    return false;
  };

  const [pictoModalState, setPictoModalState] = useState<{
    visible: boolean;
    target: 'newGraphicalPassword' | 'repeatNewGraphicalPassword' | null;
  }>({ visible: false, target: null });

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);

  const isAvatarSelected = selectedAvatar !== '';

  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('danger');

  const [isUpdateSuccess, setIsUpdateSuccess] = useState(false); 

  const isUserNameFilled = userName.trim().length > 0;
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const usernameCheckIdRef = useRef(0);

  const isUserNameLong = userName.trim().length >= MIN_USERNAME_LENGTH;
  const isUserNameSpaceless = !userName.includes(' ');
  const isUsernameValid = isUserNameLong && isUserNameSpaceless && isUsernameAvailable === true;

  // Cambio en el nombre de usuario
  const isUserNameChanged = (userName.trim()) !== (studentUser?.username || '');

  // Cambio en la foto de perfil del usuario (en este caso, se va a asumir que el usuario selecciona una foto de perfil distinta a la que tiene, por lo que, aunque seleccione la misma foto, 'isAvaterChanged' será 'true')
  const isAvatarChanged =
    (selectedAvatar && avatarOptions.some(a => a.id === selectedAvatar)) ||
    (fileInputRef.current?.files?.[0] != null);

  // Cambio en la contraseña del usuario
  const isPasswordChanged = !isEmptyPassword(newPassword);

  // Determina si el formulario tiene datos cambiados respecto a los datos actuales y si tiene los campos obligatorios rellenados.
  // Se usa únicamente para controlar la habilitación/visibilidad del botón "Guardar cambios".
  // No realiza validaciones completas (formatos de nombre de usuario y contraseña), pues las validaciones estrictas (formatos de nombre de usuario y contraseña) ya se aplican dentrro de 'handleSubmit'.
  const isFormReadyForSubmit =
    studentUser &&
    (isUserNameChanged || isAvatarChanged || isPasswordChanged) &&
    isUserNameFilled &&
    isAvatarSelected &&
    (!isPasswordChanged ? true : !isEmptyPassword(repeatNewPassword));

  const router = useIonRouter();
  const handleHome = () => {
    router.push(`/student-edit-menu/${id}/${name}`);
  }


  // Cargamos los datos actuales del estudiante
  useIonViewWillEnter(() => {

    const loadStudentData = async () => {

      try {

        if (!id) throw new Error('Falta el ID del estudiante.');
        if (!name) throw new Error('Falta el nombre del estudiante.');
        
        let userEntry = users.get(id);

        if (!userEntry || !userEntry.data) {
          await retrieveUser(id);
          userEntry = users.get(id);
        }

        if (!userEntry || !userEntry.data) {
          throw new Error('Datos del estudiante no disponibles.');
        }
        if (userEntry.user.username !== name) {
          throw new Error('El nombre del estudiante no coincide.');
        }
        if (userEntry.user.role !== 'student') {
          throw new Error('El usuario no es un estudiante.');
        }
        
        const user = userEntry.user;
        const data = userEntry.data;
      
        setStudentUser(user);
        setUserName(user.username || '');
        setAvatarPreview(user.photo_url || DEFAULT_AVATAR);
        setSelectedAvatar(user.photo_url || '');
        setPasswordType(data.password_type || 'graphical');

        if (data.password_type === 'graphical') {
          setNewPassword([]);
          setRepeatNewPassword([]);
        } else {
          setNewPassword('');
          setRepeatNewPassword('');
        }

        setIsPasswordMatch(null);

      } catch (err) {
        console.error(err);
        history.replace('/teacher-profile');
        setToastMessage('No se han podido cargar los datos del estudiante.');
        setToastColor('danger');
        setIsToastOpen(true);
      }

    };

    loadStudentData();

  });


  useIonViewDidLeave(() => {

    setIsUpdateSuccess(false); 

    if (passwordType === 'graphical') {
      setNewPassword([]);
      setRepeatNewPassword([]);
    } else {
      setNewPassword('');
      setRepeatNewPassword('');
    }
      
    setShowAvatarModal(false);
    setPictoModalState({ visible: false, target: null });
    
  });


  useEffect(() => {

    const trimmed = userName.trim();

    if (!isUserNameLong || !isUserNameSpaceless) {
      setIsUsernameAvailable(false);
      return;
    }

    if (trimmed === studentUser?.username) {
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

  }, [userName, studentUser?.username]);
  
  
  useEffect(() => {

    if (!userName) return;

    const loadAvatars = async () => {

      try {
        const sanitize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const imagesMap = await getImages();
        const options = Object.entries(imagesMap).map(([filename, url]) => {
          const firstWord = filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').split(' ')[0];
          return {
            id: filename,
            name: sanitize(firstWord) === sanitize(userName)
                  ? `Avatar personalizado de ${firstWord}`
                  : firstWord,
            imageUrl: url as string
          };
      });
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

  }, [studentUser?.username]);


  // Reseteamos los campos de contraseña y el estado al cambiar el tipo de contraseña
  useEffect(() => {

    if (passwordType === 'graphical') {
      setNewPassword([]);
      setRepeatNewPassword([]);
    } else {
      setNewPassword('');
      setRepeatNewPassword('');
    }

    setIsPasswordMatch(null);

  }, [passwordType]);


  // Actualizamos el estado de repetición de contraseña
  useEffect(() => {

    if (isEmptyPassword(newPassword) || isEmptyPassword(repeatNewPassword)) {
      setIsPasswordMatch(null);
      return;
    }

    let normalizeNewPassword = Array.isArray(newPassword) ? newPassword.join('-') : newPassword;
    let normalizedRepeatNewPassword = Array.isArray(repeatNewPassword) ? repeatNewPassword.join('-') : repeatNewPassword;
    setIsPasswordMatch(normalizeNewPassword === normalizedRepeatNewPassword);

  }, [newPassword, repeatNewPassword]);


  // Validación completa para cada tipo de contraseña
  const validatePassword = (
    newPassword: string | string[],
    passwordType: 'graphical' | 'pin' | 'alphanumeric'
  ): string[] => {

    const errors: string[] = [];

    const normalizedPassword = passwordType === 'graphical' ? newPassword as string[] : newPassword as string;

    // - Longitud -

    const passwordLength =
      passwordType === 'graphical'
        ? (normalizedPassword as string[]).length
        : (normalizedPassword as string).length;

    const minPasswordLength =
      passwordType === 'graphical'
        ? MIN_GRAPHICAL_PASSWORD_LENGTH
        : passwordType === 'pin'
          ? MIN_PIN_PASSWORD_LENGTH
          : MIN_ALPHANUMERIC_PASSWORD_LENGTH;

    const maxPasswordLength =
      passwordType === 'graphical'
        ? MAX_GRAPHICAL_PASSWORD_LENGTH
        : passwordType === 'pin'
          ? MAX_PIN_PASSWORD_LENGTH
          : MAX_ALPHANUMERIC_PASSWORD_LENGTH;

      const isPasswordBelowMin = passwordLength < minPasswordLength;
      const isPasswordAboveMax = passwordLength > maxPasswordLength;

      if (isPasswordBelowMin) 
        errors.push(`La contraseña es demasiado corta. Como mínimo, debe tener una longitud de ${minPasswordLength}.`);

      if (isPasswordAboveMax) 
        errors.push(`La contraseña es demasiado larga. Como máximo, debe tener una longitud de ${maxPasswordLength}.`);

    // - Validaciones específicas -

    if (passwordType === 'pin') {

      const pin = normalizedPassword as string;

      if (!/^\d+$/.test(pin)) {
        errors.push('El PIN solo puede contener números.');
      }

    }

    if (passwordType === 'alphanumeric') {

      const alphanumericPassword = normalizedPassword as string;

      if (!/[a-zA-Z]/.test(alphanumericPassword)) {
        errors.push('La contraseña alfanumérica debe contener al menos una letra.');
      }

      if (!/[0-9]/.test(alphanumericPassword)) {
        errors.push('La contraseña alfanumérica debe contener al menos un número.');
      }

    }

    return errors;

  };


  const getPasswordRulesMessage = (passwordType: 'graphical' | 'pin' | 'alphanumeric'): string[] => {

    const passwordRules: string[] = [];

    switch(passwordType) {

      case 'graphical':
        passwordRules.push(`La contraseña gráfica debe tener entre ${MIN_GRAPHICAL_PASSWORD_LENGTH} y ${MAX_GRAPHICAL_PASSWORD_LENGTH} pictogramas.`);
        break;

      case 'pin':
        passwordRules.push(`El PIN debe tener entre ${MIN_PIN_PASSWORD_LENGTH} y ${MAX_PIN_PASSWORD_LENGTH} números.`);
        passwordRules.push('Solo puede contener números.');
        break;

      case 'alphanumeric':
        passwordRules.push(`La contraseña alfanumérica debe tener entre ${MIN_ALPHANUMERIC_PASSWORD_LENGTH} y ${MAX_ALPHANUMERIC_PASSWORD_LENGTH} caracteres.`);
        passwordRules.push('Debe contener al menos una letra.');
        passwordRules.push('Debe contener al menos un número.');
        break;
      
    }

    return passwordRules;

  };


  const handleSubmit = async (e?: React.FormEvent) => {

    e?.preventDefault();

    const errors: string[] = [];

    if (!isUserNameLong) 
      errors.push('El nombre de usuario debe tener al menos 3 caracteres.');

    if (!isUserNameSpaceless) 
      errors.push('El nombre de usuario no puede contener espacios.');

    if (isUsernameAvailable === false && isUserNameLong && isUserNameSpaceless) 
      errors.push('Este nombre de usuario ya está actualmente en uso por otra persona.');

    if (!isAvatarSelected) 
      errors.push('Debes seleccionar una imagen de perfil.');

    // Validaciones de la contraseña
    if (isPasswordChanged) {
      const passwordErrors = validatePassword(newPassword, passwordType);
      errors.push(...passwordErrors);
    }

    // Verificación de coincidencia de nueva contraseña con su repetición
    if ((isPasswordChanged) && (isPasswordMatch === false))
      errors.push('La contraseña repetida no coincide con la nueva que has introducido.');

    if (errors.length > 0) {
      setToastMessage(errors.join('\n'));
      setToastColor('danger');
      setIsToastOpen(true);
      return;
    }

    try {

      let photoUrl = null;

      if (selectedAvatar && avatarOptions.some(a => a.id === selectedAvatar)) {
        photoUrl = selectedAvatar; 
      } 
      else if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        const sanitize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "");
        const uniqueFilename = `${sanitize(userName.trim())}_${Date.now()}_${sanitize(file.name)}`;
        photoUrl = await uploadImage(file, uniqueFilename);
      }
      
      const payload: any = {};
      if (isUserNameChanged) payload.username = userName;
      if (photoUrl) payload.photo_url = photoUrl;
      if (isPasswordChanged) {
        payload.password = Array.isArray(newPassword) ? newPassword.join('-') : newPassword;
        payload.password_type = passwordType;
        payload.password_length = Array.isArray(newPassword)
          ? newPassword.length
          : (typeof newPassword === 'string' ? newPassword.length : 0);
      }

      if (isPasswordChanged) {
        payload.password_length = Array.isArray(newPassword)
          ? newPassword.length
          : (typeof newPassword === 'string' ? newPassword.length : 0);
      }
      
      if (Object.keys(payload).length === 0) {
        setToastMessage('No se han detectado cambios en los datos del perfil del estudiante.');
        setToastColor('danger');
        setIsToastOpen(true);
        return;
      }

      // Actualizamos el nombre de usuario, la foto de perfil, la contraseña y el tipo de contraseña del estudiante
      await userAPI.updateUser(id, payload);

      // Refrescamos el usuario en ManagerContext
      await retrieveUser(id);

      setIsUpdateSuccess(true);

    } catch (err) {
      console.error(err);
      setToastMessage('Error al actualizar los datos del perfil del estudiante.');
      setToastColor('danger');
      setIsToastOpen(true);
    }

  };


  const handleSuccessAccept = () => {
    
    const updatedName = userName;
    window.location.href = `/student-edit-menu/${id}/${updatedName}`;
    
  };


  const handleCancel = () => {

    if (passwordType === 'graphical') {
      setNewPassword([]);
      setRepeatNewPassword([]);
    } else {
      setNewPassword('');
      setRepeatNewPassword('');
    }
      
    history.goBack();

  };


  // === PICTOGRAMAS PREDETERMINADOS PARA CONTRASEÑA GRÁFICA ===


  const openPictoModal = (target: 'newGraphicalPassword' | 'repeatNewGraphicalPassword') => {
    setPictoModalState({ visible: true, target });
    requestAnimationFrame(() => {
      setPictoModalState(prev => ({ ...prev, visible: true }));
    });
  };


  const closePictoModal = () => {
    setPictoModalState(prev => ({ ...prev, visible: false }));
  };


  const selectPictogram = (id: string) => {
    if (!Array.isArray(newPassword)) 
      setNewPassword([]);
    if (pictoModalState.target === 'newGraphicalPassword') {
      const newGraphicalPassword = [...(newPassword as string[]), id];
      setNewPassword(newGraphicalPassword);
      if (newGraphicalPassword.length >= MAX_GRAPHICAL_PASSWORD_LENGTH) 
        closePictoModal();
    } else {
      const repeatNewGraphicalPassword = [...(repeatNewPassword as string[]), id];
      setRepeatNewPassword(repeatNewGraphicalPassword);
      if (repeatNewGraphicalPassword.length >= MAX_GRAPHICAL_PASSWORD_LENGTH) 
        closePictoModal();
    }
  };


  const handleAddPictogram = (target: 'newGraphicalPassword' | 'repeatNewGraphicalPassword') => {
    if (passwordType !== 'graphical') return;
    const current = target === 'newGraphicalPassword' ? newPassword : repeatNewPassword;
    const length = Array.isArray(current) ? current.length : 0;   // comprobamos si es array o no por seguridad (queremos asegurarnos de nuevo que es array, es decir, que estamos ante una contraseña gráfica)
    if (length < MAX_GRAPHICAL_PASSWORD_LENGTH) {
      openPictoModal(target);
    } else {
      setToastMessage(`Máximo ${MAX_GRAPHICAL_PASSWORD_LENGTH} elementos gráficos permitidos.`);
      setToastColor('danger');
      setIsToastOpen(true);
    }
  };


  const removePictogram = (index: number, target: 'newGraphicalPassword' | 'repeatNewGraphicalPassword') => {
    if (target === 'newGraphicalPassword') {
      setNewPassword(current =>
        Array.isArray(current) ? current.filter((_, i) => i !== index) : current  // comprobamos si es array o no por seguridad (queremos asegurarnos de nuevo que es array, es decir, que estamos ante una contraseña gráfica)
      );
    } else {
      setRepeatNewPassword(current =>
        Array.isArray(current) ? current.filter((_, i) => i !== index) : current  // comprobamos si es array o no por seguridad (queremos asegurarnos de nuevo que es array, es decir, que estamos ante una contraseña gráfica)
      );
    }
  };


  // === AVATARES PREDETERMINADOS O IMÁGENES SUBIDAS PARA FOTO DE PERFIL ===


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


  // === POSICIONAMIENTO MODALES ===
  

  const updatePictoModalPosition = useCallback(() => {
    if (!pictoModalState.visible) return;
    const targetRef = pictoModalState.target === 'newGraphicalPassword' ? pictoPickerRef.current : repeatPictoPickerRef.current;
    if (!targetRef || !formCardRef.current) return;
    const cardRect = formCardRef.current.getBoundingClientRect();
    const modalWidth = 300;
    const modalHeight = Math.min(cardRect.height, 460);
    const spacing = 20;
    let top = cardRect.top + window.scrollY + (cardRect.height - modalHeight) / 2;
    top = Math.max(spacing, Math.min(top, window.innerHeight + window.scrollY - modalHeight - spacing));
    let left = cardRect.right + spacing;
    left = Math.min(left, window.innerWidth + window.scrollX - modalWidth - spacing);
    Object.assign(targetRef.style, {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${modalWidth}px`,
      height: `${modalHeight}px`,
      overflowY: 'auto',
      zIndex: '1001',
    });
  }, [pictoModalState]);


  useLayoutEffect(() => {
    if (!pictoModalState.visible) return;
    const id = requestAnimationFrame(updatePictoModalPosition);
    const handleResize = () => updatePictoModalPosition();
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', handleResize);
    };
  }, [pictoModalState, updatePictoModalPosition]);


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
    
    const avatar = avatarOptions.find(a => (a.id === selectedAvatar) || (a.imageUrl === selectedAvatar));

    if (avatar) {
      return avatar.name;
    }

    if (fileInputRef.current?.files?.[0]) {
      return `Avatar personalizado de ${userName}`;
    }

    return 'Seleccionar imagen...';

  };


  const avatarDisplayName = getAvatarDisplayName();


  const handleConfirmClick = () => {
    handleSubmit();
  };


  // Redirect if there is no authenticated user
  if (!user) {
    return <Redirect to="/login" />;
  }


  return (

    <IonPage>

      <SimpleHeaderEdit studentName={name} Editing={"Datos del alumno"} onHome={handleHome}/>

      <div className={
        isUpdateSuccess 
          ? "studentEditProfile-confirmation-main-container" 
          : "studentEditProfile-edit-main-container"
      }>

        {isUpdateSuccess ? (

          <IonCard className="studentEditProfile-confirmation-card">

            <IonCardHeader className="studentEditProfile-confirmation-header">
              <div className="studentEditProfile-confirmation-icon-container">
                <IonIcon icon={checkmarkCircle} className="studentEditProfile-confirmation-icon" />
              </div>
              <IonCardTitle className="studentEditProfile-confirmation-title">Perfil actualizado</IonCardTitle>
            </IonCardHeader>
            <IonCardContent className="studentEditProfile-confirmation-message">
              Los datos del estudiante <strong>{name}</strong> han sido actualizados correctamente.
            </IonCardContent>
            <div className="studentEditProfile-confirmation-button-container">
              <IonButton expand="block" className="studentEditProfile-confirmation-button" onClick={handleSuccessAccept}>
                Aceptar
              </IonButton>
            </div>

          </IonCard>

        ) : (

          <div className="studentEditProfile-form-card" ref={formCardRef}>
            
            <h2>Editar datos</h2>
            <p className="studentEditProfile-subtitle">
              Aquí puede actualizar los datos que desee del alumno <span className="studentEditProfile-name">{name}</span>.
            </p>
            
            <div className="studentEditProfile-horizontal-row">

              {/* Columna izquierda de edición de datos: avatar y nombre de usuario */}
              <div className="studentEditProfile-column studentEditProfile-column--left">

                {/* Avatar */}
                <div className="studentEditProfile-avatar-section">
                  <div className="studentEditProfile-avatar-preview"
                    onClick={openAvatarModal}
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="studentEditProfile-avatar-image"
                      />
                    ) : (
                      <IonIcon icon={personOutline} className="studentEditProfile-avatar-icon" />
                    )}
                  </div>
                  <div className="studentEditProfile-field-wrapper">
                    <div className="studentEditProfile-field-label">
                      Cambiar avatar <span className="required-star">*</span>
                    </div>
                    <div className="studentEditProfile-avatar-select-field" onClick={openAvatarModal}>
                      <IonText>{avatarDisplayName}</IonText>
                    </div>
                  </div>
                </div>
                
                {/* Username */}
                <div className="studentEditProfile-field-wrapper">
                  <div className="studentEditProfile-field-label">
                    Cambiar nombre de usuario <span className="required-star">*</span>
                  </div>
                  <div className="studentEditProfile-input-with-icon">
                    <IonInput
                      className="studentEditProfile-input-item"
                      placeholder="Escribir aquí..."
                      value={userName}
                      onIonInput={(e) => setUserName(e.detail.value || '')}
                    />
                    <IonIcon
                      icon={isUsernameValid ? checkmarkOutline : closeOutline}
                      className={
                        "studentEditProfile-input-status-icon " +
                        (isUsernameValid ? "success" : "error")
                      }
                    />
                  </div>
                </div>

              </div> {/* Cierra columna izquierda */}
            
              {/* Columna derecha de edición de datos: contraseña */}
              <div className="studentEditProfile-column studentEditProfile-column--right">

                {/* Password type */}
                <div className="studentEditProfile-field-wrapper">
                  <div className="studentEditProfile-field-label">Cambiar contraseña</div>
                  <div className="studentEditProfile-password-select-wrapper">
                    {/* Campo que se ve */}
                    <div 
                      className={`studentEditProfile-password-type-select ${dropdownOpen ? 'open' : ''}`}
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                      {passwordType === 'graphical' && 'Contraseña gráfica'}
                      {passwordType === 'pin' && 'PIN'}
                      {passwordType === 'alphanumeric' && 'Contraseña alfanumérica'}
                    </div>
                    {/* Dropdown fijo debajo */}
                    {dropdownOpen && (
                      <div className="studentEditProfile-password-dropdown">
                        <div
                          className={`dropdown-option ${passwordType === 'graphical' ? 'selected' : ''}`}
                          onClick={() => { setPasswordType('graphical'); setDropdownOpen(false); }}
                        >
                          Contraseña gráfica
                        </div>
                        <div
                          className={`dropdown-option ${passwordType === 'pin' ? 'selected' : ''}`}
                          onClick={() => { setPasswordType('pin'); setDropdownOpen(false); }}
                        >
                          PIN
                        </div>
                        <div
                          className={`dropdown-option ${passwordType === 'alphanumeric' ? 'selected' : ''}`}
                          onClick={() => { setPasswordType('alphanumeric'); setDropdownOpen(false); }}
                        >
                          Contraseña alfanumérica
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                  
                {/* New password */}
                
                {(passwordType === 'alphanumeric' || passwordType === 'pin') && (
                  <>
                    <div className="studentEditProfile-field-wrapper">
                      <div className="studentEditProfile-subfield-label">Nueva contraseña</div>
                      <div className="studentEditProfile-input-with-icon">
                        <IonInput
                          type={showNewPassword ? 'text' : 'password'}
                          value={typeof newPassword === 'string' ? newPassword : ''}
                          className="studentEditProfile-input-item"
                          placeholder="Escribir contraseña..."
                          onIonInput={e => setNewPassword(e.detail.value || '')}
                        />
                        {/* Indicador de validación de reglas */}
                        {newPassword && newPassword.length > 0 && (
                          <IonIcon
                            icon={validatePassword(newPassword, passwordType).length === 0 ? checkmarkOutline : closeOutline}
                            className={
                              "studentEditProfile-input-status-icon " +
                              (validatePassword(newPassword, passwordType).length === 0 ? "success" : "error")
                            }
                          />
                        )}
                        <IonIcon
                          icon={showNewPassword ? eyeOffOutline : eyeOutline}
                          onClick={() => setShowNewPassword(prev => !prev)}
                          className="studentEditProfile-input-eye-icon"
                        />
                      </div>
                      {/* Mensaje de reglas */}
                      <ul className="studentEditProfile-password-rules">
                        {getPasswordRulesMessage(passwordType).map((rule, index) => (
                          <li key={index}>{rule}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="studentEditProfile-field-wrapper">
                      <div className="studentEditProfile-subfield-label">Repetir contraseña</div>
                      <div className="studentEditProfile-input-with-icon">
                        <IonInput
                          type={showRepeatNewPassword ? 'text' : 'password'}
                          value={typeof repeatNewPassword === 'string' ? repeatNewPassword : ''}
                          className="studentEditProfile-input-item"
                          placeholder="Repetir contraseña..."
                          onIonInput={e => setRepeatNewPassword(e.detail.value || '')}
                        />
                        {isPasswordMatch !== null && (
                          <IonIcon
                            icon={isPasswordMatch ? checkmarkOutline : closeOutline}
                            className={
                              "studentEditProfile-input-status-icon " +
                              (isPasswordMatch ? "success" : "error")
                            }
                          />
                        )}
                        <IonIcon
                          icon={showRepeatNewPassword ? eyeOffOutline : eyeOutline}
                          onClick={() => setShowRepeatNewPassword(prev => !prev)}
                          className="studentEditProfile-input-eye-icon"
                        />
                      </div>
                    </div>
                  </>
                )}

                {passwordType === 'graphical' && (
                  <>
                    <div className="studentEditProfile-field-wrapper">
                      <div className="studentEditProfile-subfield-label">Nueva contraseña</div>
                      <div className="studentEditProfile-pictogram-container">
                        {(Array.isArray(newPassword) ? newPassword : []).map((pictoId, index) => {
                          const picto = PICTOGRAMS.find(p => p.id === pictoId);
                          return (
                            <div key={index} className="studentEditProfile-pictogram-box" onClick={() => removePictogram(index, 'newGraphicalPassword')}>
                              <IonImg src={picto?.image} alt={picto?.name} />
                              <IonIcon icon={closeOutline} className="studentEditProfile-pictogram-remove" />
                            </div>
                          );
                        })}
                        <div 
                          className={`studentEditProfile-pictogram-add ${Array.isArray(newPassword) && newPassword.length >= MAX_GRAPHICAL_PASSWORD_LENGTH ? 'disabled' : ''}`} 
                          onClick={() => handleAddPictogram('newGraphicalPassword')}
                        >
                          <IonIcon icon={addOutline} />
                        </div>
                      </div>
                      {/* Mensaje de reglas */}
                      <ul className="studentEditProfile-password-rules">
                        {getPasswordRulesMessage(passwordType).map((rule, index) => (
                          <li key={index}>{rule}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="studentEditProfile-field-wrapper">
                      <div className="studentEditProfile-subfield-label">Repetir contraseña</div>
                      <div className="studentEditProfile-pictogram-container">
                        {(Array.isArray(repeatNewPassword) ? repeatNewPassword : []).map((pictoId, index) => {
                          const picto = PICTOGRAMS.find(p => p.id === pictoId);
                          return (
                            <div key={index} className="studentEditProfile-pictogram-box" onClick={() => removePictogram(index, 'repeatNewGraphicalPassword')}>
                              <IonImg src={picto?.image} alt={picto?.name} />
                              <IonIcon icon={closeOutline} className="studentEditProfile-pictogram-remove" />
                            </div>
                          );
                        })}
                        <div 
                          className={`studentEditProfile-pictogram-add ${Array.isArray(repeatNewPassword) && repeatNewPassword.length >= MAX_GRAPHICAL_PASSWORD_LENGTH ? 'disabled' : ''}`} 
                          onClick={() => handleAddPictogram('repeatNewGraphicalPassword')}
                        >
                          <IonIcon icon={addOutline} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

              </div>
            </div>
            
            {/* Botones de confirmar y cancelar */}
            <div className="studentEditProfile-field-wrapper-buttons">
              <IonButton 
                expand="block"
                className={`studentEditProfile-confirm-button ${
                  !isFormReadyForSubmit ? 'studentEditProfile-confirm-button--disabled' : ''
                }`}
                disabled={!isFormReadyForSubmit}
                onClick={handleConfirmClick}
              >
                Guardar cambios
              </IonButton>
              <IonButton expand="block" className="studentEditProfile-cancel-button" onClick={handleCancel}>
                Cancelar
              </IonButton>
            </div>

          </div>

        )}

        {/* Input file oculto */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />

        {/* Toast */}
        <div className="studentEditProfile-toast">
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

      {pictoModalState.visible && createPortal(
        <div className="studentEditProfile-picto-picker-overlay" onClick={closePictoModal}>
          <div
            ref={pictoModalState.target === 'newGraphicalPassword' ? pictoPickerRef : repeatPictoPickerRef}
            className={`studentEditProfile-picto-picker-custom ${
              pictoModalState.visible ? 'studentEditProfile-picto-picker-visible' : ''
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="studentEditProfile-picto-picker-header">
              <h3>Selecciona un pictograma</h3>
              <IonButton fill="clear" size="small" onClick={closePictoModal}>
                Cerrar
              </IonButton>
            </div>
            <div className="studentEditProfile-picto-grid">
              {PICTOGRAMS.map((picto) => (
                <div
                  key={picto.id}
                  className="studentEditProfile-picto-option"
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
    
      {showAvatarModal && createPortal(
        <div className="studentEditProfile-avatar-picker-overlay" onClick={closeAvatarModal}>
          <div
            ref={avatarPickerRef}
            className={`studentEditProfile-avatar-picker ${
              isAvatarModalVisible ? 'studentEditProfile-avatar-picker-visible' : ''
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="studentEditProfile-picto-picker-header">
              <h3>Selecciona un avatar o sube una imagen</h3>
              <IonButton fill="clear" size="small" onClick={closeAvatarModal}>
                Cerrar
              </IonButton>
            </div>
            <div className="studentEditProfile-picto-grid">
              <div className="studentEditProfile-picto-option" onClick={triggerFileInput}>
                <div className="studentEditProfile-upload-avatar-placeholder">
                  <IonIcon icon={addOutline} className="studentEditProfile-upload-icon" />
                </div>
                <span>Subir imagen</span>
              </div>

              {loadingAvatars ? (
                <div className="studentEditProfile-avatar-loading">Cargando avatares...</div>
              ) : (
                avatarOptions.map((avatar) => (
                  <div
                    key={avatar.id}
                    className="studentEditProfile-picto-option"
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