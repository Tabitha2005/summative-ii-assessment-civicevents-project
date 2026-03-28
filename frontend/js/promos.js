// promos.js — CivicEvents+

$(function () {
  setupAjax();

  // ── PROMO VIDEO MODAL ────────────────────────────────────────
  // Single modal reused for every promo — video only loaded on open
  if (!$('#promo-modal').length) {
    $('body').append(`
      <div id="promo-modal" class="hidden fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Promo video player">
        <div class="relative w-full max-w-3xl bg-black rounded-2xl overflow-hidden shadow-2xl">
          <button id="promo-modal-close" class="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition" aria-label="Close video">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <video id="modal-video" class="w-full max-h-[70vh] bg-black" controls playsinline preload="none" aria-label="Promo video"></video>
          <div class="p-4 bg-slate-900 text-white">
            <p id="modal-video-title" class="font-bold text-base"></p>
            <p id="modal-video-desc"  class="text-slate-400 text-sm mt-1 line-clamp-2"></p>
          </div>
        </div>
      </div>`);

    // Close modal — pause + clear src to stop buffering
    function closePromoModal() {
      const v = document.getElementById('modal-video');
      v.pause();
      v.removeAttribute('src');
      v.load();
      $('#promo-modal').addClass('hidden');
    }

    $('#promo-modal-close').on('click', closePromoModal);
    $('#promo-modal').on('click', function (e) {
      if (e.target === this) closePromoModal();
    });
    $(document).on('keydown', function (e) {
      if (e.key === 'Escape') closePromoModal();
    });

    // Video error handler
    document.getElementById('modal-video').addEventListener('error', function () {
      showToast('Video could not be loaded. Check the file format.', 'error');
    });
  }

  function openPromoModal(videoUrl, title, desc) {
    const v = document.getElementById('modal-video');
    $('#modal-video-title').text(title || '');
    $('#modal-video-desc').text(desc || '');
    // Show modal first so browser can render it
    $('#promo-modal').removeClass('hidden');
    // Set src AFTER modal is visible
    setTimeout(() => {
      v.src = videoUrl;
      v.load();
      v.play().catch(err => {
        // Autoplay blocked — user must press play manually, that's fine
        console.warn('Autoplay blocked:', err);
      });
    }, 100);
  }

  // ── PROMOS LIST PAGE ─────────────────────────────────────────
  if ($('#promos-list').length) {
    authGuard();

    // Show skeletons
    let skels = '';
    for (let i = 0; i < 6; i++) skels += skeletonCard();
    $('#promos-list').html(skels);

    function renderPromos(items) {
      const $list = $('#promos-list');
      $list.empty();

      // ROLE-BASED GUARD: users only see published promos
      const visible = isAdmin() ? items : onlyPublished(items);

      if (!visible.length) {
        $list.html(`
          <div class="col-span-3 flex flex-col items-center justify-center py-24 text-slate-400">
            <span class="text-6xl mb-4">🎬</span>
            <p class="text-xl font-bold text-slate-600 mb-2">No promos available</p>
            <p class="text-sm">Check back soon for new city promo videos.</p>
          </div>`);
        return;
      }

      visible.forEach(p => {
        const videoUrl = promoVideoUrl(p.video_url);
        // ROLE-BASED GUARD: admin-only action buttons
        const adminBtns = isAdmin() ? `
          <button class="edit-promo text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition font-medium"
            data-id="${p.id}">Edit</button>
          <button class="toggle-promo text-xs border px-3 py-1.5 rounded-lg transition font-medium
            ${!!p.published ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}"
            data-id="${p.id}" data-pub="${!!p.published ? '1' : '0'}">
            ${!!p.published ? 'Unpublish' : 'Publish'}
          </button>
          <button class="delete-promo text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition font-medium"
            data-id="${p.id}">Delete</button>` : '';

        const pubBadge = !!p.published
          ? '<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">● Published</span>'
          : '<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">● Draft</span>';

        $list.append(`
          <div class="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col" data-id="${p.id}">
            <!-- Dark gradient placeholder — NO <video> here to prevent blinking -->
            <div class="relative aspect-video bg-gradient-to-br from-slate-800 to-indigo-900 cursor-pointer play-promo-btn"
                 data-video="${videoUrl}" data-title="${p.title}" data-desc="${p.description || ''}">
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg class="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
              <p class="absolute bottom-3 left-3 text-white/70 text-xs font-medium truncate max-w-[80%]">${p.title}</p>
              ${isAdmin() ? pubBadge.replace('text-[11px]', 'absolute top-3 right-3 text-[11px]') : ''}
            </div>
            <div class="p-4 flex flex-col flex-1">
              <div class="flex items-start justify-between gap-2 mb-1">
                <h3 class="font-bold text-slate-800 text-sm leading-snug line-clamp-2">${p.title}</h3>
                ${isAdmin() ? pubBadge : ''}
              </div>
              <p class="text-xs text-slate-500 line-clamp-2 flex-1 mb-3">${p.description || ''}</p>
              <div class="flex gap-2 flex-wrap pt-3 border-t border-slate-50">
                <button class="play-promo-btn text-xs bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition font-medium"
                  data-video="${videoUrl}" data-title="${p.title}" data-desc="${p.description || ''}">▶ Watch</button>
                ${adminBtns}
              </div>
            </div>
          </div>`);
      });
    }

    function fetchAndRender() {
      sessionStorage.removeItem('ce_promos'); // always fresh
      $.get(BASE_URL + '/api/promos')
        .done(res => {
          const items = extractList(res, ['promos', 'data', 'results']);
          renderPromos(items);
        })
        .fail(() => {
          showToast('Could not load promos. Please try again.', 'error');
          $('#promos-list').html(`
            <div class="col-span-3 text-center py-16 text-slate-400">
              <p class="text-4xl mb-3">⚠️</p><p>Failed to load promos.</p>
            </div>`);
        });
    }

    fetchAndRender();

    // Play button (card thumbnail or Watch button)
    $(document).on('click', '.play-promo-btn', function () {
      const videoUrl = $(this).data('video');
      const title    = $(this).data('title');
      const desc     = $(this).data('desc');
      if (!videoUrl) { showToast('Video URL not available.', 'error'); return; }
      openPromoModal(videoUrl, title, desc);
    });

    // ROLE-BASED GUARD: admin-only actions
    $(document).on('click', '.delete-promo', function () {
      const id = $(this).data('id');
      if (!confirm('Delete this promo? This cannot be undone.')) return;
      $.ajax({ url: BASE_URL + '/api/promos/' + id, method: 'DELETE' })
        .done(() => { showToast('Promo deleted.', 'success'); fetchAndRender(); })
        .fail(() => showToast('Delete failed.', 'error'));
    });

    $(document).on('click', '.toggle-promo', function () {
      const id  = $(this).data('id');
      const pub = $(this).data('pub') === '1' || $(this).data('pub') === true;
      $.ajax({ url: BASE_URL + '/api/promos/' + id + '/' + (pub ? 'unpublish' : 'publish'), method: 'PATCH' })
        .done(() => { showToast('Promo ' + (pub ? 'unpublished.' : 'published! Users can now see it.'), pub ? 'info' : 'success'); fetchAndRender(); })
        .fail(() => showToast('Update failed.', 'error'));
    });

    $(document).on('click', '.edit-promo', function () {
      window.location.href = 'promo-form.html?id=' + $(this).data('id');
    });
  }

  // ── PROMO DETAIL PAGE ────────────────────────────────────────
  if ($('#promo-detail').length) {
    authGuard();
    const id = new URLSearchParams(location.search).get('id');
    if (!id) { window.location.href = 'promos.html'; return; }

    $.get(BASE_URL + '/api/promos/' + id)
      .done(res => {
        const p = extractList(res, ['data'])[0] || res.data || res;
        if (!p) { showToast('Promo not found.', 'error'); return; }

        $('#promo-title').text(p.title);
        $('#promo-desc').text(p.description || '');
        if (!!p.published) $('#promo-status').removeClass('hidden');

        const videoUrl = promoVideoUrl(p.video_url);
        const video    = document.getElementById('promo-video');

        if (videoUrl) {
          // Set src only when user interacts — preload="none" prevents blinking
          video.preload = 'none';
          video.src = videoUrl;

          if (p.caption_url) {
            const track = document.createElement('track');
            track.kind    = 'captions';
            track.src     = p.caption_url.startsWith('http') ? p.caption_url : BASE_URL + p.caption_url;
            track.srclang = 'en';
            track.label   = 'English';
            track.default = true;
            video.appendChild(track);
          }

          video.addEventListener('error', () => { $('#video-fallback').removeClass('hidden'); });
        } else {
          $('#video-fallback').removeClass('hidden');
        }

        if (p.caption_text) {
          $('#caption-text-body').text(p.caption_text);
          $('#caption-text-section').removeClass('hidden');
        }

        // Controls
        $('#play-pause').on('click', function () {
          if (video.paused) {
            video.play().catch(() => {});
            $('#pp-play').addClass('hidden'); $('#pp-pause').removeClass('hidden');
          } else {
            video.pause();
            $('#pp-play').removeClass('hidden'); $('#pp-pause').addClass('hidden');
          }
        });
        video.addEventListener('timeupdate', () => {
          if (!video.duration) return;
          $('#video-progress').val((video.currentTime / video.duration) * 100);
          $('#video-time').text(fmtTime(video.currentTime) + ' / ' + fmtTime(video.duration));
        });
        $('#video-progress').on('input', function () {
          if (video.duration) video.currentTime = (this.value / 100) * video.duration;
        });
        $('#volume').on('input', function () { video.volume = this.value; });
        $('#fullscreen-btn').on('click', () => { if (video.requestFullscreen) video.requestFullscreen(); });
        $('#caption-toggle').on('click', function () {
          const t = video.textTracks[0];
          if (t) { const on = t.mode === 'showing'; t.mode = on ? 'hidden' : 'showing'; $(this).toggleClass('bg-indigo-600 text-white', !on); }
        });
        video.addEventListener('ended', () => { $('#pp-play').removeClass('hidden'); $('#pp-pause').addClass('hidden'); });
      })
      .fail(() => showToast('Could not load promo.', 'error'));
  }

  // ── PROMO FORM (admin) ───────────────────────────────────────
  if ($('#promo-form').length) {
    adminGuard();
    const id = new URLSearchParams(location.search).get('id');

    if (id) {
      $('#form-title').text('Edit Promo');
      $.get(BASE_URL + '/api/promos/' + id).done(res => {
        const p = res.data || res;
        $('#title').val(p.title);
        $('#description').val(p.description);
        $('#caption_text').val(p.caption_text);
        $('#published').prop('checked', !!p.published);
      });
    }

    $('#video').on('change', function () {
      const file = this.files[0];
      if (!file) return;
      if (!file.type.startsWith('video/')) { showToast('Only video files allowed (MP4, MOV, AVI, MKV).', 'error'); this.value = ''; return; }
      if (file.size > 500 * 1024 * 1024) { showToast('Video must be under 500MB.', 'error'); this.value = ''; return; }
      $('#file-info').text(file.name + ' (' + (file.size / 1024 / 1024).toFixed(1) + ' MB)');
    });

    $('#promo-form').on('submit', function (e) {
      e.preventDefault();
      const title        = $('#title').val().trim();
      const description  = $('#description').val().trim();
      const caption_text = $('#caption_text').val().trim();
      if (!title || !description || !caption_text) { showToast('All fields are required.', 'error'); return; }
      if (!id && !$('#video')[0].files[0]) { showToast('Video file is required.', 'error'); return; }

      const fd = new FormData(this);
      fd.set('published', $('#published').is(':checked') ? 'true' : 'false');
      const $btn = $('#submit-btn');
      $btn.prop('disabled', true).text('Uploading...');

      $.ajax({
        url: id ? BASE_URL + '/api/promos/' + id : BASE_URL + '/api/promos',
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
          sessionStorage.removeItem('ce_promos');
          const isPublished = $('#published').is(':checked');
          showToast(
            id ? 'Promo updated!' : (isPublished ? '✓ Promo published! Users can now see it.' : 'Promo saved as draft.'),
            'success'
          );
          setTimeout(() => window.location.href = 'dashboard.html', 1200);
        },
        error(xhr) {
          showToast(xhr.responseJSON?.message || 'Upload failed.', 'error');
          $btn.prop('disabled', false).text('Save Promo');
        }
      });
    });
  }
});
