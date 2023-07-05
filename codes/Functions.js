/* Random Number Between min and max */
function RandomFrom(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function PlaySound(soundobj) {
  var thissound = document.getElementById(soundobj);
  thissound.pause();
  thissound.currentTime = 0;
  thissound.volume = 0.25;
  thissound.play();
}

function StopSound(soundobj) {
  var thissound = document.getElementById(soundobj);
  thissound.pause();
  thissound.currentTime = 0;
}
