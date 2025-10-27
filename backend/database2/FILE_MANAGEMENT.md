# Gestión de Archivos - Audios e Imágenes

Este documento explica cómo se gestionan los archivos multimedia (fotos, audios, videos) en la aplicación.

## 📁 Supabase Storage

Todos los archivos se suben a **Supabase Storage** (similar a AWS S3).

### Buckets recomendados:
```
supabase-storage/
├── user-photos/          # Fotos de usuarios
├── custom-audios/        # Audios personalizados por tutor
├── reinforcement-media/  # Videos/GIFs/Imágenes de refuerzo
├── game-objects/         # Imágenes de objetos para juegos
└── game-containers/      # Imágenes de recipientes
```

---

## 🖼️ Imágenes

### 1. **Fotos de Usuarios**

**Dónde se guardan:**
- `users.photo_url` → Foto del perfil (Student/Teacher)

**Flujo:**
```typescript
// 1. Subir imagen a Storage
const file = event.target.files[0];
const { data, error } = await supabase.storage
  .from('user-photos')
  .upload(`${userId}.jpg`, file);

// 2. Obtener URL pública
const { data: publicURL } = supabase.storage
  .from('user-photos')
  .getPublicUrl(`${userId}.jpg`);

// 3. Guardar URL en base de datos
await supabase
  .from('users')
  .update({ photo_url: publicURL.publicUrl })
  .eq('id', userId);
```

---

### 2. **Imágenes de Objetos para Juegos**

**Dónde se configuran:**
- `student_profiles.game_preferences.object_images_set`

**Ejemplo:**
```json
{
  "object_images_set": "animals",  // Identificador del set
  "container_images_set": "buckets"
}
```

**Lógica en frontend:**
```typescript
// Mapeo de sets a URLs
const imageSets = {
  animals: {
    perro: 'https://storage.supabase.co/.../perro.png',
    gato: 'https://storage.supabase.co/.../gato.png',
    leon: 'https://storage.supabase.co/.../leon.png'
  },
  fruits: {
    manzana: 'https://storage.supabase.co/.../manzana.png',
    naranja: 'https://storage.supabase.co/.../naranja.png'
  }
};

// Usar en juego
const objectSet = profile.game_preferences.object_images_set;
const imageUrl = imageSets[objectSet]['perro'];
```

---

### 3. **Mensajes de Refuerzo (Imágenes/Videos/GIFs)**

**Dónde se guardan:**
- `reinforcement_messages.media_url`

**Flujo:**
```typescript
// 1. Subir archivo
const { data } = await supabase.storage
  .from('reinforcement-media')
  .upload(`${studentId}/felicitaciones.mp4`, file);

// 2. Obtener URL
const { data: publicURL } = supabase.storage
  .from('reinforcement-media')
  .getPublicUrl(`${studentId}/felicitaciones.mp4`);

// 3. Guardar en base de datos
await supabase
  .from('reinforcement_messages')
  .insert({
    student_id: studentId,
    media_type: 'video',
    media_url: publicURL.publicUrl
  });
```

---

## 🔊 Audios

### 1. **Audios Personalizados (Números)**

**Dónde se configuran:**
- `student_profiles.audio_preferences`

**Estructura recomendada:**
```json
{
  "use_custom_audios": true,
  "custom_audio_urls": {
    "number_0": "https://storage.supabase.co/.../cero.mp3",
    "number_1": "https://storage.supabase.co/.../uno.mp3",
    "number_2": "https://storage.supabase.co/.../dos.mp3",
    "number_3": "https://storage.supabase.co/.../tres.mp3"
    // ... hasta el número máximo configurado
  }
}
```

**Flujo completo:**

#### Paso 1: Tutor graba audios
```typescript
// Grabar audio del número "5"
const audioBlob = await recordAudio(); // Función que graba desde micrófono

// Subir a Storage
const { data } = await supabase.storage
  .from('custom-audios')
  .upload(`${studentId}/numero_5.mp3`, audioBlob);

// Obtener URL
const { data: publicURL } = supabase.storage
  .from('custom-audios')
  .getPublicUrl(`${studentId}/numero_5.mp3`);
```

#### Paso 2: Guardar en perfil
```typescript
// Leer audio_preferences actual
const { data: profile } = await supabase
  .from('student_profiles')
  .select('audio_preferences')
  .eq('student_id', studentId)
  .single();

// Agregar nuevo audio
const updatedPreferences = {
  ...profile.audio_preferences,
  use_custom_audios: true,
  custom_audio_urls: {
    ...profile.audio_preferences.custom_audio_urls,
    number_5: publicURL.publicUrl
  }
};

// Guardar
await supabase
  .from('student_profiles')
  .update({ audio_preferences: updatedPreferences })
  .eq('student_id', studentId);
```

#### Paso 3: Reproducir en juego
```typescript
// En el juego, cuando sale el número 5:
const audioUrl = profile.audio_preferences.custom_audio_urls.number_5;

if (audioUrl) {
  const audio = new Audio(audioUrl);
  audio.play();
} else {
  // Usar TTS por defecto
  const utterance = new SpeechSynthesisUtterance('cinco');
  speechSynthesis.speak(utterance);
}
```

---

### 2. **Audios de Refuerzo**

**Dónde se guardan:**
- `reinforcement_messages.media_url` (si `media_type = 'audio'`)

**Flujo:**
```typescript
// Subir audio
const { data } = await supabase.storage
  .from('reinforcement-media')
  .upload(`${studentId}/excelente.mp3`, audioFile);

// Guardar en base de datos
await supabase
  .from('reinforcement_messages')
  .insert({
    student_id: studentId,
    media_type: 'audio',
    media_url: publicURL.publicUrl
  });
```

---

## 🎮 Ejemplo Completo: Configurar Estudiante

```typescript
// 1. FOTO DE PERFIL
const photoFile = selectedPhoto;
await supabase.storage
  .from('user-photos')
  .upload(`${studentId}.jpg`, photoFile);

const photoURL = supabase.storage
  .from('user-photos')
  .getPublicUrl(`${studentId}.jpg`);

await supabase
  .from('users')
  .update({ photo_url: photoURL.data.publicUrl })
  .eq('id', studentId);

// 2. AUDIOS PERSONALIZADOS (números del 0 al 10)
const customAudios = {};

for (let i = 0; i <= 10; i++) {
  const audioBlob = await recordNumberAudio(i);

  await supabase.storage
    .from('custom-audios')
    .upload(`${studentId}/numero_${i}.mp3`, audioBlob);

  const audioURL = supabase.storage
    .from('custom-audios')
    .getPublicUrl(`${studentId}/numero_${i}.mp3`);

  customAudios[`number_${i}`] = audioURL.data.publicUrl;
}

await supabase
  .from('student_profiles')
  .update({
    audio_preferences: {
      use_custom_audios: true,
      custom_audio_urls: customAudios,
      volume: 80,
      use_tts: false  // Desactivar TTS porque usa audios personalizados
    }
  })
  .eq('student_id', studentId);

// 3. VIDEO DE REFUERZO
const videoFile = selectedVideo;

await supabase.storage
  .from('reinforcement-media')
  .upload(`${studentId}/felicitaciones.mp4`, videoFile);

const videoURL = supabase.storage
  .from('reinforcement-media')
  .getPublicUrl(`${studentId}/felicitaciones.mp4`);

await supabase
  .from('reinforcement_messages')
  .insert({
    student_id: studentId,
    media_type: 'video',
    media_url: videoURL.data.publicUrl
  });

// 4. CONFIGURAR IMÁGENES DE JUEGOS
await supabase
  .from('student_profiles')
  .update({
    game_preferences: {
      visual_element_type: 'object_images',
      object_images_set: 'animals',      // Usa imágenes de animales
      container_images_set: 'colorful_buckets'
    }
  })
  .eq('student_id', studentId);
```

---

## 📦 Sets de Imágenes Pre-definidos

### Objetos
- `animals` → Animales (perro, gato, león, etc.)
- `fruits` → Frutas (manzana, naranja, plátano)
- `toys` → Juguetes (pelota, coche, muñeca)
- `default` → Bolas con números

### Recipientes
- `buckets` → Cubetas de colores
- `boxes` → Cajas
- `baskets` → Cestas
- `default` → Recipientes simples

---

## 🔒 Políticas de Storage (Supabase)

```sql
-- Permitir subir solo a tutores/admins
CREATE POLICY "Tutores pueden subir archivos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'custom-audios' AND
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('teacher', 'admin')
  )
);

-- Todos pueden leer archivos públicos
CREATE POLICY "Lectura pública"
ON storage.objects FOR SELECT
USING (bucket_id IN ('user-photos', 'reinforcement-media', 'custom-audios'));
```

---

## 📋 Resumen

| Tipo de Archivo | Dónde se guarda | Campo en BD |
|-----------------|-----------------|-------------|
| **Foto de perfil** | `user-photos/` | `users.photo_url` |
| **Audios personalizados** | `custom-audios/` | `student_profiles.audio_preferences.custom_audio_urls` |
| **Videos de refuerzo** | `reinforcement-media/` | `reinforcement_messages.media_url` |
| **GIFs de refuerzo** | `reinforcement-media/` | `reinforcement_messages.media_url` |
| **Imágenes de refuerzo** | `reinforcement-media/` | `reinforcement_messages.media_url` |
| **Imágenes de objetos** | `game-objects/` | Frontend (mapeo hardcoded) |
| **Imágenes de recipientes** | `game-containers/` | Frontend (mapeo hardcoded) |

---

## ✅ Buenas Prácticas

1. **Nombres de archivos**: Usar `${userId}/${filename}` para organizar por usuario
2. **Compresión**: Comprimir imágenes/videos antes de subir
3. **Formatos recomendados**:
   - Fotos: JPG, PNG (max 500KB)
   - Audios: MP3 (max 1MB)
   - Videos: MP4 (max 10MB)
   - GIFs: GIF (max 2MB)
4. **Caché**: Los archivos en Storage tienen caché automático
5. **URLs públicas**: Usar `getPublicUrl()` para archivos que no requieren autenticación

---

¡Listo para gestionar archivos multimedia! 🎉
