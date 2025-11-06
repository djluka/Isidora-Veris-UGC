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
  function getCollapsedPx(desc) {
    const cs = getComputedStyle(desc);
    const lh = parseFloat(cs.lineHeight) || 20;
    const cssLines = parseInt(cs.getPropertyValue("--lines"), 10);
    const lines = Number.isFinite(cssLines) ? cssLines : 2;
    return lh * lines;
  }
  function expandBox(box) {
    console.log("expandBox", box);
    box.setAttribute("aria-expanded", "true");

    const video = box.closest(".card")?.querySelector("video");
    if (video) {
      video.style.transition = "filter 200ms cubic-bezier(0.16,1,0.3,1)";
      video.style.filter = "brightness(0.5)";
    }

    const desc = box.querySelector(".desc");
    if (!desc) return;

    // 1) Postavi start na TAČNO zatvorenu visinu (2 linije)
    const start = getCollapsedPx(desc);
    desc.style.maxHeight = start + "px";

    // 2) Uključi expanded (skida clamp), ALI zadrži start visinu
    box.classList.add("is-expanded");

    // 3) Forsiraj reflow da browser “registruje” start vrednost
    //    (ovo sprečava skok “pojavi se pa nestane”)
    void desc.offsetHeight;

    // 4) Izmeri cilj i animiraj ka njemu
    const target = desc.scrollHeight;
    desc.style.maxHeight = target + "px";

    // 5) Po završetku skini inline maxHeight, ali SAMO ako je i dalje expanded
    const onEnd = (e) => {
      if (e.propertyName !== "max-height") return;
      if (box.classList.contains("is-expanded")) {
        desc.style.maxHeight = "none";
      }
      desc.removeEventListener("transitionend", onEnd);
    };
    desc.addEventListener("transitionend", onEnd);
  }
  function collapseBox(box) {
    console.log("collapseBox", box);
    box.setAttribute("aria-expanded", "false");

    const desc = box.querySelector(".desc");
    const video = box.closest(".card")?.querySelector("video");
    if (video) video.style.filter = "none";
    if (!desc) return;

    // 1) Kreni sa trenutne realne visine (čak i kad je 'none')
    const start = desc.offsetHeight || desc.scrollHeight;
    desc.style.maxHeight = start + "px";

    // 2) Forsiraj reflow pa spusti na “2 linije”
    void desc.offsetHeight;
    const collapsed = getCollapsedPx(desc);
    desc.style.maxHeight = collapsed + "px";

    // 3) Po završetku vrati clamp state
    const onEnd = (e) => {
      if (e.propertyName !== "max-height") return;
      box.classList.remove("is-expanded");
      // ostavi inline maxHeight na collapsed da clamp uvek krene glatko
      desc.removeEventListener("transitionend", onEnd);
    };
    desc.addEventListener("transitionend", onEnd);
  }
  //lazy play interactionObserver for videos
  const videos = document.querySelectorAll(".slider .video_wrapper video");
  const onIntersect = (entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (entry.isIntersecting) {
        if (!video.src) video.src = video.dataset.src;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  };

  const io = new IntersectionObserver(onIntersect, { rootMargin: "200px 0px" });
  videos.forEach((v) => io.observe(v));

  // Dugme "play" da skida mute po potrebi
});
