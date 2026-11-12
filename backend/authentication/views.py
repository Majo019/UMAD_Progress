from django.contrib.auth import get_user_model
from django.contrib.auth.models import update_last_login
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from gamification.services import get_profile

from .models import UserProfile
from .wheel import DIFFICULTY_POINTS, WHEEL_KEYS, add_points, apply_decay, set_final_wheel, set_initial_wheel
from .serializers import RegisterSerializer, LoginSerializer, UserDetailSerializer

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    POST /api/auth/register/
    Registra una cuenta de usuario con perfil inicial completo y soporte para cualquier dominio de correo.
    """
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    email = data['email'].strip().lower()
    password = data['password']

    if User.objects.filter(email__iexact=email).exists() or User.objects.filter(username__iexact=email).exists():
        return Response(
            {'detail': 'Ya existe una cuenta registrada con este correo electrónico.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Crear usuario de Django
    name = data.get('name', '').strip()
    name_parts = name.split(' ', 1)
    first_name = name_parts[0] if len(name_parts) > 0 else ''
    last_name = name_parts[1] if len(name_parts) > 1 else ''

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=first_name[:150],
        last_name=last_name[:150],
    )

    # Crear perfil extendido del alumno
    UserProfile.objects.create(
        user=user,
        name=name,
        career=data.get('career', ''),
        semester=data.get('semester', 1),
        goals=data.get('goals', ''),
        interests=data.get('interests', []),
    )

    # Inicializar avatar y objetos nivel 1
    try:
        get_profile(user)
    except Exception:
        pass

    # Generar Token de autenticación DRF
    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'token': token.key,
        'user': UserDetailSerializer(user).data,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    POST /api/auth/login/
    Inicia sesión con correo (o username) y contraseña.
    """
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    identifier = serializer.validated_data['email'].strip().lower()
    password = serializer.validated_data['password']

    user = (
        User.objects.filter(email__iexact=identifier).first() or
        User.objects.filter(username__iexact=identifier).first()
    )

    if not user or not user.check_password(password):
        return Response(
            {'detail': 'Correo o contraseña incorrectos.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not user.is_active:
        return Response({'detail': 'Esta cuenta está desactivada.'}, status=status.HTTP_403_FORBIDDEN)

    # Garantizar que el perfil y el avatar existen
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={'name': user.get_full_name() or user.username}
    )
    apply_decay(profile)
    try:
        get_profile(user)
    except Exception:
        pass

    token, _ = Token.objects.get_or_create(user=user)
    update_last_login(None, user)

    return Response({
        'token': token.key,
        'user': UserDetailSerializer(user).data,
    })


@api_view(['GET', 'PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    GET /api/auth/me/
    PATCH /api/auth/me/
    Obtiene o actualiza la información del perfil del usuario autenticado.
    """
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)
    try:
        get_profile(user)
    except Exception:
        pass
    apply_decay(profile)

    if request.method in ('PATCH', 'PUT'):
        data = request.data
        if 'name' in data:
            profile.name = str(data['name']).strip()
            name_parts = profile.name.split(' ', 1)
            user.first_name = name_parts[0][:150]
            user.last_name = name_parts[1][:150] if len(name_parts) > 1 else ''
            user.save()
        if 'career' in data:
            profile.career = str(data['career'])
        if 'semester' in data:
            try:
                profile.semester = int(data['semester'])
            except (ValueError, TypeError):
                pass
        if 'goals' in data:
            profile.goals = str(data['goals'])
        if 'interests' in data and isinstance(data['interests'], list):
            profile.interests = data['interests']
        # La rueda solo se puede fijar una vez, al responder el cuestionario inicial.
        # Después cambia únicamente con tareas completadas y la baja diaria.
        if 'wheel' in data and isinstance(data['wheel'], list) and data.get('wheel_quiz_completed'):
            set_initial_wheel(profile, data['wheel'])
        if 'avatar_look' in data and isinstance(data['avatar_look'], dict):
            # Solo se guardan claves conocidas del personalizador, con valores cortos tipo texto
            allowed = ('skin', 'hair', 'hairStyle', 'outfit', 'accent')
            profile.avatar_look = {
                k: str(v)[:20] for k, v in data['avatar_look'].items() if k in allowed
            }

        profile.save()

    return Response(UserDetailSerializer(user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    POST /api/auth/logout/
    Invalida el token actual del usuario.
    """
    Token.objects.filter(user=request.user).delete()
    return Response({'detail': 'Sesión cerrada exitosamente.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def wheel_award_view(request):
    """
    POST /api/auth/me/wheel/award/  { area, difficulty }
    Suma puntos a un área de la rueda al completar una tarea del calendario
    (tranquila +0.2, media +0.5, dificil +1).
    """
    area = request.data.get('area')
    difficulty = request.data.get('difficulty')
    if area not in WHEEL_KEYS:
        return Response({'detail': 'Área no válida.'}, status=status.HTTP_400_BAD_REQUEST)
    if difficulty not in DIFFICULTY_POINTS:
        return Response({'detail': 'Dificultad no válida.'}, status=status.HTTP_400_BAD_REQUEST)
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    if not profile.wheel_quiz_completed:
        return Response({'detail': 'Primero responde el cuestionario de la rueda.'}, status=status.HTTP_400_BAD_REQUEST)
    add_points(profile, area, difficulty)
    return Response(UserDetailSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def wheel_final_view(request):
    """
    POST /api/auth/me/wheel/final/  { wheel: [{key, value}, ...] }
    Guarda la Rueda de la Vida final (se puede repetir) para compararla con la inicial.
    Si la cuenta no tenía rueda inicial, estas respuestas se guardan como la inicial.
    """
    raw = request.data.get('wheel')
    if not isinstance(raw, list) or not raw:
        return Response({'detail': 'Envía los valores de la rueda.'}, status=status.HTTP_400_BAD_REQUEST)
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    set_final_wheel(profile, raw)
    profile.save()
    return Response(UserDetailSerializer(request.user).data)
