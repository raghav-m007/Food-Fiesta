let checkbox = document.querySelector("input[type='checkbox']");
if (checkbox) {
  checkbox.addEventListener("change", function () {
    checkbox.value = checkbox.checked ? 1 : 0;
    console.log(checkbox.value);
  });
}
