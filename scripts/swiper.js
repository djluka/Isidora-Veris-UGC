// Kada se HTML potpuno učita (DOM spreman), pokreni inicijalizaciju slajdera i fullscreen videa
document.addEventListener("DOMContentLoaded", function () {
  sliderInit(); // Pokreni slider logiku
  setVideo(); // Postavi ponašanje za fullscreen video
});

function sliderInit() {
  // Dohvata osnovne elemente slidera i dugmića
  const slider = document.querySelector(".ugc_slider");
  const cards = document.querySelectorAll(".ugc_card");
  const nextBtn = document.querySelector(".nxt_btn");
  const prevBtn = document.querySelector(".pre_btn");
  // Ako nešto nedostaje – prekini (sigurnosna provera)
  if (!slider || cards.length === 0) return;

  let currentIndex = 0; // prati indeks prve vidljive kartice

  function getVisibleCardsCount() {
    const sliderWidth = slider.offsetWidth; // širina vidljive oblasti slidera
    const cardWidth = cards[0].offsetWidth; // širina jedne kartice
    return Math.max(1, Math.round(sliderWidth / cardWidth)); // broj kartica koje "stanu" unutra
  }

  function scrollToCurrentCard() {
    const targetCard = cards[currentIndex]; // kartica koju želimo da poravnamo
    if (targetCard) {
      slider.scrollTo({
        left: targetCard.offsetLeft, // udaljenost kartice od početka slidera
        behavior: "smooth", // animirano skrolovanje
      });
    }
  }

  function updateButtons() {
    // Ako si na početku – disable prev
    const visible = getVisibleCardsCount();
    prevBtn.disabled = currentIndex === 0;
    // Ako si na kraju – disable next
    nextBtn.disabled = currentIndex >= cards.length - visible;
    // Dodaj ili ukloni klasu za vizuelno slabiji izgled dugmadi
    prevBtn.classList.toggle("opacity_low", prevBtn.disabled);
    nextBtn.classList.toggle("opacity_low", nextBtn.disabled);
  }

  nextBtn.addEventListener("click", () => {
    const visible = getVisibleCardsCount();
    if (currentIndex < cards.length - visible) {
      currentIndex += visible; // idi za ceo "set" kartica
      if (currentIndex > cards.length - visible) {
        currentIndex = cards.length - visible;
      }
      scrollToCurrentCard();
      updateButtons();
    }
  });

  prevBtn.addEventListener("click", () => {
    const visible = getVisibleCardsCount();
    if (currentIndex > 0) {
      currentIndex -= visible;
      if (currentIndex < 0) currentIndex = 0;
      scrollToCurrentCard();
      updateButtons();
    }
  });

  slider.addEventListener("scroll", () => {
    const cardWidth =
      cards[0].offsetLeft - (cards[1]?.offsetLeft || 0) === 0
        ? cards[0].offsetWidth
        : cards[1].offsetLeft - cards[0].offsetLeft;
    // Preračunaj trenutni indeks na osnovu scroll pozicije
    currentIndex = Math.round(slider.scrollLeft / cardWidth);
    updateButtons();
  });

  // Pokreni na početku
  scrollToCurrentCard(); // centriraj prvu karticu
  updateButtons(); // proveri da li treba isključiti dugmad
}

function setVideo() {
  const videoElements = document.querySelectorAll(".ugc_slider video");

  videoElements.forEach((videoElement) => {
    videoElement.addEventListener("click", () => {
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      } else if (videoElement.webkitRequestFullscreen) {
        // Safari desktop
        videoElement.webkitRequestFullscreen();
      } else if (videoElement.webkitEnterFullscreen) {
        // Safari iOS
        videoElement.webkitEnterFullscreen();
      } else if (videoElement.msRequestFullscreen) {
        // Safari iOS
        videoElement.msRequestFullscreen();
      }

      const handleFullscreenChange = () => {
        const isFullscreen =
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement;
          
        // Ako smo u fullscreenu – pusti zvuk i kontrole
        videoElement.muted = !isFullscreen;
        videoElement.controls = isFullscreen;
      };

      [
        "fullscreenchange",
        "webkitfullscreenchange",
        "mozfullscreenchange",
        "MSFullscreenChange",
      ].forEach((eventName) => {
        document.addEventListener(eventName, handleFullscreenChange, {
          once: true,
        });
      });
    });
  });
}
