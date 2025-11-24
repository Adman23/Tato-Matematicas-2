/**
 * Functional Summary.
 *
 * Centralized audio playback manager for the application.
 * - Centralizes playback of a single HTMLAudioElement.
 * - Silently handles AbortError when pausing a pending playback.
 * - Allows playing sequences of files sequentially.
 *
 * Execution flow.
 * 1. `play(path)` creates a new `HTMLAudioElement`, plays it, and resolves
 *    the promise when it ends or an error occurs.
 * 2. `stop()` pauses and resets the current audio element if it exists.
 * 3. `playSequential(paths)` calls `play()` sequentially for each path.
 *
 * @example Usage example
 * const audioManager = new AudioManager();
 * await audioManager.play('/assets/sounds/1.mp3');
 */
class AudioManager {
    private audio: HTMLAudioElement | null = null;

    /**
     * Plays an audio file and resolves when playback finishes
     * or an error occurs.
     *
     * Execution flow:
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
    play(path: string): Promise<void> {
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
}

const audioManager = new AudioManager();
export default audioManager;
