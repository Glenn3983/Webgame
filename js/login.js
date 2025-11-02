// login.js
import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = loginForm.querySelector("input[placeholder='Email']").value.trim();
      const password = loginForm.querySelector("input[placeholder='Mật khẩu']").value;

      try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Đăng nhập thành công!");
        window.location.href = "index.html"; // Quay lại trang chính
      } catch (err) {
        console.error(err);
        alert("Đăng nhập thất bại: " + err.message);
      }
    });
  }
});
