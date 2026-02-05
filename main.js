// main.js
let cart = [];
let orders = []; // Simple orders history

// User Management
const USERS_KEY = 'angkor_auto_users';
const CURRENT_USER_KEY = 'angkor_auto_current_user';
const CARS_KEY = 'angkor_auto_cars';

function initUsers() {
  let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  // Pre-create admin if not exists
  if (!users.find((u) => u.username === 'admin')) {
    users.push({
      username: 'admin',
      email: 'admin@angkorauto.com',
      password: 'admin', // In production, hash passwords!
      role: 'admin',
      avatar: null,
    });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  return users;
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
}

function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function updateUserInStorage(updatedUser) {
  let users = initUsers();
  const oldUsername = getCurrentUser().username;
  const index = users.findIndex((u) => u.username === oldUsername);
  if (index !== -1) {
    users[index] = updatedUser;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    setCurrentUser(updatedUser);
  }
}

function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  updateProfileDisplay();
}

// Update profile display
function updateProfileDisplay() {
  // No text to update since span is removed
  const currentUser = getCurrentUser();
  if (currentUser) {
    // Optionally change icon if needed, e.g., to a different user icon
    document.querySelector('.profile i').className = 'bi bi-person-check-fill';
  } else {
    document.querySelector('.profile i').className = 'bi bi-person';
  }
}

// Show/Hide Password Functionality
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle-password').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const targetId = toggle.dataset.target;
      const passwordInput = document.getElementById(targetId);
      const icon = toggle.querySelector('i');
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
      } else {
        passwordInput.type = 'password';
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
      }
    });
  });

  // Profile Click Handler
  document.getElementById('profile-trigger').addEventListener('click', () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      // Show profile modal
      showProfileModal(currentUser);
    } else {
      // Show auth modal
      const authModal = new bootstrap.Modal(document.getElementById('authModal'));
      authModal.show();
    }
  });

  // Add Car Form Handler
  document.getElementById('addCarForm').addEventListener('submit', (e) => {
    e.preventDefault();
    addCar();
  });

  // Image Preview on File Select for Car
  document.getElementById('new-car-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById('preview-img').src = e.target.result;
        document.getElementById('image-preview').style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  // Avatar Preview on File Select for Profile
  document.getElementById('edit-avatar').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById('preview-avatar').src = e.target.result;
        document.getElementById('avatar-preview').style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  // Edit Profile Form Handler
  document.getElementById('editProfileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const currentUser = getCurrentUser();
    const updatedUser = {
      username: document.getElementById('edit-username').value,
      email: document.getElementById('edit-email').value,
      password: document.getElementById('edit-password').value || currentUser.password, // Keep old if blank
      role: currentUser.role, // Cannot change role
    };
    const avatarFile = document.getElementById('edit-avatar').files[0];
    if (avatarFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updatedUser.avatar = e.target.result;
        updateUserInStorage(updatedUser);
        alert('Profile updated successfully!');
        showProfileView();
      };
      reader.readAsDataURL(avatarFile);
    } else {
      updateUserInStorage(updatedUser);
      alert('Profile updated successfully!');
      showProfileView();
    }
  });

  // Cancel Edit
  document.getElementById('cancel-edit-btn').addEventListener('click', showProfileView);

  // Edit User Form Handler (Admin)
  document.getElementById('editUserForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('edit-user-username').value;
    const email = document.getElementById('edit-user-email').value;
    const role = document.getElementById('edit-user-role').value;
    // Try to update on server first
    fetch(`/api/users/${encodeURIComponent(username)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    })
      .then((r) => {
        if (!r.ok) throw new Error('Server update failed');
        return r.json();
      })
      .then(() => {
        bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
        renderUsersTable();
        alert('User updated successfully!');
      })
      .catch(() => {
        // Fallback to localStorage update
        let users = initUsers();
        const userIndex = users.findIndex((u) => u.username === username);
        if (userIndex !== -1) {
          users[userIndex].email = email;
          users[userIndex].role = role;
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
          bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
          renderUsersTable();
          alert('User updated locally.');
        }
      });
  });

  // Edit Car Form Handler - Updated Mileage Parsing
  document.getElementById('editCarForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('edit-car-id').value);
    const name = document.getElementById('edit-car-name').value;
    const brand = document.getElementById('edit-car-brand').value;
    const model = document.getElementById('edit-car-model').value;
    const category = document.getElementById('edit-car-category').value;
    const yearVal = document.getElementById('edit-car-year').value;
    const year = yearVal ? parseInt(yearVal) : 0;
    const bodyType = document.getElementById('edit-car-body-type').value;
    const transmission = document.getElementById('edit-car-transmission').value;
    const condition = document.getElementById('edit-car-condition').value;
    const mileageText = document.getElementById('edit-car-mileage').value.replace(/,/g, '');
    const mileage = mileageText ? parseInt(mileageText) : 0;
    const color = document.getElementById('edit-car-color').value || 'Not specified';
    const priceVal = document.getElementById('edit-car-price').value;
    const price = priceVal ? parseInt(priceVal) : 0;
    const description = document.getElementById('edit-car-description').value;
    const imageFile = document.getElementById('edit-car-image').files[0];
    const imageUrl = document.getElementById('edit-car-image-url').value;
    
    // Get current car image from DB first
    fetch('/api/cars').then(r => r.json()).then(cars => {
      const currentCar = cars.find(c => c.id === id);
      let imageToSend = currentCar?.image || 'images/placeholder.png';
      
      // Priority: URL > File > Current image
      if (imageUrl) {
        imageToSend = imageUrl;
        sendUpdateRequest(id, { name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image: imageToSend });
      } else if (imageFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imageToSend = e.target.result;
          sendUpdateRequest(id, { name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image: imageToSend });
        };
        reader.readAsDataURL(imageFile);
      } else {
        sendUpdateRequest(id, { name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image: imageToSend });
      }
    }).catch(() => {
      alert('Error loading car data. Please refresh and try again.');
    });
    
    function sendUpdateRequest(carId, carData) {
      fetch(`/api/cars/${carId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carData)
      })
      .then(r => r.json())
      .then(data => {
        renderCarsTable();
        renderCars();
        renderCarsCrudTable();
        document.getElementById('edit-car-image-url').value = '';
        bootstrap.Modal.getInstance(document.getElementById('editCarModal')).hide();
        alert('Car updated successfully!');
      })
      .catch(err => {
        console.error('Update error:', err);
        alert('Failed to update car. Check console for details.');
      });
    }
  });
});

// Show Profile View (toggle from edit)
function showProfileView() {
  document.getElementById('profile-view').style.display = 'block';
  document.getElementById('profile-edit').style.display = 'none';
  const currentUser = getCurrentUser();
  document.getElementById('profile-username').textContent = currentUser.username;
  document.getElementById('profile-email').textContent = currentUser.email || 'No email provided';
  document.getElementById('user-avatar').src =
    currentUser.avatar ||
    'https://via.placeholder.com/150?text=' + currentUser.username.charAt(0).toUpperCase();
}

// Show Profile Edit
function showProfileEdit() {
  const currentUser = getCurrentUser();
  document.getElementById('edit-username').value = currentUser.username;
  document.getElementById('edit-email').value = currentUser.email || '';
  document.getElementById('edit-password').value = '';
  document.getElementById('edit-avatar').value = '';
  document.getElementById('avatar-preview').style.display = 'none';
  document.getElementById('profile-view').style.display = 'none';
  document.getElementById('profile-edit').style.display = 'block';
}

// Show Profile Modal
function showProfileModal(user) {
  // Close dashboard modal to prevent stacking issues
  const dashboardModal = bootstrap.Modal.getInstance(
    document.getElementById('adminDashboardModal')
  );
  if (dashboardModal) {
    dashboardModal.hide();
  }

  showProfileView();
  document.getElementById('profile-username').textContent = user.username;
  document.getElementById('profile-email').textContent = user.email || 'No email provided';
  document.getElementById('user-avatar').src =
    user.avatar || 'https://via.placeholder.com/150?text=' + user.username.charAt(0).toUpperCase();

  // Edit Profile Button
  document.getElementById('edit-profile-btn').onclick = showProfileEdit;

  // My Orders Button - Updated to Show Styled Modal
  document.getElementById('my-orders-btn').onclick = () => {
    renderMyOrdersTable();
    const ordersModal = new bootstrap.Modal(document.getElementById('myOrdersModal'));
    ordersModal.show();
  };

  // Dashboard Button (Admin Only)
  const dashboardBtn = document.getElementById('dashboard-btn');
  if (user.role === 'admin') {
    dashboardBtn.style.display = 'block';
    dashboardBtn.onclick = () => {
      bootstrap.Modal.getInstance(document.getElementById('profileModal')).hide();
      showAdminDashboard();
    };
  } else {
    dashboardBtn.style.display = 'none';
  }

  // Logout from Profile
  document.getElementById('logout-from-profile').onclick = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      bootstrap.Modal.getInstance(document.getElementById('profileModal')).hide();
      alert('Logged out successfully!');
    }
  };

  const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
  profileModal.show();
}

// Update showAdminDashboard (Call Render Messages)
function showAdminDashboard() {
  renderUsersTable();
  renderOrdersTable();
  renderCarsTable();
  renderMessagesTable();
  renderCarsCrudTable(); // Render the new Car CRUD tab

  const adminModal = new bootstrap.Modal(document.getElementById('adminDashboardModal'));
  adminModal.show();
}

// Show Car Detail Modal - Fixed Null Reference
// Show Car Detail — fetch from API
async function showCarDetail(id) {
  try {
    const resp = await fetch('/api/cars');
    const cars = await resp.json();
    const car = cars.find((c) => c.id === id);
    
    if (car) {
      document.getElementById('detail-image').src = car.image;
      document.getElementById('detail-image').alt = car.name;
      document.getElementById('detail-name').textContent = car.name;
      const detailModel = document.getElementById('detail-model');
      if (detailModel) detailModel.textContent = car.model || 'N/A';
      const detailBrand = document.getElementById('detail-brand');
      if (detailBrand) detailBrand.textContent = car.brand || 'N/A';
      const detailCategory = document.getElementById('detail-category');
      if (detailCategory) detailCategory.textContent = car.category || 'N/A';
      const detailBodyType = document.getElementById('detail-body-type');
      if (detailBodyType) detailBodyType.textContent = car.bodyType || 'N/A';
      const detailTransmission = document.getElementById('detail-transmission');
      if (detailTransmission) detailTransmission.textContent = car.transmission || 'N/A';
      document.getElementById('detail-condition').textContent = car.condition;
      document.getElementById('detail-year').textContent = car.year;
      document.getElementById('detail-mileage').textContent = car.mileage;
      const detailColor = document.getElementById('detail-color');
      if (detailColor) detailColor.textContent = car.color || 'N/A';
      document.getElementById('detail-price').textContent = car.price;
      document.getElementById('detail-description').textContent = car.description || 'No description available.';
      const detailModal = new bootstrap.Modal(document.getElementById('carDetailModal'));
      detailModal.show();

      // Order button in detail modal
      document.getElementById('detail-order-btn').onclick = () => {
        handleOrder(car.id);
        detailModal.hide();
      };
    }
  } catch (err) {
    console.error('Error fetching car details:', err);
    alert('Failed to load car details.');
  }
}

// Render Users Table
function renderUsersTable() {
  const tbody = document.getElementById('users-table-body');
  // Try to fetch users from server, fallback to localStorage
  fetch('/api/users')
    .then((r) => r.json())
    .then((users) => {
      tbody.innerHTML = (users || [])
        .map(
          (user) => `
    <tr>
      <td>${user.username}</td>
      <td>${user.email || 'N/A'}</td>
      <td><span class="badge bg-${user.role === 'admin' ? 'danger' : 'secondary'}">${user.role}</span></td>
      <td>
        <button class="btn btn-sm btn-primary me-1" onclick="editUser('${user.username}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.username}')">Delete</button>
      </td>
    </tr>
  `
        )
        .join('');
    })
    .catch(() => {
      const users = initUsers();
      tbody.innerHTML = users
        .map(
          (user) => `
    <tr>
      <td>${user.username}</td>
      <td>${user.email || 'N/A'}</td>
      <td><span class="badge bg-${user.role === 'admin' ? 'danger' : 'secondary'}">${user.role}</span></td>
      <td>
        <button class="btn btn-sm btn-primary me-1" onclick="editUser('${user.username}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.username}')">Delete</button>
      </td>
    </tr>
  `
        )
        .join('');
    });
}

// Render Messages Table (Admin Dashboard)
function renderMessagesTable() {
  const tbody = document.getElementById('messages-table-body');
  // Try to fetch messages from server, fallback to localStorage
  fetch('/api/messages')
    .then((r) => r.json())
    .then((messages) => {
      tbody.innerHTML = (messages || [])
        .map(
          (msg) => `
    <tr>
      <td>${msg.user}</td>
      <td>${msg.email}</td>
      <td><a href="#" class="text-decoration-none" onclick="viewFullMessage('${(msg.message || '').replace(/'/g, "\\'")}', '${msg.user}'); return false;" title="Click to view full message">${(msg.message || '').substring(0, 50)}...</a></td>
      <td>${msg.date}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteMessage(${msg.id});">
          <i class="bi bi-trash"></i> Delete
        </button>
      </td>
    </tr>
  `
        )
        .join('');
    })
    .catch(() => {
      const messages = JSON.parse(localStorage.getItem('angkor_auto_messages')) || [];
      tbody.innerHTML = messages
        .map(
          (msg, index) => `
    <tr>
      <td>${msg.user}</td>
      <td>${msg.email}</td>
      <td><a href="#" class="text-decoration-none" onclick="viewFullMessage('${(msg.message || '').replace(/'/g, "\\'")}', '${msg.user}'); return false;" title="Click to view full message">${(msg.message || '').substring(0, 50)}...</a></td>
      <td>${msg.date}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteMessage(${index});">
          <i class="bi bi-trash"></i> Delete
        </button>
      </td>
    </tr>
  `
        )
        .join('');
    });
}

// View Full Message Function
function viewFullMessage(message, sender) {
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'viewMessageModal';
  modal.tabIndex = '-1';
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Full Message from ${sender}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
  modal.addEventListener('hidden.bs.modal', () => {
    modal.remove();
  });
}

// Delete Message Function (Admin)
function deleteMessage(idOrIndex) {
  if (!confirm('Delete this message? This cannot be undone.')) return;
  // If numeric id (most likely from server), try server delete
  if (Number.isInteger(idOrIndex) && idOrIndex > 0) {
    fetch(`/api/messages/${idOrIndex}`, { method: 'DELETE' })
      .then((r) => {
        if (!r.ok) throw new Error('Server delete failed');
        return r.json();
      })
      .then(() => {
        renderMessagesTable();
        alert('Message deleted successfully!');
      })
      .catch(() => {
        // fallback to localStorage deletion by index if server delete fails
        let messages = JSON.parse(localStorage.getItem('angkor_auto_messages')) || [];
        messages.splice(idOrIndex, 1);
        localStorage.setItem('angkor_auto_messages', JSON.stringify(messages));
        renderMessagesTable();
        alert('Message deleted locally.');
      });
  } else {
    // treat as local index
    let messages = JSON.parse(localStorage.getItem('angkor_auto_messages')) || [];
    messages.splice(idOrIndex, 1);
    localStorage.setItem('angkor_auto_messages', JSON.stringify(messages));
    renderMessagesTable();
    alert('Message deleted successfully!');
  }
}

// Edit User (Admin)
function editUser(username) {
  // Close dashboard modal to prevent stacking issues
  const dashboardModal = bootstrap.Modal.getInstance(
    document.getElementById('adminDashboardModal')
  );
  if (dashboardModal) {
    dashboardModal.hide();
  }

  // Try to fetch from server first
  fetch('/api/users')
    .then((r) => r.json())
    .then((users) => {
      const user = (users || []).find((u) => u.username === username);
      if (user) {
        document.getElementById('edit-user-username').value = user.username;
        document.getElementById('edit-user-email').value = user.email || '';
        document.getElementById('edit-user-role').value = user.role || 'customer';
        const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
        editUserModal.show();
      } else {
        // fallback to local storage
        const usersLocal = initUsers();
        const u = usersLocal.find((x) => x.username === username);
        if (u) {
          document.getElementById('edit-user-username').value = u.username;
          document.getElementById('edit-user-email').value = u.email || '';
          document.getElementById('edit-user-role').value = u.role || 'customer';
          const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
          editUserModal.show();
        }
      }
    })
    .catch(() => {
      const usersLocal = initUsers();
      const u = usersLocal.find((x) => x.username === username);
      if (u) {
        document.getElementById('edit-user-username').value = u.username;
        document.getElementById('edit-user-email').value = u.email || '';
        document.getElementById('edit-user-role').value = u.role || 'customer';
        const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
        editUserModal.show();
      }
    });
}

// Updated Render Orders Table (Admin Dashboard)
function renderOrdersTable() {
  const tbody = document.getElementById('orders-table-body');
  tbody.innerHTML = orders
    .map(
      (order, index) => `
    <tr>
      <td>${order.user || 'N/A'}</td>
      <td>${order.car}</td>
      <td>$${order.total}</td>
      <td>${order.date}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteOrder(${index}, false);">
          <i class="bi bi-trash"></i> Delete
        </button>
      </td>
    </tr>
  `
    )
    .join('');
}

// Updated Render My Orders Table (Profile - Fixed Delete Button onclick)
function renderMyOrdersTable() {
  const currentUser = getCurrentUser();
  const userOrders = orders.filter((order) => order.user === currentUser.username);
  const tbody = document.getElementById('orders-table-body-profile');
  const noOrdersMsg = document.getElementById('no-orders-msg');

  if (userOrders.length === 0) {
    tbody.innerHTML = '';
    noOrdersMsg.style.display = 'block';
  } else {
    noOrdersMsg.style.display = 'none';
    tbody.innerHTML = userOrders
      .map((order, localIndex) => {
        // Find global index safely (avoids template literal escaping issues)
        const globalIndex = orders.findIndex(
          (o) => o.date === order.date && o.car === order.car && o.total === order.total
        );
        return `
      <tr>
        <td>${order.date}</td>
        <td>${order.car}</td>
        <td>$${order.total}</td>
        <td><span class="badge bg-success">Confirmed</span></td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteOrder(${globalIndex}, true);">
            <i class="bi bi-trash"></i> Delete
          </button>
        </td>
      </tr>
    `;
      })
      .join('');
  }
}

// Render Cars Table - Fixed Column Alignment
function renderCarsTable() {
  const savedCars = JSON.parse(localStorage.getItem(CARS_KEY)) || [];
  const tbody = document.getElementById('cars-table-body');
  tbody.innerHTML = savedCars
    .map(
      (car) => `
    <tr>
      <td>${car.name}</td>
      <td>${car.brand || 'N/A'}</td> <!-- New column -->
      <td>${car.model}</td>
      <td>${car.category}</td>
      <td>${car.year}</td>
      <td>${car.mileage}</td>
      <td>$${car.price}</td>
      <td><img src="${car.image}" alt="${car.name}" style="width: 50px; height: 30px; object-fit: cover;"></td>
      <td>
        <button class="btn btn-sm btn-primary me-1" onclick="editCar(${car.id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCar(${car.id})">Delete</button>
      </td>
    </tr>
  `
    )
    .join('');
}

// Render Cars CRUD Tab Table — fetches from API
async function renderCarsCrudTable() {
  try {
    const resp = await fetch('/api/cars');
    const cars = await resp.json();
    const tbody = document.getElementById('cars-crud-table-body');
    tbody.innerHTML = cars
      .map(
        (car) => `
      <tr>
        <td>${car.name}</td>
        <td>${car.brand || 'N/A'}</td>
        <td>${car.model}</td>
        <td>$${car.price}</td>
        <td>${car.year}</td>
        <td>${car.condition}</td>
        <td>
          <button class="btn btn-sm btn-primary me-1" onclick="editCar(${car.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteCar(${car.id})">Delete</button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    console.error('Error loading cars for CRUD table:', err);
    document.getElementById('cars-crud-table-body').innerHTML = '<tr><td colspan="7" class="text-danger">Failed to load cars</td></tr>';
  }
}

// Render Cars - Updated Order Button to Add to Cart & Redirect
// Render Cars — fetch from backend API if available, otherwise fall back to localStorage
async function renderCarsAsync() {
  const grid = document.getElementById('car-grid');
  let cars = [];
  try {
    const resp = await fetch('/api/cars');
    if (resp.ok) {
      cars = await resp.json();
    } else {
      throw new Error('API not available');
    }
  } catch (e) {
    cars = JSON.parse(localStorage.getItem(CARS_KEY)) || [];
  }

  if (!cars || cars.length === 0) {
    grid.innerHTML = '<p class="text-center text-muted col-12">No cars available.</p>';
    return;
  }

  grid.innerHTML = cars
    .map(
      (car) => `
  <div class="car-card" onclick="showCarDetail(${car.id}); return false;">
    <img src="${car.image || 'images/placeholder.png'}" alt="${car.name}">
    <div class="car-card-content">
      <h3>${car.year} ${car.name}</h3>
      <p>Condition: ${car.condition || 'N/A'}</p>
      <p>Mileage: ${car.mileage || 0} km</p>
      <p>Color: ${car.color || 'N/A'}</p>
      <p>Price: $${car.price || '0'}</p>
      <button class="order-btn w-100" onclick="handleOrder(${car.id}); event.stopPropagation(); return false;">Order</button>
    </div>
  </div>
`
    )
    .join('');
}

// Edit Car (Admin)
// Edit Car — fetch from API
async function editCar(id) {
  // Close dashboard modal to prevent stacking issues
  const dashboardModal = bootstrap.Modal.getInstance(
    document.getElementById('adminDashboardModal')
  );
  if (dashboardModal) {
    dashboardModal.hide();
  }

  try {
    const resp = await fetch('/api/cars');
    const cars = await resp.json();
    const car = cars.find((c) => c.id === id);
    if (car) {
      document.getElementById('edit-car-id').value = car.id;
      document.getElementById('edit-car-name').value = car.name;
      document.getElementById('edit-car-brand').value = car.brand || '';
      document.getElementById('edit-car-model').value = car.model;
      document.getElementById('edit-car-category').value = car.category;
      document.getElementById('edit-car-year').value = car.year;
      document.getElementById('edit-car-body-type').value = car.bodyType;
      document.getElementById('edit-car-transmission').value = car.transmission;
      document.getElementById('edit-car-condition').value = car.condition;
      document.getElementById('edit-car-mileage').value = car.mileage;
      document.getElementById('edit-car-color').value = car.color || '#000000';
      document.getElementById('edit-car-price').value = car.price;
      document.getElementById('edit-car-description').value = car.description;
      const editCarModal = new bootstrap.Modal(document.getElementById('editCarModal'));
      editCarModal.show();
    }
  } catch (err) {
    console.error('Error loading car for edit:', err);
    alert('Failed to load car data.');
  }
}

// Delete User
function deleteUser(username) {
  const currentUser = getCurrentUser();
  if (username === currentUser.username) {
    alert('Cannot delete yourself!');
    return;
  }
  if (confirm(`Delete user ${username}?`)) {
    // Try server delete first
    fetch(`/api/users/${encodeURIComponent(username)}`, { method: 'DELETE' })
      .then((r) => {
        if (!r.ok) throw new Error('Server delete failed');
        return r.json();
      })
      .then(() => {
        renderUsersTable();
        alert('User deleted successfully.');
      })
      .catch(() => {
        // fallback to localStorage
        let users = initUsers();
        users = users.filter((u) => u.username !== username);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        renderUsersTable();
        alert('User deleted locally.');
      });
  }
}

// Delete Order Function (Shared for Profile & Admin)
function deleteOrder(orderIndex, isProfile = false) {
  if (confirm('Delete this order? This cannot be undone.')) {
    orders.splice(orderIndex, 1); // Remove from array
    localStorage.setItem('angkor_auto_orders', JSON.stringify(orders)); // Sync to storage
    if (isProfile) {
      renderMyOrdersTable(); // Re-render profile modal
    } else {
      renderOrdersTable(); // Re-render admin table
    }
    alert('Order deleted successfully!');
  }
}

// Add Car — sends to backend API
function addCar() {
  const name = document.getElementById('new-car-name').value;
  const brand = document.getElementById('new-car-brand').value;
  const model = document.getElementById('new-car-model').value;
  const category = document.getElementById('new-car-category').value;
  const yearVal = document.getElementById('new-car-year').value;
  const year = yearVal ? parseInt(yearVal) : 0;
  const bodyType = document.getElementById('new-car-body-type').value;
  const transmission = document.getElementById('new-car-transmission').value;
  const condition = document.getElementById('new-car-condition').value;
  const mileageText = document.getElementById('new-car-mileage').value.replace(/,/g, '');
  const mileage = mileageText ? parseInt(mileageText) : 0;
  const color = document.getElementById('new-car-color').value || 'Not specified';
  const priceVal = document.getElementById('new-car-price').value;
  const price = priceVal ? parseInt(priceVal) : 0;
  const description = document.getElementById('new-car-description').value;
  const imageFile = document.getElementById('new-car-image').files[0];
  const imageUrl = document.getElementById('new-car-image-url').value;
  
  // Validate required text fields only
  if (!name || !brand || !model || !category || !bodyType || !transmission || !condition || !description) {
    alert('Please fill all required fields (Name, Brand, Model, Category, Body Type, Transmission, Condition, Description).');
    return;
  }
  
  if (!imageFile && !imageUrl) {
    alert('Please provide either an image file or an image URL.');
    return;
  }
  
  // Use URL if provided, otherwise use file
  if (imageUrl) {
    const newCar = {
      name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description,
      image: imageUrl,
    };
    submitNewCar(newCar);
  } else if (imageFile) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newCar = {
        name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description,
        image: e.target.result,
      };
      submitNewCar(newCar);
    };
    reader.readAsDataURL(imageFile);
  }
}

function submitNewCar(carData) {
  fetch('/api/cars', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(carData)
  })
  .then(r => r.json())
  .then(data => {
    renderCarsTable();
    renderCars();
    renderCarsCrudTable();
    document.getElementById('addCarForm').reset();
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('new-car-image-url').value = '';
    alert('Car added successfully for Cambodia market!');
  })
  .catch(err => {
    console.error('Add error:', err);
    alert('Failed to add car. Check console for details.');
  });
}

// Delete Car — calls backend API
function deleteCar(id) {
  if (confirm('Delete this car?')) {
    fetch(`/api/cars/${id}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(data => {
        renderCarsTable();
        renderCars();
        renderCarsCrudTable();
        alert('Car deleted successfully!');
      })
      .catch(err => {
        console.error('Delete error:', err);
        alert('Failed to delete car. Check console for details.');
      });
  }
}

// Login Handler
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const users = initUsers();
  const user = users.find((u) => u.username === username && u.password === password);
  if (user) {
    setCurrentUser(user);
    updateProfileDisplay();
    bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
    alert('Login successful! Role: ' + user.role);
  } else {
    alert('Invalid credentials!');
  }
});

// Register Handler
document.getElementById('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const role = document.getElementById('registerRole').value;
  let users = initUsers();
  if (users.find((u) => u.username === username)) {
    alert('Username already exists!');
    return;
  }
  const newUser = { username, email, password, role, avatar: null };
  // Try to persist to server; fallback to localStorage if server unavailable
  const registerStatus = document.getElementById('register-status');
  registerStatus.style.display = 'inline';
  registerStatus.textContent = 'Saving...';
  registerStatus.className = 'form-text text-muted mt-2';

  fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newUser)
  })
    .then((r) => {
      if (!r.ok) throw new Error('Server rejected registration');
      return r.json();
    })
    .then(() => {
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      registerStatus.textContent = 'Saved to server';
      registerStatus.className = 'form-text text-success mt-2';
      renderUsersTable();
      setTimeout(() => {
        registerStatus.style.display = 'none';
      }, 3000);
      const loginTab = new bootstrap.Tab(document.getElementById('login-tab'));
      loginTab.show();
    })
    .catch(() => {
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      registerStatus.textContent = 'Saved locally (server unavailable)';
      registerStatus.className = 'form-text text-warning mt-2';
      setTimeout(() => {
        registerStatus.style.display = 'none';
      }, 4000);
      const loginTab = new bootstrap.Tab(document.getElementById('login-tab'));
      loginTab.show();
    });
});

// Render Cars (wrapper) — calls async renderer
function renderCars() {
  renderCarsAsync();
}

// Filter Cars by Category and Brand
let currentFilters = { category: '', brand: '' };

function applyFilters() {
  const category = document.getElementById('filter-category').value;
  const brand = document.getElementById('filter-brand').value;
  currentFilters = { category, brand };
  renderFilteredCars();
}

function clearFilters() {
  document.getElementById('filter-category').value = '';
  document.getElementById('filter-brand').value = '';
  currentFilters = { category: '', brand: '' };
  renderFilteredCars();
}

// Render Filtered Cars
function renderFilteredCars() {
  const savedCars = JSON.parse(localStorage.getItem(CARS_KEY)) || [];
  let filteredCars = savedCars.filter((car) => {
    const matchesCategory = !currentFilters.category || car.category === currentFilters.category;
    const matchesBrand =
      !currentFilters.brand || car.name.toLowerCase().includes(currentFilters.brand.toLowerCase());
    return matchesCategory && matchesBrand;
  });
  const grid = document.getElementById('car-grid');
  if (filteredCars.length === 0) {
    grid.innerHTML =
      '<p class="text-center text-muted col-12">No cars match the selected filters. Try adjusting your search.</p>';
  } else {
    grid.innerHTML = filteredCars
      .map(
        (car) => `
      <div class="car-card" onclick="showCarDetail(${car.id})">
        <img src="${car.image}" alt="${car.name}">
        <div class="car-card-content">
          <h3>${car.year} ${car.name}</h3>
          <p>Condition: ${car.condition}</p>
          <p>Mileage: ${car.mileage} km</p>
          <p>Color: ${car.color}</p>
          <p>Price: $${car.price}</p>
          <button class="order-btn w-100" onclick="showCarDetail(${car.id}); event.stopPropagation();">Order</button>
        </div>
      </div>
    `
      )
      .join('');
  }
  // Update initial render to use filtered
  if (Object.values(currentFilters).every((f) => !f)) {
    renderCars(); // Full render if no filters
  }
}

// Add Clear Cart Listener (Call on DOM Ready) - Full Integration in main.js
document.addEventListener('DOMContentLoaded', () => {
  // Existing init code (e.g., profile, forms, etc.) goes here...

  // Clear Cart Button Listener
  const clearBtn = document.getElementById('clear-cart-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearCart);
  }

  // ... (rest of existing DOMContentLoaded code, e.g., other listeners)
});

// Clear Cart Function - Empties Cart & Saves to localStorage
function clearCart() {
  if (confirm('Clear all items from cart? This cannot be undone.')) {
    cart = [];
    localStorage.setItem('angkor_auto_cart', JSON.stringify(cart)); // Sync to storage
    const countElement = document.getElementById('cart-count');
    if (countElement) {
      countElement.textContent = 0;
    }
    renderCart(); // Re-render empty cart
    alert('Cart cleared!');
  }
}

// Updated handleOrder - Show Login Modal if Not Logged In
async function handleOrder(id) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert('Please login to order!');
    const authModal = new bootstrap.Modal(document.getElementById('authModal'));
    authModal.show();
    return;
  }
  let car = null;
  try {
    const resp = await fetch('/api/cars');
    if (resp.ok) {
      const cars = await resp.json();
      car = cars.find((c) => c.id === id);
      if (Array.isArray(cars) && cars.length) {
        localStorage.setItem(CARS_KEY, JSON.stringify(cars));
      }
    }
  } catch (e) {
    // Ignore and fall back to localStorage
  }
  if (!car) {
    const savedCars = JSON.parse(localStorage.getItem(CARS_KEY)) || [];
    car = savedCars.find((c) => c.id === id);
  }
  if (car) {
    // Prevent duplicate
    if (cart.some((item) => item.id === car.id)) {
      alert(`${car.name} is already in cart!`);
      return;
    }
    cart.push(car);
    localStorage.setItem('angkor_auto_cart', JSON.stringify(cart)); // Save
    const countElement = document.getElementById('cart-count');
    if (countElement) {
      countElement.textContent = cart.length;
    }
    alert(`${car.name} added to cart! Count: ${cart.length}`);
    // Optional: Redirect if on cars.html
    if (window.location.pathname.includes('cars.html')) {
      window.location.href = 'index.html';
    }
  } else {
    alert('Car not found. Please refresh the page and try again.');
  }
}

// Cart Modal - Updated with Remove Functionality
function renderCart() {
  const items = document.getElementById('cart-items');
  const summaryItems = document.getElementById('cart-summary-items');
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  if (cart.length === 0) {
    items.innerHTML = '<p class="text-center text-muted">Your cart is empty</p>';
    summaryItems.innerHTML = '';
  } else {
    items.innerHTML = cart
      .map(
        (item, index) => `
      <div class="card mb-2">
        <div class="card-body d-flex justify-content-between align-items-center">
          <div class="flex-grow-1">
            <h6>${item.name} (${item.year})</h6>
            <p class="mb-0 text-muted">$${item.price}</p>
          </div>
          <button type="button" class="btn btn-danger btn-sm ms-2" data-remove-index="${index}">
            <i class="bi bi-trash"></i> Remove
          </button>
        </div>
      </div>
    `
      )
      .join('');

    summaryItems.innerHTML = cart
      .map((item) => `<li>${item.name} (${item.year}) - $${item.price}</li>`)
      .join('');
  }

  document.getElementById('cart-total').textContent = total;
  document.getElementById('cart-count').textContent = cart.length;
}

function removeFromCart(index) {
  try {
    if (index < 0 || index >= cart.length) {
      alert('Invalid item. Please refresh cart.');
      return;
    }
    if (confirm('Remove this car from cart?')) {
      cart.splice(index, 1); // Remove from array
      localStorage.setItem('angkor_auto_cart', JSON.stringify(cart)); // Sync to storage
      renderCart(); // Re-render
      alert('Car removed from cart.');
    }
  } catch (error) {
    console.error('Remove error:', error);
    alert('Error removing item. Please try again.');
  }
}

function initCartEvents() {
  const items = document.getElementById('cart-items');
  if (!items) return;
  items.addEventListener('click', (e) => {
    const button = e.target.closest('[data-remove-index]');
    if (!button) return;
    const index = parseInt(button.dataset.removeIndex, 10);
    if (Number.isNaN(index)) return;
    removeFromCart(index);
  });
}

document.addEventListener('DOMContentLoaded', initCartEvents);

document.querySelector('.shop-icon').addEventListener('click', () => {
  renderCart();
  const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
  cartModal.show();
});

// Cart Modal - Updated Checkout Button
document.getElementById('checkout').addEventListener('click', () => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert('Please login to checkout!');
    const authModal = new bootstrap.Modal(document.getElementById('authModal'));
    authModal.show();
    bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
    return;
  }
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  // Open order form modal
  renderOrderForm();
  const orderFormModal = new bootstrap.Modal(document.getElementById('orderFormModal'));
  orderFormModal.show();
  bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
});

// Render Order Summary in Form
function renderOrderForm() {
  const items = document.getElementById('order-summary-items');
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  items.innerHTML = cart
    .map((item) => `<li>${item.name} (${item.year}) - $${item.price}</li>`)
    .join('');
  document.getElementById('order-total').textContent = total;
}

// Payment Method Toggle
function initPaymentFields() {
  const methodSelect = document.getElementById('order-payment-method');
  if (!methodSelect) return;
  const cardFields = document.getElementById('card-payment-fields');
  const mobileFields = document.getElementById('mobile-payment-fields');
  const cardInputs = cardFields ? Array.from(cardFields.querySelectorAll('input')) : [];
  const mobileInputs = mobileFields ? Array.from(mobileFields.querySelectorAll('input')) : [];

  const setRequired = (inputs, required) => {
    inputs.forEach((input) => {
      input.required = required;
    });
  };

  const updatePaymentVisibility = () => {
    const method = methodSelect.value;
    if (cardFields) cardFields.style.display = method === 'card' ? '' : 'none';
    if (mobileFields) mobileFields.style.display = method === 'aba' ? '' : 'none';
    setRequired(cardInputs, method === 'card');
    setRequired(mobileInputs, method === 'aba');
  };

  methodSelect.addEventListener('change', updatePaymentVisibility);
  updatePaymentVisibility();
}

document.addEventListener('DOMContentLoaded', initPaymentFields);

// Contact Form Handler - Save Messages to localStorage
document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('contact-name').value;
  const email = document.getElementById('contact-email').value;
  const message = document.getElementById('contact-message').value;
  if (name && email && message) {
    const newMessage = {
      user: name,
      email: email,
      message: message,
      date: new Date().toLocaleDateString(),
    };

    // Try to POST to server; fallback to localStorage if offline
    const contactStatus = document.getElementById('contact-status');
    contactStatus.style.display = 'inline';
    contactStatus.textContent = 'Sending...';
    contactStatus.className = 'form-text text-muted mt-2';

    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMessage)
    })
      .then((r) => {
        if (!r.ok) throw new Error('Server error');
        return r.json();
      })
      .then(() => {
        let messages = JSON.parse(localStorage.getItem('angkor_auto_messages')) || [];
        messages.push(newMessage);
        localStorage.setItem('angkor_auto_messages', JSON.stringify(messages));
        contactStatus.textContent = 'Sent to server';
        contactStatus.className = 'form-text text-success mt-2';
        renderMessagesTable();
        setTimeout(() => { contactStatus.style.display = 'none'; }, 3000);
        document.getElementById('contactForm').reset();
      })
      .catch(() => {
        let messages = JSON.parse(localStorage.getItem('angkor_auto_messages')) || [];
        messages.push(newMessage);
        localStorage.setItem('angkor_auto_messages', JSON.stringify(messages));
        contactStatus.textContent = 'Saved locally (server unavailable)';
        contactStatus.className = 'form-text text-warning mt-2';
        setTimeout(() => { contactStatus.style.display = 'none'; }, 4000);
        document.getElementById('contactForm').reset();
      });
  } else {
    alert('Please fill all fields.');
  }
});

// Order Form Submit - Await PDF Generation
document.getElementById('orderForm').addEventListener('submit', async (e) => {
  // Added async
  e.preventDefault();
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert('Please login to place an order!');
    return;
  }
  const formData = {
    fullName: document.getElementById('order-full-name').value,
    phone: document.getElementById('order-phone').value,
    email: document.getElementById('order-email').value,
    address: document.getElementById('order-address').value,
    total: cart.reduce((sum, item) => sum + item.price, 0),
    paymentMethod: document.getElementById('order-payment-method')?.value || 'cash',
    cardNumber: (document.getElementById('order-card-number')?.value || '').replace(/\s+/g, ''),
    cardExpiry: document.getElementById('order-card-expiry')?.value || '',
    cardCvc: document.getElementById('order-card-cvc')?.value || '',
    cardName: document.getElementById('order-card-name')?.value || '',
    mobileNumber: document.getElementById('order-mobile-number')?.value || '',
  };
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  if (validateOrderForm(formData)) {
    const receiptId = `AA-${Date.now()}`;
    console.log('Generating PDF...');
    await generateOrderPDF(formData, currentUser, cart, receiptId); // Added await
    // Save order (non-file data)
    const cardLast4 = formData.cardNumber ? formData.cardNumber.slice(-4) : '';
    const paymentSummary =
      formData.paymentMethod === 'card'
        ? `Card ****${cardLast4}`
        : formData.paymentMethod === 'aba'
        ? `ABA ${formData.mobileNumber}`
        : 'Cash on delivery';

    const order = {
      receiptId,
      user: currentUser.username,
      car: cart.map((c) => c.name).join(', '),
      total: formData.total,
      date: new Date().toLocaleDateString(),
      payment: paymentSummary,
    };
    orders.push(order);
    localStorage.setItem('angkor_auto_orders', JSON.stringify(orders));
    alert(`Order confirmed! Receipt ID: ${receiptId}`);
    cart = [];
    localStorage.setItem('angkor_auto_cart', JSON.stringify(cart));
    document.getElementById('cart-count').textContent = 0;
    renderCart();
    bootstrap.Modal.getInstance(document.getElementById('orderFormModal')).hide();
    document.getElementById('orderForm').reset();
  }
});

// Simple Form Validation - No Changes Needed
function validateOrderForm(data) {
  if (!data.fullName || !data.phone || !data.email || !data.address) {
    alert('Please fill all required fields.');
    return false;
  }
  const paymentMethod = data.paymentMethod || 'cash';
  if (paymentMethod === 'card') {
    const cardNumber = (data.cardNumber || '').replace(/\s+/g, '');
    if (cardNumber.length < 12) {
      alert('Please enter a valid card number.');
      return false;
    }
    if (!data.cardExpiry || !/^\d{2}\/\d{2}$/.test(data.cardExpiry)) {
      alert('Please enter a valid expiry date (MM/YY).');
      return false;
    }
    if (!data.cardCvc || data.cardCvc.length < 3) {
      alert('Please enter a valid CVC.');
      return false;
    }
    if (!data.cardName) {
      alert('Please enter the name on card.');
      return false;
    }
  } else if (paymentMethod === 'aba') {
    if (!data.mobileNumber || data.mobileNumber.length < 8) {
      alert('Please enter a valid ABA phone number.');
      return false;
    }
  }
  const idCardFile = document.getElementById('order-id-card').files[0];
  const licenseFile = document.getElementById('order-drivers-license').files[0];
  const familyBookFile = document.getElementById('order-family-book').files[0];
  if (!idCardFile || !licenseFile || !familyBookFile) {
    alert('Please upload all required documents.');
    return false;
  }
  return true;
}

// Generate PDF - Fixed Async Handling with Await
async function generateOrderPDF(formData, user, cartItems, receiptId) {
  if (typeof window.jspdf === 'undefined') {
    alert('jsPDF library not loaded. Check CDN in HTML.');
    return;
  }
  const finalReceiptId = receiptId || `AA-${Date.now()}`;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  // Page background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');

  // Header
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Angkor Auto', 16, 17);
  doc.setFontSize(11);
  doc.setTextColor(239, 68, 68);
  doc.text('Order Confirmation', 16, 24);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`Receipt ID: ${finalReceiptId}`, 150, 12, { align: 'right' });
  doc.text(`Date: ${new Date().toLocaleString()}`, 150, 20, { align: 'right' });

  // Customer Details
  let y = 38;
  doc.setFillColor(243, 244, 246);
  doc.rect(14, y - 6, 182, 34, 'F');
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Customer Information', 18, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Name: ${formData.fullName}`, 18, y);
  y += 6;
  doc.text(`Email: ${formData.email}`, 18, y);
  y += 6;
  doc.text(`Phone: ${formData.phone}`, 18, y);
  y += 6;
  doc.text(`Address: ${formData.address}`, 18, y);

  // Items Table
  y += 12;
  const rowHeight = 7;
  const tableTop = y;
  const tableWidth = 182;
  const tableLeft = 14;
  const tableHeaderHeight = 8;
  const tableHeight = tableHeaderHeight + cartItems.length * rowHeight + 6;

  doc.setFillColor(243, 244, 246);
  doc.rect(tableLeft, tableTop, tableWidth, tableHeight, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.rect(tableLeft, tableTop, tableWidth, tableHeight);

  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Item', tableLeft + 4, tableTop + 6);
  doc.text('Year', tableLeft + 110, tableTop + 6);
  doc.text('Price', tableLeft + 172, tableTop + 6, { align: 'right' });

  let itemY = tableTop + tableHeaderHeight;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  cartItems.forEach((item) => {
    doc.setTextColor(17, 24, 39);
    doc.text(item.name, tableLeft + 4, itemY + 5);
    doc.setTextColor(107, 114, 128);
    doc.text(String(item.year || ''), tableLeft + 110, itemY + 5);
    doc.setTextColor(17, 24, 39);
    doc.text(`$${item.price}`, tableLeft + 172, itemY + 5, { align: 'right' });
    itemY += rowHeight;
  });

  y = tableTop + tableHeight + 6;

  // Total
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Total: $${formData.total}`, tableLeft + 172, y, { align: 'right' });
  doc.setDrawColor(239, 68, 68);
  doc.setLineWidth(0.8);
  doc.line(tableLeft + 110, y + 2, tableLeft + 172, y + 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Receipt ID: ${finalReceiptId}`, tableLeft + 4, y + 2);

  // Documents
  y += 14;
  doc.setFillColor(243, 244, 246);
  doc.rect(14, y - 6, 182, 60, 'F');
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Uploaded Documents', 18, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const idCardFile = document.getElementById('order-id-card').files[0];
  const licenseFile = document.getElementById('order-drivers-license').files[0];
  const familyBookFile = document.getElementById('order-family-book').files[0];

  if (!idCardFile || !licenseFile || !familyBookFile) {
    doc.setTextColor(255, 0, 0);
    doc.text('Error: Documents not uploaded. Please try again.', 20, y);
    doc.save(`AngkorAuto-Order-${Date.now()}.pdf`);
    return;
  }

  const imagePromises = [];
  let imageY = y;

  // Sequential embedding with error handling (unchanged)
  const embedImages = async () => {
    try {
      if (idCardFile) {
        const base64Id = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(idCardFile);
        });
        doc.addImage(base64Id, 'JPEG', 20, imageY, 45, 30);
        doc.text('ID Card', 20, imageY + 32);
      }

      if (licenseFile) {
        const base64License = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(licenseFile);
        });
        doc.addImage(base64License, 'JPEG', 75, imageY, 45, 30);
        doc.text("Driver's License", 75, imageY + 32);
      }

      if (familyBookFile) {
        const base64Family = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(familyBookFile);
        });
        doc.addImage(base64Family, 'JPEG', 130, imageY, 45, 30);
        doc.text('Family Book', 130, imageY + 32);
      }

      // Footer
      doc.setFillColor(17, 24, 39);
      doc.rect(0, 280, 210, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Thank you for choosing Angkor Auto! | Phnom Penh, Cambodia', 16, 287);

      doc.save(`AngkorAuto-Order-${Date.now()}.pdf`);
      console.log('PDF generated successfully with images.');
    } catch (error) {
      console.error('PDF Image Error:', error);
      doc.setTextColor(255, 0, 0);
      doc.text('Error embedding images. PDF saved without images.', 20, y);
      doc.save(`AngkorAuto-Order-${Date.now()}-NoImages.pdf`);
    }
  };

  // Fixed: Await the async function in caller
  embedImages().catch((error) => {
    console.error('PDF Generation Failed:', error);
    doc.save(`AngkorAuto-Order-${Date.now()}-Error.pdf`);
  });
}

// ADD THIS FUNCTION (before // Initialize)
function initSampleCars() {
  let savedCars = JSON.parse(localStorage.getItem(CARS_KEY)) || [];
  if (savedCars.length === 0) {
    const sampleCars = [
      {
        id: 1,
        name: 'Toyota Camry',
        brand: 'Toyota',
        model: 'LE',
        category: 'Sedan',
        year: 2023,
        bodyType: 'Sedan',
        transmission: 'Automatic',
        condition: 'New',
        mileage: 0,
        color: '#ffffff',
        price: 28000,
        description: 'Reliable family sedan.',
        image: 'https://via.placeholder.com/400x250/ffffff/000000?text=Toyota+Camry',
      },
      {
        id: 2,
        name: 'Honda CR-V',
        brand: 'Honda',
        model: 'EX-L',
        category: 'SUV',
        year: 2024,
        bodyType: 'SUV',
        transmission: 'Automatic',
        condition: 'New',
        mileage: 0,
        color: '#000000',
        price: 35000,
        description: 'Spacious SUV.',
        image: 'https://via.placeholder.com/400x250/000000/ffffff?text=Honda+CR-V',
      },
    ];
    localStorage.setItem(CARS_KEY, JSON.stringify(sampleCars));
    console.log('Sample cars added to grid.');
  }
}

// Initialize - Fixed with Cart Load
initUsers();
updateProfileDisplay();
orders = JSON.parse(localStorage.getItem('angkor_auto_orders')) || [];
loadCartFromStorage(); // Loads cart & updates count
renderCars(); // Renders cars
