// Homework Genie — site behaviour

const USERS_KEY = 'homeworkGenieUsers';
const SESSION_KEY = 'homeworkGenieSession';
const ASSIGNMENTS_KEY = 'homeworkGenieAssignments';
const DB_NAME = 'homeworkGenieFiles';

function getUsers() { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function getAssignments() { return JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) || '[]'); }
function saveAssignments(a) { localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(a)); }
function normalizeEmail(e) { return e.trim().toLowerCase(); }
function initials(name) { return String(name || 'HG').split(/\s+/).map(function(x){return x[0];}).join('').slice(0, 2).toUpperCase(); }
function escapeHtml(s) { return String(s).replace(/[&<>'"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]); }); }
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function openModal(type) {
  var ids = { student: 'studentModal', assignment: 'assignmentModal', login: 'loginModal', profileEdit: 'profileEditModal' };
  var id = ids[type] || 'loginModal';
  var el = document.getElementById(id);
  if (el) { el.classList.add('active'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('active');
  if (!document.querySelector('.modal.active')) document.body.style.overflow = '';
}
function closeOnBackdrop(e, id) { if (e.target.id === id) closeModal(id); }
function switchToLogin() { closeModal('studentModal'); openModal('login'); }
function switchToStudent() { closeModal('loginModal'); openModal('student'); }

function createAccount(e) {
  e.preventDefault();
  var form = e.target;
  var data = new FormData(form);
  var email = normalizeEmail(data.get('email'));
  var users = getUsers();
  if (!email.endsWith('@gmail.com')) { alert('Please use a Gmail address for your student account.'); return; }
  if (users.some(function(u){ return u.email === email; })) { alert('An account with this email already exists. Please log in.'); return; }
  if (data.get('password') !== data.get('confirmPassword')) { alert('Passwords do not match.'); return; }
  var user = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    role: 'student',
    name: data.get('name').trim(),
    phone: data.get('phone').trim(),
    email: email,
    password: data.get('password'),
    education: data.get('education'),
    createdAt: new Date().toISOString()
  };
  users.push(user);
  saveUsers(users);
  var success = document.getElementById('studentSuccess');
  success.textContent = 'Account created successfully. Opening your dashboard...';
  success.style.display = 'block';
  setTimeout(function() {
    closeModal('studentModal');
    form.reset();
    success.style.display = 'none';
    loginUser(user);
  }, 500);
}

function loginUser(user) {
  localStorage.setItem(SESSION_KEY, user.id);
  window.location.href = 'dashboard.html';
}

function currentUser() {
  var id = localStorage.getItem(SESSION_KEY);
  return getUsers().find(function(u){ return u.id === id; });
}
function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'index.html';
}

function togglePassword(inputId, button) {
  var input = document.getElementById(inputId);
  if (!input) return;
  var showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  button.textContent = showing ? 'show' : 'hide';
  button.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
}

function openProfileEdit() {
  var user = currentUser();
  if (!user || user.role !== 'student') { alert('Please log in as a student.'); return false; }
  document.querySelectorAll('.modal').forEach(function(m) { m.classList.remove('active'); });
  document.getElementById('editName').value = user.name || '';
  document.getElementById('editPhone').value = user.phone || '';
  document.getElementById('editEmail').value = user.email || '';
  document.getElementById('editEducation').value = user.education || 'College';
  document.getElementById('profileEditSuccess').style.display = 'none';
  var modal = document.getElementById('profileEditModal');
  modal.classList.add('active');
  modal.style.zIndex = '10001';
  document.body.style.overflow = 'hidden';
  return false;
}

function openAssignment() {
  var user = currentUser();
  if (!user || user.role !== 'student') { alert('Please log in as a student.'); return; }
  openModal('assignment');
}

function switchDashView(id, button) {
  document.querySelectorAll('.dash-view').forEach(function(v) { v.classList.remove('active'); });
  var target = document.getElementById(id);
  if (target) target.classList.add('active');
  var nav = button ? button.parentElement : null;
  if (nav) nav.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
  if (button) button.classList.add('active');
  var titles = {
    studentOverview: ['Dashboard', 'Your academic workspace'],
    studentAssignments: ['My Assignments', 'Track your submitted work'],
    studentProfileView: ['My Profile', 'Your account information']
  };
  var t = titles[id] || ['Dashboard', 'Your workspace'];
  document.getElementById('topbarTitle').textContent = t[0];
  document.getElementById('topbarSubtitle').textContent = t[1];
}

function showDashboard(user) {
  if (user.role !== 'student') { alert('This website is currently student-focused. Please create or use a Student account.'); return; }
  document.getElementById('dashboard').classList.add('active');
  document.body.style.overflow = 'hidden';
  document.getElementById('studentDashboard').classList.remove('hidden');
  var init = initials(user.name);
  ['sideAvatar', 'topAvatar', 'studentProfileAvatar', 'studentProfileAvatar2'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = init;
  });
  document.getElementById('sideName').textContent = user.name;
  document.getElementById('sideRole').textContent = 'Student';
  document.getElementById('topbarUserName').textContent = user.name;
  document.getElementById('studentWelcome').textContent = 'Welcome, ' + user.name + '!';
  document.getElementById('studentProfileName').textContent = user.name;
  document.getElementById('studentProfileEducation').textContent = user.education;
  document.getElementById('studentProfileEmail').textContent = user.email;
  document.getElementById('studentProfilePhone').textContent = user.phone;
  document.getElementById('studentProfileLevel').textContent = user.education;
  document.getElementById('studentProfileName2').textContent = user.name;
  document.getElementById('studentProfileEducation2').textContent = user.education;
  document.getElementById('studentProfileNameDetail').textContent = user.name;
  document.getElementById('studentProfileEmail2').textContent = user.email;
  document.getElementById('studentProfilePhone2').textContent = user.phone;
  document.getElementById('studentProfileLevel2').textContent = user.education;
  renderAssignments(user.id);
  switchDashView('studentOverview', document.querySelector('#studentSideNav button'));
}

function openFileDB() {
  return new Promise(function(resolve, reject) {
    var r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = function() { var db = r.result; if (!db.objectStoreNames.contains('files')) db.createObjectStore('files'); };
    r.onsuccess = function() { resolve(r.result); };
    r.onerror = function() { reject(r.error || new Error('Unable to open local file storage.')); };
  });
}
function saveFile(id, file) {
  return openFileDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').put(file, id);
      tx.oncomplete = function() { db.close(); resolve(); };
      tx.onerror = function() { db.close(); reject(tx.error || new Error('Unable to save file.')); };
      tx.onabort = function() { db.close(); reject(tx.error || new Error('File save was aborted.')); };
    });
  });
}
function getStoredFile(id) {
  return openFileDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction('files', 'readonly');
      var req = tx.objectStore('files').get(id);
      req.onsuccess = function() { db.close(); resolve(req.result || null); };
      req.onerror = function() { db.close(); reject(req.error); };
    });
  });
}

function renderAssignments(userId) {
  var list = document.getElementById('assignmentList');
  var items = getAssignments().filter(function(a) { return a.userId === userId; }).sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  var pending = items.filter(function(a) { return a.status === 'pending' || a.status === 'accepted'; }).length;
  var progress = items.filter(function(a) { return a.status === 'in_progress'; }).length;
  var completed = items.filter(function(a) { return a.status === 'completed'; }).length;
  document.getElementById('studentTotalCount').textContent = items.length;
  document.getElementById('studentPendingCount').textContent = pending;
  document.getElementById('studentProgressCount').textContent = progress;
  document.getElementById('studentCompletedCount').textContent = completed;
  var markup = items.map(function(a) {
    var status = a.status === 'completed' ? 'Completed' : a.status === 'in_progress' ? 'In Progress' : a.status === 'accepted' ? 'Accepted' : 'Pending';
    return '<div class="assignment-item"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><strong>' + escapeHtml(a.fileName) + '</strong><div style="color:#8b8390;font-size:11px;margin-top:5px">' + formatFileSize(a.fileSize) + ' &bull; ' + new Date(a.createdAt).toLocaleString() + '</div></div><span class="status-pill">' + status + '</span></div><div style="color:#77707e;font-size:12px;margin-top:9px">' + escapeHtml(a.details) + '</div><div class="assignment-item-actions"><button type="button" class="btn btn-primary btn-small" onclick="downloadAssignment(\'' + a.id + '\')">View File</button></div></div>';
  }).join('');
  list.innerHTML = items.length ? markup : '<div class="empty-state"><strong>No assignments yet</strong><div>Submit your first assignment to get started.</div></div>';
  var preview = document.getElementById('studentRecentList');
  if (preview) {
    preview.innerHTML = items.slice(0, 4).length ? items.slice(0, 4).map(function(a) {
      var status = a.status === 'completed' ? 'Completed' : a.status === 'in_progress' ? 'In Progress' : a.status === 'accepted' ? 'Accepted' : 'Pending';
      return '<div class="assignment-item"><div style="display:flex;justify-content:space-between;gap:12px"><div><strong>' + escapeHtml(a.fileName) + '</strong><div style="color:#8b8390;font-size:11px;margin-top:4px">' + new Date(a.createdAt).toLocaleDateString() + '</div></div><span class="status-pill">' + status + '</span></div></div>';
    }).join('') : '<div class="empty-state">No assignments submitted yet.</div>';
  }
}

function downloadAssignment(id) {
  var item = getAssignments().find(function(a) { return a.id === id; });
  getStoredFile(id).then(function(file) {
    if (!item || !file) { alert('The assignment file is not available in this browser.'); return; }
    var blob = file instanceof Blob ? file : new Blob([file], { type: item.fileType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = item.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
  }).catch(function(err) { console.error(err); alert('Unable to open the assignment file.'); });
}

document.addEventListener('DOMContentLoaded', function() {
  var isDashboard = document.getElementById('dashboard') !== null;

  // ---- mobile nav toggle ----
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function() {
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() { links.classList.remove('open'); });
    });
  }

  // ---- back to top button ----
  var topBtn = document.getElementById('backToTop');
  if (topBtn) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 420) topBtn.classList.add('show');
      else topBtn.classList.remove('show');
    });
    topBtn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---- scroll reveal ----
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function(el) { io.observe(el); });
  } else {
    revealEls.forEach(function(el) { el.classList.add('in'); });
  }

  // ---- FAQ accordion (how-it-works page) ----
  document.querySelectorAll('.faq-q').forEach(function(q) {
    q.addEventListener('click', function() {
      var item = q.closest('.faq-item');
      var wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item').forEach(function(i) { i.classList.remove('open'); });
      if (!wasOpen) item.classList.add('open');
    });
  });

  // ---- cross-page auth trigger: services.html etc link to
  // index.html?auth=student / ?auth=login, index.html opens the modal on load ----
  if (!isDashboard) {
    var params = new URLSearchParams(window.location.search);
    var authParam = params.get('auth');
    if (authParam && typeof openModal === 'function') {
      openModal(authParam === 'login' ? 'login' : 'student');
    }
  }

  // ---- index.html auth forms ----
  if (!isDashboard) {
    var signupForm = document.getElementById('studentSignupForm');
    if (signupForm) signupForm.addEventListener('submit', createAccount);

    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = normalizeEmail(new FormData(e.target).get('email'));
        var password = new FormData(e.target).get('password');
        var user = getUsers().find(function(u) { return u.email === email && u.password === password; });
        if (!user) {
          var el = document.getElementById('loginError');
          el.textContent = 'Incorrect email or password.';
          el.style.display = 'block';
          return;
        }
        e.target.reset();
        document.getElementById('loginError').style.display = 'none';
        closeModal('loginModal');
        loginUser(user);
      });
    }
  }

  // ---- dashboard.html init ----
  if (isDashboard) {
    var user = currentUser();
    if (!user) {
      window.location.href = 'index.html';
      return;
    }
    showDashboard(user);

    var profileEditForm = document.getElementById('profileEditForm');
    if (profileEditForm) {
      profileEditForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var current = currentUser();
        if (!current) return;
        var data = new FormData(e.target);
        var users = getUsers();
        var index = users.findIndex(function(u) { return u.id === current.id; });
        if (index === -1) return;
        users[index].name = data.get('name').trim();
        users[index].phone = data.get('phone').trim();
        users[index].education = data.get('education');
        saveUsers(users);
        var updated = users[index];
        showDashboard(updated);
        var msg = document.getElementById('profileEditSuccess');
        msg.textContent = 'Profile updated successfully.';
        msg.style.display = 'block';
        setTimeout(function() { closeModal('profileEditModal'); msg.style.display = 'none'; }, 700);
      });
    }

    var assignmentForm = document.getElementById('assignmentForm');
    if (assignmentForm) {
      assignmentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var currentUser = currentUser();
        var fileInput = document.getElementById('assignmentFile');
        var file = fileInput.files && fileInput.files[0];
        var details = document.getElementById('assignmentDetails').value.trim();
        var submitBtn = document.getElementById('assignmentSubmitBtn');
        var msg = document.getElementById('assignmentSuccess');
        if (!currentUser || currentUser.role !== 'student') { alert('Student login required.'); return; }
        if (!file) { alert('Please choose a file to upload.'); return; }
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';
        var item = {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          userId: currentUser.id,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          details: details,
          createdAt: new Date().toISOString(),
          status: 'pending',
          taskerId: null
        };
        saveFile(item.id, file).then(function() {
          var assignments = getAssignments();
          assignments.push(item);
          saveAssignments(assignments);
          msg.textContent = 'Assignment uploaded and submitted successfully. You can now track it from your dashboard.';
          msg.style.display = 'block';
          setTimeout(function() {
            closeModal('assignmentModal');
            e.target.reset();
            msg.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Assignment';
            renderAssignments(currentUser.id);
          }, 900);
        }).catch(function(err) {
          console.error('Assignment upload failed:', err);
          alert('The assignment could not be saved in this browser. Please try another file or browser.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Assignment';
        });
      });
    }
  }

  // ---- Escape closes modals on both pages ----
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      ['studentModal', 'loginModal', 'profileEditModal', 'assignmentModal'].forEach(closeModal);
    }
  });
});