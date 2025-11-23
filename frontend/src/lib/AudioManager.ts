/**
 * Simple AudioManager singleton
 * - centraliza la reproducción de un único HTMLAudioElement
 * - maneja AbortError silenciosamente cuando se pausa una reproducción pendiente
 * - permite reproducir secuencias de archivos de forma secuencial
 */
class AudioManager {
    private audio: HTMLAudioElement | null = null;

    // Play a single audio file and resolve when it ends (or errors)
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
    async playSequential(paths: string[]) {
        for (const p of paths) {
            // If stop() was called externally, audio will be null and play will just proceed
            await this.play(p);
        }
    }
}

const audioManager = new AudioManager();
export default audioManager;
