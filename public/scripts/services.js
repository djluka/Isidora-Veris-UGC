document.addEventListener('DOMContentLoaded', () => {

    // ===== FLIP KARTICE =====
    const serviceCardsBtn = document.querySelectorAll('.learn_more');
    serviceCardsBtn.forEach(cardBtn => {
        cardBtn.addEventListener('click', () => {
            serviceCardsBtn.forEach(otherCard => {
                if (otherCard !== cardBtn) {
                    otherCard.closest('.flip-card-inner').classList.remove('flipped');
                }
            });
            cardBtn.closest('.flip-card-inner').classList.toggle('flipped');
            cardBtn.parentElement.nextElementSibling.querySelector('.emailForm').reset();
        });
    });

    // ===== EMAIL FORME =====
    document.querySelectorAll('.emailForm').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = form.querySelector('.emailInput').value;
            const service = form.closest('.service-flip-card').dataset.service;
            const messageEl = form.nextElementSibling;
            const submitBtn = form.querySelector('button[type="submit"]');
            const turnstileWidget = form.querySelector('.cf-turnstile');

            submitBtn.disabled = true;
            submitBtn.textContent = 'Šaljem...';

            try {
                // Invisible mode - ručno pokrećemo i čekamo token
                const turnstileToken = await new Promise((resolve, reject) => {
                    turnstile.execute(turnstileWidget, {
                            callback: (token) => resolve(token),
                            'error-callback': () => reject(new Error('Turnstile failed'))
                        });
                    });

                const response = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, service, turnstileToken })
                });
                const data = await response.json();

                if (response.ok) {
                    messageEl.textContent = 'Hvala! Uskoro ćemo vas kontaktirati.';
                    messageEl.style.color = 'green';
                    form.reset();
                    turnstile.reset(turnstileWidget);
                } else {
                    messageEl.textContent = data.message || 'Došlo je do greške.';
                    messageEl.style.color = 'red';
                    turnstile.reset(turnstileWidget);
                }
            } catch (err) {
                messageEl.textContent = 'Nije moguće povezati se sa serverom.';
                messageEl.style.color = 'red';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Pošalji';
            }
        });
    });

});