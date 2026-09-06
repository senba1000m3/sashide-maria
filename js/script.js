"use strict";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const BIRTH_MONTH = 9;
const BIRTH_DAY = 20;
const DRAW_DELAY_MS = 1000;
const STORAGE_KEY = "sashideMaria.omikuji.v2";
const STORAGE_VERSION = 2;

const fortuneData = [
  {
    id: "daikichi",
    level: "大吉",
    message:
      "今天的幸運值滿格！相信自己的直覺，大膽踏出下一步，好事正在向你靠近。",
    images: [
      {
        id: "daikichi-1",
        src: "images/omikuji/daikichi.png",
        dataScript: "js/card-images/daikichi-1.js",
        alt: "大吉籤運圖片",
        position: "50% 50%",
      },
    ],
  },
  {
    id: "chukichi",
    level: "中吉",
    message:
      "今天會有溫柔的小驚喜。保持好心情，你的努力很快就會收到回應。",
    images: [
      {
        id: "chukichi-1",
        src: "images/omikuji/chukichi.png",
        dataScript: "js/card-images/chukichi-1.js",
        alt: "中吉籤運圖片",
        position: "50% 50%",
      },
    ],
  },
  {
    id: "syokichi",
    level: "小吉",
    message:
      "平穩就是今天最好的運氣。把小事做好，微小的幸福會慢慢累積。",
    images: [
      {
        id: "syokichi-1",
        src: "images/omikuji/syokichi.png",
        dataScript: "js/card-images/syokichi-1.js",
        alt: "小吉籤運圖片",
        position: "50% 50%",
      },
    ],
  },
  {
    id: "kichi",
    level: "吉",
    message:
      "好事正在醞釀中。主動向前一步，可能遇見意想不到的緣分與收穫。",
    images: [
      {
        id: "kichi-1",
        src: "images/omikuji/kichi.png",
        dataScript: "js/card-images/kichi-1.js",
        alt: "吉籤運圖片",
        position: "50% 50%",
      },
    ],
  },
  {
    id: "suekichi",
    level: "末吉",
    message:
      "現在還在暖身，別急著否定自己。耐心多走一步，轉機會在稍後出現。",
    images: [
      {
        id: "suekichi-1",
        src: "images/omikuji/suekichi.png",
        dataScript: "js/card-images/suekichi-1.js",
        alt: "末吉籤運圖片",
        position: "50% 50%",
      },
    ],
  },
  {
    id: "kyo",
    level: "凶",
    message:
      "今天適合放慢腳步。照顧好自己、避開勉強，明天又會是全新的開始。",
    images: [
      {
        id: "kyo-1",
        src: "images/omikuji/kyo.png",
        dataScript: "js/card-images/kyo-1.js",
        alt: "凶籤運圖片",
        position: "50% 50%",
      },
    ],
  },
];

const birthdayFortune = {
  id: "birthday",
  level: "生日大吉",
  message:
    "9 月 20 日限定！指出毬亞，お誕生日おめでとう！願新的一歲充滿笑容、幸福與更多閃閃發亮的回憶。",
  images: [
    {
      id: "birthday-1",
      src: "images/omikuji/tannjyoubi.png",
      dataScript: "js/card-images/birthday-1.js",
      alt: "指出毬亞生日限定圖片",
      position: "50% 50%",
    },
  ],
};

const elements = {
  countdownContainer: document.getElementById("countdownContainer"),
  timer: document.getElementById("timer"),
  birthdayMessage: document.getElementById("birthdayMessage"),
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
  drawButton: document.getElementById("omikujiBtn"),
  drawNote: document.getElementById("omikujiNote"),
  modal: document.getElementById("omikujiModal"),
  closeModal: document.getElementById("closeModal"),
  drawLoading: document.getElementById("drawLoading"),
  resultCard: document.getElementById("resultCard"),
  resultLevel: document.getElementById("modalLevel"),
  resultImage: document.getElementById("modalImage"),
  imageError: document.getElementById("imageError"),
  resultMessage: document.getElementById("modalMessage"),
  shareButton: document.getElementById("shareResult"),
  downloadButton: document.getElementById("downloadResult"),
  actionStatus: document.getElementById("actionStatus"),
};

let activeDateKey = "";
let currentResult = null;
let resultCardBlobPromise = null;
let drawTimer = null;
const bundledImagePromises = new Map();

function getJstParts(date = new Date()) {
  const shifted = new Date(date.getTime() + JST_OFFSET_MS);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
    seconds: shifted.getUTCSeconds(),
  };
}

function formatDateKey(parts) {
  return [parts.year, parts.month, parts.day]
    .map((value, index) =>
      index === 0 ? String(value) : String(value).padStart(2, "0"),
    )
    .join("-");
}

function isBirthday(parts) {
  return parts.month === BIRTH_MONTH && parts.day === BIRTH_DAY;
}

function getNextBirthdayTimestamp(parts) {
  const birthdayHasPassed =
    parts.month > BIRTH_MONTH ||
    (parts.month === BIRTH_MONTH && parts.day > BIRTH_DAY);
  const targetYear = birthdayHasPassed ? parts.year + 1 : parts.year;

  // September 20 00:00 JST is September 19 15:00 UTC.
  return Date.UTC(targetYear, BIRTH_MONTH - 1, BIRTH_DAY - 1, 15, 0, 0);
}

function updateCountdown() {
  const now = new Date();
  const parts = getJstParts(now);
  const birthdayToday = isBirthday(parts);

  elements.countdownContainer.classList.toggle(
    "is-birthday",
    birthdayToday,
  );
  elements.timer.hidden = birthdayToday;
  elements.birthdayMessage.hidden = !birthdayToday;

  if (!birthdayToday) {
    const difference = Math.max(
      0,
      getNextBirthdayTimestamp(parts) - now.getTime(),
    );
    const dayMs = 24 * 60 * 60 * 1000;
    const hourMs = 60 * 60 * 1000;
    const minuteMs = 60 * 1000;

    elements.days.textContent = String(
      Math.floor(difference / dayMs),
    ).padStart(2, "0");
    elements.hours.textContent = String(
      Math.floor((difference % dayMs) / hourMs),
    ).padStart(2, "0");
    elements.minutes.textContent = String(
      Math.floor((difference % hourMs) / minuteMs),
    ).padStart(2, "0");
    elements.seconds.textContent = String(
      Math.floor((difference % minuteMs) / 1000),
    ).padStart(2, "0");
  }

  syncDailyState(parts);
}

function randomIndex(length) {
  if (length <= 1) {
    return 0;
  }

  if (window.crypto?.getRandomValues) {
    const maxUint32 = 0x100000000;
    const acceptedRange = maxUint32 - (maxUint32 % length);
    const randomValue = new Uint32Array(1);

    do {
      window.crypto.getRandomValues(randomValue);
    } while (randomValue[0] >= acceptedRange);

    return randomValue[0] % length;
  }

  return Math.floor(Math.random() * length);
}

function buildResult(fortune, image, dateKey) {
  return { dateKey, fortune, image };
}

function createDailyResult(dateKey, birthdayToday) {
  const fortune = birthdayToday
    ? birthdayFortune
    : fortuneData[randomIndex(fortuneData.length)];
  const image = fortune.images[randomIndex(fortune.images.length)];
  const result = buildResult(fortune, image, dateKey);

  saveResult(result);
  return result;
}

function saveResult(result) {
  const record = {
    version: STORAGE_VERSION,
    dateKey: result.dateKey,
    fortuneId: result.fortune.id,
    imageId: result.image.id,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch (error) {
    console.warn("Unable to save today's fortune.", error);
  }
}

function loadResult(dateKey, birthdayToday) {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (!storedValue) {
      return null;
    }

    const record = JSON.parse(storedValue);
    if (
      record.version !== STORAGE_VERSION ||
      record.dateKey !== dateKey
    ) {
      return null;
    }

    const availableFortunes = birthdayToday
      ? [birthdayFortune]
      : fortuneData;
    const fortune = availableFortunes.find(
      (item) => item.id === record.fortuneId,
    );
    const image = fortune?.images.find(
      (item) => item.id === record.imageId,
    );

    return fortune && image ? buildResult(fortune, image, dateKey) : null;
  } catch (error) {
    console.warn("Unable to restore today's fortune.", error);
    return null;
  }
}

function syncDailyState(parts) {
  const dateKey = formatDateKey(parts);
  if (dateKey === activeDateKey) {
    return;
  }

  activeDateKey = dateKey;
  currentResult = loadResult(dateKey, isBirthday(parts));
  resultCardBlobPromise = null;

  if (elements.modal.open) {
    closeResultModal();
  }

  updateDrawButton(parts);
}

function updateDrawButton(parts = getJstParts()) {
  elements.drawButton.textContent = "每日一毬";

  elements.drawNote.textContent = isBirthday(parts)
    ? "9 月 20 日・生日限定"
    : "每天日本時間 00:00 更新";
}

function openResultModal() {
  if (!elements.modal.open) {
    elements.modal.showModal();
  }
}

function closeResultModal() {
  if (drawTimer) {
    window.clearTimeout(drawTimer);
    drawTimer = null;
  }

  elements.drawButton.disabled = false;
  if (elements.modal.open) {
    elements.modal.close();
  }
}

function showLoadingState() {
  elements.drawLoading.hidden = false;
  elements.resultCard.hidden = true;
  elements.actionStatus.textContent = "";
  elements.drawButton.disabled = true;
}

function showResult(result) {
  elements.drawLoading.hidden = true;
  elements.resultCard.hidden = false;
  elements.resultLevel.textContent = result.fortune.level;
  elements.resultMessage.textContent = result.fortune.message;
  elements.imageError.hidden = true;
  elements.resultImage.hidden = false;
  elements.resultImage.alt = result.image.alt;
  elements.resultImage.style.objectPosition = result.image.position;
  elements.resultImage.removeAttribute("src");
  elements.resultImage.src = result.image.src;
  elements.actionStatus.textContent = "正在準備結果卡…";
  elements.shareButton.disabled = true;
  elements.downloadButton.disabled = true;

  resultCardBlobPromise = prepareResultCardBlob(result)
    .then((blob) => {
      elements.shareButton.disabled = false;
      elements.downloadButton.disabled = false;
      elements.actionStatus.textContent = "";
      return blob;
    })
    .catch((error) => {
      console.warn("Unable to create result card.", error);
      elements.shareButton.disabled = false;
      elements.downloadButton.disabled = true;
      elements.actionStatus.textContent =
        "結果卡暫時無法產生，仍可分享文字。";
      return null;
    });

  updateDrawButton();
  elements.drawButton.disabled = false;
}

function drawFortune() {
  const parts = getJstParts();
  const dateKey = formatDateKey(parts);

  if (dateKey !== activeDateKey) {
    syncDailyState(parts);
  }

  openResultModal();
  showLoadingState();
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const delay = reduceMotion ? 100 : DRAW_DELAY_MS;

  drawTimer = window.setTimeout(() => {
    if (!currentResult) {
      currentResult = createDailyResult(dateKey, isBirthday(parts));
    }
    showResult(currentResult);
    drawTimer = null;
  }, delay);
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load ${source}`));
    image.src = source;
  });
}

function parseObjectPosition(position) {
  const values = position.split(/\s+/).map((value) => parseFloat(value) / 100);
  return {
    x: Number.isFinite(values[0]) ? values[0] : 0.5,
    y: Number.isFinite(values[1]) ? values[1] : 0.5,
  };
}

function drawImageCover(context, image, x, y, width, height, position) {
  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight,
  );
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const focalPoint = parseObjectPosition(position);
  const sourceX = Math.min(
    image.naturalWidth - sourceWidth,
    Math.max(0, image.naturalWidth * focalPoint.x - sourceWidth / 2),
  );
  const sourceY = Math.min(
    image.naturalHeight - sourceHeight,
    Math.max(0, image.naturalHeight * focalPoint.y - sourceHeight / 2),
  );

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
}

function wrapText(context, text, maxWidth) {
  const characters = [...text];
  const lines = [];
  let currentLine = "";

  characters.forEach((character) => {
    const nextLine = currentLine + character;
    if (currentLine && context.measureText(nextLine).width > maxWidth) {
      lines.push(currentLine);
      currentLine = character;
    } else {
      currentLine = nextLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

async function buildResultCard(result, imageSource = result.image.src) {
  const image = await loadImage(imageSource);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1200;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is unavailable.");
  }

  const gradient = context.createLinearGradient(0, 800, 1200, 1200);
  gradient.addColorStop(0, "#fff0f5");
  gradient.addColorStop(1, "#fff8dd");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1200, 1200);
  drawImageCover(context, image, 0, 0, 1200, 800, result.image.position);

  context.textAlign = "center";
  context.fillStyle = "#d63384";
  context.font =
    '800 82px "Segoe UI", "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  context.fillText(result.fortune.level, 600, 920);

  context.fillStyle = "#554750";
  context.font =
    '600 34px "Segoe UI", "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  const messageLines = wrapText(context, result.fortune.message, 1040).slice(
    0,
    3,
  );
  messageLines.forEach((line, index) => {
    context.fillText(line, 600, 990 + index * 48);
  });

  context.fillStyle = "#8a7783";
  context.font =
    '600 25px "Segoe UI", "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  context.fillText("maria.nycu.cc ・ 每日一毬", 600, 1162);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Unable to encode result card."));
      }
    }, "image/png");
  });
}

function loadBundledImageSource(image) {
  const existingSource = window.__omikujiCardImages?.[image.id];
  if (existingSource) {
    return Promise.resolve(existingSource);
  }

  if (!image.dataScript) {
    return Promise.reject(new Error("Bundled image data is unavailable."));
  }

  if (bundledImagePromises.has(image.id)) {
    return bundledImagePromises.get(image.id);
  }

  const imagePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = image.dataScript;
    script.async = true;
    script.addEventListener("load", () => {
      const source = window.__omikujiCardImages?.[image.id];
      if (source) {
        resolve(source);
      } else {
        reject(new Error("Bundled image data did not register."));
      }
    });
    script.addEventListener("error", () => {
      reject(new Error(`Unable to load ${image.dataScript}`));
    });
    document.head.appendChild(script);
  });

  bundledImagePromises.set(image.id, imagePromise);
  return imagePromise;
}

async function prepareResultCardBlob(result) {
  try {
    const imageSource =
      window.location.protocol === "file:"
        ? await loadBundledImageSource(result.image)
        : result.image.src;
    return await buildResultCard(result, imageSource);
  } catch (error) {
    if (!result.image.dataScript) {
      throw error;
    }

    console.warn("Regular image loading failed; using bundled card data.", error);
    const imageSource = await loadBundledImageSource(result.image);
    return buildResultCard(result, imageSource);
  }
}

function resultFilename() {
  return `maria-omikuji-${currentResult?.dateKey ?? activeDateKey}.png`;
}

function resultShareText() {
  if (!currentResult) {
    return "";
  }

  return `今天的每日一毬：${currentResult.fortune.level}\n${currentResult.fortune.message}`;
}

async function copyResultText() {
  const publicUrl = ["http:", "https:"].includes(window.location.protocol)
    ? `\n${window.location.href}`
    : "";
  const text = `${resultShareText()}${publicUrl}`;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      console.warn("Modern clipboard access is unavailable.", error);
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();

  if (!copied) {
    throw new Error("Copy is unavailable.");
  }
}

async function shareResult() {
  if (!currentResult) {
    return;
  }

  elements.actionStatus.textContent = "正在開啟分享…";

  try {
    const blob = await resultCardBlobPromise;
    const shareData = {
      title: `每日一毬・${currentResult.fortune.level}`,
      text: resultShareText(),
    };
    if (["http:", "https:"].includes(window.location.protocol)) {
      shareData.url = window.location.href;
    }

    if (blob && typeof File !== "undefined") {
      const file = new File([blob], resultFilename(), { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          files: [file],
        });
        elements.actionStatus.textContent = "分享完成！";
        return;
      }
    }

    if (navigator.share) {
      await navigator.share(shareData);
      elements.actionStatus.textContent = "分享完成！";
      return;
    }

    await copyResultText();
    elements.actionStatus.textContent = "結果文字與網址已複製。";
  } catch (error) {
    if (error?.name === "AbortError") {
      elements.actionStatus.textContent = "";
      return;
    }

    console.warn("Unable to share result.", error);
    try {
      await copyResultText();
      elements.actionStatus.textContent = "結果文字與網址已複製。";
    } catch (copyError) {
      console.warn("Unable to copy result.", copyError);
      elements.actionStatus.textContent = "分享失敗，請稍後再試。";
    }
  }
}

async function downloadResult() {
  if (!currentResult) {
    return;
  }

  elements.actionStatus.textContent = "正在下載結果卡…";

  try {
    const blob = await resultCardBlobPromise;
    if (!blob) {
      throw new Error("Result card is unavailable.");
    }

    const link = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.download = resultFilename();
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    elements.actionStatus.textContent = "結果卡已下載。";
  } catch (error) {
    console.warn("Unable to download result card.", error);
    elements.actionStatus.textContent = "下載失敗，請稍後再試。";
  }
}

function setupStandee(standeeId, placeholderId) {
  const standee = document.getElementById(standeeId);
  const placeholder = document.getElementById(placeholderId);

  standee.addEventListener("error", () => {
    standee.hidden = true;
    placeholder.hidden = false;
  });

  standee.addEventListener("click", () => {
    standee.getAnimations().forEach((animation) => {
      animation.cancel();
      animation.play();
    });
  });
}

elements.resultImage.addEventListener("load", () => {
  elements.resultImage.hidden = false;
  elements.imageError.hidden = true;
});

elements.resultImage.addEventListener("error", () => {
  elements.resultImage.hidden = true;
  elements.imageError.hidden = false;
});

elements.drawButton.addEventListener("click", drawFortune);
elements.closeModal.addEventListener("click", closeResultModal);
elements.shareButton.addEventListener("click", shareResult);
elements.downloadButton.addEventListener("click", downloadResult);

elements.modal.addEventListener("click", (event) => {
  if (event.target === elements.modal) {
    closeResultModal();
  }
});

elements.modal.addEventListener("cancel", () => {
  if (drawTimer) {
    window.clearTimeout(drawTimer);
    drawTimer = null;
  }
  elements.drawButton.disabled = false;
});

setupStandee("standeeLeft", "placeholderLeft");
setupStandee("standeeRight", "placeholderRight");

updateCountdown();
window.setInterval(updateCountdown, 1000);
