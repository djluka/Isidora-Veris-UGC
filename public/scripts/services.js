document.addEventListener("DOMContentLoaded", () => {
  // FLIP na klik
  document.querySelectorAll("button.learn_more").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".service-flip-card");
      if (!card) return;
      card.classList.toggle("flip");
      // očisti eventualnu staru poruku
      const msg = card.querySelector(".formMessage");
      if (msg) { msg.textContent = ""; msg.style.opacity = "0"; msg.removeAttribute("data-state"); }
    });
  });

  // Inicijalizacija formi na svim karticama
  document.querySelectorAll(".service-flip-card").forEach((card) => {
    const form  = card.querySelector(".emailForm");
    const input = card.querySelector(".emailInput");

    if (!form || !input) return; // nema forme u ovoj kartici

    // Osiguraj da postoji .formMessage
    let msg = card.querySelector(".formMessage");
    if (!msg) {
      msg = document.createElement("p");
      msg.className = "formMessage";
      form.appendChild(msg);
    }
    msg.setAttribute("aria-live", "polite");

    const isValidEmail = (email) =>
      /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email);

    let isSubmitting = false;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      const email = (input.value || "").trim();
      msg.style.opacity = "1";
      msg.style.color = "red";
      msg.textContent = "";

      if (!email || !isValidEmail(email)) {
        msg.textContent = "Molimo unesite ispravan email format.";
        input.focus();
        return;
      }

      // spreči dupli submit
      isSubmitting = true;
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        // ako front služi Express, koristi relativno "/save-email"
        const url = (window.location.port === "3000") ? "/save-email" : "http://localhost:3000/save-email";
        const service = card.dataset.service || null;

        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, service }),
        });

        // pokušaj da pročitaš JSON; ako ne uspe, tretiraj kao grešku
        let data = {};
        try { data = await resp.json(); } catch { /* ignore */ }

        if (!resp.ok || data.ok !== true) {
          throw new Error(data.error || "Greška pri slanju.");
        }

        msg.style.color = "green";
        msg.innerHTML =
          '<span style="font-weight:700;">✔</span> Hvala na kontaktiranju! Uskoro ćete dobiti detaljan opis usluge na svoju email adresu.';
        input.value = "";

        // auto flip nazad nakon 4s
        setTimeout(() => {
          card.classList.remove("flip");
          msg.textContent = "";
          msg.style.opacity = "0";
        }, 4000);
      } catch (err) {
        console.error(err);
        msg.style.color = "red";
        msg.textContent = "Došlo je do greške. Pokušajte ponovo.";
      } finally {
        isSubmitting = false;
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
});
