document.addEventListener('DOMContentLoaded', () => {
    const serviceSelect = document.getElementById('serviceSelect');
    const leadForm = document.getElementById('leadForm');
    const leadMessage = document.getElementById('leadFormMessage');

    function preselectService(value) {
        if (!serviceSelect || !value) return;
        const opt = serviceSelect.querySelector(`option[value="${value}"]`);
        if (opt) {
            serviceSelect.value = value;
        }
    }

    document.querySelectorAll('a[href="#lead"][data-service]').forEach((link) => {
        link.addEventListener('click', () => {
            preselectService(link.dataset.service);
        });
    });

    document.querySelectorAll('.btn_to_lead[data-service]').forEach((btn) => {
        btn.addEventListener('click', () => {
            preselectService(btn.dataset.service);
        });
    });

    const params = new URLSearchParams(window.location.search);
    const serviceParam = params.get('usluga');
    if (serviceParam) {
        preselectService(serviceParam);
    }

    // ===== FLIP KARTICE =====
    document.querySelectorAll('.learn_more').forEach((cardBtn) => {
        cardBtn.addEventListener('click', () => {
            document.querySelectorAll('.flip-card-inner').forEach((inner) => {
                if (inner !== cardBtn.closest('.flip-card-inner')) {
                    inner.classList.remove('flipped');
                }
            });
            cardBtn.closest('.flip-card-inner').classList.toggle('flipped');
        });
    });

    document.querySelectorAll('.card_flip_back').forEach((btn) => {
        btn.addEventListener('click', () => {
            btn.closest('.flip-card-inner')?.classList.remove('flipped');
        });
    });

    // ===== LEAD FORMA =====
    if (leadForm) {
        leadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = leadForm.querySelector('.emailInput')?.value;
            const service = serviceSelect?.value;
            const submitBtn = leadForm.querySelector('button[type="submit"]');
            const turnstileWidget = leadForm.querySelector('.cf-turnstile');

            if (!service) {
                if (leadMessage) {
                    leadMessage.textContent = 'Izaberite uslugu iz liste.';
                    leadMessage.style.color = '#8b4513';
                }
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Šaljem...';

            try {
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
                    if (leadMessage) {
                        leadMessage.textContent =
                            'Hvala! Proverite email — stiže detaljan opis i sledeći koraci. Javite se za termin ako želite da odmah zakoračimo u produkciju.';
                        leadMessage.style.color = 'green';
                    }
                    leadForm.reset();
                    turnstile.reset(turnstileWidget);
                } else {
                    if (leadMessage) {
                        leadMessage.textContent = data.message || 'Došlo je do greške.';
                        leadMessage.style.color = 'red';
                    }
                    turnstile.reset(turnstileWidget);
                }
            } catch (err) {
                if (leadMessage) {
                    leadMessage.textContent = 'Nije moguće povezati se sa serverom.';
                    leadMessage.style.color = 'red';
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Pošalji upit';
            }
        });
    }
});
