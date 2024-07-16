"use strict";
const backgrounds = [
  'url("images/background-1.jpg")',
  'url("images/background-2.jpg")',
  'url("images/background-3.jpg")',
  'url("images/background-4.jpg")',
  'url("images/background-5.jpg")',
  'url("images/background-6.jpg")',
  'url("images/background-7.jpg")',
  'url("images/background-8.jpg")',
];

function changeBackground() {
  const randomIndex = Math.floor(Math.random() * backgrounds.length);
  const backgroundElement = document.querySelector(".background");
  backgroundElement.style.backgroundImage = backgrounds[randomIndex];
}

changeBackground();

setInterval(changeBackground, 5000);

let currentPage = 1;
let currentQuery = "";
let loadingMore = false;

document.querySelector("#searchForm").addEventListener("submit", function (e) {
  e.preventDefault();
  currentPage = 1;
  currentQuery = document.querySelector("#search-input").value.trim();
  if (currentQuery) {
    document.querySelector("#observer").classList.remove("hidden"); // показываем элемент observer при поисковом запросе
    clearElement(document.querySelector("#movies"));
    searchMovies(currentPage, currentQuery);
  }
});

// функция для проверки размера свободного места и загрузки данных при необходимости
async function loadMoreMovies() {
  showLoader();

  const delay = 2000;

  try {
    await new Promise((resolve) => setTimeout(resolve, delay)); // ожидаем заданное количество времени
    await searchMovies(currentPage, currentQuery);
    currentPage++;
  } catch (error) {
    console.error("Error loading more movies:", error);
  } finally {
    hideLoader();
    loadingMore = false;
  }
}

async function searchMovies(page, query) {
  const apiKey = "1ffaa148";
  const url = `http://www.omdbapi.com/?s=${query}&page=${page}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.Response === "True") {
      const validMovies = data.Search.filter(
        (movie) => movie.Poster !== "N/A" && movie.Director !== "N/A"
      );
      displayMovies(validMovies);
    } else {
      if (page === 1) {
        clearElement(document.querySelector("#movies"));
        const p = document.createElement("p");
        p.textContent = data.Error;
        p.classList.add("error-message");
        document.querySelector("#movies").appendChild(p);
      }
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Error("Failed to fetch data");
  }
}

function showLoader() {
  document.querySelector("#loader").classList.remove("hidden");
}

function hideLoader() {
  document.querySelector("#loader").classList.add("hidden");
}

function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function displayMovies(movies) {
  const moviesDiv = document.querySelector("#movies");
  const template = document.querySelector("#movie-template").content;

  movies.forEach((movie) => {
    const clone = template.cloneNode(true);

    const img = clone.querySelector("img");
    img.src = movie.Poster;
    img.alt = movie.Title;

    img.onerror = () => {
      img.src = "images/placeholder.png"; // заменяем ошибочную картинку на заглушку
    };

    const h3 = clone.querySelector("h3");
    h3.textContent = movie.Title;

    const typeP = clone.querySelector(".type");
    typeP.textContent = movie.Type === "movie" ? "Film" : "Series";

    const yearP = clone.querySelector(".year");
    yearP.textContent = movie.Year;

    const button = clone.querySelector("button");
    button.textContent = "Details";
    button.onclick = () => showDetails(movie.imdbID);

    moviesDiv.appendChild(clone);
  });
}

function showDetails(id) {
  const apiKey = "1ffaa148";
  const url = `http://www.omdbapi.com/?i=${id}&apikey=${apiKey}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.Director === "N/A") {
        console.log("Skipping movie with unknown director");
        return; // пропускаем фильм с неизвестным автором
      }

      const movieDetailsDiv = document.querySelector("#movieDetails");
      clearElement(movieDetailsDiv);

      const template = document.querySelector("#details-template").content;
      const clone = template.cloneNode(true);

      const titleH2 = clone.querySelector("h2");
      titleH2.textContent = data.Title;

      const img = clone.querySelector("img");
      img.src = data.Poster;
      img.alt = data.Title;

      clone.querySelector(
        ".released"
      ).textContent = `Released: ${data.Released}`;
      clone.querySelector(".genre").textContent = `Genre: ${data.Genre}`;
      clone.querySelector(".country").textContent = `Country: ${data.Country}`;
      clone.querySelector(
        ".director"
      ).textContent = `Director: ${data.Director}`;
      clone.querySelector(".writer").textContent = `Writer: ${data.Writer}`;
      clone.querySelector(".actors").textContent = `Actors: ${data.Actors}`;
      clone.querySelector(".awards").textContent = `Awards: ${data.Awards}`;

      const imdbLink = clone.querySelector("#imdb-link");
      imdbLink.href = `https://www.imdb.com/title/${data.imdbID}/`;
      imdbLink.textContent = "IMDb Link";

      movieDetailsDiv.appendChild(clone);

      const modal = document.querySelector("#modal");
      modal.classList.add("show");
    })
    .catch((error) => console.error("Error:", error));
}

// закрытие модального окна при нажатии на крестик
document.querySelector(".close").addEventListener("click", () => {
  const modal = document.querySelector("#modal");
  modal.classList.remove("show");
});

// закрытие модального окна при клике вне его
window.addEventListener("click", (event) => {
  const modal = document.querySelector("#modal");
  if (event.target == modal) {
    modal.classList.remove("show");
  }
});

// intersection Observer API для подгрузки фильмов при прокрутке
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !loadingMore) {
        loadMoreMovies();
      }
    });
  },
  {
    root: null,
    rootMargin: "0px",
    threshold: 1.0,
  }
);

observer.observe(document.querySelector("#observer"));
