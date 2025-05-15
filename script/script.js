document.addEventListener("DOMContentLoaded", function () {
  //Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  });
  const hiddenElements = document.querySelectorAll(".hidden");
  const hiddenElements1 = document.querySelectorAll(".hidden1");

  hiddenElements.forEach((e) => observer.observe(e));
  hiddenElements1.forEach((e) => observer.observe(e));
  //animation delay
  let boxes = document.querySelectorAll(".animationBox");
  let start = 0.1;

  boxes.forEach((boxes) => {
    boxes.style.transitionDelay = `${start}s`;

    start += 0.1;

    if (start >= 0.4) {
      start = 0.1;
    }
  });

  const scrollToTopButton = document.querySelector(".scroll-to-top");
  //scroll to top
  scrollToTopButton.addEventListener("click", () => {
    window.scrollTo(0, 0);
  });

  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 150) {
      scrollToTopButton.classList.add("showBtn");
    } else {
      scrollToTopButton.classList.remove("showBtn");
    }
  });

  // burger menu
  const menu = document.querySelector("#menuToggle");
  const checkBox = document.querySelector("#menuCheckbox");
  const body = document.querySelector("body");

  checkBox.addEventListener("change", function () {
    if (checkBox.checked) {
      menu.style.position = "fixed";
      scrollToTopButton.style.display = "none";
    } else {
      menu.style.position = "absolute";
      scrollToTopButton.style.display = "flex";
    }
  });
});
