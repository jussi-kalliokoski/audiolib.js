MINIFY := yui-compressor

all:
	cat js/* > audiolib.js
	${MINIFY} audiolib.js -o audiolib.min.js

clean:
	rm audiolib.js audiolib.min.js -f
