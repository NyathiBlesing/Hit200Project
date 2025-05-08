from django.db import models
from django.utils import timezone

# Create your models here.

#Devices
from django.db import models
from django.conf import settings  

class Device(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
        ('Maintenance', 'Maintenance'),
        ('Cleared', 'Cleared'),
        ('Flagged', 'Flagged'),
    ]

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    serial_number = models.CharField(max_length=50, unique=True)
    type = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    location = models.CharField(max_length=100)
    picture = models.ImageField(upload_to='user_picture/', blank=True, null=True)
    assigned_to = models.ForeignKey('CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_devices')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    cleared_at = models.DateTimeField(null=True, blank=True)
    cleared_by = models.ForeignKey('CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='cleared_devices')
    clearance_reason = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.serial_number})"

    def clear_device(self, cleared_by, reason):
        """Clear a device from the system"""
        # Store the previous assigned user before clearing
        previous_user = self.assigned_to
        
        # Update device status
        self.status = 'Cleared'
        self.cleared_at = timezone.now()
        self.cleared_by = cleared_by
        self.clearance_reason = reason
        self.assigned_to = None
        self.save()

        # Create notification for IT admins
        it_admins = CustomUser.objects.filter(is_staff=True)
        for admin in it_admins:
            if admin != cleared_by:  # Don't notify the admin who cleared the device
                Notification.objects.create(
                    recipient=admin,
                    type='DEVICE_CLEARANCE',
                    title='Device Cleared',
                    message=f'Device {self.name} ({self.serial_number}) has been cleared by {cleared_by.username}.',
                    related_device=self,
                    link=f'/admin/devices/{self.id}'
                )

        # Create notification for the previously assigned user
        if previous_user:
            Notification.objects.create(
                recipient=previous_user,
                type='DEVICE_CLEARANCE',
                title='Device Cleared',
                message=f'The device {self.name} ({self.serial_number}) assigned to you has been cleared by Operations.',
                related_device=self,
                link=f'/devices/{self.id}'
            )

#Issues
from django.db import models
from django.conf import settings
from .models import Device

class Issue(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="issues")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField()
    priority = models.CharField(
        max_length=20,
        choices=[
            ('Low', 'Low'),
            ('Medium', 'Medium'),
            ('High', 'High'),
            ('Critical', 'Critical'),
        ],
        default='Medium'
    )
    status = models.CharField(
        max_length=50,
        choices=[
            ('Pending', 'Pending'),
            ('In Progress', 'In Progress'),
            ('Resolved', 'Resolved'),
            ('Closed', 'Closed'),
        ],
        default='Pending'
    )
    response = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_issues'
    )

    def __str__(self):
        return f"Issue for {self.device.name} - {self.status}"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        old_status = None if is_new else Issue.objects.get(pk=self.pk).status
        
        if self.status == 'Resolved' and not self.resolved_at:
            self.resolved_at = timezone.now()
        
        super().save(*args, **kwargs)

        # Create notifications for status changes
        if not is_new and old_status != self.status:
            # Notify the user who reported the issue
            if self.user:
                Notification.objects.create(
                    recipient=self.user,
                    type='ISSUE_UPDATE',
                    title=f'Issue Status Updated',
                    message=f'Your reported issue for device {self.device.name} has been updated to {self.status}.',
                    admin_response=self.response,
                    related_device=self.device,
                    link=f'/issues/{self.id}'
                )
            
            # If assigned to someone, notify them as well
            if self.assigned_to and self.assigned_to != self.user:
                Notification.objects.create(
                    recipient=self.assigned_to,
                    type='ISSUE_UPDATE',
                    title=f'Issue Status Updated',
                    message=f'An issue you are assigned to for device {self.device.name} has been updated to {self.status}.',
                    admin_response=self.response,
                    related_device=self.device,
                    link=f'/issues/{self.id}'
                )


#Users
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        if not username:
            raise ValueError('The Username field must be set')

        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)

        if password:
            user.set_password(password)  # Hashes the password before saving

        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(email, username, password, **extra_fields)

    def get_by_natural_key(self, username):
        return self.get(**{self.model.USERNAME_FIELD: username})


class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True, default=None)
    department = models.CharField(max_length=100, null=True, blank=True)
    role = models.CharField(
        max_length=15,
        choices=[
            ('Admin', 'Admin'),
            ('Employee', 'Employee'),
            ('Operations', 'Operations')
        ],
        default='Employee'
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    must_change_password = models.BooleanField(default=True)
    last_password_change = models.DateTimeField(null=True, blank=True)
    
    USERNAME_FIELD = 'username'
    objects = CustomUserManager()

    def save(self, *args, **kwargs):
        # If this is a new user being created
        if not self.pk:
            # Set must_change_password to True for new users
            self.must_change_password = True
            # Set a default auto-generated password
            self.set_password(f"auto_{self.username}")
        
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username

#Maintenance
from django.db import models
from .models import Device  

class Maintenance(models.Model):
    MAINTENANCE_STATUS = [
        ('Scheduled', 'Scheduled'),
        ('Completed', 'Completed'),
    ]

    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="maintenances")
    maintenance_date = models.DateField()
    status = models.CharField(max_length=20, choices=MAINTENANCE_STATUS, default='Scheduled')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.device} - {self.maintenance_date}"

    def save(self, *args, **kwargs):
        # Only update updated_at if status is 'Completed'
        if self.status == 'Completed':
            self.updated_at = timezone.now()
        super().save(*args, **kwargs)
        # All notification logic referencing removed fields has been deleted.

#Logs
from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    ACTION_TYPES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('ASSIGN', 'Assign'),
        ('CLEAR', 'Clear'),
        ('RESOLVE', 'Resolve'),
        ('MAINTENANCE', 'Maintenance'),
        ('ISSUE', 'Issue'),
    ]

    RESOURCE_TYPES = [
        ('DEVICE', 'Device'),
        ('USER', 'User'),
        ('ISSUE', 'Issue'),
        ('MAINTENANCE', 'Maintenance'),
        ('CLEARANCE', 'Clearance'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES)
    resource_id = models.IntegerField(null=True, blank=True)
    resource_name = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    changes = models.JSONField(null=True, blank=True)
    status = models.CharField(max_length=20, default='SUCCESS')
    error_message = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['action']),
            models.Index(fields=['resource_type']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.user.username if self.user else 'System'} - {self.action} {self.resource_type} at {self.timestamp}"

#Clearance
class ClearanceLog(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="clearance_logs")
    cleared_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    date_cleared = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[('Success', 'Success'), ('Failed', 'Failed')], default='Success')

    def __str__(self):
        return f"Clearance for {self.device.name} by {self.cleared_by}"


#Notifications
class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('DEVICE_CLEARANCE', 'Device Clearance'),
        ('ISSUE_UPDATE', 'Issue Update'),
        ('MAINTENANCE_UPDATE', 'Maintenance Update'),
        ('DEVICE_ASSIGNMENT', 'Device Assignment'),
    ]

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    admin_response = models.TextField(null=True, blank=True)
    related_device = models.ForeignKey(Device, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient']),
            models.Index(fields=['type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.type} notification for {self.recipient.username}"
