/**
 * Game 4 - Learn how to subtract by equalizing containers.
 * 
 * The student is given a series of containers, one of them is closed and has numbers
 * the others are open and show numbers,
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

// Imports from components of the games
import GameHeader from '../components/GameHeader';
import FeedbackScreen from '../components/FeedbackScreen';
import ExitScreen from '../components/ExitScreen';
import ResultsScreen from '../components/ResultsScreen';
import './Game4.css';

// Imports from global components
import { GameControlButton } from '../../global_components/GameControlButton';
import LoadingSpinner from '../../global_components/LoadingSpinner';


const TOTAL_ROUNDS = 5;


const Game4: React.FC = () => {

    // Shared hooks and context for every game
    const {user} = useAuth();
    const { loadingUser } = useUserData();

    const router = useIonRouter();

    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [config, setConfig] = useState<GameConfig | null>(null);

    const usePictograms = config?.number_range === '0-10';
    


    // Flag to prevent duplicate session creation (React 18 StrictMode)
    const sessionCreatedRef = useRef(false);

    // Load configuration on mount (only once)
    useEffect(() => {
        sessionCreatedRef.current = false;

        /* Example from game 1
        setGameFinished(false);
        setCurrentRound(1);
        setShowFeedback(false);
        setSessionId(null);
        setSelectedNumber(null);
        setUsedNumbers([]);

        loadGameConfig();
        setGameStartTime(Date.now());
        */

        return () => {
            sessionCreatedRef.current = false;
        };
    },[]);


    return (
        <IonPage>
            <IonContent>
                <div>Game 4 - Under construction</div>
            </IonContent>
        </IonPage>
    );
}

export default Game4;