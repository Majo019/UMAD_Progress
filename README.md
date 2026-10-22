# UMAD Progress · Frontend

App web responsiva (React + Vite) para organizar tiempo, hábitos y bienestar de estudiantes de la UMAD.

## Cómo correrlo

Necesitas [Node.js](https://nodejs.org) 18 o más reciente.

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Para la versión de producción: `npm run build`.

## Reparto de tareas (4. Frontend)

| # | Tarea | Responsable | Estado |
|---|-------|-------------|--------|
| 4.1 | Design System & Contexts | Pablo Farid Montoro | ✅ Listo |
| 4.2 | Vistas Auth | Zahid Serna | Placeholder en `views/Placeholder/LoginPlaceholder.jsx` |
| 4.3 | Dashboard & Lista Tareas | Moisés Medina | Placeholder en ruta `/` |
| 4.4 | Modal Crear/Editar Tarea | Moisés Medina | Pendiente (usar `<Modal>` y `<Field>`) |
| 4.5 | Widget Avatar Interactivo | Zahid Serna | Placeholder: `components/avatar/AvatarSlot.jsx` |
| 4.6 | Módulo Pomodoro Timer | Moisés Medina | Pendiente |
| 4.7 | Vistas Calendario, Amigos, Perfil | Pablo Farid Montoro | ✅ Listo |

## Estructura

```
src/
├── styles/
│   ├── tokens.css          # Colores, tipografía, espaciado, sombras (tema oscuro y claro)
│   └── global.css          # Reset y utilidades (.page-title, .label-mono, .stack…)
├── components/
│   ├── ui/                 # Design system: Button, IconButton, Card, Chip, ProgressBar,
│   │                       #   SegmentedControl, Modal, Field, UserAvatar, EmptyState
│   ├── layout/             # Header + barra de navegación inferior
│   └── avatar/AvatarSlot   # Avatar provisional (lo reemplaza el widget de Zahid)
├── context/                # Estado global compartido
│   ├── ThemeContext        # tema oscuro/claro
│   ├── AuthContext         # usuario, login, logout, updateProfile, <RequireAuth>
│   ├── AvatarContext       # vida/alimento/cariño, nivel, XP, Rueda de la Vida
│   ├── CalendarContext     # actividades del calendario
│   └── FriendsContext      # recomendaciones y amigos
├── views/
│   ├── Calendar/           # Vista mensual/semanal + CRUD de actividades
│   ├── Friends/            # Recomendaciones, mis amigos, búsqueda
│   ├── Profile/            # Avatar, Rueda de la Vida, editar perfil, configuración
│   └── Placeholder/        # Pantallas temporales de los compañeros
├── hooks/usePersistentState.js   # useState que se guarda en localStorage
└── utils/date.js                 # Helpers de fechas (semana inicia lunes)
```

## Para el equipo: cómo usar el Design System

```jsx
import { Button, Card, Chip, Modal, Field, ProgressBar } from '../../components/ui';
import { Plus, Heart } from 'lucide-react';

<Button icon={Plus}>Agregar Tarea</Button>
<Button variant="blue">Iniciar Pomodoro</Button>
<Chip color="coral" icon={Heart}>+5 Vida</Chip>
<ProgressBar value={80} label="Vida" color="coral" icon={Heart} />
```

Variantes de `Button`: `primary`, `blue`, `secondary`, `ghost`, `dashed`, `success`, `danger`.
Colores de `Chip` / `ProgressBar`: `coral`, `blue`, `green`, `amber`, `neutral`.
Íconos: [lucide-react](https://lucide.dev/icons).

**Regla:** nada de colores "a mano" en el CSS — siempre `var(--color-...)` de `tokens.css`, así funciona el tema claro.

## Para el equipo: cómo usar los contextos

```jsx
import { useAuth, useAvatar, useCalendar } from '../../context';

// Moisés · al completar una tarea (4.3)
const { applyReward } = useAvatar();
applyReward({ vida: 5, alimento: 5, xp: 10 });

// Moisés · al terminar un Pomodoro (4.6)
applyReward({ carino: 10, xp: 15 });

// Zahid · en el login (4.2)
const { login, register } = useAuth();
await login(email, password);

// Zahid · widget del avatar (4.5)
const { stats, level, xp } = useAvatar(); // stats = { vida, alimento, carino }
```

Si alguien crea un contexto nuevo (ej. `TasksContext`), se agrega en `context/AppProviders.jsx` y se exporta en `context/index.js`.

> Los datos se guardan en `localStorage` mientras se realiza la integracion completa con el backend. Desde **Perfil -> Configuracion** puedes restablecer los datos de ejemplo.

## Backend y Conexion a la Base de Datos

El backend de UMAD Progress esta desarrollado con FastAPI y SQLAlchemy como ORM, siguiendo una arquitectura modular por dominios basada en el diagrama entidad-relacion del proyecto.

### Como funciona la conexion a la base de datos

1. **Configuracion centralizada (`backend/app/core/config.py`)**:
   Define los parametros del sistema, incluyendo los origenes permitidos para CORS (comunicacion con el frontend en React/Vite) y la variable `DATABASE_URL`.
   Por defecto, utiliza SQLite local almacenado en `backend/umad_progress.db`:
   ```
   sqlite:///backend/umad_progress.db
   ```
   Si se requiere utilizar PostgreSQL o MySQL, se puede definir la variable de entorno `DATABASE_URL` mediante un archivo `.env` sin necesidad de modificar el codigo fuente (ver `backend/.env.example`).

2. **Motor y gestion de sesiones (`backend/app/core/database.py`)**:
   - **`engine`**: Se inicializa mediante `create_engine(settings.DATABASE_URL)`. Para conexiones SQLite se aplica `check_same_thread=False` para permitir multiples hilos concurrentes en peticiones web.
   - **`SessionLocal`**: Fabrica de sesiones configurada con `autocommit=False` y `autoflush=False`. Cada peticion obtiene su propia instancia de sesion aislada.
   - **`Base`**: Clase declarativa base (`declarative_base()`) a partir de la cual heredan todos los modelos de datos para registrar sus metadatos.
   - **`get_db()`**: Generador de dependencias inyectable en las rutas de FastAPI (`Depends(get_db)`). Garantiza que cada solicitud cree una sesion de base de datos limpia y la cierre de forma determinista en un bloque `finally`, evitando fugas de conexiones.

3. **Creacion automatica de tablas (`backend/app/main.py`)**:
   Al arrancar la aplicacion, el gestor de ciclo de vida asincrono (`lifespan`) ejecuta:
   ```python
   Base.metadata.create_all(bind=engine)
   ```
   Esto inspecciona todos los modelos importados y genera automaticamente las tablas, indices, llaves foraneas y restricciones unicas si aun no existen en la base de datos.

### Estructura del Backend dentro del Proyecto

La capa de datos y la logica del servidor se encuentran organizadas en el directorio `backend/`:

```
backend/
|-- app/
|   |-- core/
|   |   |-- config.py            # Configuraciones globales, CORS y URL de conexion
|   |   `-- database.py          # Motor SQLAlchemy, SessionLocal, Base y get_db
|   |-- models/                  # Modelos ORM (tablas de la base de datos)
|   |   |-- user.py              # User y AvatarProfile (relacion 1 a 1)
|   |   |-- calendar.py          # CalendarEvent (actividades y eventos del usuario)
|   |   |-- friendship.py        # Friendship (solicitudes y amigos con restriccion de unicidad)
|   |   |-- pomodoro.py          # PomodoroSession (sesiones de temporizador y progreso)
|   |   `-- items.py             # AvatarItem y UserItem (tienda e inventario equipado)
|   |-- schemas/                 # Esquemas de validacion y serializacion Pydantic v2
|   |   |-- user.py
|   |   |-- avatar.py
|   |   |-- calendar.py
|   |   |-- friendship.py
|   |   |-- pomodoro.py
|   |   `-- items.py
|   |-- routers/                 # Controladores y endpoints REST bajo el prefijo /api/v1
|   |   |-- users.py             # Registro, consulta y perfil de usuarios
|   |   |-- avatar.py            # Estadisticas del avatar (vida, alimento, carino, nivel, xp)
|   |   |-- calendar.py          # CRUD de actividades del calendario
|   |   |-- pomodoro.py          # Inicio, pausa y finalizacion de sesiones pomodoro
|   |   |-- friendship.py        # Envio y aceptacion de solicitudes de amistad
|   |   `-- items.py             # Consulta de catalogo, compra y equipamiento de items
|   `-- main.py                  # Instancia principal de FastAPI, CORS y registro de routers
|-- run.py                       # Script de arranque directo del servidor backend
|-- requirements.txt             # Dependencias del backend (FastAPI, SQLAlchemy, Pydantic, etc.)
|-- install_dependencies.sh      # Script de instalacion para entornos virtuales
`-- .env.example                 # Plantilla de variables de entorno
```

### Ejecucion del Backend

Para instalar las dependencias necesarias:
```bash
./install_dependencies.sh
```
O directamente con pip dentro del entorno virtual:
```bash
pip install -r backend/requirements.txt
```

Para levantar el servidor de desarrollo:
```bash
npm run backend
```
O utilizando Python directamente:
```bash
python run_backend.py
```

Una vez en ejecucion:
- Servidor base: `http://127.0.0.1:8000`
- Estado de salud y verificacion de conexion a la base de datos: `http://127.0.0.1:8000/health`
- Documentacion interactiva Swagger UI: `http://127.0.0.1:8000/docs`
- Documentacion alternativa Redoc: `http://127.0.0.1:8000/redoc`

## Subir a GitHub

```bash
git init
git add .
git commit -m "Design system, contextos y vistas Calendario/Amigos/Perfil"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/umad-progress.git
git push -u origin main
```

Si el repo ya existe y es del equipo, mejor trabaja en una rama: `git checkout -b feature/pablo-frontend` y abre un Pull Request.
