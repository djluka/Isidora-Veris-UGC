document.addEventListener('DOMContentLoaded', () => {

    const DURATION = 300; // ms
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('.faq_item').forEach((item) => {
        const summary = item.querySelector('summary');
        const answer = item.querySelector('.faq_answer');
        if (!summary || !answer) return;

        let animation = null;
        let isClosing = false;
        let isExpanding = false;

        summary.addEventListener('click', (e) => {
            e.preventDefault();

            // Ako korisnik ne zeli animacije -> obican toggle
            if (reduceMotion) {
                item.open = !item.open;
                return;
            }

            item.style.overflow = 'hidden';

            if (isClosing || !item.open) {
                open();
            } else if (isExpanding || item.open) {
                shrink();
            }
        });

        function open() {
            item.style.height = item.offsetHeight + 'px';
            item.open = true;                       // otvori odmah (za marker + a11y)
            requestAnimationFrame(expand);
        }

        function expand() {
            isExpanding = true;
            const startHeight = item.offsetHeight + 'px';
            const endHeight = summary.offsetHeight + answer.offsetHeight + 'px';

            if (animation) animation.cancel();

            animation = item.animate(
                { height: [startHeight, endHeight] },
                { duration: DURATION, easing: 'ease' }
            );
            animation.onfinish = () => finish(true);
            animation.oncancel = () => { isExpanding = false; };
        }

        function shrink() {
            isClosing = true;
            const startHeight = item.offsetHeight + 'px';
            const endHeight = summary.offsetHeight + 'px';

            if (animation) animation.cancel();

            animation = item.animate(
                { height: [startHeight, endHeight] },
                { duration: DURATION, easing: 'ease' }
            );
            animation.onfinish = () => finish(false);
            animation.oncancel = () => { isClosing = false; };
        }

        function finish(isOpen) {
            item.open = isOpen;
            animation = null;
            isClosing = false;
            isExpanding = false;
            item.style.height = '';
            item.style.overflow = '';
        }
    });
});