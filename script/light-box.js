const lightbox = document.createElement('div')
lightbox.id = "lightbox"
document.body.appendChild(lightbox)

const lightbox_inner = document.createElement('div')
lightbox_inner.id = "lightbox_inner"
lightbox.appendChild(lightbox_inner)

const closeButton = document.createElement('div')
closeButton.class = "closebutton";
closeButton.innerHTML = "&times"



const images = document.querySelectorAll('.img-holder img')
images.forEach(image =>{
    image.addEventListener('click' , e =>{
        lightbox.classList.add('active')
        const img = document.createElement('img')
        img.src = image.src
        while(lightbox_inner.firstChild){
            lightbox_inner.removeChild(lightbox_inner.firstChild)
        }

        lightbox_inner.appendChild(img)
        lightbox_inner.appendChild(closeButton)
    })
})

lightbox.addEventListener('click', e=>{
    console.log(closeButton)
    if(e.target == e.currentTarget || e.target == closeButton)
        lightbox.classList.remove('active')
})
