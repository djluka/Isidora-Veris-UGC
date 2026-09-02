// video render fix
window.addEventListener('load', () => {
  const video = document.querySelector('.profile');
  video.src = 'https://res.cloudinary.com/fmhclk2o/video/upload/v1783505854/profile_video_buyrej.mp4';
  setTimeout(() => video.play().catch(()=>{}), 200);
});

//  typewriter_animation
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('typewriter_animation');
      observer.unobserve(entry.target);
    }
  });
});

// dodaj observer na sve elemente koje želiš da animiraš
document.querySelectorAll('.highlight_desc').forEach((el) => observer.observe(el));

document.querySelector(".cta_button").addEventListener("click", (e) => {
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach((entry) => {
        entry.classList.toggle('blooom');
        console.log(entry);
    })

})