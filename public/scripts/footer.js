const footerMobile = document.querySelector('.footer_mobile');
console.log(footerMobile);
const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            footerMobile.classList.add('animate-footer');

        }
    });
}, {threshold: 0.2});

io.observe(footerMobile);