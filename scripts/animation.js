document.addEventListener("DOMContentLoaded", () => {
  scrollAnimation();
  sliderAnimation();
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
}function sliderAnimation() {
  const cards = document.querySelectorAll(".card");

  cards.forEach((card) => {
    card.addEventListener("mouseover", (e) => {
      const hoveredCard = e.currentTarget;
      const slider = hoveredCard.closest(".slider");
      const allCards = Array.from(slider.querySelectorAll(".card"));
      const otherCards = allCards.filter((card) => card !== hoveredCard);

      const hoveredTitle = hoveredCard.querySelector(".title");
      const hoveredDesc = hoveredCard.querySelector(".desc");

      hoveredCard.classList.add("hovered_card");
      hoveredTitle?.classList.add("title_animation");
      hoveredDesc?.classList.add("desc_animation");

      otherCards.forEach((otherCard) => {
        otherCard.classList.add("other_cards");
      });
    });

    card.addEventListener("mouseout", (e) => {
      const hoveredCard = e.currentTarget;
      const slider = hoveredCard.closest(".slider");
      const allCards = slider.querySelectorAll(".card");

      allCards.forEach((c) => {
        c.classList.remove("hovered_card", "other_cards");
        c.querySelector(".title")?.classList.remove("title_animation");
        c.querySelector(".desc")?.classList.remove("desc_animation");
      });
    });
  });
}
