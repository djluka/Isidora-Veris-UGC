document.addEventListener("DOMContentLoaded", () => {
    loop();
})

function loop() {
    const video = document.querySelector(".about_me .about_me_content video.profile_loop_video");
    const videoSrcMobile = video.dataset.src_mobile;
    const videoSrcDesktop = video.dataset.src_desktop;

    function logic(){
        if (window.innerWidth < 1400) {
            video.src = videoSrcMobile;
        } else {
            video.src = videoSrcDesktop;
        }
    }
    logic()

    window.addEventListener("resize", function () {
        // logic()
    });


}