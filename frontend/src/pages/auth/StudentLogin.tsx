import {
  IonPage,
  IonContent,
  IonSpinner,
  IonIcon,
  useIonRouter,
  useIonViewWillEnter,
} from '@ionic/react';
import { arrowBack, arrowForward, person, close } from 'ionicons/icons';
import { useState, useEffect, type KeyboardEvent } from 'react'; 
import { authAPI } from '../../lib/api'; 
import type { Group, User } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext'; 
// --- IMPORTACIONES ---
import { Button3Dtext } from '../global_components/PushableButtons'; 

import './StudentLogin.css';

const PICTOGRAMS = [
  { id: 'perro', name: 'Perro', image: '/assets/pictograms/perro.png' },
  { id: 'gato', name: 'Gato', image: '/assets/pictograms/gato.png' },
  { id: 'tortuga', name: 'Tortuga', image: '/assets/pictograms/tortuga.png' },
  { id: 'león', name: 'León', image: '/assets/pictograms/león.png' },
  { id: 'elefante', name: 'Elefante', image: '/assets/pictograms/elefante.png' },
  { id: 'pez', name: 'Pez', image: '/assets/pictograms/pez.png' },
  { id: 'pinguino', name: 'Pinguino', image: '/assets/pictograms/pinguino.png' },
  { id: 'flamenco', name: 'Flamenco', image: '/assets/pictograms/flamenco.png' },
  { id: 'caballo', name: 'Caballo', image: '/assets/pictograms/caballo.png' },
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
      setGridPage(0); setSelectedGridItem(null);
    } catch (err) { console.error(err); setError('Error cargando grupos'); } 
    finally { setLoading(false); }
  };

  const loadStudents = async (groupId: string) => {
    setLoading(true); setError('');
    setItems([]); 
    try {
      const students = await authAPI.getStudentsByGroup(groupId);
      setItems(students);
      setGridPage(0); setSelectedGridItem(null);
    } catch (err) { console.error(err); setError('Error cargando estudiantes'); } 
    finally { setLoading(false); }
  };

  const handleTileClick = (item: GridItem) => {
    if (loading) return;
    setSelectedGridItem(item);
    setError('');
  };

  const addPicto = (pictogramId: string) => {
    if (loading) return;
    setSelectedPictos(prev => {
      // Buscar primera posición vacía
      const firstEmptyIndex = prev.findIndex(p => !p);
      if (firstEmptyIndex !== -1) {
        // Hay una posición vacía, llenarla
        const newArray = [...prev];
        newArray[firstEmptyIndex] = pictogramId;
        return newArray;
      } else if (prev.length < MAX_LENGTH) {
        // No hay vacías pero aún hay espacio, añadir al final
        return [...prev, pictogramId];
      }
      // Ya está lleno
      return prev;
    });
    setError('');
  };

  const removePictoAtIndex = (indexToRemove: number) => {
    if (loading) return; 
    setSelectedPictos(prev => {
      const newArray = [...prev];
      newArray[indexToRemove] = ''; // Limpiar esa posición sin mover otros elementos
      return newArray;
    });
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
        const filledPictos = selectedPictos.filter(p => p !== '');
        if (filledPictos.length < REQUIRED_LENGTH) {
            setError('Faltan imágenes'); return;
        }
        await submitLogin();
    }
  };

  const submitLogin = async () => {
    if (!selectedStudent || !selectedGroup || loading) return;
    setLoading(true);
    try {
        const password = selectedPictos.filter(p => p !== '').join('-');
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
      setCurrentPhase('STUDENTS'); setSelectedPictos([]);
    } else if (currentPhase === 'STUDENTS') {
      setCurrentPhase('GROUPS'); setSelectedGroup(null); loadGroups(); 
    } else {
      router.push('/login', 'back');
    }
  };

  // Manejador de teclado para la paginación (Accesibilidad)
  const handleDotKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setGridPage(index);
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
      {/* ACCESIBILIDAD (VIDEO/AUDIO): 
         Si 'Background' contiene un video, asegúrate en ese archivo de que tenga 'muted'
         y si es decorativo aria-hidden="true". Aquí lo ocultamos del lector de pantalla 
         preventivamente si es solo visual.
      */}
      <IonContent className="st-login-content" scrollY={false}>

        <div className="st-login-layout">
             
            {/* HEADER */}
            <header className="st-login-header">
                <div className="st-header-side">
                    <div className="st-button-scale">
                        {/* ERROR 1 FIXED: Added aria-label to Button3Dtext (Back) */}
                        <Button3Dtext 
                            color="var(--ion-color-primary)" 
                            onClick={handleBack} 
                            disabled={loading}
                            aria-label="Volver atrás"
                        >
                            <IonIcon icon={currentPhase === 'GROUPS' ? person : arrowBack} aria-hidden="true" />
                        </Button3Dtext>
                    </div>
                </div>
                <div className="st-header-center">
                    <img src="/assets/Tato/Tatitulo.png" alt="Logo de Tato" className="st-login-logo" />
                </div>
                <div className="st-header-side">
                    <div className="st-button-scale">
                        {/* ERROR 1 FIXED: Added aria-label to Button3Dtext (Check/Confirm) */}
                        {currentPhase === 'PASSWORD' ? (
                            <Button3Dtext 
                                onClick={handleAdvance} 
                                disabled={loading || selectedPictos.filter(p => p !== '').length !== REQUIRED_LENGTH}
                                aria-label="Confirmar contraseña"
                            >
                                {loading ? <IonSpinner name="dots" /> : <img src="/assets/pictograms/correcto.png" alt="" aria-hidden="true" style={{width: '24px', height: '24px'}} />}
                            </Button3Dtext>
                        ) : (
                            <Button3Dtext 
                                color="var(--ion-color-primary)" 
                                onClick={handleAdvance} 
                                disabled={loading || !selectedGridItem}
                                aria-label="Confirmar selección"
                            >
                                <img src="/assets/pictograms/correcto.png" alt="" aria-hidden="true" style={{width: '24px', height: '24px'}} />
                            </Button3Dtext>
                        )}
                    </div>
                </div>
            </header>

            <div className={`st-login-subtitle-area ${currentPhase === 'PASSWORD' ? 'password-mode' : ''}`}>
                {/* ERROR 2 FIXED: Changed h2 to h1 for First Level Heading */}
                <h1 className="st-login-subtitle">
                    {currentPhase === 'GROUPS' && "Selecciona tu clase"}
                    {currentPhase === 'STUDENTS' && "Selecciona tu usuario"}
                    {currentPhase === 'PASSWORD' && `Hola, ${selectedStudent?.username}. Tu clave:`}
                </h1>
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
                                    const labelText = isGroup ? `Clase ${(item as Group).alias}` : `Alumno ${(item as User).username}`;
                                    
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleTileClick(item)}
                                            className={`st-grid-btn ${isSelected ? 'selected' : ''}`}
                                            aria-label={labelText}
                                        >
                                            {isGroup ? (
                                                <div className="st-group-layout">
                                                    <img src="/assets/pictograms/clase.png" alt="" className="st-group-icon" aria-hidden="true" />
                                                    <span className="st-group-letter">{getLetterFromAlias((item as Group).alias)}</span>
                                                </div>
                                            ) : (
                                                <div className="st-student-layout">
                                                    <div className="st-student-img-box">
                                                        <img 
                                                            src={(item as User).photo_url || "/assets/pictograms/user_default.png"} 
                                                            alt="" // Decorativo, el botón ya tiene aria-label
                                                            className="st-student-photo"
                                                            aria-hidden="true"
                                                        />
                                                    </div>
                                                    <span className="st-student-name">{(item as User).username}</span>
                                                </div>
                                            )}
                                            
                                            {isSelected && (
                                                <div className="st-btn-overlay">
                                                    <img src="/assets/pictograms/si.png" alt="Confirmar" className="st-overlay-icon" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                                {Array.from({ length: emptySlots }).map((_, i) => (
                                    <div key={`ghost-${i}`} className="st-grid-btn ghost" aria-hidden="true"></div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* MODO PASSWORD */
                    <div className="st-pass-layout">
                         <div className="st-card-wrapper pass-mode st-anim-pop-in">
                            {error && <div className="st-error-toast" role="alert">{error}</div>}
                            <div className="st-pass-grid">
                                {PICTOGRAMS.map((picto) => (
                                    <button
                                        key={picto.id}
                                        className="st-pass-key"
                                        onClick={() => addPicto(picto.id)}
                                        disabled={loading || selectedPictos.filter(p => p !== '').length >= MAX_LENGTH}
                                        aria-label={`Añadir pictograma ${picto.name}`}
                                    >
                                        <img src={picto.image} alt="" aria-hidden="true" />
                                    </button>
                                ))}
                            </div>
                         </div>

                         <div className="st-pass-slots">
                            {Array.from({ length: REQUIRED_LENGTH }, (_, index) => {
                                const pid = selectedPictos[index];
                                const picto = pid ? PICTOGRAMS.find(p => p.id === pid) : null;
                                return (
                                    <div 
                                        key={index} 
                                        className={`st-pass-slot ${picto ? 'filled' : ''}`}
                                        onClick={() => picto && removePictoAtIndex(index)}
                                        role="button"
                                        aria-label={picto ? `Eliminar pictograma ${picto.name}` : `Espacio vacío ${index + 1}`}
                                        tabIndex={0}
                                    >
                                        {picto ? (
                                            <>
                                                <img src={picto.image} alt={picto.name} />
                                                <div className="st-slot-delete"><IonIcon icon={close} aria-hidden="true" /></div>
                                            </>
                                        ) : (
                                            <span aria-hidden="true">?</span>
                                        )}
                                    </div>
                                );
                            })}
                         </div>
                    </div>
                )}
            </div>

            {/* FOOTER */}
            <div className="st-login-footer">
                {!loading && currentPhase !== 'PASSWORD' && items.length > layout.itemsPerPage && (
                    <>
                        {/* ERROR 1 FIXED: Added aria-label to Button3Dtext (Previous Page) */}
                        <Button3Dtext 
                            color="var(--ion-color-primary)" 
                            onClick={() => setGridPage(p => p-1)} 
                            disabled={gridPage === 0}
                            aria-label="Página anterior"
                        >
                            <IonIcon icon={arrowBack} aria-hidden="true" />
                        </Button3Dtext>
                        
                        {/* IMPROVEMENT: Fixed accessibility for non-semantic divs acting as buttons */}
                        <div className="st-pagination-dots" role="navigation" aria-label="Paginación">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <div 
                                    key={i} 
                                    className={`st-dot ${gridPage === i ? 'active' : ''}`}
                                    onClick={() => setGridPage(i)}
                                    onKeyDown={(e) => handleDotKeyDown(e, i)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Ir a la página ${i + 1}`}
                                    aria-current={gridPage === i ? 'page' : undefined}
                                />
                            ))}
                        </div>

                        {/* ERROR 1 FIXED: Added aria-label to Button3Dtext (Next Page) */}
                        <Button3Dtext 
                            color="var(--ion-color-primary)" 
                            onClick={() => setGridPage(p => p+1)} 
                            disabled={gridPage >= totalPages - 1}
                            aria-label="Página siguiente"
                        >
                            <IonIcon icon={arrowForward} aria-hidden="true" />
                        </Button3Dtext>
                    </>
                )}
            </div>

        </div>
      </IonContent>
    </IonPage>
  );
}