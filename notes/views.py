# notes/views.py

from django.shortcuts import render


def home(request):
    return render(request, 'notes/home.html')




# Create your views here.
