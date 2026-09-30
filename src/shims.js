import CodeMirror from "codemirror/lib/codemirror";
import Decimal from "break_eternity.js";
import Vue from "vue";

import "codemirror/addon/mode/simple";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/lint/lint";
import "codemirror/addon/selection/active-line";
import "codemirror/addon/edit/closebrackets";

window.CodeMirror = CodeMirror;
window.Decimal = Decimal;
window.Vue = Vue;

// Break_eternity.js has no largest finite value, so dInf is unsafe in gameplay
// arithmetic: multiplying two infinite values produces NaN. Use an enormous,
// finite safety ceiling instead; it is far beyond Break Infinity's old 9ee15
// limit and does not restrict ordinary Break_Eternity progression.
Decimal.dSafeMax = Decimal.fromComponents(1, 2, Number.MAX_VALUE);

// Break_eternity.js's log-family methods return NaN for an input of exactly zero, whereas
// break_infinity.js (and standard Math.log semantics) return -Infinity. This is a genuine
// behavioral divergence, not just the well-known Decimal-vs-number return type difference (which
// is fixed at each call site with .toNumber() instead, since blanket-patching that part would
// break break_eternity's own internal use of these methods). This particular zero-input case is
// safe to patch globally: break_eternity's own internals (e.g. pow()) already special-case a zero
// receiver *before* ever calling into these methods, so a zero receiver never reaches this path
// from internal library code - only from vanilla's own formulas evaluating e.g. log10(0) when a
// currency happens to be exactly zero (very common on a fresh save or after a reset).
const ZERO_INPUT_METHODS = ["log", "log10", "log2", "ln", "logarithm", "absLog10"];
for (const name of ZERO_INPUT_METHODS) {
  const staticOriginal = Decimal[name];
  if (typeof staticOriginal === "function") {
    Decimal[name] = function(value, ...rest) {
      if (Decimal.eq(value, 0)) return Decimal.dNegInf;
      return staticOriginal.call(Decimal, value, ...rest);
    };
  }
  const instanceOriginal = Decimal.prototype[name];
  if (typeof instanceOriginal === "function") {
    Decimal.prototype[name] = function(...args) {
      if (this.eq(0)) return Decimal.dNegInf;
      return instanceOriginal.apply(this, args);
    };
  }
}

// PLog10 ("positive log10") is break_infinity.js's max(0, log10(x)) - it already special-cases
// negative inputs to return 0, but for an input of exactly zero it falls through to log10(0),
// which needs to clamp to 0 here (not the -Infinity that a bare log10(0) correctly returns above).
{
  const staticOriginal = Decimal.pLog10;
  Decimal.pLog10 = function(value) {
    return Decimal.lte(value, 0) ? Decimal.dZero : staticOriginal.call(Decimal, value);
  };
  const instanceOriginal = Decimal.prototype.pLog10;
  Decimal.prototype.pLog10 = function() {
    return this.lte(0) ? Decimal.dZero : instanceOriginal.call(this);
  };
}
