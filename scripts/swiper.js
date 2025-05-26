document.addEventListener("DOMContentLoaded", function () {
  sliderInit();
  setVideo();
});
function updateButtonStates() {
  const slider = document.querySelector(".ugc_slider");
  const preBtn = document.querySelector(".pre_btn");
  const nxtBtn = document.querySelector(".nxt_btn");

  const scrollLeft = slider.scrollLeft;
  const maxScrollLeft = slider.scrollWidth - slider.clientWidth;

  if (scrollLeft <= 0) {
    preBtn.disabled = true;
    preBtn.classList.add("opacity_low");
  } else {
    preBtn.disabled = false;
    preBtn.classList.remove("opacity_low");
  }

  if (scrollLeft >= maxScrollLeft - 5) {
    nxtBtn.disabled = true;
    nxtBtn.classList.add("opacity_low");
  } else {
    nxtBtn.disabled = false;
    nxtBtn.classList.remove("opacity_low");
  }
}
function sliderInit() {
  const slider = document.querySelector(".ugc_slider");
  const nextBtn = document.querySelector(".nxt_btn");
  const prevBtn = document.querySelector(".pre_btn");
  const card = document.querySelector(".ugc_card");

  const cardStyle = getComputedStyle(card);
  const cardSpacing =
    parseInt(cardStyle.marginLeft) +
    parseInt(cardStyle.marginRight) +
    parseInt(cardStyle.paddingLeft || 0) +
    parseInt(cardStyle.paddingRight || 0);
  const cardWidth = card.offsetWidth + cardSpacing ;
// ovde treba dodati pomeranje za responsive 
  const scrollCount = window.innerWidth <= 768 ? 1 : 3;
  const scrollAmount = cardWidth * scrollCount;
    console.log(cardWidth)

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
  const videoElements = document.querySelectorAll(".ugc_slider video");
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
      
      
      videoElement.addEventListener("fullscreenchange", () => {
        if (!document.fullscreenElement) {
          videoElement.muted = true;
          videoElement.controls = false;
        } else {
          videoElement.muted = false;
          videoElement.controls = true;
        }
      });
    });
  });
}
