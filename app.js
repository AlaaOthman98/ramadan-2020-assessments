/**
 * DOMContentLoaded => an event listener that is fired upon only all Dom elements loaded and before images and styles loaded
 * window.load() => fires after all elements (including images and styles) in the page loaded
 */

const videoRequestListElm = document.getElementById("listOfRequests");

const state = {
  sortBy: "newlyAdded",
  searchKey: "",
  userId: "",
};

document.addEventListener("DOMContentLoaded", () => {
  const videoRequestFormElm = document.getElementById("videoRequestForm");
  const sortByElms = document.querySelectorAll("[id*=sortBy_]");
  const searchBoxElm = document.getElementById("searchBox");

  const loginFormElm = document.querySelector(".login-form");
  const appContent = document.querySelector(".app-content");

  if (window.location.search) {
    state.userId = new URLSearchParams(window.location.search).get("id");

    loginFormElm.classList.add("d-none");
    appContent.classList.remove("d-none");
  }

  loadVideoRequests();

  sortByElms.forEach((sortByElm) => {
    sortByElm.addEventListener("click", function (e) {
      e.preventDefault();

      state.sortBy = this.querySelector("input").value;
      loadVideoRequests(state.sortBy, state.searchKey);

      this.classList.add("active");
      if (state.sortBy === "topVoted") {
        document.getElementById("sortBy_NewlyAdded").classList.remove("active");
      } else {
        document.getElementById("sortBy_TopVoted").classList.remove("active");
      }
    });
  });

  searchBoxElm.addEventListener(
    "input",
    debounce((e) => {
      console.log(this);
      state.searchKey = e.target.value;
      loadVideoRequests(state.sortBy, state.searchKey);
    }, 500)
  );

  // Post video object to the server on submit
  videoRequestFormElm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(videoRequestFormElm);
    formData.append("author_id", state.userId);

    const isFormValid = validateFormData(formData);

    if (!isFormValid) return;

    fetch("http://localhost:7777/video-request", { method: "POST", body: formData })
      .then((res) => res.json())
      .then((data) => {
        const videoRequestCard = getVideoRequestCard(data);
        videoRequestListElm.prepend(videoRequestCard);

        addVotingListener(data);
      });
  });
});

const getVideoRequestCard = (videoRequestInfo) => {
  const dummyDiv = document.createElement("div");
  dummyDiv.innerHTML = `
  <div class="card mb-3">
    <div class="card-body d-flex justify-content-between flex-row">
      <div class="d-flex flex-column">
        <h3>${videoRequestInfo.topic_title}</h3>
        <p class="text-muted mb-2">${videoRequestInfo.topic_details}</p>
        ${
          videoRequestInfo.expected_result &&
          `<p class="mb-0 text-muted"><strong>Expected results:</strong> ${videoRequestInfo.expected_result}</p>`
        }
      </div>
      <div class="d-flex flex-column text-center">
        <a id="voteUp_${videoRequestInfo._id}" class="btn btn-link">🔺</a>
        <h3 id="voteScore_${videoRequestInfo._id}">
          ${videoRequestInfo.votes.ups - videoRequestInfo.votes.downs}
        </h3>
        <a id="voteDown_${videoRequestInfo._id}" class="btn btn-link">🔻</a>
      </div>
    </div>
    <div class="card-footer d-flex flex-row justify-content-between">
      <div>
        <span class="text-info">${videoRequestInfo.status.toUpperCase()}</span>
        &bullet; added by <strong>${videoRequestInfo.author_name}</strong> on
        <strong>${new Date(videoRequestInfo.submit_date).toDateString()}</strong>
      </div>
      <div class="d-flex justify-content-center flex-column 408ml-auto mr-2">
        <div class="badge badge-success">${videoRequestInfo.target_level}</div>
      </div>
    </div>
  </div>
  `;

  return dummyDiv.children[0];
};

const addVotingListener = (videoRequestInfo) => {
  const voteUpElm = document.getElementById(`voteUp_${videoRequestInfo._id}`);
  const voteDownElm = document.getElementById(`voteDown_${videoRequestInfo._id}`);
  const voteScoreElm = document.getElementById(`voteScore_${videoRequestInfo._id}`);

  voteUpElm.addEventListener("click", () => voteHandler(videoRequestInfo._id, "ups", voteScoreElm));
  voteDownElm.addEventListener("click", () => voteHandler(videoRequestInfo._id, "downs", voteScoreElm));
};

const voteHandler = (videoRequestId, voteType, voteScoreElm) => {
  fetch("http://localhost:7777/video-request/vote", {
    method: "PUT",
    headers: { "content-Type": "application/json" },
    body: JSON.stringify({
      id: videoRequestId,
      vote_type: voteType,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      voteScoreElm.innerText = data.ups - data.downs;
    });
};

const loadVideoRequests = (sortBy = "newlyAdded", searchKey = "") => {
  fetch(`http://localhost:7777/video-request?sortBy=${sortBy}&searchKey=${searchKey}`)
    .then((res) => res.json())
    .then((data) => {
      videoRequestListElm.innerHTML = "";

      data.forEach((videoRequestInfo) => {
        const videoRequestCard = getVideoRequestCard(videoRequestInfo);
        videoRequestListElm.appendChild(videoRequestCard);

        addVotingListener(videoRequestInfo);
      });
    });
};

const validateFormData = (formData) => {
  const topicTitle = formData.get("topic_title");
  const topicDetails = formData.get("topic_details");

  if (!topicTitle || topicTitle.length > 100) {
    document.querySelector("[name=topic_title]").classList.add("is-invalid");
  }

  if (!topicDetails) {
    document.querySelector("[name=topic_details]").classList.add("is-invalid");
  }

  const allInvalidElms = document.getElementById("videoRequestForm").querySelectorAll(".is-invalid");

  if (allInvalidElms.length) {
    allInvalidElms.forEach((invalidElm) => {
      invalidElm.addEventListener("input", function () {
        this.classList.remove("is-invalid");
      });
    });
    return false;
  }

  return true;
};

const debounce = (fn, time) => {
  let timeout;

  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), time);
  };
};

