/**
 * Juego 1: Relacionar sonido con número
 *
 * El estudiante escucha un sonido que representa un número y debe
 * seleccionar el número correcto entre varias opciones.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    IonContent,
    IonPage,
    IonSpinner,
    IonText,
    IonButton,

} from '@ionic/react';
import { useHistory, Redirect } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext';
import { gamesAPI } from '../../../lib/api';
import type { GameConfig } from '../../../lib/api';

import Game2Header from '../Game2Header';
import './Game1.css';

// Importar imágenes locales de pictogramas
import img0 from '../Game2/img/0.png';
import img1 from '../Game2/img/uno.png';
import img2 from '../Game2/img/2.png';
import img3 from '../Game2/img/3.png';
import img4 from '../Game2/img/4.png';
import img5 from '../Game2/img/5.png';
import img6 from '../Game2/img/6.png';
import img7 from '../Game2/img/7.png';
import img8 from '../Game2/img/8.png';
import img9 from '../Game2/img/9.png';
import img10 from '../Game2/img/10.png';

// Importar imágenes para el header
import imgAceptar from '../Game2/img/aceptar.png';
import imgFlecha from '../Game2/flecha.png';
import imgSonido from '../Game2/img/sonido.png';
import imgJuego from '../Game2/img/juegoX.png';

// Mapeo de números a imágenes locales
const PICTOGRAM_IMAGES: { [key: number]: string } = {
    0: img0,
    1: img1,
    2: img2,
    3: img3,
    4: img4,
    5: img5,
    6: img6,
    7: img7,
    8: img8,
    9: img9,
    10: img10
};

const TOTAL_ROUNDS = 5;


/**
 * Componente principal del Juego 1: Relacionar sonido con número.
 *
 * Este juego educativo presenta números que el usuario debe relacionar
 * con el sonido correspondiente.
 *
 * Características principales:
 * - Disponible para estudiantes y profesores con las mismas características
 * - 5 rondas con números aleatorios diferentes
 * - Pictogramas visuales para el rango 0-10
 * - Validación con feedback inmediato (check/cruz)
 * - Tracking completo en backend (tiempo, intentos, resultados)
 *
 * Flujo del juego:
 * 1. Carga configuración personalizada del usuario
 * 2. Crea sesión de juego en BD
 * 3. Por cada ronda:
 *    - Genera un número aleatorio para escuchar
 *    - Aparecen varias opciones visuales
 *    - Usuario selecciona una opción
 *    - Proporciona feedback visual inmediato
 *    - Valida y guarda resultado
 * 4. Tras 5 rondas, finaliza sesión y redirige al dashboard correspondiente
 *
 * @returns Componente React con UI completa del juego
 *
 * @example
 * // Usado en el routing de la app:
 * <Route path="/game1" component={Game1} />
 */
const Game1: React.FC = () => {

    const history = useHistory();
    const { student, user, loading: authLoading } = useAuth();

    // Determinar el usuario actual (puede ser estudiante o profesor)
    const currentUser = student || user;

    // Flag para prevenir creación duplicada de sesión (React 18 StrictMode)
    const sessionCreatedRef = useRef(false);

    // Estados principales
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState<GameConfig | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Estados del juego
    const [currentRound, setCurrentRound] = useState(1);
    const [availableNumbers, setAvailableNumbers] = useState<(number | undefined)[]>([]);

    // Estados de UI
    const [showFeedback, setShowFeedback] = useState(false);
    const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
    const [gameStartTime, setGameStartTime] = useState<number>(Date.now());

    // Estados de resultados
    const [gameFinished, setGameFinished] = useState(false);

    // Estado para selección por clic (en lugar de drag & drop)
    const [selectedNumber, setSelectedNumber] = useState<number | null>(null);



    // Determinar si usar pictogramas (solo para rango 0-10)
    const usePictograms = /*config?.number_range === '0-10'*/true;

    // Generar nueva ronda cuando cambia currentRound
    useEffect(() => {
        if (config && currentRound <= TOTAL_ROUNDS) {
            generateRound();
        }

    }, [config, currentRound]);


    /**
      * Genera los números y configuración para una nueva ronda del juego.
      *
      * Flujo de ejecución:
      * 1. Calcula cantidad total: números a ordenar (quantity) + números de ayuda (40%)
      * 2. Genera números únicos aleatorios dentro del rango configurado
      * 3. Los ordena según configuración (ascendente/descendente)
      * 4. Selecciona aleatoriamente qué números serán "ayuda" (pre-colocados y bloqueados)
      * 5. Mezcla los números disponibles para que no estén en orden
      * 6. Coloca números de ayuda en sus posiciones correctas (verdes y bloqueados)
      * 7. Reinicia el timer de la ronda
      *
      * @returns void - Actualiza múltiples estados del componente
      *
      * @example
      * // Si config.settings.quantity = 5 y order = 'ascending':
      * // - Genera 7 números (5 + 2 de ayuda)
      * // - correctOrder = [1, 3, 5, 7, 9, 10, 15] (ordenados)
      * // - availableNumbers = [7, 1, 15, 9, 3] (mezclados, sin ayuda)
      * // - orderedNumbers = [undefined, undefined, 5, undefined, undefined, 10, undefined]
      * // - lockedIndices = Set(2, 5) (posiciones bloqueadas)
      */
    const generateRound = () => {
        //if (!config) return;

        const [min, max] = /*config.number_range.split('-').map(Number)*/[0, 10];

        // // Validar que min y max sean números válidos
        // if (isNaN(min) || isNaN(max) || min >= max) {
        //     console.error('Invalid number range:', config.number_range);
        //     return;
        // }

        const totalNumbers = /*config.settings.quantity ||*/ 5; // opciones disponibles

        // // Validar que quantity sea un número válido
        // if (isNaN(quantity) || quantity <= 0) {
        //     console.error('Invalid quantity:', config.settings.quantity);
        //     return;
        // }

        // Generar totalNumbers números únicos aleatorios
        const numbers = new Set<number>();
        while (numbers.size < totalNumbers) {
            const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
            numbers.add(randomNum);
        }

        const numbersArray = Array.from(numbers);

        // Mezclar aleatoriamente los números disponibles (para que no estén en orden)
        const poolNumbers = numbersArray.sort(() => Math.random() - 0.5);


        setAvailableNumbers(poolNumbers);
        console.log('Generated round', currentRound, 'with numbers:', poolNumbers);
        setShowFeedback(false);
        setRoundStartTime(Date.now());
    };


    // Pantalla de carga de autenticación
    if (authLoading) {
        return (
            <IonPage>
                <IonContent>
                    <div className='Game1-spinner'>
                        <IonSpinner name="crescent" />
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    // Redirigir si no hay usuario autenticado (estudiante o profesor)
    if (!student && !user) {
        return <Redirect to="/student-login" />;
    }

    // // Pantalla de carga del juego
    // if (loading) {
    //     return (
    //         <IonPage>
    //             <IonContent>
    //                 <div className='Game1-spinner'>
    //                     <IonSpinner name="crescent" />
    //                     <IonText>
    //                         <p>Cargando juego...</p>
    //                     </IonText>
    //                 </div>
    //             </IonContent>
    //         </IonPage>
    //     );
    // }


    return (
        <IonPage>
            <IonContent className="game1-content">
                {/* Header */}
                <Game2Header
                    title="Asociar Nº"
                    pictogram1={imgSonido}
                    pictogramArrow={imgFlecha}
                    pictogram2={imgJuego}
                    currentRound={currentRound}
                    totalRounds={TOTAL_ROUNDS}
                />

                {/* Zona de juego */}
                {/* Números disponibles */}
                <div className="available-numbers" id="available-zone">
                    {availableNumbers.map((num, index) => {
                        if (num === undefined) {
                            // Mostrar slot vacío (sin droppable en modo click)
                            return (
                                <div
                                    key={`available-slot-${index}`}
                                    className="game1-droppable-slot"
                                >
                                    <div className="game1-empty-slot" />
                                </div>
                            );
                        }

                        const pictogramImg = usePictograms && num <= 10 ? PICTOGRAM_IMAGES[num] : null;
                        let cardClass = 'number-card-v2 number-card-available';
                        if (usePictograms) cardClass += ' number-card-pictogram';

                        // Añadir clase visual cuando esté seleccionado
                        const isSelected = selectedNumber === num;
                        if (isSelected) cardClass += ' selected';

                        return (
                            <div
                                key={`available-${num}-${index}`}
                                className={cardClass}
                                onClick={() => {
                                    // Alternar selección al hacer click
                                    setSelectedNumber(prev => (prev === num ? null : num));
                                }}
                                role="button"
                                aria-pressed={isSelected}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        setSelectedNumber(prev => (prev === num ? null : num));
                                        e.preventDefault();
                                    }
                                }}
                            >
                                {pictogramImg ? (
                                    <img
                                        src={pictogramImg}
                                        alt={`Pictograma número ${num}`}
                                        className="pictogram-image"
                                    />
                                ) : (
                                    <span className="number-value">{num}</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Botón de comprobar */}
                <div className="game1-check-button-container">
                    <IonButton
                        fill="clear"
                        className="game1-check-button"
                        //onClick={checkAnswer}
                        disabled={selectedNumber === null}
                    >
                        <img
                            src={imgAceptar}
                            alt="Comprobar"
                            className="game1-check-button-image"
                        />
                    </IonButton>
                </div>
            </IonContent>
        </IonPage>
    );


};

export default Game1;