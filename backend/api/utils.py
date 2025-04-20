#logs
from .models import AuditLog
import json
from django.db import transaction
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.urls import reverse
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

def log_action(user, action, resource_type, resource_id=None, resource_name=None, description=None, changes=None, status='SUCCESS', error_message=None):
    """
    Create an audit log entry with enhanced details.
    
    Args:
        user: The user performing the action
        action: The action being performed (CREATE, UPDATE, DELETE, etc.)
        resource_type: The type of resource being acted upon (USER, DEVICE, ISSUE)
        resource_id: Optional ID of the resource
        resource_name: Optional name of the resource for better readability
        description: Optional description of the action
        changes: Optional JSON object containing the changes made
        status: Status of the action (SUCCESS/FAILURE)
        error_message: Optional error message if the action failed
    """
    try:
        with transaction.atomic():
            log = AuditLog.objects.create(
                user=user,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                resource_name=resource_name,
                description=description,
                changes=changes,
                status=status,
                error_message=error_message,
                timestamp=timezone.now()
            )
            return log
    except Exception as e:
        print(f"Error creating audit log: {str(e)}")
        return None

def create_audit_log(request, action, resource_type, resource_id=None, resource_name=None, description=None, changes=None, status='SUCCESS', error_message=None):
    """
    Create an audit log entry with request context.
    
    Args:
        request: The HTTP request object
        action: The action being performed (CREATE, UPDATE, DELETE, etc.)
        resource_type: The type of resource being acted upon (USER, DEVICE, ISSUE)
        resource_id: Optional ID of the resource
        resource_name: Optional name of the resource for better readability
        description: Optional description of the action
        changes: Optional JSON object containing the changes made
        status: Status of the action (SUCCESS/FAILURE)
        error_message: Optional error message if the action failed
    """
    try:
        with transaction.atomic():
            log = AuditLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                resource_name=resource_name,
                description=description,
                changes=changes,
                status=status,
                error_message=error_message,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                timestamp=timezone.now()
            )
            return log
    except Exception as e:
        print(f"Error creating audit log: {str(e)}")
        return None

def send_account_setup_email(user, domain):
    """
    Send account setup email to newly created employee.
    
    Args:
        user: The user object
        domain: The domain name for the frontend application
    """
    try:
        # Generate the setup token
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Create the setup URL
        setup_url = f"{domain}/account-setup/{uid}"
        
        # Prepare email content
        context = {
            'user': user,
            'setup_url': setup_url,
        }
        html_message = render_to_string('account_setup_email.html', context)
        plain_message = strip_tags(html_message)
        
        # Send email
        send_mail(
            subject='Complete Your Account Setup - DMTS',
            message=plain_message,
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending account setup email: {str(e)}")
        return False

def log_model_changes(instance, action, user, request=None):
    """
    Log changes made to a model instance.
    
    Args:
        instance: The model instance being changed
        action: The action being performed (CREATE, UPDATE, DELETE)
        user: The user performing the action
        request: Optional HTTP request object
    """
    try:
        changes = None
        if action in ['UPDATE', 'DELETE']:
            # Get the original instance from the database
            original = instance.__class__.objects.get(pk=instance.pk)
            changes = {
                'old': {
                    field.name: getattr(original, field.name)
                    for field in instance._meta.fields
                },
                'new': {
                    field.name: getattr(instance, field.name)
                    for field in instance._meta.fields
                }
            }

        log_data = {
            'user': user,
            'action': action,
            'resource_type': instance._meta.model_name.upper(),
            'resource_id': instance.pk,
            'resource_name': str(instance),
            'description': f"{action} {instance._meta.model_name} {instance.pk}",
            'changes': changes,
            'status': 'SUCCESS'
        }

        if request:
            log_data.update({
                'ip_address': request.META.get('REMOTE_ADDR'),
                'user_agent': request.META.get('HTTP_USER_AGENT', '')
            })

        return log_action(**log_data)
    except Exception as e:
        print(f"Error logging model changes: {str(e)}")
        return None
