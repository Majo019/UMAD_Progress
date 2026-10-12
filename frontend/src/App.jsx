import React, { useState } from 'react'
import {
  Timer,
  CheckCircle2,
  Settings,
  User,
  Heart,
  Utensils,
  PawPrint,
  Home,
  Calendar,
  Users,
  Smile,
  Check
} from 'lucide-react'

export default function App() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Leer 30 páginas de libro de UX',
      completed: false,
      badges: [
        { type: 'red', text: '+5 Vida', icon: 'heart' },
        { type: 'yellow', text: '+5 Alim', icon: 'utensils' }
      ]
    },
    {
      id: 2,
      title: 'Auditoría de Design System',
      completed: false,
      badges: [
        { type: 'blue', text: '+10 Cariño', icon: 'smile' }
      ]
    },
    {
      id: 3,
      title: 'Entrenamiento Matutino',
      completed: true,
      badges: [
        { type: 'red', text: '+10 Vida', icon: 'heart' }
      ]
    }
  ])

  const [activeTab, setActiveTab] = useState('home')

  const toggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const renderBadgeIcon = (iconName) => {
    switch (iconName) {
      case 'heart':
        return <Heart size={12} className="badge-svg" />
      case 'utensils':
        return <Utensils size={12} className="badge-svg" />
      case 'smile':
        return <Smile size={12} className="badge-svg" />
      default:
        return null
    }
  }

  return (
    <div className="app-layout">
      <main className="app-container">
        {/* Header */}
        <header className="header">
          <div className="header-brand">
            <div className="logo-box">
              <span className="logo-inner">UP</span>
            </div>
            <span className="brand-title">UMAD Progress</span>
          </div>

          <div className="header-actions">
            <button className="icon-btn" title="Configuración" aria-label="Configuración">
              <Settings size={22} />
            </button>
            <div className="user-avatar" title="Perfil">
              <User size={18} />
            </div>
          </div>
        </header>

        {/* Big Title */}
        <h1 className="main-title">Pendientes</h1>

        {/* Top Action Buttons (Pomodoro & Add Task) */}
        <section className="action-grid" aria-label="Acciones principales">
          <button className="btn-action btn-pomodoro">
            <div className="action-icon-circle">
              <Timer size={36} strokeWidth={2.2} />
            </div>
            <span className="action-label">Iniciar<br />Pomodoro</span>
          </button>

          <button className="btn-action btn-add-task">
            <div className="action-icon-circle">
              <CheckCircle2 size={36} strokeWidth={2.2} />
            </div>
            <span className="action-label">Agregar<br />Tarea</span>
          </button>
        </section>

        {/* Daily Tasks Section */}
        <section className="section-tasks">
          <div className="section-header">
            <h2 className="section-title">Tareas Diarias</h2>
            <button className="section-link">Ver Todo</button>
          </div>

          <div className="tasks-list">
            {tasks.map(task => (
              <div
                key={task.id}
                className={`task-card ${task.completed ? 'task-completed' : ''}`}
                onClick={() => toggleTask(task.id)}
              >
                <button
                  type="button"
                  className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                  aria-label={task.completed ? 'Desmarcar tarea' : 'Completar tarea'}
                >
                  {task.completed && <Check size={16} strokeWidth={3} />}
                </button>

                <div className="task-body">
                  <div className="task-title">{task.title}</div>
                  <div className="badge-container">
                    {task.badges.map((badge, idx) => (
                      <span key={idx} className={`badge badge-${badge.type}`}>
                        {renderBadgeIcon(badge.icon)}
                        <span>{badge.text}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Avatar Status Section */}
        <section className="avatar-section">
          <div className="avatar-header">
            <span className="avatar-label">ESTADO DEL AVATAR</span>
            <PawPrint size={18} className="avatar-paw-icon" />
          </div>

          <div className="avatar-stats">
            {/* Health stat */}
            <div className="stat-row">
              <Heart size={18} className="stat-icon icon-red" fill="currentColor" />
              <div className="stat-bar-track">
                <div className="stat-bar-fill fill-red" style={{ width: '88%' }}></div>
              </div>
              <span className="stat-percentage">88%</span>
            </div>

            {/* Hunger stat */}
            <div className="stat-row">
              <Utensils size={18} className="stat-icon icon-yellow" />
              <div className="stat-bar-track">
                <div className="stat-bar-fill fill-yellow" style={{ width: '65%' }}></div>
              </div>
              <span className="stat-percentage">65%</span>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          <span>Home</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Calendar size={22} />
          <span>Calendar</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          <Users size={22} />
          <span>Friends</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={22} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  )
}
