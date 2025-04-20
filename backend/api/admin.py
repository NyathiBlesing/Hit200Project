from django.contrib import admin
from .models import Device, Issue, Maintenance, CustomUser, AuditLog

admin.site.register(Device)
admin.site.register(Issue)
admin.site.register(Maintenance)
admin.site.register(CustomUser)
admin.site.register(AuditLog)




