document.addEventListener("DOMContentLoaded", function () {
    results();
});

function results() {
  const comments = document.querySelectorAll(".comment");

  document.querySelectorAll("button.logo").forEach((logo) => {
    logo.addEventListener("click", () => {
      const selectedValue = logo.getAttribute("value");

      comments.forEach((comment) => {
        comment.style.display = "none";
      });

      if (selectedValue) {
        const target = document.querySelector(`.comment[value="${selectedValue}"]`);
        if (target) {
          target.style.display = "flex";
        }
      }
    });
  });

  comments.forEach((comment) => {
    comment.style.display = "none";
  });
}
