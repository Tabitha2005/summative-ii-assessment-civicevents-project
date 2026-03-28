// dashboard.js — Admin only — CivicEvents+

var loadTab;    // exposed for mobile tab bar in dashboard.html
var switchTab;  // exposed for admin-nav.html

$(function () {
  setupAjax();
  adminGuard();

  // ── helpers ──────────────────────────────────────────────────
  // PostgreSQL COUNT(*) returns strings — always parseInt
  function n(val) { return parseInt(val, 10) || 0; }

  function tableWrap(headers, rows, emptyMsg) {
    if (!rows.length) {
      return `<div class="flex flex-col items-center justify-center py-16 text-slate-400">
        <span class="text-5xl mb-3">📭</span>
        <p class="font-semibold text-slate-500">${emptyMsg || 'No data yet.'}</p>
      </div>`;
    }
    const ths = headers.map(h =>
      `<th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">${h}</th>`
    ).join('');
    return `
      <div class="table-responsive rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table class="w-full text-left bg-white">
          <thead class="bg-slate-50 border-b border-slate-100"><tr>${ths}</tr></thead>
          <tbody class="divide-y divide-slate-50">${rows.join('')}</tbody>
        </table>
      </div>`;
  }

  function pubBadge(published) {
    return !!published
      ? `<span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">● Published</span>`
      : `<span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">● Draft</span>`;
  }

  function sectionHeader(title, btnHtml = '') {
    return `<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
      <h2 class="text-xl font-bold text-slate-800">${title}</h2>
      ${btnHtml}
    </div>`;
  }

  function loadingHtml() {
    return `<div class="flex items-center gap-3 p-6 text-slate-400 text-sm">
      <svg class="animate-spin w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Loading...
    </div>`;
  }

  // ── sidebar + tab switching ───────────────────────────────────
  switchTab = function (tab) {
    $('.tab-panel').addClass('hidden');
    $('#tab-' + tab).removeClass('hidden');
    $('.sidebar-link').removeClass('bg-indigo-50 text-indigo-700').addClass('text-slate-600');
    $(`.sidebar-link[data-tab="${tab}"]`).addClass('bg-indigo-50 text-indigo-700').removeClass('text-slate-600');
    // Sync admin nav top bar active state
    $('.admin-nav-tab').removeClass('bg-slate-700 text-white').addClass('text-slate-400');
    $(`.admin-nav-tab[data-tab="${tab}"]`).addClass('bg-slate-700 text-white').removeClass('text-slate-400');
    loadTab(tab);
  };

  $('.sidebar-link').on('click', function (e) {
    e.preventDefault();
    switchTab($(this).data('tab'));
  });

  loadTab = function (tab) {
    if      (tab === 'overview')       loadOverview();
    else if (tab === 'users')          loadUsers();
    else if (tab === 'events')         loadAdminEvents();
    else if (tab === 'announcements')  loadAdminAnnouncements();
    else if (tab === 'promos')         loadAdminPromos();
    else if (tab === 'notifications')  loadAdminNotifications();
    else if (tab === 'registrations')  loadAdminRegistrations();
  };

  // Load overview on start
  switchTab('overview');

  // ── OVERVIEW ─────────────────────────────────────────────────
  let barChart = null, doughnutChart = null;

  function loadOverview() {
    // Show skeleton numbers while loading
    ['stat-events','stat-promos','stat-users','stat-registrations','stat-notifications']
      .forEach(id => $('#' + id).html('<span class="inline-block w-8 h-6 bg-slate-200 rounded animate-pulse"></span>'));

    $.get(BASE_URL + '/api/dashboard/admin')
      .done(res => {
        const d = res.data || {};

        // ── stat cards — parseInt every value (PostgreSQL returns strings) ──
        const totalEvents        = n(d.events?.total_events);
        const totalPromos        = n(d.promos?.total_promos);
        const totalUsers         = n(d.users?.total_users);
        const totalRegistrations = n(d.registrations?.total_registrations);
        const totalNotifications = n(d.notifications?.total_notifications);
        const totalAnnouncements = n(d.announcements?.total_announcements);

        $('#stat-events').text(totalEvents);
        $('#stat-promos').text(totalPromos);
        $('#stat-users').text(totalUsers);
        $('#stat-registrations').text(totalRegistrations);
        $('#stat-notifications').text(totalNotifications);

        // Update sub-labels with extra context
        $('#stat-events-sub').text(n(d.events?.upcoming_events) + ' upcoming');
        $('#stat-users-sub').text(n(d.users?.active_users) + ' active');
        $('#stat-ann-badge').text(totalAnnouncements);

        // ── charts ──
        const growth = (d.user_growth || []).map(g => ({ month: g.month, new_users: n(g.new_users) }));

        const upcomingEvents   = n(d.events?.upcoming_events);
        const pastEvents       = n(d.events?.past_events);
        const unpublishedEvents = Math.max(0, totalEvents - upcomingEvents - pastEvents);

        if (barChart) { barChart.destroy(); barChart = null; }
        if (doughnutChart) { doughnutChart.destroy(); doughnutChart = null; }

        const barCtx = document.getElementById('bar-chart');
        const dCtx   = document.getElementById('doughnut-chart');

        if (barCtx && typeof Chart !== 'undefined') {
          barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
              labels: growth.length ? growth.map(g => g.month) : ['No data'],
              datasets: [{
                label: 'New Users',
                data: growth.length ? growth.map(g => g.new_users) : [0],
                backgroundColor: '#4338ca',
                borderRadius: 8,
                borderSkipped: false
              }]
            },
            options: {
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } }
              }
            }
          });
        }

        if (dCtx && typeof Chart !== 'undefined') {
          doughnutChart = new Chart(dCtx, {
            type: 'doughnut',
            data: {
              labels: ['Upcoming', 'Past', 'Unpublished'],
              datasets: [{
                data: [upcomingEvents, pastEvents, unpublishedEvents],
                backgroundColor: ['#4338ca', '#059669', '#e2e8f0'],
                borderWidth: 0,
                hoverOffset: 6
              }]
            },
            options: {
              responsive: true,
              cutout: '68%',
              plugins: {
                legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } }
              }
            }
          });
        }
      })
      .fail(() => {
        showToast('Could not load dashboard stats.', 'error');
        ['stat-events','stat-promos','stat-users','stat-registrations','stat-notifications']
          .forEach(id => $('#' + id).text('—'));
      });
  }

  // ── USERS ────────────────────────────────────────────────────
  function loadUsers() {
    $('#tab-users').html(loadingHtml());
    $.get(BASE_URL + '/api/users')
      .done(res => {
        const users = extractList(res, ['users', 'data', 'results']);
        const rows = users.map(u => {
          const initials = (u.full_name || '?').split(' ').map(c => c[0]).join('').toUpperCase().slice(0, 2);
          const joined   = u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
          return `<tr class="hover:bg-indigo-50/30 transition">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">${initials}</div>
                <div>
                  <p class="text-sm font-semibold text-slate-800">${u.full_name}</p>
                  <p class="text-xs text-slate-400">${u.email}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}">${u.role}</span>
            </td>
            <td class="px-4 py-3">
              <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}">${u.is_active ? 'Active' : 'Inactive'}</span>
            </td>
            <td class="px-4 py-3 text-xs text-slate-400">${joined}</td>
            <td class="px-4 py-3">
              <button class="toggle-user text-xs px-3 py-1.5 rounded-lg border font-medium transition
                ${u.is_active
                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}"
                data-id="${u.id}" data-active="${u.is_active}">
                ${u.is_active ? 'Disable' : 'Enable'}
              </button>
            </td>
          </tr>`;
        });

        $('#tab-users').html(
          sectionHeader(`Users <span class="text-base font-normal text-slate-400 ml-2">(${users.length} total)</span>`) +
          tableWrap(['User', 'Role', 'Status', 'Joined', 'Action'], rows, 'No users registered yet.')
        );

        $(document).off('click', '.toggle-user').on('click', '.toggle-user', function () {
          const id     = $(this).data('id');
          const active = $(this).data('active');
          const $btn   = $(this);
          $btn.prop('disabled', true).text('...');
          $.ajax({ url: BASE_URL + '/api/users/' + id + '/' + (active ? 'disable' : 'enable'), method: 'PATCH' })
            .done(() => {
              showToast('User ' + (active ? 'disabled.' : 'enabled.'), 'success');
              loadUsers();
              loadOverview(); // refresh stats
            })
            .fail(() => { showToast('Update failed.', 'error'); $btn.prop('disabled', false); });
        });
      })
      .fail(() => showToast('Could not load users.', 'error'));
  }

  // ── EVENTS ───────────────────────────────────────────────────
  function loadAdminEvents() {
    $('#tab-events').html(loadingHtml());
    $.get(BASE_URL + '/api/events')
      .done(res => {
        const events = extractList(res, ['events', 'data', 'results']);
        const rows = events.map(ev => `
          <tr class="hover:bg-indigo-50/30 transition">
            <td class="px-4 py-3">
              <p class="text-sm font-semibold text-slate-800 max-w-[200px] truncate">${ev.title}</p>
              <p class="text-xs text-slate-400">${ev.location || '—'}</p>
            </td>
            <td class="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">${ev.starts_at ? new Date(ev.starts_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'}</td>
            <td class="px-4 py-3">${pubBadge(ev.published)}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2 flex-wrap">
                <a href="event-form.html?id=${ev.id}" class="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition font-medium">Edit</a>
                <button class="del-event text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100 transition font-medium" data-id="${ev.id}">Delete</button>
              </div>
            </td>
          </tr>`);

        $('#tab-events').html(
          sectionHeader('Events', `<a href="event-form.html" class="btn-primary text-sm">+ New Event</a>`) +
          tableWrap(['Event', 'Date', 'Status', 'Actions'], rows, 'No events created yet.')
        );

        $(document).off('click', '.del-event').on('click', '.del-event', function () {
          const id = $(this).data('id');
          if (!confirm('Delete this event? This cannot be undone.')) return;
          $.ajax({ url: BASE_URL + '/api/events/' + id, method: 'DELETE' })
            .done(() => { showToast('Event deleted.', 'success'); loadAdminEvents(); loadOverview(); })
            .fail(() => showToast('Delete failed.', 'error'));
        });
      })
      .fail(() => showToast('Could not load events.', 'error'));
  }

  // ── ANNOUNCEMENTS ────────────────────────────────────────────
  function loadAdminAnnouncements() {
    $('#tab-announcements').html(loadingHtml());
    $.get(BASE_URL + '/api/announcements')
      .done(res => {
        const items = extractList(res, ['announcements', 'data', 'results']);
        const rows = items.map(a => `
          <tr class="hover:bg-indigo-50/30 transition">
            <td class="px-4 py-3 text-sm font-semibold text-slate-800">${a.title}</td>
            <td class="px-4 py-3">${pubBadge(a.published)}</td>
            <td class="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">${new Date(a.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2 flex-wrap">
                <a href="announcement-detail.html?id=${a.id}" class="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition font-medium">▶ Play</a>
                <a href="announcement-form.html?id=${a.id}" class="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition font-medium">Edit</a>
                <button class="del-ann text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100 transition font-medium" data-id="${a.id}">Delete</button>
              </div>
            </td>
          </tr>`);

        $('#tab-announcements').html(
          sectionHeader('Announcements', `<a href="announcement-form.html" class="btn-primary text-sm">+ New Announcement</a>`) +
          tableWrap(['Title', 'Status', 'Date', 'Actions'], rows, 'No announcements created yet.')
        );

        $(document).off('click', '.del-ann').on('click', '.del-ann', function () {
          const id = $(this).data('id');
          if (!confirm('Delete this announcement?')) return;
          $.ajax({ url: BASE_URL + '/api/announcements/' + id, method: 'DELETE' })
            .done(() => { showToast('Deleted.', 'success'); loadAdminAnnouncements(); loadOverview(); })
            .fail(() => showToast('Delete failed.', 'error'));
        });
      })
      .fail(() => showToast('Could not load announcements.', 'error'));
  }

  // ── PROMOS ───────────────────────────────────────────────────
  function loadAdminPromos() {
    $('#tab-promos').html(loadingHtml());
    $.get(BASE_URL + '/api/promos')
      .done(res => {
        const items = extractList(res, ['promos', 'data', 'results']);
        const rows = items.map(p => `
          <tr class="hover:bg-indigo-50/30 transition">
            <td class="px-4 py-3 text-sm font-semibold text-slate-800 max-w-[200px] truncate">${p.title}</td>
            <td class="px-4 py-3">${pubBadge(p.published)}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2 flex-wrap">
                <a href="promo-form.html?id=${p.id}" class="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition font-medium">Edit</a>
                <button class="toggle-promo-pub text-xs border px-2.5 py-1 rounded-lg transition font-medium
                  ${!!p.published ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}"
                  data-id="${p.id}" data-pub="${!!p.published ? '1' : '0'}">
                  ${!!p.published ? 'Unpublish' : 'Publish'}
                </button>
                <button class="del-promo text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100 transition font-medium" data-id="${p.id}">Delete</button>
              </div>
            </td>
          </tr>`);

        $('#tab-promos').html(
          sectionHeader('Promos', `<a href="promo-form.html" class="btn-primary text-sm">+ New Promo</a>`) +
          tableWrap(['Title', 'Status', 'Actions'], rows, 'No promos created yet.')
        );

        $(document).off('click', '.del-promo').on('click', '.del-promo', function () {
          const id = $(this).data('id');
          if (!confirm('Delete this promo?')) return;
          $.ajax({ url: BASE_URL + '/api/promos/' + id, method: 'DELETE' })
            .done(() => { showToast('Deleted.', 'success'); loadAdminPromos(); loadOverview(); })
            .fail(() => showToast('Delete failed.', 'error'));
        });

        $(document).off('click', '.toggle-promo-pub').on('click', '.toggle-promo-pub', function () {
          const id  = $(this).data('id');
          const pub = $(this).data('pub') === '1';
          $.ajax({ url: BASE_URL + '/api/promos/' + id + '/' + (pub ? 'unpublish' : 'publish'), method: 'PATCH' })
            .done(() => {
              showToast(pub ? 'Promo unpublished.' : '✓ Promo published! Users can now see it.', pub ? 'info' : 'success');
              loadAdminPromos();
              loadOverview();
            })
            .fail(() => showToast('Update failed.', 'error'));
        });
      })
      .fail(() => showToast('Could not load promos.', 'error'));
  }

  // ── NOTIFICATIONS ────────────────────────────────────────────
  function loadAdminNotifications() {
    $('#tab-notifications').html(loadingHtml());
    $.get(BASE_URL + '/api/notifications')
      .done(res => {
        const items = extractList(res, ['notifications', 'data', 'results']);
        const typeColors = {
          event:        'bg-indigo-100 text-indigo-700',
          announcement: 'bg-amber-100 text-amber-700',
          promo:        'bg-pink-100 text-pink-700',
          broadcast:    'bg-purple-100 text-purple-700'
        };
        const rows = items.map(notif => `
          <tr class="hover:bg-indigo-50/30 transition">
            <td class="px-4 py-3 text-sm font-semibold text-slate-800">${notif.title}</td>
            <td class="px-4 py-3 text-xs text-slate-500 max-w-[220px] truncate">${notif.message}</td>
            <td class="px-4 py-3">
              <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${typeColors[notif.type] || 'bg-slate-100 text-slate-600'}">${notif.type || 'general'}</span>
            </td>
            <td class="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">${relativeTime(notif.created_at)}</td>
            <td class="px-4 py-3">
              <button class="del-notif text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100 transition font-medium" data-id="${notif.id}">Delete</button>
            </td>
          </tr>`);

        $('#tab-notifications').html(`
          ${sectionHeader('Notifications')}
          <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-5 text-sm text-indigo-700 flex items-start gap-2">
            <span class="text-lg flex-shrink-0">ℹ️</span>
            <span>Broadcast notifications are automatically sent to all users when events or announcements are published.</span>
          </div>
          ${tableWrap(['Title', 'Message', 'Type', 'Time', 'Action'], rows, 'No notifications yet.')}
        `);

        $(document).off('click', '.del-notif').on('click', '.del-notif', function () {
          const id = $(this).data('id');
          if (!confirm('Delete this notification?')) return;
          $.ajax({ url: BASE_URL + '/api/notifications/' + id, method: 'DELETE' })
            .done(() => { showToast('Deleted.', 'success'); loadAdminNotifications(); loadOverview(); })
            .fail(() => showToast('Delete failed.', 'error'));
        });
      })
      .fail(() => showToast('Could not load notifications.', 'error'));
  }

  // ── REGISTRATIONS ─────────────────────────────────────────────
  function loadAdminRegistrations() {
    $('#tab-registrations').html(loadingHtml());
    $.get(BASE_URL + '/api/event-registrations/all')
      .done(res => {
        const items = extractList(res, ['registrations', 'data', 'results']);
        const rows = items.map(r => {
          const regDate   = r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
          const eventDate = r.starts_at  ? new Date(r.starts_at).toLocaleDateString('en-US',  { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD';
          const statusCls = r.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700';
          const initials  = (r.full_name || '?').split(' ').map(c => c[0]).join('').toUpperCase().slice(0, 2);
          return `<tr class="hover:bg-indigo-50/30 transition">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">${initials}</div>
                <div>
                  <p class="text-sm font-semibold text-slate-800">${r.full_name || '—'}</p>
                  <p class="text-xs text-slate-400">${r.email || ''}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <p class="text-sm font-medium text-slate-700 max-w-[180px] truncate">${r.event_title || '—'}</p>
              <p class="text-xs text-slate-400">${r.location || ''}</p>
            </td>
            <td class="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">${eventDate}</td>
            <td class="px-4 py-3">
              <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusCls}">${r.status || 'registered'}</span>
            </td>
            <td class="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">${regDate}</td>
            <td class="px-4 py-3">
              <a href="event-detail.html?id=${r.event_id}" class="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition font-medium">View Event</a>
            </td>
          </tr>`;
        });

        $('#tab-registrations').html(
          sectionHeader(`Registrations <span class="text-base font-normal text-slate-400 ml-2">(${items.length} total)</span>`) +
          `<div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-700 flex items-start gap-2">
            <span class="text-lg flex-shrink-0">📋</span>
            <span>All user event registrations across the platform. Users can view and cancel their own registrations from <strong>My Registrations</strong> on the public site.</span>
          </div>` +
          tableWrap(['User', 'Event', 'Event Date', 'Status', 'Registered On', 'Action'], rows, 'No registrations yet.')
        );
      })
      .fail(() => showToast('Could not load registrations.', 'error'));
  }

  // ── Auto-refresh overview every 30s ──────────────────────────
  setInterval(() => {
    if (!$('#tab-overview').hasClass('hidden')) loadOverview();
  }, 30000);
});
