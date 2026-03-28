// notifications.js

$(function () {
  setupAjax();

  if ($('#notifications-page').length) {
    authGuard();
    const PAGE_SIZE = 10;
    let allNotifs = [], currentPage = 1;

    const typeConfig = {
      event:        { icon: '🗓', badge: 'bg-indigo-100 text-indigo-700' },
      announcement: { icon: '📢', badge: 'bg-yellow-100 text-yellow-700' },
      promo:        { icon: '🎬', badge: 'bg-pink-100 text-pink-700' },
      general:      { icon: '🔔', badge: 'bg-gray-100 text-gray-600' }
    };

    function render(data) {
      const $list = $('#notif-list');
      $list.empty();
      const start = (currentPage - 1) * PAGE_SIZE;
      const slice = data.slice(start, start + PAGE_SIZE);

      if (!slice.length) {
        $list.html('<div class="text-center py-16 text-gray-400"><p class="text-4xl mb-3">🔔</p><p class="font-medium">No notifications yet.</p></div>');
        return;
      }

      slice.forEach(n => {
        const cfg = typeConfig[n.type] || typeConfig.general;
        const deleteBtn = isAdmin()
          ? `<button class="notif-delete flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition" data-id="${n.id}" aria-label="Delete notification">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>` : '';
        let link = '#';
        if (n.metadata?.event_id) link = `event-detail.html?id=${n.metadata.event_id}`;

        $list.append(`<div class="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition ${n.read ? '' : 'bg-blue-50/50 border-l-4 border-indigo-400'}" data-id="${n.id}">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${cfg.badge.replace('text-', 'bg-').split(' ')[0]} bg-opacity-30">${cfg.icon}</div>
          <div class="flex-1 min-w-0 cursor-pointer" onclick="window.location='${link}'">
            <p class="font-semibold text-gray-800 text-sm">${n.title}</p>
            <p class="text-sm text-gray-500 mt-0.5 line-clamp-2">${n.message}</p>
            <div class="flex items-center gap-2 mt-1.5">
              <span class="badge ${cfg.badge}">${n.type || 'general'}</span>
              <span class="text-xs text-gray-400">${relativeTime(n.created_at)}</span>
              ${!n.read ? '<span class="w-2 h-2 bg-indigo-500 rounded-full"></span>' : ''}
            </div>
          </div>
          ${deleteBtn}
        </div>`);
      });

      const total = Math.ceil(data.length / PAGE_SIZE);
      $('#page-info').text(`Page ${currentPage} of ${Math.max(total, 1)}`);
      $('#prev-page').prop('disabled', currentPage === 1);
      $('#next-page').prop('disabled', currentPage >= total);
    }

    $.get(BASE_URL + '/api/notifications').done(res => {
      allNotifs = extractList(res, ['notifications', 'data', 'results']);
      render(allNotifs);
    });

    $(document).on('click', '.notif-delete', function (e) {
      e.stopPropagation();
      const id = $(this).data('id');
      $.ajax({ url: BASE_URL + '/api/notifications/' + id, method: 'DELETE' }).done(() => {
        allNotifs = allNotifs.filter(n => n.id !== id);
        $(this).closest('[data-id]').remove();
        showToast('Notification deleted.', 'success');
      });
    });

    $('#prev-page').on('click', () => { currentPage--; render(allNotifs); });
    $('#next-page').on('click', () => { currentPage++; render(allNotifs); });
  }
});
