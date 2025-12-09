import React, { useState, useRef, useCallback, useEffect } from 'react';
import './EditNoiseStudent.css';
import { 
  desktopOutline, flowerOutline, gameControllerOutline,
  volumeMuteOutline, volumeLowOutline, volumeMediumOutline, volumeHighOutline,
  checkmarkSharp, closeSharp, trophySharp, arrowBack, musicalNotesOutline,
} from 'ionicons/icons';
import { IonIcon, IonPage, IonContent, useIonRouter, useIonViewWillEnter } from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import SimpleHeaderUser from './components/SimpleHeaderUser';
import { Button3Dtext } from '../global_components/PushableButtons';
import { SimpleButton } from '../global_components/SimpleButton';
import imgAceptar from '/assets/pictograms/correcto.png';
import { getAudioPreferences, saveAudioPreferences, type AudioPreferences } from '../../lib/api';

// --- Constantes y Configuraciones Estáticas ---
const THEMES = [
  { id: 'classic', label: 'Clásico', icon: musicalNotesOutline, color: 'var(--ion-color-primary)' },
  { id: 'digital', label: 'Digital', icon: desktopOutline, color: '#3498db' },
  { id: 'zen', label: 'Zen', icon: flowerOutline, color: '#27ae60' },
  { id: 'juego', label: 'Juego', icon: gameControllerOutline, color: '#e74c3c' },
];

const VOLUMES = [
  { id: 'silencio', label: 'Silencio', icon: volumeMuteOutline, value: 0 },
  { id: 'bajito', label: 'Bajito', icon: volumeLowOutline, value: 0.3 },
  { id: 'medio', label: 'Medio', icon: volumeMediumOutline, value: 0.6 },
  { id: 'alto', label: 'Alto', icon: volumeHighOutline, value: 1.0 },
];

const FEEDBACK_BUTTONS = [
  { type: 'correct', icon: checkmarkSharp, label: 'correcto' },
  { type: 'incorrect', icon: closeSharp, label: 'incorrecto' },
  { type: 'trophy', icon: trophySharp, label: 'trofeo' },
] as const;

type SoundType = 'correct' | 'incorrect' | 'trophy';

const EditNoiseStudent: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<string>('classic');
  const [selectedVolume, setSelectedVolume] = useState<string>('bajito');
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  
  const router = useIonRouter();
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Limpieza de audio al desmontar el componente
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  /**
   * Obtiene la ruta del archivo de audio.
   */
  const getSoundFile = useCallback((type: SoundType, theme: string): string => {
    return `/assets/sounds/${type}_${theme}.mp3`;
  }, []);

  /**
   * Obtiene el valor numérico del volumen.
   */
  const getVolumeValue = useCallback((volumeId: string): number => {
    const vol = VOLUMES.find(v => v.id === volumeId);
    return vol ? vol.value : 0.5;
  }, []);

  /**
   * Reproduce el sonido de previsualización.
   */
  const playPreview = useCallback((type: SoundType, theme: string, volumeId: string) => {
    const soundFile = getSoundFile(type, theme);
    if (!soundFile) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(soundFile);
    audio.volume = getVolumeValue(volumeId);
    audioRef.current = audio;

    audio.play().catch((error) => console.error('Error playing audio:', error));
  }, [getSoundFile, getVolumeValue]);

  /**
   * Maneja la interacción (click o teclado) de los botones de feedback.
   */
  const handleFeedbackInteraction = (e: React.SyntheticEvent, type: SoundType, themeId: string) => {
    e.stopPropagation();
    
    // Si es evento de teclado, verificar teclas
    if (e.type === 'keydown') {
      const keyEvent = e as React.KeyboardEvent;
      if (keyEvent.key !== 'Enter' && keyEvent.key !== ' ') return;
      e.preventDefault();
    }

    if (selectedVolume !== 'silencio') {
      if (e.type === 'keydown') {
        setPressedButton(`${themeId}-${type}`);
        setTimeout(() => setPressedButton(null), 150);
      }
      playPreview(type, themeId, selectedVolume);
    }
  };

  const handleVolumeChange = useCallback((volumeId: string) => {
    setSelectedVolume(volumeId);
    if (volumeId !== 'silencio') {
      playPreview('correct', selectedTheme, volumeId);
    }
  }, [playPreview, selectedTheme]);

  // Carga inicial de preferencias
  useIonViewWillEnter(() => {
    if (!user?.id) return;
    getAudioPreferences(user.id)
      .then(prefs => {
        setSelectedTheme(prefs.theme);
        setSelectedVolume(prefs.volume);
      })
      .catch(err => console.error('Error cargando audio_preferences:', err));
  });

  const handleSavePreferences = async () => {
    if (!user?.id) return;
    try {
      const preferences: AudioPreferences = {
        theme: selectedTheme as AudioPreferences['theme'],
        volume: selectedVolume as AudioPreferences['volume'],
      };
      await saveAudioPreferences(user.id, preferences);
      router.push('/student/profile', 'back', 'pop');
    } catch (err) {
      console.error('Error guardando audio_preferences:', err);
    }
  };

  const isMuted = selectedVolume === 'silencio';

  return (
    <IonPage>
      <SimpleHeaderUser
        userName={user?.username || "username"}
        photoUrl={user?.photo_url}
        hidden={true}
      />

      <IonContent 
        className="ion-padding" 
        scrollY={false} 
        style={{ 
          '--background': 'var(--ion-color-primary-contrast)', 
          '--padding-bottom': '0', 
          '--overflow': 'hidden' 
        } as React.CSSProperties}
      >
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
            {THEMES.map((theme) => (
              <SimpleButton
                key={theme.id}
                className={`theme-card ${selectedTheme === theme.id ? 'selected' : ''} ${isMuted ? 'disabled' : ''}`}
                onClick={() => !isMuted && setSelectedTheme(theme.id)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isMuted) {
                    e.preventDefault();
                    setSelectedTheme(theme.id);
                  }
                }}
                tabIndex={isMuted ? -1 : 0}
                role="button"
                aria-label={`Seleccionar tema ${theme.label}`}
                aria-pressed={selectedTheme === theme.id}
              >
                <span className="theme-label">{theme.label}</span>
                
                <div className="icon-circle" style={{ backgroundColor: theme.color }}>
                  <IonIcon icon={theme.icon} />
                </div>

                {/* Sub-iconos de feedback optimizados */}
                <div className="feedback-icons">
                  {FEEDBACK_BUTTONS.map((btn) => (
                    <div className="feedback-item" key={btn.type}>
                      <Button3Dtext
                        onClick={(e) => handleFeedbackInteraction(e, btn.type, theme.id)}
                        onKeyDown={(e) => handleFeedbackInteraction(e, btn.type, theme.id)}
                        style={{
                          '--bubble-bg': theme.color,
                          '--bubble-bg-hover': theme.color,
                          '--bubble-shadow-dark': theme.color,
                        } as React.CSSProperties}
                        className="feedback-button"
                        disabled={isMuted}
                        aria-label={`Escuchar sonido de ${btn.label} para tema ${theme.label}`}
                        pressed={pressedButton === `${theme.id}-${btn.type}`}
                      >
                        <IonIcon icon={btn.icon} className="btn-icon" style={{ fontSize: '24px' }} />
                      </Button3Dtext>
                    </div>
                  ))}
                </div>
              </SimpleButton>
            ))}
          </div>

          {/* Sección de Volumen */}
          <div className="controls-area">
            <div className="volume-group">
              {VOLUMES.map((vol) => (
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
            
            <div className='Accept-button-container-editNoiseStudent'>
              <Button3Dtext 
                className='Accept-Button-Button-editNoiseStudent' 
                color='var(--bubble-bg)'
                onClick={handleSavePreferences}
                aria-label="Guardar preferencias de audio"
              >
                <img src={imgAceptar} alt="Guardar los cambios" className="Accept-Button-image" />
              </Button3Dtext>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EditNoiseStudent;