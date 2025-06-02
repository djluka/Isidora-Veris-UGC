document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".slider_wrap").forEach(initSlider);
});

function initSlider(wrapper) {
  const slider = wrapper.querySelector(".slider");
  const cards = wrapper.querySelectorAll(".card");
  const nextBtn = wrapper.querySelector(".nxt_btn");
  const prevBtn = wrapper.querySelector(".pre_btn");
  const dots = wrapper.querySelectorAll(".dot");

  if (!slider || cards.length === 0) return;

  let currentIndex = 0;

  function getVisibleCardsCount() {
    const sliderWidth = slider.offsetWidth;
    const cardWidth = cards[0].offsetWidth;
    return Math.max(1, Math.round(sliderWidth / cardWidth));
  }

  function scrollToCurrentCard() {
    const targetCard = cards[currentIndex];
    if (targetCard) {
      slider.scrollTo({
        left: targetCard.offsetLeft,
        behavior: "smooth",
      });
    }
  }

  function updateButtons() {
    const visible = getVisibleCardsCount();
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= cards.length - visible;

    prevBtn.classList.toggle("opacity_low", prevBtn.disabled);
    nextBtn.classList.toggle("opacity_low", nextBtn.disabled);
  }

  nextBtn?.addEventListener("click", () => {
    const visible = getVisibleCardsCount();
    if (currentIndex < cards.length - visible) {
      currentIndex += visible;
      if (currentIndex > cards.length - visible) {
        currentIndex = cards.length - visible;
      }
      scrollToCurrentCard();
      updateButtons();
    }
  });

  prevBtn?.addEventListener("click", () => {
    const visible = getVisibleCardsCount();
    if (currentIndex > 0) {
      currentIndex -= visible;
      if (currentIndex < 0) currentIndex = 0;
      scrollToCurrentCard();
      updateButtons();
    }
  });
  function updateDots(index) {
    dots.forEach((dot) => dot.classList.remove("active"));
    if (dots[index]) dots[index].classList.add("active");
  }

  slider.addEventListener("scroll", () => {
    const cardWidth =
      cards[1]?.offsetLeft - cards[0].offsetLeft || cards[0].offsetWidth;
    currentIndex = Math.round(slider.scrollLeft / cardWidth);
    updateButtons();
    updateDots(currentIndex);
  });

  // Init
  scrollToCurrentCard();
  updateButtons();
}
