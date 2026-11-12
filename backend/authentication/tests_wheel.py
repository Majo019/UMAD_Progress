from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from tasks.models import Task

from .models import UserProfile
from .wheel import WHEEL_KEYS

User = get_user_model()


def values(data):
    return {a['key']: a['value'] for a in data['wheel']}


class WheelRulesTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='w@x.com', email='w@x.com', password='Clave123!')
        self.profile = UserProfile.objects.create(user=self.user, name='W')
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def answer_quiz(self, value=5):
        wheel = [{'key': k, 'value': value} for k in WHEEL_KEYS]
        return self.client.patch('/api/auth/me/', {'wheel': wheel, 'wheel_quiz_completed': True}, format='json')

    def test_quiz_can_only_be_answered_once(self):
        res = self.answer_quiz(5)
        self.assertTrue(res.data['wheel_quiz_completed'])
        self.assertEqual(values(res.data)['ocio'], 5)

        res = self.answer_quiz(9)
        self.assertEqual(values(res.data)['ocio'], 5)
        res = self.client.patch('/api/auth/me/', {'wheel_quiz_completed': False}, format='json')
        self.assertTrue(res.data['wheel_quiz_completed'])

    def test_daily_decay(self):
        self.answer_quiz(5)
        self.profile.refresh_from_db()
        self.profile.wheel_decayed_at = timezone.localdate() - timedelta(days=3)
        self.profile.save()
        data = self.client.get('/api/auth/me/').data
        self.assertEqual(values(data)['familia'], 4.4)
        # Volver a consultar el mismo día no resta otra vez
        self.assertEqual(values(self.client.get('/api/auth/me/').data)['familia'], 4.4)

    def test_decay_never_goes_below_zero(self):
        self.answer_quiz(1)
        self.profile.refresh_from_db()
        self.profile.wheel_decayed_at = timezone.localdate() - timedelta(days=30)
        self.profile.save()
        self.assertEqual(values(self.client.get('/api/auth/me/').data)['familia'], 0)

    def test_completing_task_adds_points_by_difficulty_once(self):
        self.answer_quiz(5)
        expected = {'tranquila': 5.2, 'media': 5.7, 'dificil': 6.7}
        for difficulty, total in expected.items():
            task = Task.objects.create(user=self.user, title=difficulty, area='deporte', difficulty=difficulty)
            self.client.post(f'/api/tasks/{task.id}/complete/')
            self.assertEqual(values(self.client.get('/api/auth/me/').data)['deporte'], total)

        # Reabrir y completar de nuevo no vuelve a sumar
        self.client.post(f'/api/tasks/{task.id}/reopen/')
        self.client.post(f'/api/tasks/{task.id}/complete/')
        self.assertEqual(values(self.client.get('/api/auth/me/').data)['deporte'], 6.7)

    def test_points_cap_at_ten(self):
        self.answer_quiz(10)
        task = Task.objects.create(user=self.user, title='x', area='ocio', difficulty='dificil')
        self.client.post(f'/api/tasks/{task.id}/complete/')
        self.assertEqual(values(self.client.get('/api/auth/me/').data)['ocio'], 10)

    def test_award_endpoint_for_calendar_tasks(self):
        res = self.client.post('/api/auth/me/wheel/award/', {'area': 'ocio', 'difficulty': 'media'}, format='json')
        self.assertEqual(res.status_code, 400)  # aún no responde el cuestionario
        self.answer_quiz(5)
        res = self.client.post('/api/auth/me/wheel/award/', {'area': 'ocio', 'difficulty': 'media'}, format='json')
        self.assertEqual(values(res.data)['ocio'], 5.5)
        res = self.client.post('/api/auth/me/wheel/award/', {'area': 'nada', 'difficulty': 'media'}, format='json')
        self.assertEqual(res.status_code, 400)


class FinalWheelTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='f@x.com', email='f@x.com', password='Clave123!')
        self.profile = UserProfile.objects.create(user=self.user, name='F')
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def wheel(self, value):
        return [{'key': k, 'value': value} for k in WHEEL_KEYS]

    def test_final_requires_initial_quiz(self):
        res = self.client.post('/api/auth/me/wheel/final/', {'wheel': self.wheel(7)}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_initial_snapshot_is_kept_and_final_can_be_redone(self):
        self.client.patch('/api/auth/me/', {'wheel': self.wheel(4), 'wheel_quiz_completed': True}, format='json')
        # La rueda actual cambia con la baja diaria, pero la foto inicial no
        self.profile.refresh_from_db()
        self.profile.wheel_decayed_at = timezone.localdate() - timedelta(days=5)
        self.profile.save()

        res = self.client.post('/api/auth/me/wheel/final/', {'wheel': self.wheel(7)}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual({a['value'] for a in res.data['wheel_initial']}, {4})
        self.assertEqual({a['value'] for a in res.data['wheel_final']}, {7})
        self.assertEqual(values(res.data)['ocio'], 7)
        self.assertIsNotNone(res.data['wheel_final_at'])

        res = self.client.post('/api/auth/me/wheel/final/', {'wheel': self.wheel(9)}, format='json')
        self.assertEqual({a['value'] for a in res.data['wheel_final']}, {9})
        self.assertEqual({a['value'] for a in res.data['wheel_initial']}, {4})

    def test_rejects_empty_payload(self):
        self.client.patch('/api/auth/me/', {'wheel': self.wheel(4), 'wheel_quiz_completed': True}, format='json')
        res = self.client.post('/api/auth/me/wheel/final/', {}, format='json')
        self.assertEqual(res.status_code, 400)
