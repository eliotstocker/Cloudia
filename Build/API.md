<a name="Cloudia"></a>

## Cloudia
**Kind**: global class  

* [Cloudia](#Cloudia)
    * [new Cloudia(options)](#new_Cloudia_new)
    * [.setSizeCount(count)](#Cloudia+setSizeCount)
    * [.setGenerationSpeed(speed)](#Cloudia+setGenerationSpeed)
    * [.setTextSize(size)](#Cloudia+setTextSize)

<a name="new_Cloudia_new"></a>

### new Cloudia(options)
Cloudia a simple WordCloud library By Eliot Stocker


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Options object |
| options.target | <code>HTMLElement</code> |  | Target HTML Element in which to create word cloud |
| options.data | <code>String</code> \| <code>Object</code> |  | URL, JSON String on JavaScript Object containing the data for the cloud |
| [options.textSize] | <code>number</code> | <code>12</code> | Overall text size |
| [options.ignoreBadItems] | <code>boolean</code> | <code>false</code> | Ignore items in the cloud that don't conform to the schema |
| [options.generationSpeed] | <code>number</code> | <code>10</code> | number of pixels to move at a time when trying to place words, the larger the number the quicker the cloud will be generated, but you will be more likely to get larger gaps |
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

<a name="Cloudia+setTextSize"></a>

### cloudia.setTextSize(size)
change the overall text size at run time (Will regenerate the cloud)

**Kind**: instance method of [<code>Cloudia</code>](#Cloudia)  

| Param | Type | Description |
| --- | --- | --- |
| size | <code>number</code> | base font size in pixels, this number will represent the smallest word height in pixels. |

