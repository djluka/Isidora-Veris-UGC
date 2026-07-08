const footer = document.querySelector('footer');

const animateEls = [
    ['.footer_mobile',        'animate-footer'],
    ['#arrowBodyMobile',      'animate-arrow'],
    ['#arrowHead1Mobile',     'animate-arrow-head'],
    ['#arrowHead2Mobile',     'animate-arrow-head'],
    ['#mailIconFooterMobile', 'animate_footer_img'],
    ['#arrowBodyDesktop',      'animate-arrow-desktop'],
    ['#arrowHead1Desktop',     'animate-arrow-head-desktop'],
    ['#arrowHead2Desktop',     'animate-arrow-head-desktop'],
    ['#mailIconFooterDesktop', 'animate_footer_img-desktop'],
];

const io = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        animateEls.forEach(([selector, className]) => {
            document.querySelector(selector)?.classList.add(className);
        });

        observer.unobserve(entry.target); // pokreni samo jednom
    });
}, { threshold: 0.25, rootMargin: '0px 0px -10% 0px' });

if (footer) io.observe(footer);