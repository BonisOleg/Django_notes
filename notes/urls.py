# notes/urls.py

# notes/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('', views.note_list, name='note_list'),  # головна сторінка /notes/
    path('edit/<int:pk>/', views.edit_note, name='edit_note'),  # редагування нотатки
    path('delete/<int:pk>/', views.delete_note, name='delete_note'),  # видалення нотатки
]