/**
 * DOMContentLoaded => an event listener that is fired upon only all Dom elements loaded and before images and styles loaded
 * window.load() => fires after all elements (including images and styles) in the page loaded
 */

document.addEventListener("DOMContentLoaded", () => {
  const videoRequestForm = document.getElementById("videoRequestForm");

  videoRequestForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(videoRequestForm);

    fetch("http://localhost:7777/video-request", { method: "POST", body: formData })
      .then((bold) => bold.json())
      .then((data) => {
        console.log(data);
      });
  });
});

