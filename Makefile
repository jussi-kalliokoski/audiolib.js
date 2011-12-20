SOURCE := src/api-*.js src/*/*
IN := src/wrapper-start.js $(SOURCE) src/wrapper-end.js
TEMPLATES := $(SOURCE) templates/
COMPILER := cat
MINIFIER := uglifyjs

all: lib/audiolib.min.js docs

lib/audiolib.js: $(IN)
	mkdir lib/ -p
	$(COMPILER) $^ > $@

%.min.js: %.js
	$(MINIFIER) $^ > $@ 


integrate:
	cd integration && sh integrate.sh

update: $(TEMPLATES)
	./build update all

wrappers: $(TEMPLATES)
	./build update wrappers

package: $(TEMPLATES)
	./build update package

docs: $(TEMPLATES)
	./build update docs

release: lib/audiolib.min.js
	rm -rf lib/audiolib.js/tar.gz
	cd lib && tar pczf audiolib.js.tar.gz *.js

clean:
	rm lib/ -rf
