/**
 * SaMaa'S Collection - Authentication Controller (Login & Registration)
 * Handles client validation, session bootstrapping, guest cart merging, and smart redirection.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const urlParams = new URLSearchParams(window.location.search);
  const redirectUrl = urlParams.get('redirect') || 'index.html';

  // Update redirect links between login and register
  const regLink = document.getElementById('registerRedirectLink');
  if (regLink && redirectUrl !== 'index.html') {
    regLink.href = `register.html?redirect=${encodeURIComponent(redirectUrl)}`;
  }
  const loginLink = document.getElementById('loginRedirectLink');
  if (loginLink && redirectUrl !== 'index.html') {
    loginLink.href = `login.html?redirect=${encodeURIComponent(redirectUrl)}`;
  }

  // If already logged in, redirect immediately
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.success && data.authenticated) {
      window.location.href = redirectUrl;
      return;
    }
  } catch (e) {
    // Continue if offline
  }

  // ---------------------------------------------------------------------------
  // Login Form Handler
  // ---------------------------------------------------------------------------
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = document.getElementById('submitBtn');

      if (!email || !password) {
        App.showToast('Please enter both email and password.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success) {
          App.showToast(data.message || 'Logged in successfully!', 'success');

          // Merge any items accumulated in guest cart
          await App.syncGuestCartAfterLogin();

          // If user is admin and no special redirect was requested, offer or go to admin
          if (data.user && data.user.role === 'admin' && redirectUrl === 'index.html') {
            setTimeout(() => {
              window.location.href = 'admin.html';
            }, 600);
          } else {
            setTimeout(() => {
              window.location.href = redirectUrl;
            }, 600);
          }
        } else {
          App.showToast(data.message || 'Login failed. Please check your credentials.', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
        }
      } catch (err) {
        App.showToast('Unable to connect to server. Please check your connection.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Registration Form Handler
  // ---------------------------------------------------------------------------
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const phone = document.getElementById('phone')?.value.trim() || '';
      const address = document.getElementById('address')?.value.trim() || '';
      const submitBtn = document.getElementById('submitBtn');

      // Validation
      if (!name || !email || !password || !confirmPassword) {
        App.showToast('Please fill in all required fields.', 'error');
        return;
      }

      if (name.length < 2) {
        App.showToast('Full name must be at least 2 characters long.', 'error');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        App.showToast('Please enter a valid email address.', 'error');
        return;
      }

      if (password.length < 6) {
        App.showToast('Password must be at least 6 characters.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        App.showToast('Passwords do not match. Please verify.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            email,
            password,
            confirmPassword,
            phone,
            address
          })
        });
        const data = await res.json();

        if (data.success) {
          App.showToast(data.message || 'Account created successfully!', 'success');

          // Sync guest cart
          await App.syncGuestCartAfterLogin();

          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 700);
        } else {
          App.showToast(data.message || 'Registration failed.', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create My Account';
        }
      } catch (err) {
        App.showToast('Network error during registration.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create My Account';
      }
    });
  }
});
