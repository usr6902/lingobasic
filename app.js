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

let targetWord = "";
let attemptsLeft = 5;
let wordLength = 0;
let currentAttempt = 0;

function trimCaret(str)
{
	const map=
	{
		"Â":"A",
		"â":"a",
		"Ĉ":"C",
		"ĉ":"c",
		"Ê":"E",
		"ê":"e",
		"Ĝ":"G",
		"ĝ":"g",
		"Ĥ":"H",
		"ĥ":"h",
		"Î":"İ",
		"î":"i",
		"Ĵ":"J",
		"ĵ":"j",
		"Ô":"O",
		"ô":"o",
		"Ŝ":"S",
		"ŝ":"s",
		"Û":"U",
		"û":"u",
		"Ŷ":"Y",
		"ŷ":"y",
		"Ẑ":"Z",
		"ẑ":"z"
	}
	for (const m in map) {
    		str = str.replace(new RegExp(m, 'g'), map[m]);
  	}
	return str;
}

async function startGame(length) {
  
  attemptsLeft = 5;
  currentAttempt = 0;

  // Kelimeyi API'den al
  const response = await fetch(apiUrls[length]);
  const wordList = await response.json();
do {
    targetWord = trimCaret(wordList[Math.floor(Math.random() * wordList.length)].kelime).toLocaleLowerCase("tr-TR");
} while (targetWord.includes(" "))
  wordLength = targetWord.length;

  document.getElementById("stage-selection").style.display = "none";
  document.getElementById("game").style.display = "block";

  setupGame();
}
function toggleHint()
{
	if(event.target.innerHTML=="?")
		event.target.innerHTML = targetWord;
	else
		event.target.innerHTML = "?";
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
  inputs.forEach(input => guess += input.value.toLocaleLowerCase("tr-TR"));

  if (guess.length !== wordLength) {
    alert("Lütfen tüm harfleri doldurun!");
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

  currentRow.querySelectorAll("input").forEach(input => input.readOnly = true);

  if (guess === targetWord) {
    setTimeout(() => {
	    alert("Tebrikler! Doğru kelimeyi buldunuz.");
    	    location.reload();
    }, 100);
    return;
  }

  attemptsLeft--;

  if (attemptsLeft === 0) {
	  
  currentRow.querySelectorAll("input").forEach(input => input.classList.add("gameover"));
     setTimeout(() => {
	     	alert(`Maalesef bilemediniz! Doğru kelime: ${targetWord}`);
		location.reload();
	}, 100);
    return;
  }

  currentAttempt++;
  const nextRow = rows[currentAttempt];
  nextRow.querySelectorAll("input").forEach((input, i) => {
    if (i === 0) {
      input.value = targetWord[0];
      input.classList.add("correct");
      input.readOnly = true;
    } else {
      input.readOnly = false;
    }
  });
  focusNextInput();
}
function submitGuessOld() {
  const rows = document.querySelectorAll(".attempt-row");
  const currentRow = rows[currentAttempt];
  const inputs = currentRow.querySelectorAll(".letter-input");

  let guess = "";
  inputs.forEach(input => guess += input.value.toLocaleLowerCase("tr-TR"));

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

