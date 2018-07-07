/**
 * Cloudia a simple WordCloud library By Eliot Stocker
 * @param {Object}           options                          - Options object
 * @param {HTMLElement}      options.target                   - Target HTML Element in which to create word cloud
 * @param {(String|Object)}  options.data                     - URL, JSON String on JavaScript Object containing the data for the cloud
 * @param {number}           [options.textSize=12]                 - Overall text size
 * @param {boolean}          [options.ignoreBadItems=false]   - Ignore items in the cloud that don't conform to the schema
 * @param {number}           [options.generationSpeed=10]     - number of pixels to move at a time when trying to place words,
 * the larger the number the quicker the cloud will be generated, but you will be more likely to get larger gaps
 * @param {number}           [options.sizeCount=6]            - number of sizes for the words in the cloud
 * @constructor
 */
var Cloudia = function(options) {
  //parse options
  if (!options['target']) {
    throw new Error('You must specify a target element into which the cloud will be generated');
  }
  if (!options['data']) {
    throw new Error('You must data for cloud generation, data can be a valid JSON String, a javascript object or a URL String');
  }

  if (!this._isDomElement(options['target'])) {
    throw new Error('target option should specify a valid DOM Element');
  }

  if(options['target'].innerHTML !== '') {
    throw new Error('target should be empty');
  }

  if(options['generationSpeed']) {
    this['generationSpeed'] = parseInt(options['generationSpeed'], 10);
  }
  if(options['sizeCount']) {
    this['sizeCount'] = parseInt(options['sizeCount'], 10);
  }
  if(options['textSize']) {
    this['textSize'] = parseFloat(options['textSize']);
  }

  //private vars
  this._rawData = null;
  this._data = null;
  this._targetEl = options['target'];
  this._ignoreBadItems = options['ignoreBadItems'] === true;
  this._positions = [];
  this._sizes = [];

  //debounce timeout handlers
  this._sizeDebounce = 0;
  this._generationDebounce = 0;
  this._resizeDebounce = 0;

  //check for direct JS Object Passed
  if(typeof options['data'] === 'object') {
    this._data = options['data'];
    this._initialise();
  } else {
    //quick and simple test to see if data is JSON
    if (options['data'].indexOf('{') === 0) {
      this._rawData = options['data'];
      this._data = JSON.parse(this._rawData);
      this._initialise();
    } else {
      //otherwise we assume URL
      this._getDataFromURL(options['data'], this._dataReceived.bind(this));
    }
  }

};

Cloudia.prototype = {
  //vars
  _itemSchema: {
    'label': 'string',
    'sentimentScore': 'number',
    'sentiment': 'object',
    'volume': 'number',
    'id': 'string'
  },
  _i18n: {
    'en': {
      'stats_title': 'Information on topic \"{string}\":',
      'total_mentions': 'Total Mentions: {string}',
      'positive_mentions': 'Positive Mentions: <span class="mention_positive">{string}</span>',
      'neutral_mentions': 'Neutral Mentions: <span class="mention_neutral">{string}</span>',
      'negative_mentions': 'Negative Mentions: <span class="mention_negative">{string}</span>'
    }
  },
  'sizeCount': 6,
  'language': 'en',
  'generationSpeed': 10,
  'textSize': 12,

  //DATA RETRIEVAL
  //use nanoajax to make a call to the server for the JSON content
  _getDataFromURL: function(url, successCallback) {
    nanoajax.ajax({url: url}, function (code, responseText) {
      if(code >= 200 && code < 300){
        successCallback(responseText);
      }
    });
  },
  //callback for JSON data received
  _dataReceived: function(data) {
    this._rawData = data;
    this._data = JSON.parse(this._rawData);
    try {
      this._initialise();
    } catch(e) {
      console.error(e.message);
    }
  },
  //DATA PROCESSING
  //initialise the data and begin library main functionality
  _initialise: function() {
    this._centerPosition = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
    if(this._targetEl.clientWidth > 0 && this._targetEl.clientHeight > 0) {
      this._centerPosition = {
        x: this._targetEl.clientWidth / 2,
        y: this._targetEl.clientHeight / 2
      };
    }
    this._checkSchema();
    this._targetEl.style.fontSize = this['textSize'] + 'px';
    this._targetEl.className += ' CloudiaCloud';
    this._sizes = this._calculateSizeRange();
    this._createCloudFromData();

    window.addEventListener('resize', function() {
      clearTimeout(this._resizeDebounce);
      this._resizeDebounce = setTimeout(this._resize.bind(this), 250);
    }.bind(this));
  },
  //check the data conforms to expected schema
  _checkSchema: function() {
    if(!this._data['topics']) {
      throw new Error('Schema Error, expected root array named topics');
    }
    var cleaned = [];
    for(var i = 0; i < this._data['topics'].length; i++) {
      if(!this._itemConformsToSchema(this._data['topics'][i], this._itemSchema)) {
        if(!this._ignoreBadItems) {
          throw new Error('Schema Error, item: ' + i + ' does not conform to schema');
        } else {
          console.warn('Item: ' + i + ' does not conform to schema, Ignoring', this._data['topics'][i]);
        }
      } else if(this._ignoreBadItems) {
        cleaned.push(this._data['topics'][i]);
      }
    }

    if(this._ignoreBadItems) {
      this._data['topics'] = cleaned;
    }
  },
  //check a single word item conforms to the required schema
  _itemConformsToSchema: function(item, schema) {
    for(var prop in schema) {
      if (!item.hasOwnProperty(prop)) {
        return false;
      }
      if(typeof schema[prop] === 'object') {
        return this._itemConformsToSchema(item[prop], schema[prop]);
      } else {
        if (typeof item[prop] !== schema[prop]) {
          return false;
        }
      }
    }
    return true;
  },
  //create a range of values for sizing the words
  _calculateSizeRange: function() {
    var values = [];
    for(var i = 0; i < this._data['topics'].length; i++) {
      if(values.indexOf(this._data['topics'][i]['volume']) === -1) values.push(this._data['topics'][i]['volume']);
    }
    values.sort(function(a,b) {
      return a - b;
    });
    while(values.length > this['sizeCount']) {
      values = this._averageClosesValues(values);
    }
    return values;
  },
  //OUTPUT GENERATION
  //create the cloud from the JSON array
  _createCloudFromData: function() {
    //generate word DOM Elements
    for(var i = 0; i < this._data['topics'].length; i++) {
      this._data['topics'][i].el = this._createWord(this._data['topics'][i]);
    }
    this._layoutWords();
  },
  //layout words on screen
  _layoutWords: function() {
    //sort from most popular to least
    this._positions = [];
    this._data['topics'].sort(function(a, b) {
      return b['volume'] - a['volume'];
    });

    //add all elements, measure and then calculate optimal position
    for(var i = 0; i < this._data['topics'].length; i++) {
      this._targetEl.appendChild(this._data['topics'][i].el);
      setTimeout(function(item) {
        item.width = item.el.clientWidth;
        item.height = item.el.clientHeight;
        this._setWordPosition(item);
      }.bind(this, this._data['topics'][i]), 100);
    }
  },
  //generate word dom object with metadata info
  _createWord: function(item) {
    var wordContainer = document.createElement('div');
    wordContainer.className = 'cloudWordContainer';
    var word = document.createElement('span');
    word.innerText = item['label'];
    word.className = 'cloudWord';
    this._setWordProperties(item, word);

    var stats = document.createElement('div');
    stats.className = 'metadata';
    stats.innerHTML = '<h4>' + this._formatString('stats_title', item['label']) + '</h4>' +
      '<p>' + this._formatString('total_mentions', item['volume']) + '</p>' +
      '<p>' + this._formatString('positive_mentions', item['sentiment']['positive'] || 0) + '<br>' +
      this._formatString('neutral_mentions', item['sentiment']['neutral'] || 0) + '<br>' +
      this._formatString('negative_mentions', item['sentiment']['negative'] || 0) + '<br>' +
      '</p>';

    wordContainer.appendChild(word);
    wordContainer.appendChild(stats);

    return wordContainer;
  },
  //set word colors and sizes
  _setWordProperties: function(item, el) {
    if(item['sentimentScore'] > 60) {
      item.display = 'positive';
    } else if(item['sentimentScore'] < 40) {
      item.display = 'negative';
    } else {
      item.display = 'neutral';
    }

    el.className += ' ' + item.display;
    this._setWordSize(item, el);
  },
  _setWordSize: function(item, el) {
    if(el == null) {
      el = item.el.querySelector('.cloudWord');
    }
    item.size = this._getClosestArrayItem(item['volume'], this._sizes) + 1;
    el.style.fontSize = (item.size) + 'em';
  },
  //set the position of a single block, dont allow overlap with any over block
  _setWordPosition: function(item) {
    //start at center and move out
    var x = this._centerPosition.x - (item.width / 2);
    var y = this._centerPosition.y - (item.height / 2);

    item.el.querySelector('.cloudWord').style.width = item.width + 'px';
    item.el.querySelector('.cloudWord').style.height = item.height + 'px';

    var moveAmount = 0;
    while(this._isOverlappingExisting(x, y, item.width, item.height)) {
      moveAmount += this['generationSpeed'];
      //try moving outward counter clockwise from the middle
      if(!this._isOverlappingExisting(x, y + moveAmount, item.width, item.height)) {
        y = y + moveAmount;
      } else if(!this._isOverlappingExisting(x + moveAmount, y + moveAmount, item.width, item.height)) {
        y = y + moveAmount;
        x = x + moveAmount;
      } else if(!this._isOverlappingExisting(x + moveAmount, y, item.width, item.height)) {
        x = x + moveAmount;
      } else if(!this._isOverlappingExisting(x + moveAmount, y - moveAmount, item.width, item.height)) {
        x = x + moveAmount;
        y = y - moveAmount;
      } else if(!this._isOverlappingExisting(x, y - moveAmount, item.width, item.height)) {
        y = y - moveAmount;
      } else if(!this._isOverlappingExisting(x - moveAmount, y - moveAmount, item.width, item.height)) {
        x = x - moveAmount;
        y = y - moveAmount;
      } else if(!this._isOverlappingExisting(x - moveAmount, y, item.width, item.height)) {
        x = x - moveAmount;
      } else if(!this._isOverlappingExisting(x - moveAmount, y + moveAmount, item.width, item.height)) {
        x = x - moveAmount;
        y = y + moveAmount;
      }
    }

    //calculation done, set actual position
    item.el.style.top = y + 'px';
    item.el.style.left = x + 'px';

    //store all final positions into an array to help with positioning
    this._positions.push({
      x: x,
      y: y,
      width: item.width,
      height: item.height
    });
  },
  //check if current item overlaps any known items
  _isOverlappingExisting: function(x, y, w, h) {
    for(var i = 0; i < this._positions.length; i++) {
      var existing = this._positions[i];
      if(!(existing.x > x + w ||
        existing.x + existing.width < x ||
        existing.y > y + h ||
        existing.y + existing.height < y)) return true;
    }
    return false;
  },
  //recenter canvas on resize
  _resize: function() {
    this._centerPosition = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
    if(this._targetEl.clientWidth > 0 && this._targetEl.clientHeight > 0) {
      this._centerPosition = {
        x: this._targetEl.clientWidth / 2,
        y: this._targetEl.clientHeight / 2
      };
    }
    this._layoutWords();
  },
  //UTILS
  //check if an item is a valid DOM element
  _isDomElement: function(el) {
    try {
      return el instanceof HTMLElement;
    } catch(e) {
      //Older browser unsupported?
      throw new  Error('Browser is unsupported');
    }
  },
  //format a string from i18n values
  _formatString: function(id, data) {
    if(!this._i18n[this['language']][id]) {
      throw new Error('Translation for String ID: ' + id + ' not found, check translations file for language: ' + this.language);
    }
    var string = this._i18n[this['language']][id];
    if(data !== undefined && string.indexOf('{string}') > -1) {
      return string.replace('{string}', data);
    } else {
      return string;
    }
  },
  //get closest number in array
  _getClosestArrayItem: function(val, array){
    var minimum = 999999;
    var out = 0;
    for(var i in array) {
      var dif = Math.abs(val-array[i]);
      if(dif < minimum) {
        minimum = dif;
        out = i;
      }
    }
    return parseInt(out, 10);
  },
  //reduce an array of number by one, removing the two closes values and replacing with the average of the two
  _averageClosesValues: function(array) {
    array.sort(function(a,b) {
      return a - b;
    });
    var min = 999999;
    var value = 0;
    for(var i in array) {
      var dif = array[i + 1] - i;
      if(dif < min) {
        value = i;
        min = dif;
      }
    }
    array.splice(value, 2, (array[value] + array[parseInt(value, 10) + 1]) / 2);
    return array;
  },
  //inner workings for 'setSizeCount' method
  _updateSizeCount: function(count) {
    this['sizeCount'] = parseInt(count, 10);
    this._sizes = this._calculateSizeRange();
    for(var i in this._data['topics']) {
      this._setWordSize(this._data['topics'][i], 10);
    }
    this._layoutWords();
  },
  //inner workings for 'setGenerationSpeed' method
  _updateGenerationSpeed: function(speed) {
    this['generationSpeed'] = parseInt(speed, 10);
    this._layoutWords();
  },
  _updateTextSize: function(size) {
    this['textSize'] = parseInt(size, 10);
    this._targetEl.style.fontSize = this['textSize'] + 'px';
    this._layoutWords();
  },

  //PUBLIC METHODS
  /**
   * change number of different text sizes available at run time (Will regenerate the cloud)
   * @param {number} count - Maximum number of text sizes
   */
  'setSizeCount': function(count) {
    if(typeof count !== 'number') {
      throw new Error('value must be a number');
    }
    clearTimeout(this._sizeDebounce);
    this._sizeDebounce = setTimeout(this._updateSizeCount.bind(this, count), 250);
  },
  /**
   * change the generation speed at run time (Will regenerate the cloud)
   * @param {number} speed - generation speed, the lower the number, the closer your words are likely to be,
   * higher numbers will generate significantly faster
   */
  'setGenerationSpeed': function(speed) {
    if(typeof speed !== 'number') {
      throw new Error('value must be a number');
    }
    clearTimeout(this._generationDebounce);
    this._generationDebounce = setTimeout(this._updateGenerationSpeed.bind(this, speed), 250);
  },
  /**
   * change the overall text size at run time (Will regenerate the cloud)
   * @param {number} size - base font size in pixels, this number will represent the smallest word height in pixels.
   */
  'setTextSize': function(size) {
    if(typeof size !== 'number') {
      throw new Error('value must be a number');
    }
    clearTimeout(this._textDebounce);
    this._textDebounce = setTimeout(this._updateTextSize.bind(this, size), 250);
  }
};

//Export for Closure compiler
window['Cloudia'] = Cloudia;