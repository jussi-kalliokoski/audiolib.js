AJS_VERSION ?= unreleased

SOURCE := src/api-*.js src/*/*
TEMPLATES := $(SOURCE) templates/ build

IN := src/wrapper-start.js $(SOURCE) src/wrapper-end.js
OUT := lib/audiolib.js
DOCS := lib/docs.html
OUT_MIN := lib/audiolib.min.js
RELEASE_TAR_GZ := audiolib.js.$(AJS_VERSION).tar.gz
RELEASE_ZIP := audiolib.js.$(AJS_VERSION).zip
PACKAGE := package.json

SINK_JS := integration/sink.js/sink.js

COMPILER := cat
MINIFIER := uglifyjs
UPDATE := ./build update


all: minify docs
update: wrappers package docs

package: $(PACKAGE)
release: $(RELEASE_TAR_GZ) $(RELEASE_ZIP)
minify: $(OUT_MIN)
main: $(OUT)
docs: $(DOCS)

integrate: src/io/sink.js


wrappers: $(TEMPLATES)
	$(UPDATE) wrappers

$(OUT): $(IN)
	mkdir -p lib
	$(COMPILER) $^ > $@

$(RELEASE_TAR_GZ): $(OUT_MIN)
	rm -rf $@
	cd lib && tar pczf $@ *.js

$(RELEASE_ZIP): $(OUT_MIN)
	rm -rf $@
	cd lib && zip $@ *.js

$(DOCS): $(TEMPLATES)
	$(UPDATE) docs

$(PACKAGE): $(TEMPLATES)
	$(UPDATE) package

$(SINK_JS): integration/sink.js/
	cd $^ && make

src/io/sink.js: $(SINK_JS)
	cat $^ > $@


simple: # this is a simple build, doesn't require the subrepos
	mkdir -p lib
	$(COMPILER) $(IN) > $(OUT)


%.min.js: %.js
	$(MINIFIER) $^ > $@

clean:
	rm -rf lib

.PHONY: all update package release minify main docs \
	integrate wrappers clean simple
