$(document).ready(function () {
  const csrfToken = $('meta[name="csrf-token"]').attr('content');

  function csrfSafeMethod(method) {
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
  }

  $.ajaxSetup({
    beforeSend: function (xhr, settings) {
      if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
        xhr.setRequestHeader("X-CSRFToken", csrfToken);
      }
    }
  });

  // ===== AJAX: створення нотатки =====
  $('#add-note-form').submit(function (e) {
    e.preventDefault();
    const form = $(this);
    if (form.data('submitting')) return;
    form.data('submitting', true);

    $.ajax({
      type: 'POST',
      url: form.attr('action'),
      data: form.serialize(),
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      success: function (response) {
        if (response.success) {
          $('.note-list').prepend(response.note_html);
          form[0].reset();
        }
      },
      complete: function () {
        form.data('submitting', false);
      },
      error: function () {
        alert('Помилка при створенні нотатки.');
      }
    });
  });

  // ===== AJAX: створення папки =====
  $('#create-folder-form').submit(function (e) {
    e.preventDefault();
    const form = $(this);
    if (form.data('submitting')) return;
    form.data('submitting', true);

    $.ajax({
      type: 'POST',
      url: '/notes/create_folder/',
      data: form.serialize(),
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      success: function (response) {
        if (response.success) location.reload();
        else alert('Не вдалося створити папку.');
      },
      complete: function () {
        form.data('submitting', false);
      },
      error: function () {
        alert('Сталася помилка при створенні папки.');
      }
    });
  });

  // ======== DRAG & DROP для нотаток ========
  let draggedNote = null;

  $(document).on('dragstart', '.note-block', function (e) {
    draggedNote = $(this);
    draggedNote.addClass('dragging');
    e.originalEvent.dataTransfer.setData('note-id', draggedNote.data('id'));

    setTimeout(() => {
      draggedNote.css({
        transform: 'scale(0.33)',
        opacity: '0.7'
      });
    }, 0);
  });

  $(document).on('dragend', '.note-block', function () {
    draggedNote.removeClass('dragging');
    draggedNote.css({
      transform: 'scale(1)',
      opacity: '1'
    });
  });

  $(document).on('dragover', '.folder-block', function (e) {
    e.preventDefault();
    $(this).addClass('drag-over');
  });

  $(document).on('dragleave', '.folder-block', function () {
    $(this).removeClass('drag-over');
  });

  $(document).on('drop', '.folder-block', function (e) {
    e.preventDefault();
    const folderId = $(this).data('folder-id');
    const noteId = e.originalEvent.dataTransfer.getData('note-id');
    $(this).removeClass('drag-over');

    $.ajax({
      type: 'POST',
      url: '/notes/move_note_to_folder/',
      data: {
        note_id: noteId,
        folder_id: folderId
      },
      success: function () {
        $(`.note-block[data-id="${noteId}"]`).fadeOut(300, function () {
          $(this).remove();
        });
      },
      error: function () {
        alert('Не вдалося перемістити нотатку в папку.');
      }
    });
  });

  // ====== КОРЗИНА ======
  $(document).on('click', '.restore-note', function () {
    const block = $(this).closest('.note-block');
    const noteId = block.data('id');

    $.post(`/notes/trash/restore/${noteId}/`, {}, function () {
      block.fadeOut(300, function () {
        $(this).remove();
        if ($('.note-block').length === 0) {
          $('#trash-list').html('<p>Корзина порожня.</p>');
        }
      });
    });
  });

  $(document).on('click', '.delete-note', function () {
    const block = $(this).closest('.note-block');
    const noteId = block.data('id');

    $.post(`/notes/trash/delete_forever/${noteId}/`, {}, function () {
      block.fadeOut(300, function () {
        $(this).remove();
        if ($('.note-block').length === 0) {
          $('#trash-list').html('<p>Корзина порожня.</p>');
        }
      });
    });
  });

  $(document).on('click', '.restore-all', function () {
    $.post(`/notes/trash/restore_all/`, {}, function () {
      $('#trash-list').fadeOut(300, function () {
        $(this).html('<p>Усі нотатки відновлено.</p>').fadeIn();
      });
    });
  });

  $(document).on('click', '.delete-all', function () {
    $.post(`/notes/trash/delete_all/`, {}, function () {
      $('#trash-list').fadeOut(300, function () {
        $(this).html('<p>Усі нотатки видалено назавжди.</p>').fadeIn();
      });
    });
  });

  // ===== ПАПКИ: видалення та редагування =====
  let currentFolderId = null;

  $(document).on('click', '.delete-folder', function (e) {
    e.preventDefault();
    currentFolderId = $(this).data('id');
    const modal = $('#delete-folder-modal');

    // Показуємо модальне вікно
    modal.css('display', 'flex');
  });

  $('#delete-folder-only').click(function () {
    sendFolderDelete('only_folder');
  });

  $('#delete-folder-with-notes').click(function () {
    sendFolderDelete('with_notes');
  });

  function sendFolderDelete(type) {
    $.post(`/notes/delete_folder/${currentFolderId}/`, {
      action: type
    }, function () {
      location.reload();
    });
  }

  // Закрити модалку при кліку поза нею
  $(document).mouseup(function (e) {
    const modal = $('#delete-folder-modal');
    const modalContent = modal.find('.modal-content');
    if (!modalContent.is(e.target) && modalContent.has(e.target).length === 0) {
      modal.fadeOut();
    }
  });

  $('.close-modal').click(function () {
    $('#delete-folder-modal').fadeOut();
  });

  // Редагування назви папки
  let currentFolderForRename = null;

  $(document).on('click', '.rename-folder', function (e) {
    e.preventDefault();
    currentFolderForRename = $(this).data('id');
    const folderTitle = $(`.folder-title[data-id="${currentFolderForRename}"]`);
    const currentName = folderTitle.text().trim();

    // Показуємо модальне вікно і встановлюємо поточну назву
    const modal = $('#rename-folder-modal');
    $('#new-folder-name').val(currentName);
    modal.css('display', 'flex');
  });

  // Зберігання нової назви
  $('#save-folder-name').click(function () {
    const newName = $('#new-folder-name').val().trim();

    if (!newName) {
      alert('Назва папки не може бути порожньою');
      return;
    }

    $.ajax({
      type: 'POST',
      url: `/notes/rename_folder/${currentFolderForRename}/`,
      data: {
        new_name: newName
      },
      success: function (response) {
        if (response.success) {
          // Оновлюємо назву в DOM
          $(`.folder-title[data-id="${currentFolderForRename}"]`).text(newName);

          // Закриваємо модальне вікно
          $('#rename-folder-modal').fadeOut();

          // Показуємо повідомлення про успіх
          const folderBlock = $(`.folder-block[data-folder-id="${currentFolderForRename}"]`);
          folderBlock.append('<div class="success-message">Назву змінено!</div>');
          setTimeout(() => {
            folderBlock.find('.success-message').fadeOut(function () {
              $(this).remove();
            });
          }, 2000);
        } else {
          alert('Не вдалося змінити назву папки');
        }
      },
      error: function () {
        alert('Помилка при зміні назви папки');
      }
    });
  });

  // Закриття модального вікна редагування
  $(document).on('click', '#rename-folder-modal .close-modal', function () {
    $('#rename-folder-modal').fadeOut();
  });

  // Закриття модального вікна при кліку поза ним
  $(document).mouseup(function (e) {
    const modal = $('#rename-folder-modal');
    const modalContent = modal.find('.modal-content');
    if (!modalContent.is(e.target) && modalContent.has(e.target).length === 0) {
      modal.fadeOut();
    }
  });

  // Перехід у папку при кліку на назву
  $(document).on('click', '.folder-title', function () {
    const id = $(this).data('id');
    window.location.href = `/notes/folder/${id}/`;
  });

  // Повернення нотатки з папки
  $(document).on('click', '.return-from-folder', function (e) {
    e.preventDefault();
    const noteId = $(this).data('note-id');
    const noteBlock = $(this).closest('.note-block');

    $.ajax({
      type: 'POST',
      url: `/notes/return_note_from_folder/${noteId}/`,
      success: function (response) {
        if (response.success) {
          noteBlock.fadeOut(300, function () {
            $(this).remove();
            // Якщо це була остання нотатка в папці
            if ($('.note-block').length === 0) {
              $('.note-list').html('<p>У цій папці поки немає нотаток.</p>');
            }
          });
        }
      },
      error: function () {
        alert('Помилка при поверненні нотатки з папки.');
      }
    });
  });
});