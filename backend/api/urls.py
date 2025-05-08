from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    SignupView, AccountSetupView, CreateUserView, DeviceViewSet, IssueViewSet, MaintenanceViewSet, AuditLogViewSet,
    CustomUserViewSet, ClearanceViewSet, AssignedDevicesView, ClearanceLogViewSet,
    download_device_report, download_issue_report, download_maintenance_report,
    DeviceBySerialView, NotificationViewSet,
    login_view, get_device_distribution, change_password_view
)

# Create a single router for all ViewSets
router = DefaultRouter()
router.register(r'devices', DeviceViewSet, basename='device')
router.register(r'issues', IssueViewSet, basename='issue')
router.register(r'clearance', ClearanceViewSet, basename="clearance")
router.register(r'clearance-logs', ClearanceLogViewSet, basename='clearance-log')
router.register(r'maintenances', MaintenanceViewSet, basename='maintenance')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'notifications', NotificationViewSet, basename='notification')

# Define all URL patterns
urlpatterns = [
    path('', include(router.urls)),
    path('devices/assigned/<int:user_id>/', AssignedDevicesView.as_view(), name='assigned-devices'),
    path('devices/<str:serial_number>/', DeviceBySerialView.as_view(), name='device_by_serial'),
    path('reports/devices/', download_device_report, name='download_device_report'),
    path('reports/issues/', download_issue_report, name='download_issue_report'),
    path('reports/maintenance/', download_maintenance_report, name='download_maintenance_report'),
    path('auth/signup/', SignupView.as_view(), name='signup'),
    path('auth/setup-account/', AccountSetupView.as_view(), name='account-setup'),
    path('auth/login/', login_view, name='login'),
    path('users/create/', CreateUserView.as_view(), name='create-user'),
    path('users/list/', CustomUserViewSet.as_view({'get': 'list'}), name='user-list'),
    path('users/', CustomUserViewSet.as_view({'get': 'list'}), name='users'),
    path('users/<int:pk>/', CustomUserViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='user-detail'),
    path('devices/distribution/', get_device_distribution, name='device_distribution'),
    path('auth/change-password/', change_password_view, name='change-password'),
]
