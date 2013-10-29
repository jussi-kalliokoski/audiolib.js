PKG_JSON ?= ./package.json
VERSION ?= $(shell cat $(PKG_JSON) | grep --color=never version | sed "s/^.*\([0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\).*$$/\1/")

RELEASE_DIR ?= ./release
BUILD_DIR ?= ./build-essentials
SOURCE_DIR ?= ./src

NODE_MODULES ?= ./node_modules
NODE_DIR := $(RELEASE_DIR)/node
NODE_RELEASE := $(NODE_DIR)/index.js
NODE_SOURCE := $(SOURCE_DIR)/index-node.js

BROWSER_DIR := $(RELEASE_DIR)/browser
BROWSER_JS := $(BROWSER_DIR)/audiokit-$(VERSION).js
BROWSER_MIN := $(BROWSER_DIR)/audiokit-$(VERSION)-min.js
BROWSER_ZIP := $(BROWSER_DIR)/audiokit-$(VERSION).zip
BROWSER_TAR_GZ := $(BROWSER_DIR)/audiokit-$(VERSION).tar.gz
BROWSER_RELEASE := $(BROWSER_JS) $(BROWSER_MIN) $(BROWSER_ZIP) $(BROWSER_TAR_GZ)
BROWSER_SOURCE := $(SOURCE_DIR)/index-browser.js

DOCS_DIR := $(RELEASE_DIR)/documentation
DOCS_TEMPLATE := $(BUILD_DIR)/documentation/template.html
DOCS_HTML := $(DOCS_DIR)/index.html

MOCHA ?= $(NODE_MODULES)/mocha/bin/mocha
INCEPT ?= $(NODE_MODULES)/inceptionscript/bin/incept
DOCTOR_JS ?= $(NODE_MODULES)/doctor.js/bin/doctor.js
DOCGENERATOR ?= $(NODE_MODULES)/jak-docgenerator/bin/docgenerator.js
UGLIFY ?= $(NODE_MODULES)/uglify-js/bin/uglifyjs
JSHINT ?= $(NODE_MODULES)/jshint/bin/hint --config $(BUILD_DIR)/jshint/config.json

UGLIFY_FLAGS ?= -c -m


all: $(NODE_RELEASE) $(BROWSER_JS) $(DOCS_HTML)
node: $(NODE_RELEASE)
browser: $(BROWSER_RELEASE)

test: $(NODE_MODULES) $(NODE_RELEASE)
	$(MOCHA) --compilers coffee:coffee-script -R spec


$(NODE_MODULES): $(PKG_JSON)
	npm install

$(BROWSER_JS): $(BROWSER_SOURCE)
	mkdir -p $(BROWSER_DIR)
	$(INCEPT) $^ > $@
	$(JSHINT) $@ || rm $@

$(BROWSER_MIN): $(BROWSER_JS)
	$(UGLIFY) $^ $(UGLIFY_FLAGS) > $@

$(BROWSER_TAR_GZ): $(BROWSER_JS) $(BROWSER_MIN)
	rm -rf $@
	cd $(BROWSER_DIR) && tar pczf ../../$@ audiokit-${VERSION}.js audiokit-${VERSION}-min.js

$(BROWSER_ZIP): $(BROWSER_JS) $(BROWSER_MIN)
	rm -rf $@
	cd $(BROWSER_DIR) && zip ../../$@ audiokit-${VERSION}.js audiokit-${VERSION}-min.js

$(NODE_RELEASE): $(NODE_SOURCE)
	mkdir -p $(NODE_DIR)
	$(INCEPT) $^ > $@
	$(JSHINT) $@ || rm $@

$(DOCS_HTML): $(DOCS_TEMPLATE) $(BROWSER_JS)
	mkdir -p $(DOCS_DIR)
	cat $(BROWSER_JS) | $(DOCTOR_JS) | $(DOCGENERATOR) $(DOCS_TEMPLATE) > $@


clean:
	rm -rf $(RELEASE_DIR) $(NODE_MODULES)

.PHONY: all clean test node browser
