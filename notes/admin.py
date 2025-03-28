from django.contrib import admin
from .models import Note

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("title", "created_at")  # 🟡 Виводимо заголовок і дату створення
    search_fields = ("title", "text")       # 🔍 Додаємо пошук по заголовку та тексту
    ordering = ("-created_at",)             # 📅 Сортування — нові нотатки зверху
