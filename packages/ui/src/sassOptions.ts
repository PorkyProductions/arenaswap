import bootstrapPkg from 'bootstrap/package.json';

// Bootstrap 5.3.x compiles through Dart Sass's legacy @import, global built-in functions, legacy
// colour functions and legacy if(), and its own docs say to ignore the warnings until a long-term
// fix lands. Every child of twbs/bootstrap#40962 is labelled v6, so that fix is the next major
// rather than a patch — hence the gate. The day bootstrap crosses it this returns {} on its own and
// anything still warning is heard again.
const bootstrapSassFixedInMajor = 6;

// quietDeps rather than silenceDeprecations because it is scoped by origin instead of by
// deprecation id: Dart Sass counts anything reached through a load path or an importer as a
// dependency, so node_modules goes quiet and our own stylesheets stay audible. An id list would
// also swallow the global-builtin and slash-div warnings our own Sass is capable of emitting.
const installedMajor = Number(bootstrapPkg.version.split('.')[0]);

export default installedMajor < bootstrapSassFixedInMajor ? { quietDeps: true } : {};
