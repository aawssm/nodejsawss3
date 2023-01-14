
(() => {
  "use strict";

  const formElem = document.getElementById("uploadForm");
  const selectBucketsElem = document.getElementById("selectBucket");
  const filesListElem = document.getElementById("filesList");
  const filesListLabelElem = document.getElementById("filesListCount");
  const messageElem = document.getElementById("uploadMessage");
  const resetLabelElem = document.getElementById("resetForm");

  document
    .getElementById("uploadFilesInput")
    .addEventListener("change", (e) => {
      filesToUploadHandler(e);
    });
  document.getElementById("submitButton").addEventListener("click", (e) => {
    submitFormHandler(e);
  });
  document.getElementById("resetForm").addEventListener("click", (e) => {
    resetFormHandler(e);
  });
  filesListElem.addEventListener("click", (e) => {
    removeFileFromListHandler(e);
  });

  let filesToUploadHandler = (e) => {
    let numOfFiles = e.target.files.length;

    filesListLabelElem.innerText =
      "You have selected " + numOfFiles + " file(s) for uploading.";

    for (let fileKey in e.target.files) {
      if (
        undefined !== e.target.files[fileKey].name &&
        Number.isInteger(parseInt(fileKey))
      ) {
        filesListElem.innerHTML +=
          '<li><div class="filename">' +
          e.target.files[fileKey].name +
          '</div> <button type="button" class="remove-file-btn">Remove</button></li>';
      }
    }
  };

  let submitFormHandler = (e) => {
    e.preventDefault();
    messageElem.classList.remove("hidden");
    messageElem.innerText = "Uploading...";
    //changed to "window.location.href" to make it work with github codespaces
    // fetch("http://localhost:8000/upload", {
    fetch(window.location.href, {
      method: "POST",
      body: new FormData(uploadForm),
    })
      .then((response) => response.text())
      .then((text) => {
        messageElem.innerText = text;
        resetLabelElem.style.display = "block";
        messageElem.style.display = "block";
      })
      .catch((e) => {
        messageElem.innerText =
          "An error occurred during upload; check your network connection.";
        resetLabelElem.style.display = "block";
        messageElem.style.display = "block";
      });
  };

  let resetFormHandler = (e) => {
    resetLabelElem.style.display = "none";
    messageElem.style.display = "none";
    filesListLabelElem.innerText = "";
    filesListElem.innerHTML = "";
    messageElem.innerText = "";
    formElem.reset();
  };

  let removeFileFromListHandler = (e) => {
    if (e.target.matches(".remove-file-btn")) {
      let li = e.target.parentNode;
      li.parentNode.removeChild(li);
    }
  };

  let fetchBuckets = () => {
    //changed to "window.location.href" to make it work with github codespaces
    // fetch("http://localhost:8000/bucket?api=ture", { 
    fetch(window.location.href.replace("upload", "bucket?api=true"), {
      method: "GET",
      mode: 'cors',
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    })
      .then((response) => response.json())
      .then((json) => {
        let buckets = json;
        buckets.forEach((bucket) => {
          selectBucketsElem.innerHTML +=
            "<option value='" +
            bucket["Name"] +
            "'>" +
            bucket["Name"] +
            "</option>";
        });
      })
      .catch((e) =>
        console.log("There was an error when trying to fetch buckets: ", e)
      );
  };

  fetchBuckets();
})();
