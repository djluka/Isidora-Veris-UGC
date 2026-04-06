document.addEventListener('DOMContentLoaded', () => {
    const serviceCardsBtn = document.querySelectorAll('.learn_more');
    serviceCardsBtn.forEach(cardBtn => {
        cardBtn.addEventListener('click', () => {
            serviceCardsBtn.forEach(otherCard => {
                if (otherCard !== cardBtn){
                    otherCard.closest('.flip-card-inner').classList.remove('flipped');

                }
            });
            cardBtn.closest('.flip-card-inner').classList.toggle('flipped');
            cardBtn.parentElement.nextElementSibling.querySelector('.emailForm').reset();

        });
    })
})



document.querySelectorAll('.emailForm').forEach(form =>{
    form.addEventListener('submit',async (e) => {
        e.preventDefault();

        const email = form.querySelector('.emailInput').value;
        const service = form.closest('.service-flip-card').dataset.service;
        const messageEl = form.nextElementSibling;


        try{
            const response = await fetch('/api/subscribe',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({email, service})
            });
            const data = await response.json()
            if (response.ok) {
                messageEl.textContent = 'Hvala! Uskoro ćemo vas kontaktirati.';
                messageEl.style.color = 'green';
                form.reset();
            } else {
                messageEl.textContent = data.message || 'Došlo je do greške.';
                messageEl.style.color = 'red';
            }
        }
        catch(err){
            messageEl.textContent = 'Nije moguće povezati se sa serverom.';
            messageEl.style.color = 'red';
        }
    })
})