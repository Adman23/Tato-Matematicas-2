# Crear Storage Buckets en Supabase


### 1. Acceder a Storage
1. Ve a: https://app.supabase.com
2. Abre tu proyecto: `miidturirngqpmwtdalk`
3. En el menú lateral → **Storage**
4. Haz clic en **New Bucket**

---

### 2. Crear los 7 Buckets

Crea cada bucket con esta configuración:
- **Name**: `student-photos`
- **Public**: ❌ NO (desactivado)
- **File size limit**: `5242880` (5 MB)
- **Allowed MIME types**:
  ```
  image/jpeg
  image/png
  image/webp
  ```

---

- **Name**: `custom-audios`
- **Public**: ❌ NO
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
- **Public**: ❌ NO
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
- **Public**: ❌ NO
- **File size limit**: `52428800` (50 MB)
- **Allowed MIME types**:
  ```
  video/mp4
  video/webm
  image/gif
  ```

---

- **Name**: `game-help-videos`
- **Public**: ✅ SÍ (activado)
- **File size limit**: `104857600` (100 MB)
- **Allowed MIME types**:
  ```
  video/mp4
  video/webm
  ```

---

- **Name**: `pictograms`
- **Public**: ✅ SÍ
- **File size limit**: `2097152` (2 MB)
- **Allowed MIME types**:
  ```
  image/png
  image/svg+xml
  image/webp
  ```

---

- **Name**: `system-assets`
- **Public**: ✅ SÍ
- **File size limit**: `5242880` (5 MB)
- **Allowed MIME types**:
  ```
  image/jpeg
  image/png
  image/webp
  image/svg+xml
  audio/mpeg
  ```

---

##  Verificar que Existen

Después de crear los 7 buckets, ejecuta este script para verificar:

**Ejecuta**: `backend/database/09_storage_buckets_NEW.sql`

Debe mostrar:
```
✅ student-photos
✅ custom-audios
✅ custom-images
✅ reinforcement-videos
✅ game-help-videos
✅ pictograms
✅ system-assets
```

---

##  Resumen Rápido

| # | Bucket | Public | Tamaño | MIME Types |
|---|--------|--------|--------|------------|
| 1 | student-photos | ❌ | 5 MB | images |
| 2 | custom-audios | ❌ | 10 MB | audio |
| 3 | custom-images | ❌ | 5 MB | images |
| 4 | reinforcement-videos | ❌ | 50 MB | video + gif |
| 5 | game-help-videos | ✅ | 100 MB | video |
| 6 | pictograms | ✅ | 2 MB | images |
| 7 | system-assets | ✅ | 5 MB | images + audio |

---

##  Nota sobre el Script 09

El archivo `09_storage_buckets_NEW.sql` hace dos cosas:

1.  **Verifica** que los buckets existan
2.  **Configura políticas** de acceso (permisos)

Pero **NO crea los buckets** (eso se debe hacer desde el Dashboard).

---

##  Si algo sale mal

Si ejecutaste el script `09_storage_buckets.sql` antiguo y dio error:
- **No pasa nada**, simplemente no creó los buckets
- Créalos manualmente siguiendo esta guía
- Luego ejecuta `09_storage_buckets_NEW.sql` para configurar las políticas

---

**Tiempo estimado**: 5-10 minutos para crear los 7 buckets
