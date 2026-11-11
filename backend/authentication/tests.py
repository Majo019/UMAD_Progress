from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_with_any_email_domain(self):
        # Probar registro con un correo general (no restringido a @umad.edu.mx)
        data = {
            'email': 'estudiante.libre@gmail.com',
            'password': 'Password123!',
            'name': 'Carlos Estudiante',
            'career': 'Ing. Software',
            'semester': 4,
            'goals': 'Ser más productivo',
            'interests': ['Programación', 'Música'],
        }
        response = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'estudiante.libre@gmail.com')
        self.assertEqual(response.data['user']['career'], 'Ing. Software')

        # Verificar que el usuario y avatar se crearon en la BD
        user = User.objects.get(email='estudiante.libre@gmail.com')
        self.assertEqual(user.profile.career, 'Ing. Software')
        self.assertEqual(user.avatar.level, 1)

    def test_register_duplicate_email(self):
        data = {
            'email': 'duplicado@test.com',
            'password': 'Password123!',
        }
        self.client.post('/api/auth/register/', data, format='json')
        res2 = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_successful(self):
        data = {
            'email': 'login.user@umad.edu.mx',
            'password': 'Password123!',
            'name': 'Usuario Login',
        }
        self.client.post('/api/auth/register/', data, format='json')

        login_res = self.client.post('/api/auth/login/', {
            'email': 'login.user@umad.edu.mx',
            'password': 'Password123!',
        }, format='json')

        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn('token', login_res.data)
        self.assertEqual(login_res.data['user']['email'], 'login.user@umad.edu.mx')

    def test_me_endpoint_requires_auth(self):
        # Sin token debe dar 401
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # Con token
        data = {
            'email': 'me.test@outlook.com',
            'password': 'Password123!',
            'name': 'Outlook User',
        }
        reg_res = self.client.post('/api/auth/register/', data, format='json')
        token = reg_res.data['token']

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        me_res = self.client.get('/api/auth/me/')
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data['email'], 'me.test@outlook.com')

