# Changelog

All notable changes to this package are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## Unreleased

## 0.1.0

### Added

- `BodyMap`: a front and back body map. Pick a region (`onSelect`, `selected`),
  show what was recorded per region (`counts`, as a neutral shade and a badge),
  or both. Every region is a named, focusable button when picking; a read-only
  map lists its counts for screen readers.
- `BODY_REGIONS`: 13 regions on each side, with stable ids. Left and right are
  the person's, and a test checks each is drawn on the correct side of the view.
- `mirrorPath`, `regionsForView` and `countLevel`, with no DOM.
- Replaces the two different body drawings in the MoleCare web app with one.
