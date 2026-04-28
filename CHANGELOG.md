# Changelog

All notable changes to this project will be documented in this file.

## [0.1.6](https://github.com/zigordev/gpool/compare/v0.1.5...v0.1.6) (2026-04-28)


### Bug Fixes

* auth issue ([#39](https://github.com/zigordev/gpool/issues/39)) ([bb5e9a0](https://github.com/zigordev/gpool/commit/bb5e9a04d551f1fac87b1fef08837f9f85551d52))

## [0.1.5](https://github.com/zigordev/gpool/compare/v0.1.4...v0.1.5) (2026-03-11)


### Features

* route gpool email notifications through kafka ([#24](https://github.com/zigordev/gpool/issues/24)) ([0f4bfca](https://github.com/zigordev/gpool/commit/0f4bfca15cc34eb7b5e5f6bff125bfd50bf2d97e))

## [0.1.4](https://github.com/zigordev/gpool/compare/v0.1.3...v0.1.4) (2026-03-11)


### Bug Fixes

* **release:** trigger release-please for deploy ([#22](https://github.com/zigordev/gpool/issues/22)) ([4b35c04](https://github.com/zigordev/gpool/commit/4b35c042f5056af1d4960c88328d709a3f41bbea))

## [0.1.3](https://github.com/zigordev/gpool/compare/v0.1.2...v0.1.3) (2026-03-11)


### Features

* unified env non secrets 20260310 ([#15](https://github.com/zigordev/gpool/issues/15)) ([c627ebd](https://github.com/zigordev/gpool/commit/c627ebd16847a232aef5de7ce136f598a3bd3b5e))


### Bug Fixes

* dockerfiles ([#18](https://github.com/zigordev/gpool/issues/18)) ([18f7240](https://github.com/zigordev/gpool/commit/18f7240508a43023227e4e4cd4d6119485ff6f64))

## [0.1.2](https://github.com/zigordev/gpool/compare/v0.1.1...v0.1.2) (2026-03-10)


### Bug Fixes

* **deploy:** accept NEXT_PUBLIC_API_BASE_URL alias ([#13](https://github.com/zigordev/gpool/issues/13)) ([e6301f3](https://github.com/zigordev/gpool/commit/e6301f3a98234820ce0a678f456e81a1f103ebc9))

## [0.1.1](https://github.com/zigordev/gpool/compare/v0.1.0...v0.1.1) (2026-03-10)


### Features

* auth service ([3901cc3](https://github.com/zigordev/gpool/commit/3901cc35246733e0326ac3cf50ae2b719e5214cb))


### Bug Fixes

* **ci:** harden runtime images and pass trivy scan ([d76e5be](https://github.com/zigordev/gpool/commit/d76e5be9e1dde1d667d3d6b654cc4421d6a5c4d0))
* **ci:** provide openbao vars for compose validation ([2d95756](https://github.com/zigordev/gpool/commit/2d95756810cd933d94ca9edc3ddad95eb4ede4ca))
* **ci:** stabilize trivy scan and include web local translations ([4e4e276](https://github.com/zigordev/gpool/commit/4e4e2766534af07e483deb44afe0cbbc5c3de205))
* **ci:** unblock audit gate and expand gpool checks ([46e246b](https://github.com/zigordev/gpool/commit/46e246b078cbd2e3edd9a68ac87156b3a6cf1f5b))
* **ui:** use secure random for rum session id ([d808cd1](https://github.com/zigordev/gpool/commit/d808cd1142201efc2f31fd844ed5c5d6d4f3cffe))

## [0.1.0] - 2026-03-02

### Added

- cv-aligned repository scaffolding for CI/CD, release automation, deploy scripts, and docker split manifests.
