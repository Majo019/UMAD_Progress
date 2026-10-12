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

> Los datos se guardan en `localStorage` mientras no haya backend. Desde **Perfil → Configuración** puedes restablecer los datos de ejemplo.

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
