# 🗺️ ROADMAP - TatoMaths

**Última actualización**: 2025-01-13
**Estado Actual**: Infraestructura completada + Autenticación parcial
**Basado en**: Pliego Técnico DGP

---

## ✅ FASE 0: Infraestructura y Configuración (COMPLETADO - 100%)

### Base de Datos
- [x] 12 tablas diseñadas según requisitos
- [x] Scripts SQL organizados (00-10)
- [x] Tipos enumerados (roles, juegos, rangos de números, etc.)
- [x] Índices para optimización
- [x] Triggers automáticos (preferencias por defecto)
- [x] Funciones SQL (estadísticas, progreso)
- [x] 4 juegos insertados en catálogo
- [x] Estudiante de prueba (pepito con pictogramas 🐶🐱🐸)
- [x] Arquitectura backend-first (SERVICE_ROLE, sin RLS)
- [x] Documentación completa

### Backend (FastAPI)
- [x] Estructura de proyecto configurada
- [x] Conexión a Supabase
- [x] Sistema de autenticación JWT
- [x] Endpoints de login (tutores/admins y estudiantes)
- [x] Middleware de autenticación
- [x] Variables de entorno

### Frontend (Ionic React)
- [x] Proyecto configurado
- [x] Estructura modular (`pages/auth/`, `pages/student/`)
- [x] Context API para autenticación unificada
- [x] Axios con interceptores
- [x] Página Home con pictogramas accesibles
- [x] Login tutores/admins (email + password)
- [x] Login estudiantes (pictogramas accesibles)
- [x] Dashboard básico estudiante
- [x] Protección de rutas
- [x] CSS accesible y responsive

### Storage
- [x] 7 buckets configurados
- [x] Documentación de buckets
- [x] Pictogramas estáticos en `/public/assets/`

---

## 🔄 FASE 1: Sistema de Usuarios y Autenticación (EN PROGRESO - 75%)

### ✅ Completado
- [x] Login administrador (email + contraseña)
- [x] Login tutor (email + contraseña)
- [x] Login estudiante accesible (pictogramas)
- [x] Protección de rutas por rol
- [x] Context de autenticación unificado
- [x] Logout funcional

### 🚧 Pendiente
- [ ] Registro de administradores
- [ ] Registro de tutores (por admin)
- [ ] Gestión de contraseñas
- [ ] Perfiles de usuario completos

---

## 📋 FASE 2: Gestión de Perfiles de Estudiantes (0%)

### Datos de Identificación
- [ ] Crear perfil de estudiante (por admin)
  - [ ] Nombre completo
  - [ ] Fecha de nacimiento
  - [ ] Username único
  - [ ] Foto del estudiante (opcional)
  - [ ] Notas adicionales

### Login Accesible para Estudiantes
- [ ] Sistema de login con pictogramas (YA HECHO ✅)
- [ ] Secuencia de 3-5 pictogramas personalizables
- [ ] Alternativa: PIN numérico accesible

### Asignación Tutor-Estudiante
- [ ] Vincular estudiantes con tutores
- [ ] Marcar tutor principal
- [ ] Permitir múltiples tutores por estudiante

---

## ⚙️ FASE 3: Preferencias de Visualización (0%)

### Configuración de Preferencias (por Tutor)
- [ ] **Colores favoritos**
  - [ ] Color de fondo
  - [ ] Color de elementos
  - [ ] Asegurar contraste adecuado

- [ ] **Tipografía**
  - [ ] Tipo de fuente (clara, sans-serif)
  - [ ] Tamaño: small, medium, large, extra_large

- [ ] **Forma de visualizar números**
  - [ ] Grafía del número (1, 2, 3...)
  - [ ] Pictograma (imágenes de ARASAAC)
  - [ ] Audio (sintetizado o grabado)
  - [ ] Dibujo (representación visual)
  - [ ] Vídeo explicativo
  - [ ] Combinaciones (ej: número + audio)

- [ ] **Imágenes y audios de objetos/recipientes**
  - [ ] Fotografías personalizadas
  - [ ] Pictogramas ARASAAC
  - [ ] Audios grabados por el tutor
  - [ ] Audios sintetizados (TTS)

- [ ] **Otras preferencias**
  - [ ] Contraste alto (sí/no)
  - [ ] Audio automático en cada elemento
  - [ ] Texto a voz activado
  - [ ] Límite de tiempo (sí/no)

### Integración con ARASAAC
- [ ] API de ARASAAC para obtener pictogramas
- [ ] Búsqueda de pictogramas por palabra clave
- [ ] Descarga y almacenamiento local

---

## 🎮 FASE 4: Juego 1 - "Toca el número que suena" (0%)

### Requisitos del Pliego
> Se escucha un número y se escoge el correspondiente de entre los mostrados en pantalla.

### Mecánica del Juego
- [ ] Reproducir audio del número (sintetizado o grabado)
- [ ] Mostrar opciones en pantalla (números, pictogramas, dibujos)
- [ ] Detectar selección del estudiante
- [ ] Validar respuesta (correcto/incorrecto)
- [ ] Feedback visual y sonoro inmediato
- [ ] 5 repeticiones con elementos aleatorios

### Configuración (por Tutor)
- [ ] **Rango de números**
  - [ ] 0 a 10
  - [ ] 0 a 20
  - [ ] 0 a 100
  - [ ] 0 a 1000

- [ ] **Cantidad de opciones en pantalla**
  - [ ] 1 a 12 números para elegir

- [ ] **Visualización según preferencias del estudiante**
  - [ ] Aplicar tipo de número (grafía, pictograma, audio, etc.)
  - [ ] Aplicar colores y tipografía configurados

### Ayuda
- [ ] Vídeo de demostración subtitulado
- [ ] Botón "Ayuda" accesible durante el juego

### Registro de Resultados
- [ ] Crear sesión de juego
- [ ] Guardar cada respuesta (acierto/fallo/omisión)
- [ ] Calcular puntuación total
- [ ] Guardar en base de datos

### Mensaje de Refuerzo Personalizado
- [ ] Al terminar: mostrar mensaje positivo
- [ ] Formatos: vídeo, GIF animado o texto
- [ ] Personalizable por tutor
- [ ] Audio de refuerzo (grabado o sintetizado)

---

## 🎮 FASE 5: Juego 2 - "Ordena la secuencia" (0%)

### Requisitos del Pliego
> Se muestra una fila con números desordenados y hay que colocarlos ordenados en una fila de abajo.

### Mecánica del Juego
- [ ] Generar secuencia desordenada de números
- [ ] Mostrar fila superior con números desordenados
- [ ] Mostrar fila inferior vacía para ordenar
- [ ] Implementar drag & drop accesible
- [ ] Alternativa: botones para mover elementos
- [ ] Validar orden correcto
- [ ] Feedback visual y sonoro
- [ ] 5 repeticiones con elementos aleatorios

### Configuración (por Tutor)
- [ ] **Rango de números**
  - [ ] 0 a 10
  - [ ] 0 a 20
  - [ ] 0 a 100
  - [ ] 0 a 1000

- [ ] **Cantidad de números a ordenar**
  - [ ] De 3 a 12 números

- [ ] **Tipo de orden**
  - [ ] Creciente (1, 2, 3, 4...)
  - [ ] Decreciente (10, 9, 8, 7...)

- [ ] **Visualización según preferencias**

### Ayuda y Refuerzo
- [ ] Vídeo de demostración subtitulado
- [ ] Mensaje de refuerzo personalizado al terminar

### Registro de Resultados
- [ ] Guardar sesión y resultados

---

## 🎮 FASE 6: Juego 3 - "Reparte el mismo número en cada recipiente" (0%)

### Requisitos del Pliego
> Se muestran objetos o bolas con un número que hay que mover a los recipientes que aparecen abajo, de tal forma que la misma cantidad esté en cada recipiente. Puede implicar operaciones de suma para alcanzar la cantidad solicitada.

### Mecánica del Juego
- [ ] Mostrar bolas/objetos con números
- [ ] Mostrar recipientes vacíos abajo
- [ ] Implementar drag & drop de bolas a recipientes
- [ ] Permitir sumar múltiples bolas en un recipiente
- [ ] Mostrar operación de suma automáticamente en pantalla
- [ ] Validar que todos los recipientes tengan la misma cantidad
- [ ] Feedback visual y sonoro
- [ ] 5 repeticiones con elementos aleatorios

### Configuración (por Tutor)
- [ ] **Rango de números**
  - [ ] 0 a 10
  - [ ] 0 a 20

- [ ] **Tipo de elementos**
  - [ ] Bolas con números
  - [ ] Muchas imágenes del mismo objeto (conteo visual)

- [ ] **Número de bolas/objetos**
  - [ ] 4 elementos
  - [ ] 8 elementos
  - [ ] 12 elementos

- [ ] **Número de recipientes**
  - [ ] 2 recipientes
  - [ ] 3 recipientes
  - [ ] 4 recipientes

- [ ] **Requiere sumas**
  - [ ] Sí (hay que sumar varias bolas)
  - [ ] No (cada bola ya tiene el número exacto)

- [ ] **Visualización según preferencias**
  - [ ] Audio al tocar cada elemento
  - [ ] Audio del número objetivo

### Operación de Suma Automática
- [ ] Mostrar operación en pantalla: "2 + 3 = 5"
- [ ] Actualizar automáticamente al mover bolas
- [ ] Audio opcional de la operación

### Ayuda y Refuerzo
- [ ] Vídeo de demostración subtitulado
- [ ] Mensaje de refuerzo personalizado

### Registro de Resultados
- [ ] Guardar sesión y resultados

---

## 🎮 FASE 7: Juego 4 - "Deja el mismo número en cada recipiente" (0%)

### Requisitos del Pliego
> Se muestran recipientes con objetos o números dentro y hay que sacar de ellos (colocar arriba) los que sobren para que todos los recipientes tengan la misma cantidad. Puede implicar operaciones de resta para alcanzar la cantidad solicitada.

### Mecánica del Juego
- [ ] Mostrar recipientes CON objetos/números dentro
- [ ] Permitir sacar objetos (colocarlos arriba/fuera)
- [ ] Implementar drag & drop inverso (de recipiente hacia fuera)
- [ ] Mostrar operación de resta automáticamente en pantalla
- [ ] Validar que todos los recipientes tengan la misma cantidad
- [ ] Feedback visual y sonoro
- [ ] 5 repeticiones con elementos aleatorios

### Configuración (por Tutor)
- [ ] **Mismos parámetros que Juego 3**
  - [ ] Rango de números (0-10, 0-20)
  - [ ] Tipo de elementos
  - [ ] Número de elementos iniciales (4, 8, 12)
  - [ ] Número de recipientes (2, 3, 4)

- [ ] **Requiere restas**
  - [ ] Sí (hay que restar para igualar)
  - [ ] No (solo quitar elementos sin cálculo)

- [ ] **Visualización según preferencias**

### Operación de Resta Automática
- [ ] Mostrar operación en pantalla: "8 - 3 = 5"
- [ ] Actualizar automáticamente al quitar objetos
- [ ] Audio opcional de la operación

### Ayuda y Refuerzo
- [ ] Vídeo de demostración subtitulado
- [ ] Mensaje de refuerzo personalizado

### Registro de Resultados
- [ ] Guardar sesión y resultados

---

## 📊 FASE 8: Visualización de Progreso - Estudiante (0%)

### Gráficas para el Estudiante
- [ ] Ver gráficas de progreso propias
- [ ] Desglose por juego:
  - [ ] Aciertos
  - [ ] Fallos
  - [ ] Omisiones
- [ ] Gráficos de barras o líneas
- [ ] Evolución temporal
- [ ] Interfaz accesible y clara

---

## 👨‍🏫 FASE 9: Panel de Tutor - Gestión y Seguimiento (0%)

### Dashboard de Tutor
- [ ] Ver lista de estudiantes asignados
- [ ] Resumen de actividad reciente
- [ ] Acceso rápido a configuraciones

### Configurar Perfil de Estudiante
- [ ] Editar datos de identificación
- [ ] Modificar login accesible (pictogramas/PIN)
- [ ] Configurar preferencias de visualización
- [ ] Subir fotos, audios, vídeos personalizados

### Configurar Juegos por Estudiante
- [ ] Configurar cada juego individualmente
- [ ] Ajustar nivel de dificultad (rangos, opciones)
- [ ] Activar/desactivar funcionalidades (sumas, restas)
- [ ] Cambiar configuración según progreso del estudiante

### Consultar Progreso del Estudiante
- [ ] Ver gráficas detalladas
- [ ] Comparar rendimiento entre juegos
- [ ] Ver historial de sesiones
- [ ] Exportar datos (CSV/PDF)

### Mensajes de Refuerzo Personalizados
- [ ] Crear mensajes de texto
- [ ] Subir vídeos/GIFs de refuerzo
- [ ] Grabar audios personalizados
- [ ] Asignar mensajes por juego o logro

---

## 👑 FASE 10: Panel de Administrador (0%)

### Gestión de Tutores
- [ ] Crear tutores (email, contraseña, nombre)
- [ ] Listar tutores
- [ ] Editar tutores
- [ ] Eliminar tutores

### Gestión de Estudiantes
- [ ] Crear estudiantes
- [ ] Asignar datos de identificación
- [ ] Configurar login accesible inicial
- [ ] Listar estudiantes
- [ ] Editar estudiantes
- [ ] Eliminar estudiantes

### Vinculación Tutor-Estudiante
- [ ] Asignar tutores a estudiantes
- [ ] Marcar tutor principal
- [ ] Permitir múltiples tutores
- [ ] Des-vincular relaciones

### Vista General del Sistema
- [ ] Estadísticas generales
- [ ] Usuarios activos
- [ ] Sesiones de juego totales

---

## ♿ FASE 11: Accesibilidad para Problemas de Movilidad (0%)

### Requisitos del Pliego
> La aplicación debe ser también accesible para estudiantes con problemas de movilidad. Habrá una clase extra para explicar el uso y aplicación de algunos dispositivos específicos.

### Dispositivos de Accesibilidad
- [ ] Soporte para **pulsadores/switches**
  - [ ] Switch único (barrido)
  - [ ] Doble switch (selección directa)
- [ ] Soporte para **teclado externo**
  - [ ] Navegación con Tab/Enter
  - [ ] Shortcuts personalizables
- [ ] Soporte para **joystick/gamepad**
- [ ] Soporte para **eye tracking** (explorar)

### Modos de Interacción Accesibles
- [ ] **Barrido automático** (scanning)
  - [ ] Resaltar opciones secuencialmente
  - [ ] Velocidad configurable
  - [ ] Selección con pulsador
- [ ] **Botones grandes y espaciados**
  - [ ] Mínimo 48x48px (recomendado 60x60px)
  - [ ] Espaciado de 8px entre botones
- [ ] **Tiempo de espera configurable**
  - [ ] Para usuarios con respuesta lenta
  - [ ] Desactivar timeouts automáticos

### Testing con Dispositivos Reales
- [ ] Documentar dispositivos probados
- [ ] Crear guía de configuración
- [ ] Casos de uso específicos

---

## 🚀 FASE 12: Características Avanzadas y Optimización (0%)

### Multimedia Personalizado
- [ ] Gestión de biblioteca multimedia del tutor
- [ ] Subida masiva de recursos
- [ ] Previsualización antes de asignar
- [ ] Categorización de recursos

### Text-to-Speech (TTS)
- [ ] Integrar Web Speech API
- [ ] Sintetizar números y textos
- [ ] Múltiples voces (español)
- [ ] Velocidad y tono configurables

### PWA (Progressive Web App)
- [ ] Configurar `manifest.json`
- [ ] Service Worker para modo offline
- [ ] Caché de recursos estáticos
- [ ] Sincronización cuando vuelve online
- [ ] Instalable en dispositivos móviles

### Optimización de Rendimiento
- [ ] Lazy loading de componentes
- [ ] Optimización de imágenes
- [ ] Caché de assets
- [ ] Auditoría con Lighthouse

---

## 📊 Progreso General del Proyecto

| Fase | Requisito del Pliego | Estado | Progreso |
|------|---------------------|--------|----------|
| **Fase 0** | Infraestructura | ✅ Completado | 100% |
| **Fase 1** | Usuarios y autenticación | 🔄 En progreso | 75% |
| **Fase 2** | Perfiles de estudiantes | ⏳ Pendiente | 0% |
| **Fase 3** | Preferencias de visualización | ⏳ Pendiente | 0% |
| **Fase 4** | Juego 1: Toca el número | ⏳ Pendiente | 0% |
| **Fase 5** | Juego 2: Ordena secuencia | ⏳ Pendiente | 0% |
| **Fase 6** | Juego 3: Reparte igual | ⏳ Pendiente | 0% |
| **Fase 7** | Juego 4: Deja igual | ⏳ Pendiente | 0% |
| **Fase 8** | Progreso estudiante | ⏳ Pendiente | 0% |
| **Fase 9** | Panel de tutor | ⏳ Pendiente | 0% |
| **Fase 10** | Panel de administrador | ⏳ Pendiente | 0% |
| **Fase 11** | Accesibilidad movilidad | ⏳ Pendiente | 0% |
| **Fase 12** | Características avanzadas | ⏳ Pendiente | 0% |

**Progreso Total: ~14%** (Infraestructura + 75% autenticación)

---

## 🎯 Prioridades según el Pliego

### Críticas (Obligatorias)
1. ✅ Sistema de usuarios (admin, tutor, estudiante)
2. ⏳ Perfiles de estudiantes con preferencias
3. ⏳ Los 4 juegos funcionales con configuración
4. ⏳ Visualización de progreso
5. ⏳ Panel de tutor completo
6. ⏳ Panel de administrador
7. ⏳ Accesibilidad para movilidad reducida

### Importantes
- Login accesible para estudiantes ✅
- Integración con ARASAAC
- Mensajes de refuerzo personalizados
- Vídeos de ayuda por juego

### Opcionales (Extras)
- PWA con modo offline
- Eye tracking
- Exportación de datos avanzada

---

## 🎯 Próximos Pasos Inmediatos

### 1️⃣ Completar Fase 1 (Autenticación)
```
[ ] Crear endpoint de registro de tutores
[ ] Crear página de registro en frontend
[ ] Gestión básica de perfiles
```

### 2️⃣ Iniciar Fase 2 (Perfiles de Estudiantes)
```
[ ] CRUD de estudiantes (backend)
[ ] CRUD de estudiantes (frontend)
[ ] Asignación tutor-estudiante
[ ] Configuración de login accesible (pictogramas personalizables)
```

### 3️⃣ Iniciar Fase 3 (Preferencias)
```
[ ] Diseñar componente de configuración de preferencias
[ ] Implementar backend para guardar preferencias
[ ] Integrar con ARASAAC (API de pictogramas)
[ ] Preview en tiempo real de las preferencias
```

### 4️⃣ Desarrollar Fase 4 (Primer Juego)
```
[ ] Subir audios de números 1-10 a Storage
[ ] Crear componente del juego "Toca el número"
[ ] Implementar sistema de puntuación
[ ] Guardar resultados en BD
[ ] Mensaje de refuerzo personalizado
```

---

## 💡 Recomendaciones de Desarrollo

### Orden Sugerido
1. Completar sistema de usuarios (Fases 1, 2, 10)
2. Implementar preferencias (Fase 3)
3. Desarrollar juegos uno por uno (Fases 4-7)
4. Añadir visualización de progreso (Fases 8, 9)
5. Optimizar accesibilidad (Fase 11)
6. Características avanzadas (Fase 12)

### Buenas Prácticas
- ✅ Priorizar accesibilidad desde el inicio
- ✅ Probar con usuarios reales (estudiantes, tutores)
- ✅ Usar pictogramas de ARASAAC para consistencia
- ✅ Documentar todas las configuraciones posibles
- ✅ Mantener diseño simple y limpio
- ✅ Testear con dispositivos de accesibilidad reales

---

## 📁 Estructura Actual del Proyecto

```
dgp/
├── backend/
│   ├── app/
│   │   ├── main.py ✅
│   │   ├── routers/
│   │   │   ├── auth.py ✅
│   │   │   ├── auth_student.py ✅
│   │   │   └── (pendiente: tutors, students, games, etc.)
│   │   ├── services/
│   │   │   └── supabase.py ✅
│   │   └── schemas/ (pendiente crear modelos)
│   ├── database/ ✅ (completo)
│   └── .env ✅
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx ✅
│   │   ├── pages/
│   │   │   ├── Home.tsx ✅ (con pictogramas accesibles)
│   │   │   ├── auth/ ✅
│   │   │   ├── student/ ✅
│   │   │   └── (pendiente: admin, tutor, games)
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx ✅
│   │   └── lib/
│   │       └── api.ts ✅
│   ├── public/
│   │   └── assets/
│   │       └── pictograms/ ✅
│   └── .env ✅
│
├── ROADMAP.md ✅ (este archivo)
├── README.md ✅
├── GUIA_COLABORACION.md ✅
├── INICIO_RAPIDO.md ✅
└── CHECKLIST.md ✅
```

---

## 📚 Referencias del Pliego Técnico

- **4 Juegos obligatorios**: Definidos en páginas 7-8
- **Perfiles y preferencias**: Página 7
- **Configuración de juegos**: Páginas 7-8
- **Accesibilidad**: Página 8 (dispositivos específicos)
- **Roles**: Admin, Tutor, Estudiante

---

**🎉 ¡Infraestructura 100% lista! Ahora a desarrollar según el pliego. 🚀**

**Nota**: El chat entre tutor y estudiante NO se implementará según tu indicación.
