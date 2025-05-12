const slider = document.querySelector(".klijenti-slider");
const nextBtn = document.querySelector(".nxt-btn");
const prevBtn = document.querySelector(".pre-btn");
const card = document.querySelector(".klijenti-card");

if (slider && nextBtn && prevBtn && card) {
  const cardStyle = getComputedStyle(card);
  const cardMargin =
    parseInt(cardStyle.marginLeft) + parseInt(cardStyle.marginRight);
  const cardWidth = card.offsetWidth + cardMargin;

  const scrollCount = window.innerWidth <= 768 ? 1 : 3;
  const scrollAmount = cardWidth * scrollCount;

  function updateButtonStates() {
    const scrollLeft = slider.scrollLeft;
    const maxScrollLeft = slider.scrollWidth - slider.clientWidth;

    if (scrollLeft <= 0) {
      prevBtn.disabled = true;
      prevBtn.classList.add('opacity-low')
    } else {
      prevBtn.disabled = false;
      prevBtn.classList.remove('opacity-low')

    }

    if (scrollLeft >= maxScrollLeft - 5) {
      nextBtn.disabled = true;
      nextBtn.classList.add('opacity-low')

    } else {
      nextBtn.disabled = false;
      nextBtn.classList.remove('opacity-low')
    }
  }
  updateButtonStates();
  slider.addEventListener('scroll', updateButtonStates);

  nextBtn.addEventListener("click", () => {
    slider.scrollBy({ left: scrollAmount, behavior: "smooth" });
    setTimeout(updateButtonStates, 100);
  });

  prevBtn.addEventListener("click", () => {
    slider.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    setTimeout(updateButtonStates, 100);
  });

}

/////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {
  const video = document.querySelector("video");
  if (video) {
    video.volume = 0.25;
  }
});
