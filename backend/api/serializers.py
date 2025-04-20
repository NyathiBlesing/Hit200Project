#Users
from rest_framework import serializers
from .models import CustomUser

class CustomUserSerializer(serializers.ModelSerializer):
    index = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['index', 'id', 'username', 'phone_number', 'email', 'role', 'department', 'is_staff']

    def get_index(self, obj):
        queryset = CustomUser.objects.all().order_by('id')
        index_mapping = {user.id: i + 1 for i, user in enumerate(queryset)}
        return index_mapping.get(obj.id, None) 

#Devices
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Device, CustomUser

User = get_user_model()

class DeviceSerializer(serializers.ModelSerializer):
    assigned_to = CustomUserSerializer(read_only=True)
    cleared_by = CustomUserSerializer(read_only=True)
    assigned_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Device
        fields = [
            'id', 'name', 'type', 'serial_number', 'location', 'status',
            'assigned_to', 'assigned_to_id', 'created_at', 'updated_at',
            'cleared_at', 'cleared_by', 'clearance_reason'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'cleared_at', 'cleared_by']

    def validate_assigned_to_id(self, value):
        if value:
            try:
                CustomUser.objects.get(id=value)
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError("User does not exist")
        return value

    def create(self, validated_data):
        assigned_to_id = validated_data.pop('assigned_to_id', None)
        if assigned_to_id:
            try:
                user = CustomUser.objects.get(id=assigned_to_id)
                validated_data['assigned_to'] = user
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError("User does not exist")
        
        instance = super().create(validated_data)
        return instance

    def update(self, instance, validated_data):
        # Prevent overwriting serial_number unless explicitly changed
        validated_data['serial_number'] = validated_data.get('serial_number', instance.serial_number)
        
        # Handle assigned_to_id
        assigned_to_id = validated_data.pop('assigned_to_id', None)
        if assigned_to_id is not None:
            try:
                user = CustomUser.objects.get(id=assigned_to_id)
                instance.assigned_to = user
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError("User does not exist")
        elif assigned_to_id is None:
            instance.assigned_to = None
        
        instance = super().update(instance, validated_data)
        instance.save()
        return instance

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Device name cannot be empty.")
        return value


#Issues
from rest_framework import serializers
from .models import Issue, Device

class IssueSerializer(serializers.ModelSerializer):
    device_info = DeviceSerializer(source='device', read_only=True)
    device_serial = serializers.CharField(write_only=True)
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Issue
        fields = [
            'id', 'device', 'device_info', 'device_serial', 
            'user', 'description', 'status', 'response',
            'created_at', 'updated_at', 'priority'
        ]
        read_only_fields = [
            'id', 'device', 'device_info', 'user', 
            'created_at', 'updated_at'
        ]

    def validate_device_serial(self, value):
        """Validate and return Device instance from serial number"""
        try:
            return Device.objects.get(serial_number=value.strip())
        except Device.DoesNotExist:
            raise serializers.ValidationError("Device with this serial number does not exist")

    def create(self, validated_data):
        """Create issue with device from serial number"""
        device = validated_data.pop('device_serial')
        validated_data['device'] = device
        return super().create(validated_data)

#Maintenance
from rest_framework import serializers
from .models import Maintenance, Device
from django.utils import timezone

class MaintenanceSerializer(serializers.ModelSerializer):
    serial_number = serializers.SlugRelatedField(
        source='device',
        slug_field='serial_number',
        queryset=Device.objects.all()
    )
    device_name = serializers.CharField(source='device.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    assigned_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Maintenance
        fields = [
            'id', 'serial_number', 'device_name', 'maintenance_date',
            'maintenance_type', 'status', 'assigned_to', 'assigned_to_name',
            'assigned_to_id', 'notes', 'cost', 'parts_replaced',
            'next_maintenance_date', 'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'completed_at']

    def validate_assigned_to_id(self, value):
        if value:
            try:
                CustomUser.objects.get(id=value)
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError("User does not exist")
        return value

    def validate_maintenance_date(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("Maintenance date cannot be in the past")
        return value

    def validate_next_maintenance_date(self, value):
        if value and value < timezone.now().date():
            raise serializers.ValidationError("Next maintenance date cannot be in the past")
        return value

    def create(self, validated_data):
        assigned_to_id = validated_data.pop('assigned_to_id', None)
        if assigned_to_id:
            try:
                user = CustomUser.objects.get(id=assigned_to_id)
                validated_data['assigned_to'] = user
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError("User does not exist")
        return super().create(validated_data)

    def update(self, instance, validated_data):
        assigned_to_id = validated_data.pop('assigned_to_id', None)
        if assigned_to_id is not None:
            try:
                user = CustomUser.objects.get(id=assigned_to_id)
                instance.assigned_to = user
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError("User does not exist")
        return super().update(instance, validated_data)

#Logs
from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    resource_type_display = serializers.CharField(source='get_resource_type_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'action', 'action_display', 
            'resource_type', 'resource_type_display', 
            'resource_id', 'resource_name', 'description', 
            'timestamp', 'ip_address', 'user_agent',
            'changes', 'status', 'error_message'
        ]
        read_only_fields = ['timestamp', 'ip_address', 'user_agent']

#Notifications
from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    recipient = CustomUserSerializer(read_only=True)
    device = DeviceSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'type', 'title', 'message', 'admin_response', 'device', 'read', 'created_at']
        read_only_fields = ['created_at']

#Clearance
from rest_framework import serializers
from .models import ClearanceLog

class ClearanceSerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source="device.name", read_only=True)
    cleared_by_username = serializers.CharField(source="cleared_by.username", read_only=True)

    class Meta:
        model = ClearanceLog
        fields = ["id", "device", "device_name", "cleared_by", "cleared_by_username", "date_cleared", "status"]
