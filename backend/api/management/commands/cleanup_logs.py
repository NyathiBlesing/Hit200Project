from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import AuditLog
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Cleans up old audit logs based on age'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=90,
            help='Delete logs older than specified number of days'
        )
        parser.add_argument(
            '--action-type',
            type=str,
            help='Delete logs of specific action type (e.g., LOGIN, UPDATE)'
        )
        parser.add_argument(
            '--resource-type',
            type=str,
            help='Delete logs of specific resource type (e.g., DEVICE, USER)'
        )

    def handle(self, *args, **options):
        days = options['days']
        action_type = options.get('action_type')
        resource_type = options.get('resource_type')
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Start with logs older than the cutoff date
        logs_to_delete = AuditLog.objects.filter(timestamp__lt=cutoff_date)
        
        # Apply additional filters if provided
        if action_type:
            logs_to_delete = logs_to_delete.filter(action=action_type.upper())
        if resource_type:
            logs_to_delete = logs_to_delete.filter(resource_type=resource_type.upper())
        
        # Get count before deletion
        count = logs_to_delete.count()
        
        # Delete the logs
        logs_to_delete.delete()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully deleted {count} logs older than {days} days'
                + (f' with action type {action_type}' if action_type else '')
                + (f' and resource type {resource_type}' if resource_type else '')
            )
        )
