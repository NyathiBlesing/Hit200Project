from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import AuditLog
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates test audit logs for development'

    def handle(self, *args, **kwargs):
        # Get or create a test user
        test_user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'test@example.com',
                'role': 'Admin',
                'is_staff': True
            }
        )
        if created:
            test_user.set_password('testpass123')
            test_user.save()
            self.stdout.write(self.style.SUCCESS('Created test user'))

        # Create some test audit logs
        actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ASSIGN', 'CLEAR']
        resource_types = ['DEVICE', 'USER', 'ISSUE']
        
        for i in range(20):  # Create 20 test logs
            AuditLog.objects.create(
                user=test_user,
                action=actions[i % len(actions)],
                resource_type=resource_types[i % len(resource_types)],
                resource_id=i + 1,
                description=f'Test audit log {i + 1}',
                timestamp=timezone.now() - timedelta(days=i),
                ip_address='127.0.0.1',
                user_agent='Test Browser'
            )

        self.stdout.write(self.style.SUCCESS('Successfully created test audit logs')) 