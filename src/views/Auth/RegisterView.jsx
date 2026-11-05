import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { Button, Chip } from '../../components/ui';
import { useAuth } from '../../context';
import { usePersistentState } from '../../hooks/usePersistentState';
import AuthLayout from './AuthLayout';
import AuthField from './components/AuthField';
import PasswordStrength from './components/PasswordStrength';
import {
  validateEmail, validatePassword, validateConfirm, validateTerms,
  validateName, validateCareer, validateSemester, isUmadEmail,
} from './validators';

/** Catálogo base. Ajusta si el área académica comparte la lista oficial. */
const CAREERS = [
  'Ing. Software',
  'Ing. Industrial',
  'Ing. Mecatrónica',
  'Lic. Administración de Empresas',
  'Lic. Mercadotecnia',
  'Lic. Diseño Gráfico',
  'Lic. Comunicación',
  'Lic. Psicología',
  'Lic. Contaduría',
  'Lic. Derecho',
  'Otra',
];

const INTERESTS = [
  'Programación', 'Videojuegos', 'Diseño', 'Lectura', 'Cine',
  'Música', 'Deporte', 'Arte', 'Emprendimiento', 'Idiomas',
];

const SEMESTERS = Array.from({ length: 10 }, (_, i) => i + 1);

const EMPTY_DRAFT = {
  email: '', password: '', confirm: '', accepted: false,
  name: '', career: '', semester: '', goals: '', interests: [],
};

export default function RegisterView() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [draft, setDraft] = usePersistentState('up:registerDraft', EMPTY_DRAFT);
  const [step, setStep] = useState(1);
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const set = (key) => (e) => {
    const value = e?.target
      ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value)
      : e;
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const toggleInterest = (tag) =>
    setDraft((d) => ({
      ...d,
      interests: d.interests.includes(tag)
        ? d.interests.filter((t) => t !== tag)
        : [...d.interests, tag],
    }));

  const step1Errors = useMemo(() => ({
    email: touched.email ? validateEmail(draft.email) : null,
    password: touched.password ? validatePassword(draft.password) : null,
    confirm: touched.confirm ? validateConfirm(draft.password, draft.confirm) : null,
    accepted: touched.accepted ? validateTerms(draft.accepted) : null,
  }), [draft, touched]);

  const step1Valid = !validateEmail(draft.email)
    && !validatePassword(draft.password)
    && !validateConfirm(draft.password, draft.confirm)
    && !validateTerms(draft.accepted);

  const step2Errors = useMemo(() => ({
    name: touched.name ? validateName(draft.name) : null,
    career: touched.career ? validateCareer(draft.career) : null,
    semester: touched.semester ? validateSemester(draft.semester) : null,
  }), [draft, touched]);

  const step2Valid = !validateName(draft.name)
    && !validateCareer(draft.career)
    && !validateSemester(draft.semester);

  const goStep2 = (e) => {
    e.preventDefault();
    setTouched((t) => ({ ...t, email: true, password: true, confirm: true, accepted: true }));
    if (step1Valid) setStep(2);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched((t) => ({ ...t, name: true, career: true, semester: true }));
    if (!step2Valid) return;

    try {
      setSubmitting(true);
      setFormError(null);
      await register({
        email: draft.email.trim(),
        name: draft.name.trim(),
        career: draft.career,
        semester: Number(draft.semester),
        goals: draft.goals.trim(),
        interests: draft.interests,
      });
      setDraft(EMPTY_DRAFT);
      navigate('/', { replace: true });
    } catch (err) {
      setFormError('No pudimos crear tu cuenta. Inténtalo de nuevo en un momento.');
    } finally {
      setSubmitting(false);
    }
  };

  const institutional = isUmadEmail(draft.email);

  return (
    <AuthLayout
      title={step === 1 ? 'Crea tu cuenta' : 'Cuéntanos de ti'}
      subtitle={
        step === 1
          ? 'Tres minutos y estás dentro. Sin complicaciones.'
          : 'Así personalizamos tu experiencia desde el día uno.'
      }
      onBack={step === 2 ? () => setStep(1) : undefined}
      footer={
        step === 1 ? (
          <p className="text-muted">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="auth__link">Inicia sesión</Link>
          </p>
        ) : null
      }
    >
      <div className="auth__stepper" aria-hidden="true">
        <span className={`auth__step ${step === 1 ? 'is-active' : 'is-done'}`}>1</span>
        <span className="auth__step-line" />
        <span className={`auth__step ${step === 2 ? 'is-active' : ''}`}>2</span>
      </div>

      {step === 1 && (
        <form className="stack auth__form-inner" onSubmit={goStep2} noValidate>
          <AuthField
            label="Correo"
            type="email"
            autoComplete="email"
            placeholder="nombre@umad.edu.mx"
            value={draft.email}
            onChange={set('email')}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            error={step1Errors.email}
            hint={!step1Errors.email && institutional ? '✓ Correo institucional UMAD' : undefined}
          />

          <div className="auth__password-block">
            <AuthField
              label="Contraseña"
              type="password"
              autoComplete="new-password"
              placeholder="Crea una contraseña segura"
              value={draft.password}
              onChange={set('password')}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              error={step1Errors.password}
            />
            <PasswordStrength value={draft.password} />
          </div>

          <AuthField
            label="Confirma tu contraseña"
            type="password"
            autoComplete="new-password"
            placeholder="Repite la contraseña"
            value={draft.confirm}
            onChange={set('confirm')}
            onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            error={step1Errors.confirm}
          />

          <label className="auth__check">
            <input
              type="checkbox"
              checked={draft.accepted}
              onChange={set('accepted')}
              onBlur={() => setTouched((t) => ({ ...t, accepted: true }))}
            />
            <span>Acepto los términos y el aviso de privacidad. Cuido mis datos, tú también.</span>
          </label>
          {step1Errors.accepted && (
            <p className="auth-field__error" role="alert">{step1Errors.accepted}</p>
          )}

          <Button type="submit" variant="primary" block icon={ArrowRight}>
            Continuar
          </Button>
        </form>
      )}

      {step === 2 && (
        <form className="stack auth__form-inner" onSubmit={onSubmit} noValidate>
          <AuthField
            label="Nombre completo"
            type="text"
            autoComplete="name"
            placeholder="Ej. Ana López"
            value={draft.name}
            onChange={set('name')}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            error={step2Errors.name}
          />

          <AuthField
            label="Carrera"
            as="select"
            value={draft.career}
            onChange={set('career')}
            onBlur={() => setTouched((t) => ({ ...t, career: true }))}
            error={step2Errors.career}
          >
            <option value="">Selecciona tu carrera</option>
            {CAREERS.map((c) => <option key={c} value={c}>{c}</option>)}
          </AuthField>

          <AuthField
            label="Semestre"
            as="select"
            value={draft.semester}
            onChange={set('semester')}
            onBlur={() => setTouched((t) => ({ ...t, semester: true }))}
            error={step2Errors.semester}
          >
            <option value="">Selecciona tu semestre</option>
            {SEMESTERS.map((n) => <option key={n} value={n}>{n}°</option>)}
          </AuthField>

          <AuthField
            label="Metas personales de bienestar"
            as="textarea"
            rows={3}
            placeholder="Ej. Dormir mejor, organizarme, no dejar las entregas al último…"
            value={draft.goals}
            onChange={set('goals')}
          />

          <div className="auth__chips-block">
            <span className="label-mono">Intereses (elige los que apliquen)</span>
            <div className="auth__chips">
              {INTERESTS.map((tag) => {
                const on = draft.interests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    className="auth__chip-btn"
                    aria-pressed={on}
                  >
                    <Chip color={on ? 'coral' : 'neutral'} icon={on ? Check : undefined}>
                      {tag}
                    </Chip>
                  </button>
                );
              })}
            </div>
          </div>

          {formError && (
            <p className="auth__banner auth__banner--error" role="alert">{formError}</p>
          )}

          <div className="auth__actions">
            <Button type="button" variant="ghost" onClick={() => setStep(1)} icon={ArrowLeft}>
              Atrás
            </Button>
            <Button type="submit" variant="primary" icon={Sparkles} disabled={submitting}>
              {submitting ? 'Creando…' : 'Crear cuenta'}
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}