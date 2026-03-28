// events.js — CivicEvents+

$(function () {
  setupAjax();

  // ── EVENTS LIST ──────────────────────────────────────────────
  if ($('#events-list').length) {
    authGuard();
    let allEvents = [], currentPage = 1;
    const PAGE_SIZE = 9;

    function renderEvents(events) {
      const $list = $('#events-list');
      $list.empty();
      if (!events.length) {
        $list.html(`
          <div class="col-span-3 flex flex-col items-center justify-center py-24 text-slate-400">
            <span class="text-6xl mb-4">📅</span>
            <p class="text-xl font-bold text-slate-600 mb-2">No events found</p>
            <p class="text-sm mb-5">Try adjusting your filters or check back later.</p>
            <button onclick="$('#search-input').val('');$('#date-filter').val('all');filterAndPaginate();"
              class="btn-primary text-sm">Clear Filters</button>
          </div>`);
        return;
      }

      events.forEach(ev => {
        const img = ev.metadata?.image_url ? eventImageUrl(ev.metadata.image_url) : null;
        const imgTag = img
          ? `<img src="${img}" alt="${ev.title}" class="card-img w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" onerror="this.onerror=null;this.style.display='none'">`
          : '';
        const date = ev.starts_at
          ? new Date(ev.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'TBD';
        const isUpcoming = ev.starts_at && new Date(ev.starts_at) >= new Date();
        const timeBadge = isUpcoming
          ? '<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Upcoming</span>'
          : '<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Past</span>';

        // ROLE-BASED GUARD: admin-only edit/delete buttons
        const adminBtns = isAdmin() ? `
          <a href="event-form.html?id=${ev.id}" class="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition font-medium" target="_self">Edit</a>
          <button class="delete-event text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition font-medium" data-id="${ev.id}">Delete</button>` : '';

        $list.append(`
          <div class="event-card group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div class="overflow-hidden h-48 bg-gradient-to-br from-indigo-900 via-indigo-700 to-purple-800 relative">
              ${imgTag}
              <div class="card-img-placeholder absolute inset-0 flex items-center justify-center">
                <svg class="w-12 h-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
            </div>
            <div class="p-5 flex flex-col flex-1">
              <div class="flex items-start justify-between gap-2 mb-2">
                <h3 class="font-bold text-slate-800 text-sm leading-snug line-clamp-2">${ev.title}</h3>
                ${timeBadge}
              </div>
              <div class="flex items-center gap-1 text-xs text-indigo-600 font-medium mb-1">📅 ${date}</div>
              <div class="flex items-center gap-1 text-xs text-slate-500 mb-3">📍 ${ev.location || 'Location TBD'}</div>
              <p class="text-xs text-slate-500 line-clamp-2 flex-1">${ev.description || ''}</p>
              <div class="flex gap-2 mt-4 flex-wrap pt-3 border-t border-slate-50">
                <button class="view-detail-btn text-xs bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition font-medium" data-id="${ev.id}">View Details</button>
                ${adminBtns}
              </div>
            </div>
          </div>`);
      });
    }

    function paginate(data) {
      const start = (currentPage - 1) * PAGE_SIZE;
      renderEvents(data.slice(start, start + PAGE_SIZE));
      const total = Math.ceil(data.length / PAGE_SIZE);
      $('#page-info').text(`Page ${currentPage} of ${Math.max(total, 1)}`);
      $('#prev-page').prop('disabled', currentPage === 1);
      $('#next-page').prop('disabled', currentPage >= total);
    }

    function filterAndPaginate() {
      const q      = ($('#search-input').val() || '').toLowerCase();
      const filter = $('#date-filter').val() || 'all';
      const locFilter = $('#location-filter').val() || 'all';
      const now    = new Date();

      const filtered = allEvents.filter(ev => {
        // ROLE-BASED GUARD: users only see published events
        if (!isAdmin() && !ev.published) return false;
        const matchQ = !q || ev.title.toLowerCase().includes(q) || (ev.location || '').toLowerCase().includes(q);
        const matchLoc = locFilter === 'all' || ev.location === locFilter;
        let matchDate = true;
        if (filter === 'upcoming') matchDate = ev.starts_at && new Date(ev.starts_at) >= now;
        if (filter === 'past')     matchDate = ev.starts_at && new Date(ev.ends_at || ev.starts_at) < now;
        return matchQ && matchLoc && matchDate;
      });

      currentPage = 1;
      paginate(filtered);
      $('#events-list').data('filtered', filtered);
    }

    // Show skeletons
    let skels = '';
    for (let i = 0; i < 9; i++) skels += skeletonCard();
    $('#events-list').html(skels);

    // Always fetch fresh — never use stale cache that hides new events
    $.get(BASE_URL + '/api/events')
      .done(res => {
        allEvents = extractList(res, ['events', 'data', 'results']);
        // Populate location filter
        const locations = [...new Set(allEvents.map(e => e.location).filter(Boolean))].sort();
        locations.forEach(loc => {
          $('#location-filter').append(`<option value="${loc}">${loc}</option>`);
        });
        filterAndPaginate();
      })
      .fail(() => {
        showToast('Could not load events. Please try again.', 'error');
        $('#events-list').html(`
          <div class="col-span-3 text-center py-16 text-slate-400">
            <p class="text-4xl mb-3">⚠️</p><p>Failed to load events.</p>
          </div>`);
      });

    $('#search-input').on('input', filterAndPaginate);
    $('#date-filter').on('change', filterAndPaginate);
    $('#location-filter').on('change', filterAndPaginate);

    $('#prev-page').on('click', function () {
      currentPage--;
      paginate($('#events-list').data('filtered') || allEvents);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    $('#next-page').on('click', function () {
      currentPage++;
      paginate($('#events-list').data('filtered') || allEvents);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Navigate to event detail — delegated so it works on dynamically rendered cards
    $(document).on('click', '.view-detail-btn', function (e) {
      e.preventDefault();
      const id = $(this).data('id');
      window.location.href = 'event-detail.html?id=' + id;
    });

    // ROLE-BASED GUARD: admin-only delete
    $(document).on('click', '.delete-event', function () {
      const id = $(this).data('id');
      if (!confirm('Delete this event? This cannot be undone.')) return;
      $.ajax({ url: BASE_URL + '/api/events/' + id, method: 'DELETE' })
        .done(() => {
          showToast('Event deleted.', 'success');
          allEvents = allEvents.filter(e => e.id !== id);
          filterAndPaginate();
        })
        .fail(() => showToast('Delete failed.', 'error'));
    });
  }

  // ── EVENT DETAIL ─────────────────────────────────────────────
  if ($('#event-detail').length) {
    authGuard();
    const id = new URLSearchParams(location.search).get('id');
    if (!id) { window.location.href = 'events.html'; return; }

    function loadDetail() {
      $.get(BASE_URL + '/api/events/' + id)
        .done(res => {
          const ev  = res.data || res;
          const img = ev.metadata?.image_url ? eventImageUrl(ev.metadata.image_url) : null;
          document.title = ev.title + ' — CivicEvents+';
          $('#event-title').text(ev.title);
          if (img) {
            $('#event-img').attr('src', img).attr('alt', ev.title)
              .on('error', function () { $(this).hide(); });
          } else {
            $('#event-img').hide();
          }
          $('#event-desc').text(ev.description || '');
          $('#event-location').text(ev.location || 'TBD');
          if (ev.location) {
            $('#map-link').attr('href', 'https://www.google.com/maps/search/' + encodeURIComponent(ev.location)).removeClass('hidden');
          }
          $('#event-start').text(ev.starts_at ? new Date(ev.starts_at).toLocaleString() : 'TBD');
          $('#event-end').text(ev.ends_at   ? new Date(ev.ends_at).toLocaleString()   : 'TBD');
          // ROLE-BASED GUARD: admin sees edit button + attendees
          if (isAdmin()) {
            $('#admin-edit-btn').attr('href', 'event-form.html?id=' + id).removeClass('hidden');
            $('#admin-delete-btn').removeClass('hidden').on('click', function () {
              if (!confirm('Delete this event? This cannot be undone.')) return;
              $.ajax({ url: BASE_URL + '/api/events/' + id, method: 'DELETE' })
                .done(() => { showToast('Event deleted.', 'success'); setTimeout(() => window.location.href = 'dashboard.html', 900); })
                .fail(() => showToast('Delete failed.', 'error'));
            });
            loadAttendees();
          }
          checkRegistration();
          loadFeedback();
        })
        .fail(() => showToast('Could not load event.', 'error'));
    }

    function checkRegistration() {
      $.get(BASE_URL + '/api/event-registrations/my-registrations')
        .done(res => {
          const regs = extractList(res, ['registrations', 'data', 'results']);
          const reg  = regs.find(r => String(r.event_id) === String(id));
          if (reg && reg.status !== 'cancelled') {
            $('#reg-btn').text('Cancel Registration')
              .removeClass('bg-indigo-600 hover:bg-indigo-700').addClass('bg-red-500 hover:bg-red-600')
              .data('registered', true).attr('data-registered', 'true');
          } else {
            $('#reg-btn').text('Register for Event')
              .removeClass('bg-red-500 hover:bg-red-600').addClass('bg-indigo-600 hover:bg-indigo-700')
              .data('registered', false).attr('data-registered', 'false');
          }
        })
        .fail(() => {});
    }

    $('#reg-btn').on('click', function () {
      const registered = $(this).data('registered') === true;
      const $btn = $(this);
      $btn.prop('disabled', true);
      if (registered) {
        $.ajax({ 
          url: BASE_URL + '/api/event-registrations/cancel', 
          method: 'POST', 
          contentType: 'application/json', 
          data: JSON.stringify({ event_id: parseInt(id) }) 
        })
          .done(() => { showToast('Registration cancelled.', 'info'); checkRegistration(); })
          .fail(xhr => {
            showToast(xhr.responseJSON?.message || 'Failed to cancel registration.', 'error');
          })
          .always(() => $btn.prop('disabled', false));
      } else {
        $.ajax({ 
          url: BASE_URL + '/api/event-registrations/register', 
          method: 'POST', 
          contentType: 'application/json', 
          data: JSON.stringify({ event_id: parseInt(id) }) 
        })
          .done(() => { showToast('Registered successfully! 🎉', 'success'); checkRegistration(); })
          .fail(xhr => {
            if (xhr.status === 409) showToast('Already registered.', 'info');
            else showToast(xhr.responseJSON?.message || 'Failed to register.', 'error');
          })
          .always(() => $btn.prop('disabled', false));
      }
    });

    function loadAttendees() {
      $.get(BASE_URL + '/api/event-registrations/event/' + id + '/attendees')
        .done(res => {
          const attendees = extractList(res, ['attendees', 'data', 'results']);
          const $list = $('#attendees-list');
          $list.empty();
          if (!attendees.length) {
            $list.html('<li class="py-4 text-sm text-slate-400 text-center">No registrations yet.</li>');
          } else {
            attendees.forEach(a => {
              const initials = (a.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              $list.append(`
                <li class="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                  <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">${initials}</div>
                  <div>
                    <p class="text-sm font-medium text-slate-800">${a.full_name || 'User'}</p>
                    <p class="text-xs text-slate-400">${a.email || ''}</p>
                  </div>
                </li>`);
            });
          }
          $('#attendees-section').removeClass('hidden');
        });
    }

    function loadFeedback() {
      $.get(BASE_URL + '/api/event-feedback/my-feedback')
        .done(res => {
          const myFeedback = extractList(res, ['feedback', 'data', 'results']);
          const already = myFeedback.find(f => String(f.event_id) === String(id));
          if (already) {
            const stars = '★'.repeat(already.rating) + '☆'.repeat(5 - already.rating);
            $('#feedback-form-section').html(`
              <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                <p class="font-semibold mb-1">✅ You already submitted feedback</p>
                <p class="text-amber-500 text-lg">${stars}</p>
                ${already.comment ? `<p class="text-slate-600 mt-1">${already.comment}</p>` : ''}
              </div>`);
          }
        });

      $.get(BASE_URL + '/api/event-feedback/event/' + id)
        .done(res => {
          const feedbacks = extractList(res, ['feedback', 'data', 'results']);
          if (feedbacks.length) {
            const avg   = (feedbacks.reduce((s, f) => s + Number(f.rating), 0) / feedbacks.length).toFixed(1);
            const stars = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
            $('#feedback-avg').html(`<span class="text-amber-400 text-lg">${stars}</span> <span class="font-semibold text-slate-700">${avg}/5</span> <span class="text-slate-400">(${feedbacks.length} review${feedbacks.length !== 1 ? 's' : ''})</span>`);
            const $fl = $('#feedback-list');
            $fl.empty();
            feedbacks.forEach(f => {
              const fStars = '★'.repeat(f.rating) + '☆'.repeat(5 - f.rating);
              $fl.append(`
                <div class="bg-slate-50 rounded-xl p-4">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-amber-400">${fStars}</span>
                    <span class="text-xs text-slate-400">${relativeTime(f.created_at)}</span>
                  </div>
                  ${f.comment ? `<p class="text-sm text-slate-700">${f.comment}</p>` : ''}
                </div>`);
            });
          } else {
            $('#feedback-avg').text('No feedback yet. Be the first!');
          }
        }).fail(() => {});
    }

    // Star rating
    let selectedRating = 0;
    $('#star-rating span')
      .on('click', function () { selectedRating = parseInt($(this).data('val')); updateStars(selectedRating); })
      .on('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') $(this).trigger('click'); })
      .on('mouseenter', function () { updateStars(parseInt($(this).data('val'))); });
    $('#star-rating').on('mouseleave', () => updateStars(selectedRating));

    function updateStars(val) {
      $('#star-rating span').each(function () {
        $(this).css('color', parseInt($(this).data('val')) <= val ? '#f59e0b' : '#d1d5db');
      });
    }

    $('#feedback-form').on('submit', function (e) {
      e.preventDefault();
      if (!selectedRating) { showToast('Please select a rating.', 'error'); return; }
      const comment = $('#feedback-comment').val().trim();
      const $btn = $(this).find('button[type=submit]');
      $btn.prop('disabled', true).text('Submitting...');
      $.ajax({
        url: BASE_URL + '/api/event-feedback',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ event_id: id, rating: selectedRating, comment })
      }).done(() => {
        showToast('Feedback submitted! Thank you 🙏', 'success');
        loadFeedback();
      }).fail(xhr => {
        showToast(xhr.responseJSON?.message || 'Failed to submit feedback.', 'error');
        $btn.prop('disabled', false).text('Submit Feedback');
      });
    });

    loadDetail();
  }

  // ── EVENT FORM (admin) ───────────────────────────────────────
  if ($('#event-form').length) {
    adminGuard();
    const id = new URLSearchParams(location.search).get('id');

    if (id) {
      $('#form-title').text('Edit Event');
      $.get(BASE_URL + '/api/events/' + id).done(res => {
        const ev = res.data || res;
        $('#title').val(ev.title);
        $('#description').val(ev.description);
        $('#location').val(ev.location);
        $('#starts_at').val(ev.starts_at ? ev.starts_at.slice(0, 16) : '');
        $('#ends_at').val(ev.ends_at   ? ev.ends_at.slice(0, 16)   : '');
        $('#published').prop('checked', !!ev.published);
        if (ev.metadata?.image_url) {
          $('#img-preview').attr('src', eventImageUrl(ev.metadata.image_url)).removeClass('hidden');
        }
      });
    }

    $('#image').on('change', function () {
      const file = this.files[0];
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) { showToast('Only JPG, PNG, GIF allowed.', 'error'); this.value = ''; return; }
      if (file.size > 10 * 1024 * 1024) { showToast('Image must be under 10MB.', 'error'); this.value = ''; return; }
      const reader = new FileReader();
      reader.onload = e => $('#img-preview').attr('src', e.target.result).removeClass('hidden');
      reader.readAsDataURL(file);
    });

    $('#event-form').on('submit', function (e) {
      e.preventDefault();
      const title    = $('#title').val().trim();
      const location = $('#location').val().trim();
      const starts   = $('#starts_at').val();
      const ends     = $('#ends_at').val();
      if (!title || !location || !starts || !ends) { showToast('Please fill all required fields.', 'error'); return; }
      const startDate = new Date(starts);
      const endDate   = new Date(ends);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) { showToast('Please enter valid start and end dates.', 'error'); return; }
      if (endDate <= startDate) { showToast('End time must be after start time.', 'error'); return; }

      const fd = new FormData(this);
      fd.set('published', $('#published').is(':checked') ? 'true' : 'false');
      const $btn = $('#submit-btn');
      $btn.prop('disabled', true).text('Saving...');

      $.ajax({
        url: id ? BASE_URL + '/api/events/' + id : BASE_URL + '/api/events',
        method: id ? 'PUT' : 'POST',
        data: fd, processData: false, contentType: false,
        xhr() {
          const x = new XMLHttpRequest();
          x.upload.onprogress = ev => {
            if (ev.lengthComputable) $('#upload-progress').val(Math.round(ev.loaded / ev.total * 100)).removeClass('hidden');
          };
          return x;
        },
        success() {
          const isPublished = $('#published').is(':checked');
          showToast(
            id ? 'Event updated!' : (isPublished ? '✓ Event published! Users can now see it.' : 'Event saved as draft.'),
            'success'
          );
          setTimeout(() => window.location.href = 'dashboard.html', 1000);
        },
        error(xhr) {
          showToast(xhr.responseJSON?.message || 'Failed to save event.', 'error');
          $btn.prop('disabled', false).text('Save Event');
        }
      });
    });
  }
});
