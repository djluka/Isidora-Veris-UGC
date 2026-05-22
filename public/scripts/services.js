document.addEventListener('DOMContentLoaded', () => {
    const serviceSelect = document.getElementById('serviceSelect');
    const leadForm = document.getElementById('leadForm');
    const leadMessage = document.getElementById('leadFormMessage');

    /* ===== PRESELECT SERVICE ===== */
    function preselectService(value) {
        if (!serviceSelect || !value) return;
        const opt = serviceSelect.querySelector(`option[value="${value}"]`);
        if (opt) {
            serviceSelect.value = value;
        }
    }

    /* CTA buttons inside cards → preselect + scroll to lead */
    document.querySelectorAll('.service-card-cta[data-service]').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            preselectService(link.dataset.service);
            const leadSection = document.getElementById('lead');
            if (leadSection) {
                leadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });

    /* URL param ?usluga=... */
    const params = new URLSearchParams(window.location.search);
    const serviceParam = params.get('usluga');
    if (serviceParam) {
        preselectService(serviceParam);
    }

    /* ===== LEAD FORM ===== */
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