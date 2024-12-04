const firebaseConfig = {
  apiKey: "AIzaSyC-VeBBFOvb-9JARQclEETfXfLRtuImHeg",
  authDomain: "repharma-favorite-creative.firebaseapp.com",
  projectId: "repharma-favorite-creative",
  storageBucket: "repharma-favorite-creative.firebasestorage.app",
  messagingSenderId: "185088371543",
  appId: "1:185088371543:web:6e19fd8acba561e9586c12",
  measurementId: "G-GTQDGZPFYG"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Firestore Reference
const db = firebase.firestore();
let favoritesRef;

// Global Variables
let currentPage = 1;
const itemsPerPage = 36;
let data = []; // Store all data
let filteredData = [];
let favorites = {};

// Load JSON from URL
const dataUrl = "https://raw.githubusercontent.com/vchakalov/creative-thumbnails/main/output.json";

// Show and Hide Loading Spinner
function showLoadingSpinner() {
  document.getElementById("loading-spinner").style.display = "flex";
}

function hideLoadingSpinner() {
  document.getElementById("loading-spinner").style.display = "none";
}

// Fetch Data Function
function fetchData() {
  return fetch(dataUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((jsonData) => {
      data = jsonData;
      if (!Array.isArray(data)) {
        throw new Error("JSON data is not an array.");
      }
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      alert("Error fetching data: " + error.message);
    });
}

// Fetch Favorites from Firebase
function fetchFavorites() {
  return favoritesRef
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        favorites[doc.id] = doc.data();
      });
    })
    .catch((error) => {
      console.error("Error fetching favorites:", error);
    });
}

// Save Favorite to Firebase
function saveFavorite(creativeID, item) {
  favoritesRef
    .doc(creativeID.toString())
    .set(item)
    .then(() => {
      console.log(`Favorite ${creativeID} saved!`);
    })
    .catch((error) => {
      console.error("Error saving favorite:", error);
    });
}

// Remove Favorite from Firebase
function removeFavorite(creativeID) {
  favoritesRef
    .doc(creativeID.toString())
    .delete()
    .then(() => {
      console.log(`Favorite ${creativeID} removed!`);
    })
    .catch((error) => {
      console.error("Error removing favorite:", error);
    });
}

// Initialize Gallery
function initializeGallery() {
  const tagFilter = document.getElementById("tag-filter");
  const searchInput = document.getElementById("search-input");

  // Extract unique tags
  const allTagsSet = new Set();
  data.forEach((item) => {
    if (item.Tags) {
      const tags = item.Tags.split(",").map((tag) => tag.trim());
      tags.forEach((tag) => {
        if (tag !== "") {
          allTagsSet.add(tag);
        }
      });
    }
  });
  const allTags = Array.from(allTagsSet).sort();

  // Populate tag filter options
  tagFilter.innerHTML = '<option value="All">All Tags</option>';
  allTags.forEach((tag) => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    tagFilter.appendChild(option);
  });

  // Set initial filtered data
  filteredData = data.slice(); // Copy the data array

  // Display total records
  updateTotalRecords(filteredData.length);

  // Display images for the current page
  displayImages();

  // Add event listener for tag filtering
  tagFilter.addEventListener("change", () => {
    currentPage = 1;
    filterData();
  });

  // Add event listener for search input
  searchInput.addEventListener("input", () => {
    currentPage = 1;
    filterData();
  });

  // Add event listener for favorites tab
  const favoritesTab = document.getElementById("favorites-tab");
  favoritesTab.addEventListener("click", () => {
    showFavorites();
    setActiveTab('favorites-tab');
  });

  // Add event listener for gallery tab
  const galleryTab = document.getElementById("gallery-tab");
  if (galleryTab) {
    galleryTab.addEventListener("click", () => {
      filteredData = data.slice();
      currentPage = 1;
      updateTotalRecords(filteredData.length);
      displayImages();
      setActiveTab('gallery-tab');
    });
  }

  // Hide the loading spinner
  hideLoadingSpinner();

  // Make the main content visible
  document.getElementById("main-content").classList.remove("opacity-0");

  // Enable the controls
  searchInput.disabled = false;
  tagFilter.disabled = false;
}

// Set Active Tab
function setActiveTab(activeTabId) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    if (tab.id === activeTabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

// Filter Data by Tag and Search
function filterData() {
  const searchTerm = document
    .getElementById("search-input")
    .value.toLowerCase();
  const selectedTag = document.getElementById("tag-filter").value.toLowerCase();

  filteredData = data.filter((item) => {
    const itemTags = item.Tags
      ? item.Tags.split(",").map((tag) => tag.trim().toLowerCase())
      : [];
    const matchesTag =
      selectedTag === "all" || itemTags.includes(selectedTag);
    const creativeIdStr = (item.CreativeID || item["Creative ID"] || "")
      .toString()
      .toLowerCase();
    const statusStr = (item.Status || "").toLowerCase();
    const matchesSearch =
      creativeIdStr.includes(searchTerm) || statusStr.includes(searchTerm);
    return matchesTag && matchesSearch;
  });

  updateTotalRecords(filteredData.length);
  displayImages();
}

// Update Total Records
function updateTotalRecords(total) {
  const totalRecords = document.getElementById("total-records");
  totalRecords.textContent = `Total Records: ${total}`;
}

// Display Images
function displayImages() {
  const galleryContainer = document.getElementById("gallery-container");
  galleryContainer.innerHTML = ""; // Clear existing images

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageData = filteredData.slice(startIndex, endIndex);

  if (pageData.length === 0) {
    galleryContainer.innerHTML = `
      <div class="no-results">
        <p>No results found.</p>
      </div>
    `;
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  pageData.forEach((item) => {
    const creativeID = item.CreativeID || item["Creative ID"] || "Unknown";
   
    const imageUrl = `https://github.com/vchakalov/creative-thumbnails/blob/main/img/${creativeID}_thumbnail.jpeg?raw=true`.replace('${creativeID}', creativeID);


    const canvaLink =
      item.CanvaTemplateLink ||
      item["Canva Template LInk"] ||
      item["Canva Template Link"];

    // Create card container
    const cardContainer = document.createElement("div");
    cardContainer.classList.add("card");

    // Image link and image
    const imageLink = document.createElement("a");
    imageLink.href = canvaLink;
    imageLink.target = "_blank";

    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = `Creative ID: ${creativeID}`;

    imageLink.appendChild(img);

    // Card body
    const cardBody = document.createElement("div");
    cardBody.classList.add("card-body");

    const title = document.createElement("h5");
    title.classList.add("card-title");
    title.textContent = `Creative ID: ${creativeID}`;

    const status = document.createElement("p");
    status.classList.add("card-text");
    status.innerHTML = `<strong>Status:</strong> ${item.Status || "N/A"}`;

    const tagsContainer = document.createElement("div");
    tagsContainer.classList.add("tags");

    if (item.Tags) {
      const tags = item.Tags.split(",").map((tag) => tag.trim());
      tags.forEach((t) => {
        if (t !== "") {
          const tagElement = document.createElement("span");
          tagElement.classList.add("tag");
          tagElement.textContent = t;
          tagsContainer.appendChild(tagElement);
        }
      });
    }

    const favoriteButton = document.createElement("button");
    favoriteButton.classList.add("favorite-button");
    favoriteButton.innerHTML = favorites[creativeID]
      ? '<i class="fas fa-star"></i> Favorite'
      : '<i class="far fa-star"></i> Add to Favorites';
    favoriteButton.addEventListener("click", () => {
      toggleFavorite(creativeID, item);
      favoriteButton.innerHTML = favorites[creativeID]
        ? '<i class="fas fa-star"></i> Favorite'
        : '<i class="far fa-star"></i> Add to Favorites';
    });

    // Append elements to card body
    cardBody.appendChild(title);
    cardBody.appendChild(status);
    cardBody.appendChild(tagsContainer);
    cardBody.appendChild(favoriteButton);

    // Append elements to card container
    cardContainer.appendChild(imageLink);
    cardContainer.appendChild(cardBody);

    // Append card to gallery container
    galleryContainer.appendChild(cardContainer);
  });

  // Initialize Masonry after images have loaded
  imagesLoaded(galleryContainer, () => {
    new Masonry(galleryContainer, {
      itemSelector: '.card',
      columnWidth: '.card',
      percentPosition: true
    });
  });

  generatePagination();
}

// Toggle Favorite
function toggleFavorite(creativeID, item) {
  if (favorites[creativeID]) {
    delete favorites[creativeID];
    removeFavorite(creativeID);
  } else {
    favorites[creativeID] = item;
    saveFavorite(creativeID, item);
  }
}

// Show Favorites
function showFavorites() {
  filteredData = Object.values(favorites);
  currentPage = 1;
  updateTotalRecords(filteredData.length);
  displayImages();
}

// Generate Pagination
function generatePagination() {
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (totalPages <= 1) return;

  const paginationList = document.createElement("ul");
  paginationList.classList.add("pagination");

  // Previous Button
  const prevLi = document.createElement("li");
  const prevLink = document.createElement("a");
  prevLink.href = "#";
  prevLink.innerHTML = "&laquo;";
  prevLink.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      displayImages();
    }
  });
  if (currentPage === 1) {
    prevLi.classList.add("disabled");
  }
  prevLi.appendChild(prevLink);
  paginationList.appendChild(prevLi);

  // Page Numbers
  for (let i = 1; i <= totalPages; i++) {
    const pageLi = document.createElement("li");
    if (currentPage === i) {
      pageLi.classList.add("active");
    }
    const pageLink = document.createElement("a");
    pageLink.href = "#";
    pageLink.textContent = i;
    pageLink.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = i;
      displayImages();
    });
    pageLi.appendChild(pageLink);
    paginationList.appendChild(pageLi);
  }

  // Next Button
  const nextLi = document.createElement("li");
  const nextLink = document.createElement("a");
  nextLink.href = "#";
  nextLink.innerHTML = "&raquo;";
  nextLink.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      displayImages();
    }
  });
  if (currentPage === totalPages) {
    nextLi.classList.add("disabled");
  }
  nextLi.appendChild(nextLink);
  paginationList.appendChild(nextLi);

  paginationContainer.appendChild(paginationList);
}

// Initialize the App after Authentication
function initializeApp() {
  showLoadingSpinner();
  Promise.all([fetchData(), fetchFavorites()])
    .then(() => {
      initializeGallery();
    })
    .catch((error) => {
      console.error("Error initializing app:", error);
      hideLoadingSpinner();
    });
}

// Authenticate and then initialize the app
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log("User is signed in anonymously");
    favoritesRef = db.collection("users").doc(user.uid).collection("favorites");
    initializeApp();
  } else {
    firebase.auth().signInAnonymously()
      .catch((error) => {
        console.error("Error during anonymous sign-in:", error);
      });
  }
});
