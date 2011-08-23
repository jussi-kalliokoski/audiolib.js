MINIFY := uglifyjs

all:
	mkdir lib -p
	cat js/wrapper-start.js js/*/* js/wrapper-end.js > lib/audiolib.js
	${MINIFY} lib/audiolib.js > lib/audiolib.min.js

integrate:
	cd integration && sh integrate.sh
