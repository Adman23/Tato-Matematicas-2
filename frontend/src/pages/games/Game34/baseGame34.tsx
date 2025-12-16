/**
 * Base Game 3/4 - Learn how to add/subtract by equalizing containers.
 * 
 * The student is given a series of containers, one of them is closed and has numbers
 * the others are open and show numbers. They must equalize by adding or subtracting.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    IonContent,
    IonPage,
    useIonRouter
} from '@ionic/react';
import { Redirect } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext';
import { useUserData } from '../../../contexts/UserContext';
import { gamesAPI } from '../../../lib/api';
import type { GameConfig, StudentMessage } from '../../../lib/api';
import { getAudioPreferences, type AudioPreferences } from '../../../lib/api';

// Imports from components of the games
import GameHeader from '../components/GameHeader';
import FeedbackScreen from '../components/FeedbackScreen';
import ExitScreen from '../components/ExitScreen';
import ResultsScreen from '../components/ResultsScreen';
import './baseGame34.css';

// Imports from global components
import { GameControlButton } from '../../global_components/GameControlButton';
import LoadingSpinner from '../../global_components/LoadingSpinner';
import ContainerBlock from './ContainerBlock';

// Imports images
const imgFlecha = '/assets/juegosImg/flecha.png';

const TOTAL_ROUNDS = 5;
const SHOW_DEBUG_ZONES = false;



/**
 * @brief Type to introduce in the containers.
 */
export type NumberItem = {
    id: string;
    value: number;
};

/**
 * @brief Type to introduce in the containers.
 * Each container has a unique ID, a type (bowl or chest), and contains an array of numbers.
 * 
 * !! chest is deprecated
 * -> We had it before to distinguish between bowls and chest, but now there is only a total objective
 * 
 */
export type Container = {
    id: string;
    type: 'bowl' | 'chest';
    numbers: NumberItem[];
};


/**
 * @brief Props for the BaseGame34 component.
 */
type BaseGame34Props = {
    gameKey: 'distribute_equal' | 'remove_equal';
    gameTitle: string;
    gameImage: string;
    headerImage: string;
    generateRoundData: (config: GameConfig) => {
        containers: Container[];
        topZone: NumberItem[];
        targetTotal: number;
        solution: { [bowlId: string]: string[] }; // bowlId -> array of NumberItem ids that solve it
    };
    // Cambia la firma para aceptar una función de pista con acceso al estado y setters
    useHint: (
        gameState: {
            containers: Container[],
            topZone: NumberItem[],
            solution: { [bowlId: string]: string[] }
        },
        setContainers: React.Dispatch<React.SetStateAction<Container[]>>,
        setTopZone: React.Dispatch<React.SetStateAction<NumberItem[]>>
    ) => void;
};

const BaseGame34: React.FC<BaseGame34Props> = ({
    gameKey,
    gameTitle,
    gameImage,
    headerImage,
    generateRoundData,
    useHint,
}) => {
    const { user } = useAuth();
    const { loadingUser } = useUserData();
    const router = useIonRouter();

    const sessionCreatedRef = useRef(false);

    // State variable to show loading spinner while game config is being fetched
    const [loadingGame, setLoadingGame] = useState(true);

    // Config variables
    const [config, setConfig] = useState<GameConfig | null>(null);
    const [audioPreferences, setAudioPreferences] = useState<AudioPreferences | undefined>();

    // Game state variables
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [currentRound, setCurrentRound] = useState(1);
    const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
    const [containers, setContainers] = useState<Container[]>([]);
    const [topZone, setTopZone] = useState<NumberItem[]>([]);
    const [draggedItem, setDraggedItem] = useState<{ id: string; value: number } | null>(null);
    const [targetTotal, setTargetTotal] = useState<number>(0);
    const [solution, setSolution] = useState<{ [bowlId: string]: string[] }>({});

    // Feedback messages
    const [Messages, setMessages] = useState<StudentMessage[]>([]);

    // Feedback screen (end of round)
    const [showFeedbackScreen, setShowFeedbackScreen] = useState(false);

    // Video modal
    const [showVideoModal, setShowVideoModal] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // Game end and results
    const [hintsCount, setHintsCount] = useState(0);
    const [totalHintsUsed, setTotalHintsUsed] = useState(0);
    const [attemptsCount, setAttemptsCount] = useState(0);
    const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
    const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
    const [gameFinished, setGameFinished] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [totalRoundsCorrect, setTotalRoundsCorrect] = useState(0);
    const [totalErrorsMade, setTotalErrorsMade] = useState(0);
    const [roundTimes, setRoundTimes] = useState<number[]>([]);

    useEffect(() => {
        sessionCreatedRef.current = false;
        setGameFinished(false);
        setCurrentRound(1);
        setSessionId(null);
        loadGameConfig();
        setGameStartTime(Date.now());
        const defaultMessages: StudentMessage[] = [
            { id: "0", type: 'positive', text_message: '¡Muy bien!' },
            { id: "1", type: 'reinforcement', text_message: '¡Inténtalo de nuevo!' }
        ];
        setMessages(defaultMessages);
        return () => { sessionCreatedRef.current = false; };
    }, []);

    useEffect(() => {
        if (config && !sessionId && !sessionCreatedRef.current) {
            sessionCreatedRef.current = true;
            createGameSession();
        }
    }, [config]);

    useEffect(() => {
        if (config && sessionId && currentRound <= TOTAL_ROUNDS) {
            generateRound();
        }
    }, [config, currentRound, sessionId]);

    const createGameSession = async () => {
        try {
            if (!user?.id) return;
            const data = await gamesAPI.createGameSession(user.id, gameKey);
            setSessionId(data.session_id);
        } catch (error) {
            console.error('Error creating game session:', error);
        }
    };

    const loadGameConfig = async () => {
        try {
            if (!user?.id) return;
            const data = await gamesAPI.getGameConfig(user.id, gameKey);
            const validatedConfig: GameConfig = {
                ...data,
                number_range: data.number_range || '0-10',
                settings: { ...data.settings || {} }
            };
            setConfig(validatedConfig);

            // Load audio preferences
            try {
                const audioPrefs = await getAudioPreferences(user.id);
                setAudioPreferences(audioPrefs);
            } catch (err) {
                console.error('Error loading audio preferences:', err);
                // Use defaults if error
            }

            setLoadingGame(false);
        } catch (error) {
            console.error('Error loading game config:', error);
            const defaultConfig: GameConfig = {
                game_id: 0,
                game_key: gameKey,
                user_id: user?.id || '',
                number_range: '0-10',
                settings: {}
            };
            setConfig(defaultConfig);
            setLoadingGame(false);
        }
    };

    const generateRound = () => {
        if (!config) return;

        setAttemptsCount(0);
        setHintsCount(0);
        setRoundStartTime(Date.now());

        // Llamar a la función personalizada de cada juego
        const roundData = generateRoundData(config);

        setContainers(roundData.containers);
        setTopZone(roundData.topZone);
        setTargetTotal(roundData.targetTotal);
        setSolution(roundData.solution);
    };


    const checkAnswer = async () => {
        const bowls = containers.filter(c => c.type === 'bowl');
        const correct = bowls.every(bowl => {
            const bowlTotal = bowl.numbers.reduce((acc, n) => acc + n.value, 0);
            return bowlTotal === targetTotal;
        });

        setIsCorrectAnswer(correct);
        setShowFeedbackScreen(true);

        console.log(`Total Rounds correct: ${totalRoundsCorrect}`);
        console.log(`Total Errors made: ${totalErrorsMade}`);


        if (sessionId) {
            const timeSeconds = (Date.now() - roundStartTime) / 1000;
            setRoundTimes(prev => [...prev, timeSeconds]);
            if (correct) {
                setTotalRoundsCorrect(prev => prev + 1);
            }
            else {
                setTotalErrorsMade(prev => prev + 1);
            }

            if (correct) {
                try {
                    // Calcular totales de cada bowl
                    const bowlsTotals = bowls.map(bowl =>
                        bowl.numbers.reduce((acc, n) => acc + n.value, 0)
                    );

                    // chest_total es el targetTotal (objetivo)
                    const chestTotal = targetTotal;

                    await gamesAPI.saveRoundResultGame34(sessionId, {
                        round: currentRound,
                        bowls_totals: bowlsTotals,
                        chest_total: chestTotal,
                        is_correct: correct,
                        time_seconds: timeSeconds,
                        attempts: attemptsCount,
                        hints: hintsCount
                    });
                } catch (error) {
                    console.error('Error saving round:', error);
                }
            }
        }
    };

    const finishGame = async () => {
        const totalTimeSeconds = (Date.now() - gameStartTime) / 1000;
        if (sessionId) {
            try {
                await gamesAPI.finishGameSession(sessionId, totalTimeSeconds);
            } catch (error) {
                console.error('Error finishing game:', error);
            }
        }
        setGameFinished(true);
    };

    const advanceToNextRound = async () => {
        const timeSeconds = (Date.now() - roundStartTime) / 1000;
        if (sessionId) {
            setRoundTimes(prev => [...prev, timeSeconds]);
        }
        setShowFeedbackScreen(false);

        const bowls = containers.filter(c => c.type === 'bowl');
        const correct = bowls.every(bowl => {
            const bowlTotal = bowl.numbers.reduce((acc, n) => acc + n.value, 0);
            return bowlTotal === targetTotal;
        });

        if (sessionId && !correct) {
            try {
                // Calcular totales de cada bowl
                const bowlsTotals = bowls.map(bowl =>
                    bowl.numbers.reduce((acc, n) => acc + n.value, 0)
                );

                // chest_total es el targetTotal (objetivo)
                const chestTotal = targetTotal;

                await gamesAPI.saveRoundResultGame34(sessionId, {
                    round: currentRound,
                    bowls_totals: bowlsTotals,
                    chest_total: chestTotal,
                    is_correct: false,
                    time_seconds: timeSeconds,
                    attempts: attemptsCount,
                    hints: hintsCount
                });
            } catch (error) {
                console.error('Error saving round:', error);
            }
        }

        if (currentRound < TOTAL_ROUNDS) {
            setCurrentRound(prev => prev + 1);
        } else {
            finishGame();
        }
    };

    const repeatExercise = () => {
        setAttemptsCount(prev => prev + 1);
        setShowFeedbackScreen(false);
        setRoundStartTime(Date.now());
    };

    const handleEarlyExit = async () => {
        if (sessionId) {
            try {
                const totalTimeSeconds = (Date.now() - gameStartTime) / 1000;
                await gamesAPI.finishGameSession(sessionId, totalTimeSeconds);
            } catch (error) {
                console.error('Error saving early exit:', error);
            }
        }
        const dashboardRoute = user?.role == 'student' ? '/student/dashboard' : '/teacher/dashboard';
        router.push(dashboardRoute, "back", "pop");
    };

    const exitToDashboard = () => {
        const dashboardRoute = user?.role === "student" ? '/student/dashboard' : '/teacher/dashboard';
        router.push(dashboardRoute, "root", "push");
    };



    const handleDragStart = (e: React.DragEvent, id: string, value: number) => {
        setDraggedItem({ id, value });
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    const handleContainerExternalDrop = (containerId: string) => {
        if (!draggedItem) return;
        // Elimina el número de todos los contenedores y la top zone
        setTopZone(prev => prev.filter(item => item.id !== draggedItem.id));
        setContainers(prev => prev.map(container => ({
            ...container,
            numbers: container.numbers.filter(item => item.id !== draggedItem.id)
        })));
        // Añade el número al contenedor destino
        setContainers(prev => prev.map(container => {
            if (container.id === containerId) {
                return { ...container, numbers: [...container.numbers, draggedItem] };
            }
            return container;
        }));
        setDraggedItem(null);
    };

    const handleZoneExternalDrop = () => {
        if (!draggedItem) return;
        // Elimina el número de todos los contenedores y la top zone
        setTopZone(prev => prev.filter(item => item.id !== draggedItem.id));
        setContainers(prev => prev.map(container => ({
            ...container,
            numbers: container.numbers.filter(item => item.id !== draggedItem.id)
        })));
        // Añade el número a la top zone
        setTopZone(prev => [...prev, draggedItem]);
        setDraggedItem(null);
    };

    // Nueva función de pista
    const handleHint = () => {
        useHint(
            {
                containers,
                topZone,
                solution
            },
            setContainers,
            setTopZone
        );
    };

    if (!user) return <Redirect to="/student/login" />;
    if (loadingUser || loadingGame) {
        return (
            <IonPage>
                <IonContent>
                    <div className='Game-spinner'>
                        <LoadingSpinner message={`Cargando ${gameTitle}`} />
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    if (showFeedbackScreen) {
        return (
            <FeedbackScreen
                isCorrect={isCorrectAnswer}
                currentRound={currentRound}
                totalRounds={TOTAL_ROUNDS}
                headerTitle={gameTitle}
                headerPictogram1={headerImage}
                headerPictogramArrow={imgFlecha}
                headerPictogram2={gameImage}
                messages={Messages}
                onNext={advanceToNextRound}
                onHomeClick={handleEarlyExit}
                onRepeat={repeatExercise}
                audioPreferences={audioPreferences}
            />
        );
    }

    return (
        <IonPage>
            <IonContent>
                {gameFinished ? (
                    <ResultsScreen
                        totalRounds={TOTAL_ROUNDS}
                        totalHints={totalHintsUsed}
                        totalErrors={totalErrorsMade}
                        totalNumbersCorrect={totalRoundsCorrect}
                        totalNumbersRequired={TOTAL_ROUNDS}
                        onHomeClick={exitToDashboard}
                        headerTitle={gameTitle}
                        headerPictogram1={headerImage}
                        headerPictogramArrow={imgFlecha}
                        headerPictogram2={gameImage}
                        elapsedTime={Math.round(roundTimes.reduce((acc, time) => acc + time, 0))}
                        audioPreferences={audioPreferences}
                    />
                ) : showExitConfirm ? (
                    <ExitScreen
                        confirmExit={handleEarlyExit}
                        cancelExit={() => setShowExitConfirm(false)}
                    />
                ) : (
                    <>
                        <GameHeader
                            title={gameTitle}
                            pictogram1={headerImage}
                            pictogramArrow={imgFlecha}
                            pictogram2={gameImage}
                            currentRound={currentRound}
                            totalRounds={TOTAL_ROUNDS}
                            onBackClick={() => setShowExitConfirm(true)}
                        />
                        <div className="base-game34-container">

                            {/* Total number target */}
                            <div className="base-game34-objective">
                                OBJETIVO:&nbsp;
                                <span className="base-game34-objective-value">
                                    {targetTotal}
                                </span>
                            </div>

                            {/* Top zone for extra numbers */}
                            <ContainerBlock
                                className="base-game34-top-zone"
                                key={`zone-${currentRound}`}
                                type="zone"
                                numbers={topZone}
                                roundKey={currentRound} // Añadido
                                showDebugZones={SHOW_DEBUG_ZONES}
                                onGlobalDragStart={handleDragStart}
                                onGlobalDragEnd={handleDragEnd}
                                onExternalDrop={() => handleZoneExternalDrop()}
                            />
                            {/* Main section with all the bowls */}
                            <div className="base-game34-main-section">
                                {containers.map(container => (
                                    <ContainerBlock
                                        key={`${container.id}-${currentRound}`}
                                        type={container.type}
                                        numbers={container.numbers}
                                        roundKey={currentRound} // Añadido
                                        showDebugZones={SHOW_DEBUG_ZONES}
                                        onGlobalDragStart={handleDragStart}
                                        onGlobalDragEnd={handleDragEnd}
                                        onExternalDrop={
                                            container.type === 'bowl'
                                                ? () => handleContainerExternalDrop(container.id)
                                                : undefined
                                        }
                                    />
                                ))}
                            </div>

                            {/* Buttons section */}
                            <div className="base-game34-buttons-container">
                                <GameControlButton onClick={() => { /* instrucciones */ }}>
                                    <img src="/assets/juegosImg/instrucciones.png" alt="Instrucciones" className="game-control-button-image" />
                                    <span className="game-control-button-text">INSTRUCCIONES</span>
                                </GameControlButton>
                                <GameControlButton onClick={() => { handleHint(); setHintsCount(prev => prev + 1); setTotalHintsUsed(prev => prev + 1); }}>
                                    <img src="/assets/juegosImg/lupa.png" alt="Pista" className="game-control-button-image" />
                                    <span className="game-control-button-text">PISTA</span>
                                </GameControlButton>
                                <GameControlButton onClick={checkAnswer}>
                                    <img src="/assets/pictograms/correctoS.png" alt="Aceptar" className="game-control-button-image" />
                                    <span className="game-control-button-text">ACEPTAR</span>
                                </GameControlButton>
                            </div>
                        </div>
                    </>
                )}
            </IonContent>
        </IonPage>
    );
};

export default BaseGame34;
