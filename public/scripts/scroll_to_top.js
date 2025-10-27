document.addEventListener("DOMContentLoaded", () => {
  scrollToTop();
});
function scrollToTop() {
  const scrollToTopButton = document.querySelector(".scroll_to_top");
  scrollToTopButton.addEventListener("click", () => {
    window.scrollTo(0, 0);
  });

  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 150) {
      scrollToTopButton.classList.add("show_btn");
    } else {
      scrollToTopButton.classList.remove("show_btn");
    }
  });
}
