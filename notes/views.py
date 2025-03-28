# notes/views.py

from django.shortcuts import render, redirect, get_object_or_404
from .models import Note
from .forms import NoteForm

def main_home(request):
    return render(request, 'notes/main_home.html')

def home(request):
    return render(request, 'notes/home.html')

def note_list(request):
    notes = Note.objects.all().order_by('-id')  # Список всіх нотаток
    form = NoteForm()  # Порожня форма

    if request.method == 'POST':
        form = NoteForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('note_list')  # Повертаємося на головну

    return render(request, 'notes/index.html', {
        'form': form,
        'notes': notes  # Передаємо ВСІ нотатки
    })


def edit_note(request, pk):
    note = get_object_or_404(Note, pk=pk)
    form = NoteForm(instance=note)

    if request.method == 'POST':
        form = NoteForm(request.POST, instance=note)
        if form.is_valid():
            form.save()
            return redirect('note_list')

    return render(request, 'notes/index.html', {
        'form': form,
        'notes': Note.objects.all().order_by('-id')
    })


def delete_note(request, pk):
    note = get_object_or_404(Note, pk=pk)
    note.delete()
    return redirect('note_list')

# Create your views here.
