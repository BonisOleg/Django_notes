from django import forms
from .models import Note

class NoteForm(forms.ModelForm):
    class Meta:
        model = Note
        fields = ['title', 'text', 'note_footer']
        labels = {
            'title': "Заголовок",
            'text': "Основний текст",
            'note_footer': "Примітка",
        }