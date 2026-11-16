.PHONY: build debug prod verify

build: debug prod

debug:
	npm run build:debug

prod:
	npm run build:prod

verify:
	npm run verify

install:
	npm install
