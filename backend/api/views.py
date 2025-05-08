from django.shortcuts import render

# Create your views here.

#Devices
import logging
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from django.contrib.auth import get_user_model, authenticate
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, action
from .models import Device, CustomUser, AuditLog, Notification
from .serializers import DeviceSerializer, AuditLogSerializer, NotificationSerializer, CustomUserSerializer, ClearanceSerializer
from .utils import create_audit_log
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth.hashers import make_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings


class DeviceBySerialView(APIView):
    def get(self, request, serial_number):
        try:
            device = Device.objects.get(serial_number=serial_number)
            serializer = DeviceSerializer(device)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Device.DoesNotExist:
            return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, serial_number):
        try:
            # Get the existing device by serial_number
            device = Device.objects.get(serial_number=serial_number)

            # Make a copy of the request data
            updated_data = request.data.copy()

            # Ensure the serial_number is not changed unless explicitly provided
            updated_data['serial_number'] = device.serial_number

            # Use the partial update option to allow for partial fields update
            serializer = DeviceSerializer(device, data=updated_data, partial=True)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            # Return validation errors if any
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Device.DoesNotExist:
            return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, serial_number):
        try:
            device = Device.objects.get(serial_number=serial_number)
            device.delete()
            return Response({'message': 'Device deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Device.DoesNotExist:
            return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)


User = get_user_model()
logger = logging.getLogger(__name__)

class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.select_related('assigned_to', 'cleared_by').all()
    serializer_class = DeviceSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'serial_number'

    def get_queryset(self):
        queryset = Device.objects.select_related('assigned_to').all()
        # Only exclude cleared devices for list actions unless include_cleared is set
        if getattr(self, 'action', None) == 'list' and not self.request.query_params.get('include_cleared', False):
            queryset = queryset.exclude(status='Cleared')
        return queryset

    def create(self, request, *args, **kwargs):
        try:
            if Device.objects.filter(serial_number=request.data.get('serial_number')).exists():
                return Response({'error': 'A device with this serial number already exists.'}, status=status.HTTP_400_BAD_REQUEST)

            data = request.data.copy()
            # Handle assigned_to_id
            assigned_to_id = data.get('assigned_to_id')
            if assigned_to_id:
                try:
                    user = CustomUser.objects.get(id=assigned_to_id)
                    data['assigned_to'] = user.id
                except CustomUser.DoesNotExist:
                    return Response({'error': 'User does not exist.'}, status=status.HTTP_400_BAD_REQUEST)
            elif assigned_to_id is None:
                data['assigned_to'] = None

            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)

            # Refresh the serializer to include the assigned_to data
            instance = serializer.instance
            serializer = self.get_serializer(instance)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            logger.error(f"Validation error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return Response({'error': 'An unexpected error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def clear_device(self, request, serial_number=None):
        device = self.get_object()
        serializer = ClearanceSerializer(data=request.data)
        if serializer.is_valid():
            device.clear_device(request.user, serializer.validated_data.get('clearance_reason', ''))
            create_audit_log(
                request=self.request,
                action='CLEAR',
                resource_type='DEVICE',
                resource_id=device.id,
                description=f'Cleared device {device.name} (SN: {device.serial_number})'
            )
            return Response({'status': 'Device cleared successfully'})
        return Response(serializer.errors, status=400)

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            data = request.data.copy()
            
            # Handle assigned_to_id
            assigned_to_id = data.get('assigned_to_id')
            if assigned_to_id is not None:
                try:
                    user = CustomUser.objects.get(id=assigned_to_id)
                    data['assigned_to'] = user.id
                except CustomUser.DoesNotExist:
                    return Response({'error': 'User does not exist.'}, status=status.HTTP_400_BAD_REQUEST)
            elif assigned_to_id is None:
                data['assigned_to'] = None

            serializer = self.get_serializer(instance, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)

            # Refresh the serializer to include the assigned_to data
            instance = serializer.instance
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Update error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        device = serializer.save()
        create_audit_log(
            request=self.request,
            action='CREATE',
            resource_type='DEVICE',
            resource_id=device.id,
            description=f'Created device {device.name} (SN: {device.serial_number})'
        )

    def perform_update(self, serializer):
        device = serializer.save()
        create_audit_log(
            request=self.request,
            action='UPDATE',
            resource_type='DEVICE',
            resource_id=device.id,
            description=f'Updated device {device.name} (SN: {device.serial_number})'
        )

    def perform_destroy(self, instance):
        device_info = f'{instance.name} (SN: {instance.serial_number})'
        instance.delete()
        create_audit_log(
            request=self.request,
            action='DELETE',
            resource_type='DEVICE',
            resource_id=instance.id,
            description=f'Deleted device {device_info}'
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_devices(request):
    user = request.user
    if user.role == "Employee":
        devices = Device.objects.filter(assigned_to=user)  
    else:
        devices = Device.objects.select_related('assigned_to').all() 

    # Add debug logging
    logger.info("Devices before serialization:")
    for device in devices:
        logger.info(f"Device: {device.name}, Assigned to: {device.assigned_to}, Assigned to ID: {device.assigned_to.id if device.assigned_to else None}")

    serializer = DeviceSerializer(devices, many=True)
    serialized_data = serializer.data
    
    # Add debug logging for serialized data
    logger.info("Serialized devices data:")
    for device_data in serialized_data:
        logger.info(f"Device data: {device_data}")
    
    return Response(serialized_data)

class AssignedDevicesView(APIView):
    def get(self, request, user_id):
        # Fetch devices assigned to the user
        devices = Device.objects.filter(assigned_to_id=user_id)
        if not devices.exists():
            return Response(
                {"detail": "No devices found for this user."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Serialize the devices
        serializer = DeviceSerializer(devices, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    
#Issues    
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from .models import Issue, Device
from .serializers import IssueSerializer
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)

class IssueViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing device issues.
    Uses device serial numbers for creation while maintaining all security checks.
    """
    serializer_class = IssueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Issue.objects.select_related('device', 'user').all()

    def perform_create(self, serializer):
        issue = serializer.save(user=self.request.user)
        create_audit_log(
            request=self.request,
            action='CREATE',
            resource_type='ISSUE',
            resource_id=issue.id,
            description=f'Created issue for device {issue.device.name} (SN: {issue.device.serial_number})'
        )

    def perform_update(self, serializer):
        issue = serializer.save()
        create_audit_log(
            request=self.request,
            action='UPDATE',
            resource_type='ISSUE',
            resource_id=issue.id,
            description=f'Updated issue for device {issue.device.name} (SN: {issue.device.serial_number})'
        )

    def perform_destroy(self, instance):
        device_info = f'{instance.device.name} (SN: {instance.device.serial_number})'
        instance.delete()
        create_audit_log(
            request=self.request,
            action='DELETE',
            resource_type='ISSUE',
            resource_id=instance.id,
            description=f'Deleted issue for device {device_info}'
        )

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                # Get validated device instance
                device = serializer.validated_data['device_serial']
                user = request.user

                # Verify device assignment
                if device.assigned_to and device.assigned_to != user:
                    logger.warning(
                        f"Unauthorized access attempt by user {user.id} "
                        f"for device {device.id}"
                    )
                    return Response(
                        {"error": "You are not assigned to this device."},
                        status=status.HTTP_403_FORBIDDEN
                    )

                # Create the issue
                issue = serializer.save(
                    device=device,
                    user=user,
                    status='Pending'
                )
                
                logger.info(f"Issue {issue.id} created successfully")
                return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Issue creation failed: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to create issue. Please try again."},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        """
        Update issue (authenticated users only)
        Allowed fields: status, response
        """
        instance = self.get_object()
        allowed_fields = ['status', 'response']
        
        # Filter only allowed fields
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        # Validate status
        if 'status' in data:
            valid_statuses = [choice[0] for choice in Issue._meta.get_field('status').choices]
            if data['status'] not in valid_statuses:
                return Response(
                    {"status": f"Invalid status. Valid choices are: {', '.join(valid_statuses)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
      
        if 'status' in data and data['status'] == 'Resolved':
            data['resolved_at'] = timezone.now()
        
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_instance = serializer.save()
        
        # Log the update
        logger.info(f"Issue {instance.id} updated by {request.user.username}. New status: {data.get('status', instance.status)}")
        
        # Return the updated instance with all related data
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_issues(self, request):
        """Get current user's reported issues"""
        issues = self.queryset.filter(user=request.user).order_by('-created_at')
        serializer = self.get_serializer(issues, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def resolve(self, request, pk=None):
        """Admin endpoint to resolve an issue"""
        issue = self.get_object()
        issue.status = 'Resolved'
        issue.response = request.data.get('response', '')
        issue.save()
        
        serializer = self.get_serializer(issue)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>[^/.]+)')
    def user_issues(self, request, user_id=None):
        """Get issues for a specific user"""
        if not user_id:
            return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user_id = int(user_id)
            issues = Issue.objects.filter(user_id=user_id).select_related('device', 'user')
            serializer = self.get_serializer(issues, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response({'error': 'Invalid user ID'}, status=status.HTTP_400_BAD_REQUEST)

#Users
from rest_framework import viewsets
from .models import CustomUser
from .serializers import CustomUserSerializer

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = serializer.save()
        create_audit_log(
            request=self.request,
            action='CREATE',
            resource_type='USER',
            resource_id=user.id,
            description=f'Created user {user.username}'
        )

    def perform_update(self, serializer):
        user = serializer.save()
        create_audit_log(
            request=self.request,
            action='UPDATE',
            resource_type='USER',
            resource_id=user.id,
            description=f'Updated user {user.username}'
        )

    def perform_destroy(self, instance):
        username = instance.username
        instance.delete()
        create_audit_log(
            request=self.request,
            action='DELETE',
            resource_type='USER',
            resource_id=instance.id,
            description=f'Deleted user {username}'
        )

#Maintenance
from rest_framework.viewsets import ModelViewSet
from .models import Maintenance
from .serializers import MaintenanceSerializer

class MaintenanceViewSet(ModelViewSet):
    queryset = Maintenance.objects.all().order_by('-maintenance_date')
    serializer_class = MaintenanceSerializer

    def perform_create(self, serializer):
        maintenance = serializer.save()
        from .utils import create_audit_log
        create_audit_log(
            request=self.request,
            action='CREATE',
            resource_type='MAINTENANCE',
            resource_id=maintenance.id,
            description=f'Created maintenance for device {maintenance.device.name} on {maintenance.maintenance_date}'
        )

    def perform_update(self, serializer):
        maintenance = serializer.save()
        from .utils import create_audit_log
        create_audit_log(
            request=self.request,
            action='UPDATE',
            resource_type='MAINTENANCE',
            resource_id=maintenance.id,
            description=f'Updated maintenance for device {maintenance.device.name} on {maintenance.maintenance_date}'
        )

    def perform_destroy(self, instance):
        device_info = f'{instance.device.name} on {instance.maintenance_date}'
        instance.delete()
        from .utils import create_audit_log
        create_audit_log(
            request=self.request,
            action='DELETE',
            resource_type='MAINTENANCE',
            resource_id=instance.id,
            description=f'Deleted maintenance for device {device_info}'
        )

#Logs
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework import serializers
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta
import csv
from .models import AuditLog
from .serializers import AuditLogSerializer

class AuditLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing audit logs. Accessible by any authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AuditLogSerializer

    @action(detail=False, methods=['post'])
    def cleanup(self, request):
        """Delete old audit logs based on criteria"""
        try:
            days = int(request.data.get('days', 90))
            action_type = request.data.get('action_type')
            resource_type = request.data.get('resource_type')
            
            cutoff_date = timezone.now() - timedelta(days=days)
            logs_to_delete = AuditLog.objects.filter(timestamp__lt=cutoff_date)
            
            if action_type:
                logs_to_delete = logs_to_delete.filter(action=action_type)
            if resource_type:
                logs_to_delete = logs_to_delete.filter(resource_type=resource_type)
            
            count = logs_to_delete.count()
            logs_to_delete.delete()
            
            return Response({'message': f'Successfully deleted {count} logs', 'count': count})
        except ValueError as e:
            return Response({'message': str(e)}, status=400)
        except Exception as e:
            return Response({'message': str(e)}, status=500)
    
    def get_queryset(self):
        try:
            logger.info("Starting AuditLogViewSet.get_queryset")
            queryset = AuditLog.objects.select_related('user').all()
            logger.info(f"Initial queryset count: {queryset.count()}")
            
            # Filter by date range if provided
            start_date = self.request.query_params.get('start_date', None)
            end_date = self.request.query_params.get('end_date', None)
            if start_date and end_date:
                try:
                    start_date = timezone.datetime.strptime(start_date, '%Y-%m-%dT%H:%M:%S.%fZ')
                    end_date = timezone.datetime.strptime(end_date, '%Y-%m-%dT%H:%M:%S.%fZ')
                    logger.info(f"Filtering by date range: {start_date} to {end_date}")
                    queryset = queryset.filter(timestamp__range=[start_date, end_date])
                except ValueError as e:
                    logger.error(f"Invalid date format: {str(e)}")
                    raise serializers.ValidationError("Invalid date format. Use ISO 8601 format.")
            
            # Filter by action type if provided
            action = self.request.query_params.get('action', None)
            if action:
                logger.info(f"Filtering by action: {action}")
                queryset = queryset.filter(action=action)
            
            # Filter by resource type if provided
            resource_type = self.request.query_params.get('resource_type', None)
            if resource_type:
                logger.info(f"Filtering by resource type: {resource_type}")
                queryset = queryset.filter(resource_type=resource_type)

            # Filter by status if provided
            status = self.request.query_params.get('status', None)
            if status:
                logger.info(f"Filtering by status: {status}")
                queryset = queryset.filter(status=status)
            
            logger.info(f"Final queryset count: {queryset.count()}")
            return queryset
        except Exception as e:
            logger.error(f"Error in AuditLogViewSet.get_queryset: {str(e)}", exc_info=True)
            raise serializers.ValidationError(str(e))

    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        Export audit logs to CSV
        """
        try:
            queryset = self.get_queryset()
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="audit_logs_{timezone.now().strftime("%Y%m%d")}.csv"'

            writer = csv.writer(response)
            writer.writerow([
                'ID', 'Timestamp', 'User', 'Action', 'Resource Type',
                'Resource ID', 'Resource Name', 'Description', 'Status',
                'IP Address', 'User Agent'
            ])

            for log in queryset:
                writer.writerow([
                    log.id,
                    log.timestamp,
                    log.user.username if log.user else 'System',
                    log.get_action_display(),
                    log.get_resource_type_display(),
                    log.resource_id,
                    log.resource_name,
                    log.description,
                    log.status,
                    log.ip_address,
                    log.user_agent
                ])

            return response
        except Exception as e:
            logger.error(f"Error exporting audit logs: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to export audit logs"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

#Reports
import csv
from django.http import HttpResponse
from .models import Device, Issue, Maintenance

# Device Report
def download_device_report(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="device_report.csv"'

    writer = csv.writer(response)
    writer.writerow(['ID', 'Name', 'Serial Number', 'Type', 'Status', 'Location'])

    devices = Device.objects.all()
    for device in devices:
        writer.writerow([device.id, device.name, device.serial_number, device.type, device.status, device.location])

    return response

# Issue Report
def download_issue_report(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="issue_report.csv"'

    writer = csv.writer(response)
    writer.writerow(['ID', 'Device', 'User', 'Description', 'Status', 'Created At'])

    issues = Issue.objects.all()
    for issue in issues:
        writer.writerow([
            issue.id,
            issue.device.name,
            issue.user.username if issue.user else 'N/A',
            issue.description,
            issue.status,
            issue.created_at,
        ])

    return response

# Maintenance Report
def download_maintenance_report(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="maintenance_report.csv"'

    writer = csv.writer(response)
    writer.writerow(['ID', 'Device', 'Maintenance Date', 'Notes'])

    maintenance_records = Maintenance.objects.all()
    for record in maintenance_records:
        writer.writerow([
            record.id,
            record.device.name,
            record.maintenance_date,
            record.notes,
        ])

    return response

#Clearance
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import ClearanceLog
from .serializers import ClearanceSerializer

class ClearanceLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for listing and retrieving clearance logs."""
    queryset = ClearanceLog.objects.select_related('device', 'cleared_by').all().order_by('-date_cleared')
    serializer_class = ClearanceSerializer
    permission_classes = [permissions.IsAuthenticated]
from .models import Device

class ClearanceViewSet(viewsets.ViewSet):


    def list(self, request):
        """Fetch devices that are flagged for clearance (Retirement or Disposal)"""
        flagged_devices = Device.objects.filter(status__in=["Retirement", "Disposal"])
        return Response([{"id": d.id, "name": d.name, "serial_number": d.serial_number, "status": d.status} for d in flagged_devices])

    @action(detail=False, methods=['post'])
    def clear_device(self, request):
        """Mark a device as cleared"""
        device_id = request.data.get("device_id")

        # Only allow users with role 'Operations' to clear devices
        if not hasattr(request.user, 'role') or request.user.role != 'Operations':
            return Response({'error': 'Only Operations staff are allowed to clear devices.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            device = Device.objects.get(id=device_id)

            # Mark device as cleared
            device.status = "Cleared"
            device.save()

            # Create an audit log for the clearance action
            from .utils import create_audit_log
            create_audit_log(
                request=request,
                action='CLEAR',
                resource_type='DEVICE',
                resource_id=device.id,
                resource_name=device.name,
                description=f'Cleared device {device.name} (SN: {device.serial_number})',
                status='SUCCESS'
            )

            return Response({"message": f"Device {device.name} cleared successfully!"}, status=status.HTTP_200_OK)

        except Device.DoesNotExist:
            return Response({"error": "Device not found"}, status=status.HTTP_404_NOT_FOUND)

#Notifications
from rest_framework import viewsets, status
from rest_framework.decorators import action

class AccountSetupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            # Decode token
            uidb64 = request.data.get('token')
            password = request.data.get('password')

            if not uidb64 or not password:
                return Response(
                    {'error': 'Invalid request parameters'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                # Decode the user ID
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = CustomUser.objects.get(pk=uid)
            except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
                return Response(
                    {'error': 'Invalid setup token'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate password
            try:
                validate_password(password)
            except ValidationError as e:
                return Response({'error': e.messages}, status=status.HTTP_400_BAD_REQUEST)

            # Set password and mark email as verified
            user.set_password(password)
            user.email_verified = True
            user.save()

            return Response({'message': 'Account setup completed successfully'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CreateUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            # Only admins can create users
            if request.user.role != 'Admin':
                return Response(
                    {'error': 'Only administrators can create new users'}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # Validate required fields
            required_fields = ['username', 'email', 'department', 'role']
            for field in required_fields:
                if not request.data.get(field):
                    return Response(
                        {'error': f'{field} is required'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Check if username exists
            if CustomUser.objects.filter(username=request.data.get('username')).exists():
                return Response(
                    {'error': 'Username already exists'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if email exists
            if CustomUser.objects.filter(email=request.data.get('email')).exists():
                return Response(
                    {'error': 'Email already exists'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Generate a secure random temporary password
            import secrets, string
            alphabet = string.ascii_letters + string.digits
            temp_password = ''.join(secrets.choice(alphabet) for _ in range(10))

            # Create user and set temp password
            user = CustomUser.objects.create(
                username=request.data.get('username'),
                email=request.data.get('email'),
                department=request.data.get('department'),
                role=request.data.get('role'),
                phone_number=request.data.get('phone_number'),  
                is_active=True,
                is_staff=request.data.get('role') == 'Admin',
                must_change_password=True
            )
            user.set_password(temp_password)
            user.save()

            return Response(
                {
                    'message': 'User created successfully. Temporary password generated.',
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'phone_number': user.phone_number,  
                        'role': user.role
                    },
                    'temporary_password': temp_password
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class SignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            # Check if any admin exists
            admin_exists = CustomUser.objects.filter(is_staff=True).exists()
            if admin_exists:
                return Response(
                    {'error': 'Admin already exists. New users must be registered through the admin panel.'}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # Validate password
            try:
                validate_password(request.data.get('password'))
            except ValidationError as e:
                return Response({'error': e.messages}, status=status.HTTP_400_BAD_REQUEST)

            # Check if username exists
            if CustomUser.objects.filter(username=request.data.get('username')).exists():
                return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

            # Check if email exists
            if CustomUser.objects.filter(email=request.data.get('email')).exists():
                return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

            # Create admin user
            username = request.data.get('username')
            email = request.data.get('email')
            password = request.data.get('password')
            print(f"SIGNUP DEBUG: username='{username}', password='{password}'")
            user = CustomUser(
                email=email,
                username=username,
                role='Admin',
                is_staff=True
            )
            user.set_password(password)
            user.save()

            # Create token for the new admin
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role
                },
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)



class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

    def destroy(self, request, pk=None):
        notification = self.get_object()
        if notification.recipient != request.user:
            return Response({'error': "You don't have permission to delete this notification."}, status=status.HTTP_403_FORBIDDEN)
        notification.delete()
        return Response({'status': 'deleted'})

    def delete(self, request, *args, **kwargs):
        # Custom bulk delete for notifications list endpoint
        Notification.objects.filter(recipient=request.user).delete()
        return Response({'status': 'all deleted'})

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        if notification.recipient != request.user:
            return Response(
                {"error": "You don't have permission to modify this notification"},
                status=status.HTTP_403_FORBIDDEN
            )
        notification.read = True
        notification.save()
        return Response({"status": "success"})

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        self.get_queryset().update(read=True)
        return Response({"status": "success"})

#Authentication
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import CustomUser

# Function to generate JWT tokens
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

# Login API
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    print(f"LOGIN DEBUG: username='{username}', password='{password}'")
    user = authenticate(username=username, password=password)

    if user and user.is_active:
        tokens = get_tokens_for_user(user)
        # Only log login for IT Admins
        if hasattr(user, 'role') and user.role == 'Admin':
            from .utils import create_audit_log
            create_audit_log(
                request=request,
                action='LOGIN',
                resource_type='USER',
                resource_id=user.id,
                description=f'User {user.username} logged in'
            )
        return Response({
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'department': user.department,
            }
        })
    else:
        return Response({'error': 'Invalid credentials'}, status=400)

# Password Change API
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    try:
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not current_password or not new_password or not confirm_password:
            return Response({'error': 'All password fields are required'}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({'error': 'New passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        
        # Verify current password
        if not user.check_password(current_password):
            return Response({'error': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate new password
        try:
            validate_password(new_password)
        except ValidationError as e:
            return Response({'error': e.messages}, status=status.HTTP_400_BAD_REQUEST)

        # Update password
        user.set_password(new_password)
        user.must_change_password = False
        user.save()

        # Create audit log
        from .utils import create_audit_log
        create_audit_log(
            request=request,
            action='PASSWORD_CHANGE',
            resource_type='USER',
            resource_id=user.id,
            description=f'User {user.username} changed their password'
        )

        return Response({'message': 'Password changed successfully'}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)