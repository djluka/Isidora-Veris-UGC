document.addEventListener("DOMContentLoaded", function () {
  //Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  });
  const hiddenElements = document.querySelectorAll(".hidden");
  const hiddenElements1 = document.querySelectorAll(".hidden1");

  hiddenElements.forEach((e) => observer.observe(e));
  hiddenElements1.forEach((e) => observer.observe(e));
  //animation delay
  let boxes = document.querySelectorAll(".animation_box");
  let start = 0.1;

  boxes.forEach((boxes) => {
    boxes.style.transitionDelay = `${start}s`;

    start += 0.1;

    if (start >= 0.4) {
      start = 0.1;
    }
  });
  //scroll to top

  const scrollToTopButton = document.querySelector(".scroll_to_top");
  scrollToTopButton.addEventListener("click", () => {
    window.scrollTo(0, 0);
  });

  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 150) {
      scrollToTopButton.classList.add("show_btn");
    } else {
      scrollToTopButton.classList.remove("show_btn");
    }
  });

  // burger menu
  const menu = document.querySelector("#menu_toggle");
  const checkBox = document.querySelector("#menu_checkbox");

  const mobileMenuButtons = menu.querySelectorAll(`a`);
  mobileMenuButtons.forEach((mobileMenuButton) => {
    mobileMenuButton.addEventListener("click", () => {
      console.log(mobileMenuButton);
      checkBox.checked = false;
      console.log(checkBox.checked);
      if (checkBox.checked) {
        document.body.classList.add("no_scroll");
      } else {
        document.body.classList.remove("no_scroll");
      }
    });
  });

  checkBox.addEventListener("change", function () {
    if (checkBox.checked) {
      document.body.classList.add("no_scroll");
    } else {
      document.body.classList.remove("no_scroll");
    }
  });
});

///
document.addEventListener("DOMContentLoaded", function () {
  videoButton();
});

function videoButton() {
  document.querySelectorAll(".video_wrapper").forEach((wrapper) => {
    const video = wrapper.querySelector("video");
    const playButton = wrapper.querySelector(".play_button");
    playButton.addEventListener("click", () => {
      video.muted = false;
      video.volume = 0.2;
      video.style.filter = "none";
      video.controls = true;
      video.currentTime = 0;
      videoPoster();
    });
    function videoPoster() {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
        // Safari desktop
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
        // Safari on iOS
      } else if (video.msRequestFullscreen) {
        video.msRequestFullscreen();
        // IE
      }

      video.addEventListener("fullscreenchange", () => {
        if (!document.fullscreenElement) {
          video.muted = true;
          video.controls = false;
          video.style.filter = "brightness(0.8) blur(3px)";

          console.log("none fullscreen");
        } else {
          video.muted = false;
          video.controls = true;
          video.style.filter = "none";

          console.log("fullscreen");
        }
      });
    }
  });
}
