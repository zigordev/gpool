# Changelog

All notable changes to this project will be documented in this file.

## [0.1.79](https://github.com/zigordev/gpool/compare/v0.1.78...v0.1.79) (2026-09-23)


### Features

* **observability:** bring RUM v2, a nonce CSP, events and render tracing to gpool-web ([#283](https://github.com/zigordev/gpool/issues/283)) ([1420983](https://github.com/zigordev/gpool/commit/14209835b8d531b2aae36b4d9ad7deace0d64b1f))

## [0.1.78](https://github.com/zigordev/gpool/compare/v0.1.77...v0.1.78) (2026-09-22)


### Features

* **observability:** events, lifecycle and domain metrics in gpool-api ([#281](https://github.com/zigordev/gpool/issues/281)) ([8d97205](https://github.com/zigordev/gpool/commit/8d97205e1b9f33904eaafe3b8c8e3f7d06f0db45))

## [0.1.77](https://github.com/zigordev/gpool/compare/v0.1.76...v0.1.77) (2026-09-21)


### Features

* **observability:** export the release as service_build_info ([#263](https://github.com/zigordev/gpool/issues/263)) ([87988f7](https://github.com/zigordev/gpool/commit/87988f7446fed3e92aa4887cbfebae4e2a1f4416))

## [0.1.76](https://github.com/zigordev/gpool/compare/v0.1.75...v0.1.76) (2026-09-21)


### Bug Fixes

* **observability:** name a trace only when it was sampled ([#261](https://github.com/zigordev/gpool/issues/261)) ([7008062](https://github.com/zigordev/gpool/commit/70080625337f308bc9a00fa15a51e91ff3e90726))

## [0.1.75](https://github.com/zigordev/gpool/compare/v0.1.74...v0.1.75) (2026-09-20)


### Bug Fixes

* **rum:** record real visits again ([#259](https://github.com/zigordev/gpool/issues/259)) ([b29fcda](https://github.com/zigordev/gpool/commit/b29fcdaaea5a9554cbdb43cb837b10e195c0c822))

## [0.1.74](https://github.com/zigordev/gpool/compare/v0.1.73...v0.1.74) (2026-09-20)


### Bug Fixes

* **lifecycle:** stop cleanly on SIGTERM and start without warnings ([#256](https://github.com/zigordev/gpool/issues/256)) ([e356cf8](https://github.com/zigordev/gpool/commit/e356cf897c325dc862c1ef38d9b4cace72545cfe))

## [0.1.73](https://github.com/zigordev/gpool/compare/v0.1.72...v0.1.73) (2026-09-16)


### Refactoring

* **pool:** drop the role parameter nothing reads ([#245](https://github.com/zigordev/gpool/issues/245)) ([8c4d7f1](https://github.com/zigordev/gpool/commit/8c4d7f1383df66fa72453dc882aef457d974d7ec))

## [0.1.72](https://github.com/zigordev/gpool/compare/v0.1.71...v0.1.72) (2026-09-15)


### Bug Fixes

* **ci:** stop format:check from gating on the generated changelog ([#242](https://github.com/zigordev/gpool/issues/242)) ([580fd8d](https://github.com/zigordev/gpool/commit/580fd8d9aeb38eac703f00d87a75f87021adb414))


### Refactoring

* **scripts:** one local-stack body with a per-repo config block ([#241](https://github.com/zigordev/gpool/issues/241)) ([9da5acf](https://github.com/zigordev/gpool/commit/9da5acf4bb49842097b6b1519bc70269df59a6ba))
* **scripts:** one shared body for the audit gate and licence check ([#239](https://github.com/zigordev/gpool/issues/239)) ([e2207f6](https://github.com/zigordev/gpool/commit/e2207f68792b1e29cdf4af37fb10d4cb28b4860a))
* **shape:** converge compose conventions, drop the terraform stub and add the web health route ([#238](https://github.com/zigordev/gpool/issues/238)) ([0d86c21](https://github.com/zigordev/gpool/commit/0d86c213f3e824fce5f0e90372d612aa26873a5b))
* **web:** rename apps/ui to apps/web ([#231](https://github.com/zigordev/gpool/issues/231)) ([a2875f4](https://github.com/zigordev/gpool/commit/a2875f4034ca357657cc451f78647f3feebd15c6))

## [0.1.71](https://github.com/zigordev/gpool/compare/v0.1.70...v0.1.71) (2026-09-09)

### Features

- **api:** send RFC 9457 problem details and declare status codes ([#218](https://github.com/zigordev/gpool/issues/218)) ([b480dc8](https://github.com/zigordev/gpool/commit/b480dc81bf3d4d24d2cc01579f89c7b2f1cbbd69))

## [0.1.70](https://github.com/zigordev/gpool/compare/v0.1.69...v0.1.70) (2026-09-09)

### Bug Fixes

- **api:** send a content security policy instead of disabling it ([#216](https://github.com/zigordev/gpool/issues/216)) ([40495ba](https://github.com/zigordev/gpool/commit/40495bada27afacada60a224abee4515b7d35bde))

## [0.1.69](https://github.com/zigordev/gpool/compare/v0.1.68...v0.1.69) (2026-09-09)

### Bug Fixes

- **docker:** track .dockerignore so every image build uses it ([#211](https://github.com/zigordev/gpool/issues/211)) ([904d572](https://github.com/zigordev/gpool/commit/904d57276ee97d63d207c557a35aff8abc8fe9cf))

## [0.1.68](https://github.com/zigordev/gpool/compare/v0.1.67...v0.1.68) (2026-09-09)

### Bug Fixes

- **deps:** take the patched multer, sharp and nodemailer ([#213](https://github.com/zigordev/gpool/issues/213)) ([f797402](https://github.com/zigordev/gpool/commit/f797402f0d3b8968512ebaa1e2a62a742fc9cbb4))

## [0.1.67](https://github.com/zigordev/gpool/compare/v0.1.66...v0.1.67) (2026-09-08)

### Bug Fixes

- **ci:** release on refactor and perf, not only feat and fix ([#208](https://github.com/zigordev/gpool/issues/208)) ([9532d88](https://github.com/zigordev/gpool/commit/9532d8845d13c929b7888ae1e60d78eb5bcbe59c))

### Refactoring

- **auth:** move Google OAuth into the API and drop the /api prefix ([#207](https://github.com/zigordev/gpool/issues/207)) ([4db1d4b](https://github.com/zigordev/gpool/commit/4db1d4b2d1e864593415f9ac10473bd913bb1caf))

## [0.1.66](https://github.com/zigordev/gpool/compare/v0.1.65...v0.1.66) (2026-09-08)

### Bug Fixes

- **deploy:** let the ECR digest lookup report why it failed ([#205](https://github.com/zigordev/gpool/issues/205)) ([f8fc415](https://github.com/zigordev/gpool/commit/f8fc415231a7c73cf7f7133c8e74bd466ecc3dc2))

## [0.1.65](https://github.com/zigordev/gpool/compare/v0.1.64...v0.1.65) (2026-09-07)

### Features

- **docker:** run the api and web under compose watch for local development ([#194](https://github.com/zigordev/gpool/issues/194)) ([78e6d5b](https://github.com/zigordev/gpool/commit/78e6d5b02016c8e3b0cd619cbf16ac08ea7cff64))

## [0.1.64](https://github.com/zigordev/gpool/compare/v0.1.63...v0.1.64) (2026-09-07)

### Bug Fixes

- **deps:** patch the grpc-scoped protobufjs, drop the redundant override ([#182](https://github.com/zigordev/gpool/issues/182)) ([d41ee04](https://github.com/zigordev/gpool/commit/d41ee04096116b97ef3cdec55968bb067e8467cd))

## [0.1.63](https://github.com/zigordev/gpool/compare/v0.1.62...v0.1.63) (2026-09-07)

### Bug Fixes

- **deps:** patch protobufjs, and move the override with it ([#180](https://github.com/zigordev/gpool/issues/180)) ([b42a89a](https://github.com/zigordev/gpool/commit/b42a89a775f9e789b5a59f607d49cf86afaa1a9e))

## [0.1.62](https://github.com/zigordev/gpool/compare/v0.1.61...v0.1.62) (2026-09-06)

### Features

- **ui:** consume design-system as a package instead of vendoring it ([#171](https://github.com/zigordev/gpool/issues/171)) ([cb4f43f](https://github.com/zigordev/gpool/commit/cb4f43f4bd1554f05d18a99f3a78800a537d4abb))

### Bug Fixes

- **ci:** merge with a PAT so push-triggered workflows still run ([#172](https://github.com/zigordev/gpool/issues/172)) ([1e10eba](https://github.com/zigordev/gpool/commit/1e10eba18164829819256350ac15076ababd56b7))

## [0.1.61](https://github.com/zigordev/gpool/compare/v0.1.60...v0.1.61) (2026-09-04)

### Bug Fixes

- **ci:** raise commitlint header-max-length to fit Dependabot titles ([#161](https://github.com/zigordev/gpool/issues/161)) ([24aa121](https://github.com/zigordev/gpool/commit/24aa12104d37a0229500b4fafe087e9c0d4ff590))

## [0.1.60](https://github.com/zigordev/gpool/compare/v0.1.59...v0.1.60) (2026-09-03)

### Bug Fixes

- **contract:** regenerate the web API client, drop the removed RUM endpoint ([9a6d3d9](https://github.com/zigordev/gpool/commit/9a6d3d9be6480f26145a326b2351a977c1d9e66d))

## [0.1.59](https://github.com/zigordev/gpool/compare/v0.1.58...v0.1.59) (2026-09-03)

### Features

- **observability:** converge on the shared health/metrics/tracing kit ([73c6ab0](https://github.com/zigordev/gpool/commit/73c6ab0a67a750ce9c4f05ec5f904047925b86e8))

### Bug Fixes

- **a11y:** raise fg-subtle/fg-faint contrast to WCAG AA ([147cb6e](https://github.com/zigordev/gpool/commit/147cb6e8d2f26de8df3e88ffd36b047eb058432f))
- **build:** consolidate on React 19, fixing the static /404 prerender crash ([44037d2](https://github.com/zigordev/gpool/commit/44037d2ad5dbfab7ff1cb75b2aee5914af999c83))
- **ci:** drop Jest-only flags from the post-Vitest-migration test:cov:api script ([8537eea](https://github.com/zigordev/gpool/commit/8537eeae08480c7c2931c043da751e00a9a38a6a))

## [0.1.58](https://github.com/zigordev/gpool/compare/v0.1.57...v0.1.58) (2026-09-02)

### Features

- **security:** set security headers and enable Dependabot ([d0acf5f](https://github.com/zigordev/gpool/commit/d0acf5f3580a012ee131107b541a9386289302d1))

## [0.1.57](https://github.com/zigordev/gpool/compare/v0.1.56...v0.1.57) (2026-09-02)

### Features

- dev-only design-system preview, side by side with gpool's kit ([6dc2c2f](https://github.com/zigordev/gpool/commit/6dc2c2fea3cfb1e19201135fdcee2c0f65b22e3e))
- **ui:** adopt design-system DateField and Table ([11b2032](https://github.com/zigordev/gpool/commit/11b2032d40265c17a21f57e1d6eb87d8675d680c))
- **ui:** my pools is the landing page, all pools is a table ([24b6c88](https://github.com/zigordev/gpool/commit/24b6c884a0fcd1ff2f84fb7af5761316df9e04d8))
- **ui:** shared sort header, pager and empty row ([2dd3b63](https://github.com/zigordev/gpool/commit/2dd3b633b1cdd800739036c0d551aaa7c8a8c627))

### Bug Fixes

- **i18n:** bound the Tolgee fetch and let message trees hold arrays ([ac62282](https://github.com/zigordev/gpool/commit/ac6228294848a2346f1d9413c288f08cc917841f))
- stop double-padding and capping the content area ([139f9ed](https://github.com/zigordev/gpool/commit/139f9ed33364fd1a6c2adab197339c17701e5901))
- **ui:** stop double-padding the content frame ([ec73ad3](https://github.com/zigordev/gpool/commit/ec73ad3dc576b52ac04368d34b91c492db20249b))

## [0.1.56](https://github.com/zigordev/gpool/compare/v0.1.55...v0.1.56) (2026-07-28)

### Features

- design system nav ([#142](https://github.com/zigordev/gpool/issues/142)) ([afe3cff](https://github.com/zigordev/gpool/commit/afe3cffa8d6220b15dc6b111fa9d6e478de8e432))

## [0.1.55](https://github.com/zigordev/gpool/compare/v0.1.54...v0.1.55) (2026-07-21)

### Features

- add third-place playoff match ([#140](https://github.com/zigordev/gpool/issues/140)) ([32ffaee](https://github.com/zigordev/gpool/commit/32ffaeecd2ef5f45d8b3d30f19429f5a4772644c))

## [0.1.54](https://github.com/zigordev/gpool/compare/v0.1.53...v0.1.54) (2026-07-01)

### Bug Fixes

- pass bracket scoring into spy final view ([95da5c7](https://github.com/zigordev/gpool/commit/95da5c758a76da3ccc83fde21762534863ab8704))

## [0.1.53](https://github.com/zigordev/gpool/compare/v0.1.52...v0.1.53) (2026-06-30)

### Bug Fixes

- parse bracket scoring values in UI ([0acb66f](https://github.com/zigordev/gpool/commit/0acb66f37e49b46bcb33ceaee4a49a700734d904))

## [0.1.52](https://github.com/zigordev/gpool/compare/v0.1.51...v0.1.52) (2026-06-30)

### Bug Fixes

- use round-specific bracket partial points ([6ed44c8](https://github.com/zigordev/gpool/commit/6ed44c86ce71d07f87db809222e2fd780eaff4dd))

## [0.1.51](https://github.com/zigordev/gpool/compare/v0.1.50...v0.1.51) (2026-06-30)

### Bug Fixes

- **api:** evaluate bracket scoring across active phases ([#135](https://github.com/zigordev/gpool/issues/135)) ([4974a37](https://github.com/zigordev/gpool/commit/4974a377f2230d87bceab98424b1514b34e59075))

## [0.1.50](https://github.com/zigordev/gpool/compare/v0.1.49...v0.1.50) (2026-06-30)

### Bug Fixes

- final phase spy UI polish ([#133](https://github.com/zigordev/gpool/issues/133)) ([5c43d57](https://github.com/zigordev/gpool/commit/5c43d5709f4fd7952577407d1fb622185d139f26))

## [0.1.49](https://github.com/zigordev/gpool/compare/v0.1.48...v0.1.49) (2026-06-29)

### Bug Fixes

- final phase upcoming match display ([759d2de](https://github.com/zigordev/gpool/commit/759d2de31e72365b7ae0ec07823f9d4b57438972))

## [0.1.48](https://github.com/zigordev/gpool/compare/v0.1.47...v0.1.48) (2026-06-29)

### Features

- add next matches to the final phase view ([fa09850](https://github.com/zigordev/gpool/commit/fa09850bac957196b51bbc4508f76d917f475cf8))

## [0.1.47](https://github.com/zigordev/gpool/compare/v0.1.46...v0.1.47) (2026-06-29)

### Bug Fixes

- materialize final phase matches on startup ([#129](https://github.com/zigordev/gpool/issues/129)) ([f8d33ca](https://github.com/zigordev/gpool/commit/f8d33cab2b23abbd4aaefa070af865fe1d23e78a))

## [0.1.46](https://github.com/zigordev/gpool/compare/v0.1.45...v0.1.46) (2026-06-28)

### Bug Fixes

- final phase wrong box points ([#127](https://github.com/zigordev/gpool/issues/127)) ([358dfef](https://github.com/zigordev/gpool/commit/358dfef58d9be0a6fa2d7aaf29049d42c6d28d62))

## [0.1.45](https://github.com/zigordev/gpool/compare/v0.1.44...v0.1.45) (2026-06-25)

### Features

- eliminated teams and players ([#125](https://github.com/zigordev/gpool/issues/125)) ([a3c45a6](https://github.com/zigordev/gpool/commit/a3c45a6150b018a430885660a03cc1e68dfcd290))

## [0.1.44](https://github.com/zigordev/gpool/compare/v0.1.43...v0.1.44) (2026-06-24)

### Features

- add theme and language switch buttons to the main sign in page ([#123](https://github.com/zigordev/gpool/issues/123)) ([124c42f](https://github.com/zigordev/gpool/commit/124c42fa66d92ccdac2c5b51832eae41263773fc))

## [0.1.43](https://github.com/zigordev/gpool/compare/v0.1.42...v0.1.43) (2026-06-23)

### Features

- penalty miss force player action ([#121](https://github.com/zigordev/gpool/issues/121)) ([3143fdc](https://github.com/zigordev/gpool/commit/3143fdc31daedf237b98254389d5a73758d656de))

## [0.1.42](https://github.com/zigordev/gpool/compare/v0.1.41...v0.1.42) (2026-06-19)

### Features

- code optimization ([#119](https://github.com/zigordev/gpool/issues/119)) ([c8c17a8](https://github.com/zigordev/gpool/commit/c8c17a8755b722ba51865ee6fa46f39db5894324))

## [0.1.41](https://github.com/zigordev/gpool/compare/v0.1.40...v0.1.41) (2026-06-19)

### Features

- code optimization ([#117](https://github.com/zigordev/gpool/issues/117)) ([de876b7](https://github.com/zigordev/gpool/commit/de876b77ca11b497b3c26d709c3c17b7067340c4))

## [0.1.40](https://github.com/zigordev/gpool/compare/v0.1.39...v0.1.40) (2026-06-19)

### Bug Fixes

- pre commit config ([#115](https://github.com/zigordev/gpool/issues/115)) ([0369f5c](https://github.com/zigordev/gpool/commit/0369f5cfa7f58a1e3b7d66dcea3a89967d12d351))

## [0.1.39](https://github.com/zigordev/gpool/compare/v0.1.38...v0.1.39) (2026-06-19)

### Bug Fixes

- pre commit config ([#113](https://github.com/zigordev/gpool/issues/113)) ([902e1d2](https://github.com/zigordev/gpool/commit/902e1d2cf6b47c859c10737b898b9d92dd848b7b))

## [0.1.38](https://github.com/zigordev/gpool/compare/v0.1.37...v0.1.38) (2026-06-19)

### Features

- centralized logs generation ([#111](https://github.com/zigordev/gpool/issues/111)) ([574d5a2](https://github.com/zigordev/gpool/commit/574d5a24ecbf4901e176e2981e50b29b52637e18))

## [0.1.37](https://github.com/zigordev/gpool/compare/v0.1.36...v0.1.37) (2026-06-18)

### Features

- ranking and group phase improvements ([#109](https://github.com/zigordev/gpool/issues/109)) ([d3a1ea8](https://github.com/zigordev/gpool/commit/d3a1ea86edbff453c0293ebf80192fca703a20ce))

## [0.1.36](https://github.com/zigordev/gpool/compare/v0.1.35...v0.1.36) (2026-06-16)

### Bug Fixes

- real standings correct tie criteria ([#107](https://github.com/zigordev/gpool/issues/107)) ([7a03951](https://github.com/zigordev/gpool/commit/7a03951c79f8bfbaee75bfc48705d1c8c7baf413))

## [0.1.35](https://github.com/zigordev/gpool/compare/v0.1.34...v0.1.35) (2026-06-16)

### Bug Fixes

- waiting for result instead of no prediction ([#105](https://github.com/zigordev/gpool/issues/105)) ([16d3171](https://github.com/zigordev/gpool/commit/16d3171853c108a516264b4309fd3026666ba668))

## [0.1.34](https://github.com/zigordev/gpool/compare/v0.1.33...v0.1.34) (2026-06-16)

### Bug Fixes

- ui issues ([#103](https://github.com/zigordev/gpool/issues/103)) ([c18de2c](https://github.com/zigordev/gpool/commit/c18de2c0ec7b0f5ae1fa8e38c47f6def0b6a6421))

## [0.1.33](https://github.com/zigordev/gpool/compare/v0.1.32...v0.1.33) (2026-06-16)

### Bug Fixes

- fix missing player in admin view ([#101](https://github.com/zigordev/gpool/issues/101)) ([d008315](https://github.com/zigordev/gpool/commit/d008315ee2c83662c08a1f6ee7c4aa9825f5228a))

## [0.1.32](https://github.com/zigordev/gpool/compare/v0.1.31...v0.1.32) (2026-06-16)

### Features

- improve model ids structure ([#99](https://github.com/zigordev/gpool/issues/99)) ([5879ceb](https://github.com/zigordev/gpool/commit/5879ceb7eef653dda656831a4007f7927a3c8e78))

## [0.1.31](https://github.com/zigordev/gpool/compare/v0.1.30...v0.1.31) (2026-06-16)

### Bug Fixes

- icons colors mismatch ([#97](https://github.com/zigordev/gpool/issues/97)) ([42db175](https://github.com/zigordev/gpool/commit/42db175cb3924c2f55ceb87795fa4c5f04cb59f5))

## [0.1.30](https://github.com/zigordev/gpool/compare/v0.1.29...v0.1.30) (2026-06-15)

### Features

- ui improvements ([#95](https://github.com/zigordev/gpool/issues/95)) ([f60026b](https://github.com/zigordev/gpool/commit/f60026b3a483ab55110a54e92d45b9b2c7446195))

## [0.1.29](https://github.com/zigordev/gpool/compare/v0.1.28...v0.1.29) (2026-06-12)

### Bug Fixes

- repeated standing warning ([#93](https://github.com/zigordev/gpool/issues/93)) ([60eda68](https://github.com/zigordev/gpool/commit/60eda680c3ef1088ec646b9ebe33946437fdd658))

## [0.1.28](https://github.com/zigordev/gpool/compare/v0.1.27...v0.1.28) (2026-06-12)

### Bug Fixes

- ui improvement ([#91](https://github.com/zigordev/gpool/issues/91)) ([69f66c5](https://github.com/zigordev/gpool/commit/69f66c53a0afb8a2c4f4bf677dab70747465f7c0))

## [0.1.27](https://github.com/zigordev/gpool/compare/v0.1.26...v0.1.27) (2026-06-12)

### Features

- add real standings ([#89](https://github.com/zigordev/gpool/issues/89)) ([494fc3f](https://github.com/zigordev/gpool/commit/494fc3f2e3183abbf9914684607764646b259304))

## [0.1.26](https://github.com/zigordev/gpool/compare/v0.1.25...v0.1.26) (2026-06-12)

### Bug Fixes

- revert pool missing count ([#87](https://github.com/zigordev/gpool/issues/87)) ([ab78f91](https://github.com/zigordev/gpool/commit/ab78f91ab15ea833dd932011dd170ef0b7423752))

## [0.1.25](https://github.com/zigordev/gpool/compare/v0.1.24...v0.1.25) (2026-06-12)

### Bug Fixes

- ui improvements ([#85](https://github.com/zigordev/gpool/issues/85)) ([b054bb1](https://github.com/zigordev/gpool/commit/b054bb1a27336e2860ec3dae2c51bfecc640941c))

## [0.1.24](https://github.com/zigordev/gpool/compare/v0.1.23...v0.1.24) (2026-06-09)

### Bug Fixes

- player actions points changeable ([#83](https://github.com/zigordev/gpool/issues/83)) ([9209fd5](https://github.com/zigordev/gpool/commit/9209fd53e8a451c8c767d09da7afdba50af92fe5))

## [0.1.23](https://github.com/zigordev/gpool/compare/v0.1.22...v0.1.23) (2026-06-09)

### Bug Fixes

- player actions points changeable ([#81](https://github.com/zigordev/gpool/issues/81)) ([0e7ab50](https://github.com/zigordev/gpool/commit/0e7ab50a36d96e2db7d9622662f474387c0552fc))

## [0.1.22](https://github.com/zigordev/gpool/compare/v0.1.21...v0.1.22) (2026-06-09)

### Features

- add match detail info and statistics ([#79](https://github.com/zigordev/gpool/issues/79)) ([19e5241](https://github.com/zigordev/gpool/commit/19e5241cb172f5b0f338084cbc56d79e0a6f4e4d))

## [0.1.21](https://github.com/zigordev/gpool/compare/v0.1.20...v0.1.21) (2026-06-08)

### Features

- usability improvements ([#77](https://github.com/zigordev/gpool/issues/77)) ([7ef137a](https://github.com/zigordev/gpool/commit/7ef137aa46d2c152bf21fa5ec7660b69a1af2d8c))

## [0.1.20](https://github.com/zigordev/gpool/compare/v0.1.19...v0.1.20) (2026-06-07)

### Features

- usability improvements ([#75](https://github.com/zigordev/gpool/issues/75)) ([888b95e](https://github.com/zigordev/gpool/commit/888b95eeddb1496a219ac0b1a9cc811eed329c2c))

## [0.1.19](https://github.com/zigordev/gpool/compare/v0.1.18...v0.1.19) (2026-06-06)

### Features

- usability improvements ([#73](https://github.com/zigordev/gpool/issues/73)) ([606a8dc](https://github.com/zigordev/gpool/commit/606a8dc903daf68e3803ecd246303a935b552185))

## [0.1.18](https://github.com/zigordev/gpool/compare/v0.1.17...v0.1.18) (2026-05-15)

### Features

- improve usability ([#71](https://github.com/zigordev/gpool/issues/71)) ([ba21019](https://github.com/zigordev/gpool/commit/ba21019a2f579a7dfc96a8425c98842d6c12fff0))

## [0.1.17](https://github.com/zigordev/gpool/compare/v0.1.16...v0.1.17) (2026-05-14)

### Features

- button to automatically set brackets ([#69](https://github.com/zigordev/gpool/issues/69)) ([2f8ce7d](https://github.com/zigordev/gpool/commit/2f8ce7d974413a4622f8b9756482710d241efee4))

## [0.1.16](https://github.com/zigordev/gpool/compare/v0.1.15...v0.1.16) (2026-05-14)

### Bug Fixes

- restore flags in bracket country selects ([#67](https://github.com/zigordev/gpool/issues/67)) ([8e52e24](https://github.com/zigordev/gpool/commit/8e52e247f70dd08d64faf8a86492bb2335c13287))

## [0.1.15](https://github.com/zigordev/gpool/compare/v0.1.14...v0.1.15) (2026-05-14)

### Features

- translate countries ([#65](https://github.com/zigordev/gpool/issues/65)) ([d2e015f](https://github.com/zigordev/gpool/commit/d2e015f0fea5960e655ef5c7b8539c57061a17bf))

## [0.1.14](https://github.com/zigordev/gpool/compare/v0.1.13...v0.1.14) (2026-05-13)

### Features

- penbao prod config ([#63](https://github.com/zigordev/gpool/issues/63)) ([229e551](https://github.com/zigordev/gpool/commit/229e551d7165fac00648550d326309ddbe60f425))

## [0.1.13](https://github.com/zigordev/gpool/compare/v0.1.12...v0.1.13) (2026-05-13)

### Bug Fixes

- form display issues ([#60](https://github.com/zigordev/gpool/issues/60)) ([6ae3539](https://github.com/zigordev/gpool/commit/6ae35397589b2024fb10e62d5b3107e99c2370bd))

## [0.1.12](https://github.com/zigordev/gpool/compare/v0.1.11...v0.1.12) (2026-05-13)

### Bug Fixes

- forms display issues ([#58](https://github.com/zigordev/gpool/issues/58)) ([e2315af](https://github.com/zigordev/gpool/commit/e2315afbc0e9c2ff42b45db9ca6aeb36cc11cee4))

## [0.1.11](https://github.com/zigordev/gpool/compare/v0.1.10...v0.1.11) (2026-05-13)

### Features

- display brackets vertically ([#56](https://github.com/zigordev/gpool/issues/56)) ([55c9f5d](https://github.com/zigordev/gpool/commit/55c9f5d5f5215117e9229140be74d7247b691220))

## [0.1.10](https://github.com/zigordev/gpool/compare/v0.1.9...v0.1.10) (2026-05-13)

### Features

- add support for english ([#54](https://github.com/zigordev/gpool/issues/54)) ([89fa70e](https://github.com/zigordev/gpool/commit/89fa70e5d250c838e57840bb0580519d2427d09b))

## [0.1.9](https://github.com/zigordev/gpool/compare/v0.1.8...v0.1.9) (2026-05-13)

### Bug Fixes

- redirect uri fixed ([#52](https://github.com/zigordev/gpool/issues/52)) ([9dcc073](https://github.com/zigordev/gpool/commit/9dcc073dcd44ce55c2d996fece3e703ee5631723))

## [0.1.8](https://github.com/zigordev/gpool/compare/v0.1.7...v0.1.8) (2026-05-13)

### Bug Fixes

- ui issues ([#50](https://github.com/zigordev/gpool/issues/50)) ([2f7d2be](https://github.com/zigordev/gpool/commit/2f7d2bed5f7b8479e56ea4f61b68ff70e064a7c7))

## [0.1.7](https://github.com/zigordev/gpool/compare/v0.1.6...v0.1.7) (2026-05-13)

### Features

- added multiple functionalities ([#48](https://github.com/zigordev/gpool/issues/48)) ([879ba5a](https://github.com/zigordev/gpool/commit/879ba5af1a07613e5979caa5044c2c3aa430a1e7))

## [0.1.6](https://github.com/zigordev/gpool/compare/v0.1.5...v0.1.6) (2026-04-28)

### Bug Fixes

- auth issue ([#39](https://github.com/zigordev/gpool/issues/39)) ([bb5e9a0](https://github.com/zigordev/gpool/commit/bb5e9a04d551f1fac87b1fef08837f9f85551d52))

## [0.1.5](https://github.com/zigordev/gpool/compare/v0.1.4...v0.1.5) (2026-03-11)

### Features

- route gpool email notifications through kafka ([#24](https://github.com/zigordev/gpool/issues/24)) ([0f4bfca](https://github.com/zigordev/gpool/commit/0f4bfca15cc34eb7b5e5f6bff125bfd50bf2d97e))

## [0.1.4](https://github.com/zigordev/gpool/compare/v0.1.3...v0.1.4) (2026-03-11)

### Bug Fixes

- **release:** trigger release-please for deploy ([#22](https://github.com/zigordev/gpool/issues/22)) ([4b35c04](https://github.com/zigordev/gpool/commit/4b35c042f5056af1d4960c88328d709a3f41bbea))

## [0.1.3](https://github.com/zigordev/gpool/compare/v0.1.2...v0.1.3) (2026-03-11)

### Features

- unified env non secrets 20260310 ([#15](https://github.com/zigordev/gpool/issues/15)) ([c627ebd](https://github.com/zigordev/gpool/commit/c627ebd16847a232aef5de7ce136f598a3bd3b5e))

### Bug Fixes

- dockerfiles ([#18](https://github.com/zigordev/gpool/issues/18)) ([18f7240](https://github.com/zigordev/gpool/commit/18f7240508a43023227e4e4cd4d6119485ff6f64))

## [0.1.2](https://github.com/zigordev/gpool/compare/v0.1.1...v0.1.2) (2026-03-10)

### Bug Fixes

- **deploy:** accept NEXT_PUBLIC_API_BASE_URL alias ([#13](https://github.com/zigordev/gpool/issues/13)) ([e6301f3](https://github.com/zigordev/gpool/commit/e6301f3a98234820ce0a678f456e81a1f103ebc9))

## [0.1.1](https://github.com/zigordev/gpool/compare/v0.1.0...v0.1.1) (2026-03-10)

### Features

- auth service ([3901cc3](https://github.com/zigordev/gpool/commit/3901cc35246733e0326ac3cf50ae2b719e5214cb))

### Bug Fixes

- **ci:** harden runtime images and pass trivy scan ([d76e5be](https://github.com/zigordev/gpool/commit/d76e5be9e1dde1d667d3d6b654cc4421d6a5c4d0))
- **ci:** provide openbao vars for compose validation ([2d95756](https://github.com/zigordev/gpool/commit/2d95756810cd933d94ca9edc3ddad95eb4ede4ca))
- **ci:** stabilize trivy scan and include web local translations ([4e4e276](https://github.com/zigordev/gpool/commit/4e4e2766534af07e483deb44afe0cbbc5c3de205))
- **ci:** unblock audit gate and expand gpool checks ([46e246b](https://github.com/zigordev/gpool/commit/46e246b078cbd2e3edd9a68ac87156b3a6cf1f5b))
- **ui:** use secure random for rum session id ([d808cd1](https://github.com/zigordev/gpool/commit/d808cd1142201efc2f31fd844ed5c5d6d4f3cffe))

## [0.1.0] - 2026-03-02

### Added

- cv-aligned repository scaffolding for CI/CD, release automation, deploy scripts, and docker split manifests.
