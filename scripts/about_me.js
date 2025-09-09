// // Skrol stranice -> pomeraj tekst unutar video okvira (maskiran)
// (function () {
//   const section = document.querySelector(".about_me_content");
//   const frameBox = document.querySelector(".frame-box");
//   const scroller = document.querySelector(".text-scroll");

//   if (!section || !frameBox || !scroller) return;

//   let sectionTop = 0,
//     sectionHeight = 0,
//     viewportH = 0,
//     maxShift = 0;
//   let ticking = false;

//   function measure() {
//     // pozicija sekcije u dokumentu
//     const rect = section.getBoundingClientRect();
//     sectionTop = window.scrollY + rect.top;
//     sectionHeight = section.offsetHeight; // npr. 240vh
//     viewportH = window.innerHeight; // ~90vh sticky-a, dovoljno
//     // koliko teksta ima za “pomak” unutar okvira:
//     maxShift = Math.max(0, scroller.scrollHeight - frameBox.clientHeight);
//   }

//   function onScroll() {
//     if (ticking) return;
//     ticking = true;
//     requestAnimationFrame(() => {
//       const y = window.scrollY;
//       // Progres kroz sticky zonu: 0 (ulaz) → 1 (izlaz)
//       const denom = Math.max(1, sectionHeight - viewportH); // zaštita od /0
//       const progress = Math.min(1, Math.max(0, (y - sectionTop) / denom));
//       const translate = -maxShift * progress;
//       scroller.style.transform = `translateY(${translate}px)`;
//       ticking = false;
//     });
//   }

//   window.addEventListener("scroll", onScroll, { passive: true });
//   window.addEventListener("resize", () => {
//     measure();
//     onScroll();
//   });

//   // Init
//   measure();
//   onScroll();
// })();
