A Super Simple Word Cloud Library for a Brandwatch Coding Task
==============================================================

Cloudia is a super simple JavaScript tag cloud library outputting pure HTML and CSS, developed for the Brandwatch front-end developer challenge

Demo
----
[Cloudia Demo using topic data from ](https://eliotstocker.github.io/Cloudia/) [Brandwatch front-end developer challenge](https://gist.github.com/grahamscott/65b43572ad18c5fbdd87)

Usage
-----
Add the Library into the head of your document:
```HTML
<script src="Cloudio.min.js"></script>
<link rel="stylesheet" href="Cloudio.min.css"/> 
```

Use the javascript library to generate the word cloud from a URL, JSON String or JavaScript Object like so:
```Javascript
//From URL
var cloud = new Cloudia({
  target: document.querySelector(".empty-div"),
  data: "https://example.com/topic-data.json"
});

//From JSON String
var cloud = new Cloudia({
  target: document.querySelector(".empty-div"),
  data: "{\"topics\":[{\"id\":\"1751295897__Berlin\",\"label\":\"Berlin\",\"volume\":165,\"sentiment\":{\"negative\":3,\"neutral\":133,\"positive\":29},\"sentimentScore\":65}]}"
});
```

Full Class Documentation:
=========================
Development
===========

it is not required that Cloudia Be built, you can run the JavaScript and Less directly in the browser, and locally install and link to the dependencies (Bellow).
The build process uses The Less and Closure Compilers to generate a smaller build with runtime dependencies baked in.

Run Time Dependencies
---------------------

These dependencies are built into Cloudia.min.js
1. [NanoAjax](https://github.com/yanatan16/nanoajax)

Build
-----

To build you must have grunt CLI installed, you install with NPM with the following command:
```
npm -g i grunt-cli
```

Once grunt cli is installed you can run the build by running:
```
npm install
npm run build
```

Full Class Documentation
========================


<a name="Cloudia"></a>

## Cloudia
Cloudia a simple WordCloud library By Eliot Stocker

**Kind**: global class  

* [Cloudia](#Cloudia)
    * [new Cloudia(options)](#new_Cloudia_new)
    * [.setSizeCount(count)](#Cloudia+setSizeCount)
    * [.setGenerationSpeed(speed)](#Cloudia+setGenerationSpeed)
    * [.setRotationStep(step)](#Cloudia+setRotationStep)
    * [.setTextSize(size)](#Cloudia+setTextSize)

<a name="new_Cloudia_new"></a>

### new Cloudia(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Options object |
| options.target | <code>HTMLElement</code> |  | Target HTML Element in which to create word cloud |
| options.data | <code>String</code> \| <code>Object</code> |  | URL, JSON String on JavaScript Object containing the data for the cloud |
| [options.textSize] | <code>number</code> | <code>12</code> | Overall text size |
| [options.ignoreBadItems] | <code>boolean</code> | <code>false</code> | Ignore items in the cloud that don't conform to the schema |
| [options.generationSpeed] | <code>number</code> | <code>10</code> | number of pixels to move at a time when trying to place words, the larger the number the quicker the cloud will be generated, but you will be more likely to get larger gaps |
| [options.rotationStep] | <code>number</code> | <code>20</code> | number of degrees to rotate each time trying to place a word, the larger the number the quicker the cloud will be generated, but you will be more likely to get larger gaps, or odd shapes |
| [options.sizeCount] | <code>number</code> | <code>6</code> | number of sizes for the words in the cloud |

<a name="Cloudia+setSizeCount"></a>

### cloudia.setSizeCount(count)
change number of different text sizes available at run time (Will regenerate the cloud)

**Kind**: instance method of [<code>Cloudia</code>](#Cloudia)  

| Param | Type | Description |
| --- | --- | --- |
| count | <code>number</code> | Maximum number of text sizes |

<a name="Cloudia+setGenerationSpeed"></a>

### cloudia.setGenerationSpeed(speed)
change the generation speed at run time (Will regenerate the cloud)

**Kind**: instance method of [<code>Cloudia</code>](#Cloudia)  

| Param | Type | Description |
| --- | --- | --- |
| speed | <code>number</code> | generation speed, the lower the number, the closer your words are likely to be, higher numbers will generate significantly faster |

<a name="Cloudia+setRotationStep"></a>

### cloudia.setRotationStep(step)
change the rotation step side at run time (Will regenerate the cloud)

**Kind**: instance method of [<code>Cloudia</code>](#Cloudia)  

| Param | Type | Description |
| --- | --- | --- |
| step | <code>number</code> | rotation step size (in degrees), the lower the number, the closer your words are likely to be, higher numbers will generate significantly faster |

<a name="Cloudia+setTextSize"></a>

### cloudia.setTextSize(size)
change the overall text size at run time (Will regenerate the cloud)

**Kind**: instance method of [<code>Cloudia</code>](#Cloudia)  

| Param | Type | Description |
| --- | --- | --- |
| size | <code>number</code> | base font size in pixels, this number will represent the smallest word height in pixels. |

