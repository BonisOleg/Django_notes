from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.note_list, name='note_list'),
    path('edit/<int:pk>/', views.edit_note, name='edit_note'),
    path('delete/<int:pk>/', views.delete_note, name='delete_note'),
    path('add/', views.add_note, name='add_note'),  # якщо є Ajax-додавання

    # === КОРЗИНА ===
    path('trash/', views.trash, name='trash'),                          # Перегляд корзини
    path('trash/restore/<int:pk>/', views.restore_note, name='restore_note'),  # Відновити одну
    path('trash/restore_all/', views.restore_all, name='restore_all'),        # Відновити всі
    path('trash/delete_forever/<int:pk>/', views.delete_forever, name='delete_forever'),  # Видалити одну
    path('trash/delete_all/', views.delete_all, name='delete_all'),     # Видалити всі

    # ... існуючі шляхи ...
    path('register/', views.register, name='register'),
    path('auth/', views.auth_choice, name='auth_choice'),
    path('login/', auth_views.LoginView.as_view(template_name='notes/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='main_home'), name='logout'),
    path('profile/', views.profile, name='profile'),
]