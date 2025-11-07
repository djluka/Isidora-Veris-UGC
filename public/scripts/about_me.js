document.addEventListener("DOMContentLoaded", () => {
    loop();
})

function loop() {
    const video = document.querySelector(".about_me .about_me_content video.profile_loop_video");
    const videoSrcMobile = video.dataset.src_mobile;
    const videoSrcDesktop = video.dataset.src_desktop;

    window.addEventListener("resize", function () {
        console.log("Promenjena je veličina prozora!");

        if (window.innerWidth < 1400) {
            video.src = videoSrcMobile;
            console.log(video);

        } else {
            video.src = videoSrcDesktop;
            console.log(video);

        }
        if (video.src) {
            video.load();
            video.play()
        }
    });


}