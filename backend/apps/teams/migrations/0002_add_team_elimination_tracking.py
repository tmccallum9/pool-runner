# Generated migration for team elimination tracking

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('teams', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='team',
            name='is_eliminated',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='team',
            name='elimination_round',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='team',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddConstraint(
            model_name='team',
            constraint=models.CheckConstraint(
                check=models.Q(
                    models.Q(elimination_round__gte=1),
                    models.Q(elimination_round__lte=6),
                    models.Q(elimination_round__isnull=True),
                    _connector='OR'
                ),
                name='elimination_round_valid_range'
            ),
        ),
    ]
