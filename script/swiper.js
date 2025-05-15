document.addEventListener("DOMContentLoaded", function () {
  sliderInit();
  setVideo();
});
function updateButtonStates() {
  const slider = document.querySelector(".klijenti-slider");
  const preBtn = document.querySelector(".pre-btn");
  const nxtBtn = document.querySelector(".nxt-btn");

  const scrollLeft = slider.scrollLeft;
  const maxScrollLeft = slider.scrollWidth - slider.clientWidth;

  if (scrollLeft <= 0) {
    preBtn.disabled = true;
    preBtn.classList.add("opacity-low");
  } else {
    preBtn.disabled = false;
    preBtn.classList.remove("opacity-low");
  }

  if (scrollLeft >= maxScrollLeft - 5) {
    nxtBtn.disabled = true;
    nxtBtn.classList.add("opacity-low");
  } else {
    nxtBtn.disabled = false;
    nxtBtn.classList.remove("opacity-low");
  }
}
function sliderInit() {
  const slider = document.querySelector(".klijenti-slider");
  const nextBtn = document.querySelector(".nxt-btn");
  const prevBtn = document.querySelector(".pre-btn");
  const card = document.querySelector(".klijenti-card");

  const cardStyle = getComputedStyle(card);
  const cardSpacing =
    parseInt(cardStyle.marginLeft) +
    parseInt(cardStyle.marginRight) +
    parseInt(cardStyle.paddingLeft || 0) +
    parseInt(cardStyle.paddingRight || 0);
  const cardWidth = card.offsetWidth + cardSpacing;

  const scrollCount = window.innerWidth <= 768 ? 1 : 3;
  const scrollAmount = cardWidth * scrollCount;

  updateButtonStates();

  nextBtn.addEventListener("click", () => {
    slider.scrollBy({ left: scrollAmount, behavior: "smooth" });
  });

  prevBtn.addEventListener("click", () => {
    slider.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  });

  slider.addEventListener("scroll", updateButtonStates);
}

function setVideo() {
  
  const videoElements = document.querySelectorAll(".klijenti-slider video");
  videoElements.forEach((videoElement) => {
    videoElement.addEventListener("click", () => {
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      } else if (videoElement.webkitRequestFullscreen) {
        videoElement.webkitRequestFullscreen(); // Safari desktop
      } else if (videoElement.webkitEnterFullscreen) {
        videoElement.webkitEnterFullscreen(); // Safari on iOS
      } else if (videoElement.msRequestFullscreen) {
        videoElement.msRequestFullscreen(); // IE
      }
    });
  });

}
