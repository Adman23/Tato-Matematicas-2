import './teacherEditColor.css';
import { IonPage, IonContent, IonButton, IonIcon, IonInput } from '@ionic/react';
import { arrowBack, arrowForward } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { HexColorPicker } from 'react-colorful';

// === Tipos ===
interface ColorState {
  background: string;
  appColor: string;
  textMain: string;
  textSec: string;
}

interface Palette {
  id: string;
  name: string;
  colors: ColorState;
}

// === Datos de Paletas ===
const PRESETS: Palette[] = [
  {
    id: 'default',
    name: 'Clásico',
    colors: { background: '#FFFFFF', appColor: '#50BFE6', textMain: '#000000', textSec: '#555555' }
  },
  {
    id: 'dark',
    name: 'Oscuro',
    colors: { background: '#1a1a2e', appColor: '#e94560', textMain: '#ffffff', textSec: '#a0a0a0' }
  },
  {
    id: 'forest',
    name: 'Bosque',
    colors: { background: '#f1f8e9', appColor: '#33691e', textMain: '#1b5e20', textSec: '#558b2f' }
  },
  {
    id: 'ocean',
    name: 'Océano',
    colors: { background: '#e0f7fa', appColor: '#006064', textMain: '#004d40', textSec: '#00838f' }
  },
  {
    id: 'sunset',
    name: 'Atardecer',
    colors: { background: '#fff3e0', appColor: '#ff6f00', textMain: '#bf360c', textSec: '#e65100' }
  }
];

export default function TeacherEditColor() {
  const history = useHistory();

  // Estado de los colores actuales
  const [currentColors, setCurrentColors] = useState<ColorState>(PRESETS[0].colors);
  
  // Mantenemos el ID de la paleta activa. 
  // Si editamos colores, NO cambiamos este ID, así el círculo sigue seleccionado y actualizándose.
  const [activePaletteId, setActivePaletteId] = useState<string>('default');

  // Seleccionar un preset
  const handlePresetClick = (preset: Palette) => {
    setCurrentColors({ ...preset.colors }); // Copia para romper referencia
    setActivePaletteId(preset.id);
  };

  // Cambiar un color individual
  const handleColorChange = (key: keyof ColorState, value: string) => {
    setCurrentColors(prev => ({
      ...prev,
      [key]: value
    }));
    // NOTA: No cambiamos activePaletteId a 'custom'.
    // Al mantener el ID, el círculo del preset seleccionado mostrará los colores "currentColors"
    // dando el efecto de "edición en vivo" sobre el preset.
  };

  const handleSave = () => {
    console.log("Guardando configuración:", currentColors);
    // Aquí iría tu lógica de guardado
    history.goBack();
  };

  return (
    <IonPage>
      <IonContent className="teacher-edit-color-content">
        <div className="teacher-edit-color-container">
          
          <h1 className="teacher-edit-color-title">Edición de color</h1>

          {/* === SECCIÓN PALETAS PREDEFINIDAS === */}
          <div className="teacher-edit-color-section">
            <h3 className="teacher-edit-color-subtitle">Paletas predefinidas</h3>
            
            <div className="teacher-edit-color-presets-row">
              <div className="teacher-edit-color-nav-arrow" onClick={() => history.goBack()}>
                <IonIcon icon={arrowBack} />
              </div>

              <div className="teacher-edit-color-presets-grid">
                {PRESETS.map((preset) => {
                  const isActive = activePaletteId === preset.id;
                  
                  // Si este preset está activo, mostramos los colores ACTUALES (editados)
                  // Si no, mostramos los colores originales del preset.
                  const displayColors = isActive ? currentColors : preset.colors;

                  return (
                    <div 
                      key={preset.id}
                      className={`teacher-edit-color-preset-item ${isActive ? 'selected' : ''}`}
                      onClick={() => handlePresetClick(preset)}
                      title={preset.name}
                    >
                      {/* Círculo de Fondo (Background) */}
                      <div 
                        className="teacher-edit-color-bubble-bg" 
                        style={{ backgroundColor: displayColors.background }}
                      ></div>
                      
                      {/* Círculo Frontal (App Color) */}
                      <div 
                        className="teacher-edit-color-bubble-fg" 
                        style={{ backgroundColor: displayColors.appColor }}
                      ></div>
                    </div>
                  );
                })}
              </div>

              <div className="teacher-edit-color-nav-arrow">
                <IonIcon icon={arrowForward} />
              </div>
            </div>
          </div>

          {/* === SECCIÓN PERSONALIZADO === */}
          <div className="teacher-edit-color-section">
            <h3 className="teacher-edit-color-subtitle">Personalizado</h3>
            
            <div className="teacher-edit-color-pickers-grid">
              
              {/* Picker Fondo */}
              <div className="teacher-edit-color-picker-card">
                <label>Fondo</label>
                <div className="picker-wrapper">
                  <HexColorPicker 
                    color={currentColors.background} 
                    onChange={(c) => handleColorChange('background', c)} 
                  />
                </div>
                <div className="hex-input-wrapper">
                  <div className="color-dot" style={{ backgroundColor: currentColors.background }}></div>
                  <IonInput 
                    value={currentColors.background} 
                    onIonChange={e => handleColorChange('background', e.detail.value!)}
                  />
                </div>
              </div>

              {/* Picker Color App */}
              <div className="teacher-edit-color-picker-card">
                <label>Color app</label>
                <div className="picker-wrapper">
                  <HexColorPicker 
                    color={currentColors.appColor} 
                    onChange={(c) => handleColorChange('appColor', c)} 
                  />
                </div>
                <div className="hex-input-wrapper">
                  <div className="color-dot" style={{ backgroundColor: currentColors.appColor }}></div>
                  <IonInput 
                    value={currentColors.appColor} 
                    onIonChange={e => handleColorChange('appColor', e.detail.value!)}
                  />
                </div>
              </div>

              {/* Picker Texto Principal */}
              <div className="teacher-edit-color-picker-card">
                <label>Color texto principal</label>
                <div className="picker-wrapper">
                  <HexColorPicker 
                    color={currentColors.textMain} 
                    onChange={(c) => handleColorChange('textMain', c)} 
                  />
                </div>
                <div className="hex-input-wrapper">
                  <div className="color-dot" style={{ backgroundColor: currentColors.textMain }}></div>
                  <IonInput 
                    value={currentColors.textMain} 
                    onIonChange={e => handleColorChange('textMain', e.detail.value!)}
                  />
                </div>
              </div>

              {/* Picker Texto Secundario */}
              <div className="teacher-edit-color-picker-card">
                <label>Color texto secundario</label>
                <div className="picker-wrapper">
                  <HexColorPicker 
                    color={currentColors.textSec} 
                    onChange={(c) => handleColorChange('textSec', c)} 
                  />
                </div>
                <div className="hex-input-wrapper">
                  <div className="color-dot" style={{ backgroundColor: currentColors.textSec }}></div>
                  <IonInput 
                    value={currentColors.textSec} 
                    onIonChange={e => handleColorChange('textSec', e.detail.value!)}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Botones de Acción */}
          <div className="teacher-edit-color-actions">
            <IonButton className="action-btn cancel" onClick={() => history.goBack()}>
              Cancelar
            </IonButton>
            <IonButton className="action-btn apply" onClick={handleSave}>
              Aplicar
            </IonButton>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
}