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

  // ====== Функції для модальних вікон ======
  function showModal(modal) {
    modal.css('display', 'flex').hide().fadeIn(200);
  }

  function hideModal(modal) {
    modal.fadeOut(200);
  }

  // Закриття всіх модалок при кліку на кнопку з класом .close-modal
  $(document).on('click', '.close-modal', function () {
    const modal = $(this).closest('.modal');
    if (modal.length) {
      hideModal(modal);
    }
  });

  // Закриття модалки при кліку поза нею (універсальний обробник)
  $(document).mouseup(function (e) {
    $('.modal').each(function () {
      const modal = $(this);
      const modalContent = modal.find('.modal-content');
      if (modal.is(':visible') && !modalContent.is(e.target) && modalContent.has(e.target).length === 0) {
        // Проста перевірка, чи клік не по кнопці, що відкриває модалку
        // Може знадобитися більш точна логіка для деяких випадків
        // if (!$(e.target).closest('[data-modal-trigger]').length) {
        hideModal(modal);
        // }
      }
    });
  });

  // ====== AJAX: створення нотатки ======
  $('#add-note-form').submit(function (e) {
    e.preventDefault();
    const form = $(this);
    if (form.data('submitting')) return;
    form.data('submitting', true);
    const submitButton = form.find('button[type="submit"]');
    const originalButtonText = submitButton.text();
    submitButton.text('Додавання...').prop('disabled', true);

    $.ajax({
      type: 'POST',
      url: form.attr('action'),
      data: form.serialize(),
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      success: function (response) {
        if (response.success) {
          // Вставляємо нову нотатку
          const noteList = $('.note-list');
          noteList.prepend(response.note_html);
          noteList.find('.note-block').first().hide().fadeIn(); // Плавне з'явлення нотатки
          form[0].reset(); // Очищуємо форму
        } else {
          alert('Не вдалося додати нотатку. ' + (response.error || ''));
        }
      },
      complete: function () {
        form.data('submitting', false);
        submitButton.text(originalButtonText).prop('disabled', false);
      },
      error: function (xhr) {
        alert('Помилка при створенні нотатки: ' + xhr.statusText);
      }
    });
  });

  // ====== AJAX: створення папки ======
  $('#create-folder-form').submit(function (e) {
    e.preventDefault();
    const form = $(this);
    if (form.data('submitting')) return;
    form.data('submitting', true);
    const submitButton = form.find('button[type="submit"]');
    const originalButtonText = submitButton.text();
    submitButton.text('Створення...').prop('disabled', true);

    $.ajax({
      type: 'POST',
      url: '/notes/create_folder/',
      data: form.serialize(),
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      success: function (response) {
        if (response.success) {
          location.reload(); // Перезавантажуємо сторінку для оновлення списку папок
        }
        else {
          alert('Не вдалося створити папку. ' + (response.error || ''));
        }
      },
      complete: function () {
        form.data('submitting', false);
        submitButton.text(originalButtonText).prop('disabled', false);
      },
      error: function (xhr) {
        alert('Сталася помилка при створенні папки: ' + xhr.statusText);
      }
    });
  });

  // ====== DRAG & DROP для нотаток ======
  let draggedNote = null;

  // Використовуємо делегування подій для динамічно доданих нотаток
  $(document).on('dragstart', '.note-block', function (e) {
    // Перевірка, чи елемент дійсно має бути перетягуваним (не в кошику)
    if ($(this).closest('#trash-list').length > 0) {
      e.preventDefault();
      return;
    }
    draggedNote = $(this);
    draggedNote.addClass('dragging');
    // Встановлюємо дані для перетягування
    if (e.originalEvent && e.originalEvent.dataTransfer) {
      e.originalEvent.dataTransfer.setData('text/plain', draggedNote.data('id')); // Використовуємо 'text/plain'
      e.originalEvent.dataTransfer.effectAllowed = 'move';
    } else {
      // Для старих браузерів або jQuery подій
      e.originalEvent.dataTransfer.setData('note-id', draggedNote.data('id'));
    }

    // Невелике зменшення для візуального ефекту
    setTimeout(() => {
      if (draggedNote && draggedNote.hasClass('dragging')) {
        draggedNote.css({ opacity: '0.7', transform: 'scale(0.95)' });
      }
    }, 0);
  });

  $(document).on('dragend', '.note-block', function () {
    const currentNote = $(this);
    // Знімаємо стилі перетягування, якщо вони ще є
    if (currentNote.hasClass('dragging')) {
      currentNote.removeClass('dragging');
      currentNote.css({ opacity: '1', transform: 'scale(1)' });
    }
    // Скидаємо класи drag-over з усіх папок
    $('.folder-block.drag-over').removeClass('drag-over');
    draggedNote = null;
  });

  $(document).on('dragover', '.folder-block.dropzone', function (e) {
    e.preventDefault(); // Необхідно для спрацювання drop
    e.stopPropagation();
    if (e.originalEvent && e.originalEvent.dataTransfer) {
      e.originalEvent.dataTransfer.dropEffect = 'move';
    }
    // Додаємо клас візуального фідбеку
    $(this).addClass('drag-over');
  });

  $(document).on('dragleave', '.folder-block.dropzone', function (e) {
    e.preventDefault();
    e.stopPropagation();
    // Прибираємо клас візуального фідбеку
    $(this).removeClass('drag-over');
  });

  $(document).on('drop', '.folder-block.dropzone', function (e) {
    e.preventDefault();
    e.stopPropagation();
    const folderBlock = $(this);
    folderBlock.removeClass('drag-over'); // Прибираємо підсвітку

    const folderId = folderBlock.data('folder-id');
    const noteId = e.originalEvent.dataTransfer.getData('text/plain') || e.originalEvent.dataTransfer.getData('note-id'); // Отримуємо ID нотатки

    if (!noteId || !folderId) {
      console.error('Не вдалося отримати ID нотатки або папки.');
      return;
    }

    const originalNoteElement = $(`.note-block[data-id="${noteId}"]`);

    $.ajax({
      type: 'POST',
      url: '/notes/move_note_to_folder/', // Переконайся, що URL правильний
      data: {
        note_id: noteId,
        folder_id: folderId
      },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      success: function (response) {
        if (response.success) {
          // Плавно приховуємо і видаляємо оригінальну нотатку
          if (originalNoteElement.length) {
            originalNoteElement.fadeOut(300, function () {
              $(this).remove();
            });
          }
          // Можна додати повідомлення про успіх або оновити лічильник нотаток у папці
        } else {
          alert('Не вдалося перемістити нотатку: ' + (response.error || 'Помилка сервера'));
          // Повертаємо нотатку до нормального стану, якщо щось пішло не так
          if (originalNoteElement.length) {
            originalNoteElement.removeClass('dragging').css({ opacity: '1', transform: 'scale(1)' });
          }
        }
      },
      error: function (xhr) {
        alert('Помилка мережі при переміщенні нотатки: ' + xhr.statusText);
        if (originalNoteElement.length) {
          originalNoteElement.removeClass('dragging').css({ opacity: '1', transform: 'scale(1)' });
        }
      }
    });
  });

  // ====== КОРЗИНА ======
  // Використовуємо делегування подій для кнопок у кошику
  $(document).on('click', '.restore-note', function () {
    const noteBlock = $(this).closest('.note-block');
    const noteId = noteBlock.data('id');
    if (!noteId) return;

    $.post(`/notes/trash/restore/${noteId}/`, {}, function (response) {
      if (response.success) {
        noteBlock.fadeOut(300, function () {
          $(this).remove();
          // Перевірка, чи кошик порожній
          if ($('#trash-list .note-block').length === 0) {
            $('#trash-list').html('<p class="subscription-empty">Корзина порожня.</p>'); // Використовуємо стиль .subscription-empty
          }
        });
      } else {
        alert('Не вдалося відновити нотатку.');
      }
    }).fail(function () {
      alert('Помилка сервера при відновленні нотатки.');
    });
  });

  $(document).on('click', '.delete-note', function () {
    const noteBlock = $(this).closest('.note-block');
    const noteId = noteBlock.data('id');
    if (!noteId) return;

    if (confirm('Ви впевнені, що хочете видалити цю нотатку назавжди?')) {
      $.post(`/notes/trash/delete_forever/${noteId}/`, {}, function (response) {
        if (response.success) {
          noteBlock.fadeOut(300, function () {
            $(this).remove();
            if ($('#trash-list .note-block').length === 0) {
              $('#trash-list').html('<p class="subscription-empty">Корзина порожня.</p>');
            }
          });
        } else {
          alert('Не вдалося видалити нотатку.');
        }
      }).fail(function () {
        alert('Помилка сервера при видаленні нотатки.');
      });
    }
  });

  // Масові дії в кошику
  $('.restore-all').click(function () {
    if (confirm('Відновити всі нотатки з кошика?')) {
      $.post(`/notes/trash/restore_all/`, {}, function (response) {
        if (response.success) {
          $('#trash-list').fadeOut(300, function () {
            $(this).html('<p class="subscription-empty">Усі нотатки відновлено.</p>').fadeIn();
          });
        } else {
          alert('Не вдалося відновити всі нотатки.');
        }
      }).fail(function () {
        alert('Помилка сервера при відновленні всіх нотаток.');
      });
    }
  });

  $('.delete-all').click(function () {
    if (confirm('Видалити всі нотатки з кошика назавжди? Цю дію неможливо скасувати.')) {
      $.post(`/notes/trash/delete_all/`, {}, function (response) { // Використовуємо delete_all
        if (response.success) {
          $('#trash-list').fadeOut(300, function () {
            $(this).html('<p class="subscription-empty">Усі нотатки видалено назавжди.</p>').fadeIn();
          });
        } else {
          alert('Не вдалося видалити всі нотатки.');
        }
      }).fail(function () {
        alert('Помилка сервера при видаленні всіх нотаток.');
      });
    }
  });

  // ====== ПАПКИ: видалення та редагування ======
  let currentFolderIdToDelete = null;
  let currentFolderIdToRename = null;

  // Відкриття модалки видалення папки
  $(document).on('click', '.delete-folder', function (e) {
    e.preventDefault();
    currentFolderIdToDelete = $(this).data('id');
    if (currentFolderIdToDelete) {
      showModal($('#delete-folder-modal'));
    }
  });

  // Підтвердження видалення папки (нова логіка з однією кнопкою)
  $('#delete-folder-confirm').click(function () {
    if (!currentFolderIdToDelete) return;

    $.post(`/notes/delete_folder/${currentFolderIdToDelete}/`, {
      action: 'delete_with_notes' // Завжди видаляємо з нотатками
    }, function (response) {
      if (response.success) {
        // Можна просто перезавантажити сторінку або видалити елемент папки
        $(`.folder-block[data-folder-id="${currentFolderIdToDelete}"]`).fadeOut(300, function () {
          $(this).remove();
          hideModal($('#delete-folder-modal'));
        });
        // location.reload();
      } else {
        alert('Не вдалося видалити папку.');
        hideModal($('#delete-folder-modal'));
      }
    }).fail(function () {
      alert('Помилка сервера при видаленні папки.');
      hideModal($('#delete-folder-modal'));
    });
  });

  // Відкриття модалки перейменування папки
  $(document).on('click', '.rename-folder', function (e) {
    e.preventDefault();
    currentFolderIdToRename = $(this).data('id');
    // Знаходимо h3 всередині батьківського .folder-block
    const folderBlock = $(this).closest('.folder-block');
    const currentName = folderBlock.find('h3').text().trim();

    if (currentFolderIdToRename) {
      $('#new-folder-name').val(currentName); // Встановлюємо поточну назву в інпут
      showModal($('#rename-folder-modal'));
    }
  });

  // Збереження нової назви папки
  $('#save-folder-name').click(function () {
    const newName = $('#new-folder-name').val().trim();
    if (!newName || !currentFolderIdToRename) {
      alert('Назва папки не може бути порожньою.');
      return;
    }

    $.ajax({
      type: 'POST',
      url: `/notes/rename_folder/${currentFolderIdToRename}/`,
      data: {
        new_name: newName
      },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      success: function (response) {
        if (response.success) {
          // Оновлюємо назву папки в DOM
          $(`.folder-block[data-folder-id="${currentFolderIdToRename}"]`).find('h3').text(newName);
          hideModal($('#rename-folder-modal'));
          // Додаємо тимчасове повідомлення про успіх
          // Можна використовувати більш витончений механізм сповіщень
          console.log('Назву папки змінено!');
        } else {
          alert('Не вдалося змінити назву папки. ' + (response.error || ''));
        }
      },
      error: function (xhr) {
        alert('Помилка при зміні назви папки: ' + xhr.statusText);
      }
    });
  });

  // ====== ПЕРЕМІЩЕННЯ НОТАТКИ В ПАПКУ (через модальне вікно) ======
  let noteIdToMove = null;

  // Відкриття модалки "Додати у папку"
  $(document).on('click', '.add-to-folder', function (e) {
    e.preventDefault();
    noteIdToMove = $(this).data('note-id');
    if (!noteIdToMove) return;

    const modal = $('#add-to-folder-modal');
    const select = $('#folder-select');
    select.empty().append('<option value="" disabled selected>-- Завантаження папок... --</option>'); // Очищуємо і показуємо завантаження

    // Робимо AJAX запит для отримання списку папок
    $.ajax({
      url: '/notes/get_folders/', // URL для отримання списку папок
      type: 'GET',
      success: function (response) {
        if (response.folders && response.folders.length > 0) {
          select.empty().append('<option value="" disabled selected>-- Виберіть папку --</option>'); // Очищуємо і додаємо плейсхолдер
          response.folders.forEach(function (folder) {
            select.append(new Option(folder.name, folder.id));
          });
          showModal(modal);
        } else {
          select.empty().append('<option value="" disabled selected>-- Немає доступних папок --</option>');
          // Можна показати повідомлення, що папок немає, або приховати кнопку переміщення
          alert('У вас немає створених папок для переміщення.');
        }
      },
      error: function () {
        alert('Не вдалося завантажити список папок.');
        select.empty().append('<option value="" disabled selected>-- Помилка завантаження --</option>');
      }
    });
  });

  // Підтвердження переміщення нотатки
  $('#move-note-confirm').click(function () {
    const folderId = $('#folder-select').val();

    if (!noteIdToMove || !folderId) {
      alert('Будь ласка, виберіть папку.');
      return;
    }

    $.ajax({
      type: 'POST',
      url: '/notes/move_note_to_folder/', // Використовуємо той самий URL, що і для drag-n-drop
      data: {
        note_id: noteIdToMove,
        folder_id: folderId
      },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      success: function (response) {
        if (response.success) {
          hideModal($('#add-to-folder-modal'));
          // Приховуємо нотатку зі списку (якщо вона на поточній сторінці)
          $(`.note-block[data-id="${noteIdToMove}"]`).fadeOut(300, function () { $(this).remove(); });
          alert('Нотатку успішно переміщено.');
          // Опціонально: оновити лічильники або перезавантажити частину сторінки
        } else {
          alert('Не вдалося перемістити нотатку: ' + (response.error || ''));
        }
      },
      error: function (xhr) {
        alert('Помилка мережі при переміщенні нотатки: ' + xhr.statusText);
      }
    });
  });

  // ====== ПОВЕРНЕННЯ НОТАТКИ З ПАПКИ ======
  $(document).on('click', '.return-from-folder', function (e) {
    e.preventDefault();
    const noteBlock = $(this).closest('.note-block');
    const noteId = noteBlock.data('note-id'); // Перевіряємо атрибут data-note-id
    if (!noteId) return;

    $.ajax({
      type: 'POST',
      url: `/notes/return_note_from_folder/${noteId}/`,
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      success: function (response) {
        if (response.success) {
          noteBlock.fadeOut(300, function () {
            $(this).remove();
            // Перевірка, чи папка порожня
            if ($('.note-list .note-block').length === 0) {
              $('.note-list').html('<p class="subscription-empty">У цій папці поки немає нотаток.</p>');
            }
          });
        } else {
          alert('Не вдалося повернути нотатку.');
        }
      },
      error: function (xhr) {
        alert('Помилка при поверненні нотатки з папки: ' + xhr.statusText);
      }
    });
  });

  // ====== РОЗГОРТАННЯ ТЕКСТУ НОТАТОК ======
  $(document).on('click', '.expand-btn', function () {
    const button = $(this);
    const content = button.closest('.note-block').find('.note-content'); // Знаходимо контент відносно .note-block
    if (!content.length) return;

    content.toggleClass('expanded');
    button.text(content.hasClass('expanded') ? 'Згорнути' : 'Показати більше');
  });

  /* === Анімація кубів для сторінки привітання === */
  if ($('body').hasClass('welcome-page')) {
    const cubes = [];
    const numCubes = 25; // Кількість кубів
    const container = $('body'); // Анімація на весь екран

    for (let i = 0; i < numCubes; i++) {
      const cube = $('<div class="cube"></div>');
      const size = Math.random() * 50 + 10; // Розмір від 10 до 60
      const initialX = Math.random() * window.innerWidth;
      const initialY = window.innerHeight + size + Math.random() * 100; // Починають знизу
      const speed = Math.random() * 1.5 + 0.5; // Швидкість підйому
      const drift = (Math.random() - 0.5) * 0.3; // Горизонтальний дрейф
      const rotationSpeed = (Math.random() - 0.5) * 0.5; // Швидкість обертання

      cube.css({
        width: size + 'px',
        height: size + 'px',
        left: initialX + 'px',
        top: initialY + 'px',
        opacity: Math.random() * 0.5 + 0.1 // Різна прозорість
      });

      container.append(cube);

      cubes.push({
        el: cube,
        x: initialX,
        y: initialY,
        speed: speed,
        drift: drift,
        rotation: 0,
        rotationSpeed: rotationSpeed,
        initialSize: size
      });
    }

    function animateCubes() {
      const h = window.innerHeight;
      const w = window.innerWidth;

      cubes.forEach(c => {
        c.y -= c.speed; // Рух вгору
        c.x += c.drift; // Горизонтальний дрейф
        c.rotation += c.rotationSpeed; // Обертання

        // Повернення куба вниз, якщо він вийшов за верхній край
        if (c.y < -c.initialSize) {
          c.y = h + c.initialSize + Math.random() * 50;
          c.x = Math.random() * w;
        }
        // Невелике коригування, якщо виходить за бічні краї
        if (c.x < -c.initialSize || c.x > w) {
          c.drift *= -1; // Змінюємо напрямок дрейфу
        }

        c.el.css({
          top: c.y + 'px',
          left: c.x + 'px',
          transform: `rotate(${c.rotation}deg)`
        });
      });

      requestAnimationFrame(animateCubes);
    }

    animateCubes();
  }
  /* === Кінець анімації кубів === */

  // ====== ПІДПИСКИ/ВІДПИСКИ ======
  $(document).on('click', '.unsubscribe-btn', function () {
    const card = $(this).closest('.subscription-card');
    const userId = card.data('subscription-id'); // Перевіряємо data-subscription-id
    if (!userId) return;

    if (confirm('Ви дійсно хочете відписатися від цього користувача?')) {
      $.ajax({
        url: `/notes/unsubscribe/${userId}/`,
        type: 'POST',
        headers: { 'X-CSRFToken': csrfToken }, // Використовуємо отриманий токен
        success: function (response) {
          if (response.success) {
            card.fadeOut(300, function () {
              $(this).remove();
              if ($('.subscription-card').length === 0) {
                // Оновлюємо контейнер, якщо підписок не залишилось
                // Переконайся, що URL в href правильний
                $('#subscriptions-list-container').html(`
                    <div class="subscription-empty">
                        <p>У вас поки немає підписок.</p>
                    </div>
                `);
              }
            });
          } else {
            alert('Не вдалося відписатися.');
          }
        },
        error: function () {
          alert('Помилка сервера при відписці.');
        }
      });
    }
  });

  // Обробка запитів на підписку (Прийняти/Відхилити)
  $(document).on('click', '.request-actions .btn', function () {
    const button = $(this);
    const card = button.closest('.request-card');
    const requestId = card.data('request-id');
    const action = button.hasClass('accept') ? 'accept' : 'reject'; // Визначаємо дію за класом кнопки
    if (!requestId) return;

    $.ajax({
      url: `/notes/handle_subscription_request/${requestId}/`,
      type: 'POST',
      data: { action: action },
      headers: { 'X-CSRFToken': csrfToken },
      success: function (response) {
        if (response.success) {
          card.fadeOut(300, function () { $(this).remove(); });
          // Можна додати повідомлення
        } else {
          alert('Не вдалося обробити запит: ' + (response.error || ''));
        }
      },
      error: function () {
        alert('Помилка сервера при обробці запиту.');
      }
    });
  });

  // ====== ПОШУК НОТАТОК ======
  function performSearch() {
    const query = $('#search-input').val().trim();
    if (query.length < 2) { // Мінімальна довжина запиту
      // Можна додати повідомлення або нічого не робити
      return;
    }
    const searchButton = $('#search-button');
    const originalButtonText = searchButton.text();
    searchButton.text('Пошук...').prop('disabled', true);

    $.ajax({
      url: '/notes/search/',
      type: 'GET',
      data: { q: query },
      success: function (response) {
        const resultsList = $('#search-results-list');
        resultsList.empty(); // Очищаємо перед додаванням нових

        if (response.notes && response.notes.length > 0) {
          response.notes.forEach(function (note) {
            // Генеруємо HTML для результату пошуку
            // Переконайся, що note.url, note.title, note.text_snippet існують
            const noteElement = `
              <div class="search-result-item" style="padding: 15px; border-bottom: 1px solid #495057;">
                <h3 style="margin-bottom: 5px; font-size: 1.1rem;">
                    <a href="${note.url || '#'}" style="color: #e9ecef;">${note.title || 'Без назви'}</a>
                </h3>
                <p style="color: #adb5bd; font-size: 0.9rem; margin: 0;">${note.text_snippet || ''}</p>
              </div>
            `;
            resultsList.append(noteElement);
          });
          // Додаємо стилі для останнього елемента
          resultsList.find('.search-result-item:last-child').css('border-bottom', 'none');
        } else {
          resultsList.html('<p style="text-align: center; padding: 20px; color: #adb5bd;">Нічого не знайдено.</p>');
        }
        showModal($('#search-results-modal')); // Показуємо модалку з результатами
      },
      error: function (xhr) {
        alert('Помилка під час пошуку: ' + xhr.statusText);
      },
      complete: function () {
        searchButton.text(originalButtonText).prop('disabled', false);
      }
    });
  }

  // Обробник для кнопки пошуку
  $('#search-button').click(function () {
    performSearch();
  });

  // Обробник для натискання Enter у полі пошуку
  $('#search-input').keypress(function (e) {
    if (e.which == 13) { // Код клавіші Enter
      e.preventDefault(); // Запобігаємо стандартній дії (якщо поле в формі)
      performSearch();
    }
  });

  // ====== ЗМІНА ФОТО ПРОФІЛЮ ======
  // Відкриття вікна вибору файлу при кліку на фото/іконку
  $('.profile-photo-label').click(function () {
    $('#photo-upload-input').click();
  });
  // Автоматична відправка форми при виборі файлу
  $('#photo-upload-input').change(function () {
    if (this.files && this.files[0]) {
      $('#photo-upload-form').submit();
    }
  });
});