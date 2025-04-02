from django.db import models
from django.contrib.auth.models import User  # Імпортуємо модель користувача

class Folder(models.Model):
    name = models.CharField("Назва папки", max_length=100)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.name

class Note(models.Model):
    title = models.CharField("Заголовок", max_length=200)
    text = models.TextField("Основний текст")
    note_footer = models.TextField("Примітка", blank=True)
    created_at = models.DateTimeField("Створено", auto_now_add=True)
    is_deleted = models.BooleanField("Видалено", default=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Користувач")  # Прив'язка до користувача
    folder = models.ForeignKey(Folder, on_delete=models.SET_NULL, null=True, blank=True)
    def __str__(self):
        return self.title
