all:
	cat js/* > audiolib.js
	yui-compressor audiolib.js -o audiolib.min.js

clean:
	rm audiolib.js audiolib.min.js -f
