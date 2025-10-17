document.addEventListener("DOMContentLoaded", function () {
  // =========================
  // 1) Slider init
  // =========================
  document.querySelectorAll(".slider_wrap").forEach((wrapper) => {
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
      if (prevBtn) {
        prevBtn.disabled = currentIndex === 0;
        prevBtn.classList.toggle("opacity_low", prevBtn.disabled);
      }
      if (nextBtn) {
        nextBtn.disabled = currentIndex >= cards.length - visible;
        nextBtn.classList.toggle("opacity_low", nextBtn.disabled);
      }
    }

    nextBtn?.addEventListener("click", () => {
      const visible = getVisibleCardsCount();
      if (currentIndex < cards.length - visible) {
        currentIndex = Math.min(currentIndex + visible, cards.length - visible);
        scrollToCurrentCard();
        updateButtons();
      }
    });

    prevBtn?.addEventListener("click", () => {
      const visible = getVisibleCardsCount();
      if (currentIndex > 0) {
        currentIndex = Math.max(currentIndex - visible, 0);
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
  });

  // =========================
  // 2) Reels overlay show + expand
  // =========================
  // a) Klik za EXPAND — delegacija na document (hvata i nove kartice)
  let activeBox = null;

  document.addEventListener("click", (e) => {
    // IGNORIŠI klik na play dugme
    if (e.target.closest(".play_button")) return;

    const desc = e.target.closest(".desc");
    const box = desc
      ? desc.closest(".card_box")
      : e.target.closest(".card_box");
    const clickedInsideAnyBox = !!box;

    // Klik unutar box-a -> otvori/zatvori
    if (clickedInsideAnyBox) {
      e.stopPropagation();

      // Ako klikneš istu koja je već aktivna -> zatvori
      if (activeBox === box) {
        collapseBox(box);
        activeBox = null;
        return;
      }

      // Zatvori prethodnu
      if (activeBox) collapseBox(activeBox);

      // Otvori novu
      expandBox(box);
      activeBox = box;
      return;
    }

    // Klik van -> zatvori ako postoji
    if (activeBox) {
      collapseBox(activeBox);
      activeBox = null;
    }
  });

  // ESC zatvara
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activeBox) {
      collapseBox(activeBox);
      activeBox = null;
    }
  });
  function getLineHeightPx(el) {
    const cs = getComputedStyle(el);
    let lh = parseFloat(cs.lineHeight);
    if (Number.isNaN(lh)) {
      const fs = parseFloat(cs.fontSize) || 16;
      lh = fs * 1.25;
    }
    return lh;
  }

  function expandBox(box) {
    box.classList.add("expanded");
    box.setAttribute("aria-expanded", "true");

    const video = box.closest(".card")?.querySelector("video");
    if (video) {
      video.style.transition = "filter 200ms cubic-bezier(0.16,1,0.3,1)";
      video.style.filter = "brightness(0.5)";
    }

    const desc = box.querySelector(".desc");
    if (!desc) return;

    const startH = getLineHeightPx(desc);
    // priprema
    desc.classList.add("animating");
    desc.style.transition = "none";
    desc.style.maxHeight = startH + "px";
    console.log("startH ", startH);
    // dupli rAF = garantujemo da browser registruje start vrednost
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target = Math.min(
          desc.scrollHeight,
          Math.round(window.innerHeight * 0.7)
        );
        desc.style.transition = "max-height 650ms ";
        desc.style.maxHeight = target + "px";
        const onEnd = (ev) => {
          if (ev.propertyName !== "max-height") return;
          desc.removeEventListener("transitionend", onEnd);
          // čisto stanje za expanded
          desc.classList.remove("animating");
          desc.style.transition = "";
          desc.style.maxHeight = "";
          desc.style.overflow = "auto";
        };
        desc.addEventListener("transitionend", onEnd);
      });
    });
  }

  function collapseBox(box) {
    box.setAttribute("aria-expanded", "false");

    const desc = box.querySelector(".desc");
    const video = box.closest(".card")?.querySelector("video");
    if (video) video.style.filter = "none";

    if (!desc) {
      box.classList.remove("expanded");
      return;
    }

    // start od pune visine → do 1 linije
    const start = desc.scrollHeight;
    const endH = getLineHeightPx(desc);

    desc.classList.add("animating");
    desc.style.transition = "none";
    desc.style.maxHeight = start + "px";
    console.log("startH ", startH);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        desc.style.transition = "max-height 520ms ";
        desc.style.maxHeight = endH + "px";
        const onEnd = (ev) => {
          if (ev.propertyName !== "max-height") return;
          desc.removeEventListener("transitionend", onEnd);
          box.classList.remove("expanded");
          // vrati clamp stanje
          desc.classList.remove("animating");
          desc.style.transition = "";
          desc.style.maxHeight = "";
          desc.style.overflow = "hidden";
        };
        desc.addEventListener("transitionend", onEnd);
      });
    });
  }
});
