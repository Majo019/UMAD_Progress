"""
Reglas de la Rueda de la Vida (el servidor es la fuente de verdad).

- El cuestionario inicial fija los valores (0–10) una sola vez.
- Cada día que pasa, todas las áreas bajan WHEEL_DAILY_DECAY (sin bajar de 0).
- Completar una tarea suma puntos al área elegida según su dificultad.
- La rueda final se puede responder varias veces y se compara contra la foto inicial.
"""
from decimal import ROUND_HALF_UP, Decimal

from django.utils import timezone

WHEEL_AREAS = [
    ('amigos', 'Amigos'),
    ('trabajo', 'Trabajo'),
    ('familia', 'Familia'),
    ('deporte', 'Deporte'),
    ('economia', 'Economía'),
    ('retrospeccion', 'Retrospección'),
    ('ocio', 'Ocio'),
    ('alimentacion', 'Alimentación'),
]
WHEEL_KEYS = [key for key, _ in WHEEL_AREAS]

WHEEL_MIN = Decimal('0')
WHEEL_MAX = Decimal('10')
WHEEL_DAILY_DECAY = Decimal('0.2')

DIFFICULTY_POINTS = {
    'tranquila': Decimal('0.2'),
    'media': Decimal('0.5'),
    'dificil': Decimal('1'),
}


def _round(value):
    value = min(WHEEL_MAX, max(WHEEL_MIN, Decimal(value)))
    return float(value.quantize(Decimal('0.1'), rounding=ROUND_HALF_UP))


def _to_decimal(value):
    try:
        return Decimal(str(value))
    except Exception:
        return WHEEL_MIN


def normalize_wheel(raw):
    """Devuelve las 8 áreas en orden, con valores entre 0 y 10 y un decimal."""
    by_key = {}
    if isinstance(raw, list):
        for item in raw:
            if isinstance(item, dict) and item.get('key') in WHEEL_KEYS:
                by_key[item['key']] = item.get('value', 0)
    return [
        {'key': key, 'label': label, 'value': _round(_to_decimal(by_key.get(key, 0)))}
        for key, label in WHEEL_AREAS
    ]


def apply_decay(profile, save=True):
    """Resta WHEEL_DAILY_DECAY por cada día completo transcurrido desde la última vez."""
    if not profile.wheel_quiz_completed:
        return False
    today = timezone.localdate()
    last = profile.wheel_decayed_at
    if last is None:
        profile.wheel_decayed_at = today
        if save:
            profile.save(update_fields=['wheel_decayed_at'])
        return False
    days = (today - last).days
    if days <= 0:
        return False
    loss = WHEEL_DAILY_DECAY * days
    profile.wheel = [
        {**area, 'value': _round(_to_decimal(area['value']) - loss)}
        for area in normalize_wheel(profile.wheel)
    ]
    profile.wheel_decayed_at = today
    if save:
        profile.save(update_fields=['wheel', 'wheel_decayed_at'])
    return True


def add_points(profile, area, difficulty, save=True):
    """Suma los puntos de una tarea completada al área indicada. Devuelve los puntos sumados."""
    points = DIFFICULTY_POINTS.get(difficulty)
    if area not in WHEEL_KEYS or points is None:
        return 0
    apply_decay(profile, save=False)
    profile.wheel = [
        {**item, 'value': _round(_to_decimal(item['value']) + points)} if item['key'] == area else item
        for item in normalize_wheel(profile.wheel)
    ]
    if save:
        profile.save(update_fields=['wheel', 'wheel_decayed_at'])
    return float(points)


def record_snapshot(profile, kind, values, when=None):
    """Guarda una copia de la rueda respondida para el historial del perfil."""
    from .models import WheelSnapshot

    return WheelSnapshot.objects.create(
        user_id=profile.user_id, kind=kind, values=normalize_wheel(values), created_at=when or timezone.now()
    )


def set_initial_wheel(profile, raw):
    """Guarda el resultado del cuestionario inicial. Solo funciona una vez."""
    if profile.wheel_quiz_completed:
        return False
    profile.wheel = normalize_wheel(raw)
    profile.wheel_initial = profile.wheel
    profile.wheel_quiz_completed = True
    profile.wheel_decayed_at = timezone.localdate()
    record_snapshot(profile, 'initial', profile.wheel)
    return True


def set_final_wheel(profile, raw):
    """
    Guarda la Rueda de la Vida final (se puede volver a responder las veces que se quiera).
    La rueda actual pasa a ser la final y la baja diaria vuelve a contar desde hoy.
    Si la cuenta nunca respondió el cuestionario inicial, estas respuestas quedan como su rueda inicial.
    """
    if not profile.wheel_quiz_completed:
        set_initial_wheel(profile, raw)
        return True
    if not profile.wheel_initial:
        # Cuentas anteriores a la foto inicial: la mejor aproximación es la rueda actual
        profile.wheel_initial = normalize_wheel(profile.wheel)
    profile.wheel_final = normalize_wheel(raw)
    profile.wheel = profile.wheel_final
    profile.wheel_final_at = timezone.now()
    profile.wheel_decayed_at = timezone.localdate()
    record_snapshot(profile, 'final', profile.wheel_final, profile.wheel_final_at)
    return True
