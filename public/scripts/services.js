document.addEventListener('DOMContentLoaded', () => {

    /* ===== HELPERS ===== */
    const isDesktop = () => window.innerWidth >= 1200;

    const serviceData = {
        'konsultacije': {
            title: 'Zakaži konsultaciju',
            desc: 'Ostavi email i u roku od nekoliko minuta dobijaš detaljan opis paketa i sledeće korake.'
        },
        'ugc': {
            title: 'Započni sa video sadržajem',
            desc: 'Ostavi email i javljam ti se sa detaljima paketa, procesom snimanja i sledećim koracima.'
        },
        'kontent-strategija': {
            title: 'Pokreni kontent strategiju',
            desc: 'Ostavi email i šaljem ti detaljan opis paketa, način saradnje i kako zakazujemo prvi korak.'
        }
    };

    /* ===== DESKTOP PANEL ELEMENTS ===== */
    const desktopPanel = document.getElementById('desktopExpandPanel');
    const desktopTitle = document.getElementById('desktopExpandTitle');
    const desktopDesc = document.getElementById('desktopExpandDesc');
    const desktopForm = document.getElementById('desktopExpandForm');
    const desktopMessage = document.getElementById('desktopExpandMessage');
    let activeDesktopService = null;

    /* ===== CTA CLICK HANDLER ===== */
    document.querySelectorAll('.service-card-cta[data-target]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const service = targetId.replace('expand-', '');

            if (isDesktop()) {
                handleDesktopExpand(btn, service);
            } else {
                handleMobileExpand(btn, targetId);
            }
        });
    });

    /* ===== MOBILE: inline expand ===== */
    function handleMobileExpand(btn, targetId) {
        const expandEl = document.getElementById(targetId);
        if (!expandEl) return;

        const isOpen = expandEl.classList.contains('open');

        // Close all
        document.querySelectorAll('.card-expand.open').forEach(el => {
            el.classList.remove('open');
        });
        resetAllArrows();

        if (!isOpen) {
            expandEl.classList.add('open');
            btn.querySelector('.cta-arrow').textContent = '↑';
            setTimeout(() => {
                expandEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 150);
        }
    }

    /* ===== DESKTOP: shared panel below cards ===== */
    function handleDesktopExpand(btn, service) {
        const data = serviceData[service];
        if (!data || !desktopPanel) return;

        // If same service clicked again, close
        if (activeDesktopService === service && desktopPanel.classList.contains('open')) {
            desktopPanel.classList.remove('open');
            activeDesktopService = null;
            resetAllArrows();
            return;
        }

        // Populate panel
        desktopTitle.textContent = data.title;
        desktopDesc.textContent = data.desc;
        desktopForm.dataset.service = service;
        desktopMessage.textContent = '';
        desktopForm.reset();

        // Open panel
        desktopPanel.classList.add('open');
        activeDesktopService = service;

        // Update arrows
        resetAllArrows();
        btn.querySelector('.cta-arrow').textContent = '↓';

        setTimeout(() => {
            desktopPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 150);
    }

    /* ===== CLOSE BUTTON ===== */
    const closeBtn = document.getElementById('desktopExpandClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            desktopPanel.classList.remove('open');
            activeDesktopService = null;
            resetAllArrows();
        });
    }

    /* ===== RESET ARROWS ===== */
    function resetAllArrows() {
        document.querySelectorAll('.service-card-cta[data-target] .cta-arrow').forEach(arrow => {
            arrow.textContent = '→';
        });
    }

    /* ===== URL PARAM ?usluga=... ===== */
    const params = new URLSearchParams(window.location.search);
    const serviceParam = params.get('usluga');
    if (serviceParam) {
        const targetBtn = document.querySelector(`.service-card-cta[data-target="expand-${serviceParam}"]`);
        if (targetBtn) {
            setTimeout(() => targetBtn.click(), 300);
        }
    }

    /* ===== FORM SUBMIT (both mobile inline + desktop panel) ===== */
    function handleFormSubmit(form, messageEl) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = form.querySelector('.expand-input')?.value;
            const service = form.dataset.service;
            const submitBtn = form.querySelector('.expand-submit');
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
                        messageEl.textContent = 'Hvala! Proverite email — stiže detaljan opis i sledeći koraci.';
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
    }

    // Bind mobile forms
    document.querySelectorAll('.card-expand .expand-form').forEach(form => {
        const messageEl = form.closest('.card-expand-inner').querySelector('.expand-form-message');
        handleFormSubmit(form, messageEl);
    });

    // Bind desktop form
    if (desktopForm) {
        handleFormSubmit(desktopForm, desktopMessage);
    }
});