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