import React, { useState, useRef } from 'react';
import './EditNoiseStudent.css';
import { 
  desktopOutline,
  flowerOutline,
  gameControllerOutline,
  volumeMuteOutline,
  volumeLowOutline,
  volumeMediumOutline,
  volumeHighOutline,
  checkmarkSharp,
  closeSharp,
  trophySharp,
  arrowBack,
  musicalNotesOutline,
} from 'ionicons/icons';
import { IonIcon, IonPage, IonContent, useIonRouter, useIonViewWillEnter } from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import SimpleHeaderUser from './components/SimpleHeaderUser';
import { Button3Dtext } from '../global_components/PushableButtons';
import { SimpleButton } from '../global_components/SimpleButton';
import imgAceptar from '/assets/pictograms/correcto.png';
import { getAudioPreferences, saveAudioPreferences, type AudioPreferences } from '../../lib/api';

/**
 * Componente de edición de preferencias de audio para estudiantes.
 * 
 * Permite a los estudiantes personalizar su experiencia de audio en los juegos
 * seleccionando un tema de sonido (clásico, digital, zen, juego) y un nivel de volumen.
 * 
 * @remarks
 * - Carga las preferencias guardadas al montar el componente
 * - Permite previsualizar los sonidos antes de guardar
 * - Soporta navegación por teclado y es completamente responsive
 * - Los sonidos de números en juegos mantienen volumen medio independientemente de la configuración
 * 
 * @component
 * 
 * @example
 * ```tsx
 * <EditNoiseStudent />
 * ```
 */
const EditNoiseStudent: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<string>('classic');
  const [selectedVolume, setSelectedVolume] = useState<string>('bajito');
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const router = useIonRouter();
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Genera la ruta del archivo de sonido basado en el tipo y tema.
   * 
   * @param type - Tipo de sonido: 'correct', 'incorrect' o 'trophy'
   * @param theme - Tema de sonido seleccionado (classic, digital, zen, juego)
   * @returns Ruta completa al archivo de sonido temático
   * 
   * @example
   * ```tsx
   * const soundPath = getSoundFile('correct', 'classic');
   * // Returns: '/assets/sounds/correct_classic.mp3'
   * ```
   */
  const getSoundFile = (type: 'correct' | 'incorrect' | 'trophy', theme: string): string => {
    // Primero intentar con sonido específico del tema
    const themeSound = `/assets/sounds/${type}_${theme}.mp3`;
    
    // Fallback a sonidos genéricos si no existe el específico
    const fallbackMap: Record<string, string> = {
      correct: '/assets/sounds/correct.mp3',
      incorrect: '/assets/sounds/incorrect.mp3',
      trophy: '/assets/sounds/aplausos.mp3',
    };
    
    // Por ahora retornar el tema específico (agregar lógica de fallback si es necesario)
    return themeSound;
  };

  /**
   * Reproduce una previsualización del sonido con el tema y volumen especificados.
   * 
   * @param type - Tipo de sonido a reproducir
   * @param theme - Tema del sonido
   * @param volume - Nivel de volumen (silencio, bajito, medio, alto)
   * 
   * @remarks
   * - Detiene cualquier audio previo antes de reproducir uno nuevo
   * - Crea una nueva instancia de Audio para cada reproducción
   * - Maneja errores de reproducción silenciosamente
   */
  const playPreview = (type: 'correct' | 'incorrect' | 'trophy', theme: string, volume: string) => {
    const soundFile = getSoundFile(type, theme);
    if (!soundFile) return;

    // Si hay audio reproduciéndose, pararlo
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Crear nueva instancia de audio
    const audio = new Audio(soundFile);
    audio.volume = getVolumeLevel(volume);
    audioRef.current = audio;

    audio.play().catch((error) => {
      console.error('Error playing audio:', error);
    });
  };

  /**
   * Convierte el nivel de volumen textual a su valor numérico correspondiente.
   * 
   * @param volume - Nivel de volumen textual
   * @returns Valor numérico entre 0.0 (silencio) y 1.0 (alto)
   * 
   * @example
   * ```tsx
   * getVolumeLevel('medio')  // Returns: 0.6
   * getVolumeLevel('bajito') // Returns: 0.3
   * ```
   */
  const getVolumeLevel = (volume: string): number => {
    switch (volume) {
      case 'silencio': return 0;
      case 'bajito': return 0.3;
      case 'medio': return 0.6;
      case 'alto': return 1.0;
      default: return 0.5;
    }
  };

  /**
   * Maneja el cambio de volumen y reproduce una previsualización.
   * 
   * @param volumeId - ID del nuevo nivel de volumen seleccionado
   * 
   * @remarks
   * - Actualiza el estado del volumen seleccionado
   * - Reproduce un sonido de previsualización si no es 'silencio'
   */
  const handleVolumeChange = (volumeId: string) => {
    setSelectedVolume(volumeId);
    if (volumeId !== 'silencio') {
      playPreview('correct', selectedTheme, volumeId);
    }
  };

  const themes = [
    { id: 'classic', label: 'Clásico', icon: musicalNotesOutline, color: 'var(--ion-color-primary)' }, // Color primario de la app
    { id: 'digital', label: 'Digital', icon: desktopOutline, color: '#3498db' }, // Azul tecnológico
    { id: 'zen', label: 'Zen', icon: flowerOutline, color: '#27ae60' }, // Verde naturaleza
    { id: 'juego', label: 'Juego', icon: gameControllerOutline, color: '#e74c3c' }, // Rojo videojuego
  ];

  const volumes = [
    { id: 'silencio', label: 'Silencio', icon: volumeMuteOutline },
    { id: 'bajito', label: 'Bajito', icon: volumeLowOutline },
    { id: 'medio', label: 'Medio', icon: volumeMediumOutline },
    { id: 'alto', label: 'Alto', icon: volumeHighOutline },
  ];

  /**
   * Carga las preferencias de audio del usuario al entrar a la página.
   * 
   * @remarks
   * - Se ejecuta automáticamente cuando el componente entra en vista
   * - Carga las preferencias desde la API usando el ID del usuario
   * - Mantiene valores por defecto si ocurre un error
   * - Usa useIonViewWillEnter para ejecutarse antes de que la vista sea visible
   */
  useIonViewWillEnter(() => {
    const loadAudioPreferences = async () => {
      if (!user?.id) return;
      
      try {
        const prefs = await getAudioPreferences(user.id);
        setSelectedTheme(prefs.theme);
        setSelectedVolume(prefs.volume);
      } catch (err) {
        console.error('Error cargando audio_preferences:', err);
        // Mantener valores por defecto si hay error
      }
    };
    
    loadAudioPreferences();
  });

  /**
   * Guarda las preferencias de audio del usuario y navega de vuelta al perfil.
   * 
   * @remarks
   * - Valida que exista un usuario autenticado
   * - Guarda las preferencias en la base de datos vía API
   * - Navega automáticamente a la página de perfil tras guardar
   * - Maneja errores de guardado mostrándolos en consola
   * 
   * @throws Error si no hay usuario autenticado o falla la llamada a la API
   */
  const handleSavePreferences = async () => {
    if (!user?.id) return;
    
    try {
      const preferences: AudioPreferences = {
        theme: selectedTheme as AudioPreferences['theme'],
        volume: selectedVolume as AudioPreferences['volume'],
      };
      
      await saveAudioPreferences(user.id, preferences);
      console.log('Preferencias de audio guardadas:', preferences);
      router.push('/student/profile', 'back', 'pop');
    } catch (err) {
      console.error('Error guardando audio_preferences:', err);
    }
  };

  return (
    <IonPage>
      <SimpleHeaderUser
        userName={user?.username || "username"}
        photoUrl={user?.photo_url}
        hidden={true}
      />

      <IonContent className="ion-padding" scrollY={false} style={{ '--background': 'var(--ion-color-primary-contrast)', '--padding-bottom': '0', '--overflow': 'hidden' } as React.CSSProperties}>
        <Button3Dtext 
          onClick={() => router.push('/student/profile', 'back', 'pop')} 
          aria-label="Volver atrás"
        >
          <IonIcon icon={arrowBack} />
        </Button3Dtext>

        <div className="container">
      <h1 className="main-title">Elige tus sonidos</h1>

      {/* Sección de Temas */}
      <div className="themes-row">
        {themes.map((theme) => (
          <SimpleButton
            key={theme.id}
            className={`theme-card ${selectedTheme === theme.id ? 'selected' : ''} ${selectedVolume === 'silencio' ? 'disabled' : ''}`}
            onClick={() => {
              if (selectedVolume !== 'silencio') {
                setSelectedTheme(theme.id);
              }
            }}
            onKeyDown={(e: any) => {
              if ((e.key === 'Enter' || e.key === ' ') && selectedVolume !== 'silencio') {
                e.preventDefault();
                setSelectedTheme(theme.id);
              }
            }}
            tabIndex={selectedVolume === 'silencio' ? -1 : 0}
            role="button"
            aria-label={`Seleccionar tema ${theme.label}`}
            aria-pressed={selectedTheme === theme.id}
          >
            <span className="theme-label">{theme.label}</span>
            
            {/* Círculo del icono principal */}
            <div className="icon-circle" style={{ backgroundColor: theme.color }}>
              <IonIcon icon={theme.icon} />
            </div>

            {/* Sub-iconos de feedback (Check, X, Trofeo) - ahora son botones 3D */}
            <div className="feedback-icons">
              <div className="feedback-item">
                <Button3Dtext
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedVolume !== 'silencio') {
                      playPreview('correct', theme.id, selectedVolume);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      if (selectedVolume !== 'silencio') {
                        setPressedButton(`${theme.id}-correct`);
                        playPreview('correct', theme.id, selectedVolume);
                        setTimeout(() => setPressedButton(null), 150);
                      }
                    }
                  }}
                  style={{
                    '--bubble-bg': theme.color,
                    '--bubble-bg-hover': theme.color,
                    '--bubble-shadow-dark': theme.color,
                  } as React.CSSProperties}
                  className="feedback-button"
                  disabled={selectedVolume === 'silencio'}
                  aria-label={`Escuchar sonido de correcto para tema ${theme.label}`}
                  pressed={pressedButton === `${theme.id}-correct`}
                >
                  <IonIcon icon={checkmarkSharp} className="btn-icon" style={{ fontSize: '24px' }} />
                </Button3Dtext>
              </div>
              
              <div className="feedback-item">
                <Button3Dtext
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedVolume !== 'silencio') {
                      playPreview('incorrect', theme.id, selectedVolume);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      if (selectedVolume !== 'silencio') {
                        setPressedButton(`${theme.id}-incorrect`);
                        playPreview('incorrect', theme.id, selectedVolume);
                        setTimeout(() => setPressedButton(null), 150);
                      }
                    }
                  }}
                  style={{
                    '--bubble-bg': theme.color,
                    '--bubble-bg-hover': theme.color,
                    '--bubble-shadow-dark': theme.color,
                  } as React.CSSProperties}
                  className="feedback-button"
                  disabled={selectedVolume === 'silencio'}
                  aria-label={`Escuchar sonido de incorrecto para tema ${theme.label}`}
                  pressed={pressedButton === `${theme.id}-incorrect`}
                >
                  <IonIcon icon={closeSharp} className="btn-icon" style={{ fontSize: '24px' }} />
                </Button3Dtext>
              </div>
              
              <div className="feedback-item">
                <Button3Dtext
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedVolume !== 'silencio') {
                      playPreview('trophy', theme.id, selectedVolume);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      if (selectedVolume !== 'silencio') {
                        setPressedButton(`${theme.id}-trophy`);
                        playPreview('trophy', theme.id, selectedVolume);
                        setTimeout(() => setPressedButton(null), 150);
                      }
                    }
                  }}
                  style={{
                    '--bubble-bg': theme.color,
                    '--bubble-bg-hover': theme.color,
                    '--bubble-shadow-dark': theme.color,
                  } as React.CSSProperties}
                  className="feedback-button"
                  disabled={selectedVolume === 'silencio'}
                  aria-label={`Escuchar sonido de trofeo para tema ${theme.label}`}
                  pressed={pressedButton === `${theme.id}-trophy`}
                >
                  <IonIcon icon={trophySharp} className="btn-icon" style={{ fontSize: '24px' }} />
                </Button3Dtext>
              </div>
            </div>
          </SimpleButton>
        ))}
      </div>

      {/* Sección de Volumen */}
      <div className="controls-area">
        <div className="volume-group">
          {volumes.map((vol) => (
            <div key={vol.id} className="volume-wrapper">
              <span className="volume-label">{vol.label}</span>
              <Button3Dtext
                onClick={() => handleVolumeChange(vol.id)}
                className={`volume-button ${selectedVolume === vol.id ? 'selected' : ''}`}
              >
                <IonIcon icon={vol.icon} className="btn-icon" style={{ fontSize: '32px' }} />
              </Button3Dtext>
            </div>
          ))}
        </div>
        
        {/* Botón Aceptar - dentro del área de controles */}
        <div className='Accept-button-container-editColorsStudent'>
          <Button3Dtext 
            className='Accept-Button-Button-editColorsStudent' 
            color='var(--bubble-bg)'
            onClick={handleSavePreferences}
            aria-label="Guardar preferencias de audio"
          >
            <img
              src={imgAceptar}
              alt="Guardar los cambios"
              className="Accept-Button-image"
            />
          </Button3Dtext>
        </div>
      </div>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default EditNoiseStudent;