// --- Configuration ---
// Birthday: September 20th
const BIRTH_MONTH = 9;
const BIRTH_DAY = 20;

// --- Countdown Logic ---
function updateCountdown() {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Target: September 20th 00:00:00 JST (+09:00) using ISO 8601 format
  let targetDate = new Date(`${currentYear}-09-20T00:00:00+09:00`);

  // If birthday has passed this year, set to next year
  if (now > targetDate) {
    targetDate = new Date(`${currentYear + 1}-09-20T00:00:00+09:00`);
  }

  const diff = targetDate - now;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById("days").textContent = String(days).padStart(2, "0");
  document.getElementById("hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("minutes").textContent = String(minutes).padStart(
    2,
    "0",
  );
  document.getElementById("seconds").textContent = String(seconds).padStart(
    2,
    "0",
  );
}

// Start Countdown
setInterval(updateCountdown, 1000);
updateCountdown(); // Initial call

// --- Omikuji (Fortune) Logic ---
// Structure: Dictionary (Array of Objects) for text, image, and audio
// Future TODO: Fill in the "image" and "audio" fields with actual file paths (e.g., "audio/daikichi.mp3")
const fortuneDict = [
  {
    level: "大吉",
    text: "大吉 - 今天運氣超好！",
    image: "images/omikuji/daikichi.jpg",
    audio: "",
  },
  {
    level: "中吉",
    text: "中吉 - 指出毬亞保佑你！",
    image: "images/omikuji/chukichi.jpg",
    audio: "",
  },
  {
    level: "小吉",
    text: "小吉 - 平安就是福。",
    image: "images/omikuji/shokichi.jpg",
    audio: "",
  },
  {
    level: "吉",
    text: "吉 - 會有好事發生喔！",
    image: "images/omikuji/kichi.jpg",
    audio: "",
  },
  {
    level: "末吉",
    text: "末吉 - 再接再厲！",
    image: "images/omikuji/suekichi.jpg",
    audio: "",
  },
  {
    level: "凶",
    text: "凶 - 沒關係，明天會更好！",
    image: "images/omikuji/kyo.jpg",
    audio: "",
  },
];

// --- Interaction Logic ---
// Add specific interactions for standees
const standees = document.querySelectorAll(".standee");
standees.forEach((standee) => {
  standee.addEventListener("click", function () {
    // Example: Temporary faster shake
    this.style.animation = "none";
    this.offsetHeight; /* trigger reflow */
    this.style.animation = "sway 0.5s ease-in-out infinite";

    // Reset after 1 second
    setTimeout(() => {
      this.style.animation = ""; // Reverts to CSS class definition
    }, 1000);
  });
});
