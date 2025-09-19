function onElementInView(elementSelector, callback) {
  const element = document.querySelector(elementSelector);

  if (!element) {
    console.error("Element not found:", elementSelector);
    return;
  }

  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry.target); // pokreće funkciju
          // ako hoćeš da se samo jednom okine, otkomentariši sledeću liniju:
          // observer.unobserve(entry.target);
        } else {
          const text = document.getElementById("text");
          console.log("nije u view-u");
          text.classList.remove("visible");
        }
      });
    },
    { threshold: 0.1 } // 0.1 znači da 10% elementa mora biti u view-u
  );

  observer.observe(element);
}

// Primer upotrebe
onElementInView("#myElement", (el) => {
  const text = document.getElementById("text");
  console.log(" u view-u");
  text.classList.add("visible");
});
