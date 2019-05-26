# autocomplete-better-generic package

This package improves upon the generic autocomplete-plus provider by using the following heuristics:

1. To increase match quality, matches are sorted by their distance from the cursor.
2. To offer longer completions, text fragments that appear twice in the source text may be offered as a completion even if the fragments contain non-word characters. Additionally, all short matches are autocompleted through an extra word.
3. To extend matches, after a match is chosen, the next fragment of text at the match source is immediately offered as a completion.

At present, only the current buffer is searched for matches.

To use this package, simply install it. This provider will be active for all files. You will probably want to disable autocomplete-plus's default provider: uncheck "Enable Built-In Provider" in the autocomplete-plus settings.

## Changelog

v1.7.0 Fix glitchy lag when typing spaces. Don't log suggestion time to developer console.
v1.6.0 Initial release.