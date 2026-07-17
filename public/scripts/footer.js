// Posmatramo samo .icons (strelica + koverta), ne ceo footer — tako
// animacija kreće tek kad TA konkretna oblast uđe u ekran, ne čim se
// footer uopšte pomoli.
const arrowTarget = document.querySelector('.icons');

const animateEls = [
    ['#arrowBody',      'animate-arrow'],
    ['#arrowHead1',     'animate-arrow-head'],
    ['#arrowHead2',     'animate-arrow-head'],
    ['#mailIconFooter', 'animate_footer_img'],
];

const io = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        animateEls.forEach(([selector, className]) => {
            document.querySelector(selector)?.classList.add(className);
        });

        observer.unobserve(entry.target); // pokreni samo jednom
    });
}, {
    threshold: 1,                    // mora CELA strelica da bude vidljiva
    rootMargin: '0px 0px -15% 0px',  // + malo viška skrola posle toga
});

if (arrowTarget) io.observe(arrowTarget);