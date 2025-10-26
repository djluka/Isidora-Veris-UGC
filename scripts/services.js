document.querySelectorAll(".read_more").forEach((button) => {
  button.addEventListener("click", () => {
    const desc = button.previousElementSibling;

    if (button.textContent === "pročitaj više") {
      // proširi
      desc.style.setProperty("--lines", "999"); // praktično unlimited
      desc.style.maxHeight = desc.scrollHeight + "px"; // animira visinu
      desc.style.webkitMaskImage = "none";
      desc.style.maskImage = "none";
      desc.style.opacity = "1";

      button.textContent = "smanji tekst";
    } else {
      // skupi
      desc.style.setProperty("--lines", "7");
      desc.style.maxHeight = `calc(var(--lh) * 7)`;
      desc.style.webkitMaskImage =
        "linear-gradient(180deg, #000 70%, transparent 100%)";
      desc.style.maskImage =
        "linear-gradient(180deg, #000 70%, transparent 100%)";
      desc.style.opacity = "0.9";

      button.textContent = "pročitaj više";
    }
  });
});
