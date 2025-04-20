# api/management/commands/populate_usernames.py
from django.core.management.base import BaseCommand
from api.models import CustomUser

class Command(BaseCommand):
    help = 'Populate unique usernames for all users'

    def handle(self, *args, **kwargs):
        users = CustomUser.objects.all()
        for user in users:
            if user.username is None:
                user.username = user.email.split('@')[0]  # Example: Use part of email as username
                user.save()
        self.stdout.write(self.style.SUCCESS('Successfully populated usernames'))
