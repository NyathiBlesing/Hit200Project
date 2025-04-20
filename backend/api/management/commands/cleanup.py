from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import Issue, Maintenance

class Command(BaseCommand):
    help = 'Clean up old data to optimize database size'

    def handle(self, *args, **options):
        # Delete resolved issues older than 90 days
        old_issues = Issue.objects.filter(
            status='Resolved',
            resolved_at__lt=timezone.now() - timedelta(days=90)
        )
        old_issues_count = old_issues.count()
        old_issues.delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {old_issues_count} old resolved issues"))

        # Delete completed maintenance records older than 90 days
        old_maintenance = Maintenance.objects.filter(
            status='Completed',
            completed_at__lt=timezone.now() - timedelta(days=90)
        )
        old_maintenance_count = old_maintenance.count()
        old_maintenance.delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {old_maintenance_count} old maintenance records"))

        # Optimize MySQL tables
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("OPTIMIZE TABLE api_issue, api_maintenance")
        self.stdout.write(self.style.SUCCESS("Optimized database tables")) 