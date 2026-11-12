# UMAD Progress

App web responsiva para organizar tiempo, hábitos y bienestar de estudiantes de la UMAD.

- **Frontend:** React 18 + Vite (`src/`)
- **Backend:** Django + Django REST Framework (`backend/`)
- **Base de datos:** SQLite en local, PostgreSQL en Render

## Arranque rápido

Necesitas [Node.js](https://nodejs.org) 18+ y [Python](https://www.python.org) 3.11+. En Windows usa **Git Bash**.

```bash
./start.sh
```

El script hace todo lo necesario:

1. Crea el entorno virtual `venv/` e instala `backend/requirements.txt` (solo la primera vez).
2. Ejecuta `npm install` si no existe `node_modules/`.
3. Aplica las migraciones de la base de datos.
4. Crea las cuentas iniciales (admin y alumno). Si ya existen, no las toca.
5. Levanta el backend y el frontend. **Ctrl+C** detiene los dos.

| Servicio | URL |
|----------|-----|
| App (frontend) | http://localhost:5173 |
| API (backend) | http://127.0.0.1:8000/api/ |
| Django admin | http://127.0.0.1:8000/admin/ |

Opciones:

- `./start.sh --no-seed`: arranca sin crear las cuentas iniciales.
- `FRONTEND_PORT=3000 ./start.sh`: cambia el puerto del frontend. El backend siempre usa el 8000, porque `vite.config.js` hace proxy de `/api` a ese puerto.

Si un puerto ya está ocupado, el script se detiene con un mensaje. Cierra el proceso que lo usa y vuelve a intentarlo.

### Arranque manual

```bash
# Backend
python -m venv venv
venv/Scripts/python -m pip install -r backend/requirements.txt   # macOS/Linux: venv/bin/python
cd backend
../venv/Scripts/python manage.py migrate
../venv/Scripts/python manage.py seed_users
../venv/Scripts/python manage.py runserver

# Frontend (en otra terminal, desde la raíz)
npm install
npm run dev
```

## Roles y cuentas

Hay dos roles, cada uno con su propio perfil y sus propias pantallas:

| Rol | Perfil | Pantallas |
|-----|--------|-----------|
| `user` (alumno) | `UserProfile`: carrera, semestre, metas, intereses, rueda de la vida | App del alumno: `/`, `/pomodoro`, `/tareas`, `/amigos`, `/perfil` |
| `admin` | `AdminProfile`: nombre a mostrar, cargo, departamento, teléfono, bio | Panel: `/admin`, `/admin/usuarios`, `/admin/tareas`, `/admin/perfil` |

- Toda cuenta registrada desde `/register` es `user`. El rol no se puede elegir al registrarse.
- Al iniciar sesión, un admin va a `/admin`, y un alumno que intente entrar a `/admin` vuelve a su app.

### Cuentas iniciales

`seed_users` (lo ejecuta `start.sh`) crea solo la cuenta de administrador. Los alumnos se registran desde `/register`.

| Rol | Correo | Contraseña |
|-----|--------|------------|
| admin | `admin@umad.edu.mx` | `Admin123!` |

> ⚠️ Son credenciales de desarrollo. **No las uses en producción.** Para cambiarlas, define estas variables antes de ejecutar el comando: `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`.

Comandos útiles (desde `backend/`):

```bash
python manage.py seed_users                    # crea la cuenta inicial de admin (idempotente)
python manage.py seed_users --reset-passwords  # restablece su contraseña
python manage.py create_admin correo@x.com --password Clave123 --name "Nombre"   # crea o promueve un admin
```

Un admin también puede promover a otros usuarios desde **Panel → Usuarios**.

### Panel de administración

- **Dashboard:** alumnos, registros recientes, % de tareas completadas, minutos de enfoque, tareas por área y top de alumnos por nivel.
- **Usuarios:** búsqueda y filtros, cambiar rol, activar o desactivar cuentas, eliminar, y ver el detalle de cada alumno (progreso, avatar, rueda de la vida, tareas).
- **Tareas:** tareas de todos los alumnos, con filtros y eliminación.
- **Mi perfil:** edición del perfil de administrador.

Reglas de seguridad: un admin no puede quitarse el rol, desactivarse ni eliminarse a sí mismo, y siempre debe quedar al menos un admin activo.

## API

| Endpoint | Acceso | Descripción |
|----------|--------|-------------|
| `POST /api/auth/register/` | público | Registro (siempre rol `user`) |
| `POST /api/auth/login/` | público | Devuelve `token` y `user` (incluye `role`) |
| `GET/PATCH /api/auth/me/` | autenticado | Perfil del usuario actual |
| `/api/tasks/`, `/api/pomodoro/`, `/api/avatar/`, `/api/friends/`, `/api/calendar/events/` | autenticado | Funciones del alumno |
| `GET /api/admin/stats/` | admin | Métricas globales |
| `GET /api/admin/users/?search=&role=&status=&page=` | admin | Listado de usuarios |
| `GET/PATCH/DELETE /api/admin/users/<id>/` | admin | Detalle, cambio de rol/estado, eliminar |
| `GET /api/admin/tasks/?search=&status=&priority=&area=&user=` | admin | Tareas de todos los alumnos |
| `DELETE /api/admin/tasks/<id>/` | admin | Eliminar tarea |
| `GET/PATCH /api/admin/profile/` | admin | Perfil del administrador |

Autenticación: cabecera `Authorization: Token <token>`.

## Pruebas

```bash
cd backend
../venv/Scripts/python manage.py test
```

## Estructura

```
backend/
├── authentication/     # Registro/login, UserProfile, AdminProfile, roles
│   ├── roles.py        # get_role / set_role (único punto para cambiar roles)
│   ├── permissions.py  # IsAdminRole
│   └── management/commands/  # seed_users, create_admin
├── administration/     # API del panel admin (/api/admin/)
├── tasks/  pomodoro/  gamification/  social/
└── backend/            # settings y urls

src/
├── styles/             # tokens.css (tema oscuro/claro) y global.css
├── components/         # ui/ (design system), layout/, avatar/, wheel/
├── context/            # Auth (con RequireAuth / RequireUser / RequireAdmin), Avatar, Tasks, Calendar, Friends, Theme
├── views/
│   ├── Auth/           # Login, registro, recuperar contraseña
│   ├── Dashboard/ Tasks/ TasksHistory/ Pomodoro/ Friends/ Profile/   # app del alumno
│   └── Admin/          # panel de administración (estilos con prefijo adm-)
└── utils/api.js        # cliente HTTP con token
```

## Design System

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

**Regla:** nada de colores "a mano" en el CSS. Usa siempre `var(--color-...)` de `tokens.css`, así funciona el tema claro.

## Despliegue (Render)

`render.yaml` define la API (Django + PostgreSQL) y el frontend estático. En cada deploy, `backend/build.sh` instala las dependencias y aplica las migraciones.

Para crear el primer admin en producción, abre la **Shell** del servicio `umad-progress-api` y ejecuta:

```bash
cd backend
python manage.py create_admin tu-correo@umad.edu.mx --password "UnaClaveSegura" --name "Tu Nombre"
```

## Reparto de tareas (4. Frontend)

| # | Tarea | Responsable |
|---|-------|-------------|
| 4.1 | Design System & Contexts | Pablo Farid Montoro |
| 4.2 | Vistas Auth | Zahid Serna |
| 4.3 | Dashboard & Lista Tareas | Moisés Medina |
| 4.4 | Modal Crear/Editar Tarea | Moisés Medina |
| 4.5 | Widget Avatar Interactivo | Zahid Serna |
| 4.6 | Módulo Pomodoro Timer | Moisés Medina |
| 4.7 | Vistas Calendario, Amigos, Perfil | Pablo Farid Montoro |
