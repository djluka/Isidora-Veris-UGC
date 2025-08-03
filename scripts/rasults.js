document.addEventListener("DOMContentLoaded", function () {
    results();
});

function results() {
  const comments = document.querySelectorAll(".comment");

  document.querySelectorAll("button.logo").forEach((logo) => {
    logo.addEventListener("click", () => {
      const selectedValue = logo.getAttribute("value");

      // Sakrij sve komentare
      comments.forEach((comment) => {
        comment.style.display = "none";
      });

      // Prikazi samo odgovarajuci komentar
      if (selectedValue) {
        const target = document.querySelector(`.comment[value="${selectedValue}"]`);
        if (target) {
          target.style.display = "flex"; // ili "block" ako ne koristiš flexbox
        }
      }
    });
  });

  // Možeš dodati i da na početku sakriješ sve komentare
  comments.forEach((comment) => {
    comment.style.display = "none";
  });
}
