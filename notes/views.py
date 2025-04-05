from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from .models import Note, Folder, Subscription, Profile
from .forms import NoteForm, UkrainianRegisterForm, FolderForm
from django.contrib.auth.models import User
from django.core.files.storage import FileSystemStorage

def main_home(request):
    return render(request, 'notes/main_home.html')

@login_required
def note_list(request):
    form = NoteForm()
    folders = Folder.objects.filter(user=request.user)
    notes = Note.objects.filter(user=request.user, is_deleted=False, folder__isnull=True).order_by('-created_at')

    return render(request, 'notes/index.html', {
        'form': form,
        'notes': notes,
        'folders': folders,
        'guest': not request.user.is_authenticated
    })

@login_required
def add_note(request):
    if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        form = NoteForm(request.POST)
        if form.is_valid():
            note = form.save(commit=False)
            note.user = request.user
            note.save()
            note_html = render_to_string('notes/note_item.html', {'note': note})
            return JsonResponse({'success': True, 'note_html': note_html})
    return JsonResponse({'success': False})

@login_required
def create_folder(request):
    if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        name = request.POST.get('folder_name')
        if name:
            Folder.objects.create(name=name, user=request.user)
            return JsonResponse({'success': True})
        return JsonResponse({'success': False, 'error': 'Не вказано назву папки'})
    return JsonResponse({'success': False, 'error': 'Неправильний метод або заголовок'})

@login_required
def rename_folder(request, pk):
    if request.method == 'POST':
        folder = get_object_or_404(Folder, pk=pk, user=request.user)
        new_name = request.POST.get('new_name')
        if new_name:
            folder.name = new_name
            folder.save()
            return JsonResponse({'success': True})
    return JsonResponse({'success': False})

@login_required
def delete_folder(request, pk):
    if request.method == 'POST':
        folder = get_object_or_404(Folder, pk=pk, user=request.user)
        action = request.POST.get('action')  # "only_folder" або "with_notes"
        if action == 'only_folder':
            Note.objects.filter(folder=folder).update(folder=None)
            folder.delete()
        elif action == 'with_notes':
            Note.objects.filter(folder=folder).update(is_deleted=True, folder=None)
            folder.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False})

@login_required
def edit_note(request, pk):
    note = get_object_or_404(Note, pk=pk, user=request.user)
    if request.method == 'POST':
        form = NoteForm(request.POST, instance=note)
        if form.is_valid():
            form.save()
            return redirect('note_list')
    else:
        form = NoteForm(instance=note)
    return render(request, 'notes/edit_note.html', {'form': form})

@login_required
def delete_note(request, pk):
    note = get_object_or_404(Note, pk=pk, user=request.user)
    note.is_deleted = True
    note.save()
    return redirect('note_list')

@login_required
def move_note_to_folder(request):
    if request.method == 'POST':
        note_id = request.POST.get('note_id')
        folder_id = request.POST.get('folder_id')
        note = get_object_or_404(Note, pk=note_id, user=request.user)
        folder = get_object_or_404(Folder, pk=folder_id, user=request.user)
        note.folder = folder
        note.save()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False})

@login_required
def folder_detail(request, folder_id):
    folder = get_object_or_404(Folder, pk=folder_id, user=request.user)
    notes = Note.objects.filter(user=request.user, folder=folder, is_deleted=False).order_by('-created_at')
    return render(request, 'notes/folder_details.html', {
        'folder': folder,
        'notes': notes
    })

@login_required
def edit_folder(request, pk):
    folder = get_object_or_404(Folder, pk=pk, user=request.user)
    if request.method == 'POST':
        form = FolderForm(request.POST, instance=folder)
        if form.is_valid():
            form.save()
            return redirect('note_list')
    else:
        form = FolderForm(instance=folder)
    return render(request, 'notes/edit_folder.html', {'form': form, 'folder': folder})

# ====== КОРЗИНА ======
@login_required
def trash(request):
    notes = Note.objects.filter(user=request.user, is_deleted=True).order_by('-created_at')
    return render(request, 'notes/trash.html', {'notes': notes})

@csrf_exempt
@login_required
def restore_note(request, pk):
    if request.method == 'POST':
        note = get_object_or_404(Note, pk=pk, user=request.user)
        note.is_deleted = False
        note.save()
        return JsonResponse({'success': True})

@csrf_exempt
@login_required
def delete_forever(request, pk):
    if request.method == 'POST':
        note = get_object_or_404(Note, pk=pk, user=request.user)
        note.delete()
        return JsonResponse({'success': True})

@csrf_exempt
@login_required
def restore_all(request):
    if request.method == 'POST':
        Note.objects.filter(user=request.user, is_deleted=True).update(is_deleted=False)
        return JsonResponse({'success': True})

@csrf_exempt
@login_required
def delete_all(request):
    if request.method == 'POST':
        Note.objects.filter(user=request.user, is_deleted=True).delete()
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

@login_required
def upload_photo(request):
    if request.method == 'POST' and request.FILES['photo']:
        photo = request.FILES['photo']
        profile, created = Profile.objects.get_or_create(user=request.user)
        profile.photo = photo
        profile.save()
        return render(request, 'notes/profile.html', {'uploaded_file_url': profile.photo.url})
    return redirect('profile')

@login_required
def subscribe(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        try:
            user_to_subscribe = User.objects.get(username=username)
            # Перевірка, чи вже існує запит або підписка
            if not Subscription.objects.filter(subscriber=request.user, subscribed_to=user_to_subscribe).exists():
                # Створення нового запиту на підписку
                Subscription.objects.create(subscriber=request.user, subscribed_to=user_to_subscribe, confirmed=False)
                return render(request, 'notes/profile.html', {'message': f'Запит на підписку на {username} надіслано!'})
            else:
                return render(request, 'notes/profile.html', {'error': 'Ви вже підписані або запит надіслано.'})
        except User.DoesNotExist:
            return render(request, 'notes/profile.html', {'error': 'Користувача не знайдено.'})
    return redirect('profile')

@login_required
def view_subscriptions(request):
    subscriptions = Subscription.objects.filter(subscriber=request.user, confirmed=True)
    return render(request, 'notes/subscriptions.html', {'subscriptions': subscriptions})

@login_required
def view_subscription_requests(request):
    requests = Subscription.objects.filter(subscribed_to=request.user, confirmed=False)
    return render(request, 'notes/subscription_requests.html', {'requests': requests})

@login_required
def confirm_subscription(request, subscription_id):
    subscription = get_object_or_404(Subscription, id=subscription_id, subscribed_to=request.user)
    subscription.confirmed = True
    subscription.save()
    return redirect('view_subscription_requests')

@login_required
def cancel_subscription(request, subscription_id):
    subscription = get_object_or_404(Subscription, id=subscription_id, subscribed_to=request.user)
    subscription.delete()
    return redirect('view_subscription_requests')

@login_required
def view_user_notes(request, user_id):
    user = get_object_or_404(User, id=user_id)
    notes = Note.objects.filter(user=user, is_deleted=False)
    return render(request, 'notes/user_notes.html', {'notes': notes, 'user': user})

@login_required
def return_note_from_folder(request, note_id):
    if request.method == 'POST':
        note = get_object_or_404(Note, pk=note_id, user=request.user)
        note.folder = None
        note.save()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False})

@login_required
def unsubscribe(request, user_id):
    if request.method == 'POST':
        subscription = get_object_or_404(
            Subscription, 
            subscriber=request.user,
            subscribed_to_id=user_id
        )
        subscription.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False})