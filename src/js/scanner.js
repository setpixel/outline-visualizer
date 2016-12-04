/*

info when importing is done.
import based on qr code metadata

-=-=-=-

https://github.com/EyalAr/lwip

GOOD ARTICLE:
  https://www.packtpub.com/books/content/detecting-edges-lines-and-shapes

CANNY EDGE
  https://inspirit.github.io/jsfeat/

FIND CONTOURS
  https://github.com/Doodle3D/Contour-finding-experiment

Find points
  https://inspirit.github.io/jsfeat/

Perspective warp
  https://uncorkedstudios.com/blog/perspective-transforms-in-javascript

QR Code Reader

Crop Images

*/

var remote = nodeRequire('electron').remote 
var ipc = nodeRequire('electron').ipcRenderer
const {dialog} = require('electron').remote

const canvasBuffer = require('electron-canvas-to-buffer')
const QrCode = require('qrcode-reader');
const fs = require('fs')
const jsfeat = require('jsfeat')
const ContourFinder = require('./contourfinder')

var canvas
var image

const destinationWidth = 1080

let filenamesQueue = []

var cropList = [[0.027777777777777776,0.19644615536107726,0.3021885521885522,0.22094211193579755],
[0.34890572390572394,0.19644615536107726,0.3021885521885522,0.22094211193579755],
[0.6700336700336701,0.19644615536107726,0.3021885521885522,0.22094211193579755],
[0.027777777777777776,0.4524374407641273,0.3021885521885522,0.22094211193579755],
[0.34890572390572394,0.4524374407641273,0.3021885521885522,0.22094211193579755],
[0.6700336700336701,0.4524374407641273,0.3021885521885522,0.22094211193579755],
[0.027777777777777776,0.7084287261671774,0.3021885521885522,0.22094211193579755],
[0.34890572390572394,0.7084287261671774,0.3021885521885522,0.22094211193579755],
[0.6700336700336701,0.7084287261671774,0.3021885521885522,0.22094211193579755],]

// cropList =[[0.027819865319865317,0.19117647058823528,0.14154040404040405,0.10348583877995643],
// [0.1883838383838384,0.19117647058823528,0.14154040404040405,0.10348583877995643],
// [0.34894781144781145,0.19117647058823528,0.14154040404040405,0.10348583877995643],
// [0.5095117845117845,0.19117647058823528,0.14154040404040405,0.10348583877995643],
// [0.6700757575757577,0.19117647058823528,0.14154040404040405,0.10348583877995643],
// [0.8306397306397306,0.19117647058823528,0.14154040404040405,0.10348583877995643],
// [0.027819865319865317,0.31917211328976036,0.14154040404040405,0.10348583877995643],
// [0.1883838383838384,0.31917211328976036,0.14154040404040405,0.10348583877995643],
// [0.34894781144781145,0.31917211328976036,0.14154040404040405,0.10348583877995643],
// [0.5095117845117845,0.31917211328976036,0.14154040404040405,0.10348583877995643],
// [0.6700757575757577,0.31917211328976036,0.14154040404040405,0.10348583877995643],
// [0.8306397306397306,0.31917211328976036,0.14154040404040405,0.10348583877995643],
// [0.027819865319865317,0.44716775599128544,0.14154040404040405,0.10348583877995643],
// [0.1883838383838384,0.44716775599128544,0.14154040404040405,0.10348583877995643],
// [0.34894781144781145,0.44716775599128544,0.14154040404040405,0.10348583877995643],
// [0.5095117845117845,0.44716775599128544,0.14154040404040405,0.10348583877995643],
// [0.6700757575757577,0.44716775599128544,0.14154040404040405,0.10348583877995643],
// [0.8306397306397306,0.44716775599128544,0.14154040404040405,0.10348583877995643],
// [0.027819865319865317,0.5751633986928104,0.14154040404040405,0.10348583877995643],
// [0.1883838383838384,0.5751633986928104,0.14154040404040405,0.10348583877995643],
// [0.34894781144781145,0.5751633986928104,0.14154040404040405,0.10348583877995643],
// [0.5095117845117845,0.5751633986928104,0.14154040404040405,0.10348583877995643],
// [0.6700757575757577,0.5751633986928104,0.14154040404040405,0.10348583877995643],
// [0.8306397306397306,0.5751633986928104,0.14154040404040405,0.10348583877995643],
// [0.027819865319865317,0.7031590413943356,0.14154040404040405,0.10348583877995643],
// [0.1883838383838384,0.7031590413943356,0.14154040404040405,0.10348583877995643],
// [0.34894781144781145,0.7031590413943356,0.14154040404040405,0.10348583877995643],
// [0.5095117845117845,0.7031590413943356,0.14154040404040405,0.10348583877995643],
// [0.6700757575757577,0.7031590413943356,0.14154040404040405,0.10348583877995643],
// [0.8306397306397306,0.7031590413943356,0.14154040404040405,0.10348583877995643],
// [0.027819865319865317,0.8311546840958606,0.14154040404040405,0.10348583877995643],
// [0.1883838383838384,0.8311546840958606,0.14154040404040405,0.10348583877995643],
// [0.34894781144781145,0.8311546840958606,0.14154040404040405,0.10348583877995643],
// [0.5095117845117845,0.8311546840958606,0.14154040404040405,0.10348583877995643],
// [0.6700757575757577,0.8311546840958606,0.14154040404040405,0.10348583877995643],
// [0.8306397306397306,0.8311546840958606,0.14154040404040405,0.10348583877995643]]


let init = function(document, iimage) {
  // your canvas drawing
  canvas = document.createElement('canvas')
  //canvas = icanvas
  // var image = new Image()
  image = iimage


  image.onload = ()=>{
    let imageAspect = image.width/image.height

    console.log (imageAspect)

    canvas.width = 1500
    canvas.height = Math.round(1500/imageAspect)

    var context = canvas.getContext('2d')

    context.drawImage(image, 0,0, canvas.width, canvas.height)
    let imageData = context.getImageData(0, 0, canvas.width, canvas.height);


    // get pixels
    let img_u8 = new jsfeat.matrix_t(canvas.width, canvas.height, jsfeat.U8C1_t);
    jsfeat.imgproc.grayscale(imageData.data, canvas.width, canvas.height, img_u8);

    // equalize
    jsfeat.imgproc.equalize_histogram(img_u8, img_u8);

    // blur
    var r = 8;
    var kernel_size = (r+1) << 1;
    jsfeat.imgproc.gaussian_blur(img_u8, img_u8, kernel_size, 0);

    // canny
    jsfeat.imgproc.canny(img_u8, img_u8, 10, 50);

    // blur again
    r = 0.3;
    kernel_size = (r+1) << 1;
    jsfeat.imgproc.gaussian_blur(img_u8, img_u8, kernel_size, 0);

    // put image back in canvas for contour finding
    var data_u32 = new Uint32Array(imageData.data.buffer);
    var alpha = (0xff << 24);
    var i = img_u8.cols*img_u8.rows, pix = 0;
    while(--i >= 0) {
        pix = img_u8.data[i];
        data_u32[i] = alpha | (pix << 16) | (pix << 8) | pix;
    }
    context.putImageData(imageData, 0, 0);


    var buffer = canvasBuffer(canvas, 'image/jpg', 0.75)
    let filename = 'outputtest.jpg'
    fs.writeFileSync(filename, buffer)



    // kill edge noise
    context.fillStyle = 'rgba(150,150,150,0.1)'
    context.strokeStyle = 'rgba(14,14,14,1)'
    context.lineWidth = 20;
    context.rect(0, 0, canvas.width, canvas.height)

    // contour finder
    contourFinder  = new ContourFinder();
    contourFinder.findContours(canvas,255,0,20);
    contourFinder.allContours.sort()
    contourFinder.allContours = contourFinder.allContours.filter(function(e,i,array){if (e.length < 10000) { return i}})

    //drawContour
    context.strokeStyle = 'rgba(255,0,0,1)'
    drawContour(contourFinder.allContours.length-1)
    let corners = findCorners(contourFinder.allContours.length-1)
    console.log(corners)

    canvas.width = 2500
    canvas.height = Math.round(2500/(11/8.5))
    context = canvas.getContext('2d')
    context.drawImage(image, 0,0, canvas.width, canvas.height)
    imageData = context.getImageData(0, 0, canvas.width, canvas.height);


    img_u8 = new jsfeat.matrix_t(canvas.width, canvas.height, jsfeat.U8_t | jsfeat.C1_t);
    // img_u8_warp = new jsfeat.matrix_t(640, 480, jsfeat.U8_t | jsfeat.C1_t);
    img_u8_warp = new jsfeat.matrix_t(canvas.width, canvas.height, jsfeat.U8_t | jsfeat.C1_t);
    transform = new jsfeat.matrix_t(3, 3, jsfeat.F32_t | jsfeat.C1_t);
    jsfeat.math.perspective_4point_transform(transform, 
                                                    corners[0][0]*canvas.width,   corners[0][1]*canvas.height,   0,  0,
                                                    corners[1][0]*canvas.width,   corners[1][1]*canvas.height,   canvas.width, 0,
                                                    corners[2][0]*canvas.width,   corners[2][1]*canvas.height, canvas.width, canvas.height,
                                                    corners[3][0]*canvas.width,   corners[3][1]*canvas.height, 0, canvas.height);
    jsfeat.matmath.invert_3x3(transform, transform);

    jsfeat.imgproc.grayscale(imageData.data, canvas.width, canvas.height, img_u8);
    jsfeat.imgproc.warp_perspective(img_u8, img_u8_warp, transform, 0);

    var data_u32 = new Uint32Array(imageData.data.buffer);
    var alpha = (0xff << 24);
    var i = img_u8_warp.cols*img_u8_warp.rows, pix = 0;
    while(--i >= 0) {
      pix = img_u8_warp.data[i];
      data_u32[i] = alpha | (pix << 16) | (pix << 8) | pix;
    }

    context.putImageData(imageData, 0, 0);


    var qr = new QrCode();
    qr.callback = function(result,err) { 
      if(result) {
        console.log("GOT BACK RESULT: " + result )
        console.log("BEGIN CROPPING:" )

        let qrValues = result.split('.')

        let outline = remote.getGlobal('sharedObj').outlineData
        let sceneCount = 0
        let currentNode
        for (var i = 0; i < outline.length; i++) {
          if (outline[i].type == 'scene'){
            sceneCount++
            currentNode = i
            if (sceneCount == Number(qrValues[1])) {
              break;
            }
          }
        }

        let filenames = []

        let dir = remote.getGlobal('sharedObj').documentPath + '/outline-images'
        if (!fs.existsSync(dir)){
          console.log('no images directory, making it')
          fs.mkdirSync(dir);
        }

        for (var i = 0; i < cropList.length; i++) {
          let c = createCroppedImage(document, canvas, cropList[i])
          if (checkForImageContent(c)) {
            
            // perform some brightness / contrast.
            c = cleanupBrightness(c)
            c = crop(c, 0.96)

            console.log("image at: " + (i+1))
            console.log("saving image")
            
            var buffer = canvasBuffer(c, 'image/jpg', 0.75)
            let filename = '/outline-images/scene-' + qrValues[1] + '-' + outline[currentNode].text.replace(/([^a-z0-9]+)/gi, '-').toLowerCase().slice(0, 50) + '-' + qrValues[2] + '-' + i + '.jpg'
            fs.writeFileSync(remote.getGlobal('sharedObj').documentPath + filename, buffer)
            filenames.push(filename)
          }
        }

        outline[currentNode].image = outline[currentNode].image.concat(filenames).filter(function(item, pos, self) {
          return self.indexOf(item) == pos;
          })
        
        ipc.send('saveOutline')
      } else {
        dialog.showErrorBox('Could not read QR code', 'There was an error reading the QR code: ' + err + '\n\nTake another picture and try again, or contact Charles.')
        // console.log(err)
      }
      processNextFile()
    }
    qr.decode(imageData);

    // write canvas to file
    // var buffer = canvasBuffer(canvas, 'image/png')
    // fs.writeFile('image.png', buffer, function (err) {
    // })

    function findCorners(index) {
      let points = contourFinder.allContours[index]

      var prevAngle = 0;

      let q1 = []
      let q2 = []
      let q3 = []
      let q4 = []

      for (var i = 0; i < points.length; i++) {
        if (i > 12) {
          var angleDeg = Math.abs(Math.atan2(points[i].y - points[i-12].y, points[i].x - points[i-12].x) * 180 / Math.PI)
          if ((Math.abs(Math.abs(prevAngle) - Math.abs(angleDeg)) > 20) || i == (points.length-1)) {

            if (points[i-6].x > (canvas.width/2)) {
              if (points[i-6].y > (canvas.height/2)) {
                q3.push({x: points[i-6].x, y: points[i-6].y, distance: distance(points[i-6].x, points[i-6].y, canvas.width, canvas.height)})
              } else {
                q2.push({x: points[i-6].x, y: points[i-6].y, distance: distance(points[i-6].x, points[i-6].y, canvas.width, 0)})
              }
            } else {
              if (points[i-6].y > (canvas.height/2)) {
                q4.push({x: points[i-6].x, y: points[i-6].y, distance: distance(points[i-6].x, points[i-6].y, 0, canvas.height)})
              } else {
                q1.push({x: points[i-6].x, y: points[i-6].y, distance: distance(points[i-6].x, points[i-6].y, 0, 0)})
              }
            }
            //console.log("SUP", points[i].x, points[i].y, angleDeg, prevAngle)
            context.strokeStyle = 'rgba(255,0,0,1)'
            context.fillStyle = 'rgba(255,0,255,1)';
            // context.rect(points[i-6].x, points[i-6].y, 13, 13)
            // context.stroke();
            prevAngle = angleDeg
          } 
          prevAngle = prevAngle + ((angleDeg - prevAngle)*.05)
        }
      }

      console.log(q1.sort(function(a,b){return a.distance-b.distance})[0])
      console.log(q2.sort(function(a,b){return a.distance-b.distance})[0])
      console.log(q3.sort(function(a,b){return a.distance-b.distance})[0])
      console.log(q4.sort(function(a,b){return a.distance-b.distance})[0])

      context.strokeStyle = 'rgba(0,255,0,1)'
      context.rect(q1[0].x, q1[0].y, 25, 25)
      context.stroke();
      context.rect(q2[0].x, q2[0].y, 25, 25)
      context.stroke();
      context.rect(q3[0].x, q3[0].y, 25, 25)
      context.stroke();
      context.rect(q4[0].x, q4[0].y, 25, 25)
      context.stroke();

      return ([[q1[0].x/canvas.width,q1[0].y/canvas.height],[q2[0].x/canvas.width,q2[0].y/canvas.height],[q3[0].x/canvas.width,q3[0].y/canvas.height],[q4[0].x/canvas.width,q4[0].y/canvas.height]])
    }

    function drawContour(index) {
      let points = contourFinder.allContours[index]
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      for (var i = 0; i < points.length; i++) {
        context.lineTo(points[i].x, points[i].y);
      }
      context.closePath();
      context.lineWidth = 1;
      context.fillStyle = 'rgba(255,0,0,0.4)';
      context.fill();
      context.stroke();
    }

    function distance (x1, y1, x2, y2){
      var d = Math.sqrt( (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2) )
      return d
    }

  }
}

let createCroppedImage = function(document, srcImage, cropValues) {
  let calibration = [-8,-18]
  //calibration = [-0,-0]

  let destinationCanvas = document.createElement('canvas')
  destinationCanvas.width = destinationWidth
  destinationCanvas.height = destinationWidth/1.77
  let destinationContext = destinationCanvas.getContext('2d')

  destinationContext.drawImage(srcImage, srcImage.width*cropValues[0]+calibration[0], srcImage.height*cropValues[1]+calibration[1], srcImage.width*cropValues[2], srcImage.height*cropValues[3], 0, 0, destinationCanvas.width, destinationCanvas.height);

  return destinationCanvas
}

let checkForImageContent = function(canvas) {
  var context = canvas.getContext('2d')
  let imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  // get pixels
  let img_u8 = new jsfeat.matrix_t(canvas.width, canvas.height, jsfeat.U8C1_t);
  jsfeat.imgproc.grayscale(imageData.data, canvas.width, canvas.height, img_u8);

  // blur
  var r = 8;
  var kernel_size = (r+1) << 1;
  jsfeat.imgproc.gaussian_blur(img_u8, img_u8, kernel_size, 0);

  // canny
  jsfeat.imgproc.canny(img_u8, img_u8, 10, 50);

  var i = img_u8.cols*img_u8.rows, pix = 0;
  var count = 0
  while(--i >= 0) {
    count+= img_u8.data[i]
  }

  // if the total white value is more than 200,000 most have an image!
  if (count > 200000) {
    return true
  } else {
    return false
  }
}

let cleanupBrightness = function(canvas) {
  var context = canvas.getContext('2d')
  let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  var data = imageData.data;

  let maxWhite = 0
  for (var i=0; i<data.length; i+=4) {
    maxWhite = Math.max(maxWhite, data[i])
  }

  // console.log('WHITE: ' + maxWhite)

  // let brightness = Math.sqrt(255-maxWhite) * (Math.sqrt(255-maxWhite)*0.45)
  // // console.log('brightness: ' + brightness)
  // let contrast = brightness * 1.5
  // brightness += (brightness * 0.3)

  // for(var i=0;i<data.length;i+=4)
  // {
  //     data[i] += brightness;
  //     data[i+1] += brightness;
  //     data[i+2] += brightness;
  // }

  // var factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  // for(var i=0;i<data.length;i+=4)
  // {
  //     data[i] = factor * (data[i] - 128) + 128;
  //     data[i+1] = factor * (data[i+1] - 128) + 128;
  //     data[i+2] = factor * (data[i+2] - 128) + 128;
  // }

  let brightness = 255-maxWhite

  for(var i=0;i<data.length;i+=4)
  {
      data[i] += brightness;
      data[i+1] += brightness;
      data[i+2] += brightness;
  }

  let contrast = 20

  var factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for(var i=0;i<data.length;i+=4)
  {
      data[i] = factor * (data[i] - 128) + 128;
      data[i+1] = factor * (data[i+1] - 128) + 128;
      data[i+2] = factor * (data[i+2] - 128) + 128;
  }


  for(var i=0;i<data.length;i+=4)
  {
      data[i] = 255-((255-data[i])*((255-data[i])*0.03))
      data[i+1] = data[i]
      data[i+2] = data[i]
  }



  context.putImageData(imageData, 0, 0);
  return canvas
}

let crop = function(canvas, factor) {
  let destinationCanvas = document.createElement('canvas')
  destinationCanvas.width = canvas.width
  destinationCanvas.height = canvas.height
  let destinationContext = destinationCanvas.getContext('2d')

  let sourceWidth = canvas.width * factor
  let sourceHeight = sourceWidth / (canvas.width/canvas.height)

  let offset = [(canvas.width-sourceWidth)/2,(canvas.height-sourceHeight)/2]

  destinationContext.drawImage(canvas, offset[0], offset[1], sourceWidth, sourceHeight, -1, -1, destinationCanvas.width+1, destinationCanvas.height+1);

  return destinationCanvas
}



let importImage = function(filename) {
  image.src = filename
}

let importImages = function(filenames) {
  filenamesQueue = filenames
  processNextFile()
}

let processNextFile = function() {
  if (filenamesQueue.length > 0) {
    image.src = filenamesQueue.shift()
  } else {
    // done! maybe display some info:
    // number of sheets processed, images captured.
  }
}

let scanModule = {
  init: init,
  importImage: importImage,
  importImages: importImages
}

module.exports = scanModule