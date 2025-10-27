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
      if (comments && !comments.classList.contains("active")) {
        comments.classList.add("active");
      }

      closeAllComments();
      const targetComment = document.querySelector(
        `.comment[data-logo="${targetId}"]`
      );

      if (targetComment) {
        comments.classList.add("active");
        targetComment.classList.add("active");

        console.log(targetComment);
      } else {
        console.warn(`Nema komentara za data-logo="${targetId}"`);
      }
    });
  });

  document.querySelectorAll(".close_comment").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const c = e.target.closest(".comment");
      const comments = document.querySelector(`.comments`);
      if (!c) {
        console.log("err");
        return;
      } else c.classList.remove("active");
      c.classList.add("off_stage");

      c.addEventListener(
        "animationend",
        () => {
          c.classList.remove("off_stage");

          // Ako više nema aktivnih – sakrij i kontejner
          const anyActive = document.querySelector(".comment.active");
          if (!anyActive && comments) {
            comments.classList.remove("active");
          }
        },
        { once: true }
      );
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const activeComment = document.querySelector(".comment.active");
    if (!activeComment) return;

    activeComment.classList.remove("active");
    activeComment.classList.add("off_stage");

    activeComment.addEventListener(
      "animationend",
      () => {
        activeComment.classList.remove("off_stage");

        if (!document.querySelector(".comment.active") && comments) {
          comments.classList.remove("active");
        }
      },
      { once: true }
    );
  });
});
