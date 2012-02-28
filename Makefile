REPORTER = spec
VERSION := $(shell cat package.json | grep version | grep -o '[0-9]\.[0-9]\.[0-9]')
TESTFILES := $(shell find test -name '*-test.js')

test: test-unit

test-unit:
	@./node_modules/.bin/mocha \
		--ui bdd \
		--reporter $(REPORTER) \
		--require should \
		--globals i \
		$(TESTFILES)

test-spec:
	@./node_modules/.bin/mocha \
		--ui bdd \
		--reporter $(REPORTER) \
		--require should \
		--grep "$(grep)" \
		--globals i \
		$(TESTFILES)

release:
	git tag -a v$(VERSION) -m 'release version $(VERSION)'
	git push
	git push --tags
	npm publish .

.PHONY: test test-unit test-spec release