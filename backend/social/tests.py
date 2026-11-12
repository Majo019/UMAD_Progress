from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from authentication.models import Role, UserProfile

from .models import Friendship

User = get_user_model()


def make_user(username, name, role=Role.USER, interests=None, career='', active=True):
    user = User.objects.create_user(username=username, email=username, password='Clave123!', is_active=active)
    UserProfile.objects.create(user=user, name=name, role=role, interests=interests or [], career=career)
    return user


class FriendsApiTests(APITestCase):
    def setUp(self):
        self.me = make_user('yo@x.com', 'Yo Mismo', interests=['Lectura', 'Cine'])
        self.ana = make_user('ana@x.com', 'Ana López', interests=['Cine'], career='Diseño')
        self.beto = make_user('beto@x.com', 'Beto Ruiz', interests=['Futbol'])
        self.admin = make_user('jefe@x.com', 'Ana Admin', role=Role.ADMIN)
        self.inactive = make_user('ana.vieja@x.com', 'Ana Inactiva', active=False)
        self.client.force_authenticate(self.me)

    def test_recommendations_exclude_admins_and_inactive_and_rank_common_interests(self):
        res = self.client.get('/api/friends/recommendations/')
        self.assertEqual(res.status_code, 200)
        ids = [u['id'] for u in res.data]
        self.assertEqual(ids, [self.ana.id, self.beto.id])  # Ana comparte "Cine"
        self.assertEqual(res.data[0]['name'], 'Ana López')
        self.assertEqual(res.data[0]['career'], 'Diseño')
        self.assertEqual(res.data[0]['interests'], ['Cine'])

    def test_search_by_name_excludes_admins_and_reports_relationship(self):
        Friendship.objects.create(from_user=self.me, to_user=self.ana)
        res = self.client.get('/api/friends/search/', {'q': 'ana'})
        self.assertEqual(res.status_code, 200)
        self.assertEqual([u['id'] for u in res.data], [self.ana.id])
        row = res.data[0]
        self.assertTrue(row['request_sent'])
        self.assertFalse(row['request_received'])
        self.assertFalse(row['is_friend'])

    def test_search_by_career(self):
        res = self.client.get('/api/friends/search/', {'q': 'diseñ'})
        self.assertEqual([u['id'] for u in res.data], [self.ana.id])

    def test_send_request_by_user_id_and_list_sent(self):
        res = self.client.post('/api/friends/request/', {'user_id': self.beto.id}, format='json')
        self.assertEqual(res.status_code, 201)
        sent = self.client.get('/api/friends/requests/sent/')
        self.assertEqual(sent.status_code, 200)
        self.assertEqual([r['to_user']['id'] for r in sent.data], [self.beto.id])

    def test_cannot_send_request_to_admin(self):
        res = self.client.post('/api/friends/request/', {'user_id': self.admin.id}, format='json')
        self.assertEqual(res.status_code, 404)

    def test_accept_flow_and_remove(self):
        fr = Friendship.objects.create(from_user=self.ana, to_user=self.me)
        received = self.client.get('/api/friends/requests/')
        self.assertEqual([r['from_user']['id'] for r in received.data], [self.ana.id])
        self.assertEqual(self.client.post(f'/api/friends/requests/{fr.id}/accept/').status_code, 200)
        friends = self.client.get('/api/friends/')
        self.assertEqual([u['id'] for u in friends.data], [self.ana.id])
        self.assertEqual(self.client.delete(f'/api/friends/{self.ana.id}/').status_code, 204)
        self.assertEqual(self.client.get('/api/friends/').data, [])

    def test_cancel_sent_request(self):
        fr = Friendship.objects.create(from_user=self.me, to_user=self.beto)
        self.assertEqual(self.client.delete(f'/api/friends/requests/{fr.id}/cancel/').status_code, 204)
        self.assertFalse(Friendship.objects.filter(pk=fr.id).exists())
