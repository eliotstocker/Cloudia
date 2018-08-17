/**
 * Cloudia a simple WordCloud library By Eliot Stocker
 * @param {Object}           options                          - Options object
 * @param {HTMLElement}      options.target                   - Target HTML Element in which to create word cloud
 * @param {(String|Object)}  options.data                     - URL, JSON String on JavaScript Object containing the data for the cloud
 * @param {number}           [options.textSize=12]                 - Overall text size
 * @param {boolean}          [options.ignoreBadItems=false]   - Ignore items in the cloud that don't conform to the schema
 * @param {number}           [options.generationSpeed=10]     - number of pixels to move at a time when trying to place words,
 * the larger the number the quicker the cloud will be generated, but you will be more likely to get larger gaps
 * @param {number}           [options.rotationStep=20]        - number of degrees to rotate each time trying to place a word,
 * the larger the number the quicker the cloud will be generated, but you will be more likely to get larger gaps, or odd shapes
 * @param {number}           [options.sizeCount=6]            - number of sizes for the words in the cloud
 * @constructor
 */
class Cloudia {
  constructor(options) {
    //parse options
    if (!options['target']) {
      throw new Error('You must specify a target element into which the cloud will be generated');
    }
    if (!options['data']) {
      throw new Error('You must data for cloud generation, data can be a valid JSON String, a javascript object or a URL String');
    }

    if (!Cloudia._isDomElement(options['target'])) {
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
    if(options['rotationStep']) {
      this['rotationStep'] = parseFloat(options['rotationStep']);
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
        Cloudia._getDataFromURL(options['data'], this._dataReceived.bind(this));
      }
    }
  }

  //DATA RETRIEVAL
  //use nanoajax to make a call to the server for the JSON content
  static _getDataFromURL(url, successCallback) {
    nanoajax.ajax({url: url}, (code, responseText) => {
      if(code >= 200 && code < 300){
        successCallback(responseText);
      }
    });
  }
  //callback for JSON data received
  _dataReceived(data) {
    this._rawData = data;
    this._data = JSON.parse(this._rawData);
    try {
      this._initialise();
    } catch(e) {
      console.error(e.message);
    }
  }
  //DATA PROCESSING
  //initialise the data and begin library main functionality
  _initialise() {
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

    window.addEventListener('resize', _ => {
      clearTimeout(this._resizeDebounce);
      this._resizeDebounce = setTimeout(this._resize, 250);
    });
  }
  //check the data conforms to expected schema
  _checkSchema() {
    if(!this._data['topics']) {
      throw new Error('Schema Error, expected root array named topics');
    }
    let cleaned = [];
    this._data['topics'].map((value, index) => {
      if(!this._itemConformsToSchema(value, this._itemSchema)) {
        if(!this._ignoreBadItems) {
          throw new Error('Schema Error, item: ' + index + ' does not conform to schema');
        } else {
          console.warn('Item: ' + index + ' does not conform to schema, Ignoring', value);
        }
      } else if(this._ignoreBadItems) {
        cleaned.push(value);
      }
      return value;
    });

    if(this._ignoreBadItems) {
      this._data['topics'] = cleaned;
    }

    return cleaned;
  }
  //check a single word item conforms to the required schema
  _itemConformsToSchema(item, schema) {
    for(let prop in schema) {
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
  }
  //create a range of values for sizing the words
  _calculateSizeRange() {
    let values = [];
    this._data['topics'].map((value, index) => {
      if(values.indexOf(value['volume']) === -1) values.push(value['volume']);
      return value;
    });
    values.sort(function(a,b) {
      return a - b;
    });
    while(values.length > this['sizeCount']) {
      values = this._averageClosesValues(values);
    }
    return values;
  }
  //OUTPUT GENERATION
  //create the cloud from the JSON array
  _createCloudFromData() {
    //generate word DOM Elements
    this._data['topics'].map((value, index) => {
      value.el = this._createWord(value);
      return value;
    });
    this._layoutWords();
  }
  //layout words on screen
  _layoutWords() {
    //sort from most popular to least
    this._positions = [];
    this._data['topics'].sort(function(a, b) {
      return b['volume'] - a['volume'];
    });

    //add all elements, measure and then calculate optimal position
    this._data['topics'].map((value, index) => {
      this._targetEl.appendChild(value.el);
      setTimeout((item => {
        item.width = item.el.clientWidth;
        item.height = item.el.clientHeight;
        this._setWordPosition(item);
      }).bind(undefined, value), 100);
      return value;
    });
  }
  //generate word dom object with metadata info
  _createWord(item) {
    const wordContainer = document.createElement('div');
    wordContainer.className = 'cloudWordContainer';
    const word = document.createElement('span');
    word.innerText = item['label'];
    word.className = 'cloudWord';
    this._setWordProperties(item, word);

    const stats = document.createElement('div');
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
  }
  //set word colors and sizes
  _setWordProperties(item, el) {
    if(item['sentimentScore'] > 60) {
      item.display = 'positive';
    } else if(item['sentimentScore'] < 40) {
      item.display = 'negative';
    } else {
      item.display = 'neutral';
    }

    el.className += ' ' + item.display;
    this._setWordSize(item, el);

    return item;
  }

  _setWordSize(item, el) {
    if(el == null) {
      el = item.el.querySelector('.cloudWord');
    }
    item.size = this._getClosestArrayItem(item['volume'], this._sizes) + 1;
    el.style.fontSize = (item.size) + 'em';

    return item;
  }
  //set the position of a single block, dont allow overlap with any over block
  _setWordPosition(item) {
    //start at center and move out
    let x = this._centerPosition.x - (item.width / 2);
    let y = this._centerPosition.y - (item.height / 2);

    item.el.querySelector('.cloudWord').style.width = item.width + 'px';
    item.el.querySelector('.cloudWord').style.height = item.height + 'px';

    let moveAmount = 0;
    while(this._isOverlappingExisting(x, y, item.width, item.height)) {
      moveAmount += this['generationSpeed'];
      let rotation = 0;
      while(rotation < 360) {
        let rads = Cloudia._degreesToRads(rotation);
        let xM = Math.cos(rads) * moveAmount;
        let yM = Math.sin(rads) * moveAmount;
        if (!this._isOverlappingExisting(x + xM, y + yM, item.width, item.height)) {
          x = x + xM;
          y = y + yM;
          break;
        }
        rotation += this['rotationStep'];
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

    return item;
  }

  static _degreesToRads(angle) {
    return angle * (Math.PI / 180);
  }
  //check if current item overlaps any known items
  _isOverlappingExisting(x, y, w, h) {
    if(!this._positions.length) return false;
    let over = false;
    this._positions.forEach((item) => {
      if (!(item.x > x + w ||
        item.x + item.width < x ||
        item.y > y + h ||
        item.y + item.height < y)) over = true;
    });

    return over;
  }
  //recenter canvas on resize
  _resize() {
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
  }
  //UTILS
  //check if an item is a valid DOM element
  static _isDomElement(el) {
    try {
      return el instanceof HTMLElement;
    } catch(e) {
      //Older browser unsupported?
      throw new  Error('Browser is unsupported');
    }
  }
  //format a string from i18n values
  _formatString(id, data) {
    if(!this._i18n[this['language']][id]) {
      throw new Error('Translation for String ID: ' + id + ' not found, check translations file for language: ' + this.language);
    }
    let string = this._i18n[this['language']][id];
    if(data !== undefined && string.indexOf('{string}') > -1) {
      return string.replace('{string}', data);
    } else {
      return string;
    }
  }
  //get closest number in array
  _getClosestArrayItem(val, array) {
    let minimum = 999999;
    let out = 0;
    array.map((value, index) => {
      let dif = Math.abs(val-value);
      if(dif < minimum) {
        minimum = dif;
        out = index;
      }
      return value;
    });
    return parseInt(out, 10);
  }
  //reduce an array of number by one, removing the two closes values and replacing with the average of the two
  _averageClosesValues(array) {
    array.sort(function(a,b) {
      return a - b;
    });
    let min = 999999;
    let val = 0;
    array.map((value, index) => {
      var dif = array[index + 1] - value;
      if(dif < min) {
        val = index;
        min = dif;
      }
      return value;
    });

    array.splice(val, 2, (array[val] + array[parseInt(val, 10) + 1]) / 2);
    return array;
  }
  //inner workings for 'setSizeCount' method
  _updateSizeCount(count) {
    this['sizeCount'] = parseInt(count, 10);
    this._sizes = this._calculateSizeRange();
    this._data['topics'].map((value, index) => {
      this._setWordSize(value);
      return value;
    });
    this._layoutWords();
  }
  //inner workings for 'setGenerationSpeed' method
  _updateGenerationSpeed(speed) {
    this['generationSpeed'] = parseInt(speed, 10);
    this._layoutWords();
  }
  //inner workings for 'setRotationStep' method
  _updateRotationStep(step) {
    this['rotationStep'] = parseInt(step, 10);
    this._layoutWords();
  }
  //inner workings for 'setTextSize' method
  _updateTextSize(size) {
    this['textSize'] = parseInt(size, 10);
    this._targetEl.style.fontSize = this['textSize'] + 'px';
    this._layoutWords();
  }

  //PUBLIC METHODS
  /**
   * change number of different text sizes available at run time (Will regenerate the cloud)
   * @param {number} count - Maximum number of text sizes
   */
  'setSizeCount'(count) {
    if(typeof count !== 'number') {
      throw new Error('value must be a number');
    }
    clearTimeout(this._sizeDebounce);
    this._sizeDebounce = setTimeout(this._updateSizeCount.bind(this, count), 250);
  }
  /**
   * change the generation speed at run time (Will regenerate the cloud)
   * @param {number} speed - generation speed, the lower the number, the closer your words are likely to be,
   * higher numbers will generate significantly faster
   */
  'setGenerationSpeed'(speed) {
    if(typeof speed !== 'number') {
      throw new Error('value must be a number');
    }
    clearTimeout(this._generationDebounce);
    this._generationDebounce = setTimeout(this._updateGenerationSpeed.bind(this, speed), 250);
  }
  /**
   * change the rotation step side at run time (Will regenerate the cloud)
   * @param {number} step - rotation step size (in degrees), the lower the number, the closer your words are likely to be,
   * higher numbers will generate significantly faster
   */
  'setRotationStep'(step) {
    if(typeof step !== 'number') {
      throw new Error('value must be a number');
    }
    clearTimeout(this._stepDebounce);
    this._stepDebounce = setTimeout(this._updateRotationStep.bind(this, step), 250);
  }
  /**
   * change the overall text size at run time (Will regenerate the cloud)
   * @param {number} size - base font size in pixels, this number will represent the smallest word height in pixels.
   */
  'setTextSize'(size) {
    if(typeof size !== 'number') {
      throw new Error('value must be a number');
    }
    clearTimeout(this._textDebounce);
    this._textDebounce = setTimeout(this._updateTextSize.bind(this, size), 250);
  }
};

//vars
Cloudia.prototype._itemSchema = {
  'label': 'string',
    'sentimentScore': 'number',
    'sentiment': 'object',
    'volume': 'number',
    'id': 'string'
};

Cloudia.prototype._i18n = {
  'en': {
    'stats_title': 'Information on topic \"{string}\":',
      'total_mentions': 'Total Mentions: {string}',
      'positive_mentions': 'Positive Mentions: <span class="mention_positive">{string}</span>',
      'neutral_mentions': 'Neutral Mentions: <span class="mention_neutral">{string}</span>',
      'negative_mentions': 'Negative Mentions: <span class="mention_negative">{string}</span>'
  }
};

Cloudia.prototype['sizeCount'] = 6;
Cloudia.prototype['language'] = 'en';
Cloudia.prototype['generationSpeed'] = 10;
Cloudia.prototype['textSize'] = 12;
Cloudia.prototype['rotationStep'] = 20;

//Export for Closure compiler
window['Cloudia'] = Cloudia;