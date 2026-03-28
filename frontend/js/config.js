/* ============================================================
   config.js — CivicEvents+ global helpers
   ============================================================ */

const BASE_URL = 'http://localhost:8080';

// ── Auth ──────────────────────────────────────────────────────
function getToken()  { return localStorage.getItem('ce_token'); }
function getUser()   { try { return JSON.parse(localStorage.getItem('ce_user')); } catch { return null; } }
function isAdmin()   { const u = getUser(); return u && u.role === 'admin'; }
function isLoggedIn(){ return !!getToken(); }

function logout(msg) {
  localStorage.removeItem('ce_token');
  localStorage.removeItem('ce_user');
  window.location.href = 'login.html' + (msg ? '?msg=' + encodeURIComponent(msg) : '');
}

function authGuard() {
  if (!isLoggedIn()) { logout(); return; }
  // ROLE-BASED GUARD: admins are allowed on all pages; only block unauthenticated users
}

function adminGuard() {
  if (!isLoggedIn()) { logout(); return; }
  if (!isAdmin()) {
    document.body.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-slate-50">
        <div class="text-center p-10 bg-white rounded-2xl shadow-lg max-w-sm">
          <p class="text-6xl mb-4">🔒</p>
          <h1 class="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
          <p class="text-slate-500 mb-6">You don't have permission to view this page.</p>
          <a href="events.html" class="btn-primary">← Back to Events</a>
        </div>
      </div>`;
    throw new Error('Forbidden');
  }
}

// ── jQuery AJAX setup ─────────────────────────────────────────
function setupAjax() {
  $.ajaxSetup({
    beforeSend(xhr) {
      const t = getToken();
      if (t) xhr.setRequestHeader('Authorization', 'Bearer ' + t);
    }
  });
  $(document).ajaxError(function (e, xhr, settings) {
    // Auth routes handle their own errors — skip global handler
    if (settings.url && (settings.url.includes('/api/auth/login') || settings.url.includes('/api/auth/signup'))) return;
    if (xhr.status === 401) logout('Session expired. Please log in again.');
    else if (xhr.status === 403) showToast('You don\'t have permission to do that.', 'error');
    else if (xhr.status === 404) showToast('Resource not found.', 'error');
    else if (xhr.status >= 500) showToast('Server error. Please try again.', 'error');
    else if (xhr.status === 0)  showNetworkBanner();
  });
}

// ── Universal response extractor ─────────────────────────────
function extractList(response, keys) {
  if (!response) return [];
  for (const key of keys) {
    if (Array.isArray(response[key])) return response[key];
  }
  if (Array.isArray(response)) return response;
  return [];
}

// ── Published filter (handles true / 1 / "true") ─────────────
function onlyPublished(items) {
  return items.filter(i => !!i.published);
}

// ── Media URL helpers ─────────────────────────────────────────
function eventImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const filename = url.replace(/^.*uploads\/events\//, '');
  return BASE_URL + '/uploads/events/' + filename;
}
function promoVideoUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const filename = url.replace(/^.*uploads\/promos\//, '');
  return BASE_URL + '/uploads/promos/' + filename;
}
function announcementAudioUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const filename = url.replace(/^.*uploads\/announcements\//, '');
  return BASE_URL + '/uploads/announcements/' + filename;
}

// ── Toast (bottom-right stack, slide-up) ─────────────────────
function showToast(msg, type = 'info', duration = 3500) {
  const palette = {
    success: 'bg-emerald-600',
    error:   'bg-red-600',
    warning: 'bg-amber-500',
    info:    'bg-indigo-600'
  };
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const bg = palette[type] || palette.info;
  const icon = icons[type] || icons.info;

  if (!$('#toast-container').length) {
    $('body').append('<div id="toast-container" class="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end"></div>');
  }
  const $t = $(`
    <div class="flex items-center gap-3 ${bg} text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl max-w-xs
                translate-y-4 opacity-0 transition-all duration-300">
      <span class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs flex-shrink-0">${icon}</span>
      <span>${msg}</span>
    </div>`);
  $('#toast-container').append($t);
  requestAnimationFrame(() => $t.removeClass('translate-y-4 opacity-0'));
  setTimeout(() => $t.addClass('opacity-0 translate-y-4'), duration);
  setTimeout(() => $t.remove(), duration + 350);
}

// ── Network banner ────────────────────────────────────────────
function showNetworkBanner() {
  if ($('#network-banner').length) return;
  $('body').append(`
    <div id="network-banner" class="fixed bottom-0 left-0 right-0 z-[9998] bg-red-700 text-white text-center py-3 text-sm flex items-center justify-center gap-4">
      <span>⚡ Unable to reach server. Check your connection.</span>
      <button onclick="location.reload()" class="bg-white text-red-700 px-3 py-1 rounded-lg font-semibold text-xs">Retry</button>
    </div>`);
}

// ── Relative time ─────────────────────────────────────────────
function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

// ── Format seconds → m:ss ─────────────────────────────────────
function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00';
  return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
}

// ── Skeleton card ─────────────────────────────────────────────
function skeletonCard() {
  return `<div class="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
    <div class="h-48 bg-slate-200"></div>
    <div class="p-5 space-y-3">
      <div class="h-4 bg-slate-200 rounded w-3/4"></div>
      <div class="h-3 bg-slate-200 rounded w-1/2"></div>
      <div class="h-3 bg-slate-200 rounded w-2/3"></div>
    </div>
  </div>`;
}

// ── Notification badge + drawer ───────────────────────────────
function loadNotificationBadge() {
  if (!isLoggedIn()) return;
  $.get(BASE_URL + '/api/notifications')
    .done(res => {
      const notifs = extractList(res, ['notifications', 'data', 'results']);
      const unread = notifs.filter(n => !n.read && !n.is_read).length;
      $('#notif-badge')
        .text(unread > 0 ? (unread > 9 ? '9+' : unread) : '')
        .toggleClass('hidden', unread === 0);
      renderNotifDrawer(notifs);
    })
    .fail(() => {});
}

function renderNotifDrawer(notifications) {
  const $list = $('#notif-drawer-list');
  if (!$list.length) return;
  $list.empty();

  if (!notifications.length) {
    $list.html(`
      <div class="flex flex-col items-center justify-center py-16 text-slate-400">
        <span class="text-5xl mb-3">🔔</span>
        <p class="font-semibold text-slate-500">No notifications yet</p>
        <p class="text-sm mt-1">You're all caught up!</p>
      </div>`);
    return;
  }

  const typeIcons   = { event: '🗓', announcement: '📢', promo: '🎬', broadcast: '📡' };
  const typeBadges  = {
    event:        'bg-indigo-100 text-indigo-700',
    announcement: 'bg-amber-100 text-amber-700',
    promo:        'bg-pink-100 text-pink-700',
    broadcast:    'bg-purple-100 text-purple-700'
  };

  notifications.forEach(n => {
    const icon   = typeIcons[n.type]  || '🔔';
    const badge  = typeBadges[n.type] || 'bg-slate-100 text-slate-600';
    const isRead = n.read || n.is_read;
    // ROLE-BASED GUARD: only admins see delete button in drawer
    const delBtn = isAdmin()
      ? `<button class="notif-delete flex-shrink-0 p-1 text-slate-300 hover:text-red-500 transition" data-id="${n.id}" aria-label="Delete notification">
           <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
         </button>` : '';
    let link = '#';
    if (n.metadata?.event_id) link = `event-detail.html?id=${n.metadata.event_id}`;

    $list.append(`
      <div class="flex items-start gap-3 px-4 py-3.5 border-b border-slate-100 hover:bg-slate-50 transition ${isRead ? '' : 'bg-indigo-50/60'}" data-id="${n.id}" data-link="${link}">
        <span class="text-xl flex-shrink-0 mt-0.5">${icon}</span>
        <div class="notif-item-body flex-1 min-w-0 ${link !== '#' ? 'cursor-pointer' : ''}">
          <p class="text-sm font-semibold text-slate-800 truncate">${n.title}</p>
          <p class="text-xs text-slate-500 mt-0.5 line-clamp-2">${n.message}</p>
          <div class="flex items-center gap-2 mt-1.5 flex-wrap">
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge}">${n.type || 'general'}</span>
            <span class="text-[11px] text-slate-400">${relativeTime(n.created_at)}</span>
            ${!isRead ? '<span class="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"></span>' : ''}
          </div>
        </div>
        ${delBtn}
      </div>`);
  });

  $list.off('click', '.notif-item-body').on('click', '.notif-item-body', function () {
    const link = $(this).closest('[data-link]').data('link');
    if (link && link !== '#') window.location.href = link;
  });

  $list.off('click', '.notif-delete').on('click', '.notif-delete', function (e) {
    e.stopPropagation();
    const id = $(this).data('id');
    $.ajax({ url: BASE_URL + '/api/notifications/' + id, method: 'DELETE' })
      .done(() => { $(this).closest('[data-id]').remove(); showToast('Notification deleted.', 'success'); });
  });
}
