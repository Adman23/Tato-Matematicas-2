# Documentación del Sistema Backend - TatoMaths API

Este documento explica cómo funciona el backend de TatoMaths, su arquitectura, sistema de autenticación y flujo de datos.

## Índice

1. [Arquitectura General](#arquitectura-general)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Main.py - Aplicación Principal](#mainpy---aplicación-principal)
4. [Config.py - Configuración](#configpy---configuración)
5. [Dependencies.py - Middleware JWT](#dependenciespy---middleware-jwt)
6. [Routers/Auth.py - Endpoints](#routersauthpy---endpoints)
7. [Schemas/Auth.py - Modelos de Datos](#schemasauthpy---modelos-de-datos)
8. [Sistema de Autenticación](#sistema-de-autenticación)
9. [JWT - Tokens de Acceso](#jwt---tokens-de-acceso)
10. [Base de Datos (Supabase)](#base-de-datos-supabase)
11. [Flujos Completos](#flujos-completos)

---

## Arquitectura General

El backend está construido con FastAPI y sigue una arquitectura de capas:

```
┌──────────────────────────────────────────────┐
│  Cliente (Frontend - React)                  │
│  http://localhost:5173                       │
└────────────────┬─────────────────────────────┘
                 │ HTTP/JSON
                 │ Authorization: Bearer {token}
┌────────────────▼─────────────────────────────┐
│  FastAPI Application (main.py)               │
│  - CORS Middleware                           │
│  - Routers Registration                      │
└────────────────┬─────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌──────▼────────┐
│   Routers    │  │ Dependencies  │
│  (auth.py)   │  │ JWT Validator │
└───────┬──────┘  └──────┬────────┘
        │                 │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │   Schemas       │
        │ (Pydantic)      │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │   Services      │
        │  (supabase.py)  │
        └────────┬────────┘
                 │
┌────────────────▼─────────────────────────────┐
│  Supabase (PostgreSQL + Auth)                │
│  - auth.users (gestión de passwords)         │
│  - user_profiles (tutores/admins)            │
│  - students (estudiantes)                    │
│  - student_preferences (configuración)       │
└──────────────────────────────────────────────┘
```

---

## Estructura del Proyecto

```
backend/
├── app/
│   ├── main.py              # Punto de entrada, configuración CORS
│   ├── config.py            # Variables de entorno (Pydantic Settings)
│   ├── dependencies.py      # Validadores JWT (get_current_user, etc)
│   ├── routers/
│   │   └── auth.py         # Endpoints de autenticación
│   ├── schemas/
│   │   └── auth.py         # Modelos Pydantic (validación)
│   └── services/
│       └── supabase.py     # Cliente de Supabase
├── database/               # Scripts SQL (omitido en este doc)
├── requirements.txt
├── .env.example
└── .env                    # Variables secretas (no en git)
```

---

## Main.py - Aplicación Principal

Archivo: `app/main.py`

### Función Principal

Crea la aplicación FastAPI y configura middlewares:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import auth

app = FastAPI(
    title="TatoMaths API",
    description="API para aplicación de matemáticas adaptada",
    version="1.0.0"
)
```

### Configuración CORS

Permite que el frontend (puerto 5173) haga peticiones al backend (puerto 8000):

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Sin CORS, el navegador bloquearía las peticiones por política de mismo origen.

### Registro de Routers

```python
app.include_router(auth.router)
```

Todas las rutas de `auth.py` quedan disponibles bajo el prefijo `/auth`.

### Endpoints Básicos

```python
@app.get("/")
async def root():
    return {
        "name": "TatoMaths API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "ok"}
```

---

## Config.py - Configuración

Archivo: `app/config.py`

### Settings con Pydantic

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Modo desarrollo
    DEV_MODE: bool = True

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_JWT_SECRET: str
    SUPABASE_SERVICE_ROLE: str

    # JWT para estudiantes
    APP_JWT_SECRET: str
    APP_JWT_AUDIENCE: str = "student"
    APP_JWT_ISSUER: str = "tatomaths"

    # API
    API_URL: str = "http://localhost:8000"

    class Config:
        env_file = ".env"

settings = Settings()
```

### Variables Explicadas

| Variable | Propósito | Dónde Obtenerla |
|----------|-----------|----------------|
| `DEV_MODE` | Si es `true`, bypasea validación JWT | Configurar manualmente |
| `ALLOWED_ORIGINS` | Dominios permitidos para CORS | URL del frontend |
| `SUPABASE_URL` | URL del proyecto Supabase | Dashboard > Settings > API |
| `SUPABASE_ANON_KEY` | Clave pública de Supabase | Dashboard > Settings > API |
| `SUPABASE_JWT_SECRET` | Secreto para validar JWT de Supabase | Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE` | Clave con permisos admin | Dashboard > Settings > API |
| `APP_JWT_SECRET` | Secreto para JWT de estudiantes | Generar aleatorio |
| `APP_JWT_AUDIENCE` | Audience de tokens de estudiantes | Fijo: "student" |
| `APP_JWT_ISSUER` | Emisor de tokens de estudiantes | Fijo: "tatomaths" |

### Modo Desarrollo vs Producción

**DEV_MODE=true (Desarrollo):**
- No valida tokens JWT
- Devuelve usuarios fake en dependencies
- Útil para testing sin configurar Supabase

**DEV_MODE=false (Producción):**
- Validación completa de JWT
- Requiere tokens válidos
- Debe usarse en entornos reales

**CRÍTICO:** Nunca desplegar con `DEV_MODE=true` en producción.

---

## Dependencies.py - Middleware JWT

Archivo: `app/dependencies.py`

Contiene funciones que se ejecutan antes de procesar requests en rutas protegidas.

### HTTPBearer Security

```python
from fastapi.security import HTTPBearer

security = HTTPBearer()
```

Fuerza que todas las rutas protegidas incluyan el header:
```
Authorization: Bearer {token}
```

### get_current_user()

Valida tokens JWT de tutores y admins.

```python
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    # Modo desarrollo: devolver usuario fake
    if settings.DEV_MODE:
        return {
            "id": "dev-user-id",
            "email": "dev@tatomaths.com",
            "role": "admin",
            "full_name": "Admin Dev"
        }

    try:
        # Decodificar JWT con secreto de Supabase
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )

        user_id = payload.get("sub")

        # Buscar usuario en BD
        response = supabase.table("user_profiles") \
            .select("*") \
            .eq("id", user_id) \
            .execute()

        return response.data[0]

    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token inválido")
```

**Proceso:**
1. Extrae token del header
2. Si `DEV_MODE`, devuelve usuario fake
3. Decodifica JWT con `SUPABASE_JWT_SECRET`
4. Verifica firma digital (que no esté modificado)
5. Verifica que no haya expirado
6. Extrae `sub` (user_id) del payload
7. Busca usuario en tabla `user_profiles`
8. Devuelve datos del usuario o error 401/404

### get_current_admin()

Verifica que el usuario actual sea admin.

```python
async def get_current_admin(
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(403, "Solo administradores pueden acceder")
    return current_user
```

**Uso:** Rutas que solo admins pueden acceder (gestionar tutores, configurar juegos, etc).

### get_current_student()

Valida tokens JWT de estudiantes.

```python
async def get_current_student(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    if settings.DEV_MODE:
        return {
            "id": "dev-student-id",
            "username": "estudiante_dev",
            "full_name": "Estudiante Dev"
        }

    try:
        # Decodificar JWT con secreto de la app
        payload = jwt.decode(
            token,
            settings.APP_JWT_SECRET,
            algorithms=["HS256"],
            audience=settings.APP_JWT_AUDIENCE
        )

        # Verificar que sea token de estudiante
        if payload.get("type") != "student":
            raise HTTPException(401, "Token no válido para estudiante")

        student_id = payload.get("sub")

        # Buscar estudiante en BD
        response = supabase.table("students") \
            .select("*") \
            .eq("id", student_id) \
            .execute()

        return response.data[0]

    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token inválido")
```

**Diferencias con `get_current_user()`:**
- Usa `APP_JWT_SECRET` en lugar de `SUPABASE_JWT_SECRET`
- Verifica `type == "student"` en el payload
- Busca en tabla `students` en lugar de `user_profiles`
- Valida `audience == "student"`

### Uso en Endpoints

```python
from fastapi import Depends
from ..dependencies import get_current_user, get_current_admin, get_current_student

@router.get("/ruta-protegida")
async def ruta_protegida(current_user: dict = Depends(get_current_user)):
    # current_user contiene datos validados del usuario
    return {"mensaje": f"Hola {current_user['full_name']}"}

@router.post("/admin-only")
async def admin_only(current_admin: dict = Depends(get_current_admin)):
    # Solo llega aquí si el usuario es admin
    return {"data": "sensitive"}

@router.get("/student-games")
async def student_games(current_student: dict = Depends(get_current_student)):
    # current_student contiene datos validados del estudiante
    return {"games": [...]}
```

FastAPI ejecuta automáticamente la dependency antes del endpoint.

---

## Routers/Auth.py - Endpoints

Archivo: `app/routers/auth.py`

### Router Configuration

```python
from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["Autenticación"])
```

Todas las rutas definidas quedan bajo `/auth`.

### POST /auth/register

Registrar nuevo tutor o admin.

**Request:**
```json
{
  "username": "juan_perez",
  "email": "tutor@example.com",
  "password": "password123",
  "full_name": "Juan Pérez",
  "role": "tutor"
}
```

**Proceso:**
1. Valida que username no exista en `user_profiles`
2. Crea usuario en Supabase Auth con `sign_up(email, password)`
3. Supabase hashea password con bcrypt y crea registro en `auth.users`
4. Backend crea registro en `user_profiles` con mismo ID
5. Supabase genera JWT firmado
6. Devuelve `{access_token, token_type, user}`

**Response:** 201 Created
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "username": "juan_perez",
    "email": "tutor@example.com",
    "full_name": "Juan Pérez",
    "role": "tutor"
  }
}
```

**Errores:**
- 400: "El nombre de usuario ya está en uso"
- 400: "No se pudo crear el usuario. El email podría estar en uso"
- 500: Error de servidor

### POST /auth/login

Login de tutor o admin.

**Request:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Proceso:**
1. Busca usuario en `user_profiles` por username
2. Si no existe: error 404 "El usuario no existe"
3. Extrae email del perfil
4. Llama a `supabase.auth.sign_in_with_password(email, password)`
5. Supabase valida password (compara hash bcrypt)
6. Si incorrecto: error 401 "La contraseña es incorrecta"
7. Supabase genera JWT firmado
8. Devuelve `{access_token, token_type, user}`

**Response:** 200 OK (mismo formato que register)

**Por qué usa email internamente:**
- Supabase Auth identifica usuarios por email, no por username
- Backend mantiene username en `user_profiles` para login más amigable
- Traduce username → email → autenticación

### POST /auth/student

Login de estudiante con pictogramas.

**Request:**
```json
{
  "pictos": ["perro", "gato", "tortuga"]
}
```

**Proceso:**
1. Obtiene todos los estudiantes de la tabla `students`
2. Itera comparando `pictogram_login_sequence` con `pictos` enviados
3. Si encuentra coincidencia exacta:
   - Genera JWT con PyJWT
   - Payload incluye: `sub` (student_id), `type: "student"`, `exp` (24h)
   - Firma con `APP_JWT_SECRET`
4. Si no coincide: error 401 "Secuencia de pictogramas incorrecta"

**Código de generación JWT:**
```python
token_payload = {
    "sub": student['id'],
    "type": "student",
    "aud": settings.APP_JWT_AUDIENCE,
    "iss": settings.APP_JWT_ISSUER,
    "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    "iat": datetime.now(timezone.utc)
}

token = jwt.encode(
    token_payload,
    settings.APP_JWT_SECRET,
    algorithm="HS256"
)
```

**Response:** 200 OK
```json
{
  "token": "eyJhbGc...",
  "student_id": "uuid",
  "student": {
    "id": "uuid",
    "username": "pepito",
    "full_name": "Pepito García",
    "photo_url": "https://..."
  }
}
```

**Pictogramas disponibles:**
- perro
- gato
- tortuga
- pingüino
- caballo
- león
- elefante
- periquito
- pez payaso
- mariquita

### GET /auth/me

Obtener usuario actual (ruta protegida).

**Headers:** `Authorization: Bearer {token}`

**Proceso:**
1. FastAPI ejecuta `get_current_user()` dependency
2. Valida token JWT
3. Devuelve datos del usuario

**Response:** 200 OK
```json
{
  "id": "uuid",
  "username": "juan_perez",
  "email": "tutor@example.com",
  "full_name": "Juan Pérez",
  "role": "tutor"
}
```

**Errores:**
- 401: "Token inválido o expirado"
- 404: "Usuario no encontrado"

### POST /auth/logout

Cerrar sesión (ruta protegida).

**Headers:** `Authorization: Bearer {token}`

**Proceso:**
1. Valida que el token sea válido
2. Devuelve confirmación

**Response:** 200 OK
```json
{
  "message": "Sesión cerrada correctamente"
}
```

**Nota:** El token JWT no se puede revocar en el servidor. El frontend debe eliminarlo de localStorage. El token seguirá siendo técnicamente válido hasta que expire.

---

## Schemas/Auth.py - Modelos de Datos

Archivo: `app/schemas/auth.py`

Define la estructura de datos usando Pydantic para validación automática.

### Request Models

**RegisterRequest:**
```python
class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, pattern="^[A-Za-z0-9_-]+$")
    email: EmailStr
    password: str
    full_name: str
    role: str = "tutor"
```

Validaciones:
- `username`: mínimo 3 caracteres, solo alfanuméricos + guiones
- `email`: formato válido (valida Pydantic)
- `password`: sin restricciones explícitas (Supabase puede tener propias)
- `role`: debe ser "tutor" o "admin"

**LoginRequest:**
```python
class LoginRequest(BaseModel):
    username: str = Field(min_length=3)
    password: str
```

**StudentLoginRequest:**
```python
class StudentLoginRequest(BaseModel):
    pictos: List[str] = Field(min_length=1, max_length=10)
```

Validaciones:
- `pictos`: array de 1 a 10 strings
- Cada string debe ser un ID de pictograma válido

### Response Models

**UserProfile:**
```python
class UserProfile(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
```

**AuthResponse:**
```python
class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
```

**StudentAuthResponse:**
```python
class StudentAuthResponse(BaseModel):
    token: str
    student_id: str
    student: dict
```

**MessageResponse:**
```python
class MessageResponse(BaseModel):
    message: str
```

### Beneficios de Pydantic

1. **Validación automática:** FastAPI valida antes de ejecutar el endpoint
2. **Documentación automática:** Swagger UI genera ejemplos
3. **Serialización:** Convierte objetos Python a JSON automáticamente
4. **Type hints:** Errores de tipo en desarrollo

Si envías datos inválidos:
```json
{
  "username": "ab",  // Muy corto
  "email": "no-es-email"
}
```

FastAPI devuelve 422:
```json
{
  "detail": [
    {
      "loc": ["body", "username"],
      "msg": "ensure this value has at least 3 characters",
      "type": "value_error.any_str.min_length"
    },
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

---

## Sistema de Autenticación

El backend implementa dos flujos de autenticación distintos.

### Autenticación de Tutores/Admins

**Tecnología:** Supabase Auth + JWT

**Flujo completo:**
```
1. Usuario envía username + password
   ↓
2. Backend busca username en user_profiles
   ↓
3. Backend extrae email del perfil
   ↓
4. Backend llama a Supabase Auth con email + password
   ↓
5. Supabase compara hash bcrypt de password
   ↓
6. Supabase genera JWT firmado con SUPABASE_JWT_SECRET
   ↓
7. JWT incluye: sub (user_id), aud, exp, iat, email
   ↓
8. Backend devuelve JWT al frontend
   ↓
9. Frontend guarda en localStorage como 'access_token'
   ↓
10. Frontend incluye en header: Authorization: Bearer {token}
   ↓
11. Backend valida JWT en cada petición protegida
   ↓
12. Decodifica con SUPABASE_JWT_SECRET
   ↓
13. Extrae user_id y busca en user_profiles
   ↓
14. Endpoint recibe datos del usuario validado
```

**Características:**
- Password hasheada con bcrypt (Supabase)
- JWT firmado digitalmente
- Expira según configuración de Supabase
- No se puede modificar sin conocer secreto

### Autenticación de Estudiantes

**Tecnología:** JWT personalizado con PyJWT

**Flujo completo:**
```
1. Estudiante selecciona pictogramas
   ↓
2. Frontend envía array: ["perro", "gato", "tortuga"]
   ↓
3. Backend obtiene todos los estudiantes
   ↓
4. Backend compara pictogram_login_sequence de cada estudiante
   ↓
5. Si encuentra coincidencia exacta:
   ↓
6. Backend genera JWT con PyJWT
   ↓
7. JWT incluye: sub (student_id), type: "student", exp (24h)
   ↓
8. Backend firma con APP_JWT_SECRET
   ↓
9. Backend devuelve JWT al frontend
   ↓
10. Frontend guarda en localStorage como 'token'
   ↓
11. Frontend incluye en header: Authorization: Bearer {token}
   ↓
12. Backend valida JWT en peticiones protegidas
   ↓
13. Decodifica con APP_JWT_SECRET
   ↓
14. Verifica type == "student"
   ↓
15. Extrae student_id y busca en students
   ↓
16. Endpoint recibe datos del estudiante validado
```

**Características:**
- No usa password, usa secuencia visual
- JWT firmado con secreto propio (no Supabase)
- Expira en 24 horas (hardcoded)
- Campo `type: "student"` para diferenciarlo

### Diferencias Clave

| Aspecto | Tutores/Admins | Estudiantes |
|---------|----------------|-------------|
| **Credencial** | username + password | Secuencia de pictogramas |
| **Gestión password** | Supabase Auth (bcrypt) | No aplica |
| **Quién genera JWT** | Supabase | Backend (PyJWT) |
| **Secreto usado** | SUPABASE_JWT_SECRET | APP_JWT_SECRET |
| **Tabla BD** | user_profiles | students |
| **Validación** | get_current_user() | get_current_student() |
| **Token guardado como** | access_token | token |
| **Audience** | authenticated | student |
| **Campo especial** | role (admin/tutor) | type: "student" |
| **Expira en** | Config Supabase | 24 horas |

---

## JWT - Tokens de Acceso

### Estructura de un JWT

Un JWT tiene tres partes separadas por puntos:

```
eyJhbGc...  .  eyJzdWI...  .  SflKxw...
  HEADER    .   PAYLOAD   .  SIGNATURE
```

**Header (decodificado):**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload de tutor/admin (decodificado):**
```json
{
  "sub": "user-uuid-123",
  "email": "juan@example.com",
  "aud": "authenticated",
  "iss": "supabase",
  "exp": 1735689600,
  "iat": 1735603200,
  "role": "authenticated"
}
```

**Payload de estudiante (decodificado):**
```json
{
  "sub": "student-uuid-456",
  "type": "student",
  "aud": "student",
  "iss": "tatomaths",
  "exp": 1735689600,
  "iat": 1735603200
}
```

**Signature:**
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  SECRET_KEY
)
```

### Validación de JWT

Cuando llega un token:

1. **Separar partes:** header, payload, signature
2. **Decodificar header y payload** (son base64, no están encriptados)
3. **Recalcular firma:**
   ```python
   calculada = HMACSHA256(header + payload, SECRET)
   ```
4. **Comparar firmas:**
   ```python
   if calculada == recibida:
       # Token auténtico
   else:
       # Token modificado o inválido
   ```
5. **Verificar expiración:**
   ```python
   if payload['exp'] < now():
       # Token expirado
   ```
6. **Verificar audience:**
   ```python
   if payload['aud'] != expected_audience:
       # Token no es para este servicio
   ```

**Importante:** El payload NO está encriptado, solo firmado. Cualquiera puede leerlo, pero no modificarlo sin conocer el secreto.

### Por Qué Dos Secretos

**SUPABASE_JWT_SECRET:**
- Lo genera Supabase
- Usado por Supabase para firmar tokens de tutores/admins
- Backend lo usa para validar
- Si se filtra, se pueden crear tokens falsos de tutores

**APP_JWT_SECRET:**
- Lo generas tú
- Usado por tu backend para firmar tokens de estudiantes
- Backend lo usa para validar
- Si se filtra, se pueden crear tokens falsos de estudiantes

**Ventaja de separarlos:**
- Si uno se compromete, el otro sigue seguro
- Sistemas independientes (Supabase vs tu app)
- Puedes rotar uno sin afectar al otro

---

## Base de Datos (Supabase)

### Tablas Principales

**auth.users (tabla de Supabase):**
- Gestiona autenticación
- Almacena email y password hasheada
- No es directamente accesible desde tu código
- Se comunica con Supabase Auth API

**user_profiles:**
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    username VARCHAR(100) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'tutor',
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);
```

Campos:
- `id`: UUID que referencia `auth.users` (mismo ID)
- `username`: Para login (único)
- `role`: 'admin' o 'tutor'
- `full_name`: Nombre completo
- `email`: Copia del email de auth.users

**students:**
```sql
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    photo_url TEXT,
    pin_code VARCHAR(10),
    pictogram_login_sequence TEXT[],
    notes TEXT
);
```

Campo clave:
- `pictogram_login_sequence`: Array PostgreSQL con IDs de pictogramas
- Ejemplo: `['perro', 'gato', 'tortuga']`

**student_tutor_relations:**
```sql
CREATE TABLE student_tutor_relations (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    tutor_id UUID REFERENCES auth.users(id),
    is_primary BOOLEAN DEFAULT FALSE
);
```

Relación muchos a muchos:
- Un estudiante puede tener varios tutores
- Un tutor puede tener varios estudiantes

**student_preferences:**
```sql
CREATE TABLE student_preferences (
    id UUID PRIMARY KEY,
    student_id UUID UNIQUE REFERENCES students(id),
    -- Visuales
    primary_color VARCHAR(7),
    high_contrast BOOLEAN,
    -- Texto
    font_size font_size,
    font_weight INTEGER,
    -- Números
    number_display_mode number_display_mode,
    show_number_pictogram BOOLEAN,
    -- Audio
    enable_audio BOOLEAN,
    audio_volume INTEGER,
    tts_voice VARCHAR(100),
    -- Accesibilidad
    auto_read_instructions BOOLEAN,
    enable_switch_control BOOLEAN,
    timeout_seconds INTEGER,
    -- ... muchas más
);
```

Se crea automáticamente con valores por defecto cuando se crea un estudiante (trigger).

### Cliente Supabase

Archivo: `app/services/supabase.py`

```python
from supabase import create_client
from ..config import settings

supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE
)
```

**Por qué Service Role:**
- Tiene permisos completos en la BD
- Bypasea Row Level Security (RLS)
- Necesario para operaciones de servidor (registro, login)
- NUNCA exponer esta clave al frontend

**Uso:**
```python
# SELECT
response = supabase.table("user_profiles").select("*").eq("username", "juan").execute()
user = response.data[0]

# INSERT
supabase.table("user_profiles").insert({
    "id": "uuid",
    "username": "juan",
    "email": "juan@example.com",
    "role": "tutor",
    "full_name": "Juan Pérez"
}).execute()

# UPDATE
supabase.table("students").update({"full_name": "Nuevo Nombre"}).eq("id", "uuid").execute()

# DELETE
supabase.table("students").delete().eq("id", "uuid").execute()

# Auth
auth_response = supabase.auth.sign_in_with_password({
    "email": "juan@example.com",
    "password": "password123"
})
token = auth_response.session.access_token
```

---

## Flujos Completos

### Registro de Tutor/Admin

```
FRONTEND
  |
  | POST /auth/register
  | {username, email, password, full_name, role}
  |
  v
BACKEND (auth.py)
  |
  | 1. Valida formato con Pydantic
  |    - username mínimo 3 chars
  |    - email válido
  |
  | 2. Busca username en user_profiles
  |    SELECT * FROM user_profiles WHERE username = ?
  |
  | 3. Si existe: error 400 "Usuario ya existe"
  |
  | 4. Llama a Supabase Auth
  |    supabase.auth.sign_up({email, password})
  |
  v
SUPABASE AUTH
  |
  | 5. Hashea password con bcrypt
  | 6. Crea registro en auth.users
  | 7. Genera JWT firmado con SUPABASE_JWT_SECRET
  | 8. Devuelve {user, session{access_token}}
  |
  v
BACKEND (auth.py)
  |
  | 9. Inserta en user_profiles
  |    INSERT INTO user_profiles (id, username, email, role, full_name)
  |    VALUES (user.id, ...)
  |
  | 10. Construye AuthResponse
  |     {access_token, token_type: "bearer", user: {...}}
  |
  v
FRONTEND
  |
  | 11. Guarda en localStorage:
  |     localStorage.setItem('access_token', response.access_token)
  |     localStorage.setItem('user', JSON.stringify(response.user))
  |
  | 12. Actualiza estado del AuthContext
  | 13. Redirige a /dashboard
```

### Login de Tutor/Admin

```
FRONTEND
  |
  | POST /auth/login
  | {username, password}
  |
  v
BACKEND (auth.py)
  |
  | 1. Busca en user_profiles por username
  |    SELECT * FROM user_profiles WHERE username = ?
  |
  | 2. Si no existe: error 404 "El usuario no existe"
  |
  | 3. Extrae email del perfil
  |
  | 4. Llama a Supabase Auth
  |    supabase.auth.sign_in_with_password({email, password})
  |
  v
SUPABASE AUTH
  |
  | 5. Busca usuario por email en auth.users
  | 6. Compara password con hash almacenado (bcrypt)
  | 7. Si no coincide: error (backend lo captura)
  | 8. Si coincide: genera JWT firmado
  | 9. Devuelve {user, session{access_token}}
  |
  v
BACKEND (auth.py)
  |
  | 10. Si Supabase lanzó error: 401 "Contraseña incorrecta"
  |
  | 11. Si OK: construye AuthResponse
  |     {access_token, token_type: "bearer", user: {...}}
  |
  v
FRONTEND
  |
  | 12. Guarda token y user en localStorage
  | 13. Actualiza AuthContext
  | 14. Redirige a /dashboard
```

### Login de Estudiante

```
FRONTEND
  |
  | POST /auth/student
  | {pictos: ["perro", "gato", "tortuga"]}
  |
  v
BACKEND (auth.py)
  |
  | 1. Obtiene todos los estudiantes
  |    SELECT id, username, full_name, photo_url, pictogram_login_sequence
  |    FROM students
  |
  | 2. Itera sobre resultados
  |    for student in students:
  |        if student.pictogram_login_sequence == pictos:
  |            match = student
  |            break
  |
  | 3. Si no hay match: error 401 "Secuencia incorrecta"
  |
  | 4. Si hay match: genera JWT
  |    payload = {
  |        "sub": student.id,
  |        "type": "student",
  |        "aud": "student",
  |        "iss": "tatomaths",
  |        "exp": now + 24h,
  |        "iat": now
  |    }
  |    token = jwt.encode(payload, APP_JWT_SECRET, "HS256")
  |
  | 5. Construye StudentAuthResponse
  |    {token, student_id, student: {...}}
  |
  v
FRONTEND
  |
  | 6. Guarda en localStorage:
  |    localStorage.setItem('token', response.token)
  |    localStorage.setItem('student_id', response.student_id)
  |    localStorage.setItem('student', JSON.stringify(response.student))
  |
  | 7. Actualiza AuthContext (student)
  | 8. Redirige a /student-dashboard
```

### Request a Ruta Protegida

```
FRONTEND
  |
  | GET /auth/me
  | Headers: {
  |   Authorization: "Bearer eyJhbGc..."
  | }
  |
  v
BACKEND (FastAPI)
  |
  | 1. Detecta que endpoint requiere Depends(get_current_user)
  | 2. Ejecuta get_current_user() antes del endpoint
  |
  v
DEPENDENCIES.PY (get_current_user)
  |
  | 3. HTTPBearer extrae token del header
  |
  | 4. Si DEV_MODE: return fake_user
  |
  | 5. jwt.decode(token, SUPABASE_JWT_SECRET, HS256)
  |    - Verifica firma digital
  |    - Verifica que no expiró
  |    - Verifica audience == "authenticated"
  |
  | 6. Si inválido: error 401 "Token inválido"
  |
  | 7. Extrae user_id del campo "sub" del payload
  |
  | 8. SELECT * FROM user_profiles WHERE id = user_id
  |
  | 9. Si no existe: error 404 "Usuario no encontrado"
  |
  | 10. return user_profile
  |
  v
BACKEND (auth.py endpoint)
  |
  | 11. Recibe current_user con datos validados
  | 12. Procesa lógica del endpoint
  | 13. return UserProfile(current_user)
  |
  v
FRONTEND
  |
  | 14. Recibe {id, username, email, full_name, role}
  | 15. Actualiza UI con datos
```

### Token Expirado o Inválido

```
FRONTEND
  |
  | GET /auth/me (o cualquier ruta protegida)
  | Headers: {Authorization: "Bearer token_expirado"}
  |
  v
BACKEND (dependencies.py)
  |
  | 1. jwt.decode(...) lanza jwt.ExpiredSignatureError
  | 2. Captura excepción
  | 3. raise HTTPException(401, "Token expirado")
  |
  v
FRONTEND (api.ts interceptor)
  |
  | 4. Detecta response.status === 401
  | 5. isAuthEndpoint? No
  | 6. localStorage.clear() (limpia todo)
  | 7. window.location.href = "/login" (o /student-login)
  |
  v
LOGIN PAGE
  |
  | 8. Usuario ve pantalla de login
  | 9. Debe volver a autenticarse
```

---

## Resumen de Variables de Entorno

```bash
# Modo de desarrollo (bypasea validación JWT)
DEV_MODE=false  # SIEMPRE false en producción

# CORS (frontend permitido)
ALLOWED_ORIGINS=http://localhost:5173

# Supabase - obtener de Dashboard > Settings > API
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...  # Clave pública
SUPABASE_JWT_SECRET=tu-jwt-secret  # Para validar JWT de tutores/admins
SUPABASE_SERVICE_ROLE=eyJhbGc...  # Clave con permisos completos

# JWT de la aplicación (para estudiantes)
APP_JWT_SECRET=tu-secret-aleatorio  # Copiar el mismo que en SUPABASE_JWT_SECRET
APP_JWT_AUDIENCE=student
APP_JWT_ISSUER=tatomaths

# API URL
API_URL=http://localhost:8000
```

**Dónde obtener valores de Supabase:**
1. Ir a https://app.supabase.com
2. Seleccionar tu proyecto
3. Settings > API
4. Copiar URL, anon key, JWT secret, service role key



---

## Diferencias Importantes

### DEV_MODE vs Producción

| Comportamiento | DEV_MODE=true | DEV_MODE=false |
|----------------|---------------|----------------|
| Validación JWT | Desactivada | Activada |
| get_current_user() | Devuelve fake | Valida token real |
| get_current_student() | Devuelve fake | Valida token real |
| Consultas a BD | Omitidas | Ejecutadas |
| Útil para | Testing local sin Supabase | Entorno real |
| NUNCA usar en | Producción | - |

### Dos Tipos de JWT

| Aspecto | JWT de Tutor/Admin | JWT de Estudiante |
|---------|-------------------|-------------------|
| Generado por | Supabase Auth | Backend (PyJWT) |
| Firmado con | SUPABASE_JWT_SECRET | APP_JWT_SECRET |
| Validado por | get_current_user() | get_current_student() |
| Expira en | Config Supabase | 24 horas (hardcoded) |
| Payload incluye | sub, email, aud, role | sub, type, aud, iss |
| Campo distintivo | role: admin/tutor | type: student |
| Guardado como | access_token | token |
| Audience | authenticated | student |

---

## Notas de Seguridad

1. **Passwords:**
   - Nunca almacenadas en texto plano
   - Hasheadas con bcrypt por Supabase
   - Backend nunca ve la password real

2. **Tokens JWT:**
   - Firmados digitalmente
   - No pueden modificarse sin el secreto
   - Incluyen expiración automática
   - Payload es legible (no encriptado)

3. **Service Role Key:**
   - Permisos completos en BD
   - Bypasea Row Level Security
   - NUNCA exponer al frontend
   - Solo usarla en backend

4. **Variables de Entorno:**
   - Archivo .env NO debe estar en git
   - Contiene secretos críticos
   - Cada entorno debe tener su propio .env

5. **CORS:**
   - Limita qué dominios pueden hacer peticiones
   - Solo frontend autorizado
   - Previene ataques de otros sitios

6. **Tokens de Estudiante:**
   - Antes: strings simples falsificables
   - Ahora: JWT firmados y seguros
   - Mismo nivel de seguridad que tutores

