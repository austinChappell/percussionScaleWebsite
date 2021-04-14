/* --- Global Variables --- */

let notesSelected = []; // array of notes the user has inputed for a question
let scalesList = []; //array of all scales to be included on user session
let practiceCount = 0; //keeps track of which scale the user is on during practice mode
let currentScale = ''; //stores the value of the current scale being asked by computer
let currentScaleInNum = []; //array of the current scale questions in numbers
let answersCorrect = 0; //number of user correct answers
let questionsAsked = 0; //number of questions asked
let quizMode = false; //determines whether program is in quizMode or practiceMode
let secondOctaveCScale = ['13', '15', '17', '18', '20', '22', '24', '25']; //provides answer for 2nd c scale octave
let answerSubmitted = false; //keeps track whether an answer has been submitted by the user or not
let scalesMissed = []; //stores the scales the user has answered incorrectly
let gameMode = false; //used for game mode
let gameOver = false; //used to stop stop watch
let timeToComplete = 0; //used for time to complete game mode

/* --- Mode Buttons --- */
$('.mode-button').click(function (e) {
  $('.mode-description').addClass('invisible');
  $(`#${e.target.value}-mode-description`).removeClass('invisible');
})

$('#practice-start-btn').click(function () {
  hideItemShowItem('.intro', '.select-scale-menu');
})

$('#quiz-start-btn').click(function () {
  quizMode = true;
  hideItemShowItem('.intro', '.select-scale-menu');
})

$('#game-start-btn').click(function () {
  gameMode = true;
  hideItemShowItem('.intro', '.game-mode-item');
  $('#timer-text').html('Time: ');
  scalesList = orderQuizScales(['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']);
  setupQuestion();
  stopWatch(0);
})

//Closes mode menus when you click outside of them
$('#app-body').click(function (e) {
  if (e.target.type !== 'button') {
    $('.mode-description').addClass('invisible');
  }
})

/*--- handles display for button clicks ---*/
function hideItemShowItem(hiddenItem, shownItem) {
  $(hiddenItem).addClass('invisible');
  $(shownItem).removeClass('invisible');
}

/* --- General Click Functions for Select-scale-menu & Keyboard ---*/
function clickFunction(name, array) {
  $(name).click(function (e) {
    let element = e.target;
    let note = element.getAttribute('value');

    if (array.includes(note)) {
      removeNote(array, note);
      element.classList.remove('gold');
    } else {
      element.classList.add('gold');
      array.push(note);
    }
  })
}

function removeNote(array, value) {
  let index = array.indexOf(value);
  return array.splice(index, 1);
}

/* --- Select-scale-menu --- */
clickFunction('.scale-letter', scalesList);

$('#begin-btn').click(function () {
  if (scalesList.length === 0) scalesList = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  if (quizMode) {
    hideItemShowItem('.select-scale-menu', '.quiz-mode-item');
    scalesList = orderQuizScales(scalesList);
    timer(1000);
  } else {
    hideItemShowItem('.select-scale-menu', '.practice-mode-item');
  }
  setupQuestion();
});



/* --- EndSession, Submit, and Continue Buttons --- */
$('.end-session-btn').click(function () {
  location.reload();
})

$('#continue-btn').click(handleContinueBtnClick);

function handleContinueBtnClick() {
  if (quizMode === true && questionsAsked === scalesList.length) {
    displayTryAgain();
  } else {
    answerSubmitted = false;
    if (quizMode) timer(1000);
    $('.result-window').addClass('invisible');
    resetKeyboard();
    setupQuestion();
  }
}

function displayTryAgain() {
  gameOver = true;
  $('.continue-btn-container').html(`
      <a href="#app-title">
        <button class="btn btn-custom-color btn-lg" id="try-again-btn">Return to Main Page</button>
      </a>`);
  if (quizMode) {
    displayQuizResult();
  }
  $('#try-again-btn').click(function () {
    location.reload()
  });

}

function resetKeyboard() {
  notesSelected = [];
  $('.keyboard-note').removeClass('gold');
  $('.keyboard-note').empty();
}

//Handles submit click and looks for End Quiz
function handleSubmitBtnClick() {
  answerSubmitted = true;
  updateScore();
  $('.result-window').removeClass('invisible');
  $('.keyboard-note').off();
  $('.submit-answer-btn').off();
  displayScore();

  if (gameMode === true && questionsAsked === scalesList.length) {
    displayTryAgain();
    setTimeout(function () {
      $('#result-window-text').html(`<h5>Game Over! You Win!!!</h5>
        <h5>You finished all the scales in ${formatTime(timeToComplete)}</h5>
        <h5>Game ID: ${Math.floor(Math.random() * 100000)}`);
    }, 100);
  }
}

/* --- Update scale-info-container --- */
function displayScore() {
  $('#questions-asked-count').html('Questions Asked: ' + questionsAsked);
  $('#number-scales-correct').html('Correct Answers: ' + answersCorrect);
}

function displayScale(scale) {
  $('#current-scale-question').html('Current Scale: ' + scale);
}

//updates scale-info-container and turns on keyboard
function setupQuestion() {
  $('.submit-answer-btn').click(handleSubmitBtnClick);
  currentScale = pickPracticeScale(scalesList);
  currentScaleInNum = createScaleInNum(convertNotetoNum(currentScale));
  displayScale(currentScale);
  clickFunction('.keyboard-note', notesSelected);
}

/* --- Result-window --- */
function updateScore() {
  let result = compareNotesSelectedToCurrentScale(notesSelected, currentScaleInNum);
  questionsAsked++;

  if (result) {
    answersCorrect++;
    $('#result-window-text').html('Correct!');
  } else if (gameMode && gameOver === false) {
    $('#result-window-text').html('Game Over! You Lost.');
    displayTryAgain();
  } else {
    $('#result-window-text').html(`<h5>Incorrect.</h5>
      <h5 class="answer-example-text">The correct answer is shown below with <div class="answer-example"><div class="inner"></div></div></h5>`);
    showCorrectAnswer(currentScaleInNum);
  }
}

function showCorrectAnswer(array) {
  for (let i = 0; i < array.length; i++) {
    $(`#note-${array[i]}`).append('<div class="answer"></div>')
  }
}

/* --- Quiz Results --- */
function displayQuizResult() {

  //clears keyboard
  resetKeyboard();

  function showMissedScales(array) {
    if (scalesMissed.length === 0) {
      return 'None';
    } else {
      return formatScaleList(array)
    }
  }

  //formats array so it will wrap correctly when the results are shown
  function formatScaleList(array) {
    let newArr = []

    for (let i = 0; i < array.length; i++) {
      i === 0 ? newArr.push(array[i]) : newArr.push(" " + array[i]);
    }
    return newArr;
  }

  //generates the quiz result
  $('#result-window-text').html(
    `<h4><u>Quiz Over</u><h4>
    <div class="container quiz-result-info-container">
      <div class="row">
        <div class="col-6 left-col">
          <h5>Score:</h5>
        </div>
        <div class="col-6 right-col">
          <h5>${Math.round((answersCorrect * 100) / questionsAsked)}%</h5>
        </div>
        <div class="col-6 left-col">
          <h5>Test ID:</h5>
        </div>
        <div class="col-6 right-col">
          <h5>${Math.floor(Math.random() * 100000)}</h5>
        </div>
        <div class="col-6 left-col">
          <h5>Scales Missed:</h5>
        </div>
        <div class="col-6 right-col">
          <h5>${showMissedScales(scalesMissed)}</h5>
        </div>
        <div class="col-6 left-col">
          <h5>Scales on test:</h5>
        </div>
        <div class="col-6 right-col">
          <h5>${formatScaleList(scalesList)}</h5>
        </div>
    </div>

    <div class="quiz-result-info-container">
      <h5>Take a screen shot of this page to send to your teacher.</h5>
      <h5>Clicking try again we will reload the page and you will not be able to see this score again.</h5>
    </div>`);

  $('.submit-answer-btn-container').addClass('invisible');
  $('.bottom-end-session-btn-container').addClass('invisible');
}

/* --- Selecting Scales and checking user answers --- */
//cylces through array of selected practice scales
function pickPracticeScale(array) {
  if (practiceCount >= array.length) practiceCount = 0;
  let result = array[practiceCount];
  practiceCount++;
  return result;
}

//randomizes order of selected quiz scales
function orderQuizScales(array) {
  let index = 0;
  let randomizedArr = [];

  while (array.length > 0) {
    index = Math.floor(Math.random() * array.length);
    randomizedArr.push(array.splice(index, 1));
  }
  return randomizedArr.flat();
}

//Takes a scale's starting note and coverts its value to a number
function convertNotetoNum(note) {
  switch (note) {
    case 'C':
      return 1;
    case 'Db':
      return 2;
    case 'D':
      return 3;
    case 'Eb':
      return 4;
    case 'E':
      return 5;
    case 'F':
      return 6;
    case 'Gb':
      return 7;
    case 'G':
      return 8;
    case 'Ab':
      return 9;
    case 'A':
      return 10;
    case 'Bb':
      return 11;
    case 'B':
      return 12;
  }
}

//makes a scale into numbers to that it can be checked with user input
function createScaleInNum(startingNote) {
  let additonalNotesInScale = 7;
  let scaleInNum = [startingNote];

  for (let i = 1; i <= additonalNotesInScale; i++) {
    (i === 3 || i === 7) ? scaleInNum.push(startingNote += 1) : scaleInNum.push(startingNote += 2);
  }
  return scaleInNum;
}

//compares user input to the correct answer
function compareNotesSelectedToCurrentScale(array1, array2) {
  array1.sort((a, b) => a - b);

  if (array1.length !== array2.length) {
    scalesMissed.push(currentScale);
    return false;
  }

  //checks for higher C scale answer
  if (currentScale === 'C' && JSON.stringify(array1) == JSON.stringify(secondOctaveCScale)) {
    return true;
  }

  for (let i = 0; i < array1.length; i++) {
    if (array1[i] != array2[i]) {
      scalesMissed.push(currentScale);
      return false;
    }
  }
  return true;
}

/* --- timer elements --- */
let timerDisplay = document.getElementById('timer');

function timer(startTime) {
  let myTimer = setInterval(updateTimer, 10);

  function updateTimer() {
    if (startTime < 0 || answerSubmitted === true) {
      clearInterval(myTimer);
      if (!answerSubmitted) handleSubmitBtnClick();
    } else {
      timerDisplay.innerHTML = formatTime(startTime);
      startTime--;
    }
  }
}

function stopWatch(start) {
  let myStopWatch = setInterval(updateStopWatch, 10);

  function updateStopWatch() {
    if (gameOver) {
      timeToComplete = (start - 1);
      clearInterval(myStopWatch);
    } else {
      timerDisplay.innerHTML = formatTime(start);
      start++;
    }
  }
}

function formatTime(input) {
  let minutes = Math.floor(input / 6000);
  let seconds = Math.floor((input % 6000) / 100);
  let milliSeconds = input % 100;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  milliSeconds = milliSeconds < 10 ? '0' + milliSeconds : milliSeconds;

  return minutes > 0 ? `${minutes}:${seconds}:${milliSeconds}` : `${seconds}:${milliSeconds}`;
};