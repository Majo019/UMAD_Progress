import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection
from django.contrib.auth import get_user_model
from authentication.models import UserProfile
from gamification.models import AvatarProfile, AvatarItem, UserItem
from gamification.services import get_profile, unlock_items
from tasks.models import Task
from pomodoro.models import PomodoroSession
from social.models import CalendarEvent, Friendship

User = get_user_model()


def verify_database():
    print("=" * 60)
    print("🔍 VERIFICACIÓN DE OPERACIÓN DE BASE DE DATOS")
    print("=" * 60)

    # 1. Probar conexión
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1;")
        res = cursor.fetchone()
        print(f"✅ Conexión con base de datos activa: resultado = {res[0]}")

    # 2. Listar tablas creadas
    tables = connection.introspection.table_names()
    print(f"✅ Total de tablas detectadas en la base de datos: {len(tables)}")
    expected_tables = [
        'auth_user',
        'authentication_userprofile',
        'gamification_avatarprofile',
        'gamification_avataritem',
        'gamification_useritem',
        'tasks_task',
        'pomodoro_pomodorosession',
        'social_calendarevent',
        'social_friendship',
        'authtoken_token',
    ]

    for t in expected_tables:
        if t in tables:
            print(f"   [OK] Tabla: {t}")
        else:
            print(f"   [FALTA] Tabla: {t}")

    # 3. Poblar AvatarItems semilla si está vacía
    if AvatarItem.objects.count() == 0:
        print("\n🌱 Inicializando catálogo de ítems del avatar (AvatarItem)...")
        seed_items = [
            {'name': 'Gorra Clásica', 'slot': 'head', 'required_level': 1, 'image': '🧢'},
            {'name': 'Audífonos Gamer', 'slot': 'head', 'required_level': 2, 'image': '🎧'},
            {'name': 'Corona de Laurel', 'slot': 'head', 'required_level': 5, 'image': '👑'},
            {'name': 'Sudadera Novato', 'slot': 'body', 'required_level': 1, 'image': '👕'},
            {'name': 'Chaqueta Universitaria', 'slot': 'body', 'required_level': 3, 'image': '🧥'},
            {'name': 'Capa de Campeón', 'slot': 'body', 'required_level': 7, 'image': '🦸'},
            {'name': 'Mochila de Estudio', 'slot': 'accessory', 'required_level': 1, 'image': '🎒'},
            {'name': 'Gafas de Lectura', 'slot': 'accessory', 'required_level': 2, 'image': '👓'},
            {'name': 'Medalla de Honor', 'slot': 'accessory', 'required_level': 4, 'image': '🏅'},
        ]
        for it in seed_items:
            AvatarItem.objects.create(**it)
        print(f"   Se crearon {len(seed_items)} ítems iniciales para el avatar.")
    else:
        print(f"✅ Catálogo de AvatarItem cuenta con {AvatarItem.objects.count()} ítems.")

    # 4. Probar CRUD en base de datos real
    print("\n🧪 Ejecutando prueba de ciclo de vida CRUD...")
    test_email = "db_test_runner@umad.edu.mx"

    # Limpiar si ya existía de pruebas previas
    User.objects.filter(email=test_email).delete()

    # Create
    user = User.objects.create_user(
        username=test_email,
        email=test_email,
        password="TestPassword123!",
        first_name="Verificador",
    )
    profile = UserProfile.objects.create(
        user=user,
        name="Verificador BD",
        career="Ing. Software",
        semester=6,
        goals="Validar salud de BD",
        interests=["Pruebas", "SQL"],
    )
    avatar = get_profile(user)
    task = Task.objects.create(
        user=user,
        title="Validar base de datos",
        priority="alta",
        area="trabajo",
    )

    print(f"   [CREATE OK] Usuario ID {user.id}, Perfil '{profile.name}', Avatar nivel {avatar.level}, Tarea '{task.title}'")

    # Read
    fetched_user = User.objects.get(id=user.id)
    fetched_task = Task.objects.get(id=task.id)
    assert fetched_user.profile.career == "Ing. Software"
    assert fetched_task.completed is False
    print("   [READ OK] Registros consultados y validados correctamente.")

    # Update
    fetched_task.completed = True
    fetched_task.save()
    assert Task.objects.get(id=task.id).completed is True
    print("   [UPDATE OK] Actualización de tarea persistida correctamente.")

    # Delete
    user_id = user.id
    user.delete()
    assert User.objects.filter(id=user_id).exists() is False
    assert Task.objects.filter(id=task.id).exists() is False  # Cascada
    print("   [DELETE OK] Eliminación y borrado en cascada confirmados.")

    print("\n" + "=" * 60)
    print("🎉 LA BASE DE DATOS ESTÁ 100% OPERATIVA Y FUNCIONANDO CORRECTAMENTE")
    print("=" * 60)


if __name__ == '__main__':
    verify_database()

