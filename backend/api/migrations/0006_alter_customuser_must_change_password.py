from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ("api", "0005_customuser_must_change_password"),
    ]

    operations = [
        migrations.AlterField(
            model_name="customuser",
            name="must_change_password",
            field=models.BooleanField(default=True, null=False, blank=False),
        ),
    ]
