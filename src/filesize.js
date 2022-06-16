"use strict";

import {strings} from "./strings";

/**
 * filesize
 *
 * @method filesize
 * @param  {Mixed}   arg        String, Int or Float to transform
 * @param  {Object}  descriptor [Optional] Flags
 * @return {String}             Readable file size String
 */
function filesize (arg, {bits = false, pad = false, base = -1, round = 2, locale = "", localeOptions = {}, separator = "", spacer = " ", symbols = {}, standard = "", output = "string", fullform = false, fullforms = [], exponent = -1, roundingMethod = "round", precision = 0} = {}) {
	let e = exponent,
		num = Number(arg),
		result = [],
		val = 0,
		u = "";

	// Sync base & standard
	if (base === -1 && standard.length === 0) {
		base = 10;
		standard = "iec";
	} else if (base === -1 && standard.length > 0) {
		standard = standard === "iec" ? "iec" : "jedec";
		base = standard === "iec" ? 10 : 2;
	} else {
		base = base === 2 ? 2 : 10;
		standard = base === 10 ? "iec" : "jedec";
	}

	const ceil = base === 10 ? 1000 : 1024,
		full = fullform === true,
		neg = num < 0,
		roundingFunc = Math[roundingMethod];

	if (isNaN(arg)) {
		throw new TypeError("Invalid number");
	}

	if (typeof roundingFunc !== "function") {
		throw new TypeError("Invalid rounding method");
	}

	// Flipping a negative number to determine the size
	if (neg) {
		num = -num;
	}

	// Determining the exponent
	if (e === -1 || isNaN(e)) {
		e = Math.floor(Math.log(num) / Math.log(ceil));

		if (e < 0) {
			e = 0;
		}
	}

	// Exceeding supported length, time to reduce & multiply
	if (e > 8) {
		if (precision > 0) {
			precision += 8 - e;
		}

		e = 8;
	}

	if (output === "exponent") {
		return e;
	}

	// Zero is now a special case because bytes divide by 1
	if (num === 0) {
		result[0] = 0;
		u = result[1] = strings.symbol[standard][bits ? "bits" : "bytes"][e];
	} else {
		val = num / (base === 2 ? Math.pow(2, e * 10) : Math.pow(1000, e));

		if (bits) {
			val = val * 8;

			if (val >= ceil && e < 8) {
				val = val / ceil;
				e++;
			}
		}

		const p = Math.pow(10, e > 0 ? round : 0);
		result[0] = roundingFunc(val * p) / p;

		if (result[0] === ceil && e < 8 && exponent === -1) {
			result[0] = 1;
			e++;
		}

		u = result[1] = strings.symbol[standard][bits ? "bits" : "bytes"][e];
	}

	// Decorating a 'diff'
	if (neg) {
		result[0] = -result[0];
	}

	// Setting optional precision
	if (precision > 0) {
		result[0] = result[0].toPrecision(precision);
	}

	// Applying custom symbol
	result[1] = symbols[result[1]] || result[1];

	if (locale === true) {
		result[0] = result[0].toLocaleString();
	} else if (locale.length > 0) {
		result[0] = result[0].toLocaleString(locale, localeOptions);
	} else if (separator.length > 0) {
		result[0] = result[0].toString().replace(".", separator);
	}

	if (pad && Number.isInteger(result[0]) === false && round > 0) {
		const x = separator || ".",
			tmp = result[0].toString().split(x),
			s = tmp[1] || "",
			l = s.length,
			n = round - l;

		result[0] = `${tmp[0]}${x}${s.padEnd(l + n, "0")}`;
	}

	if (full) {
		result[1] = fullforms[e] ? fullforms[e] : strings.fullform[standard][e] + (bits ? "bit" : "byte") + (result[0] === 1 ? "" : "s");
	}

	// Returning Array, Object, or String (default)
	return output === "array" ? result : output === "object" ? {value: result[0], symbol: result[1], exponent: e, unit: u} : result.join(spacer);
}

// Partial application for functional programming
filesize.partial = opt => arg => filesize(arg, opt);

export default filesize;
