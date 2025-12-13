// admin-feedback.js
const ADM_FB_STORAGE_KEY = "matflowFeedback";

document.addEventListener("DOMContentLoaded", () => {
  initAdminFeedback();
});

function initAdminFeedback() {
  const listEl = document.getElementById("admFbList");
  if (!listEl) return; // không ở tab này

  const searchInput = document.getElementById("admFbSearch");
  const ratingSelect = document.getElementById("admFbRatingFilter");
  const typeSelect = document.getElementById("admFbTypeFilter");

  // render lần đầu
  let allData = loadAdminFeedback();
  renderAdminSummary(allData);
  renderAdminList(allData);

  // filter realtime
  function applyFilter() {
    const text = (searchInput.value || "").toLowerCase().trim();
    const ratingVal = ratingSelect.value;
    const typeVal = typeSelect.value;

    let filtered = allData.slice();

    if (ratingVal) {
      filtered = filtered.filter(f => String(f.rating) === ratingVal);
    }
    if (typeVal) {
      filtered = filtered.filter(f => f.type === typeVal);
    }
    if (text) {
      filtered = filtered.filter(f => {
        const haystack = (
          (f.name || "") +
          " " +
          (f.email || "") +
          " " +
          (f.phone || "") +
          " " +
          (f.message || "")
        ).toLowerCase();
        return haystack.includes(text);
      });
    }

    renderAdminSummary(allData); // tổng quan theo toàn bộ
    renderAdminList(filtered);
  }

  searchInput && searchInput.addEventListener("input", applyFilter);
  ratingSelect && ratingSelect.addEventListener("change", applyFilter);
  typeSelect && typeSelect.addEventListener("change", applyFilter);

  // Nếu bạn có nút "refresh" có thể thêm event gọi lại loadAdminFeedback + applyFilter
}

function loadAdminFeedback() {
  try {
    const raw = localStorage.getItem(ADM_FB_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Không đọc được feedback từ localStorage", e);
    return [];
  }
}

function renderAdminSummary(data) {
  const total = data.length;
  const avgEl = document.getElementById("admFbAvgScore");
  const totalEl = document.getElementById("admFbTotalReviews");
  const starIcons = document.getElementById("admFbStarIcons");
  const barFills = Array.from(document.querySelectorAll(".adm-fb-bar-fill"));

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  data.forEach(fb => {
    const r = Number(fb.rating) || 0;
    if (counts[r] != null) counts[r] += 1;
    sum += r;
  });

  if (!total) {
    avgEl && (avgEl.textContent = "0.0");
    totalEl && (totalEl.textContent = "Chưa có đánh giá");
    if (starIcons) starIcons.textContent = "★★★★★";
    barFills.forEach(b => (b.style.width = "0%"));
    [1,2,3,4,5].forEach(s => {
      const el = document.getElementById(`admFbCount${s}`);
      el && (el.textContent = "0");
    });
    return;
  }

  const avg = sum / total;
  avgEl && (avgEl.textContent = avg.toFixed(1));
  totalEl && (totalEl.textContent = `${total} đánh giá`);

  const rounded = Math.round(avg);
  if (starIcons) {
    starIcons.textContent = "★".repeat(rounded) + "☆".repeat(5 - rounded);
  }

  [1,2,3,4,5].forEach(s => {
    const el = document.getElementById(`admFbCount${s}`);
    el && (el.textContent = String(counts[s]));
  });

  barFills.forEach(bar => {
    const star = Number(bar.dataset.star);
    const count = counts[star] || 0;
    const percent = (count / total) * 100;
    bar.style.width = `${percent}%`;
  });
}

function renderAdminList(list) {
  const listEl = document.getElementById("admFbList");
  const emptyEl = document.getElementById("admFbEmpty");
  if (!listEl) return;

  listEl.innerHTML = "";

  if (!list.length) {
    emptyEl && (emptyEl.style.display = "block");
    return;
  }
  emptyEl && (emptyEl.style.display = "none");

  // mới nhất trước
  const sorted = list.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  sorted.forEach(fb => {
    const item = document.createElement("article");
    item.className = "adm-fb-item";

    const header = document.createElement("div");
    header.className = "adm-fb-item-header";

    const left = document.createElement("div");
    const name = document.createElement("div");
    name.className = "adm-fb-item-name";
    name.textContent = fb.name || "Khách hàng";

    const type = document.createElement("span");
    type.className = "adm-fb-item-type";
    type.textContent = mapAdminTypeLabel(fb.type);

    left.appendChild(name);
    left.appendChild(type);

    const stars = document.createElement("div");
    stars.className = "adm-fb-item-stars";
    const rating = Number(fb.rating) || 0;
    stars.textContent = "★".repeat(rating) + "☆".repeat(5 - rating);

    header.appendChild(left);
    header.appendChild(stars);

    const msg = document.createElement("p");
    msg.className = "adm-fb-item-message";
    msg.textContent = fb.message || "";

    const meta = document.createElement("p");
    meta.className = "adm-fb-item-meta";
    const d = fb.createdAt ? new Date(fb.createdAt) : null;
    const timeStr = d ? d.toLocaleString("vi-VN") : "";
    const contactStr = fb.allowContact ? "Cho phép liên hệ" : "Không yêu cầu liên hệ";
    const emailPhone =
      [fb.email, fb.phone].filter(Boolean).join(" • ");

    meta.textContent =
      `${timeStr}${emailPhone ? " • " + emailPhone : ""} • ${contactStr}`;

    item.appendChild(header);
    item.appendChild(msg);
    item.appendChild(meta);

    listEl.appendChild(item);
  });
}

function mapAdminTypeLabel(type) {
  switch (type) {
    case "price": return "Giá cả / báo giá";
    case "shipping": return "Giao hàng / kho vận";
    case "support": return "Tư vấn / CSKH";
    case "website": return "Giao diện website";
    case "other":
    default: return "Khác";
  }
}
