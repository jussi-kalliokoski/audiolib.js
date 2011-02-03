all:
	cat js/* > audiolib.js
	yui-compressor audiolib.js -o audiolib.min.js
