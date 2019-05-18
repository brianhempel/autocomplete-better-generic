// After https://github.com/atom/autocomplete-snippets/blob/master/lib/snippets-provider.js


const { Point, Range } = require('atom')


// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// https://atom.io/docs/api/v1.6.0/Point
function pointManhattanDistance(point1, point2) {
  rowDistance    = Math.abs(point2.row    - point1.row);
  columnDistance = Math.abs(point2.column - point1.column);

  return rowDistance + columnDistance;
}

function sharedStringPrefix(str1, str2) {
  var sharedPrefixLength = 0;
  while(sharedPrefixLength < str1.length && sharedPrefixLength < str2.length) {
    if (str1[sharedPrefixLength] !== str2[sharedPrefixLength]) {
      break;
    }
    sharedPrefixLength++;
  }
  return str1.slice(0, sharedPrefixLength);
}

const startsWithWordChar = /^\w/;
const trailingWordChars  = /\w*$/;

module.exports =
  class BetterGenericProvider {
    constructor() {
      this.selector = '*'
      this.inclusionPriority = 1
      this.excludeLowerPriority = true
      this.suggestionPriority = 2
      this.filterSuggestions = false
    }

    getSuggestions({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) {
      const currentBuffer = editor.getBuffer();

      return new Promise(function(resolve, reject) {

        const line    = currentBuffer.lineForRow(bufferPosition.row);
        const postfix = line.slice(bufferPosition.column).split(/\W+/)[0] || "";

        if (prefix.length < 1) {
          resolve([]);
        };

        const regExp = new RegExp('\\b' + escapeRegExp(prefix) + '\\w*' + escapeRegExp(postfix), 'gm');

        const prefixStartPosition = new Point(bufferPosition.row, bufferPosition.column - prefix.length);

        const compareDistanceToCursorThenLength = (a, b) => {
          let distanceDiff = pointManhattanDistance(prefixStartPosition, a.range.start) - pointManhattanDistance(prefixStartPosition, b.range.start);
          if (distanceDiff === 0) {
            return b.replacement.length - a.replacement.length;
          };
          return distanceDiff
        };

        const rangesAndReplacements = [];

        currentBuffer.scan(regExp, ({match, matchText, range, stop, replace}) => {
          if (!range.containsPoint(prefixStartPosition)) {
            rangesAndReplacements.push({ range: range, replacement: matchText });
          }
        });

        const rangesAndReplacementsExpanded = [];

        // if the user types "co" and "console.log(" appears twice in the
        // buffer, offer "console.log(" as a completion rather than just "console".
        if (postfix.length == 0) {
          for (var i = 0; i < rangesAndReplacements.length - 1; i++) {
            let baseRange            = rangesAndReplacements[i].range;
            let baseMatch            = rangesAndReplacements[i].replacement;
            let baseMatchToEndOfLine = currentBuffer.lineForRow(baseRange.start.row).slice(baseRange.start.column);

            // Autocomplete short words to the next word anyway.
            if (baseMatch.length <= 4) {
              let matchAnotherWord = baseMatchToEndOfLine.match(/^\w*\W+\w+/)
              if (matchAnotherWord) {
                let withAnotherWord = matchAnotherWord.toString();
                rangesAndReplacementsExpanded.push({
                  range:       new Range(baseRange.start, new Point(baseRange.start.row, baseRange.start.column + withAnotherWord.length)),
                  replacement: withAnotherWord
                });
              }
            }

            for (var j = i+1; j < rangesAndReplacements.length; j++) {
              let otherRange            = rangesAndReplacements[j].range;
              let otherMatch            = rangesAndReplacements[j].replacement;
              let otherMatchToEndOfLine = currentBuffer.lineForRow(otherRange.start.row).slice(otherRange.start.column);
              let sharedPrefix          = sharedStringPrefix(baseMatchToEndOfLine, otherMatchToEndOfLine).trimRight();
              var afterBasePrefix       = baseMatchToEndOfLine.slice(sharedPrefix.length);
              var afterOtherPrefix      = otherMatchToEndOfLine.slice(sharedPrefix.length);

              // Remove partial words from end of prefix.
              if (sharedPrefix.length > 0 && (afterBasePrefix.match(startsWithWordChar) || afterOtherPrefix.match(startsWithWordChar))) {
                sharedPrefix = sharedPrefix.slice(0, sharedPrefix.match(trailingWordChars).index).trimRight();
              }

              // Offer an extended match if we gain at least 2 characters.
              if (sharedPrefix.length >= baseMatch.length + 2) {
                var closerRange;
                if (pointManhattanDistance(prefixStartPosition, baseRange.start) <= pointManhattanDistance(prefixStartPosition, otherRange.start)) {
                  closerRange = baseRange;
                } else {
                  closerRange = otherRange;
                }
                rangesAndReplacementsExpanded.push({
                  range:       new Range(closerRange.start, new Point(closerRange.start.row, closerRange.start.column + sharedPrefix.length)),
                  replacement: sharedPrefix
                });
              }
            }
          }
        }

        const results =
          rangesAndReplacements.
            concat(rangesAndReplacementsExpanded).
            sort(compareDistanceToCursorThenLength).
            map(({range, replacement}) => {
              return {text: replacement};
            });

        resolve(results);
      });
    }
  }
