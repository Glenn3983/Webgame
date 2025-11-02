// ================================
// guest.js - Quản lý hiển thị user / admin
// ================================
import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// ============= DOM ELEMENTS =============
const loginLink = document.getElementById("login-link");
const userMenu = document.getElementById("user-menu");
const adminSection = document.getElementById("adminSection");
const userSection = document.getElementById("userSection");
const gameList = document.getElementById("gameList"); // ✅ CHUẨN ID
const addGameForm = document.getElementById("addGameForm");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");

// ================================
// Render menu người dùng
// ================================
function renderUserMenu({ avatar, name, role }) {
  if (!userMenu) return;
  userMenu.innerHTML = `
    <div class="user-box">
      <img src="${avatar}" alt="Avatar" class="avatar-small" />
      <span class="username">${name} (${role})</span>
      <div class="dropdown">
        <a href="profile.html" data-action="profile">Chỉnh sửa tài khoản</a>
        <a href="#" data-action="logout">Đăng xuất</a>
      </div>
    </div>
  `;
}

// ================================
// Load danh sách game (Admin/User)
// ================================
async function loadGames(isAdmin = false) {
  try {
    const snap = await getDocs(collection(db, "games"));
    const games = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Xử lý nếu không có game
    if (!games.length) {
      if (isAdmin) {
        const tableBody = document.querySelector("#adminGameList tbody");
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" style="color:#aaa;">Chưa có game nào</td></tr>`;
      } else if (gameList) {
        gameList.innerHTML = `<p style="color:#aaa;text-align:center;">Hiện chưa có game nào được thêm.</p>`;
      }
      return;
    }

    if (isAdmin) {
      const tableBody = document.querySelector("#adminGameList tbody");
      tableBody.innerHTML = "";

      games.forEach(game => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${game.name}</td>
          <td>${game.studio || "-"}</td>
          <td>${(game.price || 0).toLocaleString()} ₫</td>
          <td>${game.discount || 0}%</td>
          <td>${game.genre || "-"}</td>
          <td>
            <button class="delete-btn" data-id="${game.id}">Xoá</button>
          </td>
        `;
        tableBody.appendChild(row);
      });

      // Nút xoá
      tableBody.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          if (confirm("Bạn có chắc muốn xoá game này?")) {
            await deleteDoc(doc(db, "games", btn.dataset.id));
            alert("Đã xoá game!");
            loadGames(true);
          }
        });
      });

    } else {
      // === User hiển thị game ===
      gameList.innerHTML = "";
      games.forEach(game => {
        const card = document.createElement("div");
        card.classList.add("game-card");
        card.innerHTML = `
          <img src="${game.image || "https://i.ibb.co/ZYW3VTp/brown-brim.png"}" alt="${game.name}">
          <h3>${game.name}</h3>
          <p>${(game.price || 0).toLocaleString()} ₫</p>
        `;
        card.addEventListener("click", () => {
          localStorage.setItem("selectedGameId", game.id);
          window.location.href = "game.html";
        });
        gameList.appendChild(card);
      });
    }
  } catch (err) {
    console.error("Lỗi khi load game:", err);
  }
}

// ================================
// Theo dõi trạng thái đăng nhập
// ================================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (loginLink) loginLink.style.display = "none";

    // Lấy role từ Firestore
    let role = "user";
    try {
      const uref = doc(db, "users", user.uid);
      const usnap = await getDoc(uref);
      if (usnap.exists()) role = usnap.data().role || "user";
    } catch (e) {
      console.warn("Không thể lấy role:", e);
    }

    // Hiển thị thông tin người dùng
    const avatar = localStorage.getItem("userAvatar") || "https://i.ibb.co/ZYW3VTp/brown-brim.png";
    renderUserMenu({
      avatar,
      name: user.displayName || "Người dùng",
      role
    });

    if (role === "admin") {
      adminSection.style.display = "block";
      userSection.style.display = "none";
      loadGames(true);

      // Form thêm game
      if (addGameForm) {
        addGameForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const name = document.getElementById("gameName").value.trim();
          const studio = document.getElementById("gameStudio").value.trim();
          const genre = document.getElementById("gameGenre").value.trim();
          const price = parseInt(document.getElementById("gamePrice").value) || 0;
          const discount = parseInt(document.getElementById("gameDiscount").value) || 0;
          const image = document.getElementById("gameImage").value.trim();

          await addDoc(collection(db, "games"), {
            name, studio, genre, price, discount, image
          });
          alert("Đã thêm game!");
          addGameForm.reset();
          loadGames(true);
        });
      }

    } else {
      adminSection.style.display = "none";
      userSection.style.display = "block";
      loadGames(false);
    }
  } else {
    // Chưa đăng nhập
    if (loginLink) loginLink.style.display = "inline-block";
    if (userMenu) userMenu.innerHTML = "";
    adminSection.style.display = "none";
    userSection.style.display = "block";
    loadGames(false);
  }
});

// ================================
// Xử lý nút Logout
// ================================
if (userMenu) {
  userMenu.addEventListener("click", async (e) => {
    if (e.target.closest('[data-action="logout"]')) {
      e.preventDefault();
      await signOut(auth);
      window.location.href = "auth.html";
    }
  });
}

// ================================
// TÌM KIẾM GAME (cho user)
// ================================
async function searchGames(keyword) {
  const key = keyword.toLowerCase();
  const snap = await getDocs(collection(db, "games"));
  gameList.innerHTML = "";

  snap.forEach(docSnap => {
    const g = docSnap.data();
    const id = docSnap.id;

    if (
      g.name?.toLowerCase().includes(key) ||
      g.genre?.toLowerCase().includes(key) ||
      g.studio?.toLowerCase().includes(key)
    ) {
      const card = document.createElement("div");
      card.className = "game-card";
      card.innerHTML = `
        <img src="${g.image || "https://i.ibb.co/ZYW3VTp/brown-brim.png"}" alt="${g.name}">
        <h3>${g.name}</h3>
        <p>${(g.price || 0).toLocaleString()} ₫</p>
      `;
      card.addEventListener("click", () => {
        localStorage.setItem("selectedGameId", id);
        window.location.href = "game.html";
      });
      gameList.appendChild(card);
    }
  });

  if (!gameList.innerHTML.trim()) {
    gameList.innerHTML = `<p style="color:#aaa;text-align:center;">Không tìm thấy kết quả phù hợp.</p>`;
  }
}

if (searchForm) {
  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const keyword = searchInput.value.trim();
    if (keyword) await searchGames(keyword);
    else await loadGames(false);
  });

  searchInput.addEventListener("input", async () => {
    const keyword = searchInput.value.trim();
    if (keyword) await searchGames(keyword);
    else await loadGames(false);
  });
}

// Đảm bảo load game khi user mở lại trang
document.addEventListener("DOMContentLoaded", () => {
  if (userSection && gameList) {
    loadGames(false);
  }
});

