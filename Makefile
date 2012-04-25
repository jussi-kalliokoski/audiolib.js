AJS_VERSION ?= unreleased

OUT := lib/audiolib.js
OUT_MIN := lib/audiolib.min.js
RELEASE_TAR_GZ := audiolib.js.$(AJS_VERSION).tar.gz
RELEASE_ZIP := audiolib.js.$(AJS_VERSION).zip

SINK_JS_TARGET := src/io/sink.js
SINK_JS_DIR := dependencies/sink.js
SINK_JS := $(SINK_JS_DIR)/sink.js

all: $(OUT) $(OUT_MIN)
release: $(RELEASE_TAR_GZ) $(RELEASE_ZIP)
integrate: $(SINK_JS_TARGET)

$(OUT) $(OUT_MIN):
	grunt lint concat min

$(RELEASE_TAR_GZ): $(OUT_MIN)
	rm -rf $@
	cd lib && tar pczf $@ *.js

$(RELEASE_ZIP): $(OUT_MIN)
	rm -rf $@
	cd lib && zip $@ *.js

$(SINK_JS): $(SINK_JS_DIR)
	make -C $^

$(SINK_JS_TARGET): $(SINK_JS)
	cp $^ $@


clean:
	rm -rf lib

.PHONY: all release integrate clean
