/** Validadores para el módulo Auth. Puros, sin dependencias. */

export const UMAD_DOMAIN = '@umad.edu.mx';

export function isUmadEmail(email) {
  return typeof email === 'string' && email.trim().toLowerCase().endsWith(UMAD_DOMAIN);
}

export function validateEmail(email) {
  if (!email || !email.trim()) return 'El correo es obligatorio';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(email.trim())) return 'Escribe un correo válido (ej. nombre@umad.edu.mx)';
  return null;
}

/** Devuelve { score: 0..4, label, hints[], isStrong } */
export function evaluatePassword(pwd = '') {
  const hints = [];
  let score = 0;

  if (pwd.length >= 8) score++; else hints.push('Al menos 8 caracteres');
  if (/[A-ZÁÉÍÓÚÑ]/.test(pwd)) score++; else hints.push('Una mayúscula');
  if (/\d/.test(pwd)) score++; else hints.push('Un número');
  if (/[^A-Za-z0-9]/.test(pwd)) score++; else hints.push('Un símbolo (!@#…)');

  const labels = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente'];
  return {
    score,
    label: labels[score] ?? 'Muy débil',
    hints,
    isStrong: score >= 3,
  };
}

export function validatePassword(pwd) {
  if (!pwd) return 'La contraseña es obligatoria';
  const { isStrong, hints } = evaluatePassword(pwd);
  if (!isStrong) return `Falta: ${hints.join(', ')}`;
  return null;
}

export function validateConfirm(pwd, confirm) {
  if (!confirm) return 'Confirma tu contraseña';
  if (pwd !== confirm) return 'Las contraseñas no coinciden';
  return null;
}

export function validateName(name) {
  if (!name || !name.trim()) return 'Escribe tu nombre';
  if (name.trim().length < 2) return 'Nombre demasiado corto';
  return null;
}

export function validateCareer(career) {
  if (!career) return 'Selecciona tu carrera';
  return null;
}

export function validateSemester(semester) {
  const n = Number(semester);
  if (!n) return 'Selecciona tu semestre';
  if (n < 1 || n > 10) return 'Semestre fuera de rango';
  return null;
}

export function validateTerms(accepted) {
  if (!accepted) return 'Debes aceptar los términos para continuar';
  return null;
}