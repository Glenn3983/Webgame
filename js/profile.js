// profile.js
import { auth, db } from "./firebase-config.js";
import {
  updateProfile,
  updatePassword,
  signOut,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profile-form");
  const nameInput = document.getElementById("displayName");
  const avatarImg = document.getElementById("avatar-img");
  const avatarFile = document.getElementById("avatarFile");
  const oldPassInput = document.getElementById("oldPassword");
  const newPassInput = document.getElementById("newPassword");
  const passwordSection = document.getElementById("password-section");
  const togglePasswordBtn = document.getElementById("toggle-password");
  const logoutBtn = document.getElementById("logout-btn");

  let selectedFile = null;
  let changePassword = false;

  // Load user info + avatar từ LocalStorage
  onAuthStateChanged(auth, (user) => {
    if (user) {
      nameInput.value = user.displayName || "";
      const savedAvatar = localStorage.getItem("userAvatar");
      if (savedAvatar) {
        avatarImg.src = savedAvatar;
      } else {
        avatarImg.src =
          user.photoURL || "https://i.ibb.co/ZYW3VTp/brown-brim.png";
      }
    } else {
      window.location.href = "auth.html";
    }
  });

  // Chọn file ảnh → preview + lưu vào LocalStorage
  avatarFile.addEventListener("change", (e) => {
    selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataURL = event.target.result;
      avatarImg.src = dataURL;
      localStorage.setItem("userAvatar", dataURL); // lưu để dùng ở index
    };
    reader.readAsDataURL(selectedFile);
  });

  // Toggle đổi mật khẩu
  togglePasswordBtn.addEventListener("click", () => {
    changePassword = !changePassword;
    passwordSection.style.display = changePassword ? "block" : "none";
  });

  // Submit form
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    let messages = [];

    try {
      // Nếu đổi mật khẩu
      if (changePassword) {
        if (!oldPassInput.value || !newPassInput.value) {
          alert("⚠️ Nhập mật khẩu cũ và mật khẩu mới!");
          return;
        }
        const cred = EmailAuthProvider.credential(
          user.email,
          oldPassInput.value
        );
        await reauthenticateWithCredential(user, cred);
        await updatePassword(user, newPassInput.value);
        messages.push("Mật khẩu");
      }

      // Nếu đổi tên
      if (nameInput.value && nameInput.value !== user.displayName) {
        await updateProfile(user, { displayName: nameInput.value });
        await updateDoc(doc(db, "users", user.uid), {
          displayName: nameInput.value,
          updatedAt: Date.now(),
        });
        messages.push("Tên hiển thị");
      }

      if (messages.length === 0 && !selectedFile) {
        alert("ℹ️ Không có thay đổi nào.");
      } else {
        alert("✅ Đã cập nhật: " + messages.join(", ") + (selectedFile ? ", Avatar" : ""));
      }

      window.location.href = "index.html";
    } catch (err) {
      console.error("❌ Lỗi cập nhật:", err);
      alert("❌ Lỗi: " + err.message);
    }
  });

  // Logout
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "auth.html";
  });
});
