from django import forms
from .models import Note
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

class NoteForm(forms.ModelForm):
    class Meta:
        model = Note
        fields = ['title', 'text', 'note_footer']
        labels = {
            'title': "Заголовок",
            'text': "Основний текст",
            'note_footer': "Примітка",
        }

class UkrainianRegisterForm(UserCreationForm):
    username = forms.CharField(label='Імʼя користувача')
    password1 = forms.CharField(label='Пароль', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Підтвердження пароля', widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ['username', 'password1', 'password2']