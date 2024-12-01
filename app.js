
String.prototype.replaceAt = function (index, replacement) {
  return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

const apiUrls = {
  "4": "json/4harf.json",
  "5": "json/5harf.json",
  "6": "json/6harf.json",
  "7": "json/7harf.json",
  "4tdk": "json/4tdk.json",
  "5tdk": "json/5tdk.json",
  "6tdk": "json/6tdk.json",
  "7tdk": "json/7tdk.json"
};
let wordList = [];
let targetWord = "";
let attemptsLeftConfig = 5;
let attemptsLeft = attemptsLeftConfig;
let wordLength = 0;
let currentAttempt = 0;
let matchedWord = "";
let userInput = null;
function trimCaret(str) {
  const map =
  {
    "Â": "A",
    "â": "a",
    "Ĉ": "C",
    "ĉ": "c",
    "Ê": "E",
    "ê": "e",
    "Ĝ": "G",
    "ĝ": "g",
    "Ĥ": "H",
    "ĥ": "h",
    "Î": "İ",
    "î": "i",
    "Ĵ": "J",
    "ĵ": "j",
    "Ô": "O",
    "ô": "o",
    "Ŝ": "S",
    "ŝ": "s",
    "Û": "U",
    "û": "u",
    "Ŷ": "Y",
    "ŷ": "y",
    "Ẑ": "Z",
    "ẑ": "z"
  }
  for (const m in map) {
    str = str.replace(new RegExp(m, 'g'), map[m]);
  }
  return str;
}

let countDownConfig = 10;
let countDown = countDownConfig;
let countDownInterval = null;

function setConfigValues() {
  const cfg = "Tahmin süresi (sn), Hak sayısı şeklinde aralarında virgül olacak şekilde ve bu sırayla değerleri giriniz.\nMevcut değerler: " + countDownConfig + "," + attemptsLeftConfig;
  const ncfg = prompt(cfg);
  const ncfga = ncfg.split(",");
  if (ncfga.length != 2) {
    alert("Uyumsuz veri girdiğinizden güncelleme yapılamadı");
    return;
  }
  countDownConfig = +ncfga[0];
  attemptsLeftConfig = +ncfga[1];
  localStorage.setItem("configValues", JSON.stringify({ countDown: countDownConfig, attemptsLeft: attemptsLeftConfig }))
  alert("Güncelleme yapıldı. \nTahmin süresi " + countDownConfig + " saniye. \nHak sayısı " + attemptsLeftConfig + " olarak ayarlandı");
}
async function startGame(length) {

  userInput = document.getElementById("user-input");
  userInput.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
      submitGuess();
    }
  });
  attemptsLeft = attemptsLeftConfig;
  currentAttempt = 0;
  // Kelimeyi API'den al
  const response = await fetch(apiUrls[length]);
  wordList = await response.json();
  do {
    targetWord = trimCaret(wordList[Math.floor(Math.random() * wordList.length)].kelime).toLocaleLowerCase("tr-TR");
  } while (targetWord.includes(" "));

  wordLength = targetWord.length;
  matchedWord = new Array(wordLength + 1).join(".");

  document.getElementById("stage-selection").style.display = "none";
  document.getElementById("game").style.display = "block";

  setupGame();
}
function toggleHint() {
  if (event.target.innerHTML == "?")
    event.target.innerHTML = targetWord;
  else
    event.target.innerHTML = "?";
}

function setupGame() {
  showTimer();
  const firstLetter = targetWord[0];
  matchedWord = matchedWord.replaceAt(0, firstLetter);
  userInput.maxLength = targetWord.length;
  const inputsDiv = document.getElementById("inputs");
  inputsDiv.innerHTML = "";

  for (let attempt = 0; attempt < attemptsLeft; attempt++) {
    const row = document.createElement("div");
    row.classList.add("attempt-row");

    for (let i = 0; i < wordLength; i++) {
      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 1;
      input.classList.add("letter-input");
      input.classList.add("letter-input-order-" + i);
      input.attributes["order"] = i;
      // input.addEventListener("input", function (event) {
      //   if (event.target.value) {  // Eğer kullanıcı bir harf girdiyse
      //     focusNextInput();  // Bir sonraki input'a odaklan
      //   }
      // });

      // input.addEventListener("keyup", function (event) {
      //   if (event.keyCode === 8) {
      //     focusInput(event.target.attributes["order"] - 1);
      //   }
      //   else if (event.keyCode === 13) {
      //     submitGuess();
      //   }
      // });

      // // İlk harf sabit, diğerleri kilitli
      // if (attempt === 0 && i === 0) {
      //   input.value = firstLetter;
      //   input.classList.add("correct");
      //   input.readOnly = true;
      // } else if (attempt !== 0) {
      //   input.readOnly = true;
      // }
      input.readOnly = true;
      input.disabled = true;
      if (attempt === 0) {
        input.value = matchedWord[i];
        if (matchedWord[i] === targetWord[i]) {
          input.classList.add("correct");
        }
      }

      row.appendChild(input);
    }
    inputsDiv.appendChild(row);
  }
  countDownInterval = setInterval(function () {
    countDown--;
    showTimer();
    if (countDown == 0) {
      clearInterval(countDownInterval);
      const rows = document.querySelectorAll(".attempt-row");
      const currentRow = rows[currentAttempt];
      currentRow.querySelectorAll("input").forEach(input => input.classList.add("gameover"));
      getWordDescription().then(x => {
        showModal(`<p>Belirlenen süre içerisinde tahminde bulunmadığınızdan oyunu kaybettiniz!<br/>Doğru kelime: ${targetWord}<p><br/>${x}`);
      });
      return;
    }
  }, 1000);
  focusNextInput();
}

function showTimer() {
  document.getElementById("timer").textContent = "KALAN SÜRE: " + countDown;
}

function focusNextInput() {
  userInput.focus();
  return;
  const activeRow = document.querySelectorAll(".attempt-row")[currentAttempt];  // Aktif satır
  if (!activeRow)
    return;
  const inputs = activeRow.querySelectorAll(".letter-input");  // Satırdaki inputları al

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    if (!input.readOnly && !input.value) {  // Eğer input boşsa ve readonly değilse
      input.focus();  // Odaklan
      break;  // İlk boş input'a odaklanınca döngüyü kırıyoruz
    }
  }
}


function focusInput(order) {
  if (order < 1)
    return;
  const activeRow = document.querySelectorAll(".attempt-row")[currentAttempt];  // Aktif satır
  if (!activeRow)
    return;
  const input = activeRow.querySelector(".letter-input-order-" + order);
  input.focus();
}

function showModal(message) {
  const modal = document.getElementById("success-modal");
  const modalMessage = document.getElementById("modal-message");
  modalMessage.innerHTML = message;
  modal.style.display = "block";

  // Yeni Oyun butonu işlevi
  const newGameButton = document.getElementById("new-game-button");
  newGameButton.addEventListener("click", function () {
    location.reload(); // Sayfayı yeniden yükle
  });
}

async function getWordDescription() {
  try {
    // API'den veriyi al
    const response = await fetch(`https://sozluk.gov.tr/gts?ara=${encodeURI(targetWord)}`);
    const data = await response.json();
    const wordData = data[0]; // İlk sonuç üzerinde çalışıyoruz.

    // Kelimenin kendisi
    const wordTitle = `<h2>${wordData.madde || "Kelime bulunamadı"}</h2>`;

    // Anlamlar listesini işleme
    const meaningsList = wordData.anlamlarListe.map((anlam) => {
      // Anlamı varsa kullan, yoksa alternatif bir açıklama yaz
      const meaningText = anlam.anlam || "Anlam bulunamadı.";
      const examplesList = anlam.orneklerListe
        ? `
        <h4>Örnekler</h4>
        <ul>
          ${anlam.orneklerListe.map((example) => `<li>${example.ornek}</li>`).join("")}
        </ul>
        `
        : ""; // Eğer örnekler yoksa boş bırak

      return `
      <li>
        ${meaningText}
        ${examplesList}
      </li>
      `;
    });

    // Anlamları ve örnekleri birleştir
    return `
    ${wordTitle}
    <ul>
      ${meaningsList.join("")}
    </ul>
    `;
  } catch (error) {
    // Hata durumunda alternatif mesaj
    return "<strong>Kelime bilgisi çekilemedi!</strong>";
  }
}

function submitGuess() {
  let guess = userInput.value.trim().toLocaleLowerCase("tr-TR");
  userInput.value = "";
  if (guess.length !== wordLength) {
    alert("Lütfen tüm harfleri doldurun!");
    return;
  }

  const rows = document.querySelectorAll(".attempt-row");
  const currentRow = rows[currentAttempt];
  const inputs = currentRow.querySelectorAll(".letter-input");


  inputs.forEach((input, i) => input.value = guess[i]);

  if (wordList.filter(x => trimCaret(x.kelime).toLocaleLowerCase("tr-TR") == guess.toLocaleLowerCase("tr-TR")).length === 0) {
    clearInterval(countDownInterval);
    currentRow.querySelectorAll("input").forEach(input => input.classList.add("gameover"));
    getWordDescription().then(x => {
      showModal(`<p>Sözlükte olmayan kelime kullandığınızdan elendiniz! Doğru kelime: ${targetWord}<p><br/>${x}`);
    });
    return;
  }

  const feedback = [];
  const usedIndexes = new Set();
  const targetLetterCount = {}; // Count occurrences of each letter in the target word

  // Count occurrences of each letter in targetWord
  for (let i = 0; i < targetWord.length; i++) {
    targetLetterCount[targetWord[i]] = (targetLetterCount[targetWord[i]] || 0) + 1;
  }

  // First pass: Check for green matches
  for (let i = 0; i < wordLength; i++) {
    const input = inputs[i];
    const letter = guess[i];
    if (letter === targetWord[i]) {
      input.classList.add("correct");
      matchedWord = matchedWord.replaceAt(i, letter);
      usedIndexes.add(i);
      targetLetterCount[letter]--; // Reduce the count of that letter
    }
  }

  // Second pass: Check for yellow matches (with validation to ensure only one yellow per letter)
  for (let i = 0; i < wordLength; i++) {
    const input = inputs[i];
    const letter = guess[i];
    if (letter !== targetWord[i] && targetWord.includes(letter) && !usedIndexes.has(i) && targetLetterCount[letter] > 0) {
      input.classList.add("partial");
      targetLetterCount[letter]--; // Reduce count to prevent reusing this letter
    } else if (letter !== targetWord[i]) {
      input.classList.add("wrong");
    }
  }

  //currentRow.querySelectorAll("input").forEach(input => input.readOnly = true);

  if (guess === targetWord) {
    clearInterval(countDownInterval);
    getWordDescription().then(x => {
      showModal("<p>Tebrikler! Doğru kelimeyi buldunuz.</p><br/>" + x);
    });
    return;
  }

  attemptsLeft--;

  if (attemptsLeft === 0) {
    clearInterval(countDownInterval);
    getWordDescription().then(x => {
      showModal(`<p>Maalesef bilemediniz! Doğru kelime: ${targetWord}</p><br/>${x}`);
    });
    return;
  }

  currentAttempt++;
  const nextRow = rows[currentAttempt];
  nextRow.querySelectorAll("input").forEach((input, i) => {
    input.value = matchedWord[i];
    if (matchedWord[i] === targetWord[i]) {
      input.classList.add("correct");
    }
  });
  countDown = countDownConfig;
  focusNextInput();
}

document.addEventListener("DOMContentLoaded", function () {
  const cfg = localStorage.getItem("configValues");
  if (cfg) {
    const pcfg = JSON.parse(cfg);
    attemptsLeftConfig = pcfg.attemptsLeft;
    countDownConfig = pcfg.countDown;
  }
});