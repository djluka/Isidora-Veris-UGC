// Animacija strelice + koverte kad footer kontakt uđe u ekran.
// Radi sa datim HTML/CSS-om. Umotano tako da uvek čeka DOM, pa je svejedno
// da li je skripta u <head> ili na dnu <body>, sa ili bez defer.

(function () {
    function initFooterArrow() {
        // Posmatramo .footer_icons (ima realnu visinu) umesto .icons (0x0 tačka),
        // pa je triger pouzdan na svim širinama.
        const arrowTarget = document.querySelector('.footer_icons');
        if (!arrowTarget) return; // footer nije na ovoj strani

        const animateEls = [
            ['#arrowBody',      'animate-arrow'],
            ['#arrowHead1',     'animate-arrow-head'],
            ['#arrowHead2',     'animate-arrow-head'],
            ['#mailIconFooter', 'animate_footer_img'],
        ];

        function reveal() {
            animateEls.forEach(([selector, className]) => {
                document.querySelector(selector)?.classList.add(className);
            });
        }

        // Poštuj korisnike sa smanjenim animacijama: preskoči animaciju,
        // ali odmah postavi završno (vidljivo) stanje.
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) {
            document.querySelectorAll('#arrowBody, #arrowHead1, #arrowHead2')
                .forEach(el => { el.style.strokeDashoffset = '0'; });
            const mail = document.querySelector('#mailIconFooter');
            if (mail) { mail.style.opacity = '1'; mail.style.marginLeft = '0'; }
            return;
        }

        // Fallback: ako browser nema IntersectionObserver -> samo pokaži odmah.
        if (!('IntersectionObserver' in window)) {
            reveal();
            return;
        }

        const io = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                reveal();
                observer.unobserve(entry.target); // pokreni samo jednom
            });
        }, {
            threshold: 0.5,                  // pola elementa vidljivo -> pouzdano na svim širinama
            rootMargin: '0px 0px -15% 0px',  // malo viška skrola pre okidanja
        });

        io.observe(arrowTarget);
    }

    // Čekaj DOM ako još nije spreman; inače kreni odmah.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFooterArrow);
    } else {
        initFooterArrow();
    }
})();