// javascript/game.js
import { auth, db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

window.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("gameDetail");
  if (!container) return; // đề phòng sai ID

  const gameId = localStorage.getItem("selectedGameId");
  console.log("selectedGameId:", gameId); // DEBUG

  if (!gameId) {
    container.innerHTML = `<p style="color:#ff6b6b">❌ Không tìm thấy ID game (localStorage rỗng)!</p>`;
    return;
  }

  try {
    // ✅ LẤY MỘT DOCUMENT THEO ID → DÙNG doc(), KHÔNG PHẢI collection()
    const ref = doc(db, "games", gameId);
    const snap = await getDoc(ref);
    console.log("snap.exists:", snap.exists());

    if (!snap.exists()) {
      container.innerHTML = `<p style="color:#ff6b6b">❌ Game không tồn tại trong Firestore!</p>`;
      return;
    }

    const g = snap.data();
    const price = Number(g.price || 0);
    const discount = Number(g.discount || 0);
    const finalPrice = price && discount ? price - (price * discount) / 100 : price;

    container.innerHTML = `
      <h2>${g.name}</h2>
      <img src="${g.image || "https://i.ibb.co/ZYW3VTp/brown-brim.png"}" alt="${g.name}" width="460px">
      <div class="price-box">
        <strong>Giá:</strong>
        <span class="price-new">${(finalPrice || 0).toLocaleString()} đ</span>
        ${discount ? `<span class="price-old">${price.toLocaleString()} đ</span> <span>(-${discount}%)</span>` : ""}
      </div>
      <p><strong>Studio:</strong> ${g.studio || "Không rõ"}</p>
      <p><strong>Thể loại:</strong> ${g.genre || "Chưa có"}</p>
      <p><strong>Mô tả:</strong> ${g.description || "Chưa có mô tả cho game này."}</p>
      <div class="actions">
        <button id="add-to-cart">🛒 Thêm vào giỏ</button>
        <button id="checkout">💳 Thanh toán</button>
        <button id="favBtn">❤️ Lưu vào Yêu thích</button>
      </div>
    `;

    // === Giữ nguyên sự kiện cũ ===
    document.getElementById("add-to-cart").addEventListener("click", () => {
      alert(`Đã thêm "${g.name}" vào giỏ hàng!`);
      // TODO: lưu giỏ vào Firestore/localStorage nếu muốn
    });

    document.getElementById("checkout").addEventListener("click", () => {
      alert(`Thanh toán thành công "${g.name}" với giá ${(finalPrice || 0).toLocaleString()} đ!`);
      // TODO: logic thanh toán / orders
    });

    // === 🆕 Thêm xử lý nút Yêu thích ===
    setupFavouriteButton(g, gameId);

  } catch (err) {
    console.error("Lỗi khi load game:", err);
    container.innerHTML = `<p style="color:#ff6b6b">❌ Lỗi tải game: ${err.message}</p>`;
  }
});

// ===============================
// 🧩 Hàm Lưu game vào Yêu thích
// ===============================
function setupFavouriteButton(game, gameId) {
  const favBtn = document.getElementById("favBtn");

  // Kiểm tra localStorage
  let favourites = JSON.parse(localStorage.getItem("favourites") || "[]");
  const exists = favourites.some((f) => f.id === gameId);

  if (exists) {
    favBtn.textContent = "✅ Đã trong Yêu thích";
    favBtn.disabled = true;
  }

  // Theo dõi user đăng nhập
  onAuthStateChanged(auth, (user) => {
    favBtn.addEventListener("click", async () => {
      if (!user) {
        alert("Vui lòng đăng nhập để lưu Yêu thích!");
        return;
      }

      try {
        // Lưu localStorage
        favourites.push({ id: gameId, ...game });
        localStorage.setItem("favourites", JSON.stringify(favourites));

        // Lưu Firestore: users/{uid}/favourites/{gameId}
        const favRef = doc(db, "users", user.uid, "favourites", gameId);
        await setDoc(favRef, {
          ...game,
          id: gameId,
          addedAt: new Date(),
        });

        favBtn.textContent = "✅ Đã lưu vào Yêu thích";
        favBtn.disabled = true;

        alert(`Đã thêm "${game.name}" vào danh sách yêu thích!`);
      } catch (error) {
        console.error("Lỗi khi lưu yêu thích:", error);
        alert("❌ Lưu thất bại, vui lòng thử lại!");
      }
    });
  });
}
