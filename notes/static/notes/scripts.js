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

  $(document).on('click', '.delete-folder', function () {
    currentFolderId = $(this).data('id');
    $('#delete-folder-modal').fadeIn();
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
    const modal = $('#delete-folder-modal .modal-content');
    if (!modal.is(e.target) && modal.has(e.target).length === 0) {
      $('#delete-folder-modal').fadeOut();
    }
  });

  // Редагування назви папки
  $(document).on('click', '.rename-folder', function () {
    const id = $(this).data('id');
    const title = $(`.folder-title[data-id="${id}"]`);
    const newName = title.text().trim();

    $.post(`/notes/rename_folder/${id}/`, {
      new_name: newName
    });
  });

  // Перехід у папку при кліку на назву
  $(document).on('click', '.folder-title', function () {
    const id = $(this).data('id');
    window.location.href = `/notes/folder/${id}/`;
  });
});