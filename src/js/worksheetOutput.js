/* TODO

  parameters for printing (paper size,x,y,aspect ratio)
  make "CODE: 3/LTR/3/3/1.77/634234"

*/

const {app} = require('electron')
const child_process = require('child_process')

const fs = require('fs')
const pdfDocument = require('pdfkit')
const qr = require('qr-image')
const moment = require('moment')

var documentSize = [8.5*72,11*72]
var margin = [22, 22, 22, 40]

var fontData
var imageData
var imageAspectRatio
var currentTime
var currentSection

let printTest = function(outlineData, currentNode) {
  // size

  console.log(currentNode)

  let currentSection = ''
  let sceneNumber = 0
  let node

  for (var i = 0; i < outlineData.length; i++) {
    if (outlineData[i].type == 'section') {
      currentSection = outlineData[i].text
    } else if (outlineData[i].type == 'scene') {
      sceneNumber++
      if (i == currentNode) {
        node = outlineData[i]
        break;
      }
    }
  }

  var doc = new pdfDocument({size: documentSize, layout: 'landscape', margin: 0});
    
  doc.registerFont('thin', __dirname + '/./../fonts/proximanova/ProximaNova-Thin.ttf')
  doc.registerFont('light', __dirname + '/./../fonts/proximanova/ProximaNova-Light.ttf')
  doc.registerFont('regular', __dirname + '/./../fonts/proximanova/ProximaNova-Reg.ttf')
  doc.registerFont('bold', __dirname + '/./../fonts/proximanova/ProximaNova-Bold.ttf')

  let stream = doc.pipe(fs.createWriteStream(app.getPath('temp') + 'worksheetoutput.pdf'))

  stream.on('close', function() {
    console.log('PRINTING!!!')
    let cmd = 'lpr -o landscape ' + app.getPath('temp') + 'worksheetoutput.pdf'
    var output = child_process.execSync(cmd);
    // cmd = 'open ' + app.getPath('temp') + 'worksheetoutput.pdf'
    // var output = child_process.execSync(cmd);
  })


  console.log("generating worksheet!")

  let aspectRatio
  // aspectRatio = 2.39 // widescreen 
  // aspectRatio = 1.85 // cinema 
  aspectRatio = 1.77 // 16:9 standard
  // aspectRatio = 1.33 // 4:3 old tv

  // calc qr code
  var currentScene = sceneNumber
  var type = "3X3"
  var time = String(Math.round(Date.now()/1000)).substr(3)

  let qrText = [type,currentScene,time].join('.')

  let img = qr.imageSync(qrText, {ec_level: 'H', type: 'png', size: 15, margin: 0})
  fs.writeFileSync(app.getPath('temp') + 'qrcode.png', img)

  //console.log(app.getPath('temp') + '/qrcode.png')

  let headerHeight = 80

  // draw header

  let x, y

  qrSize = headerHeight
  x = documentSize[1]-margin[2]-qrSize
  y = margin[1]

  doc.image(app.getPath('temp') + 'qrcode.png', x, y, {width: qrSize, height: qrSize})
  doc.save()
  doc.rotate(-90, {origin: [x, y]})
  doc.font('thin')
  doc.fontSize(4)
  doc.text(qrText, x-qrSize, y-10, {width: qrSize, align: 'left'})
  doc.restore()


  doc.font('regular')
  doc.fontSize(8)
  let t = currentSection+': SCENE ' + sceneNumber
  doc.text(t, margin[0], margin[1], {align: 'left'})
  w = doc.widthOfString(t, {align: 'left'})
  doc.font('thin')
  doc.text('DRAFT: ' + moment().format('MMMM Do, YYYY').toUpperCase(), margin[0]+w+7, margin[1], {align: 'left'})
  doc.fontSize(14)
  doc.font('bold')
  doc.text(node.text, margin[0], margin[1]+8, {align: 'left'})
  doc.fontSize(5)
  doc.font('light')
  doc.text(node.description, {columns: 2, columnGap: 15, height: 60, width: 465})


  // draw instructions
  doc.save();
  doc.translate(doc.page.width-headerHeight-margin[2]-150-20-6, margin[1]+9+2.8)
  doc.scale(0.07);
  doc.path("M73.4,63h29.8c3.5,0,5.7-3.8,3.9-6.8L78.6,6.7c-5.2-9-18.2-9-23.4,0l-7.1,12.4c-0.8,1.4-0.8,3.1,0,4.5l21.4,37.1 C70.3,62.2,71.8,63,73.4,63z").fill();
  doc.path("M115.6,75.4H73.4c-1.6,0-3.1,0.9-3.9,2.3l-14.7,25.5c-1.7,3,0.4,6.8,3.9,6.8h56.1c10.4,0,16.9-11.2,11.7-20.2l-6.9-12     C118.7,76.3,117.3,75.4,115.6,75.4z").fill();
  doc.path("M35.7,40.6L7.3,89.7c-5.2,9,1.3,20.2,11.7,20.2h15c1.6,0,3.1-0.9,3.9-2.3l20.9-36.2c0.8-1.4,0.8-3.1,0-4.5L43.5,40.6      C41.8,37.5,37.4,37.5,35.7,40.6z").fill();
  doc.path("M139.7,127.1h-0.8v2.1h-0.4v-2.1h-0.8v-0.3h2V127.1z M142.8,129.3h-0.4v-2.1h0l-0.8,2.1h-0.2l-0.8-2.1h0v2.1h-0.4v-2.5h0.6    l0.8,1.9l0.8-1.9h0.5V129.3z").fill();
  doc.path("M0,126.9h3.1l2.1,8.4h0l2.7-8.4h2.7l2.7,8.6h0l2.2-8.6h2.9l-3.8,13h-2.6l-2.9-9h0l-2.9,9H3.8L0,126.9z").fill();
  doc.path("M19,133.4c0-1,0.2-2,0.5-2.8s0.8-1.6,1.5-2.2s1.4-1.1,2.2-1.4c0.9-0.3,1.8-0.5,2.8-0.5c1,0,2,0.2,2.8,0.5    c0.9,0.3,1.6,0.8,2.2,1.4c0.6,0.6,1.1,1.3,1.5,2.2s0.5,1.8,0.5,2.8c0,1-0.2,2-0.5,2.8s-0.8,1.6-1.5,2.2c-0.6,0.6-1.4,1.1-2.2,1.4    c-0.9,0.3-1.8,0.5-2.8,0.5c-1,0-2-0.2-2.8-0.5c-0.9-0.3-1.6-0.8-2.2-1.4s-1.1-1.3-1.5-2.2S19,134.5,19,133.4z M22,133.4    c0,0.6,0.1,1.2,0.3,1.7c0.2,0.5,0.5,1,0.8,1.3c0.4,0.4,0.8,0.7,1.3,0.9c0.5,0.2,1.1,0.3,1.7,0.3c0.6,0,1.2-0.1,1.7-0.3    c0.5-0.2,0.9-0.5,1.3-0.9c0.4-0.4,0.6-0.8,0.8-1.3c0.2-0.5,0.3-1.1,0.3-1.7c0-0.6-0.1-1.2-0.3-1.7c-0.2-0.5-0.5-1-0.8-1.3    c-0.4-0.4-0.8-0.7-1.3-0.9c-0.5-0.2-1.1-0.3-1.7-0.3c-0.6,0-1.2,0.1-1.7,0.3c-0.5,0.2-0.9,0.5-1.3,0.9c-0.4,0.4-0.6,0.8-0.8,1.3    C22.1,132.3,22,132.8,22,133.4z").fill();
  doc.path("M35,126.9h3.9l5.5,9.1h0v-9.1h2.9v13h-3.8l-5.7-9.3h0v9.3H35V126.9z").fill();
  doc.path("M50,126.9h4.3c1,0,2,0.1,3,0.3c0.9,0.2,1.8,0.6,2.5,1.1c0.7,0.5,1.3,1.2,1.7,2c0.4,0.8,0.6,1.8,0.6,3c0,1.1-0.2,2-0.6,2.8    c-0.4,0.8-0.9,1.5-1.6,2c-0.7,0.5-1.5,1-2.3,1.2s-1.8,0.4-2.8,0.4H50V126.9z M52.9,137.3h1.5c0.7,0,1.3-0.1,1.8-0.2    s1.1-0.4,1.5-0.7s0.7-0.7,1-1.2s0.4-1.1,0.4-1.9c0-0.6-0.1-1.2-0.4-1.7c-0.2-0.5-0.6-0.9-1-1.2s-0.9-0.5-1.4-0.7s-1.1-0.2-1.7-0.2    h-1.7V137.3z").fill();
  doc.path("M64.1,126.9H73v2.6h-6v2.4h5.6v2.6H67v2.6h6.3v2.6h-9.2V126.9z").fill();
  doc.path("M75.6,126.9h5c0.7,0,1.3,0.1,1.9,0.2c0.6,0.1,1.1,0.3,1.6,0.6s0.8,0.7,1.1,1.2c0.3,0.5,0.4,1.1,0.4,1.9    c0,0.9-0.2,1.7-0.7,2.3c-0.5,0.6-1.2,1.1-2.1,1.2l3.3,5.5h-3.4l-2.7-5.2h-1.4v5.2h-2.9V126.9z M78.5,132.3h1.7c0.3,0,0.5,0,0.8,0    c0.3,0,0.5-0.1,0.8-0.2s0.4-0.2,0.6-0.4c0.2-0.2,0.2-0.5,0.2-0.8c0-0.3-0.1-0.6-0.2-0.8c-0.1-0.2-0.3-0.3-0.5-0.5    c-0.2-0.1-0.4-0.2-0.7-0.2c-0.3,0-0.5-0.1-0.8-0.1h-1.9V132.3z").fill();
  doc.path("M103.9,134.9c0,0.8-0.1,1.5-0.3,2.1s-0.6,1.2-1,1.7s-1,0.9-1.7,1.1c-0.7,0.3-1.5,0.4-2.4,0.4c-0.9,0-1.7-0.1-2.4-0.4    s-1.3-0.6-1.7-1.1s-0.8-1-1-1.7s-0.3-1.4-0.3-2.1v-8h2.9v7.9c0,0.4,0.1,0.8,0.2,1.1c0.1,0.3,0.3,0.6,0.5,0.9    c0.2,0.3,0.5,0.4,0.8,0.6c0.3,0.1,0.7,0.2,1.1,0.2c0.4,0,0.7-0.1,1-0.2c0.3-0.1,0.6-0.3,0.8-0.6c0.2-0.3,0.4-0.5,0.5-0.9    c0.1-0.3,0.2-0.7,0.2-1.1v-7.9h2.9V134.9z").fill();
  doc.path("M106.6,126.9h3.9l5.5,9.1h0v-9.1h2.9v13h-3.8l-5.7-9.3h0v9.3h-2.9V126.9z").fill();  
  doc.path("M121.5,126.9h2.9v13h-2.9V126.9z").fill();
  doc.path("M129.5,129.4h-3.7v-2.5h10.3v2.5h-3.7v10.5h-2.9V129.4z").fill();
  doc.restore();

  doc.fontSize(6)
  doc.font('bold')
  doc.text('OUTLINE VISUALIZER', doc.page.width-headerHeight-margin[2]-150-6, margin[1]+9, {align: 'left'})
  doc.font('regular')
  doc.text('STORYBOARD WORKSHEET')
  doc.moveDown()
  doc.font('thin')
  doc.fontSize(6)
  doc.text('1. Draw as many keyframes as you need.')
  doc.text('2. Take a picture of worksheet with your phone.')
  doc.text('3. Import the photos from your phone.')
  doc.text('2. Import the files in Outline Visualizer (CMD+I)')


  // draw boxes
  boxesDim = [3,3]
  spacing = 15

  boxSize = [(documentSize[1]-margin[0]-margin[2]-(spacing * (boxesDim[0]-1)))/boxesDim[0], (documentSize[0]-margin[1]-margin[3]-headerHeight-(spacing * (boxesDim[1])))/boxesDim[1] ]

  doc.font('thin')
  doc.fontSize(6)

  let currentBox = 0

  for (var iy = 0; iy < boxesDim[1]; iy++) {
    boxesDim[1]
    for (var ix = 0; ix < boxesDim[0]; ix++) {
      currentBox++
      let x = margin[0]+(ix*boxSize[0])+(ix*spacing)
      let y = margin[1]+(iy*boxSize[1])+((iy+1)*spacing)+headerHeight
      let offset
      let box

      if((boxSize[0]/boxSize[1])>aspectRatio) {
        offset = [(boxSize[0]-(boxSize[1]*aspectRatio))/2,0]
        box = [x+offset[0],y, boxSize[1]*aspectRatio, boxSize[1]]
      } else {
        offset = [0, (boxSize[1]-(boxSize[0]/aspectRatio))/2]
        box = [x,y+offset[1], boxSize[0], boxSize[0]/aspectRatio]
      }

      doc.rect(box[0],box[1],box[2],box[3])
      
      console.log("[" + [box[0]/documentSize[1],box[1]/documentSize[0],box[2]/documentSize[1],box[3]/documentSize[0]] + "],")

      doc.lineWidth(.1)
      .dash(4, {space: 2})
      .stroke() 
      doc.text(currentBox+'.', x-12+offset[0], y+offset[1], {width: 10, align: 'right'});
      
    }

  }

  // drawTimeline(doc, outlineData, scale, margin);
  // drawFooter(doc, scale, margin)

  doc.end();



  //lpr -o landscape worksheet.pdf

};



let printModule = {
  printTest: printTest
}

module.exports = printModule