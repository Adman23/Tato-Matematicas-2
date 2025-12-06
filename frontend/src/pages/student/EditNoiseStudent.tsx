import React, { useState } from 'react';
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
  thumbsUpSharp
} from 'ionicons/icons';
import { IonIcon } from '@ionic/react';

const EditNoiseStudent: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<string>('digital');
  const [selectedVolume, setSelectedVolume] = useState<string>('bajito');

  const themes = [
    { id: 'digital', label: 'Digital', icon: desktopOutline, color: '#be5fa6' },
    { id: 'zen', label: 'Zen', icon: flowerOutline, color: '#4cb0a5' },
    { id: 'juego', label: 'Juego', icon: gameControllerOutline, color: '#8f3c97' },
  ];

  const volumes = [
    { id: 'silencio', label: 'Silencio', icon: volumeMuteOutline },
    { id: 'bajito', label: 'Bajito', icon: volumeLowOutline },
    { id: 'medio', label: 'Medio', icon: volumeMediumOutline },
    { id: 'alto', label: 'Alto', icon: volumeHighOutline },
  ];

  return (
    <div className="container">
      <h1 className="main-title">Elige tus sonidos</h1>

      {/* Sección de Temas */}
      <div className="themes-row">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`theme-card ${selectedTheme === theme.id ? 'selected' : ''}`}
            onClick={() => setSelectedTheme(theme.id)}
          >
            <span className="theme-label">{theme.label}</span>
            
            {/* Círculo del icono principal */}
            <div className="icon-circle" style={{ backgroundColor: theme.color }}>
              <IonIcon icon={theme.icon} />
            </div>

            {/* Sub-iconos de feedback (Check, X, Trofeo) */}
            <div className="feedback-icons">
              <div className="feedback-item">
                {/* Envolvemos el icono en un span para aplicar la clase sin error de TS */}
                <span className="fb-status check">
                  <IonIcon icon={checkmarkSharp} />
                </span>
                <span className="fb-speaker">
                  <IonIcon icon={volumeHighOutline} />
                </span>
              </div>
              
              <div className="feedback-item">
                <span className="fb-status cross">
                  <IonIcon icon={closeSharp} />
                </span>
                <span className="fb-speaker">
                  <IonIcon icon={volumeHighOutline} />
                </span>
              </div>
              
              <div className="feedback-item">
                <span className="fb-status trophy">
                  <IonIcon icon={trophySharp} />
                </span>
                <span className="fb-speaker">
                  <IonIcon icon={volumeHighOutline} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sección de Volumen */}
      <div className="controls-area">
        <div className="volume-group">
          {volumes.map((vol) => (
            <div key={vol.id} className="volume-wrapper">
              <span className="volume-label">{vol.label}</span>
              <button
                className={`volume-btn ${selectedVolume === vol.id ? 'active' : ''}`}
                onClick={() => setSelectedVolume(vol.id)}
              >
                <IonIcon icon={vol.icon} />
              </button>
            </div>
          ))}
        </div>

        {/* Botón Aceptar */}
        <button className="accept-btn">
          <div className="pictogram-content">
             <div className="picto-figure">
                <IonIcon icon={thumbsUpSharp} size="large" />
             </div>
             <div className="picto-bubble">
               <IonIcon icon={checkmarkSharp} />
             </div>
          </div>
          <span className="accept-text">ACEPTAR</span>
        </button>
      </div>
    </div>
  );
};

export default EditNoiseStudent;