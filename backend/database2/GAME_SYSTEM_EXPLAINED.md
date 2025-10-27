# Sistema de Juegos - Explicación Completa

Este documento explica cómo funciona el sistema de juegos, configuraciones y resultados.

## 🎯 Relaciones entre Tablas

```
Student
   │
   ├─► student_profiles
   │      ├─► visual_preferences (JSON)     ← CÓMO SE VE el juego
   │      ├─► audio_preferences (JSON)       ← CÓMO SE ESCUCHA
   │      ├─► accessibility_settings (JSON)  ← Accesibilidad
   │      └─► game_preferences (JSON)        ← Imágenes/objetos que usa
   │
   ├─► game_configurations (4, una por juego)
   │      ├─► number_range                   ← QUÉ NÚMEROS usa (0-10, 0-20, etc.)
   │      └─► settings (JSON)                ← QUÉ TAN DIFÍCIL es
   │
   └─► game_sessions (cada vez que juega)
          └─► results (JSON)                 ← RESULTADOS de la partida
```

---

## 1️⃣ `student_profiles.game_preferences` (JSON)

### ¿Qué es?
Configuración de **APARIENCIA y ELEMENTOS VISUALES/AUDIO** de los juegos.

### ¿Qué contiene?

```json
{
  "visual_element_type": "balls_with_numbers",  // o "object_images", "pictograms"
  "number_display_mode": "numeric",             // o "pictogram", "audio", "drawing", "video"
  "show_number_text": true,                     // Mostrar grafía del número
  "show_number_pictogram": false,               // Mostrar pictograma ARASAAC
  "show_number_image": false,                   // Mostrar dibujo/foto
  "play_number_audio": true,                    // Reproducir audio del número
  "container_images_set": "default",            // Qué imágenes usar para recipientes
  "object_images_set": "animals"                // Qué imágenes usar para objetos (ej: animales, frutas)
}
```

### Ejemplos de uso:

**Ejemplo 1: Estudiante quiere ver números como pictogramas**
```json
{
  "number_display_mode": "pictogram",
  "show_number_pictogram": true,
  "show_number_text": false
}
```

**Ejemplo 2: Estudiante usa objetos de animales en recipientes**
```json
{
  "visual_element_type": "object_images",
  "object_images_set": "animals"  // Perros, gatos, etc.
}
```

**Ejemplo 3: Estudiante con discapacidad visual - solo audio**
```json
{
  "number_display_mode": "audio",
  "play_number_audio": true,
  "show_number_text": false
}
```

---

## 2️⃣ `game_configurations.number_range`

### ¿Qué es?
El **RANGO DE NÚMEROS** con los que el estudiante juega.

### Valores posibles:
- `"0-10"` → Números del 0 al 10
- `"0-20"` → Números del 0 al 20
- `"0-100"` → Números del 0 al 100
- `"0-1000"` → Números del 0 al 1000

### Ejemplo:
Si `number_range = "0-10"`, el juego **solo usará** números del 0 al 10.

---

## 3️⃣ `game_configurations.settings` (JSON)

### ¿Qué es?
Configuración de **DIFICULTAD** del juego.

### Por juego:

#### Juego 1: `touch_number` (Toca el número que suena)

```json
{
  "options_count": 4  // Cuántos números mostrar en pantalla (1-12)
}
```

**Ejemplo:**
- `options_count = 4` → Fácil (4 opciones para elegir)
- `options_count = 12` → Difícil (12 opciones para elegir)

---

#### Juego 2: `order_sequence` (Ordena la secuencia)

```json
{
  "sequence_count": 5,        // Cuántos números ordenar (3-12)
  "order_type": "ascending"   // "ascending" o "descending"
}
```

**Ejemplo:**
- `sequence_count = 3, order_type = "ascending"` → Fácil (ordenar 3 números ascendente)
- `sequence_count = 12, order_type = "descending"` → Difícil (ordenar 12 números descendente)

---

#### Juego 3: `distribute_equal` (Reparte el mismo número)

```json
{
  "object_count": 8,           // Cuántas bolas/objetos aparecen (4, 8 o 12)
  "container_count": 2,        // Cuántos recipientes (2, 3 o 4)
  "requires_operations": false // ¿Requiere hacer sumas? (true/false)
}
```

**Ejemplo:**
- `object_count = 4, container_count = 2, requires_operations = false` → Fácil
- `object_count = 12, container_count = 4, requires_operations = true` → Difícil (con sumas)

---

#### Juego 4: `remove_equal` (Deja el mismo número)

```json
{
  "object_count": 8,           // Cuántas bolas/objetos aparecen (4, 8 o 12)
  "container_count": 2,        // Cuántos recipientes (2, 3 o 4)
  "requires_operations": false // ¿Requiere hacer restas? (true/false)
}
```

**Ejemplo:**
- `object_count = 4, container_count = 2, requires_operations = false` → Fácil
- `object_count = 12, container_count = 4, requires_operations = true` → Difícil (con restas)

---

## 4️⃣ `game_sessions.results` (JSON)

### ¿Qué es?
Resultados de **UNA SESIÓN de juego** (5 repeticiones).

### Estructura:

```json
[
  {
    "repetition": 1,           // Número de repetición (1-5)
    "correct": true,           // ¿Acertó?
    "attempts": 1,             // ¿Cuántos intentos necesitó?
    "duration_seconds": 15     // ¿Cuánto tardó?
  },
  {
    "repetition": 2,
    "correct": false,
    "attempts": 3,
    "duration_seconds": 30
  },
  {
    "repetition": 3,
    "correct": true,
    "attempts": 2,
    "duration_seconds": 20
  },
  {
    "repetition": 4,
    "correct": true,
    "attempts": 1,
    "duration_seconds": 12
  },
  {
    "repetition": 5,
    "correct": true,
    "attempts": 1,
    "duration_seconds": 10
  }
]
```

### Campos agregados:
- `total_correct`: 4 (repeticiones acertadas)
- `total_incorrect`: 1 (repeticiones falladas)
- `total_omissions`: 0 (repeticiones no completadas)

---

## 🔄 Flujo Completo de un Juego

### 1. **Estudiante inicia juego**

```typescript
// Frontend consulta configuración
const config = await supabase
  .from('game_configurations')
  .select('*, games(*)')
  .eq('student_id', studentId)
  .eq('game_id', gameId)
  .single();

// config.number_range → "0-10"
// config.settings → {"options_count": 4}

// Frontend consulta preferencias visuales/audio
const profile = await supabase
  .from('student_profiles')
  .select('game_preferences, visual_preferences, audio_preferences')
  .eq('student_id', studentId)
  .single();

// profile.game_preferences → {"visual_element_type": "balls_with_numbers"}
```

### 2. **Frontend genera el juego**

```typescript
// Basándose en:
// - number_range: "0-10" → Solo números del 0 al 10
// - settings.options_count: 4 → Mostrar 4 opciones
// - game_preferences.visual_element_type: "balls_with_numbers" → Usar bolas con números

// Genera:
// - Número correcto: 7
// - Opciones: [3, 5, 7, 9]
// - Mostrar como bolas con números
// - Reproducir audio "siete"
```

### 3. **Estudiante juega 5 repeticiones**

```typescript
const results = [];

// Repetición 1
results.push({
  repetition: 1,
  correct: true,
  attempts: 1,
  duration_seconds: 15
});

// Repetición 2
results.push({
  repetition: 2,
  correct: false,
  attempts: 3,
  duration_seconds: 30
});

// ... hasta 5 repeticiones
```

### 4. **Al terminar, guardar sesión**

```typescript
await supabase
  .from('game_sessions')
  .insert({
    student_id: studentId,
    game_id: gameId,
    results: results,  // Array JSON con 5 repeticiones
    total_correct: 4,
    total_incorrect: 1,
    total_omissions: 0
  });
```

### 5. **Mostrar gráficas de progreso**

```typescript
// Consultar todas las sesiones del estudiante
const { data: sessions } = await supabase
  .from('game_sessions')
  .select('*, games(name)')
  .eq('student_id', studentId)
  .order('started_at', { ascending: false });

// Agrupar por juego
const stats = sessions.reduce((acc, session) => {
  const gameName = session.games.name;
  if (!acc[gameName]) acc[gameName] = { correct: 0, incorrect: 0, omissions: 0 };

  acc[gameName].correct += session.total_correct;
  acc[gameName].incorrect += session.total_incorrect;
  acc[gameName].omissions += session.total_omissions;

  return acc;
}, {});

// Mostrar gráfica con stats
```

---

## 📊 Resumen Visual

```
┌─────────────────────────────────────────────────────────┐
│                 CONFIGURACIÓN DEL JUEGO                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  game_preferences (student_profiles)                    │
│  ├─ APARIENCIA                                          │
│  │  ├─ ¿Cómo se VEN los números? (grafía/pictograma)   │
│  │  ├─ ¿Cómo se ESCUCHAN? (audio/TTS)                  │
│  │  └─ ¿Qué IMÁGENES usar? (animales/frutas)           │
│                                                         │
│  game_configurations                                    │
│  ├─ DIFICULTAD                                          │
│  │  ├─ number_range: ¿Qué NÚMEROS? (0-10, 0-20...)    │
│  │  └─ settings: ¿Qué TAN DIFÍCIL? (opciones, objetos)│
│                                                         │
└─────────────────────────────────────────────────────────┘
                           │
                           │ Estudiante juega
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   RESULTADOS (game_sessions)            │
├─────────────────────────────────────────────────────────┤
│  results: [                                             │
│    {repetition: 1, correct: true, attempts: 1},         │
│    {repetition: 2, correct: false, attempts: 3},        │
│    ... hasta 5 repeticiones                             │
│  ]                                                      │
│                                                         │
│  total_correct: 4                                       │
│  total_incorrect: 1                                     │
│  total_omissions: 0                                     │
└─────────────────────────────────────────────────────────┘
                           │
                           │ Consultar progreso
                           ▼
                      GRÁFICAS
```

---

## ⚠️ Importante

1. **`game_preferences`** → SOLO apariencia (cómo se ve/escucha)
2. **`game_configurations`** → SOLO dificultad (qué números, cuántos elementos)
3. **`game_sessions`** → SOLO resultados (qué pasó cuando jugó)

Son **3 cosas diferentes** que trabajan juntas para personalizar la experiencia del estudiante.

---

## 🎯 Ejemplo Completo

**Juan (estudiante con discapacidad visual)**

### Perfil (`student_profiles`):
```json
{
  "game_preferences": {
    "number_display_mode": "audio",
    "play_number_audio": true,
    "show_number_text": false,
    "show_number_pictogram": false
  },
  "audio_preferences": {
    "volume": 100,
    "tts_voice": "es-ES-Standard-A",
    "tts_speed": 0.8
  }
}
```

### Configuración del juego "Toca el número" (`game_configurations`):
```json
{
  "number_range": "0-10",
  "settings": {
    "options_count": 3  // Solo 3 opciones (fácil)
  }
}
```

### Juega y obtiene estos resultados (`game_sessions`):
```json
{
  "results": [
    {"repetition": 1, "correct": true, "attempts": 1, "duration_seconds": 20},
    {"repetition": 2, "correct": true, "attempts": 1, "duration_seconds": 18},
    {"repetition": 3, "correct": false, "attempts": 2, "duration_seconds": 35},
    {"repetition": 4, "correct": true, "attempts": 1, "duration_seconds": 15},
    {"repetition": 5, "correct": true, "attempts": 1, "duration_seconds": 12}
  ],
  "total_correct": 4,
  "total_incorrect": 1,
  "total_omissions": 0
}
```

**Resultado**: Juan escuchó los números con voz clara, solo tuvo 3 opciones para elegir, y acertó 4 de 5. ¡Progreso! 📈
