import './teacherEditColor.css';
import { 
  IonPage, 
  IonContent, 
  IonButton, 
  IonIcon, 
  IonInput,
  useIonRouter // ✅ Reemplaza useHistory
} from '@ionic/react';
import { arrowBack, arrowForward } from 'ionicons/icons';
import { useState, useMemo } from 'react';
import { HexColorPicker } from 'react-colorful';
import HeaderTeacherItem from './components/HeaderTeacherItem';
import { useAuth } from '../../contexts/AuthContext';

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

const PRESETS: Palette[] = [
  { id: 'default', name: 'Clásico', colors: { background: '#FFFFFF', appColor: '#50BFE6', textMain: '#000000', textSec: '#555555' } },
  { id: 'dark', name: 'Oscuro', colors: { background: '#1a1a2e', appColor: '#e94560', textMain: '#ffffff', textSec: '#a0a0a0' } },
  { id: 'forest', name: 'Bosque', colors: { background: '#f1f8e9', appColor: '#33691e', textMain: '#1b5e20', textSec: '#558b2f' } },
  { id: 'ocean', name: 'Océano', colors: { background: '#e0f7fa', appColor: '#006064', textMain: '#004d40', textSec: '#00838f' } },
  { id: 'sunset', name: 'Atardecer', colors: { background: '#fff3e0', appColor: '#ff6f00', textMain: '#bf360c', textSec: '#e65100' } }
];

const adjustBrightness = (col: string, amt: number) => {
  let usePound = false;
  if (col[0] === "#") {
    col = col.slice(1);
    usePound = true;
  }
  const num = parseInt(col, 16);
  let r = (num >> 16) + amt;
  if (r > 255) r = 255;
  else if (r < 0) r = 0;
  let b = ((num >> 8) & 0x00FF) + amt;
  if (b > 255) b = 255;
  else if (b < 0) b = 0;
  let g = (num & 0x0000FF) + amt;
  if (g > 255) g = 255;
  else if (g < 0) g = 0;
  return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
};

export default function TeacherEditColor() {
  const router = useIonRouter(); // ✅
  const { user, logout } = useAuth();
  
  const [currentColors, setCurrentColors] = useState<ColorState>(PRESETS[0].colors);
  const [activePaletteId, setActivePaletteId] = useState<string>('default');

  const handlePresetClick = (preset: Palette) => {
    setCurrentColors({ ...preset.colors }); 
    setActivePaletteId(preset.id);
  };

  const handleColorChange = (key: keyof ColorState, value: string) => {
    setCurrentColors(prev => ({ ...prev, [key]: value }));
    if (activePaletteId !== 'custom') setActivePaletteId('custom');
  };

  const handleSave = () => {
    console.log("Guardando colores:", currentColors);
    // ⚠️ Guardar en localStorage/backend aquí si corresponde
    // Ej: localStorage.setItem('userTheme', JSON.stringify(currentColors));

    // ✅ Volver a perfil SIN animación, manteniendo historial
    router.push('/teacheredit/profile', 'none', 'pop');
  };

  const handleLogout = async () => {
    await logout();
    router.push('/', 'none', 'replace');
  };

  // ✅ Ir a perfil SIN animación (misma acción que handleSave)
  const goToProfilePage = () => {
    router.push('/teacheredit/profile', 'none', 'pop');
  };

  const dynamicStyles = useMemo(() => {
    return {
      '--tatomaths-background': currentColors.background,
      '--ion-color-primary': currentColors.appColor,
      '--ion-color-primary-shade': adjustBrightness(currentColors.appColor, -40),
      '--tatomaths-text': currentColors.textMain,
      '--ion-color-dark': currentColors.textSec,
      '--ion-color-primary-contrast': '#ffffff',
      backgroundColor: currentColors.background 
    } as React.CSSProperties;
  }, [currentColors]);

  return (
    <IonPage style={dynamicStyles}>
      <HeaderTeacherItem
        teacherName={user?.username || "Profesor"}
        teacherAvatar={user?.photo_url || "/assets/pictograms/user_default.png"}
        onLogoutClick={handleLogout}
      />

      <IonContent className="teacher-edit-color-content" scrollY={false}>
        <div className="teacher-edit-color-layout-wrapper">
          
          {/* ⬅️ Flecha Izquierda: volver SIN animación */}
          <div className="teacher-edit-color-side-arrow left" onClick={goToProfilePage}>
            <IonIcon icon={arrowBack} />
          </div>

          <div className="teacher-edit-color-container">
            <h1 className="teacher-edit-color-title">Edición de color</h1>

            <div className="teacher-edit-color-section section-presets">
              <h3 className="teacher-edit-color-subtitle">Paletas predefinidas</h3>
              <div className="teacher-edit-color-presets-grid">
                {PRESETS.map((preset) => {
                  const isActive = activePaletteId === preset.id;
                  const displayColors = isActive ? currentColors : preset.colors;
                  return (
                    <div 
                      key={preset.id}
                      className={`teacher-edit-color-preset-item ${isActive ? 'selected' : ''}`}
                      onClick={() => handlePresetClick(preset)}
                      title={preset.name}
                    >
                      <div className="teacher-edit-color-bubble-bg" style={{ backgroundColor: displayColors.background }}></div>
                      <div className="teacher-edit-color-bubble-fg" style={{ backgroundColor: displayColors.appColor }}></div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="teacher-edit-color-section section-pickers">
              <h3 className="teacher-edit-color-subtitle">Personalizado</h3>
              <div className="teacher-edit-color-pickers-grid">
                <div className="teacher-edit-color-picker-card">
                  <label>Fondo</label>
                  <div className="picker-wrapper">
                    <HexColorPicker color={currentColors.background} onChange={(c) => handleColorChange('background', c)} />
                  </div>
                  <div className="hex-input-wrapper">
                    <div className="color-dot" style={{ backgroundColor: currentColors.background }}></div>
                    <IonInput value={currentColors.background} onIonChange={e => handleColorChange('background', e.detail.value!)} maxlength={7}/>
                  </div>
                </div>

                <div className="teacher-edit-color-picker-card">
                  <label>App</label>
                  <div className="picker-wrapper">
                    <HexColorPicker color={currentColors.appColor} onChange={(c) => handleColorChange('appColor', c)} />
                  </div>
                  <div className="hex-input-wrapper">
                    <div className="color-dot" style={{ backgroundColor: currentColors.appColor }}></div>
                    <IonInput value={currentColors.appColor} onIonChange={e => handleColorChange('appColor', e.detail.value!)} maxlength={7}/>
                  </div>
                </div>

                <div className="teacher-edit-color-picker-card">
                  <label>Texto principal</label>
                  <div className="picker-wrapper">
                    <HexColorPicker color={currentColors.textMain} onChange={(c) => handleColorChange('textMain', c)} />
                  </div>
                  <div className="hex-input-wrapper">
                    <div className="color-dot" style={{ backgroundColor: currentColors.textMain }}></div>
                    <IonInput value={currentColors.textMain} onIonChange={e => handleColorChange('textMain', e.detail.value!)} maxlength={7}/>
                  </div>
                </div>

                <div className="teacher-edit-color-picker-card">
                  <label>Texto secundario</label>
                  <div className="picker-wrapper">
                    <HexColorPicker color={currentColors.textSec} onChange={(c) => handleColorChange('textSec', c)} />
                  </div>
                  <div className="hex-input-wrapper">
                    <div className="color-dot" style={{ backgroundColor: currentColors.textSec }}></div>
                    <IonInput value={currentColors.textSec} onIonChange={e => handleColorChange('textSec', e.detail.value!)} maxlength={7}/>
                  </div>
                </div>
              </div>
            </div>

            <div className="teacher-edit-color-actions">
              <IonButton 
                className="action-btn cancel" 
                onClick={() => router.push('/teacheredit/profile', 'none', 'pop')} // ✅
              >
                Cancelar
              </IonButton>
              <IonButton className="action-btn apply" onClick={handleSave}>
                Aplicar
              </IonButton>
            </div>
          </div>

          <div className="teacher-edit-color-side-arrow right disabled">
            <IonIcon icon={arrowForward} />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}