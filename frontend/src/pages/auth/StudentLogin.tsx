import {
  IonPage,
  IonContent,
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
// --- IMPORTACIONES ---
import { Button3Dtext } from '../global_components/PushableButtons'; 
import { Background } from '../global_components/Background'; // <--- AQUI (ajusta la ruta)

import './StudentLogin.css';

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
  
  const getLayoutConfig = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const useSmallGrid = w <= 700 || h < 620;
    
    if (useSmallGrid) {
        if (h < 600 && w > h) {
            return { itemsPerPage: 2, cssClass: 'grid-landscape-2' };
        }
        return { itemsPerPage: 2, cssClass: 'grid-portrait-2' };
    }
    return { itemsPerPage: 4, cssClass: 'grid-standard-4' };
  };

  const [layout, setLayout] = useState(getLayoutConfig());

  useEffect(() => {
    const handleResize = () => {
        const newLayout = getLayoutConfig();
        setLayout(prev => (prev.cssClass !== newLayout.cssClass ? newLayout : prev));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setGridPage(0);
  }, [layout.itemsPerPage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (currentPhase === 'PASSWORD' && selectedPictos.length === REQUIRED_LENGTH && !loading) {
        submitLogin();
    }
  }, [selectedPictos, currentPhase]); 

  useIonViewWillEnter(() => resetFlow());

  const resetFlow = () => {
    setCurrentPhase('GROUPS');
    setSelectedGroup(null);
    setSelectedStudent(null);
    setSelectedPictos([]);
    setError('');
    loadGroups();
  };

  const loadGroups = async () => {
    setLoading(true); setError('');
    setItems([]); 
    try {
      const groups = await authAPI.getGroups();
      setItems(groups);
      setGridPage(0); setConfirmPendingId(null); setSelectedGridItem(null);
    } catch (err) { console.error(err); setError('Error cargando grupos'); } 
    finally { setLoading(false); }
  };

  const loadStudents = async (groupId: string) => {
    setLoading(true); setError('');
    setItems([]); 
    try {
      const students = await authAPI.getStudentsByGroup(groupId);
      setItems(students);
      setGridPage(0); setConfirmPendingId(null); setSelectedGridItem(null);
    } catch (err) { console.error(err); setError('Error cargando estudiantes'); } 
    finally { setLoading(false); }
  };

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

  const addPicto = (pictogramId: string) => {
    if (loading) return; 
    setSelectedPictos(prev => prev.length >= MAX_LENGTH ? prev : [...prev, pictogramId]);
    setError('');
  };

  const removePictoAtIndex = (indexToRemove: number) => {
    if (loading) return; 
    setSelectedPictos(prev => prev.filter((_, index) => index !== indexToRemove));
    setError('');
  };

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
            setError('Faltan imágenes'); return;
        }
        await submitLogin();
    }
  };

  const submitLogin = async () => {
    if (!selectedStudent || !selectedGroup || loading) return;
    setLoading(true);
    try {
        await login({
            group_id: String(selectedGroup.id),
            username: selectedStudent.username,
            password: selectedPictos.join('-')
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
      setCurrentPhase('STUDENTS'); setSelectedPictos([]);
    } else if (currentPhase === 'STUDENTS') {
      setCurrentPhase('GROUPS'); setSelectedGroup(null); loadGroups(); 
    } else {
      router.push('/login', 'back');
    }
  };

  const getLetterFromAlias = (alias?: string) => {
    if (!alias) return '?'; 
    const parts = alias.split(' ');
    return parts.length > 1 ? parts[1].charAt(0).toUpperCase() : alias.charAt(0).toUpperCase();
  };

  const totalPages = Math.ceil(items.length / layout.itemsPerPage);
  const startIndex = gridPage * layout.itemsPerPage;
  const visibleItems = items.slice(startIndex, startIndex + layout.itemsPerPage);
  
  const emptySlots = loading 
    ? layout.itemsPerPage 
    : Math.max(0, layout.itemsPerPage - visibleItems.length);

  return (
    <IonPage>
      {/* NOTA IMPORTANTE: El scrollY debe ser false para que el fondo
         funcione bien y no haya scrolls indeseados en la pantalla.
      */}
      <IonContent className="st-login-content" scrollY={false}>
        
        {/* COMPONENTE DE FONDO NUEVO */}
        <Background color="var(--ion-color-primary)" />

        <div className="st-login-layout">
            
            {/* HEADER */}
            <header className="st-login-header">
                <div className="st-header-side">
                    <div style={{ transform: 'scale(1.2)' }}>
                        <Button3Dtext color="var(--ion-color-primary)" onClick={handleBack} disabled={loading}>
                            <IonIcon icon={currentPhase === 'GROUPS' ? person : arrowBack} />
                        </Button3Dtext>
                    </div>
                </div>
                <div className="st-header-center">
                    <img src="/assets/Tato/Tatitulo.png" alt="Tato" className="st-login-logo" />
                </div>
                <div className="st-header-side">
                    <div style={{ transform: 'scale(1.2)' }}>
                        {currentPhase === 'PASSWORD' ? (
                            <Button3Dtext onClick={handleAdvance} disabled={loading || selectedPictos.length !== REQUIRED_LENGTH}>
                                {loading ? <IonSpinner name="dots" /> : <IonIcon icon={checkmark} />}
                            </Button3Dtext>
                        ) : (
                            <Button3Dtext color="var(--ion-color-primary)" onClick={handleAdvance} disabled={loading || !selectedGridItem}>
                                <IonIcon icon={checkmark} />
                            </Button3Dtext>
                        )}
                    </div>
                </div>
            </header>

            <div className="st-login-subtitle-area">
                <h2 className="st-login-subtitle">
                    {currentPhase === 'GROUPS' && "Selecciona tu clase"}
                    {currentPhase === 'STUDENTS' && "Selecciona tu usuario"}
                    {currentPhase === 'PASSWORD' && `Hola, ${selectedStudent?.username}. Tu clave:`}
                </h2>
            </div>

            {/* AREA PRINCIPAL */}
            <div className="st-login-main-area">
                
                {currentPhase !== 'PASSWORD' ? (
                    /* MODO GRID (GRUPOS O ALUMNOS) */
                    <div className={`st-card-wrapper st-anim-pop-in ${layout.cssClass}`}>
                        
                        {loading ? (
                             <div className={`st-grid-inner ${layout.cssClass}`}>
                                 {Array.from({ length: layout.itemsPerPage }).map((_, i) => (
                                     <div key={`loading-${i}`} className="st-grid-btn ghost loading"></div>
                                 ))}
                             </div>
                        ) : items.length === 0 ? (
                            <div className="st-grid-no-data-message">
                                No hay datos disponibles
                            </div>
                        ) : (
                            <div className={`st-grid-inner ${layout.cssClass}`}>
                                {visibleItems.map((item) => {
                                    const isSelected = selectedGridItem?.id === item.id;
                                    const isGroup = currentPhase === 'GROUPS';
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleTileClick(item)}
                                            className={`st-grid-btn ${isSelected ? 'selected' : ''}`}
                                        >
                                            {isGroup ? (
                                                <div className="st-group-layout">
                                                    <img src="/assets/pictograms/clase.png" alt="Clase" className="st-group-icon" />
                                                    <span className="st-group-letter">{getLetterFromAlias((item as Group).alias)}</span>
                                                </div>
                                            ) : (
                                                <div className="st-student-layout">
                                                    <div className="st-student-img-box">
                                                        <img 
                                                            src={(item as User).photo_url || "/assets/pictograms/user_default.png"} 
                                                            alt={(item as User).username} 
                                                            className="st-student-photo"
                                                        />
                                                    </div>
                                                    <span className="st-student-name">{(item as User).username}</span>
                                                </div>
                                            )}
                                            
                                            {confirmPendingId === String(item.id) && (
                                                <div className="st-btn-overlay">
                                                    <img src="/assets/pictograms/si.png" alt="OK" className="st-overlay-icon" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                                {Array.from({ length: emptySlots }).map((_, i) => (
                                    <div key={`ghost-${i}`} className="st-grid-btn ghost"></div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* MODO PASSWORD */
                    <div className="st-pass-layout">
                         <div className="st-pass-slots">
                            {Array.from({ length: REQUIRED_LENGTH }, (_, index) => {
                                const pid = selectedPictos[index];
                                const picto = pid ? PICTOGRAMS.find(p => p.id === pid) : null;
                                return (
                                    <div 
                                        key={index} 
                                        className={`st-pass-slot ${picto ? 'filled' : ''}`}
                                        onClick={() => picto && removePictoAtIndex(index)}
                                    >
                                        {picto ? (
                                            <>
                                                <img src={picto.image} alt="picto" />
                                                <div className="st-slot-delete"><IonIcon icon={trash} /></div>
                                            </>
                                        ) : (
                                            <span>?</span>
                                        )}
                                    </div>
                                );
                            })}
                         </div>

                         <div className="st-card-wrapper pass-mode st-anim-pop-in">
                            <div className="st-pass-grid">
                                {PICTOGRAMS.map((picto) => (
                                    <button
                                        key={picto.id}
                                        className="st-pass-key"
                                        onClick={() => addPicto(picto.id)}
                                        disabled={loading || selectedPictos.length >= MAX_LENGTH}
                                    >
                                        <img src={picto.image} alt={picto.name} />
                                    </button>
                                ))}
                            </div>
                         </div>
                    </div>
                )}
            </div>

            {/* FOOTER */}
            <div className="st-login-footer">
                {!loading && currentPhase !== 'PASSWORD' && items.length > layout.itemsPerPage && (
                    <>
                        <Button3Dtext color="var(--ion-color-primary)" onClick={() => setGridPage(p => p-1)} disabled={gridPage === 0}>
                            <IonIcon icon={arrowBack} />
                        </Button3Dtext>
                        
                        <div className="st-pagination-dots">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <div 
                                    key={i} 
                                    className={`st-dot ${gridPage === i ? 'active' : ''}`}
                                    onClick={() => setGridPage(i)}
                                />
                            ))}
                        </div>

                        <Button3Dtext color="var(--ion-color-primary)" onClick={() => setGridPage(p => p+1)} disabled={gridPage >= totalPages - 1}>
                            <IonIcon icon={arrowForward} />
                        </Button3Dtext>
                    </>
                )}
            </div>

            {error && <div className="st-error-toast">{error}</div>}

        </div>
      </IonContent>
    </IonPage>
  );
}