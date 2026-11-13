from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from authentication.models import UserProfile
from gamification.services import get_profile
from .models import Task

User = get_user_model()


class TaskAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='taskuser@gmail.com',
            email='taskuser@gmail.com',
            password='TestPassword123!',
        )
        UserProfile.objects.create(user=self.user, name='Task User')
        get_profile(self.user)
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_create_and_list_tasks(self):
        # Crear tarea
        task_data = {
            'title': 'Estudiar para el examen final',
            'description': 'Repasar capítulos 4 al 8',
            'dueDate': '2026-11-20',
            'difficulty': 'dificil',
            'area': 'trabajo',
        }
        res = self.client.post('/api/tasks/', task_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['title'], 'Estudiar para el examen final')
        self.assertEqual(res.data['difficulty'], 'dificil')
        self.assertFalse(res.data['completed'])
        task_id = res.data['id']

        # Listar tareas
        list_res = self.client.get('/api/tasks/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 1)
        self.assertEqual(list_res.data[0]['id'], task_id)

    def test_complete_and_reopen_task(self):
        task = Task.objects.create(
            user=self.user,
            title='Tarea de prueba',
            difficulty='media',
            area='trabajo',
        )

        # Completar
        res_complete = self.client.post(f'/api/tasks/{task.id}/complete/')
        self.assertEqual(res_complete.status_code, status.HTTP_200_OK)
        self.assertTrue(res_complete.data['completed'])
        self.assertIsNotNone(res_complete.data['completedAt'])

        # Reabrir
        res_reopen = self.client.post(f'/api/tasks/{task.id}/reopen/')
        self.assertEqual(res_reopen.status_code, status.HTTP_200_OK)
        self.assertFalse(res_reopen.data['completed'])
        self.assertIsNone(res_reopen.data['completedAt'])

    def test_task_isolation_between_users(self):
        # Crear otra cuenta
        other_user = User.objects.create_user(
            username='other@gmail.com',
            email='other@gmail.com',
            password='Password123!',
        )
        Task.objects.create(user=other_user, title='Tarea privada de otro usuario')

        # El usuario autenticado no debe ver las tareas del otro
        res = self.client.get('/api/tasks/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)



class TaskRewardTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='r@x.com', email='r@x.com', password='Clave123!')
        UserProfile.objects.create(user=self.user, name='R')
        avatar = get_profile(self.user)
        avatar.vida, avatar.alimento, avatar.carino = 50, 50, 50
        avatar.save()
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=self.user).key}')

    def stats(self):
        a = get_profile(self.user)
        a.refresh_from_db()
        return a.vida, a.alimento, a.carino, a.xp

    def test_completing_task_rewards_all_stats_and_xp_once(self):
        task = Task.objects.create(user=self.user, title='Meditar', area='retrospeccion', difficulty='tranquila')
        res = self.client.post(f'/api/tasks/{task.id}/complete/')
        self.assertTrue(res.data['rewarded'])
        self.assertEqual(self.stats(), (55, 55, 55, 10))

        # Reabrir y volver a completar no vuelve a dar recompensa
        self.client.post(f'/api/tasks/{task.id}/reopen/')
        self.client.post(f'/api/tasks/{task.id}/complete/')
        self.assertEqual(self.stats(), (55, 55, 55, 10))

    def test_completing_via_patch_also_rewards(self):
        task = Task.objects.create(user=self.user, title='Meditar')
        self.client.patch(f'/api/tasks/{task.id}/', {'completed': True}, format='json')
        self.assertEqual(self.stats(), (55, 55, 55, 10))

    def test_each_recurring_occurrence_rewards(self):
        for day in ('2026-11-14', '2026-11-15', '2026-11-16'):
            res = self.client.post('/api/tasks/', {'title': 'Meditar', 'dueDate': day}, format='json')
            self.client.post(f"/api/tasks/{res.data['id']}/complete/")
        self.assertEqual(self.stats(), (65, 65, 65, 30))
