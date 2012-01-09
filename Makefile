SOURCE := src/api-*.js src/*/*
TEMPLATES := $(SOURCE) templates/

IN := src/wrapper-start.js $(SOURCE) src/wrapper-end.js
OUT := lib/audiolib.js
DOCS := lib/docs.html
OUT_MIN := lib/audiolib.min.js
RELEASE := audiolib.js.tar.gz
PACKAGE := package.json

FFT_JS := integration/fft.js/fft.js
SINK_JS := integration/sink.js/sink.js
PCMDATA_JS := integration/pcmdata.js
FFT_APPEND := integration/append-fft.js
PCMDATA_PREPEND := integration/prepend-pcmdata.js

COMPILER := cat
MINIFIER := uglifyjs
UPDATE := ./build update


all: minify docs
update: wrappers package docs

package: $(PACKAGE)
release: $(RELEASE)
minify: $(OUT_MIN)
main: $(OUT)
docs: $(DOCS)

integrate: src/processors/fft.js src/io/pcmdata.js src/io/sink.js


wrappers: $(TEMPLATES)
	$(UPDATE) wrappers

$(OUT): $(IN)
	mkdir lib/ -p
	$(COMPILER) $^ > $@

$(RELEASE): $(OUT_MIN)
	rm -rf $@
	cd lib && tar pczf $@ *.js

$(DOCS): $(TEMPLATES)
	$(UPDATE) docs

$(PACKAGE): $(TEMPLATES)
	$(UPDATE) package

src/processors/fft.js: $(FFT_JS) $(FFT_PREPEND)
	cat $(FFT_JS) - $(FFT_PREPEND) | echo "" > $@

src/io/pcmdata.js: $(PCMDATA_JS) $(PCMDATA_APPEND)
	cat $(PCMDATA_APPEND) - $(PCMDATA_JS) | echo "" > $@

src/io/sink.js: $(SINK_JS)
	cat $^ > $@


%.min.js: %.js
	$(MINIFIER) $^ > $@

clean:
	rm lib/ -rf

.PHONY: all update package release minify main docs \
	integrate wrappers clean
