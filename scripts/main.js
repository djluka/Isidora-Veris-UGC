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
