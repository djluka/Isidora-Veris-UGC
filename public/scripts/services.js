document.addEventListener('DOMContentLoaded', () => {

    /* ===== CARD EXPAND TOGGLE ===== */
    document.querySelectorAll('.service-card-cta[data-target]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const expandEl = document.getElementById(targetId);
            if (!expandEl) return;

            const isOpen = expandEl.classList.contains('open');

            // Close all expanded sections first
            document.querySelectorAll('.card-expand.open').forEach(el => {
                el.classList.remove('open');
            });

            // Reset all CTA arrows
            document.querySelectorAll('.service-card-cta[data-target]').forEach(b => {
                b.querySelector('.cta-arrow').textContent = '→';
            });

            // Toggle the clicked one (if it wasn't already open)
            if (!isOpen) {
                expandEl.classList.add('open');
                btn.querySelector('.cta-arrow').textContent = '↑';

                // Smooth scroll to show the expanded content
                setTimeout(() => {
                    expandEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 150);
            }
        });
    });

    /* ===== URL PARAM ?usluga=... AUTO-OPEN ===== */
    const params = new URLSearchParams(window.location.search);
    const serviceParam = params.get('usluga');
    if (serviceParam) {
        const targetBtn = document.querySelector(`.service-card-cta[data-target="expand-${serviceParam}"]`);
        if (targetBtn) {
            targetBtn.click();
        }
    }

    /* ===== EXPAND FORM SUBMIT ===== */
    document.querySelectorAll('.expand-form').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = form.querySelector('.expand-input')?.value;
            const service = form.dataset.service;
            const submitBtn = form.querySelector('.expand-submit');
            const messageEl = form.closest('.card-expand-inner').querySelector('.expand-form-message');
            const turnstileWidget = form.querySelector('.cf-turnstile');

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
                    if (messageEl) {
                        messageEl.textContent =
                            'Hvala! Proverite email — stiže detaljan opis i sledeći koraci.';
                        messageEl.style.color = 'green';
                    }
                    form.reset();
                    turnstile.reset(turnstileWidget);
                } else {
                    if (messageEl) {
                        messageEl.textContent = data.message || 'Došlo je do greške.';
                        messageEl.style.color = 'red';
                    }
                    turnstile.reset(turnstileWidget);
                }
            } catch (err) {
                if (messageEl) {
                    messageEl.textContent = 'Nije moguće povezati se sa serverom.';
                    messageEl.style.color = 'red';
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Pošalji upit';
            }
        });
    });
});