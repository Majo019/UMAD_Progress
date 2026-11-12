from django.contrib.auth import get_user_model
from django.core.management import call_command
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from authentication.models import AdminProfile, Role, UserProfile
from authentication.roles import set_role
from tasks.models import Task

User = get_user_model()


class AdminApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin@x.com', email='admin@x.com', password='pass1234')
        UserProfile.objects.create(user=self.admin, name='Admin')
        set_role(self.admin, Role.ADMIN)

        self.student = User.objects.create_user(username='alu@x.com', email='alu@x.com', password='pass1234')
        UserProfile.objects.create(user=self.student, name='Alumno')
        Task.objects.create(user=self.student, title='Tarea 1', completed=True)
        Task.objects.create(user=self.student, title='Tarea 2')

    def auth(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_register_creates_user_role(self):
        res = self.client.post('/api/auth/register/', {'email': 'new@x.com', 'password': 'abcd1234', 'role': 'admin'}, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['user']['role'], 'user')

    def test_login_returns_role(self):
        res = self.client.post('/api/auth/login/', {'email': 'admin@x.com', 'password': 'pass1234'}, format='json')
        self.assertEqual(res.data['user']['role'], 'admin')

    def test_student_cannot_access_admin_api(self):
        self.auth(self.student)
        for url in ['/api/admin/stats/', '/api/admin/users/', '/api/admin/tasks/', '/api/admin/profile/']:
            self.assertEqual(self.client.get(url).status_code, 403, url)

    def test_anonymous_rejected(self):
        self.assertIn(self.client.get('/api/admin/stats/').status_code, (401, 403))

    def test_stats(self):
        self.auth(self.admin)
        res = self.client.get('/api/admin/stats/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['users']['total'], 1)
        self.assertEqual(res.data['users']['admins'], 1)
        self.assertEqual(res.data['tasks']['completion_rate'], 50.0)
        self.assertEqual(len(res.data['signups_last_7_days']), 7)

    def test_users_list_filters(self):
        self.auth(self.admin)
        res = self.client.get('/api/admin/users/?role=user')
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['tasks_completed'], 1)
        res = self.client.get('/api/admin/users/?search=admin')
        self.assertEqual([u['email'] for u in res.data['results']], ['admin@x.com'])

    def test_promote_and_deactivate(self):
        self.auth(self.admin)
        res = self.client.patch(f'/api/admin/users/{self.student.id}/', {'role': 'admin'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['role'], 'admin')
        self.assertTrue(AdminProfile.objects.filter(user=self.student).exists())

        res = self.client.patch(f'/api/admin/users/{self.student.id}/', {'role': 'user', 'is_active': False}, format='json')
        self.assertEqual(res.data['role'], 'user')
        self.assertFalse(res.data['is_active'])
        self.student.refresh_from_db()
        self.assertFalse(self.student.is_staff)

    def test_admin_cannot_demote_or_delete_self(self):
        self.auth(self.admin)
        res = self.client.patch(f'/api/admin/users/{self.admin.id}/', {'role': 'user'}, format='json')
        self.assertEqual(res.status_code, 400)
        res = self.client.delete(f'/api/admin/users/{self.admin.id}/')
        self.assertEqual(res.status_code, 400)

    def test_delete_user(self):
        self.auth(self.admin)
        res = self.client.delete(f'/api/admin/users/{self.student.id}/')
        self.assertEqual(res.status_code, 204)
        self.assertFalse(User.objects.filter(pk=self.student.id).exists())

    def test_admin_profile_update(self):
        self.auth(self.admin)
        res = self.client.patch('/api/admin/profile/', {'position': 'Coordinador', 'department': 'TI'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['position'], 'Coordinador')
        self.assertEqual(res.data['email'], 'admin@x.com')

    def test_tasks_list(self):
        self.auth(self.admin)
        res = self.client.get('/api/admin/tasks/?status=pending')
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['user_email'], 'alu@x.com')

    def test_create_admin_command(self):
        call_command('create_admin', 'boss@x.com', password='secret123', name='Jefa Uno')
        boss = User.objects.get(email='boss@x.com')
        self.assertEqual(boss.profile.role, Role.ADMIN)
        self.assertEqual(boss.admin_profile.display_name, 'Jefa Uno')


class SeedUsersCommandTests(APITestCase):
    def test_seed_creates_only_the_admin_and_is_idempotent(self):
        call_command('seed_users')
        call_command('seed_users')
        admin = User.objects.get(email='admin@umad.edu.mx')
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(admin.profile.role, Role.ADMIN)
        self.assertTrue(AdminProfile.objects.filter(user=admin).exists())
