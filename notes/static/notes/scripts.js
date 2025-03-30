$(document).ready(function () {
  // Отримуємо CSRF токен з мета-тега
  const csrfToken = $('meta[name="csrf-token"]').attr('content');

  // ===== AJAX: додавання нотатки =====
  $('#add-note-form').submit(function (e) {
    e.preventDefault();

    const form = $(this);
    const url = '/notes/add/';
    const data = form.serialize();

    $.ajax({
      type: 'POST',
      url: url,
      data: data,
      success: function (response) {
        if (response.success) {
          $('.note-list').prepend(response.note_html);
          form[0].reset();
        }
      },
      error: function () {
        alert('Сталася помилка при збереженні нотатки.');
      }
    });
  });

  // ====== КОРЗИНА (делегування) ======

  // Відновити одну нотатку
  $(document).on('click', '.restore-note', function () {
    const block = $(this).closest('.note-block');
    const noteId = block.data('id');

    $.post(`/notes/trash/restore/${noteId}/`, {
      'csrfmiddlewaretoken': csrfToken
    }, function () {
      block.fadeOut(300, function () {
        $(this).remove();
        if ($('.note-block').length === 0) {
          $('#trash-list').html('<p>Корзина порожня.</p>');
        }
      });
    });
  });

  // Видалити одну нотатку назавжди
  $(document).on('click', '.delete-note', function () {
    const block = $(this).closest('.note-block');
    const noteId = block.data('id');

    $.post(`/notes/trash/delete_forever/${noteId}/`, {
      'csrfmiddlewaretoken': csrfToken
    }, function () {
      block.fadeOut(300, function () {
        $(this).remove();
        if ($('.note-block').length === 0) {
          $('#trash-list').html('<p>Корзина порожня.</p>');
        }
      });
    });
  });

  // Відновити всі
  $(document).on('click', '.restore-all', function () {
    $.post(`/notes/trash/restore_all/`, {
      'csrfmiddlewaretoken': csrfToken
    }, function () {
      $('#trash-list').fadeOut(300, function () {
        $(this).html('<p>Усі нотатки відновлено.</p>').fadeIn();
      });
    });
  });

  // Видалити всі
  $(document).on('click', '.delete-all', function () {
    $.post(`/notes/trash/delete_all/`, {
      'csrfmiddlewaretoken': csrfToken
    }, function () {
      $('#trash-list').fadeOut(300, function () {
        $(this).html('<p>Усі нотатки видалено назавжди.</p>').fadeIn();
      });
    });
  });
});