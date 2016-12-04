let currentNode
let totalNodes
let currentScene
let totalScenes
let totalBeats
let currentTime
let totalTime
let totalCharacters
let totalLocations
let totalTags
let sectionStats
let totalWords

let generateStats = function(outlineData) {
  currentNode = 0
  totalNodes = 0
  currentScene = 0
  totalScenes = 0
  totalBeats = 0
  currentTime = 0
  totalTime = 0
  sectionStats = []
  totalWords = 0

  let locationList = []

  for (var i = 0; i < outlineData.length; i++) {
    if (outlineData[i].type != 'section') {
      totalNodes++
    } else {
      if (sectionStats.length > 0) {
        sectionStats.push([totalScenes, totalTime])
      } else {
        sectionStats.push([totalScenes, totalTime])
      }
    }
    if (i == (outlineData.length-1)){
      sectionStats.push([totalScenes, totalTime])
      sectionStats.shift()
      let tSectionStats = [].concat(sectionStats)
      for (var i2 = 0; i2 < tSectionStats.length; i2++) {
        if (i2 > 0) {
          sectionStats[i2] = [tSectionStats[i2][0]-tSectionStats[i2-1][0],tSectionStats[i2][1]-tSectionStats[i2-1][1]]
        }
      }
    }
    if (outlineData[i].type == 'scene') {
      totalScenes++
      if (outlineData[i].timing) {
        totalTime += Number(outlineData[i].timing)
      } else {
        totalTime += 90
      }

      if (outlineData[i].slugline) {
        locationList.push(outlineData[i].slugline.split('-')[0].trim())
      }

      if (outlineData[i].description) {
        totalWords += outlineData[i].description.split(' ').length
      }

    }
    if (outlineData[i].type == 'beat') {
      totalBeats++;
    }
    // if (i == 0) {
    //   currentNode = totalNodes
    //   currentScene = totalScenes
    // }
    // if (i == (outlinerApp.getCurrentSelection()-1)) {
    //   currentTime = totalTime;
    // }
  }

  totalCharacters = 0
  totalLocations = locationList.filter(function(item, pos, self) { return self.indexOf(item) == pos }).length
  totalTags = 0

}

let outlineStatsModule = {
  generateStats: generateStats,
  getStats: function() { return {
    'totalCharacters': totalCharacters,
    'totalLocations': totalLocations,
    'totalTags': totalTags,
    'totalNodes': totalNodes,
    'totalScenes': totalScenes,
    'totalBeats': totalBeats,
    'totalTime': totalTime,
    'sectionStats': sectionStats,
    'totalWords': totalWords,
    } 
  },
}

module.exports = outlineStatsModule