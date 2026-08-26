document.addEventListener("DOMContentLoaded", () => {
  burgerMenu();
});
function burgerMenu() {
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
}
