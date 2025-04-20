from django.core.management.base import BaseCommand
from api.models import AuditLog

class Command(BaseCommand):
    help = 'Clears all test audit logs from the database'

    def handle(self, *args, **kwargs):
        AuditLog.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('Successfully cleared all audit logs')) 