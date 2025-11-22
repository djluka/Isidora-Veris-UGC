const footer = document.querySelector('footer');
const footerWrapper = document.querySelector('.footer_wrapper');
console.log(footerWrapper);
const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            footer.classList.add('animate-footer');
            footerWrapper.classList.add('animate-footer');

        }
    });
}, {threshold: 0.2});

io.observe(footer, footerWrapper);