// register.js
import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const regForm = document.getElementById("register");
  if (regForm) {
    regForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const displayName = regForm.querySelector("input[placeholder='Tên hiển thị']").value.trim();
      const email = regForm.querySelector("input[placeholder='Email']").value.trim();
      const password = regForm.querySelector("input[placeholder='Mật khẩu']").value;
      const confirm = regForm.querySelector("input[placeholder='Xác nhận mật khẩu']").value;

      if (password !== confirm) {
        alert("Mật khẩu xác nhận không khớp!");
        return;
      }

      try {
        // Tạo tài khoản
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });

        // Lưu thông tin user vào Firestore
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          email,
          displayName,
          role: "user", // mặc định là user
          createdAt: Date.now()
        });

        alert("Đăng ký thành công!");
        const tabs = document.querySelectorAll(".tab");
        tabs.forEach(tab => tab.classList.remove("active"));
        tabs[0].classList.add("active");
        document.getElementById("login").style.display = "block";
        document.getElementById("register").style.display = "none";
      } catch (err) {
        console.error(err);
        alert("Lỗi đăng ký: " + err.message);
      }
    });
  }
});
