document.addEventListener("DOMContentLoaded", () => {
    // Select elements from DOM
    const logos = document.querySelectorAll(".logo");
    const comment = document.querySelectorAll(".comment");
    const comments = document.querySelector(".comments");

    // Helper function to close all comments
    function closeAllComments() {
        comment.forEach((c) => c.classList.remove("active"));
    }

    // Add click handlers to logo elements
    logos.forEach((logo) => {
        logo.addEventListener("click", () => {
            const targetId = logo.dataset.logo;
            if (!targetId) return; // Ignore click if logo has no data-logo attribute

            // Show container if hidden
            if (comments && !comments.classList.contains("active")) {
                comments.classList.add("active");
            }

            // Close any open comments first
            closeAllComments();

            // Find and show the target comment
            const targetComment = document.querySelector(
                `.comment[data-logo="${targetId}"]`
            );

            if (targetComment) {
                comments.classList.add("active");
                targetComment.classList.add("active");
                console.log(targetComment);
            } else {
                console.warn(`No comment found for data-logo="${targetId}"`);
            }
        });
    });

    // Add click handlers to close buttons
    document.querySelectorAll(".close_comment").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const c = e.target.closest(".comment");
            const comments = document.querySelector(`.comments`);

            if (!c) {
                console.log("Error: Comment element not found");
                return;
            }

            // Start closing animation
            c.classList.remove("active");
            c.classList.add("off_stage");

            // Handle animation end
            c.addEventListener(
                "animationend",
                () => {
                    c.classList.remove("off_stage");

                    // Hide container if no active comments remain
                    const anyActive = document.querySelector(".comment.active");
                    if (!anyActive && comments) {
                        comments.classList.remove("active");
                    }
                },
                {once: true}
            );
        });
    });

    // Add escape key handler to close active comment
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;

        const activeComment = document.querySelector(".comment.active");
        if (!activeComment) return;

        // Start closing animation
        activeComment.classList.remove("active");
        activeComment.classList.add("off_stage");

        // Handle animation end
        activeComment.addEventListener(
            "animationend",
            () => {
                activeComment.classList.remove("off_stage");

                // Hide container if no active comments remain
                if (!document.querySelector(".comment.active") && comments) {
                    comments.classList.remove("active");
                }
            },
            {once: true}
        );
    });
});