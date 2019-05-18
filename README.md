# autocomplete-better-generic package

This package improves upon the generic autocomplete-plus provider by using the following heuristics:

1. To increase match quality, matches are sorted by their distance from the cursor.
2. To offer longer completions, text fragments that appears twice in the source text may be offered as a completion even if the fragments contains non-word characters.

At present, only the current buffer is searched for matches.

To use this package, simply install it. This provider will be active for all files. You will probably want to disable autocomplete-plus's default provider: uncheck "Enable Built-In Provider" in the autocomplete-plus settings.
