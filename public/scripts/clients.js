// Čeka da se ceo HTML učita pre nego što krene JS,
// da bi svi elementi sigurno postojali u trenutku hvatanja.
document.addEventListener("DOMContentLoaded", () => {
    // ===== Hvatanje elemenata iz DOM-a =====
    const logos = document.querySelectorAll(".logo");      // svi logoi klijenata
    const comment = document.querySelectorAll(".comment"); // svi pojedinačni komentari
    const comments = document.querySelector(".comments");  // kontejner koji obavija komentare

    // Rezervno vreme (ms). Osigurač: ako se izlazna animacija ne okine,
    // čišćenje se svejedno izvrši posle ovog vremena da komentar ne ostane zaglavljen.
    const CLOSE_FALLBACK_MS = 400;

    // ===== POMOĆNE FUNKCIJE =====

    // Skida sve klase stanja sa svih komentara (koristi se pre otvaranja novog).
    function closeAllComments() {
        comment.forEach((c) => {
            c.classList.remove("active");    // aktivni (prikazani) komentar
            c.classList.remove("off_stage"); // komentar u fazi zatvaranja
        });
    }

    // Ako više nema nijednog otvorenog komentara, sakrij ceo kontejner (overlay).
    function hideContainerIfEmpty() {
        if (!document.querySelector(".comment.active") && comments) {
            comments.classList.remove("active");
        }
    }

    // Zatvara jedan komentar: pokrene izlaznu animaciju, sačeka je, pa počisti stanje.
    function closeComment(c) {
        // Ako komentar ne postoji ili nije otvoren, nema šta da se zatvara.
        if (!c || !c.classList.contains("active")) return;

        // Pokreni izlaznu animaciju: skini "active", dodaj "off_stage".
        c.classList.remove("active");
        c.classList.add("off_stage");

        // Zastavica da se čišćenje izvrši SAMO jednom
        // (bilo da ga okine animacija ili rezervni tajmer).
        let finished = false;
        const finish = () => {
            if (finished) return; // već očišćeno -> izađi
            finished = true;
            c.classList.remove("off_stage"); // ukloni klasu zatvaranja
            hideContainerIfEmpty();          // sakrij kontejner ako je prazan
        };

        // Sačekaj kraj animacije BAŠ na ovom komentaru.
        // Provera "ev.target !== c" ignoriše događaje koji procure (bubbling)
        // sa dece komentara, da se čišćenje ne okine prerano.
        const onEnd = (ev) => {
            if (ev.target !== c) return;
            c.removeEventListener("animationend", onEnd);
            finish();
        };
        c.addEventListener("animationend", onEnd);

        // Osigurač: ako animacija ne postoji ili se ne okine, počisti posle isteka vremena.
        setTimeout(finish, CLOSE_FALLBACK_MS);
    }

    // ===== KLIK NA LOGO =====
    logos.forEach((logo) => {
        logo.addEventListener("click", () => {
            // Iz data-logo atributa čitamo koji komentar treba prikazati.
            const targetId = logo.dataset.logo;
            if (!targetId) return; // logo bez data-logo nije klikabilan

            // Nađi komentar koji pripada ovom logou.
            const targetComment = document.querySelector(
                `.comment[data-logo="${targetId}"]`
            );

            // Ako komentar ne postoji, upozori u konzoli i prekini.
            if (!targetComment) {
                console.warn(`No comment found for data-logo="${targetId}"`);
                return;
            }

            // Toggle: ako je taj komentar već otvoren, klik ga zatvara.
            if (targetComment.classList.contains("active")) {
                closeComment(targetComment);
                return;
            }

            // U suprotnom: zatvori sve otvoreno, prikaži kontejner i otvori ciljani komentar.
            closeAllComments();
            if (comments) comments.classList.add("active");
            targetComment.classList.add("active");

            // Skroluj tako da otvoreni komentar bude po sredini ekrana.
            if (comments) {
                comments.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        });
    });

    // ===== DUGME ZA ZATVARANJE (X) =====
    document.querySelectorAll(".close_comment").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            // closest pronalazi roditeljski .comment bez obzira da li si kliknuo
            // na samo dugme ili na sliku unutar njega.
            const c = e.target.closest(".comment");
            if (!c) {
                console.log("Error: Comment element not found");
                return;
            }
            closeComment(c);
        });
    });

    // ===== ESCAPE TASTER =====
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return; // reaguj samo na Escape

        // Zatvori trenutno otvoren komentar (ako postoji).
        const activeComment = document.querySelector(".comment.active");
        closeComment(activeComment);
    });
});