// users.js — profile page

$(function () {
  setupAjax();

  if ($('#profile-page').length) {
    authGuard();
    const user = getUser();
    if (!user) { logout(); return; }

    $.get(BASE_URL + '/api/users/profile/me').done(res => {
      const u = res.data || res;
      const initials = u.full_name ? u.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
      // Update hero section
      $('#hero-avatar').text(initials);
      $('#hero-name').text(u.full_name);
      $('#hero-role-badge').text(u.role);
      $('#hero-status-badge').text(u.is_active ? 'Active' : 'Inactive')
        .toggleClass('bg-emerald-500/20 border-emerald-400/30 text-emerald-300', !!u.is_active)
        .toggleClass('bg-red-500/20 border-red-400/30 text-red-300', !u.is_active);
      // Populate form
      $('#full_name').val(u.full_name);
      $('#email').val(u.email);
      $('#role-display').text(u.role);
      $('#status-display').text(u.is_active ? 'Active' : 'Inactive');
    });

    $('#profile-form').on('submit', function (e) {
      e.preventDefault();
      const full_name = $('#full_name').val().trim();
      const email = $('#email').val().trim();
      if (!full_name) { showToast('Full name is required.', 'error'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Enter a valid email.', 'error'); return; }

      const $btn = $('#save-btn');
      $btn.prop('disabled', true).text('Saving...');

      $.ajax({
        url: BASE_URL + '/api/users/profile/me',
        method: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify({ full_name, email }),
        success(res) {
          const updated = res.data;
          localStorage.setItem('ce_user', JSON.stringify({ id: updated.id, full_name: updated.full_name, role: updated.role }));
          const initials = updated.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          $('#profile-avatar').text(initials);
          $('#profile-name-display').text(updated.full_name);
          showToast('Profile updated!', 'success');
          $btn.prop('disabled', false).text('Save Changes');
        },
        error(xhr) {
          if (xhr.status === 409) {
            $('#email-error').removeClass('hidden');
          } else {
            showToast(xhr.responseJSON?.message || 'Update failed.', 'error');
          }
          $btn.prop('disabled', false).text('Save Changes');
        }
      });
    });

    $('#email').on('input', () => $('#email-error').addClass('hidden'));
  }
});
