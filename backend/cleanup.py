import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Issue, Device, Maintenance

def cleanup_old_data():
    """Clean up old data to optimize database size"""
    # Delete resolved issues older than 90 days
    old_issues = Issue.objects.filter(
        status='Resolved',
        resolved_at__lt=timezone.now() - timedelta(days=90)
    )
    old_issues_count = old_issues.count()
    old_issues.delete()
    print(f"Deleted {old_issues_count} old resolved issues")

    # Delete completed maintenance records older than 90 days
    old_maintenance = Maintenance.objects.filter(
        status='Completed',
        completed_at__lt=timezone.now() - timedelta(days=90)
    )
    old_maintenance_count = old_maintenance.count()
    old_maintenance.delete()
    print(f"Deleted {old_maintenance_count} old maintenance records")

    # Optimize SQLite database
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("VACUUM")
        cursor.execute("ANALYZE")
    print("Optimized database")

if __name__ == '__main__':
    cleanup_old_data() 