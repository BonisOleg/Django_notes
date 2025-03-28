# Generated by Django 5.1.7 on 2025-03-28 20:43

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Note',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200, verbose_name='Заголовок')),
                ('text', models.TextField(verbose_name='Основний текст')),
                ('note_footer', models.TextField(blank=True, verbose_name='Примітка')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Створено')),
            ],
        ),
    ]
