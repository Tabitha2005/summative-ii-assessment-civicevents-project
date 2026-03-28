// auth.js — login, signup, token storage, logout

$(function () {
  setupAjax();

  // ---- LOGIN PAGE ----
  if ($('#login-form').length) {
    const params = new URLSearchParams(location.search);
    if (params.get('msg')) showToast(params.get('msg'), 'info', 6000);
    if (params.get('success')) showToast(params.get('success'), 'success', 5000);

    $('#login-form').on('submit', function (e) {
      e.preventDefault();
      const email = $('#email').val().trim();
      const password = $('#password').val();
      const $btn = $('#login-btn');

      if (!email || !password) { showToast('Please fill in all fields.', 'error'); return; }

      $btn.prop('disabled', true).html('<svg class="animate-spin h-4 w-4 inline mr-1" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Signing in...');

      $.ajax({
        url: BASE_URL + '/api/auth/login',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email, password }),
        success(res) {
          const u = res.data.user || res.data;
          localStorage.setItem('ce_token', res.data.token);
          localStorage.setItem('ce_user', JSON.stringify({ id: u.id, full_name: u.full_name, role: u.role }));
          window.location.href = u.role === 'admin' ? 'dashboard.html' : 'events.html';
        },
        error(xhr) {
          const msg = xhr.responseJSON?.message || 'Login failed. Check your credentials.';
          showToast(msg, 'error');
          $btn.prop('disabled', false).text('Sign In');
        }
      });
    });
  }

  // ---- SIGNUP PAGE ----
  if ($('#signup-form').length) {
    const pwdPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    $('#password').on('input', function () {
      const val = $(this).val();
      let strength = 'Weak', color = 'bg-red-500', width = '33%';
      if (pwdPolicy.test(val)) { strength = 'Strong'; color = 'bg-green-500'; width = '100%'; }
      else if (val.length >= 8 && /[A-Z]/.test(val) && /\d/.test(val)) { strength = 'Medium'; color = 'bg-yellow-500'; width = '66%'; }
      $('#pwd-bar').css('width', width).removeClass('bg-red-500 bg-yellow-500 bg-green-500').addClass(color);
      $('#pwd-label').text(strength);
    });

    $('#signup-form').on('submit', function (e) {
      e.preventDefault();
      const full_name = $('#full_name').val().trim();
      const email = $('#email').val().trim();
      const password = $('#password').val();
      const confirm = $('#confirm_password').val();
      const $btn = $('#signup-btn');

      if (!full_name || !email || !password || !confirm) { showToast('All fields are required.', 'error'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Enter a valid email address.', 'error'); return; }
      if (!pwdPolicy.test(password)) { showToast('Password must be 8+ chars with uppercase, lowercase, number, and special character.', 'error'); return; }
      if (password !== confirm) { showToast('Passwords do not match.', 'error'); return; }

      $btn.prop('disabled', true).html('<svg class="animate-spin h-4 w-4 inline mr-1" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Creating account...');

      $.ajax({
        url: BASE_URL + '/api/auth/signup',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ full_name, email, password }),
        success() {
          window.location.href = 'login.html?success=' + encodeURIComponent('Account created! Please sign in.');
        },
        error(xhr) {
          const msg = xhr.responseJSON?.message || 'Signup failed. Try again.';
          showToast(msg, 'error');
          $btn.prop('disabled', false).text('Create Account');
        }
      });
    });
  }
});
