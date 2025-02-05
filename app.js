function getConfigValues() {
  const cfg = JSON.parse(localStorage.getItem("configValues") ?? null);
  return {
    attemptsLeft: cfg?.attemptsLeft ?? 5,
    countDown: cfg?.countDown ?? 15,
    onlyFav: cfg ? !!cfg.onlyFav : false,
    checkDictionary: cfg ? !!cfg.checkDictionary : true,
    startupUrl: cfg?.startupUrl ?? ""
  }
}

if(getConfigValues().startupUrl)
  location.href = getConfigValues().startupUrl;

String.prototype.replaceAt = function (index, replacement) {
  return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

const dictionaryUrls = {
  "4": "json/4harf.json",
  "5": "json/5harf.json",
  "6": "json/6harf.json",
  "7": "json/7harf.json",
  "4tdk": "json/4tdk.json",
  "5tdk": "json/5tdk.json",
  "6tdk": "json/6tdk.json",
  "7tdk": "json/7tdk.json",
  "4tdkfu": "json/4tdk.json",
  "5tdkfu": "json/5tdk.json",
  "6tdkfu": "json/6tdk.json",
  "7tdkfu": "json/7tdk.json"
};


let configuration={
  countDown: 15,
  attemptsLeft:5,
  checkDictionary:true,
  onlyFav: false
}

let wordList = [];
let dictionary = [];
let targetWord = "";
let attemptsLeft = configuration.attemptsLeft;
let wordLength = 0;
let currentAttempt = 0;
let matchedWord = "";
let userInput = null;
let correctGuesses = [];
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

let countDown = configuration.countDown;
let countDownInterval = null;

function showSettingsModal() {
  const cfg = getConfigValues();
  document.getElementById("countDownInput").value = cfg.countDown;
  document.getElementById("attemptInput").value = cfg.attemptsLeft;
  document.getElementById("dictionaryCheckInput").checked = cfg.checkDictionary;
  document.getElementById("onlyFavInput").checked = cfg.onlyFav;
  document.getElementById("startupUrl").value = cfg.startupUrl || "";

  document.getElementById("stage-selection").style.display = "none";
  document.getElementById("settings").style.display = "block";
  document.getElementById("game").style.display = "none";
  document.getElementById("header").style.display="flex";
}

let exp=0;
function showExperimentalFields()
{
  if(++exp>=10)
  {
    document.querySelectorAll(".experimental").forEach(x=>x.classList.remove("hidden"))
  }
}

function saveSettings(){
  setConfigValues();
  document.getElementById("stage-selection").style.display = "";
  document.getElementById("settings").style.display = "none";
  document.getElementById("game").style.display = "none";
  document.getElementById("header").style.display="flex";
}
function setConfigValues() {
  const cfg = {
    countDown: document.getElementById("countDownInput").value,
    attemptsLeft: document.getElementById("attemptInput").value,
    checkDictionary: document.getElementById("dictionaryCheckInput").checked,
    onlyFav: document.getElementById("onlyFavInput").checked,
    startupUrl: document.getElementById("startupUrl").value
  }
  configuration = cfg;
  localStorage.setItem("configValues", JSON.stringify(cfg));
  showNotification("Güncelleme yapıldı", "success", 500);
}


const getWords = async (key) => {
  const data = JSON.parse(localStorage.getItem("source_"+key)) || [];
  if(data.length)
    return data;
  const res = (await loadSourceData(key)).map(k=>{return {kelime:trimCaret(k.kelime).toLocaleLowerCase("tr-TR")};});
  setWords(key, res);
  return res;
}
const setWords = (key, data) => localStorage.setItem("source_"+key, JSON.stringify(data));

const loadSourceData = async (source) => {           
                try {
                    const response = await fetch("json/"+source+".json");
                    const data = await response.json();
                    return data;
                } catch (error) {
                    console.error("Kaynak verileri yüklenemedi:", error);
                  return [];
                }
        };

async function startGame(key) {
  localStorage.setItem("lastChoice", key);
  localStorage.setItem("reloadGame", "0");
  configuration = getConfigValues();
  attemptsLeft = configuration.attemptsLeft;
  countDown = configuration.countDown;

  userInput = document.getElementById("user-input");
  userInput.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
      submitGuess();
    }
  });
  currentAttempt = 0;
  // Kelimeyi API'den al
  const dictResponse = await fetch(dictionaryUrls[key]);
  wordList = await getWords(key);
  dictionary = await dictResponse.json();
  let fx = 0;

  let filteredWords = [];
  do {
    filteredWords = wordList.filter(f=> +localStorage.getItem("frekans_"+f.kelime) == fx && !f.kelime.includes(" "));
    fx++;
  } while(filteredWords.length == 0)
  
  
  targetWord = filteredWords[Math.floor(Math.random() * filteredWords.length)].kelime;
  let lsv = +localStorage.getItem("frekans_"+targetWord);
  localStorage.setItem("frekans_"+targetWord, ++lsv);
  wordLength = targetWord.length;
  matchedWord = new Array(wordLength + 1).join(".");

  document.getElementById("stage-selection").style.display = "none";
  document.getElementById("settings").style.display = "none";
  document.getElementById("game").style.display = "block";
  document.getElementById("header").style.display="none";

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

  // Tüm doğru tahminleri tutacak dizi
  correctGuesses = new Array(wordLength).fill(null);
  correctGuesses[0] = firstLetter; // İlk harfi ekle

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
        showModal("Belirlenen süre içerisinde tahminde bulunmadığınızdan oyunu kaybettiniz!", false, x);
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

function showModal(message, isSuccess, body) {
  const modal = document.getElementById("success-modal");
  const modalMessage = document.getElementById("modal-message");
  modalMessage.innerHTML = `
  <div class="word-solved-message bg-msg-${isSuccess?"success":"fail"}">${message}</div>
  <div class="word-solved-message"><p>${targetWord.toLocaleUpperCase("tr-TR")}</p>Bu kelimeyi <strong id="solved-count">${localStorage.getItem("frekans_"+targetWord)}</strong>. defa çözdünüz!</div>
  ${body}
  `
  modal.style.display = "block";

  // Yeni Oyun butonu işlevi
  const newGameButton = document.getElementById("new-game-button");
  newGameButton.addEventListener("click", function () {
    localStorage.setItem("reloadGame","1");
    location.reload(); // Sayfayı yeniden yükle
  });  
  
  const homeButton = document.getElementById("goto-home-button");
  homeButton.addEventListener("click", function () {
    localStorage.setItem("reloadGame","0");
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
    const wordTitle = `<h2 class="cblack">${wordData.madde.toLocaleUpperCase("tr") || "Kelime bulunamadı"}</h2>`;

    // Anlamlar listesini işleme
    const meaningsList = wordData.anlamlarListe.map((anlam) => {
      // Anlamı varsa kullan, yoksa alternatif bir açıklama yaz
      const meaningText = anlam.anlam || "Anlam bulunamadı.";
      const examplesList = anlam.orneklerListe
        ? `
        <h4 class="cblack">Örnekler</h4>
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

function showNotification(message, type = 'success', duration=3000) {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notification-message');
    
    notification.className = 'notification ' + type;
    messageElement.textContent = message;
    notification.classList.remove('hidden');

    setTimeout(() => {
        notification.classList.add('hidden');
    }, duration);
}

function submitGuess() {
    let guess = userInput.value.trim().toLocaleLowerCase("tr-TR");
    userInput.value = "";
    if (guess.length !== wordLength) {
        showNotification("Lütfen tüm harfleri doldurun!", "error", 800);
        return;
    }

    const rows = document.querySelectorAll(".attempt-row");
    const currentRow = rows[currentAttempt];
    const inputs = currentRow.querySelectorAll(".letter-input");

    // Mevcut satırı doldur
    inputs.forEach((input, i) => input.value = guess[i].toLocaleUpperCase("tr-TR"));

    if (configuration.checkDictionary && dictionary.filter(x => trimCaret(x.kelime).toLocaleLowerCase("tr-TR") == guess.toLocaleLowerCase("tr-TR")).length === 0) {
        clearInterval(countDownInterval);
        currentRow.querySelectorAll("input").forEach(input => input.classList.add("gameover"));
        getWordDescription().then(x => {
            showModal("Sözlükte olmayan kelime kullandığınızdan elendiniz!", false, x);
        });
        return;
    }

    if (guess.toLocaleLowerCase("tr-TR")[0] != targetWord.toLocaleLowerCase("tr-TR")[0]) {
        clearInterval(countDownInterval);
        currentRow.querySelectorAll("input").forEach(input => input.classList.add("gameover"));
        getWordDescription().then(x => {
            showModal("Yasak harfle başladığınızdan elendiniz!", false, x);
        });
        return;
    }

    // Hedef kelimedeki harf sayılarını tut
    const targetLetterCount = {};
    for (let letter of targetWord) {
        targetLetterCount[letter] = (targetLetterCount[letter] || 0) + 1;
    }

    // Önce doğru pozisyondaki harfleri kontrol et
    const matchedPositions = new Set();
    inputs.forEach((input, i) => {
        if (guess[i] === targetWord[i]) {
            input.classList.add("correct");
            correctGuesses[i] = guess[i]; // Doğru tahmini kaydet
            targetLetterCount[guess[i]]--;
            matchedPositions.add(i);
        }
    });

    // Sonra yanlış pozisyondaki harfleri kontrol et
    inputs.forEach((input, i) => {
        if (!matchedPositions.has(i)) {
            const letter = guess[i];
            if (targetLetterCount[letter] > 0) {
                input.classList.add("present");
                targetLetterCount[letter]--;
            } else {
                input.classList.add("wrong");
            }
        }
    });

    if (guess === targetWord) {
        clearInterval(countDownInterval);
        getWordDescription().then(x => {
            showModal("Tebrikler, doğru kelimeyi buldunuz.", true, x);
        });
        return;
    }

    currentAttempt++;
    if (currentAttempt >= attemptsLeft) {
        clearInterval(countDownInterval);
        getWordDescription().then(x => {
            showModal("Maalesef bilemediniz!", false, x);
        });
        return;
    }

    // Bir sonraki satıra tüm doğru harfleri otomatik doldur
    if (currentAttempt < rows.length) {
        const nextRow = rows[currentAttempt];
        const nextInputs = nextRow.querySelectorAll(".letter-input");
        correctGuesses.forEach((letter, index) => {
            if (letter !== null) {
                nextInputs[index].value = letter.toLocaleUpperCase("tr-TR");
                nextInputs[index].classList.add("correct"); // Doğru harfleri yeşil yap
            }
        });
    }

    countDown = configuration.countDown;
    focusNextInput();
}

if(localStorage.getItem("reloadGame")==="1")
{
    startGame(localStorage.getItem("lastChoice"));
}