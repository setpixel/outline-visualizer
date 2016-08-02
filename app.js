/* 
TODO:
  listen for file change
  show all the scenes
  format onscreen data:

    ACT 1
    SCENE 10 [1:30 mins] of 72 // 35:35/1:45:24

  scene timer display
  scene playback marker
  turbo mode
  drag and drop [images and outlines]
  load images
  output a fountain file


*/ 

var remote = nodeRequire('electron').remote 
var ipc = nodeRequire('electron').ipcRenderer

var currentNode = 0
var playbackMode = false
var playbackType = 0
var frameTimer
var updateTimer 
var imageTimer

var colorList = ["6dcff6", "f69679", "00bff3", "f26c4f", "fff799", "c4df9b", "f49ac1", "8393ca", "82ca9c", "f5989d", "605ca8", "a3d39c", "fbaf5d", "fff568", "3cb878", "fdc689", "5674b9", "8781bd", "7da7d9", "a186be", "acd373", "7accc8", "1cbbb4", "f9ad81", "bd8cbf", "7cc576", "f68e56", "448ccb"];


$(document).ready(function() {
  renderTimeline()
  advanceFrame(0)
});

var renderTimeline = function() {
  var outlineData = remote.getGlobal('sharedObj').outlineData
  // get scene count
  // get totalTime
  var sceneCount = 0;
  var totalTime = 0;
  for (var i = 0; i < outlineData.length; i++) {
    if (outlineData[i].type !== 'section') {
      sceneCount++
      if (outlineData[i].timing) {
        totalTime += Number(outlineData[i].timing)
      } else {
        totalTime += 90;
      }
    }
  }
  // loop and render each div
  // width, color, title
  console.log(sceneCount)
  console.log(totalTime)

  var currentScene = 0;
  var currentTime = 0;
  var sceneTime = 0;

  var html = []

  var firstSectionScene = true

  for (var i = 0; i < outlineData.length; i++) {
    if (outlineData[i].type !== 'section') {
      currentScene++
      if (outlineData[i].timing) {
        sceneTime = Number(outlineData[i].timing)
        currentTime += sceneTime
      } else {
        sceneTime = 90
        currentTime += sceneTime
      }
      //console.log("scene: " + outlineData[i].text + (sceneTime/totalTime*100))
      if (i == 0 || outlineData[Math.max(i-1, 0)].type == 'section') {
        html.push(`<div class="scene first" data-id="`+ i +`" style="flex-grow:` + (sceneTime/totalTime*100) + `; background: #` + colorList[(Math.max(i-1,0)) % colorList.length] + `;" title="` + outlineData[i].text + `"></div>`)
      } else if (i == (outlineData.length-1) || outlineData[Math.min(i+1, outlineData.length-1)].type == 'section') {
        html.push(`<div class="scene last" data-id="`+ i +`" style="flex-grow:` + (sceneTime/totalTime*100) + `; background: #` + colorList[(i-1) % colorList.length] + `;" title="` + outlineData[i].text + `"></div>`)
      } else {
        html.push(`<div class="scene " data-id="`+ i +`" style="flex-grow:` + (sceneTime/totalTime*100) + `; background: #` + colorList[(i-1) % colorList.length] + `;" title="` + outlineData[i].text + `"></div>`)
      }

    } else {
      html.push(`<div class="marker"><div>` + outlineData[i].text + `</div></div>`)
    }
  }

  $('#timeline').empty()
  $('#timeline').html(html.join(''))

  $('.scene').mousedown(function(e) {
    playbackMode = false;
    clearTimeout(frameTimer)
    goToFrame(e.target.dataset.id)
  })

}

var goToFrame = function(index) {
  currentNode = index-1
  advanceFrame(1)
}

var currentImage
var imageInterval

var advanceFrame = function(direction) {
  $('.status').css('width', '0%')
  var outlineData = remote.getGlobal('sharedObj').outlineData;

  currentNode = Math.max(currentNode + direction,0);

  if (outlineData[currentNode].type == 'section') {
    currentNode = Math.max(currentNode + direction,1);
  }

  var sceneCount = 0;
  var currentScene = 0;
  var currentTime = 0;
  var totalTime = 0;
  var currentSection = '';


  for (var i = 0; i < outlineData.length; i++) {
    if (outlineData[i].type !== 'section') {
      sceneCount++
      if (i == currentNode) {
        currentScene = sceneCount;
      }
      if (outlineData[i].timing) {
        totalTime += Number(outlineData[i].timing)
      } else {
        totalTime += 90;
      }
      if (i < currentNode) {
        currentTime = totalTime;
      }

    } else {
      if (i < currentNode) {
        currentSection = outlineData[i].text;
      }
    }
  }

  $('body').css('background', 'linear-gradient(#' + colorList[(currentNode+1) % colorList.length] + ', #' + colorList[Math.max(currentNode-1,0) % colorList.length] + ')')

  $(".scene.current").removeClass('current')
  $(".scene[data-id='" + currentNode + "']").addClass('current');


  $('#scenemarker').text(currentSection + ': ' + currentScene + ' / ' + sceneCount + ' ' + msToTime(currentTime*1000) + ' / ' + msToTime(totalTime*1000))


  clearTimeout(imageTimer)
  if (remote.getGlobal('sharedObj').outlineData[currentNode].image) {
    currentImage = 0
    if (playbackMode) {
      imageInterval = (remote.getGlobal('sharedObj').outlineData[currentNode].description.length*72+1300)/remote.getGlobal('sharedObj').outlineData[currentNode].image.length
      imageTimer = setTimeout(advanceImage, imageInterval)
    }
    $("#posterimage").attr("src","./"+remote.getGlobal('sharedObj').outlineData[currentNode].image[0]);
    $('#posterimage').show()
    console.log('has images!!!')
  } else {
    $('#posterimage').hide()
  }


  if (remote.getGlobal('sharedObj').outlineData[currentNode].text) { 
    $('#caption').text(remote.getGlobal('sharedObj').outlineData[currentNode].text)
  } else {
    $('#caption').text('')
  }
  if (remote.getGlobal('sharedObj').outlineData[currentNode].description) { 
    $('#description').text(remote.getGlobal('sharedObj').outlineData[currentNode].description) 
  } else {
    $('#description').text('')
  }
  if (remote.getGlobal('sharedObj').outlineData[currentNode].slugline) { 
    $('#slugline').text(remote.getGlobal('sharedObj').outlineData[currentNode].slugline) 
  } else {
    $('#slugline').text('')
  }
  if (remote.getGlobal('sharedObj').outlineData[currentNode].timing) { 
    $('#timing').text(remote.getGlobal('sharedObj').outlineData[currentNode].timing) 
  } else {
    $('#timing').text('')
  }

 

}

var advanceImage = function() {
  clearTimeout(imageTimer)
  currentImage++
  var imageCount = remote.getGlobal('sharedObj').outlineData[currentNode].image.length
  console.log(imageCount)
  $("#posterimage").attr("src","./"+remote.getGlobal('sharedObj').outlineData[currentNode].image[currentImage % imageCount]);
  imageTimer = setTimeout(advanceImage, imageInterval)
}

var goToImage = function(direction) {
  clearTimeout(imageTimer)
  currentImage = Math.max(currentImage + direction, 0)
  var imageCount = remote.getGlobal('sharedObj').outlineData[currentNode].image.length
  $("#posterimage").attr("src","./"+remote.getGlobal('sharedObj').outlineData[currentNode].image[currentImage % imageCount]);
}

window.onkeydown = function(key){
   console.log(key);
  switch (key.keyCode) {
    // back arrow
    case 37:
      playbackMode = false;
      clearTimeout(updateTimer)
      clearTimeout(frameTimer)
      speechSynthesis.cancel()
      advanceFrame(-1);

      // clearTimeout(frameTimer);
      // playbackMode = false;
      // if (key.metaKey || key.ctrlKey) {
      //   advanceScene(-1);
      // } else {
      //   advanceFrame(-1);
      // }
      break;
    // front arrow
    case 39:
      playbackMode = false;
      clearTimeout(updateTimer)
      clearTimeout(frameTimer)
      speechSynthesis.cancel()
      advanceFrame(1);
      // clearTimeout(frameTimer);
      // playbackMode = false;
      // if (key.metaKey || key.ctrlKey) {
      //   advanceScene(1);
      // } else {
      //   advanceFrame(1);
      // }
      break;
  //   // r key
  //   case 82:
  //     if (key.metaKey || key.ctrlKey){
  //       recordScene();
  //     }
  //     break;
    case 83:
      toggleSpeechPlayback();
      break;
    // space key
    case 32: 
      togglePlayback();
      break;
  //   case 48:
    case 49:
      playbackType = 0
      break;
    case 50:
      playbackType = 1
      break;
    case 51:
      playbackType = 2
      break;
    // ENTER KEY
    case 13: 
      goToImage(1)
      break;
    // ' KEY
    case 222:
      goToImage(-1)
      break;
  //   case 52:
  //   case 53:
  //   case 54:
  //   case 55:
  //   case 56:
  //   case 57:
  //     var position;
  //     if (key.keyCode == 48) {
  //       position = 9;
  //     } else {
  //       position = key.keyCode-49;
  //     }
  //     var percentage = position/9;
  //     currentPosition[0] = Math.round((sceneData.length-1)*percentage);
  //     currentPosition[1] = 0;
  //     updateFrame();
  //     break;
  //   case 72:
  //     $("#content").toggleClass("show")
  //     break;
  //   case 188:
  //     clearTimeout(frameTimer);
  //     playbackMode = false;
  //     previousNote();
  //     break;
  //   case 190:
  //     clearTimeout(frameTimer);
  //     playbackMode = false;
  //     advanceNote();
  //     break;
  }
};

var playAdvance = function(first) {
  clearTimeout(frameTimer)
  clearTimeout(updateTimer);
  if(!first){
    advanceFrame(1);
  }
  var outlineData = remote.getGlobal('sharedObj').outlineData;
  
  if (playbackType < 2) {
    var mult
    if (playbackType == 1) {
      mult = 4;
    } else {
      mult = 1;
    }
    if (outlineData[currentNode].timing) {
      timing = Number(outlineData[currentNode].timing)*1000/mult
    } else {
      timing = 90*1000/mult
    }
  } else {
    timing = 2000;
  }


  startSceneTime = new Date().getTime()
  endSceneTime = startSceneTime + timing

  frameTimer = setTimeout(playAdvance, timing)
  updateTimer = setTimeout(updateTime, 20)
};

        var utter = new SpeechSynthesisUtterance();


var startSpeakingTime

var playSpeechAdvance = function(first) {
  clearTimeout(frameTimer)
  clearTimeout(updateTimer);
    
  if (playbackMode) {
    if(!first){
      advanceFrame(1);
    } else {
      advanceFrame(0)
    }
    var outlineData = remote.getGlobal('sharedObj').outlineData;


    var sceneCount = 0;
    var currentScene = 0;

    for (var i = 0; i < outlineData.length; i++) {
      if (outlineData[i].type !== 'section') {
        sceneCount++
        if (i == currentNode) {
          currentScene = sceneCount;
        }
      }
    }



    
    //timing = Number(outlineData[currentNode].timing)*1000/mult

        utter.pitch = 0.65;
        utter.rate = 1.1;
        utter.text = `Scene ` + currentScene + `. ` + outlineData[currentNode].description;
        utter.onend = function(event) { 
          console.log('done')
          console.log(utter.text)
          console.log(((new Date().getTime())-startSpeakingTime)/utter.text.length)
          speechSynthesis.cancel()
          setTimeout(playSpeechAdvance, 1000) 
        }
        speechSynthesis.speak(utter);
        startSpeakingTime = new Date().getTime()

    updateTimer = setTimeout(updateTime, 20)
  }

};





var startSceneTime
var endSceneTime

var togglePlayback = function() {

  playbackMode = !playbackMode;
  if (playbackMode) {
    // begin playing
    playAdvance(true)
  } else {
    // stop playing
    clearTimeout(frameTimer);
    clearTimeout(updateTimer);
    advanceFrame(0)
  }
};

var toggleSpeechPlayback = function() {
  playbackMode = !playbackMode;
  if (playbackMode) {
    // begin playing
    playSpeechAdvance(true)
  } else {
    // stop playing
    clearTimeout(frameTimer);
    clearTimeout(updateTimer);
    advanceFrame(0)
     speechSynthesis.cancel()
  }



 
}


var updateTime = function() {
  clearTimeout(updateTimer);


  var per = ((new Date().getTime()-startSceneTime)/(endSceneTime-startSceneTime)*100).toFixed(2)

  $('.status').css('width', String(per) + '%')


  if (playbackMode) {
    updateTimer = setTimeout(updateTime, 20)
  } else {
  }
}

var reloadOutline = function() {
  advanceFrame(0)
  renderTimeline()
}

ipc.on('reload', function(event, arg){
  console.log('reloaded outline');  // prints "ping"
  reloadOutline();
});


document.ondragover = document.ondrop = function(ev) {
  ev.preventDefault()
}

document.body.ondrop = function(ev) {
  console.log(ev.dataTransfer.files[0].path)
  // if image
  // copy to document path
  // save new outline text

  // if text
  // open the text file
  // save pref for the last opened file

  ev.preventDefault()
}

function msToTime(s) {
  function addZ(n) {
    return (n<10? '0':'') + n;
  }
  var ms = (s % 1000);
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;
  if (hrs) {
    return hrs + ':' + addZ(mins) + ':' + addZ(secs);
  } else {
    return mins + ':' + addZ(secs); //+ '.' + ms.toString().substring(0,1);
  }
};