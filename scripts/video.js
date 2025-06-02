document.addEventListener("DOMContentLoaded", function () {
  videoButton();
  headerVideo();
});

function videoButton() {
  document.querySelectorAll(".video_wrapper").forEach((wrapper) => {
    const video = wrapper.querySelector("video");
    const playButton = wrapper.querySelector(".play_button");
    playButton.addEventListener("click", () => {
      video.muted = false;
      video.volume = 0.5;
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
        } else {
          video.muted = false;
          video.controls = true;
          video.style.filter = "none";
        }
      });
    }
  });
}

function headerVideo() {
  const video = document.querySelector(".profile_wrapper video");
  video.addEventListener("click", () => {
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
  });

  video.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      video.muted = true;
      video.controls = false;
    } else {
      video.muted = false;
      video.controls = true;
      video.currentTime = 0;
    }
  });
}
