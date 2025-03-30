from django.db import models

class Note(models.Model):
    title = models.CharField("Заголовок", max_length=200)
    text = models.TextField("Основний текст")
    note_footer = models.TextField("Примітка", blank=True)
    created_at = models.DateTimeField("Створено", auto_now_add=True)
    is_deleted = models.BooleanField("Видалено", default=False)  # Для корзини

    def __str__(self):
        return self.title