from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.template.loader import render_to_string
from .models import Note
from .forms import NoteForm
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login
from .forms import UkrainianRegisterForm

def main_home(request):
    return render(request, 'notes/main_home.html')

def home(request):
    return render(request, 'notes/home.html')

def note_list(request):
    notes = Note.objects.filter(is_deleted=False).order_by('-id')  # фільтр!
    form = NoteForm()

    if request.method == 'POST':
        form = NoteForm(request.POST)
        if form.is_valid():
            new_note = form.save()

            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                html = render_to_string('notes/note_item.html', {'note': new_note})
                return JsonResponse({'html': html})

            return redirect('note_list')

    return render(request, 'notes/index.html', {'form': form, 'notes': notes})


def edit_note(request, pk):
    note = get_object_or_404(Note, pk=pk)
    if request.method == 'POST':
        form = NoteForm(request.POST, instance=note)
        if form.is_valid():
            form.save()
            return redirect('note_list')
    else:
        form = NoteForm(instance=note)
    return render(request, 'notes/edit_note.html', {'form': form})


# Замість жорсткого видалення — мʼяке
def delete_note(request, pk):
    note = get_object_or_404(Note, pk=pk)
    note.is_deleted = True
    note.save()
    return redirect('note_list')


def add_note(request):
    if request.method == 'POST':
        form = NoteForm(request.POST)
        if form.is_valid():
            note = form.save()
            note_html = render_to_string('notes/note_item.html', {'note': note})
            return JsonResponse({'success': True, 'note_html': note_html})
    return JsonResponse({'success': False})


# ============== КОРЗИНА ==============

def trash(request):
    notes = Note.objects.filter(is_deleted=True).order_by('-id')
    return render(request, 'notes/trash.html', {'notes': notes})


@csrf_exempt
def restore_note(request, pk):
    if request.method == 'POST':
        note = get_object_or_404(Note, pk=pk)
        note.is_deleted = False
        note.save()
        return JsonResponse({'success': True})


@csrf_exempt
def delete_forever(request, pk):
    if request.method == 'POST':
        note = get_object_or_404(Note, pk=pk)
        note.delete()
        return JsonResponse({'success': True})


@csrf_exempt
def restore_all(request):
    if request.method == 'POST':
        Note.objects.filter(is_deleted=True).update(is_deleted=False)
        return JsonResponse({'success': True})


@csrf_exempt
def delete_all(request):
    if request.method == 'POST':
        Note.objects.filter(is_deleted=True).delete()
        return JsonResponse({'success': True})


def auth_choice(request):
    return render(request, 'notes/auth_choice.html')

def register(request):
    if request.method == 'POST':
        form = UkrainianRegisterForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('login')
    else:
        form = UkrainianRegisterForm()
    return render(request, 'notes/register.html', {'form': form})

@login_required
def profile(request):
    return render(request, 'notes/profile.html')