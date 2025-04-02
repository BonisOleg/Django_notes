from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    # === ГОЛОВНА СТОРІНКА ===
    path('', views.note_list, name='note_list'),
    path('add/', views.add_note, name='add_note'),
    path('edit/<int:pk>/', views.edit_note, name='edit_note'),
    path('delete/<int:pk>/', views.delete_note, name='delete_note'),

    # === ПАПКИ ===
    path('create_folder/', views.create_folder, name='create_folder'),
    path('rename_folder/<int:pk>/', views.rename_folder, name='rename_folder'),
    path('delete_folder/<int:pk>/', views.delete_folder, name='delete_folder'),
    path('folder/<int:folder_id>/', views.folder_detail, name='folder_detail'),  # Виправлено!
    path('move_note_to_folder/', views.move_note_to_folder, name='move_note_to_folder'),

    # === КОРЗИНА ===
    path('trash/', views.trash, name='trash'),
    path('trash/restore/<int:pk>/', views.restore_note, name='restore_note'),
    path('trash/restore_all/', views.restore_all, name='restore_all'),
    path('trash/delete_forever/<int:pk>/', views.delete_forever, name='delete_forever'),
    path('trash/delete_all/', views.delete_all, name='delete_all'),

    # === АВТОРИЗАЦІЯ ===
    path('auth/', views.auth_choice, name='auth_choice'),
    path('register/', views.register, name='register'),
    path('profile/', views.profile, name='profile'),
    path('login/', auth_views.LoginView.as_view(template_name='notes/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='main_home'), name='logout'),
]