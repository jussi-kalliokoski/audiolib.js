# Installation instructions

## Server side

You need to have node.js v.0.2 or higher (>=0.5.5 recommended), see http://www.nodejs.org for further information about node.js.

You'll also need npm ( see http://npmjs.org ).

After you have both, to install the latest stable version to be available in your working directory, run this in your terminal:

``

$ npm install audiolib

``

Add a ``-g`` flag to install globally.

To install from the repo, e.g. for testing purposes, run this in your terminal.

``

$ npm install /path/to/audiolib/repo/

``

## Client-side

Simply include either the minified or the full .js file on your page and you're good to go. Also works with certain package managers. Feel free to report an issue if it's not working with your preferred package manager.

``html

<script src="audiolib.js"></script>

``

Enjoy!
