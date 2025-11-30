import {
  IonPage,
  IonContent,
  IonText,
  IonSpinner,
  IonIcon,
  useIonRouter,
  useIonViewWillEnter,
} from '@ionic/react';
import { arrowBack, arrowForward, person, checkmark, trash } from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { authAPI } from '../../lib/api'; 
import type { Group, User } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext'; 
import { Button3Dtext } from '../global_components/PushableButtons'; 

import './StudentLoginSelection.css';

const PICTOGRAMS = [
  { id: 'perro', name: 'Perro', image: '/assets/pictograms/perro.png' },
  { id: 'gato', name: 'Gato', image: '/assets/pictograms/gato.png' },
  { id: 'tortuga', name: 'Tortuga', image: '/assets/pictograms/tortuga.png' },
  { id: 'león', name: 'León', image: '/assets/pictograms/león.png' },
  { id: 'elefante', name: 'Elefante', image: '/assets/pictograms/elefante.png' },
];

const REQUIRED_LENGTH = 3;
const MAX_LENGTH = REQUIRED_LENGTH;

type GridItem = Group | User;
type LoginPhase = 'GROUPS' | 'STUDENTS' | 'PASSWORD';

export default function StudentLoginUnified() {
  const router = useIonRouter();
  const { login } = useAuth(); 
  
  const [currentPhase, setCurrentPhase] = useState<LoginPhase>('GROUPS');
  
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  const [items, setItems] = useState<GridItem[]>([]);
  const [selectedGridItem, setSelectedGridItem] = useState<GridItem | null>(null);
  const [confirmPendingId, setConfirmPendingId] = useState<string | null>(null);
  const [gridPage, setGridPage] = useState(0);
  
  const [selectedPictos, setSelectedPictos] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const getGridSize = () => (window.innerWidth <= 650 ? 2 : 4);
  const [visibleCount, setVisibleCount] = useState(getGridSize());

  useEffect(() => {
    const handleResize = () => setVisibleCount(getGridSize());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // --- AUTO-SUBMIT ---
  useEffect(() => {
    if (currentPhase === 'PASSWORD' && selectedPictos.length === REQUIRED_LENGTH && !loading) {
        submitLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPictos, currentPhase]); 

  useIonViewWillEnter(() => {
    resetFlow();
  });

  const resetFlow = () => {
    setCurrentPhase('GROUPS');
    setSelectedGroup(null);
    setSelectedStudent(null);
    setSelectedPictos([]);
    setError('');
    loadGroups();
  };

  // --- LÓGICA DE CARGA DE DATOS ---

  const loadGroups = async () => {
    setLoading(true);
    setError('');
    try {
      const groups = await authAPI.getGroups();
      setItems(groups);
      setGridPage(0);
      setConfirmPendingId(null);
      setSelectedGridItem(null);
    } catch (err) {
      console.error(err);
      setError('Error cargando grupos');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (groupId: string) => {
    setLoading(true);
    setError('');
    try {
      const students = await authAPI.getStudentsByGroup(groupId);
      setItems(students);
      setGridPage(0);
      setConfirmPendingId(null);
      setSelectedGridItem(null);
    } catch (err) {
      console.error(err);
      setError('Error cargando estudiantes');
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA FASE 1 & 2: SELECCIÓN EN REJILLA ---

  const handleTileClick = (item: GridItem) => {
    if (loading) return;

    if (selectedGridItem?.id === item.id && confirmPendingId === String(item.id)) {
      handleAdvance();
      return;
    }

    setSelectedGridItem(item);
    setConfirmPendingId(String(item.id));
    setError('');
  };

  // --- LÓGICA FASE 3: CONTRASEÑA ---

  const addPicto = (pictogramId: string) => {
    if (loading) return; 
    setSelectedPictos(prev => {
      if (prev.length >= MAX_LENGTH) {
        return prev;
      }
      setError('');
      return [...prev, pictogramId];
    });
  };

  const removePictoAtIndex = (indexToRemove: number) => {
    if (loading) return; 
    setSelectedPictos(prev => prev.filter((_, index) => index !== indexToRemove));
    setError('');
  };

  // --- CONTROL DE FLUJO ---

  const handleAdvance = async () => {
    if (loading) return; 
    setError('');
    
    if (currentPhase === 'GROUPS') {
      if (!selectedGridItem) return;
      const group = selectedGridItem as Group;
      setSelectedGroup(group);
      setCurrentPhase('STUDENTS');
      loadStudents(String(group.id));
    } 
    else if (currentPhase === 'STUDENTS') {
      if (!selectedGridItem) return;
      const student = selectedGridItem as User;
      setSelectedStudent(student);
      setCurrentPhase('PASSWORD');
      setSelectedPictos([]); 
    }
    else if (currentPhase === 'PASSWORD') {
        if (selectedPictos.length < REQUIRED_LENGTH) {
            setError('Te faltan animales');
            return;
        }
        await submitLogin();
    }
  };

  const submitLogin = async () => {
    if (!selectedStudent || !selectedGroup) return;
    
    if (loading) return;

    setLoading(true);
    try {
        const password = selectedPictos.join('-');
        await login({
            group_id: String(selectedGroup.id),
            username: selectedStudent.username,
            password: password
        });
        
        setSelectedPictos([]);
        router.push('/student/dashboard', 'root');
    } catch (err: any) {
        console.error(err);
        setError('Clave incorrecta');
        setSelectedPictos([]);
    } finally {
        setLoading(false);
    }
  };

  const handleBack = () => {
    if (loading) return; 

    setError('');
    if (currentPhase === 'PASSWORD') {
      setCurrentPhase('STUDENTS');
      setSelectedPictos([]);
    } else if (currentPhase === 'STUDENTS') {
      setCurrentPhase('GROUPS');
      setSelectedGroup(null);
      loadGroups(); 
    } else {
      router.push('/login', 'back');
    }
  };

  // --- HELPERS VISUALES ---
  const getLetterFromAlias = (alias?: string) => {
    if (!alias) return '?'; 
    const parts = alias.split(' ');
    return parts.length > 1 ? parts[1].charAt(0).toUpperCase() : alias.charAt(0).toUpperCase();
  };

  const totalPages = Math.ceil(items.length / visibleCount);
  const startIndex = gridPage * visibleCount;
  const visibleItems = items.slice(startIndex, startIndex + visibleCount);
  const emptySlots = Math.max(0, visibleCount - visibleItems.length);

  // --- RENDERIZADO DEL HEADER ---
  const renderHeader = () => (
    <div className={currentPhase === 'PASSWORD' ? "step3-header-row" : "sel-header-row"}>
      <Button3Dtext 
        color="var(--ion-color-primary)" 
        onClick={handleBack} 
        disabled={loading}
      >
         <IonIcon icon={currentPhase === 'GROUPS' ? person : arrowBack} className="btn-icon" />
      </Button3Dtext>

      <img 
        src="/assets/Tato/Tatitulo.png" 
        alt="Tato Matemáticas" 
        className={currentPhase === 'PASSWORD' ? "step3-logo-title" : "sel-logo-title"}
      />

      {currentPhase === 'PASSWORD' ? (
         <Button3Dtext 
            onClick={handleAdvance}
            disabled={loading || selectedPictos.length !== REQUIRED_LENGTH}
         >
             {loading ? <IonSpinner name="dots" /> : <IonIcon icon={checkmark} className="btn-icon" />}
         </Button3Dtext>
      ) : (
         <Button3Dtext 
            color="var(--ion-color-success)" 
            onClick={handleAdvance}
            disabled={loading || !selectedGridItem}
         >
            <IonIcon icon={checkmark} className="btn-icon" />
         </Button3Dtext>
      )}
    </div>
  );

  return (
    <IonPage>
      <IonContent className="student-login-content" scrollY={false}>
        
        <div className={currentPhase === 'PASSWORD' ? "step3-container" : "sel-login-container"}>
          
          {renderHeader()}

          {/* --- NUEVO: TEXTOS DE INSTRUCCIÓN PARA FASES 1 y 2 --- */}
          {currentPhase === 'GROUPS' && (
            <div className="sel-instructions">
              <h2 className="sel-subtitle">Selecciona tu clase</h2>
            </div>
          )}

          {currentPhase === 'STUDENTS' && (
            <div className="sel-instructions">
              <h2 className="sel-subtitle">Selecciona tu usuario</h2>
            </div>
          )}
          {/* --------------------------------------------------- */}

          {currentPhase !== 'PASSWORD' ? (
            /* --- VISTA DE REJILLA (FASES 1 Y 2) --- */
            <>
                <div className="sel-main-wrapper">
                    <div className="sel-classes-card animate-fade-in" key={currentPhase}>
                        {loading ? (
                            <IonSpinner name="crescent" color="light" style={{ transform: 'scale(2)' }} />
                        ) : items.length === 0 ? (
                            <IonText color="light"><h2>No hay datos disponibles</h2></IonText>
                        ) : (
                            <div className="sel-group-grid">
                            {visibleItems.map((item) => {
                                const isSelected = selectedGridItem?.id === item.id;
                                const isGroup = currentPhase === 'GROUPS';

                                return (
                                <button
                                    key={item.id}
                                    onClick={() => handleTileClick(item)}
                                    disabled={loading} 
                                    className={`sel-group-tile ${isSelected ? 'selected' : ''}`}
                                    style={{ 
                                        flexDirection: isGroup ? 'row' : 'column',
                                        gap: isGroup ? '0' : '5%'
                                    }}
                                >
                                    {isGroup ? (
                                        <>
                                            <img src="/assets/pictograms/clase.png" alt={(item as Group).alias} className="sel-group-icon" />
                                            <span className="sel-group-letter">{getLetterFromAlias((item as Group).alias)}</span>
                                        </>
                                    ) : (
                                        <>
                                            <img
                                                src={(item as User).photo_url || "/assets/pictograms/user_default.png"}
                                                alt={(item as User).username}
                                                style={{
                                                    width: '60%', height: '60%', objectFit: 'contain',
                                                    borderRadius: '50%', pointerEvents: 'none'
                                                }}
                                            />
                                            <span style={{
                                                fontSize: 'clamp(1rem, 2.5vh, 1.5rem)',
                                                fontWeight: 'bold', color: '#333',
                                                pointerEvents: 'none', lineHeight: 1.2
                                            }}>
                                                {(item as User).username}
                                            </span>
                                        </>
                                    )}
                                    {confirmPendingId === String(item.id) && (
                                    <div className="sel-confirm-overlay">
                                        <img src="/assets/pictograms/si.png" alt="Confirmar" className="sel-confirm-icon" />
                                    </div>
                                    )}
                                </button>
                                );
                            })}
                            {Array.from({ length: emptySlots }).map((_, i) => (
                                <div key={`empty-${i}`} className="sel-group-ghost"></div>
                            ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="sel-footer-controls">
                    <div style={{ visibility: (items.length > visibleCount) ? 'visible' : 'hidden' }}>
                        <Button3Dtext 
                            color="var(--ion-color-primary)" 
                            onClick={() => setGridPage(p => p-1)} 
                            disabled={gridPage === 0 || loading}
                        >
                            <IonIcon icon={arrowBack} className="btn-icon" />
                        </Button3Dtext>
                    </div>
                    
                    <ul className="sel-page-indicators" style={{ visibility: (items.length > visibleCount) ? 'visible' : 'hidden' }}>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <li key={i}>
                            <button 
                                className="sel-page-indicator" 
                                onClick={() => !loading && setGridPage(i)} 
                                disabled={loading}
                                aria-selected={gridPage === i} 
                            />
                            </li>
                        ))}
                    </ul>

                    <div style={{ visibility: (items.length > visibleCount) ? 'visible' : 'hidden' }}>
                        <Button3Dtext 
                            color="var(--ion-color-primary)" 
                            onClick={() => setGridPage(p => p+1)} 
                            disabled={gridPage >= totalPages - 1 || loading}
                        >
                            <IonIcon icon={arrowForward} className="btn-icon" />
                        </Button3Dtext>
                    </div>
                </div>
            </>
          ) : (
            /* --- VISTA DE PASSWORD (FASE 3) --- */
            <>
                <div className="step3-instructions">
                    <h2 className="step3-subtitle">
                         Hola, {selectedStudent?.username}. Tu clave:
                    </h2>
                </div>

                {/* Resto del código de la fase password sin cambios... */}
                <div className="step3-sequence-row">
                    {Array.from({ length: REQUIRED_LENGTH }, (_, index) => {
                    const pictogramId = selectedPictos[index];
                    const picto = pictogramId ? PICTOGRAMS.find(p => p.id === pictogramId) : null;
                    
                    return (
                        <div
                        key={`slot-${index}`}
                        className={`step3-sequence-slot ${picto ? 'filled' : 'empty'}`}
                        onClick={() => !loading && picto && removePictoAtIndex(index)}
                        style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                        >
                        {picto ? (
                            <>
                            <img src={picto.image} alt={picto.name} className="step3-slot-image" />
                            <div className="step3-slot-overlay">
                                <IonIcon icon={trash} />
                            </div>
                            </>
                        ) : (
                            <span className="step3-slot-dot">?</span>
                        )}
                        </div>
                    );
                    })}
                </div>

                <div className="step3-card-wrapper">
                    <div className="step3-keyboard-card">
                        {loading ? (
                            <IonSpinner name="crescent" color="light" />
                        ) : (
                            <div className="step3-keyboard-grid">
                                {PICTOGRAMS.map((picto) => (
                                    <button
                                    key={picto.id}
                                    onClick={() => addPicto(picto.id)}
                                    disabled={loading || selectedPictos.length >= MAX_LENGTH}
                                    className="step3-key-tile"
                                    >
                                    <img
                                        src={picto.image}
                                        alt={picto.name}
                                        className="step3-key-image"
                                    />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </>
          )}

          {error && (
            <div className={currentPhase === 'PASSWORD' ? "step3-error-message" : "sel-error-message"}>
               {currentPhase === 'PASSWORD'}
               {error}
            </div>
          )}

        </div>
      </IonContent>
    </IonPage>
  );
}