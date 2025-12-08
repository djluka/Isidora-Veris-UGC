const footer = document.querySelector('footer');

const footerMobile = document.querySelector('.footer_mobile');
const arrowBody = document.querySelector('#arrowBodyMobile');
const drawHead1 = document.querySelector('#arrowHead1Mobile');
const drawHead2 = document.querySelector('#arrowHead2Mobile');
const mailIconFooter = document.querySelector('#mailIconFooterMobile');

const arrowBodyDesktop = document.querySelector('#arrowBodyDesktop');
const drawHead1Desktop = document.querySelector('#arrowHead1Desktop');
const drawHead2Desktop = document.querySelector('#arrowHead2Desktop');
const mailIconFooterDesktop = document.querySelector('#mailIconFooterDesktop');

const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {

            footerMobile.classList.add('animate-footer');
            arrowBody.classList.add('animate-arrow');
            drawHead1.classList.add('animate-arrow-head');
            drawHead2.classList.add('animate-arrow-head');
            mailIconFooter.classList.add('animate_footer_img');


            arrowBodyDesktop.classList.add('animate-arrow-desktop');
            drawHead1Desktop.classList.add('animate-arrow-head-desktop');
            drawHead2Desktop.classList.add('animate-arrow-head-desktop');
            mailIconFooterDesktop.classList.add('animate_footer_img-desktop');
        }
    });
}, {threshold: 0.5});

io.observe(footer);