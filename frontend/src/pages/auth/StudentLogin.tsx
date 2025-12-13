import {
  IonPage,
  IonContent,
  IonSpinner,
  IonIcon,
  IonInput,
  useIonRouter,
  useIonViewWillEnter,
} from '@ionic/react';
import { arrowBack, arrowForward, person, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { useState, useEffect, type KeyboardEvent } from 'react'; 
import { authAPI } from '../../lib/api'; 
import type { Group, User } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext'; 
// --- IMPORTACIONES ---
import { Button3Dtext } from '../global_components/PushableButtons'; 

import './StudentLogin.css';

/**
 * Pictogramas disponibles para la autenticación visual de estudiantes.
 * @constant
 */
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

/**
 * Tipo de elemento que puede aparecer en la grid (grupo o usuario).
 * @typedef GridItem
 */
type GridItem = Group | User;

/**
 * Fases del proceso de inicio de sesión del estudiante.
 * @typedef LoginPhase
 */
type LoginPhase = 'GROUPS' | 'STUDENTS' | 'PASSWORD';

/**
 * Componente de inicio de sesión unificado para estudiantes.
 * 
 * @remarks
 * Implementa un flujo de 3 fases:
 * 1. GROUPS - Selección del grupo del estudiante
 * 2. STUDENTS - Selección del estudiante dentro del grupo
 * 3. PASSWORD - Autenticación mediante pictogramas visuales
 * 
 * @component
 * 
 * @example
 * ```tsx
 * <StudentLoginUnified />
 * ```
 */
export default function StudentLoginUnified() {
  const router = useIonRouter();
  const { login } = useAuth(); 
   
  const [currentPhase, setCurrentPhase] = useState<LoginPhase>('GROUPS');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  const [items, setItems] = useState<GridItem[]>([]);
  const [selectedGridItem, setSelectedGridItem] = useState<GridItem | null>(null);
  const [gridPage, setGridPage] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [passwordType, setPasswordType] = useState<'graphical' | 'pin' | 'alphanumeric'>('graphical');    // tipo de contraseña del estudiante
  const [passwordLength, setPasswordLength] = useState<number>(0);  // longitud de la contraseña del estudiante

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);   // donde se almacena la contraseña (tanto para contraseña de tipo gráfica como para contraseña de tipo PIN)
  const [typedPassword, setTypedPassword] = useState<string>('');   // donde se almacena la contraseña (para contraseña de tipo alfanumérica)
  
  const [availableKeys, setAvailableKeys] = useState<string[]>([]); // teclas (las teclas serán pictogramas en el caso de contraseña de tipo gráfica y las teclas serán números en el caso de la contraseña de tipo PIN) disponibles para mostrar (tanto para contraseña de tipo gráfica como para contraseña de tipo PIN)

  const [showAlphanumericPassword, setShowAlphanumericPassword] = useState(false);
  
  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;


  // Normaliza el PIN para enviarlo a Supabase
  const normalizePinForSupabase = (pinPassword: string) => {

    return pinPassword.split('').join('-');  // ejemplo: '1234' -> '1-2-3-4'

  };
  
   
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
    if (currentPhase !== 'PASSWORD') return;
    if (passwordType === 'alphanumeric') {
      if (typedPassword.trim().length === passwordLength && !loading) {
        submitLogin();
      }
      return;
    }
    const filled = selectedKeys.filter(k => k !== '');
    if (filled.length === passwordLength && !loading) {
      submitLogin();
    }
  }, [selectedKeys, typedPassword, currentPhase, passwordType, passwordLength, loading]);

  useIonViewWillEnter(() => resetFlow());

  const resetFlow = () => {
    setCurrentPhase('GROUPS');
    setSelectedGroup(null);
    setSelectedStudent(null);
    setSelectedKeys([]);
    setTypedPassword('');
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

  const addKey = (keyId: string) => {
    if (loading) return;
    setSelectedKeys(prev => {
      // Buscar primera posición vacía
      const firstEmptyIndex = prev.findIndex(p => !p);
      if (firstEmptyIndex !== -1) {
        // Hay una posición vacía, llenarla
        const newArray = [...prev];
        newArray[firstEmptyIndex] = keyId;
        return newArray;
      } else if (prev.length < passwordLength) {
        // No hay vacías pero aún hay espacio, añadir al final
        return [...prev, keyId];
      }
      // Ya está lleno
      return prev;
    });
    setError('');
  };

  const removeKeyAtIndex = (indexToRemove: number) => {
    if (loading) return; 
    setSelectedKeys(prev => {
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
      
      const pt = student.password_type as 'graphical' | 'pin' | 'alphanumeric';
      setPasswordType(pt);
      
      const pl = student.password_length!;
      setPasswordLength(pl);

      // Se preparan las teclas disponibles según tipo de contraseña
      if (pt === 'pin') {
        setAvailableKeys(['1','2','3','4','5','6','7','8','9','0']);    // números del 0 al 9
      } else if (pt === 'alphanumeric') {
        setAvailableKeys([]);   // para contraseña de tipo alfanumérica el alumno escribirá en un input
      } else {    // pt === 'graphical'
        setAvailableKeys(PICTOGRAMS.map(p => p.id));
      }

      // Se inicializa 'selectedKey's con posiciones vacías (longitud requerida de la contraseña)
      setSelectedKeys(Array(pl).fill(''));
      setTypedPassword('');   // para contraseña de tipo alfanumérica el alumno escribirá en un input
      
      setCurrentPhase('PASSWORD');
      
    }

    else if (currentPhase === 'PASSWORD') {

      // Caso de tipo de contraseña alfanumérica
      if (passwordType === 'alphanumeric') {
        if (typedPassword.trim().length < passwordLength) {
            setError(`La contraseña no está completa. Tiene ${passwordLength} caracteres.`);
            return;
        }
        await submitLogin();
        return;
      }
        
      // Caso de tipo de contraseña gráfica o PIN (se ejecutará solo si la contraseña no es de tipo alfanumérica)
      const filled = selectedKeys.filter(k => k !== '');
      if (filled.length < passwordLength) {
        setError('La contraseña no está completa.'); 
        return;
      }
      await submitLogin();

    }

  };

  const submitLogin = async () => {
    if (!selectedStudent || !selectedGroup || loading) return;
    setLoading(true);
    try {
      let password: string;
      if (passwordType === 'alphanumeric') {
          password = typedPassword;
      } else if (passwordType === 'pin') {
          password = normalizePinForSupabase(selectedKeys.filter(p => p !== '').join(''));
      } else {  // passwordType === 'graphical'
          password = selectedKeys.filter(p => p !== '').join('-');
      }
      await login({
          group_id: String(selectedGroup.id),
          username: selectedStudent.username,
          password: password
      });
      setSelectedKeys([]);
      setTypedPassword('');
      router.push('/student/dashboard', 'root');
    } catch (err: any) {
        console.error(err);
        setError('Clave incorrecta.');
        setSelectedKeys([]);
        setTypedPassword('');
    } finally {
        setLoading(false);
    }
  };

  const handleBack = () => {
    if (loading) return; 
    setError('');
    if (currentPhase === 'PASSWORD') {
      setCurrentPhase('STUDENTS'); setSelectedKeys([]); setTypedPassword('');
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
  
  // Touch handlers para swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && gridPage < totalPages - 1) {
      setGridPage(prev => prev + 1);
    }
    if (isRightSwipe && gridPage > 0) {
      setGridPage(prev => prev - 1);
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
  
  const isPasswordComplete = (() => {
    if (passwordType === 'alphanumeric') {
      return typedPassword.trim().length === passwordLength;
    }
    const filled = selectedKeys.filter(k => k !== '');
    return filled.length === passwordLength;
  })();

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
                                disabled={loading || !isPasswordComplete}
                                aria-label="Confirmar contraseña"
                            >
                                {loading ? <IonSpinner name="dots" /> : <img src="/assets/pictograms/correcto.png" alt="" aria-hidden="true" />}
                            </Button3Dtext>
                        ) : (
                            <Button3Dtext 
                                onClick={handleAdvance} 
                                disabled={loading || !selectedGridItem}
                                aria-label="Continuar"
                            >
                                <img src="/assets/pictograms/correcto.png" alt="" aria-hidden="true" />
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
                    <div 
                        className={`st-card-wrapper st-anim-pop-in ${layout.cssClass}`}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        
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

                        {/* Input para contraseña de tipo alfanumérica */}
                        {passwordType === 'alphanumeric' && (
                          <div className={`st-pass-alphanumeric ${typedPassword ? 'filled' : ''}`}>
                            {error && <div className="st-error-toast" role="alert">{error}</div>}
                            <label htmlFor="typed-pass" className="sr-only">Contraseña</label>
                            <IonInput
                              id="typed-pass"
                              type={showAlphanumericPassword ? 'text' : 'password'}
                              value={typedPassword}
                              placeholder="Introduce tu contraseña..."
                              onIonInput={(e) => setTypedPassword(e.detail.value || '')}
                            />
                            <IonIcon
                              icon={showAlphanumericPassword ? eyeOffOutline : eyeOutline}
                              onClick={() => setShowAlphanumericPassword(prev => !prev)}
                              className="st-pass-input-eye-icon"
                            />
                          </div>
                        )}

                        {(passwordType === 'pin' || passwordType === 'graphical') && (
                          <div className={`st-card-wrapper pass-mode st-anim-pop-in ${passwordType === 'pin' ? 'pin-mode' : ''}`}>

                            {error && <div className="st-error-toast" role="alert">{error}</div>}

                            {/* Grid dinámico para contraseñas de tipo gráfica y PIN */}
                            {(passwordType === 'graphical' || passwordType === 'pin') && (
                              <div className={`st-pass-grid ${passwordType === 'pin' ? 'pin-mode' : ''}`}>
                                  {availableKeys.map((key) => {
                                      const isGraphical = passwordType === 'graphical';
                                      const graphical = isGraphical ? PICTOGRAMS.find(p => p.id === key) : null;
                                      return(
                                        <button
                                          key={key}
                                          className={`st-pass-key ${key === '0' ? 'zero' : ''}`}
                                          onClick={() => addKey(key)}
                                          disabled={loading || selectedKeys.filter(p => p !== '').length >= passwordLength}
                                          aria-label={
                                            isGraphical 
                                              ? `Añadir pictograma ${graphical?.name}`
                                              : `Añadir número ${key}`
                                          }
                                        >
                                          {isGraphical ? (
                                            <img src={graphical?.image} alt={graphical?.name || ''} aria-hidden="true" />
                                          ) : (
                                            <span className="st-pass-key-label">{key}</span>
                                          )}
                                        </button>
                                      );
                                    })}
                              </div>
                            )}

                          </div>
                        )}

                        {(passwordType === 'pin' || passwordType === 'graphical') && (
                          <div className={`st-pass-slots ${passwordType === 'pin' ? 'pin-mode' : ''}`}>
                            {Array.from({ length: passwordLength }, (_, index) => {
                                const key = selectedKeys[index];
                                const graphical = key && passwordType === 'graphical' ? PICTOGRAMS.find(p => p.id === key) : null;
                                return (
                                    <div 
                                        key={index} 
                                        className={`st-pass-slot ${passwordType === 'pin' ? 'pin-mode' : ''} ${key ? 'filled' : ''}`}
                                        onClick={() => key && removeKeyAtIndex(index)}
                                        onKeyDown={(e) => {
                                            if (key && (e.key === 'Enter' || e.key === ' ')) {
                                                e.preventDefault();
                                                removeKeyAtIndex(index);
                                            }
                                        }}
                                        role="button"
                                        aria-label={key 
                                          ? passwordType === 'graphical' 
                                              ? `Eliminar pictograma ${graphical?.name}` 
                                              : `Eliminar número ${key}`
                                          : `Espacio vacío ${index + 1}`}
                                        tabIndex={0}
                                    >
                                        {key ? (
                                            passwordType === 'graphical' ? (
                                                <>
                                                  <img src={graphical?.image} alt={graphical?.name} />
                                                </>
                                            ) : (
                                                <>
                                                  <span className="st-slot-key-label">{key}</span>
                                                </>
                                            )
                                        ) : (
                                            <span aria-hidden="true">?</span>
                                        )}
                                    </div>
                                );
                            })}
                          </div>
                        )}
                    </div>
                )}
            </div>

            {/* FOOTER */}
            <div className="st-login-footer">
                {!loading && currentPhase !== 'PASSWORD' && items.length > layout.itemsPerPage && (
                    <>
                        {/* ERROR 1 FIXED: Added aria-label to Button3Dtext (Previous Page) */}
                        <Button3Dtext 
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