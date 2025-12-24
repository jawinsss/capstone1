// homepage-feedback.js
const FEEDBACK_KEY = "matflowFeedback";

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("hpTestimonialsList");
  if (!container) return;

  let data = [];
  try {
    data = JSON.parse(localStorage.getItem(FEEDBACK_KEY)) || [];
  } catch {
    data = [];
  }

  if (data.length === 0) {
    container.innerHTML = `
      <div class="hp-testimonial-empty">
        Chưa có đánh giá nào từ khách hàng.
      </div>
    `;
    return;
  }

  // lấy 3 feedback mới nhất
  const latest = data
    .slice()
    .sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )
    .slice(0, 3);

  container.innerHTML = latest
    .map(renderTestimonialCard)
    .join("");
});

function renderTestimonialCard(item) {
  const stars =
    "★".repeat(item.rating) + "☆".repeat(5 - item.rating);

  const date = new Date(item.createdAt).toLocaleDateString("vi-VN");

  return `
    <article class="hp-testimonial-card">
      <div class="hp-testimonial-stars">${stars}</div>

      <h3 class="hp-testimonial-title">
        ${escapeHtml(item.name || "Khách hàng")}
      </h3>

      <p class="hp-testimonial-message">
        ${escapeHtml(item.message)}
      </p>

      <div class="hp-testimonial-meta">
        ${mapType(item.type)} • ${date}
      </div>
    </article>
  `;
}

function mapType(type) {
  switch (type) {
    case "price":
      return "Giá cả / báo giá";
    case "shipping":
      return "Giao hàng";
    case "support":
      return "Tư vấn / CSKH";
    case "website":
      return "Giao diện website";
    default:
      return "Khác";
  }
}

// chống XSS đơn giản
function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, (m) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[m];
  });
}
