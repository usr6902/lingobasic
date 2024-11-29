const apiUrls = {
  4: "https://nedirara.com/api/v2/json/4harf",
  5: "https://nedirara.com/api/v2/json/5harf",
  6: "https://nedirara.com/api/v2/json/6harf",
  7: "https://nedirara.com/api/v2/json/7harf",
};

let targetWord = "";
let attemptsLeft = 5;
let wordLength = 0;
let currentAttempt = 0;

async function startGame(length) {
  wordLength = length;
  attemptsLeft = 5;
  currentAttempt = 0;

  // Kelimeyi API'den al
  const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(apiUrls[length])}`);
  const data = await response.json();
  const wordList = JSON.parse(data.contents);
  targetWord = wordList[Math.floor(Math.random() * wordList.length)].kelime.toLowerCase();

  document.getElementById("stage-selection").style.display = "none";
  document.getElementById("game").style.display = "block";

  setupGame();
}

function setupGame() {
  const firstLetter = targetWord[0];
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
      input.classList.add("letter-input-order-"+i);
      input.attributes["order"]=i;
	  input.addEventListener("input", function(event) {
		if (event.target.value) {  // Eğer kullanıcı bir harf girdiyse
			focusNextInput();  // Bir sonraki input'a odaklan
		}
    });
	
	 input.addEventListener("keyup", function(event) {
		if(event.keyCode === 8)
		{
			focusInput(event.target.attributes["order"]-1);
		}
		else if(event.keyCode === 13)
		{
			submitGuess();
		}
    });

      // İlk harf sabit, diğerleri kilitli
      if (attempt === 0 && i === 0) {
        input.value = firstLetter;
		input.classList.add("correct");
        input.readOnly = true;
      } else if (attempt !== 0) {
        input.readOnly = true;
      }

      row.appendChild(input);
    }
    inputsDiv.appendChild(row);
  }

  focusNextInput();
}


document.addEventListener("DOMContentLoaded", function() {
  // Başlangıçta ilk inputa odaklanma
  focusNextInput();
});

function focusNextInput() {
  const activeRow = document.querySelectorAll(".attempt-row")[currentAttempt];  // Aktif satır
  if(!activeRow)
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
	if(order<1)
		return;
  const activeRow = document.querySelectorAll(".attempt-row")[currentAttempt];  // Aktif satır
  if(!activeRow)
	  return;
  const input = activeRow.querySelector(".letter-input-order-"+order);  
input.focus(); 
}


function submitGuess() {
  const rows = document.querySelectorAll(".attempt-row");
  const currentRow = rows[currentAttempt];
  const inputs = currentRow.querySelectorAll(".letter-input");

  let guess = "";
  inputs.forEach(input => guess += input.value.toLowerCase());

  if (guess.length !== wordLength) {
    alert("Lütfen tüm harfleri doldurun!");
    return;
  }

  const feedback = [];
  const usedIndexes = new Set();

  for (let i = 0; i < wordLength; i++) {
    const input = inputs[i];
    const letter = guess[i];
    if (letter === targetWord[i]) {
      input.classList.add("correct");
      usedIndexes.add(i);
    } else if (targetWord.includes(letter)) {
      input.classList.add("partial");
    } else {
      input.classList.add("wrong");
    }
  }

  currentRow.querySelectorAll("input").forEach(input => input.readOnly = true);

  if (guess === targetWord) {
    alert("Tebrikler! Doğru kelimeyi buldunuz.");
    location.reload();
    return;
  }

  attemptsLeft--;

  if (attemptsLeft === 0) {
    alert(`Oyun bitti! Doğru kelime: ${targetWord}`);
    location.reload();
    return;
  }

  currentAttempt++;
  const nextRow = rows[currentAttempt];
  nextRow.querySelectorAll("input").forEach((input,i) => {
	  if (i === 0) {
        input.value = targetWord[0];
		input.classList.add("correct");
        input.readOnly = true;
      }
	  else
		input.readOnly = false
	  
	});
  focusNextInput();  // Bir sonraki input'a odaklanma
}

