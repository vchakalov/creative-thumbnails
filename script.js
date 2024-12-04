// script.js

// Global variables
let data = []; // To store all fetched data
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 36;
let allTags = [];

// Event listener for file upload
document.getElementById('file-input').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    alert('No file selected.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      data = JSON.parse(e.target.result);

      if (!Array.isArray(data)) {
        throw new Error('JSON data is not an array.');
      }

      initializeGallery();
    } catch (error) {
      alert('Invalid JSON file: ' + error.message);
    }
  };
  reader.readAsText(file);
}

function initializeGallery() {
  const tagFilter = document.getElementById('tag-filter');
  const searchInput = document.getElementById('search-input');

  // Extract unique tags
  const tagsSet = new Set();
  data.forEach((item) => {
    if (item.Tags) {
      const tags = item.Tags.split(',').map((tag) => tag.trim());
      tags.forEach((tag) => tagsSet.add(tag));
    }
  });
  allTags = Array.from(tagsSet).sort();

  // Populate tag filter options
  tagFilter.innerHTML = '<option value="All">All Tags</option>';
  allTags.forEach((tag) => {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = tag;
    tagFilter.appendChild(option);
  });

  // Enable filters and set initial filtered data
  tagFilter.disabled = false;
  searchInput.disabled = false;
  filteredData = data;

  // Display total records
  updateTotalRecords(filteredData.length);

  // Display images for the current page
  currentPage = 1; // Reset to first page
  displayImages();

  // Add event listener for tag filtering
  tagFilter.addEventListener('change', () => {
    currentPage = 1;
    filterData();
  });

  // Add event listener for search input
  searchInput.addEventListener('input', () => {
    currentPage = 1;
    filterData();
  });
}

function filterData() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const selectedTag = document.getElementById('tag-filter').value;

  filteredData = data.filter((item) => {
    const itemTags = item.Tags ? item.Tags.split(',').map((tag) => tag.trim().toLowerCase()) : [];
    const matchesTag = selectedTag === 'All' || itemTags.includes(selectedTag.toLowerCase());
    const creativeIdStr = (item.CreativeID || item['Creative ID'] || '').toString().toLowerCase();
    const statusStr = (item.Status || '').toLowerCase();
    const matchesSearch =
      creativeIdStr.includes(searchTerm) ||
      statusStr.includes(searchTerm);
    return matchesTag && matchesSearch;
  });

  updateTotalRecords(filteredData.length);
  currentPage = 1; // Reset to first page after filtering
  displayImages();
}

function updateTotalRecords(total) {
  const totalRecords = document.getElementById('total-records');
  totalRecords.textContent = `Total Records: ${total}`;
}

function displayImages() {
  const galleryContainer = document.getElementById('gallery-container');
  galleryContainer.innerHTML = ''; // Clear existing images

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageData = filteredData.slice(startIndex, endIndex);

  if (pageData.length === 0) {
    galleryContainer.innerHTML = `
      <div class="col-span-1 sm:col-span-2 lg:col-span-3">
        <p class="text-center text-gray-600">No results found.</p>
      </div>
    `;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  pageData.forEach((item) => {
    const card = document.createElement('div');
    card.classList.add('card', 'mb-4'); // Add margin bottom for spacing

    // Get the CreativeID
    const creativeId = item.CreativeID || item['Creative ID'] || 'Unknown';

    // Construct the image URL
    const imageUrl = `https://github.com/vchakalov/creative-thumbnails/blob/main/img/${creativeId}_thumbnail.jpeg?raw=true`.replace('${creativeId}', creativeId);

    // Get the Canva Template Link
    const canvaLink = item.CanvaTemplateLink || item['Canva Template LInk'] || item['Canva Template Link'];

    // Create link element to wrap the image
    const imageLink = document.createElement('a');
    imageLink.href = canvaLink;
    imageLink.target = '_blank';

    // Create image element
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = `Creative ID: ${creativeId}`;
    img.classList.add('w-full', 'h-auto', 'object-cover');

    // Append image to link
    imageLink.appendChild(img);

    // Create card body
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body', 'p-4');

    // Create title
    const title = document.createElement('h5');
    title.classList.add('card-title', 'text-lg', 'font-semibold');
    title.textContent = `Creative ID: ${creativeId}`;

    // Create status
    const status = document.createElement('p');
    status.classList.add('card-text', 'text-gray-600', 'mt-2');
    status.innerHTML = `<strong>Status:</strong> ${item.Status || ''}`;

    // Create tags container
    const tagsContainer = document.createElement('div');
    tagsContainer.classList.add('tags', 'mt-4');

    // Create tag elements
    const tags = item.Tags ? item.Tags.split(',').map((tag) => tag.trim()) : [];
    tags.forEach((t) => {
      const tagElement = document.createElement('span');
      tagElement.classList.add('tag', 'inline-block', 'bg-blue-500', 'text-white', 'rounded-full', 'px-3', 'py-1', 'text-sm', 'mr-2', 'mb-2');
      tagElement.textContent = t;
      tagsContainer.appendChild(tagElement);
    });

    // Append elements
    cardBody.appendChild(title);
    cardBody.appendChild(status);
    cardBody.appendChild(tagsContainer);

    card.appendChild(imageLink);
    card.appendChild(cardBody);

    // Append card to gallery
    galleryContainer.appendChild(card);
  });

  // Initialize Masonry after all images have loaded
  imagesLoaded(galleryContainer, function () {
    new Masonry(galleryContainer, {
      itemSelector: '.card',
      columnWidth: '.card',
      percentPosition: true,
      gutter: 16,
    });
  });

  generatePagination();
}


function generatePagination() {
  const paginationContainer = document.getElementById('pagination');
  paginationContainer.innerHTML = '';

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (totalPages <= 1) return;

  const paginationList = document.createElement('ul');
  paginationList.classList.add('pagination');

  // Previous Button
  const prevLi = document.createElement('li');
  if (currentPage === 1) {
    prevLi.classList.add('opacity-50', 'cursor-not-allowed');
  }
  const prevLink = document.createElement('a');
  prevLink.classList.add('px-3', 'py-2', 'bg-white', 'text-gray-700', 'rounded-md', 'hover:bg-gray-200');
  prevLink.href = '#';
  prevLink.innerHTML = '&laquo;';
  prevLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      displayImages();
    }
  });
  prevLi.appendChild(prevLink);
  paginationList.appendChild(prevLi);

  // Page Numbers (limited to a range for better UX)
  const maxPageNumbersToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbersToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPageNumbersToShow - 1);

  if (endPage - startPage < maxPageNumbersToShow - 1) {
    startPage = Math.max(1, endPage - maxPageNumbersToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageLi = document.createElement('li');
    if (currentPage === i) {
      pageLi.classList.add('active');
    }
    const pageLink = document.createElement('a');
    pageLink.classList.add('px-3', 'py-2', 'bg-white', 'text-gray-700', 'rounded-md', 'hover:bg-gray-200');
    if (currentPage === i) {
      pageLink.classList.add('bg-blue-500', 'text-white');
    }
    pageLink.href = '#';
    pageLink.textContent = i;
    pageLink.addEventListener('click', (e) => {
      e.preventDefault();
      currentPage = i;
      displayImages();
    });
    pageLi.appendChild(pageLink);
    paginationList.appendChild(pageLi);
  }

  // Next Button
  const nextLi = document.createElement('li');
  if (currentPage === totalPages) {
    nextLi.classList.add('opacity-50', 'cursor-not-allowed');
  }
  const nextLink = document.createElement('a');
  nextLink.classList.add('px-3', 'py-2', 'bg-white', 'text-gray-700', 'rounded-md', 'hover:bg-gray-200');
  nextLink.href = '#';
  nextLink.innerHTML = '&raquo;';
  nextLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      displayImages();
    }
  });
  nextLi.appendChild(nextLink);
  paginationList.appendChild(nextLi);

  paginationContainer.appendChild(paginationList);
}
