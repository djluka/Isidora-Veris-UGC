document.addEventListener("DOMContentLoaded", () => {
  scrollAnimation();
});

function scrollAnimation() {
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
  let boxes = document.querySelectorAll(".animation_box");
  let start = 0.1;

  boxes.forEach((boxes) => {
    boxes.style.transitionDelay = `${start}s`;

    start += 0.1;

    if (start >= 0.4) {
      start = 0.1;
    }
  });
}





