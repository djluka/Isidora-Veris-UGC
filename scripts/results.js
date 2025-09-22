document.addEventListener("DOMContentLoaded", () => {
  const logos = document.querySelectorAll(".logo");
  const comment = document.querySelectorAll(".comment");
  const comments = document.querySelector(".comments");

  function closeAllComments() {
    comment.forEach((c) => c.classList.remove("active"));
  }

  logos.forEach((logo) => {
    logo.addEventListener("click", () => {
      const targetId = logo.dataset.logo;
      if (!targetId) return; // logo bez data-logo -> ignorisi klik

      // prikaži kontejner ako je skriven
      if (
        comments &&
        !comments.classList.contains("active")
      ) {
        comments.classList.add("active");
      }

      closeAllComments();
      const targetComment = document.querySelector(
        `.comment[data-logo="${targetId}"]`
      );

      if (targetComment) {
        targetComment.classList.add("active");
        comments.classList.add("active");

        console.log(targetComment);
      } else {
        console.warn(`Nema komentara za data-logo="${targetId}"`);
      }
    });
  });

  document.querySelectorAll(".close_comment").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const c = e.target.closest(".comment");
      if (!c) return;
      c.classList.remove("active");
      const comments = document.querySelector(`.comments`);

      comments.classList.remove("active");

      // ako nema više aktivnih komentara, sakrij i kontejner
      const anyActive = document.querySelector(".comment.active");
      if (!anyActive && comments) {
        comments.classList.remove("active");
      }
    });
  });
});
