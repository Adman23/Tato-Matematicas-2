/**
 * Functional Summary.
 *
 * Centralized audio playback manager for the application.
 * - Centralizes playback of a single HTMLAudioElement.
 * - Silently handles AbortError when pausing a pending playback.
 * - Allows playing sequences of files sequentially.
 * - Waits for screen reader / speech synthesis to finish before playing audio.
 *
 * Execution flow.
 * 1. `play(path)` waits for speech synthesis to finish, then creates a new 
 *    `HTMLAudioElement`, plays it, and resolves the promise when it ends.
 * 2. `stop()` pauses and resets the current audio element if it exists.
 * 3. `playSequential(paths)` calls `play()` sequentially for each path.
 *
 * @example Usage example
 * const audioManager = new AudioManager();
 * await audioManager.play('/assets/sounds/1.mp3');
 */
class AudioManager {
    private audio: HTMLAudioElement | null = null;
    private volume: number = 0.6; // Default volume (60%)

    /**
     * Waits for any active speech synthesis (screen reader) to finish.
     * Polls every 100ms until speechSynthesis is no longer speaking or pending.
     * Times out after maxWaitMs to prevent infinite waiting.
     * 
     * @param maxWaitMs - Maximum time to wait in milliseconds (default: 5000)
     * @returns Promise<void> that resolves when speech synthesis is idle or timeout
     */
    private waitForSpeechSynthesis(maxWaitMs: number = 5000): Promise<void> {
        return new Promise((resolve) => {
            // Check if speechSynthesis API is available
            if (typeof window === 'undefined' || !window.speechSynthesis) {
                resolve();
                return;
            }

            const startTime = Date.now();

            const checkSpeech = () => {
                const elapsed = Date.now() - startTime;

                // Timeout - don't wait forever
                if (elapsed >= maxWaitMs) {
                    resolve();
                    return;
                }

                // Check if speech synthesis is active
                if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
                    // Still speaking, check again in 100ms
                    setTimeout(checkSpeech, 100);
                } else {
                    // Speech finished, resolve
                    resolve();
                }
            };

            checkSpeech();
        });
    }

    /**
     * Plays an audio file and resolves when playback finishes
     * or an error occurs.
     *
     * Execution flow:
     * - Waits for any active speech synthesis (screen reader) to finish.
     * - Stops any previous playback.
     * - Creates a new `HTMLAudioElement` and listens for `ended` and `error` events.
     * - Calls `resolve()` when it ends or if an error occurs.
     *
     * @param path - Path of the audio file to play (relative to `public` / assets).
     * @returns Promise<void> that resolves when playback finishes or if there is an error.
     *
     * @example
     * await audioManager.play('/assets/sounds/correct.mp3');
     */
    async play(path: string): Promise<void> {
        // Wait for screen reader / speech synthesis to finish before playing
        await this.waitForSpeechSynthesis();

        return new Promise((resolve) => {
            // Stop previous audio if exists
            if (this.audio) {
                try {
                    this.audio.pause();
                    this.audio.currentTime = 0;
                } catch (e) { /* ignore */ }
                this.audio = null;
            }

            const audio = new Audio(path);
            this.audio = audio;
            audio.volume = this.volume; // Apply current volume setting

            const finish = () => {
                try {
                    audio.removeEventListener('ended', finish);
                    audio.removeEventListener('error', onError);
                } catch (e) { /* ignore */ }
                if (this.audio === audio) this.audio = null;
                resolve();
            };

            const onError = (err: any) => {
                console.error('Error reproduciendo audio', path, err);
                finish();
            };

            audio.addEventListener('ended', finish);
            audio.addEventListener('error', onError);

            audio.play().catch((err) => {
                // Ignore AbortError which is expected if pause() is called while play() is pending
                if ((err as any)?.name === 'AbortError') {
                    finish();
                    return;
                }
                console.error('play() falló para', path, err);
                finish();
            });
        });
    }

    /**
     * Detiene la reproducción actual si existe y libera la referencia.
     *
     * @returns void
     * @example
     * audioManager.stop();
     */
    // Stop any currently playing audio
    stop() {
        if (this.audio) {
            try {
                this.audio.pause();
                this.audio.currentTime = 0;
            } catch (e) { /* ignore */ }
            this.audio = null;
        }
    }

    /**
     * Sets the volume for audio playback (0.0 to 1.0)
     *
     * @param volume - Volume level between 0.0 (mute) and 1.0 (full volume)
     * @returns void
     * @example
     * audioManager.setVolume(0.5); // 50% volume
     */
    setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
        if (this.audio) {
            this.audio.volume = this.volume;
        }
    }

    /**
     * Play audio with a specific volume, temporarily overriding the default volume.
     * After playback, the default volume is restored.
     *
     * @param path - Path to the audio file
     * @param volume - Volume level for this playback (0.0 to 1.0)
     * @returns Promise that resolves when audio finishes
     * @example
     * await audioManager.playWithVolume('/assets/sounds/1.mp3', 0.6);
     */
    async playWithVolume(path: string, volume: number): Promise<void> {
        const originalVolume = this.volume;
        this.volume = Math.max(0, Math.min(1, volume));
        try {
            await this.play(path);
        } finally {
            this.volume = originalVolume;
        }
    }

    // Play an array of audio files sequentially
    /**
     * Reproduce una secuencia de rutas de audio de forma secuencial.
     *
     * Flujo de ejecución:
     * - Itera sobre `paths` y espera a que cada `play()` termine antes de
     *   iniciar la siguiente reproducción.
     *
     * @param paths - Array de rutas de audio a reproducir en orden.
     * @returns Promise<void> que se resuelve cuando todas las pistas han terminado.
     *
     * @example
     * await audioManager.playSequential(['/assets/sounds/1.mp3', '/assets/sounds/2.mp3']);
     */
    async playSequential(paths: string[]) {
        for (const p of paths) {
            // If stop() was called externally, audio will be null and play will just proceed
            await this.play(p);
        }
    }

    /**
     * Play a sequence of audio files with a specific volume.
     * Useful for essential game audio that should maintain consistent volume.
     *
     * @param paths - Array of audio file paths
     * @param volume - Volume level for this sequence (0.0 to 1.0)
     * @returns Promise that resolves when all audio finishes
     * @example
     * await audioManager.playSequentialWithVolume(['/assets/sounds/1.mp3'], 0.6);
     */
    async playSequentialWithVolume(paths: string[], volume: number): Promise<void> {
        const originalVolume = this.volume;
        this.volume = Math.max(0, Math.min(1, volume));
        try {
            for (const p of paths) {
                await this.play(p);
            }
        } finally {
            this.volume = originalVolume;
        }
    }
}

const audioManager = new AudioManager();
export default audioManager;
