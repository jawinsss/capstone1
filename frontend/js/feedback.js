// feedback.js – xử lý rating, validate, localStorage & render list

const STORAGE_KEY = "matflowFeedback";

document.addEventListener("DOMContentLoaded", () => {
  const ratingInput = document.getElementById("mfRating");
  const ratingError = document.getElementById("mfRatingError");
  const nameInput = document.getElementById("mfName");
  const nameError = document.getElementById("mfNameError");
  const msgInput = document.getElementById("mfMessage");
  const msgError = document.getElementById("mfMessageError");
  const form = document.getElementById("mfFeedbackForm");
  const scrollBtn = document.getElementById("mfScrollToForm");
  const toast = document.getElementById("mfToast");
  const starButtons = Array.from(document.querySelectorAll(".mf-fb-star-btn"));

  // === STAR RATING ===
  let currentRating = 0;

  function updateStarUI(value) {
    starButtons.forEach(btn => {
      const starVal = Number(btn.dataset.value);
      btn.classList.toggle("selected", starVal <= value);
    });
  }

  starButtons.forEach(btn => {
    const value = Number(btn.dataset.value);

    // hover
    btn.addEventListener("mouseenter", () => {
      starButtons.forEach(b => {
        const v = Number(b.dataset.value);
        b.classList.toggle("hovered", v <= value);
      });
    });

    btn.addEventListener("mouseleave", () => {
      starButtons.forEach(b => b.classList.remove("hovered"));
    });

    // click chọn
    btn.addEventListener("click", () => {
      currentRating = value;
      ratingInput.value = String(currentRating);
      updateStarUI(currentRating);
      ratingError.textContent = "";
    });
  });

  // reset hover khi rời khỏi vùng
  const starsInput = document.querySelector(".mf-fb-stars-input");
  starsInput.addEventListener("mouseleave", () => {
    starButtons.forEach(b => b.classList.remove("hovered"));
  });

  // cuộn xuống form
  if (scrollBtn) {
    scrollBtn.addEventListener("click", () => {
      const section = document.getElementById("mfFeedbackFormSection");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  // === LOCAL STORAGE ===
  function loadFeedback() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) || [];
    } catch (e) {
      console.error("Error reading feedback from storage", e);
      return [];
    }
  }

  function saveFeedback(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("Error saving feedback", e);
    }
  }

  // === TOAST ===
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }

  // === RENDER FEEDBACK LIST & SUMMARY ===
  const listContainer = document.getElementById("mfFeedbackList");
  const noFbHint = document.getElementById("mfNoFeedbackHint");
  const avgScoreEl = document.getElementById("mfAvgScore");
  const totalReviewsEl = document.getElementById("mfTotalReviews");

  const countEls = {
    1: document.getElementById("mfCount1"),
    2: document.getElementById("mfCount2"),
    3: document.getElementById("mfCount3"),
    4: document.getElementById("mfCount4"),
    5: document.getElementById("mfCount5"),
  };

  const barFills = Array.from(document.querySelectorAll(".mf-fb-bar-fill"));

  function renderFeedback() {
    const data = loadFeedback();

    // List
    if (listContainer) {
      listContainer.innerHTML = "";
      if (data.length === 0) {
        if (noFbHint) noFbHint.style.display = "block";
      } else {
        if (noFbHint) noFbHint.style.display = "none";

        data
          .slice()
          .reverse() // hiện cái mới nhất lên trước
          .forEach(item => {
            const card = document.createElement("article");
            card.className = "mf-fb-card";

            const header = document.createElement("div");
            header.className = "mf-fb-card-header";

            const nameSpan = document.createElement("span");
            nameSpan.className = "mf-fb-card-name";
            nameSpan.textContent = item.name || "Ẩn danh";

            const typeSpan = document.createElement("span");
            typeSpan.className = "mf-fb-card-type";
            typeSpan.textContent = mapTypeLabel(item.type);

            header.appendChild(nameSpan);
            header.appendChild(typeSpan);

            const stars = document.createElement("div");
            stars.className = "mf-fb-card-stars";
            stars.innerHTML = "★".repeat(item.rating) + "☆".repeat(5 - item.rating);

            const msg = document.createElement("p");
            msg.className = "mf-fb-card-message";
            msg.textContent = item.message;

            const meta = document.createElement("p");
            meta.className = "mf-fb-card-meta";
            const date = new Date(item.createdAt);
            meta.textContent = `${date.toLocaleString("vi-VN")} • ${
              item.allowContact ? "Cho phép liên hệ lại" : "Không yêu cầu liên hệ"
            }`;

            card.appendChild(header);
            card.appendChild(stars);
            card.appendChild(msg);
            card.appendChild(meta);

            listContainer.appendChild(card);
          });
      }
    }

    // Summary
    const total = data.length;
    if (total === 0) {
      if (avgScoreEl) avgScoreEl.textContent = "0.0";
      if (totalReviewsEl) totalReviewsEl.textContent = "Chưa có đánh giá";
      Object.values(countEls).forEach(el => el && (el.textContent = "0"));
      barFills.forEach(bar => (bar.style.width = "0%"));
      return;
    }

    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    data.forEach(fb => {
      const r = Number(fb.rating) || 0;
      if (counts[r] !== undefined) counts[r] += 1;
      sum += r;
    });

    const avg = sum / total;
    if (avgScoreEl) avgScoreEl.textContent = avg.toFixed(1);
    if (totalReviewsEl)
      totalReviewsEl.textContent = `${total} đánh giá`;

    // update count + bar
    Object.entries(counts).forEach(([star, count]) => {
      const s = Number(star);
      const el = countEls[s];
      if (el) el.textContent = String(count);

      const bar = barFills.find(b => Number(b.dataset.star) === s);
      if (bar) {
        const percent = (count / total) * 100;
        bar.style.width = `${percent}%`;
      }
    });
  }

  function mapTypeLabel(type) {
    switch (type) {
      case "price":
        return "Giá cả / báo giá";
      case "shipping":
        return "Giao hàng / kho vận";
      case "support":
        return "Tư vấn / CSKH";
      case "website":
        return "Giao diện website";
      case "other":
      default:
        return "Khác";
    }
  }

  // Render lần đầu
  renderFeedback();

  // === FORM SUBMIT ===
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();

      let valid = true;

      // validate rating
      if (!ratingInput.value) {
        ratingError.textContent = "Vui lòng chọn số sao đánh giá.";
        valid = false;
      } else {
        ratingError.textContent = "";
      }

      // validate name
      if (!nameInput.value.trim()) {
        nameError.textContent = "Vui lòng nhập họ tên.";
        valid = false;
      } else {
        nameError.textContent = "";
      }

      // validate message
      if (!msgInput.value.trim()) {
        msgError.textContent = "Vui lòng nhập nội dung phản hồi.";
        valid = false;
      } else {
        msgError.textContent = "";
      }

      if (!valid) return;

      const data = loadFeedback();
      const newItem = {
        rating: Number(ratingInput.value),
        name: nameInput.value.trim(),
        phone: document.getElementById("mfPhone").value.trim(),
        email: document.getElementById("mfEmail").value.trim(),
        type: document.getElementById("mfType").value,
        message: msgInput.value.trim(),
        allowContact: document.getElementById("mfAllowContact").checked,
        createdAt: new Date().toISOString(),
      };

      data.push(newItem);
      saveFeedback(data);
      renderFeedback();

      // reset form
      form.reset();
      currentRating = 0;
      ratingInput.value = "";
      updateStarUI(0);

      showToast("Cảm ơn bạn đã gửi phản hồi cho MatFlow!");
    });
  }
});
