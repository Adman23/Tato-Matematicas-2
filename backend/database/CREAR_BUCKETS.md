# Crear Storage Buckets en Supabase

Los Storage Buckets nos sirven para almacear persistentemente en la bd(realmenete es en un sistema de almacenaje que gestiona Supabase, pero se entiende).


### 1. Acceder a Supabase
3. En el menú lateral → **Storage**
4. Haz clic en **New Bucket**

---

### 2. Crear los 7 Buckets

Crea cada bucket con esta configuración:
- **Name**: `student-photos`
- **Public**:  NO (desactivado)
- **File size limit**: `5242880` (5 MB)
- **Allowed MIME types**:
  ```
  image/jpeg
  image/png
  image/webp
  ```

---

- **Name**: `custom-audios`
- **Public**:  NO
- **File size limit**: `10485760` (10 MB)
- **Allowed MIME types**:
  ```
  audio/mpeg
  audio/wav
  audio/ogg
  audio/webm
  ```

---

- **Name**: `custom-images`
- **Public**:  NO
- **File size limit**: `5242880` (5 MB)
- **Allowed MIME types**:
  ```
  image/jpeg
  image/png
  image/webp
  image/svg+xml
  ```

---
- **Name**: `reinforcement-videos`
- **Public**:  NO
- **File size limit**: `52428800` (50 MB)
- **Allowed MIME types**:
  ```
  video/mp4
  video/webm
  image/gif
  ```

---

- **Name**: `game-help-videos`
- **Public**:  SÍ (activado)
- **File size limit**: `104857600` (100 MB)
- **Allowed MIME types**:
  ```
  video/mp4
  video/webm
  ```

---

- **Name**: `pictograms`
- **Public**:  SÍ
- **File size limit**: `2097152` (2 MB)
- **Allowed MIME types**:
  ```
  image/png
  image/svg+xml
  image/webp
  ```

---

- **Name**: `system-assets`
- **Public**:  SÍ
- **File size limit**: `5242880` (5 MB)
- **Allowed MIME types**:
  ```
  image/jpeg
  image/png
  image/webp
  image/svg+xml
  audio/mpeg
  ```


