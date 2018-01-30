"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Sizzle CSS Selector Engine
 * Copyright 2012 jQuery Foundation and other contributors
 * Released under the MIT license
 * http://sizzlejs.com/
 */
(function (window, undefined) {

	var i,
	    cachedruns,
	    Expr,
	    getText,
	    isXML,
	    compile,
	    hasDuplicate,
	    outermostContext,


	// Local document vars
	setDocument,
	    document,
	    docElem,
	    documentIsXML,
	    rbuggyQSA,
	    rbuggyMatches,
	    matches,
	    contains,
	    sortOrder,


	// Instance-specific data
	expando = "sizzle" + -new Date(),
	    preferredDoc = window.document,
	    support = {},
	    dirruns = 0,
	    done = 0,
	    classCache = createCache(),
	    tokenCache = createCache(),
	    compilerCache = createCache(),


	// General-purpose constants
	strundefined = typeof undefined === "undefined" ? "undefined" : _typeof(undefined),
	    MAX_NEGATIVE = 1 << 31,


	// Array methods
	arr = [],
	    pop = arr.pop,
	    push = arr.push,
	    slice = arr.slice,

	// Use a stripped-down indexOf if we can't use a native one
	indexOf = arr.indexOf || function (elem) {
		var i = 0,
		    len = this.length;
		for (; i < len; i++) {
			if (this[i] === elem) {
				return i;
			}
		}
		return -1;
	},


	// Regular expressions

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",

	// http://www.w3.org/TR/css3-syntax/#characters
	characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",


	// Loosely modeled on CSS identifier characters
	// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = characterEncoding.replace("w", "w#"),


	// Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
	operators = "([*^$|!~]?=)",
	    attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace + "*(?:" + operators + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",


	// Prefer arguments quoted,
	//   then not containing pseudos/brackets,
	//   then attribute selectors/non-parenthetical expressions,
	//   then anything else
	// These preferences are here to reduce the number of selectors
	//   needing tokenize in the PSEUDO preFilter
	pseudos = ":(" + characterEncoding + ")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|" + attributes.replace(3, 8) + ")*)|.*)\\)|)",


	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rtrim = new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g"),
	    rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*"),
	    rcombinators = new RegExp("^" + whitespace + "*([\\x20\\t\\r\\n\\f>+~])" + whitespace + "*"),
	    rpseudo = new RegExp(pseudos),
	    ridentifier = new RegExp("^" + identifier + "$"),
	    matchExpr = {
		"ID": new RegExp("^#(" + characterEncoding + ")"),
		"CLASS": new RegExp("^\\.(" + characterEncoding + ")"),
		"NAME": new RegExp("^\\[name=['\"]?(" + characterEncoding + ")['\"]?\\]"),
		"TAG": new RegExp("^(" + characterEncoding.replace("w", "w*") + ")"),
		"ATTR": new RegExp("^" + attributes),
		"PSEUDO": new RegExp("^" + pseudos),
		"CHILD": new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i"),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")
	},
	    rsibling = /[\x20\t\r\n\f]*[+~]/,
	    rnative = /^[^{]+\{\s*\[native code/,


	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
	    rinputs = /^(?:input|select|textarea|button)$/i,
	    rheader = /^h\d$/i,
	    rescape = /'|\\/g,
	    rattributeQuotes = /\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,


	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = /\\([\da-fA-F]{1,6}[\x20\t\r\n\f]?|.)/g,
	    funescape = function funescape(_, escaped) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		return high !== high ? escaped :
		// BMP codepoint
		high < 0 ? String.fromCharCode(high + 0x10000) :
		// Supplemental Plane codepoint (surrogate pair)
		String.fromCharCode(high >> 10 | 0xD800, high & 0x3FF | 0xDC00);
	};

	// Use a stripped-down slice if we can't use a native one
	try {
		slice.call(preferredDoc.documentElement.childNodes, 0)[0].nodeType;
	} catch (e) {
		slice = function slice(i) {
			var elem,
			    results = [];
			while (elem = this[i++]) {
				results.push(elem);
			}
			return results;
		};
	}

	/**
  * For feature detection
  * @param {Function} fn The function to test for native support
  */
	function isNative(fn) {
		return rnative.test(fn + "");
	}

	/**
  * Create key-value caches of limited size
  * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
  *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
  *	deleting the oldest entry
  */
	function createCache() {
		var _cache,
		    keys = [];

		return _cache = function cache(key, value) {
			// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
			if (keys.push(key += " ") > Expr.cacheLength) {
				// Only keep the most recent entries
				delete _cache[keys.shift()];
			}
			return _cache[key] = value;
		};
	}

	/**
  * Mark a function for special use by Sizzle
  * @param {Function} fn The function to mark
  */
	function markFunction(fn) {
		fn[expando] = true;
		return fn;
	}

	/**
  * Support testing using an element
  * @param {Function} fn Passed the created div and expects a boolean result
  */
	function assert(fn) {
		var div = document.createElement("div");

		try {
			return fn(div);
		} catch (e) {
			return false;
		} finally {
			// release memory in IE
			div = null;
		}
	}

	function Sizzle(selector, context, results, seed) {
		var match, elem, m, nodeType,
		// QSA vars
		i, groups, old, nid, newContext, newSelector;

		if ((context ? context.ownerDocument || context : preferredDoc) !== document) {
			setDocument(context);
		}

		context = context || document;
		results = results || [];

		if (!selector || typeof selector !== "string") {
			return results;
		}

		if ((nodeType = context.nodeType) !== 1 && nodeType !== 9) {
			return [];
		}

		if (!documentIsXML && !seed) {

			// Shortcuts
			if (match = rquickExpr.exec(selector)) {
				// Speed-up: Sizzle("#ID")
				if (m = match[1]) {
					if (nodeType === 9) {
						elem = context.getElementById(m);
						// Check parentNode to catch when Blackberry 4.6 returns
						// nodes that are no longer in the document #6963
						if (elem && elem.parentNode) {
							// Handle the case where IE, Opera, and Webkit return items
							// by name instead of ID
							if (elem.id === m) {
								results.push(elem);
								return results;
							}
						} else {
							return results;
						}
					} else {
						// Context is not a document
						if (context.ownerDocument && (elem = context.ownerDocument.getElementById(m)) && contains(context, elem) && elem.id === m) {
							results.push(elem);
							return results;
						}
					}

					// Speed-up: Sizzle("TAG")
				} else if (match[2]) {
					push.apply(results, slice.call(context.getElementsByTagName(selector), 0));
					return results;

					// Speed-up: Sizzle(".CLASS")
				} else if ((m = match[3]) && support.getByClassName && context.getElementsByClassName) {
					push.apply(results, slice.call(context.getElementsByClassName(m), 0));
					return results;
				}
			}

			// QSA path
			if (support.qsa && !rbuggyQSA.test(selector)) {
				old = true;
				nid = expando;
				newContext = context;
				newSelector = nodeType === 9 && selector;

				// qSA works strangely on Element-rooted queries
				// We can work around this by specifying an extra ID on the root
				// and working up from there (Thanks to Andrew Dupont for the technique)
				// IE 8 doesn't work on object elements
				if (nodeType === 1 && context.nodeName.toLowerCase() !== "object") {
					groups = tokenize(selector);

					if (old = context.getAttribute("id")) {
						nid = old.replace(rescape, "\\$&");
					} else {
						context.setAttribute("id", nid);
					}
					nid = "[id='" + nid + "'] ";

					i = groups.length;
					while (i--) {
						groups[i] = nid + toSelector(groups[i]);
					}
					newContext = rsibling.test(selector) && context.parentNode || context;
					newSelector = groups.join(",");
				}

				if (newSelector) {
					try {
						push.apply(results, slice.call(newContext.querySelectorAll(newSelector), 0));
						return results;
					} catch (qsaError) {} finally {
						if (!old) {
							context.removeAttribute("id");
						}
					}
				}
			}
		}

		// All others
		return select(selector.replace(rtrim, "$1"), context, results, seed);
	}

	/**
  * Detect xml
  * @param {Element|Object} elem An element or a document
  */
	isXML = Sizzle.isXML = function (elem) {
		// documentElement is verified for cases where it doesn't yet exist
		// (such as loading iframes in IE - #4833)
		var documentElement = elem && (elem.ownerDocument || elem).documentElement;
		return documentElement ? documentElement.nodeName !== "HTML" : false;
	};

	/**
  * Sets document-related variables once based on the current document
  * @param {Element|Object} [doc] An element or document object to use to set the document
  * @returns {Object} Returns the current document
  */
	setDocument = Sizzle.setDocument = function (node) {
		var doc = node ? node.ownerDocument || node : preferredDoc;

		// If no document and documentElement is available, return
		if (doc === document || doc.nodeType !== 9 || !doc.documentElement) {
			return document;
		}

		// Set our document
		document = doc;
		docElem = doc.documentElement;

		// Support tests
		documentIsXML = isXML(doc);

		// Check if getElementsByTagName("*") returns only elements
		support.tagNameNoComments = assert(function (div) {
			div.appendChild(doc.createComment(""));
			return !div.getElementsByTagName("*").length;
		});

		// Check if attributes should be retrieved by attribute nodes
		support.attributes = assert(function (div) {
			div.innerHTML = "<select></select>";
			var type = _typeof(div.lastChild.getAttribute("multiple"));
			// IE8 returns a string for some attributes even when not present
			return type !== "boolean" && type !== "string";
		});

		// Check if getElementsByClassName can be trusted
		support.getByClassName = assert(function (div) {
			// Opera can't find a second classname (in 9.6)
			div.innerHTML = "<div class='hidden e'></div><div class='hidden'></div>";
			if (!div.getElementsByClassName || !div.getElementsByClassName("e").length) {
				return false;
			}

			// Safari 3.2 caches class attributes and doesn't catch changes
			div.lastChild.className = "e";
			return div.getElementsByClassName("e").length === 2;
		});

		// Check if getElementById returns elements by name
		// Check if getElementsByName privileges form controls or returns elements by ID
		support.getByName = assert(function (div) {
			// Inject content
			div.id = expando + 0;
			div.innerHTML = "<a name='" + expando + "'></a><div name='" + expando + "'></div>";
			docElem.insertBefore(div, docElem.firstChild);

			// Test
			var pass = doc.getElementsByName &&
			// buggy browsers will return fewer than the correct 2
			doc.getElementsByName(expando).length === 2 +
			// buggy browsers will return more than the correct 0
			doc.getElementsByName(expando + 0).length;
			support.getIdNotName = !doc.getElementById(expando);

			// Cleanup
			docElem.removeChild(div);

			return pass;
		});

		// IE6/7 return modified attributes
		Expr.attrHandle = assert(function (div) {
			div.innerHTML = "<a href='#'></a>";
			return div.firstChild && _typeof(div.firstChild.getAttribute) !== strundefined && div.firstChild.getAttribute("href") === "#";
		}) ? {} : {
			"href": function href(elem) {
				return elem.getAttribute("href", 2);
			},
			"type": function type(elem) {
				return elem.getAttribute("type");
			}
		};

		// ID find and filter
		if (support.getIdNotName) {
			Expr.find["ID"] = function (id, context) {
				if (_typeof(context.getElementById) !== strundefined && !documentIsXML) {
					var m = context.getElementById(id);
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					return m && m.parentNode ? [m] : [];
				}
			};
			Expr.filter["ID"] = function (id) {
				var attrId = id.replace(runescape, funescape);
				return function (elem) {
					return elem.getAttribute("id") === attrId;
				};
			};
		} else {
			Expr.find["ID"] = function (id, context) {
				if (_typeof(context.getElementById) !== strundefined && !documentIsXML) {
					var m = context.getElementById(id);

					return m ? m.id === id || _typeof(m.getAttributeNode) !== strundefined && m.getAttributeNode("id").value === id ? [m] : undefined : [];
				}
			};
			Expr.filter["ID"] = function (id) {
				var attrId = id.replace(runescape, funescape);
				return function (elem) {
					var node = _typeof(elem.getAttributeNode) !== strundefined && elem.getAttributeNode("id");
					return node && node.value === attrId;
				};
			};
		}

		// Tag
		Expr.find["TAG"] = support.tagNameNoComments ? function (tag, context) {
			if (_typeof(context.getElementsByTagName) !== strundefined) {
				return context.getElementsByTagName(tag);
			}
		} : function (tag, context) {
			var elem,
			    tmp = [],
			    i = 0,
			    results = context.getElementsByTagName(tag);

			// Filter out possible comments
			if (tag === "*") {
				while (elem = results[i++]) {
					if (elem.nodeType === 1) {
						tmp.push(elem);
					}
				}

				return tmp;
			}
			return results;
		};

		// Name
		Expr.find["NAME"] = support.getByName && function (tag, context) {
			if (_typeof(context.getElementsByName) !== strundefined) {
				return context.getElementsByName(name);
			}
		};

		// Class
		Expr.find["CLASS"] = support.getByClassName && function (className, context) {
			if (_typeof(context.getElementsByClassName) !== strundefined && !documentIsXML) {
				return context.getElementsByClassName(className);
			}
		};

		// QSA and matchesSelector support

		// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
		rbuggyMatches = [];

		// qSa(:focus) reports false when true (Chrome 21),
		// no need to also add to buggyMatches since matches checks buggyQSA
		// A support test would require too much code (would include document ready)
		rbuggyQSA = [":focus"];

		if (support.qsa = isNative(doc.querySelectorAll)) {
			// Build QSA regex
			// Regex strategy adopted from Diego Perini
			assert(function (div) {
				// Select is set to empty string on purpose
				// This is to test IE's treatment of not explictly
				// setting a boolean content attribute,
				// since its presence should be enough
				// http://bugs.jquery.com/ticket/12359
				div.innerHTML = "<select><option selected=''></option></select>";

				// IE8 - Some boolean attributes are not treated correctly
				if (!div.querySelectorAll("[selected]").length) {
					rbuggyQSA.push("\\[" + whitespace + "*(?:checked|disabled|ismap|multiple|readonly|selected|value)");
				}

				// Webkit/Opera - :checked should return selected option elements
				// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
				// IE8 throws error here and will not see later tests
				if (!div.querySelectorAll(":checked").length) {
					rbuggyQSA.push(":checked");
				}
			});

			assert(function (div) {

				// Opera 10-12/IE8 - ^= $= *= and empty values
				// Should not select anything
				div.innerHTML = "<input type='hidden' i=''/>";
				if (div.querySelectorAll("[i^='']").length) {
					rbuggyQSA.push("[*^$]=" + whitespace + "*(?:\"\"|'')");
				}

				// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
				// IE8 throws error here and will not see later tests
				if (!div.querySelectorAll(":enabled").length) {
					rbuggyQSA.push(":enabled", ":disabled");
				}

				// Opera 10-11 does not throw on post-comma invalid pseudos
				div.querySelectorAll("*,:x");
				rbuggyQSA.push(",.*:");
			});
		}

		if (support.matchesSelector = isNative(matches = docElem.matchesSelector || docElem.mozMatchesSelector || docElem.webkitMatchesSelector || docElem.oMatchesSelector || docElem.msMatchesSelector)) {

			assert(function (div) {
				// Check to see if it's possible to do matchesSelector
				// on a disconnected node (IE 9)
				support.disconnectedMatch = matches.call(div, "div");

				// This should fail with an exception
				// Gecko does not error, returns false instead
				matches.call(div, "[s!='']:x");
				rbuggyMatches.push("!=", pseudos);
			});
		}

		rbuggyQSA = new RegExp(rbuggyQSA.join("|"));
		rbuggyMatches = rbuggyMatches.length && new RegExp(rbuggyMatches.join("|"));

		// Element contains another
		// Purposefully does not implement inclusive descendent
		// As in, an element does not contain itself
		contains = isNative(docElem.contains) || docElem.compareDocumentPosition ? function (a, b) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
			    bup = b && b.parentNode;
			return a === bup || !!(bup && bup.nodeType === 1 && (adown.contains ? adown.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));
		} : function (a, b) {
			if (b) {
				while (b = b.parentNode) {
					if (b === a) {
						return true;
					}
				}
			}
			return false;
		};

		// Document order sorting
		sortOrder = docElem.compareDocumentPosition ? function (a, b) {
			var compare;

			if (a === b) {
				hasDuplicate = true;
				return 0;
			}

			if (compare = b.compareDocumentPosition && a.compareDocumentPosition && a.compareDocumentPosition(b)) {
				if (compare & 1 || a.parentNode && a.parentNode.nodeType === 11) {
					if (a === doc || contains(preferredDoc, a)) {
						return -1;
					}
					if (b === doc || contains(preferredDoc, b)) {
						return 1;
					}
					return 0;
				}
				return compare & 4 ? -1 : 1;
			}

			return a.compareDocumentPosition ? -1 : 1;
		} : function (a, b) {
			var cur,
			    i = 0,
			    aup = a.parentNode,
			    bup = b.parentNode,
			    ap = [a],
			    bp = [b];

			// Exit early if the nodes are identical
			if (a === b) {
				hasDuplicate = true;
				return 0;

				// Parentless nodes are either documents or disconnected
			} else if (!aup || !bup) {
				return a === doc ? -1 : b === doc ? 1 : aup ? -1 : bup ? 1 : 0;

				// If the nodes are siblings, we can do a quick check
			} else if (aup === bup) {
				return siblingCheck(a, b);
			}

			// Otherwise we need full lists of their ancestors for comparison
			cur = a;
			while (cur = cur.parentNode) {
				ap.unshift(cur);
			}
			cur = b;
			while (cur = cur.parentNode) {
				bp.unshift(cur);
			}

			// Walk down the tree looking for a discrepancy
			while (ap[i] === bp[i]) {
				i++;
			}

			return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck(ap[i], bp[i]) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 : bp[i] === preferredDoc ? 1 : 0;
		};

		// Always assume the presence of duplicates if sort doesn't
		// pass them to our comparison function (as in Google Chrome).
		hasDuplicate = false;
		[0, 0].sort(sortOrder);
		support.detectDuplicates = hasDuplicate;

		return document;
	};

	Sizzle.matches = function (expr, elements) {
		return Sizzle(expr, null, null, elements);
	};

	Sizzle.matchesSelector = function (elem, expr) {
		// Set document vars if needed
		if ((elem.ownerDocument || elem) !== document) {
			setDocument(elem);
		}

		// Make sure that attribute selectors are quoted
		expr = expr.replace(rattributeQuotes, "='$1']");

		// rbuggyQSA always contains :focus, so no need for an existence check
		if (support.matchesSelector && !documentIsXML && (!rbuggyMatches || !rbuggyMatches.test(expr)) && !rbuggyQSA.test(expr)) {
			try {
				var ret = matches.call(elem, expr);

				// IE 9's matchesSelector returns false on disconnected nodes
				if (ret || support.disconnectedMatch ||
				// As well, disconnected nodes are said to be in a document
				// fragment in IE 9
				elem.document && elem.document.nodeType !== 11) {
					return ret;
				}
			} catch (e) {}
		}

		return Sizzle(expr, document, null, [elem]).length > 0;
	};

	Sizzle.contains = function (context, elem) {
		// Set document vars if needed
		if ((context.ownerDocument || context) !== document) {
			setDocument(context);
		}
		return contains(context, elem);
	};

	Sizzle.attr = function (elem, name) {
		var val;

		// Set document vars if needed
		if ((elem.ownerDocument || elem) !== document) {
			setDocument(elem);
		}

		if (!documentIsXML) {
			name = name.toLowerCase();
		}
		if (val = Expr.attrHandle[name]) {
			return val(elem);
		}
		if (documentIsXML || support.attributes) {
			return elem.getAttribute(name);
		}
		return ((val = elem.getAttributeNode(name)) || elem.getAttribute(name)) && elem[name] === true ? name : val && val.specified ? val.value : null;
	};

	Sizzle.error = function (msg) {
		throw new Error("Syntax error, unrecognized expression: " + msg);
	};

	// Document sorting and removing duplicates
	Sizzle.uniqueSort = function (results) {
		var elem,
		    duplicates = [],
		    i = 1,
		    j = 0;

		// Unless we *know* we can detect duplicates, assume their presence
		hasDuplicate = !support.detectDuplicates;
		results.sort(sortOrder);

		if (hasDuplicate) {
			for (; elem = results[i]; i++) {
				if (elem === results[i - 1]) {
					j = duplicates.push(i);
				}
			}
			while (j--) {
				results.splice(duplicates[j], 1);
			}
		}

		return results;
	};

	function siblingCheck(a, b) {
		var cur = b && a,
		    diff = cur && (~b.sourceIndex || MAX_NEGATIVE) - (~a.sourceIndex || MAX_NEGATIVE);

		// Use IE sourceIndex if available on both nodes
		if (diff) {
			return diff;
		}

		// Check if b follows a
		if (cur) {
			while (cur = cur.nextSibling) {
				if (cur === b) {
					return -1;
				}
			}
		}

		return a ? 1 : -1;
	}

	// Returns a function to use in pseudos for input types
	function createInputPseudo(type) {
		return function (elem) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === type;
		};
	}

	// Returns a function to use in pseudos for buttons
	function createButtonPseudo(type) {
		return function (elem) {
			var name = elem.nodeName.toLowerCase();
			return (name === "input" || name === "button") && elem.type === type;
		};
	}

	// Returns a function to use in pseudos for positionals
	function createPositionalPseudo(fn) {
		return markFunction(function (argument) {
			argument = +argument;
			return markFunction(function (seed, matches) {
				var j,
				    matchIndexes = fn([], seed.length, argument),
				    i = matchIndexes.length;

				// Match elements found at the specified indexes
				while (i--) {
					if (seed[j = matchIndexes[i]]) {
						seed[j] = !(matches[j] = seed[j]);
					}
				}
			});
		});
	}

	/**
  * Utility function for retrieving the text value of an array of DOM nodes
  * @param {Array|Element} elem
  */
	getText = Sizzle.getText = function (elem) {
		var node,
		    ret = "",
		    i = 0,
		    nodeType = elem.nodeType;

		if (!nodeType) {
			// If no nodeType, this is expected to be an array
			for (; node = elem[i]; i++) {
				// Do not traverse comment nodes
				ret += getText(node);
			}
		} else if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
			// Use textContent for elements
			// innerText usage removed for consistency of new lines (see #11153)
			if (typeof elem.textContent === "string") {
				return elem.textContent;
			} else {
				// Traverse its children
				for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
					ret += getText(elem);
				}
			}
		} else if (nodeType === 3 || nodeType === 4) {
			return elem.nodeValue;
		}
		// Do not include comment or processing instruction nodes

		return ret;
	};

	Expr = Sizzle.selectors = {

		// Can be adjusted by the user
		cacheLength: 50,

		createPseudo: markFunction,

		match: matchExpr,

		find: {},

		relative: {
			">": { dir: "parentNode", first: true },
			" ": { dir: "parentNode" },
			"+": { dir: "previousSibling", first: true },
			"~": { dir: "previousSibling" }
		},

		preFilter: {
			"ATTR": function ATTR(match) {
				match[1] = match[1].replace(runescape, funescape);

				// Move the given value to match[3] whether quoted or unquoted
				match[3] = (match[4] || match[5] || "").replace(runescape, funescape);

				if (match[2] === "~=") {
					match[3] = " " + match[3] + " ";
				}

				return match.slice(0, 4);
			},

			"CHILD": function CHILD(match) {
				/* matches from matchExpr["CHILD"]
    	1 type (only|nth|...)
    	2 what (child|of-type)
    	3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
    	4 xn-component of xn+y argument ([+-]?\d*n|)
    	5 sign of xn-component
    	6 x of xn-component
    	7 sign of y-component
    	8 y of y-component
    */
				match[1] = match[1].toLowerCase();

				if (match[1].slice(0, 3) === "nth") {
					// nth-* requires argument
					if (!match[3]) {
						Sizzle.error(match[0]);
					}

					// numeric x and y parameters for Expr.filter.CHILD
					// remember that false/true cast respectively to 0/1
					match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === "even" || match[3] === "odd"));
					match[5] = +(match[7] + match[8] || match[3] === "odd");

					// other types prohibit arguments
				} else if (match[3]) {
					Sizzle.error(match[0]);
				}

				return match;
			},

			"PSEUDO": function PSEUDO(match) {
				var excess,
				    unquoted = !match[5] && match[2];

				if (matchExpr["CHILD"].test(match[0])) {
					return null;
				}

				// Accept quoted arguments as-is
				if (match[4]) {
					match[2] = match[4];

					// Strip excess characters from unquoted arguments
				} else if (unquoted && rpseudo.test(unquoted) && (
				// Get excess from tokenize (recursively)
				excess = tokenize(unquoted, true)) && (
				// advance to the next closing parenthesis
				excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length)) {

					// excess is a negative index
					match[0] = match[0].slice(0, excess);
					match[2] = unquoted.slice(0, excess);
				}

				// Return only captures needed by the pseudo filter method (type and argument)
				return match.slice(0, 3);
			}
		},

		filter: {

			"TAG": function TAG(nodeName) {
				if (nodeName === "*") {
					return function () {
						return true;
					};
				}

				nodeName = nodeName.replace(runescape, funescape).toLowerCase();
				return function (elem) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
			},

			"CLASS": function CLASS(className) {
				var pattern = classCache[className + " "];

				return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function (elem) {
					return pattern.test(elem.className || _typeof(elem.getAttribute) !== strundefined && elem.getAttribute("class") || "");
				});
			},

			"ATTR": function ATTR(name, operator, check) {
				return function (elem) {
					var result = Sizzle.attr(elem, name);

					if (result == null) {
						return operator === "!=";
					}
					if (!operator) {
						return true;
					}

					result += "";

					return operator === "=" ? result === check : operator === "!=" ? result !== check : operator === "^=" ? check && result.indexOf(check) === 0 : operator === "*=" ? check && result.indexOf(check) > -1 : operator === "$=" ? check && result.slice(-check.length) === check : operator === "~=" ? (" " + result + " ").indexOf(check) > -1 : operator === "|=" ? result === check || result.slice(0, check.length + 1) === check + "-" : false;
				};
			},

			"CHILD": function CHILD(type, what, argument, first, last) {
				var simple = type.slice(0, 3) !== "nth",
				    forward = type.slice(-4) !== "last",
				    ofType = what === "of-type";

				return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function (elem) {
					return !!elem.parentNode;
				} : function (elem, context, xml) {
					var cache,
					    outerCache,
					    node,
					    diff,
					    nodeIndex,
					    start,
					    dir = simple !== forward ? "nextSibling" : "previousSibling",
					    parent = elem.parentNode,
					    name = ofType && elem.nodeName.toLowerCase(),
					    useCache = !xml && !ofType;

					if (parent) {

						// :(first|last|only)-(child|of-type)
						if (simple) {
							while (dir) {
								node = elem;
								while (node = node[dir]) {
									if (ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) {
										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [forward ? parent.firstChild : parent.lastChild];

						// non-xml :nth-child(...) stores cache data on `parent`
						if (forward && useCache) {
							// Seek `elem` from a previously-cached index
							outerCache = parent[expando] || (parent[expando] = {});
							cache = outerCache[type] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[nodeIndex];

							while (node = ++nodeIndex && node && node[dir] || (

							// Fallback to seeking `elem` from the start
							diff = nodeIndex = 0) || start.pop()) {

								// When found, cache indexes on `parent` and break
								if (node.nodeType === 1 && ++diff && node === elem) {
									outerCache[type] = [dirruns, nodeIndex, diff];
									break;
								}
							}

							// Use previously-cached element index if available
						} else if (useCache && (cache = (elem[expando] || (elem[expando] = {}))[type]) && cache[0] === dirruns) {
							diff = cache[1];

							// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
						} else {
							// Use the same loop as above to seek `elem` from the start
							while (node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) {

								if ((ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) && ++diff) {
									// Cache the index of each encountered element
									if (useCache) {
										(node[expando] || (node[expando] = {}))[type] = [dirruns, diff];
									}

									if (node === elem) {
										break;
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || diff % first === 0 && diff / first >= 0;
					}
				};
			},

			"PSEUDO": function PSEUDO(pseudo, argument) {
				// pseudo-class names are case-insensitive
				// http://www.w3.org/TR/selectors/#pseudo-classes
				// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
				// Remember that setFilters inherits from pseudos
				var args,
				    fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || Sizzle.error("unsupported pseudo: " + pseudo);

				// The user may use createPseudo to indicate that
				// arguments are needed to create the filter function
				// just as Sizzle does
				if (fn[expando]) {
					return fn(argument);
				}

				// But maintain support for old signatures
				if (fn.length > 1) {
					args = [pseudo, pseudo, "", argument];
					return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase()) ? markFunction(function (seed, matches) {
						var idx,
						    matched = fn(seed, argument),
						    i = matched.length;
						while (i--) {
							idx = indexOf.call(seed, matched[i]);
							seed[idx] = !(matches[idx] = matched[i]);
						}
					}) : function (elem) {
						return fn(elem, 0, args);
					};
				}

				return fn;
			}
		},

		pseudos: {
			// Potentially complex pseudos
			"not": markFunction(function (selector) {
				// Trim the selector passed to compile
				// to avoid treating leading and trailing
				// spaces as combinators
				var input = [],
				    results = [],
				    matcher = compile(selector.replace(rtrim, "$1"));

				return matcher[expando] ? markFunction(function (seed, matches, context, xml) {
					var elem,
					    unmatched = matcher(seed, null, xml, []),
					    i = seed.length;

					// Match elements unmatched by `matcher`
					while (i--) {
						if (elem = unmatched[i]) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) : function (elem, context, xml) {
					input[0] = elem;
					matcher(input, null, xml, results);
					return !results.pop();
				};
			}),

			"has": markFunction(function (selector) {
				return function (elem) {
					return Sizzle(selector, elem).length > 0;
				};
			}),

			"contains": markFunction(function (text) {
				return function (elem) {
					return (elem.textContent || elem.innerText || getText(elem)).indexOf(text) > -1;
				};
			}),

			// "Whether an element is represented by a :lang() selector
			// is based solely on the element's language value
			// being equal to the identifier C,
			// or beginning with the identifier C immediately followed by "-".
			// The matching of C against the element's language value is performed case-insensitively.
			// The identifier C does not have to be a valid language name."
			// http://www.w3.org/TR/selectors/#lang-pseudo
			"lang": markFunction(function (lang) {
				// lang value must be a valid identifider
				if (!ridentifier.test(lang || "")) {
					Sizzle.error("unsupported lang: " + lang);
				}
				lang = lang.replace(runescape, funescape).toLowerCase();
				return function (elem) {
					var elemLang;
					do {
						if (elemLang = documentIsXML ? elem.getAttribute("xml:lang") || elem.getAttribute("lang") : elem.lang) {

							elemLang = elemLang.toLowerCase();
							return elemLang === lang || elemLang.indexOf(lang + "-") === 0;
						}
					} while ((elem = elem.parentNode) && elem.nodeType === 1);
					return false;
				};
			}),

			// Miscellaneous
			"target": function target(elem) {
				var hash = window.location && window.location.hash;
				return hash && hash.slice(1) === elem.id;
			},

			"root": function root(elem) {
				return elem === docElem;
			},

			"focus": function focus(elem) {
				return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
			},

			// Boolean properties
			"enabled": function enabled(elem) {
				return elem.disabled === false;
			},

			"disabled": function disabled(elem) {
				return elem.disabled === true;
			},

			"checked": function checked(elem) {
				// In CSS3, :checked should return both checked and selected elements
				// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
				var nodeName = elem.nodeName.toLowerCase();
				return nodeName === "input" && !!elem.checked || nodeName === "option" && !!elem.selected;
			},

			"selected": function selected(elem) {
				// Accessing this property makes selected-by-default
				// options in Safari work properly
				if (elem.parentNode) {
					elem.parentNode.selectedIndex;
				}

				return elem.selected === true;
			},

			// Contents
			"empty": function empty(elem) {
				// http://www.w3.org/TR/selectors/#empty-pseudo
				// :empty is only affected by element nodes and content nodes(including text(3), cdata(4)),
				//   not comment, processing instructions, or others
				// Thanks to Diego Perini for the nodeName shortcut
				//   Greater than "@" means alpha characters (specifically not starting with "#" or "?")
				for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
					if (elem.nodeName > "@" || elem.nodeType === 3 || elem.nodeType === 4) {
						return false;
					}
				}
				return true;
			},

			"parent": function parent(elem) {
				return !Expr.pseudos["empty"](elem);
			},

			// Element/input types
			"header": function header(elem) {
				return rheader.test(elem.nodeName);
			},

			"input": function input(elem) {
				return rinputs.test(elem.nodeName);
			},

			"button": function button(elem) {
				var name = elem.nodeName.toLowerCase();
				return name === "input" && elem.type === "button" || name === "button";
			},

			"text": function text(elem) {
				var attr;
				// IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
				// use getAttribute instead to test this case
				return elem.nodeName.toLowerCase() === "input" && elem.type === "text" && ((attr = elem.getAttribute("type")) == null || attr.toLowerCase() === elem.type);
			},

			// Position-in-collection
			"first": createPositionalPseudo(function () {
				return [0];
			}),

			"last": createPositionalPseudo(function (matchIndexes, length) {
				return [length - 1];
			}),

			"eq": createPositionalPseudo(function (matchIndexes, length, argument) {
				return [argument < 0 ? argument + length : argument];
			}),

			"even": createPositionalPseudo(function (matchIndexes, length) {
				var i = 0;
				for (; i < length; i += 2) {
					matchIndexes.push(i);
				}
				return matchIndexes;
			}),

			"odd": createPositionalPseudo(function (matchIndexes, length) {
				var i = 1;
				for (; i < length; i += 2) {
					matchIndexes.push(i);
				}
				return matchIndexes;
			}),

			"lt": createPositionalPseudo(function (matchIndexes, length, argument) {
				var i = argument < 0 ? argument + length : argument;
				for (; --i >= 0;) {
					matchIndexes.push(i);
				}
				return matchIndexes;
			}),

			"gt": createPositionalPseudo(function (matchIndexes, length, argument) {
				var i = argument < 0 ? argument + length : argument;
				for (; ++i < length;) {
					matchIndexes.push(i);
				}
				return matchIndexes;
			})
		}
	};

	// Add button/input type pseudos
	for (i in { radio: true, checkbox: true, file: true, password: true, image: true }) {
		Expr.pseudos[i] = createInputPseudo(i);
	}
	for (i in { submit: true, reset: true }) {
		Expr.pseudos[i] = createButtonPseudo(i);
	}

	function tokenize(selector, parseOnly) {
		var matched,
		    match,
		    tokens,
		    type,
		    soFar,
		    groups,
		    preFilters,
		    cached = tokenCache[selector + " "];

		if (cached) {
			return parseOnly ? 0 : cached.slice(0);
		}

		soFar = selector;
		groups = [];
		preFilters = Expr.preFilter;

		while (soFar) {

			// Comma and first run
			if (!matched || (match = rcomma.exec(soFar))) {
				if (match) {
					// Don't consume trailing commas as valid
					soFar = soFar.slice(match[0].length) || soFar;
				}
				groups.push(tokens = []);
			}

			matched = false;

			// Combinators
			if (match = rcombinators.exec(soFar)) {
				matched = match.shift();
				tokens.push({
					value: matched,
					// Cast descendant combinators to space
					type: match[0].replace(rtrim, " ")
				});
				soFar = soFar.slice(matched.length);
			}

			// Filters
			for (type in Expr.filter) {
				if ((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))) {
					matched = match.shift();
					tokens.push({
						value: matched,
						type: type,
						matches: match
					});
					soFar = soFar.slice(matched.length);
				}
			}

			if (!matched) {
				break;
			}
		}

		// Return the length of the invalid excess
		// if we're just parsing
		// Otherwise, throw an error or return tokens
		return parseOnly ? soFar.length : soFar ? Sizzle.error(selector) :
		// Cache the tokens
		tokenCache(selector, groups).slice(0);
	}

	function toSelector(tokens) {
		var i = 0,
		    len = tokens.length,
		    selector = "";
		for (; i < len; i++) {
			selector += tokens[i].value;
		}
		return selector;
	}

	function addCombinator(matcher, combinator, base) {
		var dir = combinator.dir,
		    checkNonElements = base && dir === "parentNode",
		    doneName = done++;

		return combinator.first ?
		// Check against closest ancestor/preceding element
		function (elem, context, xml) {
			while (elem = elem[dir]) {
				if (elem.nodeType === 1 || checkNonElements) {
					return matcher(elem, context, xml);
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function (elem, context, xml) {
			var data,
			    cache,
			    outerCache,
			    dirkey = dirruns + " " + doneName;

			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			if (xml) {
				while (elem = elem[dir]) {
					if (elem.nodeType === 1 || checkNonElements) {
						if (matcher(elem, context, xml)) {
							return true;
						}
					}
				}
			} else {
				while (elem = elem[dir]) {
					if (elem.nodeType === 1 || checkNonElements) {
						outerCache = elem[expando] || (elem[expando] = {});
						if ((cache = outerCache[dir]) && cache[0] === dirkey) {
							if ((data = cache[1]) === true || data === cachedruns) {
								return data === true;
							}
						} else {
							cache = outerCache[dir] = [dirkey];
							cache[1] = matcher(elem, context, xml) || cachedruns;
							if (cache[1] === true) {
								return true;
							}
						}
					}
				}
			}
		};
	}

	function elementMatcher(matchers) {
		return matchers.length > 1 ? function (elem, context, xml) {
			var i = matchers.length;
			while (i--) {
				if (!matchers[i](elem, context, xml)) {
					return false;
				}
			}
			return true;
		} : matchers[0];
	}

	function condense(unmatched, map, filter, context, xml) {
		var elem,
		    newUnmatched = [],
		    i = 0,
		    len = unmatched.length,
		    mapped = map != null;

		for (; i < len; i++) {
			if (elem = unmatched[i]) {
				if (!filter || filter(elem, context, xml)) {
					newUnmatched.push(elem);
					if (mapped) {
						map.push(i);
					}
				}
			}
		}

		return newUnmatched;
	}

	function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
		if (postFilter && !postFilter[expando]) {
			postFilter = setMatcher(postFilter);
		}
		if (postFinder && !postFinder[expando]) {
			postFinder = setMatcher(postFinder, postSelector);
		}
		return markFunction(function (seed, results, context, xml) {
			var temp,
			    i,
			    elem,
			    preMap = [],
			    postMap = [],
			    preexisting = results.length,


			// Get initial elements from seed or context
			elems = seed || multipleContexts(selector || "*", context.nodeType ? [context] : context, []),


			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && (seed || !selector) ? condense(elems, preMap, preFilter, context, xml) : elems,
			    matcherOut = matcher ?
			// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
			postFinder || (seed ? preFilter : preexisting || postFilter) ?

			// ...intermediate processing is necessary
			[] :

			// ...otherwise use results directly
			results : matcherIn;

			// Find primary matches
			if (matcher) {
				matcher(matcherIn, matcherOut, context, xml);
			}

			// Apply postFilter
			if (postFilter) {
				temp = condense(matcherOut, postMap);
				postFilter(temp, [], context, xml);

				// Un-match failing elements by moving them back to matcherIn
				i = temp.length;
				while (i--) {
					if (elem = temp[i]) {
						matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem);
					}
				}
			}

			if (seed) {
				if (postFinder || preFilter) {
					if (postFinder) {
						// Get the final matcherOut by condensing this intermediate into postFinder contexts
						temp = [];
						i = matcherOut.length;
						while (i--) {
							if (elem = matcherOut[i]) {
								// Restore matcherIn since elem is not yet a final match
								temp.push(matcherIn[i] = elem);
							}
						}
						postFinder(null, matcherOut = [], temp, xml);
					}

					// Move matched elements from seed to results to keep them synchronized
					i = matcherOut.length;
					while (i--) {
						if ((elem = matcherOut[i]) && (temp = postFinder ? indexOf.call(seed, elem) : preMap[i]) > -1) {

							seed[temp] = !(results[temp] = elem);
						}
					}
				}

				// Add elements to results, through postFinder if defined
			} else {
				matcherOut = condense(matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut);
				if (postFinder) {
					postFinder(null, results, matcherOut, xml);
				} else {
					push.apply(results, matcherOut);
				}
			}
		});
	}

	function matcherFromTokens(tokens) {
		var checkContext,
		    matcher,
		    j,
		    len = tokens.length,
		    leadingRelative = Expr.relative[tokens[0].type],
		    implicitRelative = leadingRelative || Expr.relative[" "],
		    i = leadingRelative ? 1 : 0,


		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator(function (elem) {
			return elem === checkContext;
		}, implicitRelative, true),
		    matchAnyContext = addCombinator(function (elem) {
			return indexOf.call(checkContext, elem) > -1;
		}, implicitRelative, true),
		    matchers = [function (elem, context, xml) {
			return !leadingRelative && (xml || context !== outermostContext) || ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml));
		}];

		for (; i < len; i++) {
			if (matcher = Expr.relative[tokens[i].type]) {
				matchers = [addCombinator(elementMatcher(matchers), matcher)];
			} else {
				matcher = Expr.filter[tokens[i].type].apply(null, tokens[i].matches);

				// Return special upon seeing a positional matcher
				if (matcher[expando]) {
					// Find the next relative operator (if any) for proper handling
					j = ++i;
					for (; j < len; j++) {
						if (Expr.relative[tokens[j].type]) {
							break;
						}
					}
					return setMatcher(i > 1 && elementMatcher(matchers), i > 1 && toSelector(tokens.slice(0, i - 1)).replace(rtrim, "$1"), matcher, i < j && matcherFromTokens(tokens.slice(i, j)), j < len && matcherFromTokens(tokens = tokens.slice(j)), j < len && toSelector(tokens));
				}
				matchers.push(matcher);
			}
		}

		return elementMatcher(matchers);
	}

	function matcherFromGroupMatchers(elementMatchers, setMatchers) {
		// A counter to specify which element is currently being matched
		var matcherCachedRuns = 0,
		    bySet = setMatchers.length > 0,
		    byElement = elementMatchers.length > 0,
		    superMatcher = function superMatcher(seed, context, xml, results, expandContext) {
			var elem,
			    j,
			    matcher,
			    setMatched = [],
			    matchedCount = 0,
			    i = "0",
			    unmatched = seed && [],
			    outermost = expandContext != null,
			    contextBackup = outermostContext,

			// We must always have either seed elements or context
			elems = seed || byElement && Expr.find["TAG"]("*", expandContext && context.parentNode || context),

			// Use integer dirruns iff this is the outermost matcher
			dirrunsUnique = dirruns += contextBackup == null ? 1 : Math.random() || 0.1;

			if (outermost) {
				outermostContext = context !== document && context;
				cachedruns = matcherCachedRuns;
			}

			// Add elements passing elementMatchers directly to results
			// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
			for (; (elem = elems[i]) != null; i++) {
				if (byElement && elem) {
					j = 0;
					while (matcher = elementMatchers[j++]) {
						if (matcher(elem, context, xml)) {
							results.push(elem);
							break;
						}
					}
					if (outermost) {
						dirruns = dirrunsUnique;
						cachedruns = ++matcherCachedRuns;
					}
				}

				// Track unmatched elements for set filters
				if (bySet) {
					// They will have gone through all possible matchers
					if (elem = !matcher && elem) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if (seed) {
						unmatched.push(elem);
					}
				}
			}

			// Apply set filters to unmatched elements
			matchedCount += i;
			if (bySet && i !== matchedCount) {
				j = 0;
				while (matcher = setMatchers[j++]) {
					matcher(unmatched, setMatched, context, xml);
				}

				if (seed) {
					// Reintegrate element matches to eliminate the need for sorting
					if (matchedCount > 0) {
						while (i--) {
							if (!(unmatched[i] || setMatched[i])) {
								setMatched[i] = pop.call(results);
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense(setMatched);
				}

				// Add matches to results
				push.apply(results, setMatched);

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if (outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1) {

					Sizzle.uniqueSort(results);
				}
			}

			// Override manipulation of globals by nested matchers
			if (outermost) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

		return bySet ? markFunction(superMatcher) : superMatcher;
	}

	compile = Sizzle.compile = function (selector, group /* Internal Use Only */) {
		var i,
		    setMatchers = [],
		    elementMatchers = [],
		    cached = compilerCache[selector + " "];

		if (!cached) {
			// Generate a function of recursive functions that can be used to check each element
			if (!group) {
				group = tokenize(selector);
			}
			i = group.length;
			while (i--) {
				cached = matcherFromTokens(group[i]);
				if (cached[expando]) {
					setMatchers.push(cached);
				} else {
					elementMatchers.push(cached);
				}
			}

			// Cache the compiled function
			cached = compilerCache(selector, matcherFromGroupMatchers(elementMatchers, setMatchers));
		}
		return cached;
	};

	function multipleContexts(selector, contexts, results) {
		var i = 0,
		    len = contexts.length;
		for (; i < len; i++) {
			Sizzle(selector, contexts[i], results);
		}
		return results;
	}

	function select(selector, context, results, seed) {
		var i,
		    tokens,
		    token,
		    type,
		    find,
		    match = tokenize(selector);

		if (!seed) {
			// Try to minimize operations if there is only one group
			if (match.length === 1) {

				// Take a shortcut and set the context if the root selector is an ID
				tokens = match[0] = match[0].slice(0);
				if (tokens.length > 2 && (token = tokens[0]).type === "ID" && context.nodeType === 9 && !documentIsXML && Expr.relative[tokens[1].type]) {

					context = Expr.find["ID"](token.matches[0].replace(runescape, funescape), context)[0];
					if (!context) {
						return results;
					}

					selector = selector.slice(tokens.shift().value.length);
				}

				// Fetch a seed set for right-to-left matching
				i = matchExpr["needsContext"].test(selector) ? 0 : tokens.length;
				while (i--) {
					token = tokens[i];

					// Abort if we hit a combinator
					if (Expr.relative[type = token.type]) {
						break;
					}
					if (find = Expr.find[type]) {
						// Search, expanding context for leading sibling combinators
						if (seed = find(token.matches[0].replace(runescape, funescape), rsibling.test(tokens[0].type) && context.parentNode || context)) {

							// If seed is empty or no tokens remain, we can return early
							tokens.splice(i, 1);
							selector = seed.length && toSelector(tokens);
							if (!selector) {
								push.apply(results, slice.call(seed, 0));
								return results;
							}

							break;
						}
					}
				}
			}
		}

		// Compile and execute a filtering function
		// Provide `match` to avoid retokenization if we modified the selector above
		compile(selector, match)(seed, context, documentIsXML, results, rsibling.test(selector));
		return results;
	}

	// Deprecated
	Expr.pseudos["nth"] = Expr.pseudos["eq"];

	// Easy API for creating new setFilters
	function setFilters() {}
	Expr.filters = setFilters.prototype = Expr.pseudos;
	Expr.setFilters = new setFilters();

	// Initialize with the default document
	setDocument();

	// EXPOSE
	if (typeof define === "function" && define.amd) {
		define(function () {
			return Sizzle;
		});
	} else {
		window.Sizzle = Sizzle;
	}
	// EXPOSE
})(window);
//# sourceMappingURL=Sizzle.js.map
;'use strict';

(function (global) {

  /**
   * Global namespace to hold all framework classes and modules.
   * @namespace smx
   */
  var smx = {};

  /**
   * Gets current framework version
   * @memberof smx
   * @type {String}
   */
  smx.version = '0.8.14';

  /**
   * This namescape is a placeholder for custom attribute parsers.
   * Attribute parsers are used during XML transpilation to process original
   * nodes attributes in different ways.
   * @namespace AttributeParsers
   * @memberof smx
   */
  smx.AttributeParsers = [];

  /**
   * This namescape is a placeholder for custom node parsers.
   * Tag parsers are used during XML transpilation to transform original nodes
   * in different ways.
   * @namespace NodeParsers
   * @memberof smx
   */
  smx.NodeParsers = [];

  //expose globals
  global.smx = smx;
})(window);
//# sourceMappingURL=smx.js.map
;'use strict';

(function (global) {

  /**
   * Global runtime object
   * @namespace $smx
   */
  var $smx = function $smx() {
    return __node_wrapper.apply($smx, arguments);
  };

  /**
   * Contains an id key map of all processed nodes for easy acccess.
   * @memberof $smx
   * @type {Object}
   */
  $smx.cache = {};

  /**
   * Currently active document.
   * @memberof $smx
   * @type {smx.Document}
   */
  $smx.document = null;

  /**
   * Array of loaded documents.
   * @memberof $smx
   * @type {smx.Document[]}
   */
  $smx.documents = [];

  /**
   * Global node wrapper.
   * @param {String|Node|Nodes[]} s - selector, node or node collection
   * @return {Node|Nodes[]}
   */
  var __node_wrapper = function __node_wrapper(s) {

    //no arguments? do nothing...
    if (!s) return;

    //string? should be a selector search
    if (typeof s === 'string') {

      //require an active document instance
      if (!$smx.document) return [];

      return $smx.document.find(s);
    }

    var create_node = function create_node(xmlNode) {

      var id;

      try {
        id = xmlNode.getAttribute('id');
      } catch (e) {}

      //id attr is required!
      if (!id) return;

      //Does already exists a node with this id?
      //prevent duplicated nodes and return existing one
      if ($smx.cache[id]) return $smx.cache[id];

      //create new Node from given XMLNode
      var node = new smx.Node(xmlNode);

      //add it to nodes cache
      $smx.cache[id] = node;

      //return just created node
      return node;
    };

    var isArray = s.constructor.name === 'Array';
    var isNodeList = s.constructor.name === 'NodeList';
    if (isArray || isNodeList) {
      //NodeList does not allow .map
      //force array so we can do the mapping
      //s = Array.prototype.slice.call(s);
      return [].map.call(s, function (n) {
        return n[0] ? n : create_node(n);
      });
    } else {
      return s[0] ? s : create_node(s);
    }
  };

  //expose global
  global.$smx = $smx;
})(window);
//# sourceMappingURL=$smx.js.map
;'use strict';

(function (global, Sizzle, smx, $smx, LOG) {

	/**
  * Loads a new smx document.
  * @memberof $smx
  * @param {String} url
  * @param {$smx~onLoadSuccess} onSuccess
  * @param {$smx~onLoadError} onError
  * @async
  */
	$smx.load = function (data, success, error) {

		if (!data) return;

		//conditional loading should check for multiple data source types
		//from url file as xml or json file... from xmlNode... from json object...
		//for now just proceed assuming an url for an xml file
		SUCCESS_CALLBACK = success;
		ERROR_CALLBACK = error;

		if (typeof data === 'string') LOAD_SMX_DOCUMENT(data);else LOAD_SMX_DOCUMENT_FROM_JSON(data);
	};

	/**
  * This callback is displayed as part of the Requester class.
  * @callback $smx~onLoadSuccess
  * @param {Document} document - Just loaded document
  */
	var SUCCESS_CALLBACK = function SUCCESS_CALLBACK(document) {};

	/**
  * This callback is displayed as part of the Requester class.
  * @callback $smx~onLoadError
  * @param {Object} error - Error object
  */
	var ERROR_CALLBACK = function ERROR_CALLBACK(e) {};

	/////////////////////////////////////////////////////////////////////////////////////
	// LOADING AND COMPILE SMX DOCUMENT

	var SMX_COMPILER = null;

	var LOAD_SMX_DOCUMENT = function LOAD_SMX_DOCUMENT(url) {

		//INSTANCE SMX COMPILER
		SMX_COMPILER = new smx.Compiler();

		//SMX_COMPILER.on('complete', LOAD_SMX_COMPLETE);
		SMX_COMPILER.on('complete', PARSE_METADATA);
		SMX_COMPILER.on('error', LOAD_SMX_ERROR);

		//global
		//global['$compiler'] = SMX_COMPILER;

		//var data_path = app.config.DATA_PATH || '';
		//if(app.config.PACKAGE) data_path = app.config.PACKAGE+'/'+ data_path;

		SMX_COMPILER.loadDocument(url);

		return;
	};

	var LOAD_SMX_DOCUMENT_FROM_JSON = function LOAD_SMX_DOCUMENT_FROM_JSON(data) {

		var x2js = new X2JS();

		var XML = x2js.json2xml(data);

		XML = XML.removeChild(XML.lastChild);

		PARSE_METADATA(XML);
	};

	var PARSE_METADATA = function PARSE_METADATA(xml) {

		smx.meta.parseXML(xml, {

			callback: function callback(XML, data) {

				global['$meta'] = data;

				PARSE_PROTOTYPES(XML);
			}

		});

		return;
	};

	var PARSE_PROTOTYPES = function PARSE_PROTOTYPES(xml) {

		smx.proto.parseXML(xml, {

			propagate: true,

			callback: function callback(XML, data) {

				//console.log(data);

				CLEAN_TEXT_NODES(XML);
			}

		});
	};

	var CLEAN_TEXT_NODES = function CLEAN_TEXT_NODES(xml) {

		var count = 0;

		function clean(node) {

			for (var n = 0; n < node.childNodes.length; n++) {

				var child = node.childNodes[n];

				//	1	ELEMENT_NODE
				//	2	ATTRIBUTE_NODE
				//	3	TEXT_NODE
				//	4	CDATA_SECTION_NODE
				//	5	ENTITY_REFERENCE_NODE
				//	6	ENTITY_NODE
				//	7	PROCESSING_INSTRUCTION_NODE
				//	8	COMMENT_NODE
				//	9	DOCUMENT_NODE
				//	10	DOCUMENT_TYPE_NODE
				//	11	DOCUMENT_FRAGMENT_NODE
				//	12	NOTATION_NODE

				var isElementNode = function isElementNode(n) {
					return n.nodeType === 1;
				};
				var isCommentNode = function isCommentNode(n) {
					return n.nodeType === 8;
				};
				var isEmptyTextNode = function isEmptyTextNode(n) {
					return n.nodeType === 3 && !/\S/.test(n.nodeValue);
				};

				if (isCommentNode(child) || isEmptyTextNode(child)) {
					node.removeChild(child);
					count++;
					n--;
				} else if (isElementNode(child)) {
					clean(child);
				}
			}
		}

		clean(xml);

		LOG('CLEANING XML: ' + count + ' nodes removed');

		LOAD_SMX_COMPLETE(xml);
	};

	var LOAD_SMX_COMPLETE = function LOAD_SMX_COMPLETE(xml) {

		LOG('smx load complete!');

		var d = new smx.Document(xml);

		$smx.cache[d.id] = d;
		$smx.documents.push(d);

		if (!$smx.document) $smx.document = d;

		SUCCESS_CALLBACK(d);

		return;
	};

	var LOAD_SMX_ERROR = function LOAD_SMX_ERROR(e) {

		LOG('smx load error: ' + e);

		ERROR_CALLBACK(e);

		return;
	};
})(window, window.Sizzle, window.smx, window.$smx, window.log);
//# sourceMappingURL=$smx.load.js.map
;'use strict';

(function (global, smx, Sizzle, LOG) {

  /**
   *	util method
   *	GET_UNIQUE_ID
   *	returns unique base36 ids strings [0-9]+[a-z]
   *
   *	based on _.uniqueId(), incremental starting at 0
   *	Native Intger.toString only handles up base 36
   *
   *  base36 [0-9]+[a-z]
   *  base62 [0-9]+[a-z]+[A-Z] but requires BigInt.js!
   *
   */

  var GET_UNIQUE_ID = function GET_UNIQUE_ID() {
    return parseInt(_.uniqueId()).toString(36);
  };
  //const GET_UNIQUE_ID = ()=>{ return bigInt2str(str2bigInt(_.uniqueId()+"",10,0,0),62) };


  var IdAttributeParser = {

    /**
     * Parser name
     * @type {String}
     * @protected
     */
    name: 'Id',

    /**
     * Selector used to find nodes having matching attributes to be parsed
     * @type {String}
     * @protected
     */
    selector: ':not([id])',

    /**
     * Parser function
     * @static
     * @param {XMLNode} xml
     * @return {XMLNode}
     */
    parse: function parse(xml) {

      //get ids already in use inside xml
      var nodes_with_id_attr = Sizzle('[id]');
      var ids_in_use = nodes_with_id_attr.map(function (n) {
        return n.id;
      });

      //get nodes matching the parser selector
      var nodes = Sizzle(this.selector, xml);

      //includes xml root itself to the list
      if (Sizzle.matchesSelector(xml, this.selector)) nodes.unshift(xml);else ids_in_use.push(xml.getAttribute('id'));

      //iterate over all matching nodes
      for (var i = 0, len = nodes.length; i < len; i++) {

        //get node
        var node = nodes[i];

        //generate an unique id for the node
        var id = GET_UNIQUE_ID();
        while (ids_in_use.indexOf(id) > 0) {
          id = GET_UNIQUE_ID();
        } //add new id to list
        ids_in_use.push(id);

        //set node id
        node.setAttribute('id', id);
      }

      LOG('ATTRIBUTE PARSER: ID (' + nodes.length + ' nodes)');

      return xml;
    }

  };

  //expose to smx namespace
  smx.AttributeParsers.push(IdAttributeParser);
})(window, window.smx, window.Sizzle, window.log);
//# sourceMappingURL=IdAttributeParser.js.map
;'use strict';

(function (global, smx, Sizzle, LOG) {

  /**
   * @mixin TimeAttributeParser
   */

  var TimeAttributeParser = {

    /**
     * Parser name
     *
     * @memberof TimeAttributeParser
     * @type {String}
     * @protected
     */
    name: 'Time',

    /**
     * Selector used to find nodes having matching attributes to be parsed
     *
     * @memberof TimeAttributeParser
     * @type {String}
     * @protected
     */
    selector: '[duration],[start],[offset]',

    /**
     * Parser function
     *
     * @memberof TimeAttributeParser
     * @static
     * @param {XMLNode} xml
     * @return {XMLNode}
     */
    parse: function parse(xml) {

      //internal counter
      var attributeCounter = 0;

      //get nodes matching the parser selector
      var nodes = Sizzle(this.selector, xml);

      //includes xml root itself to the list
      if (Sizzle.matchesSelector(xml, this.selector)) nodes.unshift(xml);

      //iterate over all matching nodes
      for (var i = 0, len = nodes.length; i < len; i++) {

        //get node
        var node = nodes[i];

        //duration attr
        var duration = node.getAttribute('duration');
        if (duration) {
          node.setAttribute('duration', this.parseAttributeValue(duration, 'auto'));
          attributeCounter++;
        }

        //start attr
        var start = node.getAttribute('start');
        if (start) {
          node.setAttribute('start', this.parseAttributeValue(start, 'auto'));
          attributeCounter++;
        }

        //offset attr
        var offset = node.getAttribute('offset');
        if (offset) {
          node.setAttribute('offset', this.parseAttributeValue(offset, 0));
          attributeCounter++;
        }
      }

      LOG('ATTRIBUTE PARSER: TIME (' + attributeCounter + ' attributes in ' + nodes.length + ' nodes)');

      return xml;
    },

    /**
     * Parses a time attribute value
     *
     * @memberof TimeAttributeParser
     * @static
     * @param {String} value
     * @param {String} default value
     * @return {String}
     */
    parseAttributeValue: function parseAttributeValue(value, _default) {

      if (!value || typeof value !== 'string' || value === 'auto' || value < 0) return _default;

      var important = false;
      if (value.indexOf('!') === 0) {
        important = true;
        value = value.substr(1);
      }

      if (value.indexOf(':') >= 0) {

        var sum = 0,
            factor = 1,
            values = value.split(':');
        values.reverse();
        for (var i = 0; i < values.length; i++) {
          sum += parseFloat(values[i]) * factor;
          factor = factor * 60;
        }

        if (important) return '!' + sum;else return sum;
      }

      if (important) return '!' + parseFloat(value);else return parseFloat(value);
    }

    //expose to smx namespace
  };smx.AttributeParsers.push(TimeAttributeParser);
})(window, window.smx, window.Sizzle, window.log);
//# sourceMappingURL=TimeAttributeParser.js.map
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (global, _, $, smx, LOG) {

  /**
   * SMX Loader Class
   */
  var Loader = function () {

    /**
     * creates a new Loader
     */
    function Loader() {
      _classCallCheck(this, Loader);

      this.xhr = null;
    }
    /**
     * load resource by given url
     * @param {String}
     */


    _createClass(Loader, [{
      key: 'load',
      value: function load(url) {

        var onSuccess = _.bind(this.onSuccess, this);
        var onError = _.bind(this.onError, this);

        this.xhr;
        if (global.ActiveXObject) this.xhr = new global.ActiveXObject("MSXML2.XMLHTTP.3.0");else this.xhr = new global.XMLHttpRequest();

        this.xhr.open('GET', url);
        this.xhr.onload = function (evt) {
          if (evt.target.status === 200) onSuccess(evt.target);else onError(evt.target);
        };
        this.xhr.send();

        return;
      }
    }, {
      key: 'onSuccess',
      value: function onSuccess(xhr) {
        LOG(xhr.responseURL + ' ' + xhr.status + ' (' + xhr.statusText + ')');
        LOG(xhr.responseText);
        var ext = xhr.responseURL.split('.').pop();
        console.log(ext);
      }
    }, {
      key: 'onError',
      value: function onError(xhr) {
        LOG(xhr.responseURL + '" ' + xhr.status + ' (' + xhr.statusText + ')');
        LOG(xhr.responseText);
      }
    }]);

    return Loader;
  }();

  smx.Loader = Loader;
})(window, _, $, smx, log);
//# sourceMappingURL=Loader.js.map
;'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function (global, Sizzle, _, smx, LOG) {

  var copyAttributes = function copyAttributes(srcNode, targetNode) {

    var ignoreAttributes = ['src', 'path', 'file'];

    var attrs = srcNode.attributes;

    for (var i = 0; i < attrs.length; i++) {

      var name = attrs[i].name;
      var value = attrs[i].value;

      if (ignoreAttributes.indexOf(name) < 0) {
        var attr = targetNode.getAttribute(name);
        if ((typeof attr === 'undefined' ? 'undefined' : _typeof(attr)) === undefined || attr === null || attr === false) targetNode.setAttribute(name, value);
      }
    }

    return targetNode;
  };

  var resolvePathFileAttributes = function resolvePathFileAttributes(node, url) {

    //get src string from node attribute or given url
    var src = url ? url : node.getAttribute('src');

    //declare resultant attribute values
    var path, file;

    //no src string? just ignore..
    if (!src) return node;

    //split by slashes
    src = src.split('/');

    //if multipart, last is file
    if (src.length > 0) file = src.pop();

    //join path parts
    path = src.join('/') + '/';

    //set inlcuded node core attributes
    if (path) node.setAttribute('path', path);
    if (file) node.setAttribute('file', file);

    return node;
  };

  var createDataNode = function createDataNode(xmlDocument, nodeName, data, type) {
    var node = xmlDocument.createElement(nodeName);
    var cdata = xmlDocument.createCDATASection(data);
    node.appendChild(cdata);
    node.setAttribute('type', type || 'cdata');
    return node;
  };

  var parseIncludes = function parseIncludes(xmlDocument) {

    var inc;

    //find all existing <include> nodes
    var includes = Sizzle('include', xmlDocument);

    //iterate and filter includes
    while (!inc && includes.length > 0) {

      var follow = true;

      //get first include found
      inc = includes.shift();

      //FILTER BY LANG ATTR
      //attribute lang must match options lang
      //var inc_lang = inc.getAttribute('lang');
      //if(inc_lang && inc_lang!=this.options.lang) follow = false;

      //FILTER BY IGNORE ATTR
      //exclude if ignore attribute is defined and != false
      var inc_ignore = inc.getAttribute('ignore');
      if (inc_ignore === 'true') follow = false;

      if (!follow) {
        inc.parentNode.removeChild(inc);
        inc = null;
      }
    }

    return inc;
  };

  /**
   * SMX Compiler Class
   * @class Compiler
   */

  var DocumentCompiler = function DocumentCompiler() {

    //extended with custom events
    _.extend(this, Backbone.Events);

    // XML Document Object
    this.XML = null;

    // TEXT XML code String (compressed & factorized)
    this.TEXT = null;

    // xhr controller for file requests
    this.xhr = null;

    this.loadDocument = function (url) {

      this.loadFile(url);

      return;
    };

    this.loadFile = function (url) {

      var onSuccess = this.onLoadFileSuccess.bind(this);
      var onError = this.onLoadFileError.bind(this);

      this.xhr = new XMLHttpRequest();
      this.xhr.open('GET', url, true);
      this.xhr.onreadystatechange = function (evt) {

        if (this.readyState !== 4) return;
        if (this.status >= 200 && this.status < 400) onSuccess(evt.target);else onError(evt.target);
      };
      this.xhr.send();

      return;
    };

    this.onLoadFileSuccess = function (xhr) {

      LOG('> ' + xhr.responseURL + ' ' + xhr.status + ' (' + xhr.statusText + ')');
      //LOG( xhr.responseText);
      //var ext = xhr.responseURL.split('.').pop();

      //detect if already exist xml root node
      var is_root = !this.XML ? true : false;

      if (is_root) {

        //set xml root document
        this.XML = xhr.responseXML;

        //ignore XMLDocument and other unwanted nodes like comments, text, ...
        //get just the root XMLElement as lastChild in document
        var node = this.XML.lastChild;

        resolvePathFileAttributes(node, xhr.responseURL);
      } else {

        //get 1st <include> found in current XMLDocument
        var include = Sizzle('include[loading="true"]', this.XML)[0];

        //resolve if just loaded data is an XML document or not
        var isXml = xhr.responseXML ? true : false;

        //ignore XMLDocument and other unwanted nodes like comments, text, ...
        //get just the root XMLElement as lastChild in document
        var new_node = xhr.responseXML ? xhr.responseXML.lastChild : null;

        //not xml? create a new xml node to wrap the loaded data
        if (!new_node) {

          //resolves new node name based on include's name attribute
          //defaults to generic the nodeName `node`
          var nodeName = include.getAttribute('name') || 'node';

          //get just loaded data
          var data = xhr.responseText;

          //autodetect data type based on just loaded file extension
          var type = include.getAttribute('src').split('.').pop();

          //create new data node
          new_node = createDataNode(this.XML, nodeName, data, type);
        }

        //resolve 'path' and 'file' attributes from 'src'
        resolvePathFileAttributes(new_node, include.getAttribute('src'));

        //copy attributes from include node to the new node
        copyAttributes(include, new_node);

        //replace include node with the new node
        include.parentNode.replaceChild(new_node, include);
      }

      var inc = parseIncludes(this.XML);

      if (inc) {

        //flag include node as loading
        inc.setAttribute('loading', 'true');

        //get include target url
        var url = inc.getAttribute('src') || '';

        //replace @lang keyword in src
        //if(url.indexOf('@lang')>=0) url = url.replace(/@lang/g, this.options.lang);

        //resolve full url
        var ref = inc;
        while (ref.parentNode) {
          var parent = ref.parentNode;
          var path = parent.getAttribute ? parent.getAttribute('path') || '' : '';
          url = path + url;
          ref = parent;
        }

        this.loadFile(url);
      } else this.onLoadXMLComplete();

      return;
    };

    this.onLoadFileError = function (xhr) {

      LOG('> ' + xhr.responseURL + '" ' + xhr.status + ' (' + xhr.statusText + ')');
      this.trigger('error', xhr.responseText);
    };

    this.onLoadXMLComplete = function () {

      var XML = this.XML;

      //extract last child XMLnode in resultant XMLDocument and ignore the document...
      //using lastChild prevents getting unwanted xml nodes...
      //IE8 p.e. returns "ProcessingInstruction" for firstChild
      XML = XML.removeChild(XML.lastChild);

      //ATTRIBUTE PARSING

      //get defined parsers from smx ns
      var parsers = smx.AttributeParsers;

      //do parsing one by one
      for (var i = 0, len = parsers.length; i < len; i++) {
        XML = parsers[i].parse(XML);
      }this.XML = XML;
      this.TEXT = this.XML2str(this.XML);

      this.trigger('complete', XML);

      return;
    };

    this.XML2str = function (xmlNode) {

      try {
        // Gecko- and Webkit-based browsers (Firefox, Chrome), Opera.
        return new XMLSerializer().serializeToString(xmlNode);
      } catch (e) {
        try {
          // Internet Explorer.
          return xmlNode.xml;
        } catch (e) {
          //Other browsers without XML Serializer
          alert('XMLSerializer not supported');
        }
      }

      return '';
    };

    this.str2XML = function (str) {

      var XML = null;

      if (global.ActiveXObject) {

        XML = new ActiveXObject('Microsoft.XMLDOM');
        XML.async = 'false';
        XML.loadXML(str);
      } else {

        var parser = new DOMParser();
        XML = parser.parseFromString(str, 'text/xml');
      }

      return XML;
    };

    return this;
  };

  //expose
  smx.Compiler = DocumentCompiler;

  /*
  // UTIL METHODS
  
  var CLEAN_XML_NODE = function(xml){
  
    var count = 0;
  
  	function clean(node){
  
  		for(var n = 0; n < node.childNodes.length; n ++){
  
  			var child = node.childNodes[n];
  
  			//	1	ELEMENT_NODE
  			//	2	ATTRIBUTE_NODE
  			//	3	TEXT_NODE
  			//	4	CDATA_SECTION_NODE
  			//	5	ENTITY_REFERENCE_NODE
  			//	6	ENTITY_NODE
  			//	7	PROCESSING_INSTRUCTION_NODE
  			//	8	COMMENT_NODE
  			//	9	DOCUMENT_NODE
  			//	10	DOCUMENT_TYPE_NODE
  			//	11	DOCUMENT_FRAGMENT_NODE
  			//	12	NOTATION_NODE
  			
  			var isElementNode = function(n){ return n.nodeType===1 }
  			var isCommentNode = function(n){ return n.nodeType===8 }
  			var isEmptyTextNode = function(n){ return n.nodeType===3 && !/\S/.test(n.nodeValue) }
  
  			if( isCommentNode(child) || isEmptyTextNode(child) ){
  			  node.removeChild(child);
  			  count++;
  			  n --;
  			}
  			else if( isElementNode(child) ){
  			  clean(child);
  			}
  
  
  		}
  
  	}
  
  	clean(xml);
  
    LOG('CLEANING XML: '+ count+' nodes removed');
  
  };
  */
})(window, window.Sizzle, window._, window.smx, window.log);
//# sourceMappingURL=Compiler.js.map
;"use strict";

(function (smx) {

  /**
   * Placeholder namespace to contain Node extensions
   * @namespace time
   * @memberof smx
   */

  //expose
  smx.time = {};
})(window.smx);
//# sourceMappingURL=time.js.map
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (win, _, Backbone, smx) {

	/**
  * SMX Timer Class
  * @memberof smx.time
  */
	var Timer = function () {

		/**
   * creates a Timer
   **/
		function Timer() {
			_classCallCheck(this, Timer);

			//inherit events behavior
			_.extend(this, Backbone.Events);

			//fps only applied when using internal timer
			//[ 16 | 24 | 32 | 48 | 64 ... ] higher values may push performance limits (not recommended)
			this.fps = 16;

			//internal timer engine object
			//usually return value of setTimeout or setInterval
			this.engine = null;

			//external engine collection
			this.extEngines = [];

			//time counter
			this.time = 0;

			//aux time flag
			this.time_flag = null;

			//bool engine paused or not
			this.paused = true;

			//bool flag requestAnimationFrame?
			this.rAF = false;

			//fps multiplier
			this.factor = 1;
		}

		/**
   * Starts the timer
   */


		_createClass(Timer, [{
			key: 'start',
			value: function start() {

				//prevents duplicated runs
				if (this.engine) this.stop();

				//set time_flag
				this.time_flag = new Date().getTime();

				//activate loop
				this.paused = false;

				//set timeout
				if (this.rAF) this.engine = global.requestAnimationFrame(_.bind(this.update, this));else this.engine = setTimeout(_.bind(this.update, this), 1000 / this.fps);
			}

			/**
    * Plugs an external time engine
    * @param {String} engine id
    * @param {Function} callback - Function returning current time in ms when invoked
    */

		}, {
			key: 'plugExtEngine',
			value: function plugExtEngine(id, callback) {

				//callback must be a function returning current time in ms
				this.extEngines.unshift({ 'id': id, 'callback': callback });

				return;
			}

			/**
    * Unplugs an external engine
    * @param {String} id - Identifier of the engine to be removed
    */

		}, {
			key: 'unplugExtEngine',
			value: function unplugExtEngine(id) {

				var found_at_index = -1;
				for (var i = 0; i < this.extEngines.length; i++) {
					if (this.extEngines[i].id == id) {
						this.extEngines[i] = null;
						found_at_index = i;
					}
				}
				if (found_at_index >= 0) {
					this.extEngines.splice(found_at_index, 1);
				}

				if (!this.extEngines.length && !this.paused) this.start();

				return;
			}

			/**
    * Updates the timer
    */

		}, {
			key: 'update',
			value: function update(time, timerId) {

				//using internal engine 'update' recives 0 parameters
				//and will use new Date().getTime() to calculate time ellapsed since last update

				//using an external engine callback must recive 2 param
				//time: target time
				//timerId: id of a registered external engine
				//only registered engines via 'plugExtEngine' method take effect
				//if timerId is not found time param will be ignored and will exit silently

				if (typeof time != 'undefined' && typeof timerId != 'undefined') {

					//multiple external engines are not supported
					//so, always take only the first extEngine and ignore the others
					if (this.extEngines[0].id == timerId) {

						//update using param provided by external engine
						this.time = time;
						//debug.log('TIMER - timer:'+ parseInt(this.time) +' from externalEngine:'+this.extEngines[0].id);

						//notify update and exit
						this.trigger('update');
						return;
					} else {

						//timerId not found, exit silently
						return;
					}
				}

				//calculate time ellapsed since last update
				var time_now = new Date().getTime();
				var time_offset = this.time_flag !== null ? time_now - this.time_flag : 0;
				this.time_flag = time_now;

				//calculate real fps
				//var fps = 1000/time_offset;

				//update time
				this.time += time_offset * this.factor;
				//debug.log('TIMER - timer:'+ parseInt(this.time) +' from internal engine');


				//set timeout to next frame
				if (!this.paused && !this.extEngines.length) {
					if (this.rAF) this.engine = global.requestAnimationFrame(_.bind(this.update, this));else this.engine = setTimeout(_.bind(this.update, this), 1000 / this.fps);
				}

				//notify update and exit
				this.trigger('update');

				return;
			}

			/**
    * Sets a given time in ms
    * @param {Number} t - time to be set
    */

		}, {
			key: 'setTime',
			value: function setTime(t) {

				this.time = t;

				//notify update
				this.trigger('update');
			}

			/**
    * Stops the timer
    */

		}, {
			key: 'stop',
			value: function stop() {

				//reset timeout
				if (this.engine) {
					if (this.rAF) global.cancelAnimationFrame(this.engine);else clearTimeout(this.engine);
					this.engine = null;
				}

				//reset time_flag
				this.time_flag = null;

				//deactivate update loop
				this.paused = true;

				return;
			}

			/**
    * Resets the timer
    */

		}, {
			key: 'reset',
			value: function reset() {

				this.stop();
				this.time = 0;
			}

			/**
    * Destroys the timer
    */

		}, {
			key: 'destroy',
			value: function destroy() {

				//kill loop process
				this.stop();

				//clear extEngines
				this.extEngines = [];

				return;
			}
		}]);

		return Timer;
	}();

	//expose class in smx namespace


	smx.time.Timer = Timer;
})(window, window._, window.Backbone, window.smx);
//# sourceMappingURL=Timer.js.map
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (smx) {

			/**
    * SMX Timeline Class
    * @memberof smx.time
    */
			var Timeline = function () {

						/**
       * creates a new Timeline
       * @param {Node} node node to be used as timeline base
       * @return {Timeline}
       */
						function Timeline(node) {
									_classCallCheck(this, Timeline);

									if (!node) return;

									//extends with events
									_.extend(this, Backbone.Events);

									/**
          * Node from which the timeline is created
          * @type {Node}
          */

									//define node ref
									this.node = node;

									/**
          * Current time
          * @default 0
          */
									this.time = 0;

									//time cache
									this.time2 = -2;

									//timeline duration
									this.duration = 0;

									//limit max update events per second
									this.fps = 2;

									/**
          * Timer engine used for time tic tacking
          * @type {smx.time.Timer}
            */
									this.timer = null;

									//used for scrolling
									//this.scroller = null;

									//STATUS FLAGS

									//true if playing
									this.is_playing = false;

									//true when using high speed playback
									//this.is_scrolling = false;

									//is false when its busy :D
									this.is_ready = true;

									//TIMELINE SELECTION
									//Array containing all selected nodes
									this.activeNodes = [];

									//KEYFRAMES
									this.keyFrames = {};

									this.debug = false;

									this.initialize();
						}

						_createClass(Timeline, [{
									key: 'initialize',
									value: function initialize() {

												this.createTimer();

												this.duration = this.node.time('duration');

												this.synchronize();
									}
						}, {
									key: 'createTimer',
									value: function createTimer() {

												//create timer engine
												this.timer = new smx.time.Timer();

												//create observer for timer 'update' event
												this.timer.on('update', this.update, this);

												//create timer engine
												//this.scroller = new smx.time.Timer();
												//this.scroller.fps = 10;

												//create observer for timer 'update' event
												//this.scroller.on('update', this.onscroll, this);

									}
						}, {
									key: 'destroyTimer',
									value: function destroyTimer() {

												if (!this.timer) return;

												this.timer.off('update', this.update);

												this.timer.destroy();

												this.timer = null;

												//if (!this.scroller) return;

												//this.scroller.off('update', this.onscroll);

												//this.scroller.destroy();

												//this.scroller = null;
									}
						}, {
									key: 'plugExtTimer',
									value: function plugExtTimer(name, callback) {

												if (!this.timer || !name || !callback) return;

												this.timer.plugExtEngine(name, callback);

												return;
									}
						}, {
									key: 'unplugExtTimer',
									value: function unplugExtTimer(name) {

												if (!this.timer || !name) return;

												this.timer.unplugExtEngine(name);
												return;
									}

									/*
         //!!! DEPRECATED -- not in use?
         //better use duration property directly
         this.getDuration = function(){
         	return this.duration;
         };
         */

						}, {
									key: 'synchronize',
									value: function synchronize() {

												//create/reset empty object
												this.keyFrames = {};

												//get timemarks
												var childs = this.node.find('*');

												for (var i = 0; i < childs.length; i++) {

															//get tm
															var child = childs[i];

															//get resulting times
															var _startTime = child.time('offset', this.node);
															var _finishTime = child.time('offset', this.node) + child.time('duration');

															//create activation keyframe at start time
															this.addKeyFrame(_startTime, child.id, 1);

															//create deactivation keyframe at finish time
															this.addKeyFrame(_finishTime, child.id, 0);
												}

												this._optimizeKeyFrames();

												return;
									}

									/**
          * Adds a new keyframe
          * @param {Integer} t - time position for the keyframe
          * @param {String} id - keyframe identifier
          * @param {String} action - action to be permformed
          * @private
          */

						}, {
									key: '_addKeyFrame',
									value: function _addKeyFrame(t, id, action) {

												//if keyframe[t] does not exist create keyframe array
												if (!this.keyFrames[t + '']) this.keyFrames[t + ''] = [];

												//the push keyframe in array
												this.keyFrames[t + ''].push({ 'id': id, 'action': action });

												return;
									}

									/**
          * Optimizes existing keyframes map
          * @private
          * @summary
         * keyframes are stored in a plain object not in an array
         * object properties are the keys time in seconds
         * so properties may be unordered {5:x,2:y,12:z}
         * the optimization consists in ordering keyframes object
         */

						}, {
									key: '_optimizeKeyFrames',
									value: function _optimizeKeyFrames() {

												//sort keyframes
												var sorted_keyframes = {};
												var kfs = _.keys(this.keyFrames);
												kfs = _.sortBy(kfs, function (num) {
															return parseFloat(num);
												});
												for (var i = 0; i < kfs.length; i++) {
															sorted_keyframes[kfs[i]] = this.keyFrames[kfs[i]];
												}
												this.keyFrames = sorted_keyframes;

												return;
									}

									/**
           * Updates timeline time
           * @param {Number=} time - update timeline at given time
           * @return {Boolean} success or not
           */

						}, {
									key: 'update',
									value: function update(time) {

												//check for "is_ready" flag
												if (!this.is_ready) return;

												//check for "is_playing" flag
												//if (!this.is_playing) return;

												//process parameter
												var t = typeof time != 'undefined' ? parseInt(time) : false;

												//update time
												if (this.timer) this.time = this.timer.time; //update from timer
												else if (t !== false) this.time = t; // update from parameter
															else return;

												//prevent LEFT timeline offset
												if (this.time < 0) this.time = 0;

												//prevent RIGHT timeline offset
												var max = this.duration * 1000;
												if (this.time >= max) {
															this.time = max;
															this.pause();
															this.finish();
												}

												//check for keyframes
												t = Math.floor(this.time / 1000);
												if (this.time2 != t) {

															var diff = t - this.time2;
															if (diff > 0 && Math.abs(diff) <= 1) {

																		//is linear progress

																		//get keyframes for this frame
																		var kfs = this.keyFrames[t + ''];

																		//exist keyframes?
																		if (kfs) {

																					//debug.log('keyframe found at '+t);

																					for (var i = 0; i < kfs.length; i++) {

																								var kf = kfs[i];
																								var node = this.node.root().getNodeById(kf.id);
																								var action = kf.action;

																								if (action > 0) this._enterNode(node);else {
																											var last_frame = Math.floor(max / 1000);
																											if (t != last_frame) this._exitNode(node);
																								}
																					}
																		}
															} else {

																		//is not linear progress

																		//get keyframes names: ['0','5','12',...]
																		var kfs = _.keys(this.keyFrames);

																		//aux array for active nodes
																		var active_nodes = [];

																		//loop trough keyframes before time t
																		for (var k = 0; k < kfs.length && parseInt(kfs[k]) <= parseInt(t); k++) {

																					var kf = this.keyFrames[kfs[k]];

																					for (var i = 0; i < kf.length; i++) {

																								var item = kf[i];
																								var node = this.node.root().getNodeById(item.id);
																								var action = item.action;

																								var index = active_nodes.indexOf(node);

																								if (action > 0) active_nodes.push(node);else active_nodes.splice(index, 1);
																					}
																		}

																		//perform resulting 'exit' nodes
																		var need_exit = [];
																		for (var i = 0; i < this.activeNodes.length; i++) {
																					var node = this.activeNodes[i];
																					if (active_nodes.indexOf(node) < 0) {
																								need_exit.push(node);
																					}
																		}
																		for (var i = 0; i < need_exit.length; i++) {
																					this._exitNode(need_exit[i]);
																		} //perform resulting 'enter' nodes
																		for (var i = 0; i < active_nodes.length; i++) {
																					this._enterNode(active_nodes[i]);
																		}
															}

															//this._debug('-------------------------------');
															//for (var i=0; i< this.activeNodes.length; i++) debug.log(''+this.activeNodes[i].nodeName +'#'+this.activeNodes[i].id);


															//update aux time
															this.time2 = t;
												}

												//create timeline event object
												var e = this.buildEventObject(this.node);

												//notify 'update'
												this.trigger('update', e);

												return;
									}

									/**
          * Checks if the given node or node identifier is currently active in the timeline
          * @param {String|Node} node
          */

						}, {
									key: 'isActive',
									value: function isActive(node_or_id) {

												var node = node_or_id;

												if (typeof node_or_id == 'string') node = this.node.root().getNodeById(node_or_id);

												if (!node) return;

												if (this.activeNodes.indexOf(node) >= 0) return true;
									}

									/**
          * @private
          */

						}, {
									key: '_enterNode',
									value: function _enterNode(node) {

												//check node
												if (!node) return;

												//check if already active
												if (this.activeNodes.indexOf(node) >= 0) return;

												//add to active nodes
												this.activeNodes.push(node);

												//create timeline event object
												var e = this.buildEventObject(node);

												//generic timeline enter event
												this.trigger('enter', e);

												//specific timeline node enter event
												this.trigger('enter:' + node.id, e);

												//debug action
												this._debug('TIMELINE !enter: ' + node.nodeName + '#' + node.id);

												return;
									}

									/**
          * @private
          */

						}, {
									key: '_exitNode',
									value: function _exitNode(node) {

												//check node
												if (!node) return;

												//check if active
												var index = this.activeNodes.indexOf(node);
												if (index < 0) return;

												//remove from active nodes
												this.activeNodes.splice(index, 1);

												//create timeline event object
												var e = this.buildEventObject(node);

												//generic timeline exit event
												this.trigger('exit', e);

												//specific timeline node exit event
												this.trigger('exit:' + node.id, e);

												//debug action
												this._debug('TIMELINE !exit: ' + node.nodeName + '#' + node.id);

												return;
									}

									/**
            * Plays the timeline
            * @fires play
            */

						}, {
									key: 'play',
									value: function play(silent) {

												//if is scrolling stop scroll
												//if(this.is_scrolling) this.stopScroll();

												//check for "is_ready" flag
												if (!this.is_ready) return;

												//play in offset time become replay
												var max = this.duration * 1000;
												if (this.time >= max) return this.replay();

												//update "is_playing" flag
												this.is_playing = true;

												//start timer
												if (this.timer) this.timer.start();

												//create timeline event object
												var e = this.buildEventObject(this.node);

												//notify 'play'
												if (!silent) this.trigger('play', e);

												return;
									}

									/**
          * Fired every time the timeline performs the `play` action
          * @event play
          * @memberof smx.time.Timeline
          * @return {TimelineEvent}
          */

									/**
          * Replays the timeline, performs `seekTo' to 0 and `play`
          */

						}, {
									key: 'replay',
									value: function replay() {

												//if is scrolling stop scroll
												//if(this.is_scrolling) this.stopScroll();

												//check for "is_ready" flag
												if (!this.is_ready) return;

												this.seekTo(0);
												this.play();

												return;
									}

									/**
            * Pauses the timeline
            * @fires pause
            */

						}, {
									key: 'pause',
									value: function pause(silent) {

												//if is scrolling stop scroll
												//if(this.is_scrolling) this.stopScroll();

												if (this.is_playing) {

															//update "is_playing" flag
															this.is_playing = false;

															//stop timer
															if (this.timer) this.timer.stop();

															//create timeline event object
															var e = this.buildEventObject(this.node);

															//notify 'pause'
															if (!silent) this.trigger('pause', e);
												}

												return;
									}

									/**
          * Fired every time the timeline performs the `pause` action
          * @event pause
          * @memberof smx.time.Timeline
          * @return {TimelineEvent}
          */

									/**
            * Toggles the timeline, will perform `play` or `pause` depending on
            * current timeline status
            */

						}, {
									key: 'toggle',
									value: function toggle() {

												//if (!this.is_scrolling && !this.is_playing) this.play();
												if (!this.is_playing) this.play();else this.pause();

												return;
									}

									/**
          * Finishes the timeline
          * @fires finish
          */

						}, {
									key: 'finish',
									value: function finish() {

												//update 'is_playing' flag
												//this.is_playing = false;

												//rewind
												//this.seekTo(0);
												this.pause();

												//stop timer
												if (this.timer) this.timer.reset();

												//create timeline event object
												var e = this.buildEventObject(this.node);

												//notify reset
												this.trigger('finish', e);

												return;
									}

									/**
          * Fired every time the timeline performs the `finish` action
          * @event finish
          * @memberof smx.time.Timeline
          * @return {TimelineEvent}
          */

									/**
          * Resets the timeline to 0
          * @fires reset
          */

						}, {
									key: 'reset',
									value: function reset() {

												//update 'is_playing' flag
												this.is_playing = false;

												//reset timer
												if (this.timer) this.timer.reset();

												//rewind
												this.seekTo(0);

												//notify reset
												this.trigger('reset');

												return;
									}

									/**
          * Fired every time the timeline performs the `reset` action
          * @event reset
          * @memberof smx.time.Timeline
          * @return {TimelineEvent}
          */

									/**
          * Seeks current time to the new given time
          * @param {Number} t - target time
          * @fires seek
          */

						}, {
									key: 'seekTo',
									value: function seekTo(t) {

												//check for "is_ready" flag
												if (!this.is_ready) return;

												//trying seek to start?
												t = t ? t <= 0 ? 0 : t : 0;

												//update time
												if (this.timer) this.timer.setTime(t); //from timer
												else this.update(t);

												//notify seek
												this.trigger('seek', t);

												return;
									}

									/**
          * Fired every time the timeline performs the `seekTo` action
          * @event seek
          * @memberof smx.time.Timeline
          * @return {TimelineEvent}
          */

									/*
         this.scroll = function(factor){
         			if (!this.scroller) return;
         			if(!_.isNumber(factor) || factor===0){
         				//set scroll factor
         		this.stopScroll();
         				return;
         			}
         			//pause timeline while scrolling
         	this.pause();
         			//update 'is_scrolling' flag
         	this.is_scrolling = true;
         			//set scroll factor
         	this.scroller.factor = factor;
         			//sync scroller with timer
         	this.scroller.time = this.timer.time;
         			//start scroll timer if is not already started
         	if(this.scroller.paused) this.scroller.start();
         
         	return;
         
         };
         		this.stopScroll = function(){
         			if (!this.scroller) return;
         			//set scroll factor
         	this.scroller.factor = 0;
         			//stop scroll timer
         	this.scroller.stop();
         			//update 'is_scrolling' flag
         	this.is_scrolling = false;
         			return;
         
         };
         		this.onscroll = function(time){
         			if(this.is_playing || !this.is_scrolling){
         		this.stopScroll();	return;
         	}
         			//process parameter
         	var t = (typeof time != 'undefined')? parseInt(time) : false;
         			//update time
         	if (this.scroller)	t = this.scroller.time; //update from timer
         			//prevent LEFT timeline offset
         	if (t<0){
         		t = 0;
         		this.stopScroll();
         	}
         			//prevent RIGHT timeline offset
         	var max = this.duration*1000;
         	if (t>=max){
         		t = max;
         		this.stopScroll();
         	}
         			this.seekTo(t);
         			return;
         
         };
         */

						}, {
									key: 'buildEventObject',
									value: function buildEventObject(target) {

												var TimelineEvent = {

															'target': target,
															'active': this.activeNodes,
															'time': this.time,
															'duration': this.duration,
															'progress': this.time / 1000 * 100 / this.duration

												};

												return TimelineEvent;
									}

									/**
          * destroys the timeline
          * @fires destroy
          */

						}, {
									key: 'destroy',
									value: function destroy() {

												//destroy timer
												this.destroyTimer();

												//notify destroy
												this.trigger('destroy');

												return;
									}

									/**
          * Fired when the timeline is destroyed
          * @event destroy
          * @memberof smx.time.Timeline
          * @return {TimelineEvent}
          */

						}, {
									key: '_debug',
									value: function _debug(msg) {
												if (this.debug) debug.log(msg);
									}
						}]);

						return Timeline;
			}();

			//expose

			window.smx.time.Timeline = Timeline;
})(window.smx);
//# sourceMappingURL=Timeline.js.map
;"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (smx) {

  /**
   * TimelineEvent Class
   * @memberof smx.time
   */
  var TimelineEvent =

  /**
   * creates a new TimelineEvent
   * @param {Node} node node to be used as timeline base
   * @return {TimelineEvent}
   */
  function TimelineEvent(playhead) {
    _classCallCheck(this, TimelineEvent);

    /**
     * @type {Node}
     */
    this.target = target;

    /**
     * @type {Node[]}
     */
    this.active = playhead.activeNodes;

    /**
     * @type {Number}
     */
    this.time = playhead.time;

    /**
     * @type {Number}
     */
    this.duration = playhead.duration;

    /**
     * @type {Number}
     */
    this.progress = this.time / 1000 * 100 / this.duration;
  };

  //expose


  window.smx.time.TimelineEvent = TimelineEvent;
})(window.smx);
//# sourceMappingURL=TimelineEvent.js.map
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (global, _, Backbone, smx) {

	/**
 * SMX Playhead class
 * @memberof smx
 */
	var Playhead = function () {

		/**
   * Create a playhead
   * @param {Document} document - The document to navigate through
   */
		function Playhead(doc) {
			_classCallCheck(this, Playhead);

			//document argument is required!
			if (!doc) return;

			//extend with events on, off, trigger
			_.extend(this, Backbone.Events);

			/**
    * The document to navigate through
    * @type {Document}
    * @private
    */
			this._document = doc;

			/**
    * Contains all nodes in which playhead has entered
    * List ordered from outter to inner [root, ..., currentnode]
    * @type {Array.<Node>}
    * @private
    */
			this._path = [];

			/**
    * Currently active timeline
    * @type {Timeline}
    */
			this.timeline = null;

			/**
    * List of nodes entered in last movement
    * @type {Array.<Node>}
    * @private
    */
			this._entered = [];

			/**
    * List of nodes exited in last movement
    * @type {Array.<Node>}
    * @private
    */
			this._exited = [];
		}

		/**
   * Gets the associated document
   * @type {Document}
   * @readonly
   */


		_createClass(Playhead, [{
			key: 'get',


			/**
    * Property getter
    * @param {String} key - property key name
    * @return {Node} property value
    * @summary Composes a list of functions.
    */
			value: function get(key) {

				switch (key) {
					case 'selected':
						return this._path;
						break;
					case 'head':
						return this._path[this._path.length - 1];
						break;
					case 'root':
						return this._path[0];
						break;
					case 'entered':
						return this._entered;
						break;
					case 'exited':
						return this._exited;
						break;
					default:
						return;
						break;

				}
			}

			/**
    * Performs play action
    * @param {String} id node identifier
    */

		}, {
			key: 'play',
			value: function play(id) {

				var cnode = null;
				var options = {};

				//get target node
				if (!id) cnode = this.get('head');else cnode = this.document.getNodeById(id);

				if (!cnode) return;

				//check for node accesibility
				if (!cnode.isAccesible()) return;

				//if current node has timeline return node play result
				//if( cnode.timeline && this.timeline ) return this.timeline.play();
				if (this.timeline) return this.timeline.play();

				//if has childs get firstchild
				//else get next node in the global timeline
				var first = cnode.first;if (first) cnode = first;

				if (!cnode.isAccesible()) return;

				return this.go(cnode, options);
			}

			/**
    * performs pause action
    */

		}, {
			key: 'pause',
			value: function pause() {

				//call timeline pause
				if (this.timeline) this.timeline.pause();

				return;
			}

			/**
    * performs toggle action, alternating from playing to paused
    */

		}, {
			key: 'toggle',
			value: function toggle() {

				//call timeline toggle
				if (this.timeline) this.timeline.toggle();

				return;
			}

			/**
    * navigate to next Node if exists
    */

		}, {
			key: 'next',
			value: function next() {

				//get current node
				var cnode = this.get('head');if (!cnode) return;

				//get next node
				var tnode = cnode.next;if (!tnode) return;

				//check for accesibility
				if (!tnode.isAccesible()) return;

				//go to next node using known swap type and passing recived params
				return this.go(tnode, { 'swap_type': 'next' });
			}

			/**
    * navigate to previous Node if exists
    */

		}, {
			key: 'previous',
			value: function previous() {

				//get current node
				var cnode = this.get('head');if (!cnode) return;

				//get previous node
				var tnode = cnode.previous;if (!tnode) return;

				//check for accesibility
				if (!tnode.isAccesible()) return;

				//go to previous node using known swap type and passing recived params
				return this.go(tnode, { 'swap_type': 'previous' });
			}

			/**
    * navigate inside current Node if posible
    */

		}, {
			key: 'inside',
			value: function inside() {

				//get current node
				var cnode = this.get('head');if (!cnode) return;

				//inside navigation is only allowed above nodes without timeline
				if (cnode.timeline) return;

				//get children nodes
				var children = cnode.children;

				//no children?
				if (!children.length) return;

				//get first child
				var tnode = children[0];

				//check for accesibility
				if (!tnode.isAccesible()) return;

				//go to child node using known swap type and passing recived params
				return this.go(tnode, { 'swap_type': 'inside' });
			}

			/**
    * navigate outside current Node if posible
    */

		}, {
			key: 'outside',
			value: function outside() {

				//get current node
				var cnode = this.get('head');if (!cnode) return;

				//has parent node?
				if (!cnode.parent) return;

				//get parent node
				var tnode = cnode.parent;

				//go to child node using known swap type and passing recived params
				return this.go(tnode, { 'swap_type': 'outside' });
			}

			/**
    * navigates up root
    */

		}, {
			key: 'reset',
			value: function reset() {

				//get root node
				var rootnode = this.get('root');

				//root node is required!
				if (!rootnode) return;

				//go to root node
				return this.go(rootnode);
			}

			/**
    * Goes to next node in flat tree mode
    */

		}, {
			key: 'forward',
			value: function forward() {

				var tnode = void 0,
				    cnode = void 0,
				    children = void 0;

				//get current node
				cnode = this.get('head');

				//no current node? ignore
				if (!cnode) return;

				if (!cnode.time('timeline') && !cnode.time('timed')) {

					children = cnode.children;

					if (!children.length) tnode = cnode.next;else tnode = cnode.first;
				} else {
					tnode = cnode.next;
				}

				if (!tnode) {

					var parent = cnode.parent;
					while (parent && !tnode) {
						tnode = parent.next;
						parent = parent.parent;
					}
				}

				if (!tnode.isAccesible()) return;
				return this.go(tnode);
			}

			/**
    * Goes to previous node in flat tree mode
    */

		}, {
			key: 'backward',
			value: function backward() {

				var tnode;

				if (!this.head) return;

				if (this.head.previous) {
					tnode = this.head.previous;
				} else if (this.head.parent) {
					tnode = this.head.parent;
				}

				if (!tnode || !tnode.isAccesible()) return;
				return this.go(tnode);
			}

			/**
    * Go to given node
    */

		}, {
			key: 'go',
			value: function go(ref, opt) {

				//is ref a keyword?
				//keywords always strings prefixed with '!'
				if (_.isString(ref) && ref.indexOf('!') === 0) {

					//remove '!' prefix
					var keyword = ref.substr(1);

					//define known keywords
					var keywords = ['play', 'pause', 'toggle', 'next', 'previous', 'inside', 'outside', 'root'];

					//is known keyword?
					if (keywords.indexOf(keyword)) {

						//get go method by keyword
						var method = this[keyword];

						//tries executing the method
						try {
							return _.bind(method, this)();
						} catch (e) {
							throw new Error('KEYWORD EXEC ERROR "!' + keyword + '"');
						}
					}

					//unknow keyword...
					throw new Error('UNKNOWN KEYWORD "!"' + keyword + '"');
				}

				//normalize given ref, maybe be string or SMXNnode
				var tnode = _.isString(ref) ? this.document.getNodeById(ref) : ref;

				// GET CURRENT NODE
				var cnode = this.get('head');

				//NODE NOT FOUND
				if (!tnode) throw new Error('NODE WAS NOT FOUND');

				//TARGET NODE == CURRENT NODE ?
				//if (cnode) if (cnode.id == tnode.id) throw new Error('201');
				if (cnode == tnode) return cnode;

				//IS TARGET NODE INSIDE TIMELINE?
				//playhead cannot access nodes inside a timeline
				if (tnode.time('timed')) throw new Error('NODE "' + tnode.id + '" IS NOT VISITABLE');

				//IS TARGET NODE ACCESIBLE ?
				if (!tnode.isAccesible() && !global.app.config.FREE_ACCESS) throw new Error('NODE "' + cnode.id + '" IS NOT ACCESIBLE');

				/**
    	HERE YOU CAN PLUG ASYNC NAVIGATION CONTROLLERS... like SCORMX or VMSCO or...
    	*/

				try {

					var async = this.requestAsyncNodeAccess(tnode);

					if (async) {

						this.trigger('sync', async);
						return;
					}
				} catch (e) {}

				/*****/

				//INITIALIZE OPTIONS
				var options = { 'swap_type': null };
				if (opt) {
					options = { 'swap_type': opt.swap_type || null };
				}

				//RESET PRIVATE MOVE REGISTRY
				this._entered = [];this._exited = [];

				//if 'autoplay' behavior is enabled call
				if (tnode.autoplay === true && tnode.children.length > 0) {
					return this.go(tnode.cnode.getFirstChild(), options);
				}

				//We are going to check for multiple node swaping posibilities.
				//Being selective should be faster than using the iterative method.

				//if swap_type parameter was not defined tries to autodetect direct values
				if (!options.swap_type) {

					if (!cnode) options.swap_type = 'from_root';else if (cnode.isParentOf(tnode)) options.swap_type = 'child';else if (tnode.isParentOf(cnode)) options.swap_type = 'parent';else if (cnode.parent && tnode.parent && cnode.parent.id === tnode.parent.id) options.swap_type = 'sibling';
				}

				//Do all required 'enter' and 'exit' calls for node navigation
				switch (options.swap_type) {

					case 'outside':
						//exit from current
						this._exitNode(cnode);
						//we are already inside tnode because tnode is first parent of cnode
						//but re-enter for trigger 'enter' event
						this._enterNode(tnode);
						break;
					case 'inside':
						//enter in child node
						this._enterNode(tnode);
						break;
					case 'next':
					case 'previous':
					case 'sibling':
						//exit from current
						this._exitNode(cnode);
						//enter in sibling node
						this._enterNode(tnode);
						break;
					case 'from_root':
						//enter all nodes from root to tnode
						this._enterStraight(null, tnode);
						break;
					case 'child':
						//enter all nodes cnode to tnode
						this._enterStraight(cnode, tnode);
						break;
					case 'parent':

						//navigates parents from cnode until reach tnode
						var ref_node = cnode;
						var tnode_found = false;
						while (ref_node.parent && !tnode_found) {
							//exit from ref_node
							this._exitNode(ref_node);
							//update ref_node
							ref_node = ref_node.parent;
							//tnode found?
							if (ref_node.id == tnode.id) tnode_found = true;
						}

						//we are already inside tnode because tnode is parent of cnode
						//but re-enter for trigger 'enter' event
						this._enterNode(tnode);

						break;
					default:
						//iterative method
						this._goIterative(cnode, tnode);
						break;
				}

				//TIMELINE?

				//create timeline, will only be created if its possible and if its needed
				if (tnode.time('timeline')) this._createTimeline();

				//FIRE EVENTS

				//FIRE 'LEAVE' EVENT
				if (cnode) {
					//fire generic 'leave' event in resulting current node
					this.trigger('leave', cnode);
					//fire specific node 'leave' event
					this.trigger('leave:' + cnode.id, cnode);
				}

				/* NOSTOP ATTRIBUTE WARNING VERY EXPERIMENTAL CODE BELOW */

				// node having the 'nostop' attribute prevents the playhead to stop on it
				var nostop = tnode.has('nostop');

				if (nostop && tnode.id != this.get('root').id) {

					var entered = this.get('entered');
					var exited = this.get('exited');

					if (entered.length > 0) {
						if (entered[entered.length - 1].id == tnode.id) {

							if (tnode.children.length > 0) {
								return this.inside();
							} else {
								if (tnode.parent) {
									return this.outside();
								} else {
									this.root();
								}
							}
						} else {
							this.root();
						}
					} else if (exited.length > 0) {

						if (exited[0].isChildOf(tnode)) {
							if (tnode.parent) {
								return this.outside();
							} else {
								this.root();
							}
						} else {
							this.root();
						}
					} else {
						this.root();
					}
				} else {

					//DEFAULT BEHAVIOIR


					//FIRE 'STAY' EVENT
					//fire generic 'stay' event in resulting current node
					this.trigger('stay', tnode);
					//fire specific node 'stay' event
					this.trigger('stay:' + tnode.id, tnode);

					//FIRE 'READY' EVENT
					//notify node navigation completed
					this.trigger('ready', tnode);

					//return resultant current node
					return this.get('head');
				}
			}

			/* PRIVATE METHODS */

			/**
    * Performs a head transition from current to target node
    * @private
    * @param {Node} current - current node
    * @param {Node} target - target node
    */

		}, {
			key: '_goIterative',
			value: function _goIterative(cnode, tnode) {

				//ok! we are going to navigates from cnode(current node) to tnode(target node). Lets go!

				//navigates from root
				if (!cnode) this._enterStraight(null, tnode);else {
					//navigates from current node

					//looks parents for a common parent between current and target node
					var ref_node = cnode;
					var common_parent = null;
					while (ref_node && ref_node.parent && !common_parent) {

						//exit nodes at same that searches
						this._exitNode(ref_node);

						ref_node = ref_node.parent;
						if (ref_node.isParentOf(tnode)) common_parent = ref_node;
					}

					//was common parent found?
					if (common_parent) {
						this._enterStraight(common_parent, tnode);
					} else {
						this._enterStraight(null, tnode);
					}
				}
			}

			/**
    * Performs a head transition from parent to child node
    * @private
    * @param {Node} parent - parent node
    * @param {Node} child - child node
    */

		}, {
			key: '_enterStraight',
			value: function _enterStraight(parentnode, child_node) {

				//Performs iterative 'enter' method on child nodes from parentnode to a known child_node

				//check if child_node is not child of parentnode
				if (parentnode && !parentnode.isParentOf(child_node)) return;

				//creates a parent nodes array from child node
				var child_node_parents = [];

				//looks parents and fills the array until reach known parentnode
				var ref_node = child_node;
				var parentnode_reached = false;
				while (ref_node && ref_node.parent && !parentnode_reached) {
					ref_node = ref_node.parent;
					if (parentnode) if (ref_node.id == parentnode.id) parentnode_reached = true;

					if (ref_node && !parentnode_reached) child_node_parents.unshift(ref_node);
				}

				//call 'enter' method in each parent node
				for (var p = 0; p < child_node_parents.length; p++) {
					this._enterNode(child_node_parents[p]);
				}

				//call 'enter' method in child node
				this._enterNode(child_node);
			}

			/**
    * Enters in given node
    * @private
    * @param {Node} node
    * @fires enter
    */

		}, {
			key: '_enterNode',
			value: function _enterNode(_node) {

				//prevent re-enter in a node
				var selectedIds = _.map(this._path, 'id');
				if (_.includes(selectedIds, _node.id)) return;

				//update selection array
				this._path.push(_node);

				//update last move registry
				this._entered.push(_node);

				//fire generic 'enter' event
				this.trigger('enter', _node);

				//fire specific node 'enter' event
				this.trigger('enter:' + _node.id, _node);

				return;
			}

			/**
    * Exits from given node
    * @private
    * @param {Node} node
    */

		}, {
			key: '_exitNode',
			value: function _exitNode(_node) {

				//clear timeline
				if (this.timeline) this._destroyTimeline();

				//update blocks array
				this._path.pop();

				//update last move registry
				this._exited.push(_node);

				//fire generic 'exit' event
				this.trigger('exit', _node);

				//fire specific node 'exit' event
				this.trigger('exit:' + _node.id, _node);

				return;
			}

			/**
    * Fired when entering to any node
    * @event enter
    * @memberof smx.Playhead
    * @return {PlayheadEvent}
    */

			/**
    * Fired just after `enter` but for a specific node
    * @event enter:id
    * @memberof smx.Playhead
    * @return {PlayheadEvent}
    */

			/**
    * Fired when exiting from any node
    * @event exit
    * @memberof smx.Playhead
    * @return {PlayheadEvent}
    */

			/**
    * Fired just after `exit` but for a specific node
    * @event exit:id
    * @memberof smx.Playhead
    * @return {PlayheadEvent}
    */

			/**
    * Fired every time a head change occurs and stays on any node
    * @event stay
    * @memberof smx.Playhead
    * @return {PlayheadEvent}
    */

			/**
    * Fired just after `stay` but for a specific node
    * @event stay:id
    * @memberof smx.Playhead
    * @return {PlayheadEvent}
    */

			/**
    * Fired every time a node stops being the head
    * @event leave
    * @memberof smx.Playhead
    * @return {PlayheadEvent}
    */

			/**
    * Fired just after `leave` but for a specific node
    * @event leave:id
    * @memberof smx.Playhead
    * @return {PlayheadEvent}
    */

			/**
    * Fired every time the playhead finishes all operations and goes idle
    * @event ready
    * @memberof smx.Playhead
    * @return {PlayheadEvent}
    */

			/**
    * Fired when playhed goes to sync mode
    * @event sync
    * @memberof smx.Playhead
    * @return {PlayheadEvent}
    */

			/**
    *	TIMELINE HANDLING
    *	These methods just propagate the timeline events as nested playhead events
    *	Useful for listening to timeline events even when timeline does not exists
    *	Also useful for having a centralized playhead activity
    */

			/**
    * @private
    */

		}, {
			key: '_createTimeline',
			value: function _createTimeline() {

				var cnode = this.get('head');
				if (!cnode) return;

				//destroy current timeline if needed
				if (this.timeline) this._destroyTimeline();

				//create timeline
				this.timeline = new smx.time.Timeline(cnode);

				//setup listeners
				this._bindTimelineListeners();

				return;
			}

			/**
    * @private
    */

		}, {
			key: '_destroyTimeline',
			value: function _destroyTimeline() {

				//remove listeners
				this._unbindTimelineListeners();

				//destroy timeline
				this.timeline.destroy();

				//reset timeline
				this.timeline = null;

				return;
			}

			/**
    * Binds listeners to timeline events to propagate them up as playhead
    * events prefixed with `timeline:`, useful for listening to timeline
    * events even when timeline does not exists. Also useful for having a
    * centralized playhead activity.
    * @private
    */

		}, {
			key: '_bindTimelineListeners',
			value: function _bindTimelineListeners() {

				if (!this.timeline) return;

				this.timeline.on('play', this._onTimelinePlay, this);
				this.timeline.on('pause', this._onTimelinePause, this);
				this.timeline.on('update', this._onTimelineUpdate, this);
				this.timeline.on('seek', this._onTimelineSeek, this);
				this.timeline.on('reset', this._onTimelineReset, this);
				this.timeline.on('enter', this._onTimelineEnter, this);
				this.timeline.on('exit', this._onTimelineExit, this);
				this.timeline.on('finish', this._onTimelineFinish, this);

				return;
			}

			/**
    * Unbinds all timeline event listeners
    * @private
    */

		}, {
			key: '_unbindTimelineListeners',
			value: function _unbindTimelineListeners() {

				if (!this.timeline) return;

				this.timeline.off('play', this._onTimelinePlay, this);
				this.timeline.off('pause', this._onTimelinePause, this);
				this.timeline.off('update', this._onTimelineUpdate, this);
				this.timeline.off('seek', this._onTimelineSeek, this);
				this.timeline.off('reset', this._onTimelineReset, this);
				this.timeline.off('enter', this._onTimelineEnter, this);
				this.timeline.off('exit', this._onTimelineExit, this);
				this.timeline.off('finish', this._onTimelineFinish, this);

				return;
			}

			/**
    * @event timeline:play
    * @memberof smx.Playhead
    */

		}, {
			key: '_onTimelinePlay',
			value: function _onTimelinePlay(event) {
				this.trigger('timeline:play', event);return;
			}

			/**
    * @event timeline:pause
    * @memberof smx.Playhead
    * @return {PlayheadEvent}
    */

		}, {
			key: '_onTimelinePause',
			value: function _onTimelinePause(event) {
				this.trigger('timeline:pause', event);return;
			}

			/**
    * @event timeline:update
    * @memberof smx.Playhead
    * @return {PlayheadEvent}
    */

		}, {
			key: '_onTimelineUpdate',
			value: function _onTimelineUpdate(event) {
				this.trigger('timeline:update', event);return;
			}

			/**
    * @event timeline:seek
    * @memberof smx.Playhead
    * @return {PlayheadEvent}
    */

		}, {
			key: '_onTimelineSeek',
			value: function _onTimelineSeek(event) {
				this.trigger('timeline:seek', event);return;
			}

			/**
    * @event timeline:finish
    * @memberof smx.Playhead
    * @return {PlayheadEvent}
    */

		}, {
			key: '_onTimelineFinish',
			value: function _onTimelineFinish(event) {
				this.trigger('timeline:finish', event);return;
			}

			/**
    * @event timeline:reset
    * @memberof smx.Playhead
    * @return {PlayheadEvent}
    */

		}, {
			key: '_onTimelineReset',
			value: function _onTimelineReset(event) {
				this.trigger('timeline:reset', event);return;
			}

			/**
    * @event timeline:enter
    * @memberof smx.Playhead
    * @return {PlayheadEvent}
    */

		}, {
			key: '_onTimelineEnter',
			value: function _onTimelineEnter(event) {
				this.trigger('timeline:enter', event);return;
			}

			/**
    * @event timeline:exit
    * @memberof smx.Playhead
    * @return {PlayheadEvent}
    */

		}, {
			key: '_onTimelineExit',
			value: function _onTimelineExit(event) {
				this.trigger('timeline:exit', event);return;
			}

			/**
    * check wether a node access should be async or not, default to false, needs overwritting
    */

		}, {
			key: 'requestAsyncNodeAccess',
			value: function requestAsyncNodeAccess(node) {

				return false;
			}
		}, {
			key: 'document',
			get: function get() {
				return this._document;
			}

			/**
    * Contains all nodes in which playhead has entered
    * List ordered from outter to inner [root, ..., currentnode]
    * @type {Array.<Node>}
    * @readonly
    */

		}, {
			key: 'path',
			get: function get() {
				return this._path;
			}

			/**
    * Gets the last node in the path which is the head
    * @type {Node}
    * @readonly
    */

		}, {
			key: 'head',
			get: function get() {
				return this._path[this._path.length - 1];
			}

			/**
    * Gets the first node in the path which is the root
    * @type {Node}
    * @readonly
    */

		}, {
			key: 'root',
			get: function get() {
				return this._path[0];
			}
		}]);

		return Playhead;
	}();

	//expose to global


	smx.Playhead = Playhead;
})(window, window._, window.Backbone, window.smx);
//# sourceMappingURL=Playhead.js.map
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (global, _, smx) {

  /**
   * SMX Finder Class
   * @memberof smx
   */

  var Finder = function () {

    /**
     * @param {Document} document - The document in which to search
     */
    function Finder(doc) {
      _classCallCheck(this, Finder);

      //SMXDocument to find in
      this.document = doc;

      //default options object
      this.options = {

        //base selector
        selector: '',

        //case sensivity
        sensitive: false,

        //accents sensivity
        insensitive: false,

        //include selectors
        include: [],

        //exclude selectors
        exclude: [],

        //tags
        tags: []

      };
    }

    /**
     * Performs a search
     * @param {String} query string
     * @param {Object=} options
     * @return {Object[]}
     */


    _createClass(Finder, [{
      key: 'find',
      value: function find(str, opts) {

        var results = [];

        //empty or invalid str return empty results array
        if (!_.isString(str) || str === '') return results;

        var options = _.defaults(opts || {}, this.options);

        str = options.sensitive ? str : str.toLowerCase();

        var doc = this.document;

        var json;

        if (options.selector + '') {

          var nodes = doc.find(options.selector);

          var ids = _.pluck(nodes, 'id');

          var datas = [];

          _.each($meta, function (value, key, list) {

            if (_.includes(ids, key)) datas.push(value);
          });

          json = _.map(datas, function (data, index) {
            data.id = ids[index];return data;
          });
        } else {

          var _ids = _.keys($meta);
          var values = _.values($meta);

          json = _.map(values, function (value, index) {
            value.id = _ids[index];return value;
          });
        }

        _.each(json, function (item) {

          //save id property for later use and delete it
          //so loop wont process it and will run faster
          var id = item.id + '';delete item.id;

          _.each(item, function (value, key) {

            //ignore empty string and non string values...
            var is_valid_string = _.isString(value) && !_.isEmpty(value) ? true : false;

            if (is_valid_string) {

              var _value = options.sensitive ? value : value.toLowerCase();

              if (_value.indexOf(str) >= 0) {

                results.push({
                  'node': doc.getNodeById(id),
                  'meta': key,
                  'value': value
                });
              }
            }
          });
        });

        results = _.uniq(results);

        return results;
      }
    }]);

    return Finder;
  }();

  //expose


  smx.Finder = Finder;
})(window, window._, window.smx);
//# sourceMappingURL=SMXFinder.js.map
;"use strict";

(function (win, smx) {

  /**
   * Tracking namespace
   * @namespace tracking
   * @memberof smx
   */

  smx.tracking = {};

  /**
   * Tracking Attributes namespace
   * @namespace attributes
   * @memberof smx.tracking
   */
  smx.tracking.attributes = {};
})(window, window.smx);
//# sourceMappingURL=tracking.js.map
;'use strict';

(function (win, smx) {

	//private aux debug system
	var DEBUG = true;var LOG = function LOG(str) {
		if (win.console && win.console.log && DEBUG) win.console.log('TRACKING: ' + str);
	};

	/**
  * SMX TrackManager class
  * @class TrackManager
  * @memberof smx.tracking
  * @param {Document} document
  */
	var TrackManager = function TrackManager(doc) {

		//document
		if (!doc) return;

		//extend with Backbone Events
		_.extend(this, Backbone.Events);

		//ready flag
		this.ready = false;

		//set document
		this.document = doc;

		//set playhead
		this.playhead = doc.playhead;

		//trigger collection
		this.triggers = {};

		//ignore triggers flag, if true, triggers will be ignored
		this.ignore_triggers = false;

		//track collection
		this.collection = new Backbone.Collection();

		this.attrControllers = smx.tracking.attributes;

		this.initializeDocument(_.bind(function () {
			this.setReady();
		}, this));

		return this;
	};

	TrackManager.prototype.setReady = function () {

		this.ready = true;
		this.trigger('ready');

		return;
	};

	TrackManager.prototype.initializeDocument = function (_callback) {

		//Creates a track for all nodes in document with track attributes.
		//Any node could have a track except non smx nodes, so ignore any node
		//with `type` attribute defined different from smx
		var selector = '*:not([type!="smx"] *):not([type] *)';

		//get all smx nodes
		var nodes = this.document.find(selector);

		//add document node itself to list
		nodes.unshift(this.document);

		//exclude nodes without any track-* attribute
		nodes = _.without(nodes, function (n) {
			return n.isTracking();
		});

		// create a track for each node
		for (var n = 0; n < nodes.length; n++) {

			var node = nodes[n];

			var attrs = node[0].attributes;

			//create empty object for tracking attributes
			var track_attrs = {};

			//add node id
			track_attrs.id = node.id;

			//add all attributes which names start with 'track-'
			for (var i = 0; i < attrs.length; i++) {
				var attr_name = attrs[i].name;
				var attr_value = attrs[i].value;
				if (attr_name.indexOf("track-") === 0) {
					attr_name = attr_name.substr(6);
					track_attrs[attr_name] = attr_value;
				}
			}

			if (node.parent) track_attrs.parent = node.parent.id;

			//create a new Track with catched attributes
			var track = new Backbone.Model(track_attrs);

			//add just created to track to collection
			this.collection.add(track);
		}

		//set collection changes observer
		this.collection.on('change', this._onCollectionChange, this);

		//set playhead observers
		this.playhead.on('enter', this.onNodeEnter, this);
		this.playhead.on('exit', this.onNodeExit, this);

		//set timeline observers
		//this.playhead.on('timeline:enter', this.onTimelineNodeEnter, this);
		//this.playhead.on('timeline:exit', this.onTimelineNodeExit, this);
		//this.playhead.on('timeline:play', this.onTimelinePlay, this);
		//this.playhead.on('timeline:pause', this.onTimelinePause, this);
		//this.playhead.on('timeline:update', this.onTimelineUpdate, this);
		//this.playhead.on('timeline:finish', this.onTimelineFinish, this);


		this.setTriggers(_callback);

		return this;
	};

	TrackManager.prototype.setTriggers = function (_callback) {

		var nodes = this.document.find('[track-trigger]:not([track-trigger-processed])');
		if (this.document.has('track-trigger')) nodes.push(this.document);

		var parseTriggerExpression = function parseTriggerExpression(exp) {

			try {

				/*
    			format like this
    	
    	on @ progress >= 100 ? tracking.set( this | status | 2 )
    	once @ views == 1 ? tracking.set( next | access | 0 )
    	...
    		*/

				var parts = exp.split('@');

				//get method
				var method = parts[0];

				//get condition
				parts[1] = parts[1].split('?');
				var cond = parts[1][0];

				//get operator
				var known_operators = ['==', '!=', '>=', '<=', '=', '>', '<'];
				var match_cond = '';

				var o = 0;
				while (o < known_operators.length && match_cond == '') {

					var op = known_operators[o];
					if (cond.indexOf(op) != -1) match_cond = op;

					o++;
				}

				var operator = match_cond.trim();

				var cond = cond.split(operator);

				var cond_a = cond[0];
				var cond_b = cond[1];

				//get callback
				var call = parts[1][1];

				var call_parts = call.split("(");
				var call_parts2 = call_parts[1].split(")");

				var call_name = call_parts[0];
				var call_args = call_parts2[0];

				call_args = call_args.split('|');
				_.each(call_args, function (item, index) {
					call_args[index] = item.trim();
				});

				var trigger = {
					'method': method.trim(),
					'condition': {
						'key': cond_a.trim(),
						'operator': operator.trim(),
						'value': cond_b.trim()
					},
					'callback': {
						'name': call_name.trim(),
						'arguments': call_args
					}
				};

				return trigger;
			} catch (e) {

				LOG('ERROR parsing track-trigger ' + exp);

				return;
			}

			return;
		};

		var max_iterations = 10;
		var iterations = 0;

		for (var i = 0; i < nodes.length && iterations < max_iterations; i++) {

			var node = nodes[i];

			var trigger_attr = node.attr('track-trigger');

			var exps = trigger_attr.split(',');

			for (var e = 0; e < exps.length; e++) {

				//parse trigger expression
				var trigger = parseTriggerExpression(exps[e]);
				//LOG(trigger);

				//apply trigger
				this.setTrigger(node, trigger);
			}

			node[0].setAttribute('track-trigger-processed', 'true');

			iterations++;
		}

		LOG('SETTING UP TRACK TRIGGERS!');

		var __callback = _callback ? _callback : function () {};

		if (iterations < nodes.length) _.delay(_.bind(function () {
			this.setTriggers(__callback);
		}, this), 0);else _callback();

		return;
	};

	TrackManager.prototype.setTrigger = function (node, trigger) {

		//generate trigger GUID
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		};
		function guid() {
			return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
		};

		//get new guid
		trigger.code = guid();

		//prevent duplicated triggers
		if (this.triggers[trigger.code]) return;

		//add trigger to trigger collection
		this.triggers[trigger.code] = trigger;

		if (!this.has(node.id, trigger.condition.key)) return;

		var callback = function callback(track) {

			if (this.ignore_triggers) return;

			var val = this.get(node.id, trigger.condition.key);

			var v1 = val;
			var v2 = trigger.condition.value;
			var ev = '';

			//check for numeric operation and convert numbers
			if (trigger.condition.operator.indexOf('<') >= 0 || trigger.condition.operator.indexOf('>') >= 0) {
				ev = '( parseFloat("' + v1 + '") ' + trigger.condition.operator + ' parseFloat("' + v2 + '") )';
			} else {
				ev = '( "' + v1 + '" ' + trigger.condition.operator + ' "' + v2 + '" )';
			}

			var result = eval(ev);

			if (result) {

				if (trigger.callback.name.indexOf('playhead') === 0) {

					try {

						//var playhead = this.playhead;
						var CALLBACK = trigger.callback.name;

						_.defer(function () {
							eval(CALLBACK + '()');
						});
					} catch (e) {}
				} else {

					if (trigger.callback.name == 'tracking.set') {

						var args = trigger.callback.arguments;

						var alias = ['next', 'previous', 'parent', 'first', 'last', 'root'];
						var id = args[0];
						var target = id + "";
						if (_.includes(alias, id)) target = node[id]();else if (id == 'this') target = node.id;else if (!_.isString(target)) target = target.id;

						//normalize target as id (String)
						if (target && target.id) target = target.id;

						//aliased?? wtf!?
						//var value_aliased = this.get(node.id,expval);
						//if(value_aliased) args[2] = value_aliased;


						//eval!!!
						var exp = (args[2] + '').trim();
						var fn = new Function('value', 'var v;try{v=(' + exp + ')}catch(e){}return v;');
						var expval = fn(v1);

						if (target) this.set(target, args[1], expval, args[3] || false);

						LOG(target + ' ' + args[1] + ' ' + expval + ' ' + (args[3] || false));
					} else if (trigger.callback.name == 'tracking.propagate') {

						var args = trigger.callback.arguments;

						var alias = ['next', 'previous', 'parent', 'first', 'last', 'root'];
						var id = args[0];
						var target = id + "";
						if (_.includes(alias, id)) target = node[id]();else if (id == 'this') target = node.id;else if (!_.isString(target)) target = target.id;

						if (target && target.id) target = target.id;
						if (target) this.propagate(target);
					}
				}
			}
		};

		var event_name = 'change:' + node.id + ':' + trigger.condition.key + '';

		this.on(event_name, callback);
	};

	/*
 TrackManager.prototype.unsetTrigger = function(code){
 
 
 }
 */

	/**
  *	Get raw value for specified node id and attribute key
  *	Uses SMXNode 'raw' method
  *
  *  @param id {string} node id
  *  @param key {string} attribute key
  *  @return {string} resulting value or null
  *
  */

	TrackManager.prototype.raw = function (id, key) {

		//if bad params return undefined
		if (!id || !key) return;

		//get node by id
		var node = this.document.getNodeById(id);

		//if not found node return undefined
		if (!node) return;

		//return value or undefined
		return node.attr('track-' + key);
	};

	/**
  * Answer this question:
  * Has key attribute the node with give id?
  * @param {String} id  - node id
  * @param {String} key - attribute key
  * @return {Boolean} has or not the specified key
  *
  */

	TrackManager.prototype.has = function (id, key) {

		//if bad params return false
		if (!id || !key) return false;

		//get node by id
		var node = this.document.getNodeById(id);

		//if not found node return false
		if (!node) return false;

		//get raw value by key
		var value = node.attr('track-' + key);

		//raw will always return String or null value
		return _.isString(value) ? true : false;
	};

	TrackManager.prototype.get = function (id, key, format) {

		//if bad params return undefined
		if (!id || !key) return;

		//get track by id
		var track = this.collection.get(id);

		//if not found track return undefined
		if (!track) return;

		//if track has no key attr return undefined
		if (!this.has(id, key)) return;

		//get attr controller
		var attrController = this.attrControllers[key];

		//get value
		var value;

		//if exists attr controller and has get method use it
		//else use default get method
		if (attrController && attrController.get) value = attrController.get(track, this, format);else value = track.get(key);

		//return resultant value
		return value;
	};

	TrackManager.prototype.set = function (id, key, value, propagate, recursive) {

		//if bad params exit
		if (!id || !key || typeof value == 'undefined') return;

		//get track by id
		var track = this.collection.get(id);

		//if not found track exit
		if (!track) return;

		//if track has no key attr exit
		if (!this.has(id, key)) return;

		//get attr controller
		var attrController = this.attrControllers[key];

		var val;

		//if exists attr controller and has set method use it
		//else use default set method
		if (attrController && attrController.set) val = attrController.set(value, track, this);else val = track.set(key, value);

		if (propagate) this.propagate(id, key, recursive);

		return val;
	};

	/**
 * Updates tracking data for the given node id
 * @param {String} id - node id
 * @param {String=} key - tracking field key name
 */
	TrackManager.prototype.update = function (id, key) {

		var tracks;

		//get track by given id
		var track = this.collection.get(id);

		//single track or all tracks?
		tracks = track ? [track] : this.collection.models;

		//loop collection in reverse oreder
		//tracks always are added sequentially from document tree
		//tracks are processed from outter to inner in tree so...
		//reversed iteration will update from inner to outter in tree
		//like this we dont need to also propagate tracks

		//update selected tracks
		for (var x = tracks.length - 1; x >= 0; x--) {

			track = tracks[x];

			//single key or all keys?
			var keys = key ? [key] : _.keys(track.attributes);

			//update selected keys
			for (var i = 0; i < keys.length; i++) {
				var handler = this.attrControllers[keys[i]];
				if (handler && handler.update) handler.update(track, this);
			}
		}

		return;
	};

	/**
 * Propagates tracking data for the given node id
 * @param {String} id - node id
 * @param {String=} key - tracking field key name
 * @param {String=} [recursive=false]
 */

	TrackManager.prototype.propagate = function (id, key, recursive) {

		//get track by given id
		var track = this.collection.get(id);

		//no track?
		if (!track) return;

		//updating keys array
		var keys = [];

		//given key? else use all keys,
		if (key) keys.push(key);else keys = _.keys(track.attributes);

		//propagate needed keys
		for (var i = 0; i < keys.length; i++) {
			var handler = this.attrControllers[keys[i]];
			if (handler && handler.propagate) handler.propagate(track, this, recursive);
		}

		return;
	};

	/**
  * Generic handler for track collection changes
  * @name _onCollectionChange
  * @private
  * @memberof smx.tracking.TrackManager
  * @param {Track} track
  * @listens collection!change
  * @fires change
  * @fires change:id
  * @fires change:id:key
  */
	TrackManager.prototype._onCollectionChange = function (track) {

		if (track.changed) {

			//var previous = track.previousAttributes();

			var keys = _.keys(track.changed);

			/*
   for (var i=0; i< keys.length; i++){
   			var previous_value = track.changed[keys[i]];
   			//log it
   	//LOG('#'+track.id + '@'+keys[i]+': '+ previous_value +' -> '+ track.get(keys[i]));
   			//call bubblers
   	var handler = this.attrControllers[keys[i]];
   	if(handler.propagate){
   		handler.propagate(track, this, previous[keys[i]],previous_value);
   	}
   		}
   */

			for (var i = 0; i < keys.length; i++) {

				//fire track-key change event
				var strEvent = 'change:' + track.id + ':' + keys[i];
				this.trigger(strEvent, track);
			}

			//fire track change event
			var strEvent = 'change:' + track.id;
			this.trigger(strEvent, track);
		}

		//fire generic tracking change event
		this.trigger('change', track);

		return;
	};

	/*
 
 TrackManager.prototype.checkBinds = function(node,key,value){
 	
 }
 
 */

	////////////////////////////////
	// PLAYHEAD EVENT HANDLERS

	TrackManager.prototype.onNodeEnter = function (node) {

		if (!node || !node.id) return;

		//get track by node.id
		var track = this.collection.get(node.id);

		//valid track is required
		if (!track) return;

		if (this.has(node.id, 'status') && this.get(node.id, 'status') < 1) this.set(node.id, 'status', 1);

		//propagate recursively
		this.update(node.id);

		return;
	};

	TrackManager.prototype.onNodeExit = function (node) {

		/*
  
  //this is handler for 2 events
  //1 - timeline event, recives event object
  //2- playhead event, node
  
  var node = (event.target)? event.target : event;
  
  //get track by node.id
  var track = this.collection.get(node.id);
  
  //valid track is required
  if(!track) return;
  
  
  var keys = _.keys(this.attrControllers);
  
  for (var i=0;i<keys.length;i++){
  	if(this.attrControllers[keys[i]].onexit) this.attrControllers[keys[i]].onexit(track,this,event);
  }
  
  */

		//propagate recursively
		this.propagate(node.id, null, true, true);

		return;
	};

	TrackManager.prototype.onTimelineNodeEnter = function (evt) {

		if (!evt || !evt.target) return;

		//get id
		var id = evt.target.id;

		//get track by node.id
		var track = this.collection.get(id);

		//valid track is required
		if (!track) return;

		if (this.has(id, 'status') && this.get(id, 'status') < 1) this.set(id, 'status', 1);

		return;
	};

	TrackManager.prototype.onTimelineNodeExit = function (evt) {

		if (!evt || !evt.target) return;

		//get id
		var id = evt.target.id;

		//get track by node.id
		var track = this.collection.get(id);

		//valid track is required
		if (!track) return;

		if (this.has(id, 'status') && this.get(id, 'status') < 2) this.set(id, 'status', 2);

		return;
	};

	TrackManager.prototype.onTimelinePlay = function (event) {

		/*
  //this is handler for 2 events
  //1 - timeline event, recives event object
  //2- playhead event, node
  
  var node = (event.target)? event.target : event;
  
  //get track by node.id
  var track = this.collection.get(node.id);
  
  //valid track is required
  if(!track) return;
  
  
  var keys = _.keys(this.attrControllers);
  
  for (var i=0;i<keys.length;i++){
  	if(this.attrControllers[keys[i]].onplay) this.attrControllers[keys[i]].onplay(track,this,event);
  }
  */

		return;
	};

	TrackManager.prototype.onTimelinePause = function (event) {

		/*
  
  //this is handler for 2 events
  //1 - timeline event, recives event object
  //2- playhead event, node
  
  var node = (event.target)? event.target : event;
  
  //get track by node.id
  var track = this.collection.get(node.id);
  
  //valid track is required
  if(!track) return;
  
  
  var keys = _.keys(this.attrControllers);
  
  for (var i=0;i<keys.length;i++){
  	if(this.attrControllers[keys[i]].onpause) this.attrControllers[keys[i]].onpause(track,this,event);
  }
  
  */
		return;
	};

	TrackManager.prototype.onTimelineUpdate = function (event) {

		var node = event.target ? event.target : event;

		var progress = parseInt(event.progress);

		var previous_progress = node.track('progress', 'value');

		if (progress > previous_progress) this.set(node.id, 'progress', progress);

		return;
	};

	TrackManager.prototype.onTimelineFinish = function (event) {

		var node = event.target ? event.target : event;

		//PROGRESS 100%
		this.set(node.id, 'progress', 100);

		//STATUS COMPLETED
		if (this.has(node.id, 'status') && this.get(node.id, 'status') < 2) this.set(node.id, 'status', 2);

		return;
	};

	/**
  *	EXPORT + IMPORT
  *
  */

	TrackManager.prototype.dictionary = {
		'id': 'a',
		'status': 'b',
		'progress': 'c',
		'points': 'd',
		'access': 'e'
	};

	TrackManager.prototype.exportsCode = function (options) {

		var data = this.exports({
			'format': 'json',
			'onlychanged': true,
			'singlequotes': false
		});

		if (!data || !data.length) return '';

		var str = '';

		var codes = {
			'id': '#',
			'status': '!',
			'progress': '%',
			'points': '$',
			'score': '@',
			'access': '·'
		};

		for (var i = 0; i < data.length; i++) {

			var item = data[i];

			var keys = _.keys(item);
			var values = _.values(item);

			for (var n = 0; n < keys.length; n++) {

				var k = keys[n];
				var v = values[n];

				if (codes[k]) str += codes[k] + v;
			}
		}

		return str;
	};

	/**
  * Exports tracking data
  * @param {Object=} options
  * @return {data}
  */
	TrackManager.prototype.exports = function (options) {

		var defaults = {
			'node': null, // node to use as root
			'format': 'json', // output format ['json'|'text']
			'onlychanged': false, // if true will only return changed attributes
			'codify': false // if true will use dictionary
		};

		options = _.extend(defaults, options || {});

		var myJSON = [];

		var myDictionary = this.dictionary;

		var _this = this;

		this.collection.each(function (item, index) {

			var node = _this.document.getNodeById(item.id);

			if (options.node) {

				if (node.isChildOf(options.node) || options.node.id == node.id) {} else return;
			}

			var isTracking = node.isTracking();

			var obj = {};

			var keys = _.keys(item.attributes);

			//add id property

			if (options.codify && myDictionary['id']) myDictionary['id'] = item.id;else obj.id = item.id;

			for (var a = 0; a < keys.length; a++) {

				var key = keys[a];

				var raw_value = _this.attr(item.id, key);
				var value = _this.attr(item.id, key);

				if (!options.onlychanged) {

					if (options.codify && myDictionary[key]) {
						obj[myDictionary[key]] = item.attributes[key];
					} else {
						obj[key] = item.attributes[key];
					}
				} else {

					if (!_.isUndefined(raw_value) && raw_value != 'none' && raw_value != 'auto') {

						if (key == 'score') {

							if (raw_value[0] != value) {

								if (options.codify && myDictionary[key]) {
									obj[myDictionary[key]] = value;
								} else {
									obj[key] = value;
								}
							}
						} else {

							if (value != raw_value) {

								if (options.codify && myDictionary[key]) {
									obj[myDictionary[key]] = value;
								} else {
									obj[key] = value;
								}
							}
						}
					}
				}
			}

			//add obj to json
			if (!options.onlychanged) myJSON.push(obj);else if (_.size(obj) > 1) myJSON.push(obj);
		});

		//process return value
		if (options.format == 'text') {

			myJSON = JSON.stringify(myJSON);

			//convert doble quotes into single quotes
			if (options.singlequotes) myJSON = myJSON.replace(/"/g, '\'');
		}

		return myJSON;
	};

	/**
  * Imports tracking data
  * @param {Object|String} data
  * @return {data}
  */
	TrackManager.prototype.imports = function (_data_) {

		//no JSON?
		if (!_data_ || !_.isObject(JSON)) return;

		//process input param into data object
		var data = null;

		try {
			if (typeof _data_ == 'string' && _data_ != '') {
				data = eval('(' + _data_ + ')');
			} else {
				data = _data_;
			}
		} catch (e) {}

		//no valid data?
		if (!data || _.isEmpty(data)) return;

		var len = _.size(data);

		//reverse array, getting inner to outter nodes order
		//data = data.reverse();


		//deactivate triggers while merging new data
		this.ignore_triggers = true;

		for (var i = len - 1; i > -1; i--) {

			//try apply processed data
			try {

				var item = data[i];

				var track = this.collection.get(item.id);

				var keys = _.keys(item);

				for (var a = 0; a < keys.length; a++) {

					var key = keys[a];
					if (key != 'trigger' && key != 'id') {

						if (!_.isUndefined(item[key])) {
							//track.set(key, item[key], {'silent':true});
							this.set(item.id, key, item[key]);
						}
					}
				}

				LOG('RESTORE :' + item.id);

				//this.update(item.id);
				//this.propagate(item.id,null,true);

				//this.update();
			} catch (e) {
				return e;
			}
		}

		//re activate triggers
		this.ignore_triggers = false;

		this.update();
	};

	/**
  * Fired when any track changes any of its fields
  * @event change
  * @memberof smx.tracking.TrackManager
  * @return {object}
  */

	/**
  * Fired when the id track changes any of its fields
  * @event change:id
  * @memberof smx.tracking.TrackManager
  * @return {object}
  */

	/**
  * Fired when the id track changes the key field
  * @event change:id:key
  * @memberof smx.tracking.TrackManager
  * @return {object}
  */

	//expose
	smx.tracking.TrackManager = TrackManager;
})(window, window.smx);
//# sourceMappingURL=TrackManager.js.map
;'use strict';

////////////////////////////////
// PROGRESS
////////////////////////////////

(function (smx) {

		var ProgressAttributeController = {

				name: 'progress',

				defaults: '0',

				get: function get(model, collection, format) {

						//model has attribute?
						if (!model.has(this.name)) return;

						//get value
						var val = model.get(this.name);

						switch (format) {
								case 'raw':
										val = collection.raw(model.id, this.name);
										break;
								case 'text':
										val = parseFloat(val);
										if (!_.isNumber(val) || _.isNaN(val)) val = parseFloat(this.defaults);
										val = val + '%';
										break;
								case 'value':
								default:
										val = parseFloat(val);
										if (!_.isNumber(val) || _.isNaN(val)) val = parseFloat(this.defaults);
										break;
						}

						return val;
				},

				set: function set(value, model, collection, important) {

						//cannot set in non defined values
						if (!this.isDefined(model, collection)) return;

						//set is only accepted on non computed values or using important
						if (this.isComputed(model, collection) && !important) return;

						//numeric value is required
						if (!_.isNumber(parseInt(value))) return;

						//normailze recived value
						var val = parseInt(value);
						val = val > 100 ? val = 100 : val < 0 ? 0 : val;

						//apply value silently
						model.set({ 'progress': val }, { 'silent': true });

						/*
      //ATTRIBUTE PROPAGATION
      		//propagate -> @status
      //@progress directly modifies @status
      		//every @status change will become STATUS.INCOMPLETE as min
      //so use STATUS.INCOMPLETE as default resultant value
      var resultant_status = STATUS.INCOMPLETE;
      		//@progress >= 100 -> "complete" track
      if(val >= 100) resultant_status = STATUS.COMPLETED;
      		//set resultant @status silently
      model.set({'status':resultant_status},{'silent':true});
      */

						//realease changes trigger 'change' event
						model.trigger('change', model);

						//return resulting value
						return;
				},

				'update': function update(model, collection) {

						//update only computed values
						if (!this.isComputed(model, collection)) return;

						//get raw value
						var raw = collection.raw(model.id, this.name);

						//get current value
						var value = collection.get(model.id, this.name);

						var result;

						//it's computed value...
						//so raw value must match any of following
						switch (raw) {
								case 'sum':
								case 'avg':
								case 'auto':

										//get node for given model
										var node = collection.document.getNodeById(model.id);

										//get node children
										var childs = node.children;

										//has childs?
										if (_.isEmpty(childs)) {
												//if no childs 100 will be filled
												result = 100;
										} else {

												var count = 0,
												    sum = 0,
												    _name = this.name;

												//local reference for nested closures
												var _this = this;

												_.each(childs, function (item, index, list) {

														if (collection.has(item.id, _name)) {

																//get child model
																var child_model = collection.collection.get(item.id);

																if (child_model && _this.isDefined(child_model, collection)) {

																		/*
                  if (_this.isComputed(child_model, collection))
                  	_this.update(child_model, collection);
                  */
																		var val = collection.get(child_model.id, _name);

																		sum += val;

																		count++;
																}
														} else {}
												});

												if (count > 0) result = sum / count;
												//if no progress computable childs 100 will be filled
												else result = 100;
										}

										break;
								default:
										break;
						}

						if (value !== result && (result || result == 0)) this.set(result, model, collection, true);

						return;
				},

				propagate: function propagate(model, collection, recursive) {

						//update parent track in collection using document tree hierarchy

						//get ref node in collection document
						var node = collection.document.getNodeById(model.id);

						//if ref node has no parent exit silently
						if (!node.parent) return;

						//get ref node parent
						var parent = node.parent;

						//call collection.update for this attribute on parent model
						collection.update(parent.id, this.name);

						//recursive propagation
						if (recursive) collection.propagate(parent.id, this.name);

						return;
				},

				isDefined: function isDefined(model, collection) {

						var raw = collection.raw(model.id, this.name);

						return _.isEmpty(raw) && raw !== 0 || raw === 'none' ? false : true;
				},

				isComputed: function isComputed(model, collection) {

						//not defined values are also not computables
						if (!this.isDefined(model, collection)) return false;

						//get raw value
						var raw = collection.raw(model.id, this.name);

						if (raw === 'auto') return true;

						var value = parseInt(raw);

						var is_auto = true;

						if (_.isNumber(value) && value !== NaN) is_auto = false;

						return is_auto;
				},

				//exports current valuein base 100 and convert it to base 1

				exports: function exports(model, collection) {

						//model has attribute?
						if (!model.has(this.name)) return;

						//get value
						var val = model.get(this.name);

						val = parseFloat(val);
						if (!_.isNumber(val) || _.isNaN(val)) val = parseFloat(this.defaults);

						if (val > 0) val = val / 100;

						return val;
				},

				//imports value from base 1 and convert it to base 100

				imports: function imports(value, model, collection, important) {

						//cannot set in non defined values
						if (!this.isDefined(model, collection)) return;

						//set is only accepted on non computed values or using important
						if (this.isComputed(model, collection) && !important) return;

						var val = parseFloat(value);

						//numeric value is required
						if (!_.isNumber(val)) return;

						val = val * 100;

						//normailze recived value
						val = val > 100 ? val = 100 : val < 0 ? 0 : val;

						//apply value silently
						model.set({ 'progress': val }, { 'silent': true });

						//realease changes trigger 'change' event
						model.trigger('change', model);

						//return resulting value
						return;
				}

		};

		//expose
		smx.tracking.attributes.progress = ProgressAttributeController;
})(window.smx);
//# sourceMappingURL=progress.js.map
;'use strict';

////////////////////////////////
// SCORE
////////////////////////////////

(function (smx) {

		var SCORE = function SCORE(str) {

				//invalid input return null
				if (!_.isString(str)) return;

				//auto return an empty object
				if (str === 'auto' || str === 'none') return str;

				//split input by '/'
				var parts = str.split('/');

				//convert parts into floats
				for (var i = 0; i < parts.length; i++) {
						parts[i] = parseFloat(parts[i]);
				}var score = {
						'value': parts[0] || 0,
						'min': parts[1] || 0,
						'max': parts[2] || -1,
						'factor': parts[3] || 1
				};

				return score;
		};

		var ScoreAttributeController = {

				name: 'score',

				get: function get(model, collection, format) {

						//model has attribute?
						if (!model.has(this.name)) return;

						//get value
						var val = model.get(this.name);

						//get decomposed value
						var score = SCORE(val + '');

						if (!score) return;else if (score === 'none') return;else {

								switch (format) {

										case 'value':
										default:
												return score.value;
												break;

										case 'min':
												return score.min;
												break;

										case 'max':
												return score.max;
												break;

										case 'factor':
												return score.factor;
												break;

										case 'object':
												return score;
												break;

										case 'text':
										case 'string':
												return val;
												break;

								}
						}

						//never should reach this line
						return;
				},

				set: function set(value, model, collection, important) {

						//cannot set in non defined values
						if (!this.isDefined(model, collection)) return;

						//set is only accepted on non computed values or using important
						if (this.isComputed(model, collection) && !important) return;

						//ok its manual value..
						var score = SCORE(model.get(this.name) + '');

						var is_sum = false;

						if (_.isString(value)) {
								if (value.indexOf('+') === 0) {
										is_sum = true;
								} else if (value.indexOf('-') === 0) {
										is_sum = true;
								}
						}

						value = parseFloat(value);

						if (!_.isNumber(value)) return;

						var cval = score.value;

						var result = value;
						if (is_sum) result = cval + value;

						var is_change = result != cval ? true : false;

						if (is_change) {

								//apply changes silentlly
								var score_string = result + '/' + score.min + '/' + score.max + '/' + score.factor;
								model.set({ 'score': score_string }, { 'silent': true });
						}

						/*
      //ATTRIBUTE PROPAGATION
      		//propagate -> @status
      //@progress directly modifies @status
      		//every @status change will become STATUS.INCOMPLETE as min
      //so use STATUS.INCOMPLETE as default resultant value
      var resultant_status = STATUS.INCOMPLETE;
      		//@progress >= 100 -> "complete" track
      if(val >= 100) resultant_status = STATUS.COMPLETED;
      		//set resultant @status silently
      model.set({'status':resultant_status},{'silent':true});
      */

						//realease changes trigger 'change' event
						model.trigger('change', model);

						//return resulting value
						return;
				},

				'update': function update(model, collection) {

						//update only defined computed values
						if (!this.isComputed(model, collection)) return;

						//get raw value
						var raw = collection.raw(model.id, this.name);

						//get current value
						var value = collection.get(model.id, this.name);

						var result,
						    r_min = 0,
						    r_max = 0;

						var f = collection.get(model.id, this.name, 'factor');

						//it's computed value...
						//so raw value may match any of below
						switch (raw) {
								case 'sum':
								case 'auto':
								default:

										//get node for given model
										var node = collection.document.getNodeById(model.id);

										//get node children
										var childs = node.children;

										//has childs?
										if (_.isEmpty(childs)) {
												result = 0;
										} else {

												var sum = 0,
												    _name = this.name;

												//local reference for nested closures
												var _this = this;

												_.each(childs, function (item, index, list) {

														if (collection.has(item.id, _name)) {

																//get child model
																var child_model = collection.collection.get(item.id);

																if (child_model && _this.isPropagable(child_model, collection)) {

																		var val = collection.get(child_model.id, _name);
																		var min = collection.get(child_model.id, _name, 'min');
																		var max = collection.get(child_model.id, _name, 'max');
																		var factor = collection.get(child_model.id, _name, 'factor');

																		if (_.isUndefined(factor) || factor > 0) {

																				sum += val;

																				r_min += min;
																				if (max != -1) r_max += max;
																		}
																}
														} else {}
												});

												result = sum || 0;
										}

										break;
						}

						var score_string = result + '/' + r_min + '/' + r_max + '/' + f;

						model.set(this.name, score_string);

						return;
				},

				propagate: function propagate(model, collection, recursive) {

						//update parent track in collection using document tree hierarchy

						//get ref node in collection document
						var node = collection.document.getNodeById(model.id);

						//if ref node has no parent exit silently
						if (!node.parent) return;

						//get ref node parent
						var parent = node.parent;

						//call collection.update for this attribute on parent model
						collection.update(parent.id, this.name);

						//recursive propagation
						if (recursive) collection.propagate(parent.id, this.name);

						return;
				},

				isDefined: function isDefined(model, collection) {

						var raw = collection.raw(model.id, this.name);

						return _.isEmpty(raw) && raw !== 'none' ? false : true;
				},

				isComputed: function isComputed(model, collection) {

						//not defined values are also non computed
						if (!this.isDefined(model, collection)) return false;

						//get raw value
						var raw = collection.raw(model.id, this.name);

						if (raw === 'auto' || raw === 'sum') return true;else return false;
				},

				isPropagable: function isPropagable(model, collection) {

						//not defined values are also non propagables
						if (!this.isDefined(model, collection)) return false;

						var factor = this.get(model, collection, 'factor');

						return factor == -1 ? false : true;
				},

				exports: function exports(model, collection) {

						return;
				},

				imports: function imports(value, model, collection, important) {

						return;
				}

		};

		//expose
		smx.tracking.attributes.score = ScoreAttributeController;
})(window.smx);
//# sourceMappingURL=score.js.map
;'use strict';

////////////////////////////////
// STATUS
////////////////////////////////

(function (smx) {

		var STATUS = {};
		STATUS.NOTATTEMPTED = 0;
		STATUS.INCOMPLETE = 1; // views>0
		STATUS.COMPLETED = 2; // played & completed
		STATUS.FAILED = 3; // completed & score<minScore
		STATUS.PASSED = 4; // completed & score>minScore
		STATUS.BONUS = 5; // completed & score==maxScore -> perfect
		STATUS.EXTRA = 6; // bonus :D


		var StatusAttributeController = {

				name: 'status',

				defaults: STATUS.NOTATTEMPTED,

				get: function get(model, collection, format) {

						//cant get in non defined values
						if (!this.isDefined(model, collection)) return;

						//get current value
						var value = model.get(this.name);

						//which format?
						switch (format) {
								case 'text':

										var keys = _.keys(STATUS);
										var values = _.values(STATUS);

										if (keys[value]) value = keys[value].toLowerCase();

										break;
								case 'code':

										var keys = _.keys(STATUS);
										var values = _.values(STATUS);

										var index = values.indexOf(value);
										if (keys[index]) value = keys[index].toUpperCase()[0];

										break;
								case 'value':
								default:
										break;
						}

						//return resultant value
						return value;
				},

				set: function set(value, model, collection, important) {

						//cant set in non defined values
						if (!this.isDefined(model, collection)) return;

						//set is only accepted on non computed values or using important
						if (this.isComputed(model, collection) && !important) return;

						//filter input value
						//various input value formats are accepted

						//numeric value?
						if (_.isNumber(parseInt(value)) && !_.isNaN(parseInt(value))) {

								//ensure is integer
								value = parseInt(value);

								//ensure val is between valid range
								value = Math.max(value, 0);
								value = Math.min(value, _.size(STATUS) - 1);
						} else if (_.isString(value) && value != '') {

								//set input to uppercase
								value = value.toUpperCase();

								//check if val exists as charcode
								var codes = _.keys(STATUS);
								for (var i = 0; i < codes.length; i++) {
										if (codes[i].indexOf(value) == 0) {
												value = STATUS[codes[i]];
												break;
										}
								}

								//if was found val should be a number
								//else exit due to invalid input
								if (!_.isNumber(value)) return;
						} else {

								//invalid input
								//not number neither string
								return;
						}

						//apply value silently
						model.set({ 'status': value }, { 'silent': true });

						//realease changes trigger 'change' event
						model.trigger('change', model);

						//return resulting value
						return value;
				},

				'update': function update(model, collection) {
						return;
				},

				propagate: function propagate(model, collection) {
						return;
				},

				isDefined: function isDefined(model, collection) {

						var raw = collection.raw(model.id, this.name);

						return _.isEmpty(raw) && raw !== 0 || raw === 'none' ? false : true;
				},

				isComputed: function isComputed(model, collection) {

						return false;
				}

		};

		//expose
		smx.tracking.attributes.status = StatusAttributeController;
})(window.smx);
//# sourceMappingURL=status.js.map
;'use strict';

////////////////////////////////
// ACCESS
////////////////////////////////

(function (smx) {

		var ACCESS = {};
		ACCESS.ENABLED = 0; // its allow to enter
		ACCESS.DISABLED = 1; // enter is disabled
		ACCESS.HIDDEN = 2; // enter is not allowed


		var AccessAttributeController = {

				name: 'access',

				defaults: ACCESS.ENABLED,

				get: function get(model, collection, format) {

						//cant get in non defined values
						if (!this.isDefined(model, collection)) return;

						//get current value
						var value = parseInt(model.get(this.name));

						//which format?
						switch (format) {
								case 'text':

										var keys = _.keys(ACCESS);
										var values = _.values(ACCESS);

										if (keys[value]) value = keys[value].toLowerCase();

										break;
								case 'code':

										var keys = _.keys(ACCESS);
										var values = _.values(ACCESS);

										var index = values.indexOf(value);
										if (keys[index]) value = keys[index].toUpperCase()[0];

										break;
								case 'value':
								default:
										break;
						}

						//return resultant value
						return value;
				},

				set: function set(value, model, collection, important) {

						//cant set in non defined values
						if (!this.isDefined(model, collection)) return;

						//set is only accepted on non computed values or using important
						if (this.isComputed(model, collection) && !important) return;

						//filter input value
						//various input value formats are accepted

						//numeric value?
						if (_.isNumber(parseInt(value)) && !_.isNaN(parseInt(value))) {

								//ensure is integer
								value = parseInt(value);

								//ensure val is between valid range
								value = Math.max(value, 0);
								value = Math.min(value, _.size(ACCESS) - 1);
						} else if (_.isString(value) && value != '') {

								//set input to uppercase
								value = value.toUpperCase();

								//check if val exists as charcode
								var codes = _.keys(ACCESS);
								for (var i = 0; i < codes.length; i++) {
										if (codes[i].indexOf(value) == 0) {
												value = ACCESS[codes[i]];
												break;
										}
								}

								//if was found val should be a number
								//else exit due to invalid input
								if (!_.isNumber(value)) return;
						} else {

								//invalid input
								//not number neither string
								return;
						}

						//apply value silently
						model.set({ 'access': value }, { 'silent': true });

						//realease changes trigger 'change' event
						model.trigger('change', model);

						//return resulting value
						return value;
				},

				'update': function update(model, collection) {

						return;
				},

				propagate: function propagate(model, collection) {

						return;
				},

				isDefined: function isDefined(model, collection) {

						var raw = collection.raw(model.id, this.name);

						return _.isEmpty(raw) && raw !== 0 || raw === 'none' ? false : true;
				},

				isComputed: function isComputed(model, collection) {

						return false;
				}

		};

		//expose
		smx.tracking.attributes.access = AccessAttributeController;
})(window.smx);
//# sourceMappingURL=access.js.map
;'use strict';

////////////////////////////////
// SCORE
////////////////////////////////

(function (smx) {

		var PointsAttributeController = {

				name: 'points',

				get: function get(model, collection, format) {

						//model has attribute?
						if (!model.has(this.name)) return;

						//get value
						var val = model.get(this.name);

						//get decomposed value
						var points = parseInt(val) || 0;

						if (points === 'none') return;else {

								switch (format) {

										case 'text':
										case 'string':
												return points + '';
												break;

										case 'value':
										default:
												return points;
												break;

								}
						}

						//never should reach this line
						return;
				},

				set: function set(value, model, collection, important) {

						//cannot set in non defined values
						if (!this.isDefined(model, collection)) return;

						//set is only accepted on non computed values or using important
						if (this.isComputed(model, collection) && !important) return;

						//ok its manual value..
						var points = model.get(this.name);

						var is_sum = false;

						if (_.isString(value)) {
								if (value.indexOf('+') === 0) {
										is_sum = true;
								} else if (value.indexOf('-') === 0) {
										is_sum = true;
								}
						}

						value = parseFloat(value);

						if (!_.isNumber(value)) return;

						var cval = parseInt(points);

						var result = value;
						if (is_sum) result = cval + value;

						var is_change = result != cval ? true : false;

						if (is_change) {

								//apply changes silentlly
								model.set({ 'points': result }, { 'silent': true });
						}

						//realease changes trigger 'change' event
						model.trigger('change', model);

						//return resulting value
						return;
				},

				'update': function update(model, collection) {

						//update only defined computed values
						if (!this.isComputed(model, collection)) return;

						//get raw value
						var raw = collection.raw(model.id, this.name);

						//get current value
						var value = collection.get(model.id, this.name);

						var result;

						//it's computed value...
						//so raw value may match any of below
						switch (raw) {
								case 'sum':
								case 'auto':
								default:

										//get node for given model
										var node = collection.document.getNodeById(model.id);

										//get node children
										var childs = node.children;

										//has childs?
										if (_.isEmpty(childs)) {
												result = 0;
										} else {

												var sum = 0,
												    _name = this.name;

												//local reference for nested closures
												var _this = this;

												_.each(childs, function (item, index, list) {

														if (collection.has(item.id, _name)) {

																//get child model
																var child_model = collection.collection.get(item.id);

																if (child_model && _this.isPropagable(child_model, collection)) {

																		var val = collection.get(child_model.id, _name);

																		sum += val;
																}
														} else {}
												});

												result = sum || 0;
										}

										break;
						}

						model.set(this.name, result);

						return;
				},

				propagate: function propagate(model, collection, recursive) {

						//update parent track in collection using document tree hierarchy

						//get ref node in collection document
						var node = collection.document.getNodeById(model.id);

						//if ref node has no parent exit silently
						if (!node.parent) return;

						//get ref node parent
						var parent = node.parent;

						//call collection.update for this attribute on parent model
						collection.update(parent.id, this.name);

						//recursive propagation
						if (recursive) collection.propagate(parent.id, this.name);

						return;
				},

				isDefined: function isDefined(model, collection) {

						var raw = collection.raw(model.id, this.name);

						return _.isEmpty(raw) && raw !== 'none' ? false : true;
				},

				isComputed: function isComputed(model, collection) {

						//not defined values are also non computed
						if (!this.isDefined(model, collection)) return false;

						//get raw value
						var raw = collection.raw(model.id, this.name);

						if (raw === 'auto' || raw === 'sum') return true;else return false;
				},

				isPropagable: function isPropagable(model, collection) {

						//not defined values are also non propagables
						if (!this.isDefined(model, collection)) return false;

						var factor = this.get(model, collection, 'factor');

						return factor == -1 ? false : true;
				}

		};

		//expose
		smx.tracking.attributes.points = PointsAttributeController;
})(window.smx);
//# sourceMappingURL=points.js.map
;'use strict';

/**
 * Extends SMXNode with utility attribute getters
 * @module Node/Tracking
 */

(function (global, _, smx) {

      var methods = {

            /**
             * Checks if the node can be accessed
             * @method isAccesible
             * @return {Boolean}
             */
            isAccesible: function isAccesible() {

                  if (global.app.config.FREE_ACCESS) return true;

                  var is_accesible = true;
                  var value = this.track('access', 'raw');

                  //check node
                  if (_.isUndefined(value) || value == 'none') {} else {
                        value = parseInt(value);
                        if (_.isNumber(value) && value != 0) is_accesible = false;
                  }

                  //still accesible... check ancestors!
                  if (is_accesible) {
                        var parent = this.parent;
                        if (parent) is_accesible = parent.isAccesible();
                  }

                  return is_accesible;
            },

            /**
             * Gets tracking data for the given key name associated to the node
             * @method track
             * @param {String} key - tracking field key name
             * @param {String=} format - desired format data
             * @return {String|Number}
             */
            track: function track(key, format) {

                  //if exists ($tracking) TrackManager use it
                  if ($tracking) return $tracking.get(this.id, key, format);

                  //else look for key in attributes
                  var attrs = this[0].attributes;
                  var value = null;
                  for (var i = 0; i < attrs.length; i++) {
                        var attr_name = attrs[i].name + '';
                        var attr_value = attrs[i].name + '';
                        if (attr_name.indexOf("track-") == 0) {
                              attr_name = attr_name.substr(6);
                              if (attr_name == key) value = attrs[i].value;
                        }
                        if (value) i = attrs.length;
                  }

                  return value;
            },

            /**
            *   Checks if the node has associated tracking data, can check for any tracking data or specific field
            *   @method isTracking
            *   @param {String=} key - tracking field key name
            *   @return {Boolean}
            */
            isTracking: function isTracking(key) {

                  if (!key) {

                        //check for root track attr
                        var value = this[0].getAttribute('track');

                        if (value == 'none') return false;

                        return true;
                  } else {
                        //check for given key track attr

                        //get track-key attr value from xml source node
                        var value = this.attr('track-' + key);

                        if (_.isUndefined(value) || _.isNull(value) || value == 'none') return false;

                        return true;
                  }

                  return;
            },

            /**
            * Performs a Tracking.update for this node
            * @method update
            * @param {String=} key - tracking field key name
            */
            update: function update(key) {

                  //this method requires TrackManager
                  if (!$tracking) return;

                  $tracking.update(this.id, key);

                  return;
            },

            /**
            * Performs a Tracking.propagate for this node
            * @method propagate
            * @param {String=} key - tracking field key name
            * @param {String=} [recursive=false]
            */
            propagate: function propagate(key, recursive) {

                  //this method requires TrackManager
                  if (!$tracking) return;

                  $tracking.propagate(this.id, key, recursive);

                  return;
            }

      };

      //expose to global
      smx.fn = _.extend(smx.fn, { TrackingInterface: methods });
})(window, window._, window.smx);
//# sourceMappingURL=TrackInterface.js.map
;'use strict';

Sizzle.selectors.filters.track = function (elem, i, match) {
    var preffix = 'track-';
    var regex = new RegExp('\\s*' + preffix + '\\w*="', 'ig');
    var attrs = elem.attributes;
    var str = [];
    str.push('<' + elem.nodeName);
    for (var i = 0; i < attrs.length; i++) {
        str.push(attrs[i].nodeName + '="' + attrs[i].nodeValue + '"');
    }
    str.push('>');
    str = str.join(' ');

    return regex.test(str);
};
//# sourceMappingURL=Sizzle.selectors.filters.track.js.map
;"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

(function (global) {
	var _kCOLOR_NAMES, _jscsspToken$prototyp;

	/*
 
 JSCSSP a CSS parser
 http://www.glazman.org/JSCSSP/
 
 Useful because we want to use non CSS definitions
 It parses even invalid CSS rules
 We can keep accesing parsed data models
 
 @clopez: modified version 20130612
 
 Original version uses javascript keyword "const" which is not valid ECMA5
 Here we replace "const" with "var"
 Minified version also required adding some semicolons :D
 
 */

	var kCHARSET_RULE_MISSING_SEMICOLON = "Missing semicolon at the end of @charset rule";var kCHARSET_RULE_CHARSET_IS_STRING = "The charset in the @charset rule should be a string";var kCHARSET_RULE_MISSING_WS = "Missing mandatory whitespace after @charset";var kIMPORT_RULE_MISSING_URL = "Missing URL in @import rule";var kURL_EOF = "Unexpected end of stylesheet";var kURL_WS_INSIDE = "Multiple tokens inside a url() notation";var kVARIABLES_RULE_POSITION = "@variables rule invalid at this position in the stylesheet";var kIMPORT_RULE_POSITION = "@import rule invalid at this position in the stylesheet";var kNAMESPACE_RULE_POSITION = "@namespace rule invalid at this position in the stylesheet";var kCHARSET_RULE_CHARSET_SOF = "@charset rule invalid at this position in the stylesheet";var kUNKNOWN_AT_RULE = "Unknow @-rule";var kENGINES = ["webkit", "presto", "trident", "generic"];var kCSS_VENDOR_VALUES = { "-moz-box": { "webkit": "-webkit-box", "presto": "", "trident": "", "generic": "box" }, "-moz-inline-box": { "webkit": "-webkit-inline-box", "presto": "", "trident": "", "generic": "inline-box" }, "-moz-initial": { "webkit": "", "presto": "", "trident": "", "generic": "initial" }, "-moz-linear-gradient": { "webkit20110101": FilterLinearGradientForOutput, "webkit": FilterLinearGradientForOutput, "presto": "", "trident": "", "generic": FilterLinearGradientForOutput }, "-moz-radial-gradient": { "webkit20110101": FilterRadialGradientForOutput, "webkit": FilterRadialGradientForOutput, "presto": "", "trident": "", "generic": FilterRadialGradientForOutput }, "-moz-repeating-linear-gradient": { "webkit20110101": "", "webkit": FilterRepeatingGradientForOutput, "presto": "", "trident": "", "generic": FilterRepeatingGradientForOutput }, "-moz-repeating-radial-gradient": { "webkit20110101": "", "webkit": FilterRepeatingGradientForOutput, "presto": "", "trident": "", "generic": FilterRepeatingGradientForOutput } };var kCSS_VENDOR_PREFIXES = { "lastUpdate": 1304175007, "properties": [{ "gecko": "", "webkit": "", "presto": "", "trident": "-ms-accelerator", "status": "P" }, { "gecko": "", "webkit": "", "presto": "-wap-accesskey", "trident": "", "status": "" }, { "gecko": "-moz-animation", "webkit": "-webkit-animation", "presto": "", "trident": "", "status": "WD" }, { "gecko": "-moz-animation-delay", "webkit": "-webkit-animation-delay", "presto": "", "trident": "", "status": "WD" }, { "gecko": "-moz-animation-direction", "webkit": "-webkit-animation-direction", "presto": "", "trident": "", "status": "WD" }, { "gecko": "-moz-animation-duration", "webkit": "-webkit-animation-duration", "presto": "", "trident": "", "status": "WD" }, { "gecko": "-moz-animation-fill-mode", "webkit": "-webkit-animation-fill-mode", "presto": "", "trident": "", "status": "ED" }, { "gecko": "-moz-animation-iteration-count", "webkit": "-webkit-animation-iteration-count", "presto": "", "trident": "", "status": "WD" }, { "gecko": "-moz-animation-name", "webkit": "-webkit-animation-name", "presto": "", "trident": "", "status": "WD" }, { "gecko": "-moz-animation-play-state", "webkit": "-webkit-animation-play-state", "presto": "", "trident": "", "status": "WD" }, { "gecko": "-moz-animation-timing-function", "webkit": "-webkit-animation-timing-function", "presto": "", "trident": "", "status": "WD" }, { "gecko": "-moz-appearance", "webkit": "-webkit-appearance", "presto": "", "trident": "", "status": "CR" }, { "gecko": "", "webkit": "-webkit-backface-visibility", "presto": "", "trident": "", "status": "WD" }, { "gecko": "background-clip", "webkit": "-webkit-background-clip", "presto": "background-clip", "trident": "background-clip", "status": "WD" }, { "gecko": "", "webkit": "-webkit-background-composite", "presto": "", "trident": "", "status": "" }, { "gecko": "-moz-background-inline-policy", "webkit": "", "presto": "", "trident": "", "status": "P" }, { "gecko": "background-origin", "webkit": "-webkit-background-origin", "presto": "background-origin", "trident": "background-origin", "status": "WD" }, { "gecko": "", "webkit": "background-position-x", "presto": "", "trident": "-ms-background-position-x", "status": "" }, { "gecko": "", "webkit": "background-position-y", "presto": "", "trident": "-ms-background-position-y", "status": "" }, { "gecko": "background-size", "webkit": "-webkit-background-size", "presto": "background-size", "trident": "background-size", "status": "WD" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-behavior", "status": "" }, { "gecko": "-moz-binding", "webkit": "", "presto": "", "trident": "", "status": "P" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-block-progression", "status": "" }, { "gecko": "", "webkit": "-webkit-border-after", "presto": "", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "-webkit-border-after-color", "presto": "", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "-webkit-border-after-style", "presto": "", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "-webkit-border-after-width", "presto": "", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "-webkit-border-before", "presto": "", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "-webkit-border-before-color", "presto": "", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "-webkit-border-before-style", "presto": "", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "-webkit-border-before-width", "presto": "", "trident": "", "status": "ED" }, { "gecko": "-moz-border-bottom-colors", "webkit": "", "presto": "", "trident": "", "status": "P" }, { "gecko": "border-bottom-left-radius", "webkit": "-webkit-border-bottom-left-radius", "presto": "border-bottom-left-radius", "trident": "border-bottom-left-radius", "status": "WD" }, { "gecko": "", "webkit": "-webkit-border-bottom-left-radius = border-bottom-left-radius", "presto": "", "trident": "", "status": "" }, { "gecko": "border-bottom-right-radius", "webkit": "-webkit-border-bottom-right-radius", "presto": "border-bottom-right-radius", "trident": "border-bottom-right-radius", "status": "WD" }, { "gecko": "", "webkit": "-webkit-border-bottom-right-radius = border-bottom-right-radius", "presto": "", "trident": "", "status": "" }, { "gecko": "-moz-border-end", "webkit": "-webkit-border-end", "presto": "", "trident": "", "status": "ED" }, { "gecko": "-moz-border-end-color", "webkit": "-webkit-border-end-color", "presto": "", "trident": "", "status": "ED" }, { "gecko": "-moz-border-end-style", "webkit": "-webkit-border-end-style", "presto": "", "trident": "", "status": "ED" }, { "gecko": "-moz-border-end-width", "webkit": "-webkit-border-end-width", "presto": "", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "-webkit-border-fit", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-border-horizontal-spacing", "presto": "", "trident": "", "status": "" }, { "gecko": "-moz-border-image", "webkit": "-webkit-border-image", "presto": "-o-border-image", "trident": "", "status": "WD" }, { "gecko": "-moz-border-left-colors", "webkit": "", "presto": "", "trident": "", "status": "P" }, { "gecko": "border-radius", "webkit": "-webkit-border-radius", "presto": "border-radius", "trident": "border-radius", "status": "WD" }, { "gecko": "-moz-border-right-colors", "webkit": "", "presto": "", "trident": "", "status": "P" }, { "gecko": "-moz-border-start", "webkit": "-webkit-border-start", "presto": "", "trident": "", "status": "ED" }, { "gecko": "-moz-border-start-color", "webkit": "-webkit-border-start-color", "presto": "", "trident": "", "status": "ED" }, { "gecko": "-moz-border-start-style", "webkit": "-webkit-border-start-style", "presto": "", "trident": "", "status": "ED" }, { "gecko": "-moz-border-start-width", "webkit": "-webkit-border-start-width", "presto": "", "trident": "", "status": "ED" }, { "gecko": "-moz-border-top-colors", "webkit": "", "presto": "", "trident": "", "status": "P" }, { "gecko": "border-top-left-radius", "webkit": "-webkit-border-top-left-radius", "presto": "border-top-left-radius", "trident": "border-top-left-radius", "status": "WD" }, { "gecko": "", "webkit": "-webkit-border-top-left-radius = border-top-left-radius", "presto": "", "trident": "", "status": "" }, { "gecko": "border-top-right-radius", "webkit": "-webkit-border-top-right-radius", "presto": "border-top-right-radius", "trident": "border-top-right-radius", "status": "WD" }, { "gecko": "", "webkit": "-webkit-border-top-right-radius = border-top-right-radius", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-border-vertical-spacing", "presto": "", "trident": "", "status": "" }, { "gecko": "-moz-box-align", "webkit": "-webkit-box-align", "presto": "", "trident": "-ms-box-align", "status": "WD" }, { "gecko": "-moz-box-direction", "webkit": "-webkit-box-direction", "presto": "", "trident": "-ms-box-direction", "status": "WD" }, { "gecko": "-moz-box-flex", "webkit": "-webkit-box-flex", "presto": "", "trident": "-ms-box-flex", "status": "WD" }, { "gecko": "", "webkit": "-webkit-box-flex-group", "presto": "", "trident": "", "status": "WD" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-box-line-progression", "status": "" }, { "gecko": "", "webkit": "-webkit-box-lines", "presto": "", "trident": "-ms-box-lines", "status": "WD" }, { "gecko": "-moz-box-ordinal-group", "webkit": "-webkit-box-ordinal-group", "presto": "", "trident": "-ms-box-ordinal-group", "status": "WD" }, { "gecko": "-moz-box-orient", "webkit": "-webkit-box-orient", "presto": "", "trident": "-ms-box-orient", "status": "WD" }, { "gecko": "-moz-box-pack", "webkit": "-webkit-box-pack", "presto": "", "trident": "-ms-box-pack", "status": "WD" }, { "gecko": "", "webkit": "-webkit-box-reflect", "presto": "", "trident": "", "status": "" }, { "gecko": "box-shadow", "webkit": "-webkit-box-shadow", "presto": "box-shadow", "trident": "box-shadow", "status": "WD" }, { "gecko": "-moz-box-sizing", "webkit": "box-sizing", "presto": "box-sizing", "trident": "", "status": "CR" }, { "gecko": "", "webkit": "-webkit-box-sizing = box-sizing", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-epub-caption-side = caption-side", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-color-correction", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-column-break-after", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-column-break-before", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-column-break-inside", "presto": "", "trident": "", "status": "" }, { "gecko": "-moz-column-count", "webkit": "-webkit-column-count", "presto": "column-count", "trident": "column-count", "status": "CR" }, { "gecko": "-moz-column-gap", "webkit": "-webkit-column-gap", "presto": "column-gap", "trident": "column-gap", "status": "CR" }, { "gecko": "-moz-column-rule", "webkit": "-webkit-column-rule", "presto": "column-rule", "trident": "column-rule", "status": "CR" }, { "gecko": "-moz-column-rule-color", "webkit": "-webkit-column-rule-color", "presto": "column-rule-color", "trident": "column-rule-color", "status": "CR" }, { "gecko": "-moz-column-rule-style", "webkit": "-webkit-column-rule-style", "presto": "column-rule-style", "trident": "column-rule-style", "status": "CR" }, { "gecko": "-moz-column-rule-width", "webkit": "-webkit-column-rule-width", "presto": "column-rule-width", "trident": "column-rule-width", "status": "CR" }, { "gecko": "", "webkit": "-webkit-column-span", "presto": "column-span", "trident": "column-span", "status": "CR" }, { "gecko": "-moz-column-width", "webkit": "-webkit-column-width", "presto": "column-width", "trident": "column-width", "status": "CR" }, { "gecko": "", "webkit": "-webkit-columns", "presto": "columns", "trident": "columns", "status": "CR" }, { "gecko": "", "webkit": "-webkit-dashboard-region", "presto": "-apple-dashboard-region", "trident": "", "status": "" }, { "gecko": "filter", "webkit": "", "presto": "filter", "trident": "-ms-filter", "status": "" }, { "gecko": "-moz-float-edge", "webkit": "", "presto": "", "trident": "", "status": "P" }, { "gecko": "", "webkit": "", "presto": "-o-focus-opacity", "trident": "", "status": "" }, { "gecko": "-moz-font-feature-settings", "webkit": "", "presto": "", "trident": "", "status": "" }, { "gecko": "-moz-font-language-override", "webkit": "", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-font-size-delta", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-font-smoothing", "presto": "", "trident": "", "status": "" }, { "gecko": "-moz-force-broken-image-icon", "webkit": "", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-grid-column", "status": "WD" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-grid-column-align", "status": "WD" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-grid-column-span", "status": "WD" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-grid-columns", "status": "WD" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-grid-layer", "status": "WD" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-grid-row", "status": "WD" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-grid-row-align", "status": "WD" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-grid-row-span", "status": "WD" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-grid-rows", "status": "WD" }, { "gecko": "", "webkit": "-webkit-highlight", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-hyphenate-character", "presto": "", "trident": "", "status": "WD" }, { "gecko": "", "webkit": "-webkit-hyphenate-limit-after", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-hyphenate-limit-before", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-hyphens", "presto": "", "trident": "", "status": "WD" }, { "gecko": "", "webkit": "-epub-hyphens = -webkit-hyphens", "presto": "", "trident": "", "status": "" }, { "gecko": "-moz-image-region", "webkit": "", "presto": "", "trident": "", "status": "P" }, { "gecko": "ime-mode", "webkit": "", "presto": "", "trident": "-ms-ime-mode", "status": "" }, { "gecko": "", "webkit": "", "presto": "-wap-input-format", "trident": "", "status": "" }, { "gecko": "", "webkit": "", "presto": "-wap-input-required", "trident": "", "status": "" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-interpolation-mode", "status": "" }, { "gecko": "", "webkit": "", "presto": "-xv-interpret-as", "trident": "", "status": "" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-layout-flow", "status": "" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-layout-grid", "status": "" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-layout-grid-char", "status": "" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-layout-grid-line", "status": "" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-layout-grid-mode", "status": "" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-layout-grid-type", "status": "" }, { "gecko": "", "webkit": "-webkit-line-box-contain", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-line-break", "presto": "", "trident": "-ms-line-break", "status": "" }, { "gecko": "", "webkit": "-webkit-line-clamp", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-line-grid-mode", "status": "" }, { "gecko": "", "webkit": "", "presto": "-o-link", "trident": "", "status": "" }, { "gecko": "", "webkit": "", "presto": "-o-link-source", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-locale", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-logical-height", "presto": "", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "-webkit-logical-width", "presto": "", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "-webkit-margin-after", "presto": "", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "-webkit-margin-after-collapse", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-margin-before", "presto": "", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "-webkit-margin-before-collapse", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-margin-bottom-collapse", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-margin-collapse", "presto": "", "trident": "", "status": "" }, { "gecko": "-moz-margin-end", "webkit": "-webkit-margin-end", "presto": "", "trident": "", "status": "ED" }, { "gecko": "-moz-margin-start", "webkit": "-webkit-margin-start", "presto": "", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "-webkit-margin-top-collapse", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-marquee", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "", "presto": "-wap-marquee-dir", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-marquee-direction", "presto": "", "trident": "", "status": "WD" }, { "gecko": "", "webkit": "-webkit-marquee-increment", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "", "presto": "-wap-marquee-loop", "trident": "", "status": "WD" }, { "gecko": "", "webkit": "-webkit-marquee-repetition", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-marquee-speed", "presto": "-wap-marquee-speed", "trident": "", "status": "WD" }, { "gecko": "", "webkit": "-webkit-marquee-style", "presto": "-wap-marquee-style", "trident": "", "status": "WD" }, { "gecko": "mask", "webkit": "-webkit-mask", "presto": "mask", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-mask-attachment", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-mask-box-image", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-mask-clip", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-mask-composite", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-mask-image", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-mask-origin", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-mask-position", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-mask-position-x", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-mask-position-y", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-mask-repeat", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-mask-repeat-x", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-mask-repeat-y", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-mask-size", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-match-nearest-mail-blockquote-color", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-max-logical-height", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-max-logical-width", "presto": "", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "-webkit-min-logical-height", "presto": "", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "-webkit-min-logical-width", "presto": "", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "", "presto": "-o-mini-fold", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-nbsp-mode", "presto": "", "trident": "", "status": "P" }, { "gecko": "", "webkit": "", "presto": "-o-object-fit", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "", "presto": "-o-object-position", "trident": "", "status": "ED" }, { "gecko": "opacity", "webkit": "-webkit-opacity", "presto": "opacity", "trident": "opacity", "status": "WD" }, { "gecko": "", "webkit": "-webkit-opacity = opacity", "presto": "", "trident": "", "status": "" }, { "gecko": "-moz-outline-radius", "webkit": "", "presto": "", "trident": "", "status": "P" }, { "gecko": "-moz-outline-radius-bottomleft", "webkit": "", "presto": "", "trident": "", "status": "P" }, { "gecko": "-moz-outline-radius-bottomright", "webkit": "", "presto": "", "trident": "", "status": "P" }, { "gecko": "-moz-outline-radius-topleft", "webkit": "", "presto": "", "trident": "", "status": "P" }, { "gecko": "-moz-outline-radius-topright", "webkit": "", "presto": "", "trident": "", "status": "P" }, { "gecko": "overflow-x", "webkit": "overflow-x", "presto": "overflow-x", "trident": "-ms-overflow-x", "status": "WD" }, { "gecko": "overflow-y", "webkit": "overflow-y", "presto": "overflow-y", "trident": "-ms-overflow-y", "status": "WD" }, { "gecko": "", "webkit": "-webkit-padding-after", "presto": "", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "-webkit-padding-before", "presto": "", "trident": "", "status": "ED" }, { "gecko": "-moz-padding-end", "webkit": "-webkit-padding-end", "presto": "", "trident": "", "status": "ED" }, { "gecko": "-moz-padding-start", "webkit": "-webkit-padding-start", "presto": "", "trident": "", "status": "ED" }, { "gecko": "", "webkit": "-webkit-perspective", "presto": "", "trident": "", "status": "WD" }, { "gecko": "", "webkit": "-webkit-perspective-origin", "presto": "", "trident": "", "status": "WD" }, { "gecko": "", "webkit": "-webkit-perspective-origin-x", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-perspective-origin-y", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "", "presto": "-xv-phonemes", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-rtl-ordering", "presto": "", "trident": "", "status": "P" }, { "gecko": "-moz-script-level", "webkit": "", "presto": "", "trident": "", "status": "" }, { "gecko": "-moz-script-min-size", "webkit": "", "presto": "", "trident": "", "status": "" }, { "gecko": "-moz-script-size-multiplier", "webkit": "", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "", "presto": "scrollbar-3dlight-color", "trident": "-ms-scrollbar-3dlight-color", "status": "P" }, { "gecko": "", "webkit": "", "presto": "scrollbar-arrow-color", "trident": "-ms-scrollbar-arrow-color", "status": "P" }, { "gecko": "", "webkit": "", "presto": "scrollbar-base-color", "trident": "-ms-scrollbar-base-color", "status": "P" }, { "gecko": "", "webkit": "", "presto": "scrollbar-darkshadow-color", "trident": "-ms-scrollbar-darkshadow-color", "status": "P" }, { "gecko": "", "webkit": "", "presto": "scrollbar-face-color", "trident": "-ms-scrollbar-face-color", "status": "P" }, { "gecko": "", "webkit": "", "presto": "scrollbar-highlight-color", "trident": "-ms-scrollbar-highlight-color", "status": "P" }, { "gecko": "", "webkit": "", "presto": "scrollbar-shadow-color", "trident": "-ms-scrollbar-shadow-color", "status": "P" }, { "gecko": "", "webkit": "", "presto": "scrollbar-track-color", "trident": "-ms-scrollbar-track-color", "status": "P" }, { "gecko": "-moz-stack-sizing", "webkit": "", "presto": "", "trident": "", "status": "P" }, { "gecko": "", "webkit": "-webkit-svg-shadow", "presto": "", "trident": "", "status": "" }, { "gecko": "-moz-tab-size", "webkit": "", "presto": "-o-tab-size", "trident": "", "status": "" }, { "gecko": "", "webkit": "", "presto": "-o-table-baseline", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-tap-highlight-color", "presto": "", "trident": "", "status": "P" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-text-align-last", "status": "WD" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-text-autospace", "status": "WD" }, { "gecko": "-moz-text-blink", "webkit": "", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-text-combine", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-epub-text-combine = -webkit-text-combine", "presto": "", "trident": "", "status": "" }, { "gecko": "-moz-text-decoration-color", "webkit": "", "presto": "", "trident": "", "status": "" }, { "gecko": "-moz-text-decoration-line", "webkit": "", "presto": "", "trident": "", "status": "" }, { "gecko": "-moz-text-decoration-style", "webkit": "", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-text-decorations-in-effect", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-text-emphasis", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-epub-text-emphasis = -webkit-text-emphasis", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-text-emphasis-color", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-epub-text-emphasis-color = -webkit-text-emphasis-color", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-text-emphasis-position", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-text-emphasis-style", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-epub-text-emphasis-style = -webkit-text-emphasis-style", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-webkit-text-fill-color", "presto": "", "trident": "", "status": "P" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-text-justify", "status": "WD" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-text-kashida-space", "status": "P" }, { "gecko": "", "webkit": "-webkit-text-orientation", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "-epub-text-orientation = -webkit-text-orientation", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "text-overflow", "presto": "text-overflow", "trident": "-ms-text-overflow", "status": "WD" }, { "gecko": "", "webkit": "-webkit-text-security", "presto": "", "trident": "", "status": "P" }, { "gecko": "", "webkit": "-webkit-text-size-adjust", "presto": "", "trident": "-ms-text-size-adjust", "status": "" }, { "gecko": "", "webkit": "-webkit-text-stroke", "presto": "", "trident": "", "status": "P" }, { "gecko": "", "webkit": "-webkit-text-stroke-color", "presto": "", "trident": "", "status": "P" }, { "gecko": "", "webkit": "-webkit-text-stroke-width", "presto": "", "trident": "", "status": "P" }, { "gecko": "", "webkit": "-epub-text-transform = text-transform", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "", "presto": "", "trident": "-ms-text-underline-position", "status": "P" }, { "gecko": "", "webkit": "-webkit-touch-callout", "presto": "", "trident": "", "status": "P" }, { "gecko": "-moz-transform", "webkit": "-webkit-transform", "presto": "-o-transform", "trident": "-ms-transform", "status": "WD" }, { "gecko": "-moz-transform-origin", "webkit": "-webkit-transform-origin", "presto": "-o-transform-origin", "trident": "-ms-transform-origin", "status": "WD" }, { "gecko": "", "webkit": "-webkit-transform-origin-x", "presto": "", "trident": "", "status": "P" }, { "gecko": "", "webkit": "-webkit-transform-origin-y", "presto": "", "trident": "", "status": "P" }, { "gecko": "", "webkit": "-webkit-transform-origin-z", "presto": "", "trident": "", "status": "P" }, { "gecko": "", "webkit": "-webkit-transform-style", "presto": "", "trident": "", "status": "WD" }, { "gecko": "-moz-transition", "webkit": "-webkit-transition", "presto": "-o-transition", "trident": "", "status": "WD" }, { "gecko": "-moz-transition-delay", "webkit": "-webkit-transition-delay", "presto": "-o-transition-delay", "trident": "", "status": "WD" }, { "gecko": "-moz-transition-duration", "webkit": "-webkit-transition-duration", "presto": "-o-transition-duration", "trident": "", "status": "WD" }, { "gecko": "-moz-transition-property", "webkit": "-webkit-transition-property", "presto": "-o-transition-property", "trident": "", "status": "WD" }, { "gecko": "-moz-transition-timing-function", "webkit": "-webkit-transition-timing-function", "presto": "-o-transition-timing-function", "trident": "", "status": "WD" }, { "gecko": "", "webkit": "-webkit-user-drag", "presto": "", "trident": "", "status": "P" }, { "gecko": "-moz-user-focus", "webkit": "", "presto": "", "trident": "", "status": "P" }, { "gecko": "-moz-user-input", "webkit": "", "presto": "", "trident": "", "status": "P" }, { "gecko": "-moz-user-modify", "webkit": "-webkit-user-modify", "presto": "", "trident": "", "status": "P" }, { "gecko": "-moz-user-select", "webkit": "-webkit-user-select", "presto": "", "trident": "", "status": "P" }, { "gecko": "", "webkit": "", "presto": "-xv-voice-balance", "trident": "", "status": "" }, { "gecko": "", "webkit": "", "presto": "-xv-voice-duration", "trident": "", "status": "" }, { "gecko": "", "webkit": "", "presto": "-xv-voice-pitch", "trident": "", "status": "" }, { "gecko": "", "webkit": "", "presto": "-xv-voice-pitch-range", "trident": "", "status": "" }, { "gecko": "", "webkit": "", "presto": "-xv-voice-rate", "trident": "", "status": "" }, { "gecko": "", "webkit": "", "presto": "-xv-voice-stress", "trident": "", "status": "" }, { "gecko": "", "webkit": "", "presto": "-xv-voice-volume", "trident": "", "status": "" }, { "gecko": "-moz-window-shadow", "webkit": "", "presto": "", "trident": "", "status": "P" }, { "gecko": "", "webkit": "word-break", "presto": "", "trident": "-ms-word-break", "status": "WD" }, { "gecko": "", "webkit": "-epub-word-break = word-break", "presto": "", "trident": "", "status": "" }, { "gecko": "word-wrap", "webkit": "word-wrap", "presto": "word-wrap", "trident": "-ms-word-wrap", "status": "WD" }, { "gecko": "", "webkit": "-webkit-writing-mode", "presto": "writing-mode", "trident": "-ms-writing-mode", "status": "ED" }, { "gecko": "", "webkit": "-epub-writing-mode = -webkit-writing-mode", "presto": "", "trident": "", "status": "" }, { "gecko": "", "webkit": "zoom", "presto": "", "trident": "-ms-zoom", "status": "" }] };var kCSS_PREFIXED_VALUE = [{ "gecko": "-moz-box", "webkit": "-moz-box", "presto": "", "trident": "", "generic": "box" }];var CssInspector = { mVENDOR_PREFIXES: null, kEXPORTS_FOR_GECKO: true, kEXPORTS_FOR_WEBKIT: true, kEXPORTS_FOR_PRESTO: true, kEXPORTS_FOR_TRIDENT: true, cleanPrefixes: function cleanPrefixes() {
			this.mVENDOR_PREFIXES = null;
		}, prefixesForProperty: function prefixesForProperty(aProperty) {
			if (!this.mVENDOR_PREFIXES) {
				this.mVENDOR_PREFIXES = {};for (var i = 0; i < kCSS_VENDOR_PREFIXES.properties.length; i++) {
					var p = kCSS_VENDOR_PREFIXES.properties[i];if (p.gecko && (p.webkit || p.presto || p.trident)) {
						var o = {};if (this.kEXPORTS_FOR_GECKO) o[p.gecko] = true;if (this.kEXPORTS_FOR_WEBKIT && p.webkit) o[p.webkit] = true;if (this.kEXPORTS_FOR_PRESTO && p.presto) o[p.presto] = true;if (this.kEXPORTS_FOR_TRIDENT && p.trident) o[p.trident] = true;this.mVENDOR_PREFIXES[p.gecko] = [];for (var j in o) {
							this.mVENDOR_PREFIXES[p.gecko].push(j);
						}
					}
				}
			}if (aProperty in this.mVENDOR_PREFIXES) return this.mVENDOR_PREFIXES[aProperty].sort();return null;
		}, parseColorStop: function parseColorStop(parser, token) {
			var color = parser.parseColor(token);var position = "";if (!color) return null;token = parser.getToken(true, true);if (token.isPercentage() || token.isDimensionOfUnit("cm") || token.isDimensionOfUnit("mm") || token.isDimensionOfUnit("in") || token.isDimensionOfUnit("pc") || token.isDimensionOfUnit("px") || token.isDimensionOfUnit("em") || token.isDimensionOfUnit("ex") || token.isDimensionOfUnit("pt")) {
				position = token.value;token = parser.getToken(true, true);
			}return { color: color, position: position };
		}, parseGradient: function parseGradient(parser, token) {
			var isRadial = false;var gradient = { isRepeating: false };if (token.isNotNull()) {
				if (token.isFunction("-moz-linear-gradient(") || token.isFunction("-moz-radial-gradient(") || token.isFunction("-moz-repeating-linear-gradient(") || token.isFunction("-moz-repeating-radial-gradient(")) {
					if (token.isFunction("-moz-radial-gradient(") || token.isFunction("-moz-repeating-radial-gradient(")) {
						gradient.isRadial = true;
					}if (token.isFunction("-moz-repeating-linear-gradient(") || token.isFunction("-moz-repeating-radial-gradient(")) {
						gradient.isRepeating = true;
					}token = parser.getToken(true, true);var haveGradientLine = false;var foundHorizPosition = false;var haveAngle = false;if (token.isAngle()) {
						gradient.angle = token.value;haveGradientLine = true;haveAngle = true;token = parser.getToken(true, true);
					}if (token.isLength() || token.isIdent("top") || token.isIdent("center") || token.isIdent("bottom") || token.isIdent("left") || token.isIdent("right")) {
						haveGradientLine = true;if (token.isLength() || token.isIdent("left") || token.isIdent("right")) {
							foundHorizPosition = true;
						}gradient.position = token.value;token = parser.getToken(true, true);
					}if (haveGradientLine) {
						if (!haveAngle && token.isAngle()) {
							gradient.angle = token.value;haveAngle = true;token = parser.getToken(true, true);
						} else if (token.isLength() || foundHorizPosition && (token.isIdent("top") || token.isIdent("center") || token.isIdent("bottom")) || !foundHorizPosition && (token.isLength() || token.isIdent("top") || token.isIdent("center") || token.isIdent("bottom") || token.isIdent("left") || token.isIdent("right"))) {
							gradient.position = "position" in gradient ? gradient.position + " " : "";gradient.position += token.value;token = parser.getToken(true, true);
						}if (!haveAngle && token.isAngle()) {
							gradient.angle = token.value;haveAngle = true;token = parser.getToken(true, true);
						}if (!token.isSymbol(",")) return null;token = parser.getToken(true, true);
					}if (gradient.isRadial) {
						if (token.isIdent("circle") || token.isIdent("ellipse")) {
							gradient.shape = token.value;token = parser.getToken(true, true);
						}if (token.isIdent("closest-side") || token.isIdent("closest-corner") || token.isIdent("farthest-side") || token.isIdent("farthest-corner") || token.isIdent("contain") || token.isIdent("cover")) {
							gradient.size = token.value;token = parser.getToken(true, true);
						}if (!("shape" in gradient) && (token.isIdent("circle") || token.isIdent("ellipse"))) {
							gradient.shape = token.value;token = parser.getToken(true, true);
						}if (("shape" in gradient || "size" in gradient) && !token.isSymbol(",")) return null;else if ("shape" in gradient || "size" in gradient) token = parser.getToken(true, true);
					}var stop1 = this.parseColorStop(parser, token);if (!stop1) return null;token = parser.currentToken();if (!token.isSymbol(",")) return null;token = parser.getToken(true, true);var stop2 = this.parseColorStop(parser, token);if (!stop2) return null;token = parser.currentToken();if (token.isSymbol(",")) {
						token = parser.getToken(true, true);
					}gradient.stops = [stop1, stop2];while (!token.isSymbol(")")) {
						var colorstop = this.parseColorStop(parser, token);if (!colorstop) return null;token = parser.currentToken();if (!token.isSymbol(")") && !token.isSymbol(",")) return null;if (token.isSymbol(",")) token = parser.getToken(true, true);gradient.stops.push(colorstop);
					}return gradient;
				}
			}return null;
		}, parseBoxShadows: function parseBoxShadows(aString) {
			var parser = new CSSParser();parser._init();parser.mPreserveWS = false;parser.mPreserveComments = false;parser.mPreservedTokens = [];parser.mScanner.init(aString);var shadows = [];var token = parser.getToken(true, true);var color = "",
			    blurRadius = "0px",
			    offsetX = "0px",
			    offsetY = "0px",
			    spreadRadius = "0px";var inset = false;while (token.isNotNull()) {
				if (token.isIdent("none")) {
					shadows.push({ none: true });token = parser.getToken(true, true);
				} else {
					if (token.isIdent('inset')) {
						inset = true;token = parser.getToken(true, true);
					}if (token.isPercentage() || token.isDimensionOfUnit("cm") || token.isDimensionOfUnit("mm") || token.isDimensionOfUnit("in") || token.isDimensionOfUnit("pc") || token.isDimensionOfUnit("px") || token.isDimensionOfUnit("em") || token.isDimensionOfUnit("ex") || token.isDimensionOfUnit("pt")) {
						var offsetX = token.value;token = parser.getToken(true, true);
					} else return [];if (!inset && token.isIdent('inset')) {
						inset = true;token = parser.getToken(true, true);
					}if (token.isPercentage() || token.isDimensionOfUnit("cm") || token.isDimensionOfUnit("mm") || token.isDimensionOfUnit("in") || token.isDimensionOfUnit("pc") || token.isDimensionOfUnit("px") || token.isDimensionOfUnit("em") || token.isDimensionOfUnit("ex") || token.isDimensionOfUnit("pt")) {
						var offsetX = token.value;token = parser.getToken(true, true);
					} else return [];if (!inset && token.isIdent('inset')) {
						inset = true;token = parser.getToken(true, true);
					}if (token.isPercentage() || token.isDimensionOfUnit("cm") || token.isDimensionOfUnit("mm") || token.isDimensionOfUnit("in") || token.isDimensionOfUnit("pc") || token.isDimensionOfUnit("px") || token.isDimensionOfUnit("em") || token.isDimensionOfUnit("ex") || token.isDimensionOfUnit("pt")) {
						var blurRadius = token.value;token = parser.getToken(true, true);
					}if (!inset && token.isIdent('inset')) {
						inset = true;token = parser.getToken(true, true);
					}if (token.isPercentage() || token.isDimensionOfUnit("cm") || token.isDimensionOfUnit("mm") || token.isDimensionOfUnit("in") || token.isDimensionOfUnit("pc") || token.isDimensionOfUnit("px") || token.isDimensionOfUnit("em") || token.isDimensionOfUnit("ex") || token.isDimensionOfUnit("pt")) {
						var spreadRadius = token.value;token = parser.getToken(true, true);
					}if (!inset && token.isIdent('inset')) {
						inset = true;token = parser.getToken(true, true);
					}if (token.isFunction("rgb(") || token.isFunction("rgba(") || token.isFunction("hsl(") || token.isFunction("hsla(") || token.isSymbol("#") || token.isIdent()) {
						var color = parser.parseColor(token);token = parser.getToken(true, true);
					}if (!inset && token.isIdent('inset')) {
						inset = true;token = parser.getToken(true, true);
					}shadows.push({ none: false, color: color, offsetX: offsetX, offsetY: offsetY, blurRadius: blurRadius, spreadRadius: spreadRadius });if (token.isSymbol(",")) {
						inset = false;color = "";blurRadius = "0px";spreadRadius = "0px";offsetX = "0px";offsetY = "0px";token = parser.getToken(true, true);
					} else if (!token.isNotNull()) return shadows;else return [];
				}
			}return shadows;
		}, parseTextShadows: function parseTextShadows(aString) {
			var parser = new CSSParser();parser._init();parser.mPreserveWS = false;parser.mPreserveComments = false;parser.mPreservedTokens = [];parser.mScanner.init(aString);var shadows = [];var token = parser.getToken(true, true);var color = "",
			    blurRadius = "0px",
			    offsetX = "0px",
			    offsetY = "0px";while (token.isNotNull()) {
				if (token.isIdent("none")) {
					shadows.push({ none: true });token = parser.getToken(true, true);
				} else {
					if (token.isFunction("rgb(") || token.isFunction("rgba(") || token.isFunction("hsl(") || token.isFunction("hsla(") || token.isSymbol("#") || token.isIdent()) {
						var color = parser.parseColor(token);token = parser.getToken(true, true);
					}if (token.isPercentage() || token.isDimensionOfUnit("cm") || token.isDimensionOfUnit("mm") || token.isDimensionOfUnit("in") || token.isDimensionOfUnit("pc") || token.isDimensionOfUnit("px") || token.isDimensionOfUnit("em") || token.isDimensionOfUnit("ex") || token.isDimensionOfUnit("pt")) {
						var offsetX = token.value;token = parser.getToken(true, true);
					} else return [];if (token.isPercentage() || token.isDimensionOfUnit("cm") || token.isDimensionOfUnit("mm") || token.isDimensionOfUnit("in") || token.isDimensionOfUnit("pc") || token.isDimensionOfUnit("px") || token.isDimensionOfUnit("em") || token.isDimensionOfUnit("ex") || token.isDimensionOfUnit("pt")) {
						var offsetY = token.value;token = parser.getToken(true, true);
					} else return [];if (token.isPercentage() || token.isDimensionOfUnit("cm") || token.isDimensionOfUnit("mm") || token.isDimensionOfUnit("in") || token.isDimensionOfUnit("pc") || token.isDimensionOfUnit("px") || token.isDimensionOfUnit("em") || token.isDimensionOfUnit("ex") || token.isDimensionOfUnit("pt")) {
						var blurRadius = token.value;token = parser.getToken(true, true);
					}if (!color && (token.isFunction("rgb(") || token.isFunction("rgba(") || token.isFunction("hsl(") || token.isFunction("hsla(") || token.isSymbol("#") || token.isIdent())) {
						var color = parser.parseColor(token);token = parser.getToken(true, true);
					}shadows.push({ none: false, color: color, offsetX: offsetX, offsetY: offsetY, blurRadius: blurRadius });if (token.isSymbol(",")) {
						color = "";blurRadius = "0px";offsetX = "0px";offsetY = "0px";token = parser.getToken(true, true);
					} else if (!token.isNotNull()) return shadows;else return [];
				}
			}return shadows;
		}, parseBackgroundImages: function parseBackgroundImages(aString) {
			var parser = new CSSParser();parser._init();parser.mPreserveWS = false;parser.mPreserveComments = false;parser.mPreservedTokens = [];parser.mScanner.init(aString);var backgrounds = [];var token = parser.getToken(true, true);while (token.isNotNull()) {
				if (token.isFunction("url(")) {
					token = parser.getToken(true, true);var urlContent = parser.parseURL(token);backgrounds.push({ type: "image", value: "url(" + urlContent });token = parser.getToken(true, true);
				} else if (token.isFunction("-moz-linear-gradient(") || token.isFunction("-moz-radial-gradient(") || token.isFunction("-moz-repeating-linear-gradient(") || token.isFunction("-moz-repeating-radial-gradient(")) {
					var gradient = this.parseGradient(parser, token);backgrounds.push({ type: gradient.isRadial ? "radial-gradient" : "linear-gradient", value: gradient });token = parser.getToken(true, true);
				} else return null;if (token.isSymbol(",")) {
					token = parser.getToken(true, true);if (!token.isNotNull()) return null;
				}
			}return backgrounds;
		}, serializeGradient: function serializeGradient(gradient) {
			var s = gradient.isRadial ? gradient.isRepeating ? "-moz-repeating-radial-gradient(" : "-moz-radial-gradient(" : gradient.isRepeating ? "-moz-repeating-linear-gradient(" : "-moz-linear-gradient(";if (gradient.angle || gradient.position) s += (gradient.angle ? gradient.angle + " " : "") + (gradient.position ? gradient.position : "") + ", ";if (gradient.isRadial && (gradient.shape || gradient.size)) s += (gradient.shape ? gradient.shape : "") + " " + (gradient.size ? gradient.size : "") + ", ";for (var i = 0; i < gradient.stops.length; i++) {
				var colorstop = gradient.stops[i];s += colorstop.color + (colorstop.position ? " " + colorstop.position : "");if (i != gradient.stops.length - 1) s += ", ";
			}s += ")";return s;
		}, parseBorderImage: function parseBorderImage(aString) {
			var parser = new CSSParser();parser._init();parser.mPreserveWS = false;parser.mPreserveComments = false;parser.mPreservedTokens = [];parser.mScanner.init(aString);var borderImage = { url: "", offsets: [], widths: [], sizes: [] };var token = parser.getToken(true, true);if (token.isFunction("url(")) {
				token = parser.getToken(true, true);var urlContent = parser.parseURL(token);if (urlContent) {
					borderImage.url = urlContent.substr(0, urlContent.length - 1).trim();if (borderImage.url[0] == '"' && borderImage.url[borderImage.url.length - 1] == '"' || borderImage.url[0] == "'" && borderImage.url[borderImage.url.length - 1] == "'") borderImage.url = borderImage.url.substr(1, borderImage.url.length - 2);
				} else return null;
			} else return null;token = parser.getToken(true, true);if (token.isNumber() || token.isPercentage()) borderImage.offsets.push(token.value);else return null;var i;for (i = 0; i < 3; i++) {
				token = parser.getToken(true, true);if (token.isNumber() || token.isPercentage()) borderImage.offsets.push(token.value);else break;
			}if (i == 3) token = parser.getToken(true, true);if (token.isSymbol("/")) {
				token = parser.getToken(true, true);if (token.isDimension() || token.isNumber("0") || token.isIdent() && token.value in parser.kBORDER_WIDTH_NAMES) borderImage.widths.push(token.value);else return null;for (var i = 0; i < 3; i++) {
					token = parser.getToken(true, true);if (token.isDimension() || token.isNumber("0") || token.isIdent() && token.value in parser.kBORDER_WIDTH_NAMES) borderImage.widths.push(token.value);else break;
				}if (i == 3) token = parser.getToken(true, true);
			}for (var i = 0; i < 2; i++) {
				if (token.isIdent("stretch") || token.isIdent("repeat") || token.isIdent("round")) borderImage.sizes.push(token.value);else if (!token.isNotNull()) return borderImage;else return null;token = parser.getToken(true, true);
			}if (!token.isNotNull()) return borderImage;return null;
		}, parseMediaQuery: function parseMediaQuery(aString) {
			var kCONSTRAINTS = { "width": true, "min-width": true, "max-width": true, "height": true, "min-height": true, "max-height": true, "device-width": true, "min-device-width": true, "max-device-width": true, "device-height": true, "min-device-height": true, "max-device-height": true, "orientation": true, "aspect-ratio": true, "min-aspect-ratio": true, "max-aspect-ratio": true, "device-aspect-ratio": true, "min-device-aspect-ratio": true, "max-device-aspect-ratio": true, "color": true, "min-color": true, "max-color": true, "color-index": true, "min-color-index": true, "max-color-index": true, "monochrome": true, "min-monochrome": true, "max-monochrome": true, "resolution": true, "min-resolution": true, "max-resolution": true, "scan": true, "grid": true };var parser = new CSSParser();parser._init();parser.mPreserveWS = false;parser.mPreserveComments = false;parser.mPreservedTokens = [];parser.mScanner.init(aString);var m = { amplifier: "", medium: "", constraints: [] };var token = parser.getToken(true, true);if (token.isIdent("all") || token.isIdent("aural") || token.isIdent("braille") || token.isIdent("handheld") || token.isIdent("print") || token.isIdent("projection") || token.isIdent("screen") || token.isIdent("tty") || token.isIdent("tv")) {
				m.medium = token.value;token = parser.getToken(true, true);
			} else if (token.isIdent("not") || token.isIdent("only")) {
				m.amplifier = token.value;token = parser.getToken(true, true);if (token.isIdent("all") || token.isIdent("aural") || token.isIdent("braille") || token.isIdent("handheld") || token.isIdent("print") || token.isIdent("projection") || token.isIdent("screen") || token.isIdent("tty") || token.isIdent("tv")) {
					m.medium = token.value;token = parser.getToken(true, true);
				} else return null;
			}if (m.medium) {
				if (!token.isNotNull()) return m;if (token.isIdent("and")) {
					token = parser.getToken(true, true);
				} else return null;
			}while (token.isSymbol("(")) {
				token = parser.getToken(true, true);if (token.isIdent() && token.value in kCONSTRAINTS) {
					var constraint = token.value;token = parser.getToken(true, true);if (token.isSymbol(":")) {
						token = parser.getToken(true, true);var values = [];while (!token.isSymbol(")")) {
							values.push(token.value);token = parser.getToken(true, true);
						}if (token.isSymbol(")")) {
							m.constraints.push({ constraint: constraint, value: values });token = parser.getToken(true, true);if (token.isNotNull()) {
								if (token.isIdent("and")) {
									token = parser.getToken(true, true);
								} else return null;
							} else return m;
						} else return null;
					} else if (token.isSymbol(")")) {
						m.constraints.push({ constraint: constraint, value: null });token = parser.getToken(true, true);if (token.isNotNull()) {
							if (token.isIdent("and")) {
								token = parser.getToken(true, true);
							} else return null;
						} else return m;
					} else return null;
				} else return null;
			}return m;
		} };var CSS_ESCAPE = '\\';var IS_HEX_DIGIT = 1;var START_IDENT = 2;var IS_IDENT = 4;var IS_WHITESPACE = 8;var W = IS_WHITESPACE;var I = IS_IDENT;var S = START_IDENT;var SI = IS_IDENT | START_IDENT;var XI = IS_IDENT | IS_HEX_DIGIT;var XSI = IS_IDENT | START_IDENT | IS_HEX_DIGIT;function CSSScanner(aString) {
		this.init(aString);
	}CSSScanner.prototype = { kLexTable: [0, 0, 0, 0, 0, 0, 0, 0, 0, W, W, 0, W, W, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, W, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, I, 0, 0, XI, XI, XI, XI, XI, XI, XI, XI, XI, XI, 0, 0, 0, 0, 0, 0, 0, XSI, XSI, XSI, XSI, XSI, XSI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, 0, S, 0, 0, SI, 0, XSI, XSI, XSI, XSI, XSI, XSI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI, SI], kHexValues: { "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "a": 10, "b": 11, "c": 12, "d": 13, "e": 14, "f": 15 }, mString: "", mPos: 0, mPreservedPos: [], init: function init(aString) {
			this.mString = aString;this.mPos = 0;this.mPreservedPos = [];
		}, getCurrentPos: function getCurrentPos() {
			return this.mPos;
		}, getAlreadyScanned: function getAlreadyScanned() {
			return this.mString.substr(0, this.mPos);
		}, preserveState: function preserveState() {
			this.mPreservedPos.push(this.mPos);
		}, restoreState: function restoreState() {
			if (this.mPreservedPos.length) {
				this.mPos = this.mPreservedPos.pop();
			}
		}, forgetState: function forgetState() {
			if (this.mPreservedPos.length) {
				this.mPreservedPos.pop();
			}
		}, read: function read() {
			if (this.mPos < this.mString.length) return this.mString.charAt(this.mPos++);return -1;
		}, peek: function peek() {
			if (this.mPos < this.mString.length) return this.mString.charAt(this.mPos);return -1;
		}, isHexDigit: function isHexDigit(c) {
			var code = c.charCodeAt(0);return code < 256 && (this.kLexTable[code] & IS_HEX_DIGIT) != 0;
		}, isIdentStart: function isIdentStart(c) {
			var code = c.charCodeAt(0);return code >= 256 || (this.kLexTable[code] & START_IDENT) != 0;
		}, startsWithIdent: function startsWithIdent(aFirstChar, aSecondChar) {
			var code = aFirstChar.charCodeAt(0);return this.isIdentStart(aFirstChar) || aFirstChar == "-" && this.isIdentStart(aSecondChar);
		}, isIdent: function isIdent(c) {
			var code = c.charCodeAt(0);return code >= 256 || (this.kLexTable[code] & IS_IDENT) != 0;
		}, pushback: function pushback() {
			this.mPos--;
		}, nextHexValue: function nextHexValue() {
			var c = this.read();if (c == -1 || !this.isHexDigit(c)) return new jscsspToken(jscsspToken.NULL_TYPE, null);var s = c;c = this.read();while (c != -1 && this.isHexDigit(c)) {
				s += c;c = this.read();
			}if (c != -1) this.pushback();return new jscsspToken(jscsspToken.HEX_TYPE, s);
		}, gatherEscape: function gatherEscape() {
			var c = this.peek();if (c == -1) return "";if (this.isHexDigit(c)) {
				var code = 0;for (var i = 0; i < 6; i++) {
					c = this.read();if (this.isHexDigit(c)) code = code * 16 + this.kHexValues[c.toLowerCase()];else if (!this.isHexDigit(c) && !this.isWhiteSpace(c)) {
						this.pushback();break;
					} else break;
				}if (i == 6) {
					c = this.peek();if (this.isWhiteSpace(c)) this.read();
				}return String.fromCharCode(code);
			}c = this.read();if (c != "\n") return c;return "";
		}, gatherIdent: function gatherIdent(c) {
			var s = "";if (c == CSS_ESCAPE) s += this.gatherEscape();else s += c;c = this.read();while (c != -1 && (this.isIdent(c) || c == CSS_ESCAPE)) {
				if (c == CSS_ESCAPE) s += this.gatherEscape();else s += c;c = this.read();
			}if (c != -1) this.pushback();return s;
		}, parseIdent: function parseIdent(c) {
			var value = this.gatherIdent(c);var nextChar = this.peek();if (nextChar == "(") {
				value += this.read();return new jscsspToken(jscsspToken.FUNCTION_TYPE, value);
			}return new jscsspToken(jscsspToken.IDENT_TYPE, value);
		}, isDigit: function isDigit(c) {
			return c >= '0' && c <= '9';
		}, parseComment: function parseComment(c) {
			var s = c;while ((c = this.read()) != -1) {
				s += c;if (c == "*") {
					c = this.read();if (c == -1) break;if (c == "/") {
						s += c;break;
					}this.pushback();
				}
			}return new jscsspToken(jscsspToken.COMMENT_TYPE, s);
		}, parseNumber: function parseNumber(c) {
			var s = c;var foundDot = false;while ((c = this.read()) != -1) {
				if (c == ".") {
					if (foundDot) break;else {
						s += c;foundDot = true;
					}
				} else if (this.isDigit(c)) s += c;else break;
			}if (c != -1 && this.startsWithIdent(c, this.peek())) {
				var unit = this.gatherIdent(c);s += unit;return new jscsspToken(jscsspToken.DIMENSION_TYPE, s, unit);
			} else if (c == "%") {
				s += "%";return new jscsspToken(jscsspToken.PERCENTAGE_TYPE, s);
			} else if (c != -1) this.pushback();return new jscsspToken(jscsspToken.NUMBER_TYPE, s);
		}, parseString: function parseString(aStop) {
			var s = aStop;var previousChar = aStop;var c;while ((c = this.read()) != -1) {
				if (c == aStop && previousChar != CSS_ESCAPE) {
					s += c;break;
				} else if (c == CSS_ESCAPE) {
					c = this.peek();if (c == -1) break;else if (c == "\n" || c == "\r" || c == "\f") {
						d = c;c = this.read();if (d == "\r") {
							c = this.peek();if (c == "\n") c = this.read();
						}
					} else {
						s += this.gatherEscape();c = this.peek();
					}
				} else if (c == "\n" || c == "\r" || c == "\f") {
					break;
				} else s += c;previousChar = c;
			}return new jscsspToken(jscsspToken.STRING_TYPE, s);
		}, isWhiteSpace: function isWhiteSpace(c) {
			var code = c.charCodeAt(0);return code < 256 && (this.kLexTable[code] & IS_WHITESPACE) != 0;
		}, eatWhiteSpace: function eatWhiteSpace(c) {
			var s = c;while ((c = this.read()) != -1) {
				if (!this.isWhiteSpace(c)) break;s += c;
			}if (c != -1) this.pushback();return s;
		}, parseAtKeyword: function parseAtKeyword(c) {
			return new jscsspToken(jscsspToken.ATRULE_TYPE, this.gatherIdent(c));
		}, nextToken: function nextToken() {
			var c = this.read();if (c == -1) return new jscsspToken(jscsspToken.NULL_TYPE, null);if (this.startsWithIdent(c, this.peek())) return this.parseIdent(c);if (c == '@') {
				var nextChar = this.read();if (nextChar != -1) {
					var followingChar = this.peek();this.pushback();if (this.startsWithIdent(nextChar, followingChar)) return this.parseAtKeyword(c);
				}
			}if (c == "." || c == "+" || c == "-") {
				var nextChar = this.peek();if (this.isDigit(nextChar)) return this.parseNumber(c);else if (nextChar == "." && c != ".") {
					firstChar = this.read();var secondChar = this.peek();this.pushback();if (this.isDigit(secondChar)) return this.parseNumber(c);
				}
			}if (this.isDigit(c)) {
				return this.parseNumber(c);
			}if (c == "'" || c == '"') return this.parseString(c);if (this.isWhiteSpace(c)) {
				var s = this.eatWhiteSpace(c);return new jscsspToken(jscsspToken.WHITESPACE_TYPE, s);
			}if (c == "|" || c == "~" || c == "^" || c == "$" || c == "*") {
				var nextChar = this.read();if (nextChar == "=") {
					switch (c) {case "~":
							return new jscsspToken(jscsspToken.INCLUDES_TYPE, "~=");case "|":
							return new jscsspToken(jscsspToken.DASHMATCH_TYPE, "|=");case "^":
							return new jscsspToken(jscsspToken.BEGINSMATCH_TYPE, "^=");case "$":
							return new jscsspToken(jscsspToken.ENDSMATCH_TYPE, "$=");case "*":
							return new jscsspToken(jscsspToken.CONTAINSMATCH_TYPE, "*=");default:
							break;}
				} else if (nextChar != -1) this.pushback();
			}if (c == "/" && this.peek() == "*") return this.parseComment(c);return new jscsspToken(jscsspToken.SYMBOL_TYPE, c);
		} };function CSSParser(aString) {
		this.mToken = null;this.mLookAhead = null;this.mScanner = new CSSScanner(aString);this.mPreserveWS = true;this.mPreserveComments = true;this.mPreservedTokens = [];this.mError = null;
	}CSSParser.prototype = { _init: function _init() {
			this.mToken = null;this.mLookAhead = null;
		}, kINHERIT: "inherit", kBORDER_WIDTH_NAMES: { "thin": true, "medium": true, "thick": true }, kBORDER_STYLE_NAMES: { "none": true, "hidden": true, "dotted": true, "dashed": true, "solid": true, "double": true, "groove": true, "ridge": true, "inset": true, "outset": true }, kCOLOR_NAMES: (_kCOLOR_NAMES = { "transparent": true, "black": true, "silver": true, "gray": true, "white": true, "maroon": true, "red": true, "purple": true, "fuchsia": true, "green": true, "lime": true, "olive": true, "yellow": true, "navy": true, "blue": true, "teal": true, "aqua": true, "aliceblue": true, "antiquewhite": true }, _defineProperty(_kCOLOR_NAMES, "aqua", true), _defineProperty(_kCOLOR_NAMES, "aquamarine", true), _defineProperty(_kCOLOR_NAMES, "azure", true), _defineProperty(_kCOLOR_NAMES, "beige", true), _defineProperty(_kCOLOR_NAMES, "bisque", true), _defineProperty(_kCOLOR_NAMES, "black", true), _defineProperty(_kCOLOR_NAMES, "blanchedalmond", true), _defineProperty(_kCOLOR_NAMES, "blue", true), _defineProperty(_kCOLOR_NAMES, "blueviolet", true), _defineProperty(_kCOLOR_NAMES, "brown", true), _defineProperty(_kCOLOR_NAMES, "burlywood", true), _defineProperty(_kCOLOR_NAMES, "cadetblue", true), _defineProperty(_kCOLOR_NAMES, "chartreuse", true), _defineProperty(_kCOLOR_NAMES, "chocolate", true), _defineProperty(_kCOLOR_NAMES, "coral", true), _defineProperty(_kCOLOR_NAMES, "cornflowerblue", true), _defineProperty(_kCOLOR_NAMES, "cornsilk", true), _defineProperty(_kCOLOR_NAMES, "crimson", true), _defineProperty(_kCOLOR_NAMES, "cyan", true), _defineProperty(_kCOLOR_NAMES, "darkblue", true), _defineProperty(_kCOLOR_NAMES, "darkcyan", true), _defineProperty(_kCOLOR_NAMES, "darkgoldenrod", true), _defineProperty(_kCOLOR_NAMES, "darkgray", true), _defineProperty(_kCOLOR_NAMES, "darkgreen", true), _defineProperty(_kCOLOR_NAMES, "darkgrey", true), _defineProperty(_kCOLOR_NAMES, "darkkhaki", true), _defineProperty(_kCOLOR_NAMES, "darkmagenta", true), _defineProperty(_kCOLOR_NAMES, "darkolivegreen", true), _defineProperty(_kCOLOR_NAMES, "darkorange", true), _defineProperty(_kCOLOR_NAMES, "darkorchid", true), _defineProperty(_kCOLOR_NAMES, "darkred", true), _defineProperty(_kCOLOR_NAMES, "darksalmon", true), _defineProperty(_kCOLOR_NAMES, "darkseagreen", true), _defineProperty(_kCOLOR_NAMES, "darkslateblue", true), _defineProperty(_kCOLOR_NAMES, "darkslategray", true), _defineProperty(_kCOLOR_NAMES, "darkslategrey", true), _defineProperty(_kCOLOR_NAMES, "darkturquoise", true), _defineProperty(_kCOLOR_NAMES, "darkviolet", true), _defineProperty(_kCOLOR_NAMES, "deeppink", true), _defineProperty(_kCOLOR_NAMES, "deepskyblue", true), _defineProperty(_kCOLOR_NAMES, "dimgray", true), _defineProperty(_kCOLOR_NAMES, "dimgrey", true), _defineProperty(_kCOLOR_NAMES, "dodgerblue", true), _defineProperty(_kCOLOR_NAMES, "firebrick", true), _defineProperty(_kCOLOR_NAMES, "floralwhite", true), _defineProperty(_kCOLOR_NAMES, "forestgreen", true), _defineProperty(_kCOLOR_NAMES, "fuchsia", true), _defineProperty(_kCOLOR_NAMES, "gainsboro", true), _defineProperty(_kCOLOR_NAMES, "ghostwhite", true), _defineProperty(_kCOLOR_NAMES, "gold", true), _defineProperty(_kCOLOR_NAMES, "goldenrod", true), _defineProperty(_kCOLOR_NAMES, "gray", true), _defineProperty(_kCOLOR_NAMES, "green", true), _defineProperty(_kCOLOR_NAMES, "greenyellow", true), _defineProperty(_kCOLOR_NAMES, "grey", true), _defineProperty(_kCOLOR_NAMES, "honeydew", true), _defineProperty(_kCOLOR_NAMES, "hotpink", true), _defineProperty(_kCOLOR_NAMES, "indianred", true), _defineProperty(_kCOLOR_NAMES, "indigo", true), _defineProperty(_kCOLOR_NAMES, "ivory", true), _defineProperty(_kCOLOR_NAMES, "khaki", true), _defineProperty(_kCOLOR_NAMES, "lavender", true), _defineProperty(_kCOLOR_NAMES, "lavenderblush", true), _defineProperty(_kCOLOR_NAMES, "lawngreen", true), _defineProperty(_kCOLOR_NAMES, "lemonchiffon", true), _defineProperty(_kCOLOR_NAMES, "lightblue", true), _defineProperty(_kCOLOR_NAMES, "lightcoral", true), _defineProperty(_kCOLOR_NAMES, "lightcyan", true), _defineProperty(_kCOLOR_NAMES, "lightgoldenrodyellow", true), _defineProperty(_kCOLOR_NAMES, "lightgray", true), _defineProperty(_kCOLOR_NAMES, "lightgreen", true), _defineProperty(_kCOLOR_NAMES, "lightgrey", true), _defineProperty(_kCOLOR_NAMES, "lightpink", true), _defineProperty(_kCOLOR_NAMES, "lightsalmon", true), _defineProperty(_kCOLOR_NAMES, "lightseagreen", true), _defineProperty(_kCOLOR_NAMES, "lightskyblue", true), _defineProperty(_kCOLOR_NAMES, "lightslategray", true), _defineProperty(_kCOLOR_NAMES, "lightslategrey", true), _defineProperty(_kCOLOR_NAMES, "lightsteelblue", true), _defineProperty(_kCOLOR_NAMES, "lightyellow", true), _defineProperty(_kCOLOR_NAMES, "lime", true), _defineProperty(_kCOLOR_NAMES, "limegreen", true), _defineProperty(_kCOLOR_NAMES, "linen", true), _defineProperty(_kCOLOR_NAMES, "magenta", true), _defineProperty(_kCOLOR_NAMES, "maroon", true), _defineProperty(_kCOLOR_NAMES, "mediumaquamarine", true), _defineProperty(_kCOLOR_NAMES, "mediumblue", true), _defineProperty(_kCOLOR_NAMES, "mediumorchid", true), _defineProperty(_kCOLOR_NAMES, "mediumpurple", true), _defineProperty(_kCOLOR_NAMES, "mediumseagreen", true), _defineProperty(_kCOLOR_NAMES, "mediumslateblue", true), _defineProperty(_kCOLOR_NAMES, "mediumspringgreen", true), _defineProperty(_kCOLOR_NAMES, "mediumturquoise", true), _defineProperty(_kCOLOR_NAMES, "mediumvioletred", true), _defineProperty(_kCOLOR_NAMES, "midnightblue", true), _defineProperty(_kCOLOR_NAMES, "mintcream", true), _defineProperty(_kCOLOR_NAMES, "mistyrose", true), _defineProperty(_kCOLOR_NAMES, "moccasin", true), _defineProperty(_kCOLOR_NAMES, "navajowhite", true), _defineProperty(_kCOLOR_NAMES, "navy", true), _defineProperty(_kCOLOR_NAMES, "oldlace", true), _defineProperty(_kCOLOR_NAMES, "olive", true), _defineProperty(_kCOLOR_NAMES, "olivedrab", true), _defineProperty(_kCOLOR_NAMES, "orange", true), _defineProperty(_kCOLOR_NAMES, "orangered", true), _defineProperty(_kCOLOR_NAMES, "orchid", true), _defineProperty(_kCOLOR_NAMES, "palegoldenrod", true), _defineProperty(_kCOLOR_NAMES, "palegreen", true), _defineProperty(_kCOLOR_NAMES, "paleturquoise", true), _defineProperty(_kCOLOR_NAMES, "palevioletred", true), _defineProperty(_kCOLOR_NAMES, "papayawhip", true), _defineProperty(_kCOLOR_NAMES, "peachpuff", true), _defineProperty(_kCOLOR_NAMES, "peru", true), _defineProperty(_kCOLOR_NAMES, "pink", true), _defineProperty(_kCOLOR_NAMES, "plum", true), _defineProperty(_kCOLOR_NAMES, "powderblue", true), _defineProperty(_kCOLOR_NAMES, "purple", true), _defineProperty(_kCOLOR_NAMES, "red", true), _defineProperty(_kCOLOR_NAMES, "rosybrown", true), _defineProperty(_kCOLOR_NAMES, "royalblue", true), _defineProperty(_kCOLOR_NAMES, "saddlebrown", true), _defineProperty(_kCOLOR_NAMES, "salmon", true), _defineProperty(_kCOLOR_NAMES, "sandybrown", true), _defineProperty(_kCOLOR_NAMES, "seagreen", true), _defineProperty(_kCOLOR_NAMES, "seashell", true), _defineProperty(_kCOLOR_NAMES, "sienna", true), _defineProperty(_kCOLOR_NAMES, "silver", true), _defineProperty(_kCOLOR_NAMES, "skyblue", true), _defineProperty(_kCOLOR_NAMES, "slateblue", true), _defineProperty(_kCOLOR_NAMES, "slategray", true), _defineProperty(_kCOLOR_NAMES, "slategrey", true), _defineProperty(_kCOLOR_NAMES, "snow", true), _defineProperty(_kCOLOR_NAMES, "springgreen", true), _defineProperty(_kCOLOR_NAMES, "steelblue", true), _defineProperty(_kCOLOR_NAMES, "tan", true), _defineProperty(_kCOLOR_NAMES, "teal", true), _defineProperty(_kCOLOR_NAMES, "thistle", true), _defineProperty(_kCOLOR_NAMES, "tomato", true), _defineProperty(_kCOLOR_NAMES, "turquoise", true), _defineProperty(_kCOLOR_NAMES, "violet", true), _defineProperty(_kCOLOR_NAMES, "wheat", true), _defineProperty(_kCOLOR_NAMES, "white", true), _defineProperty(_kCOLOR_NAMES, "whitesmoke", true), _defineProperty(_kCOLOR_NAMES, "yellow", true), _defineProperty(_kCOLOR_NAMES, "yellowgreen", true), _defineProperty(_kCOLOR_NAMES, "activeborder", true), _defineProperty(_kCOLOR_NAMES, "activecaption", true), _defineProperty(_kCOLOR_NAMES, "appworkspace", true), _defineProperty(_kCOLOR_NAMES, "background", true), _defineProperty(_kCOLOR_NAMES, "buttonface", true), _defineProperty(_kCOLOR_NAMES, "buttonhighlight", true), _defineProperty(_kCOLOR_NAMES, "buttonshadow", true), _defineProperty(_kCOLOR_NAMES, "buttontext", true), _defineProperty(_kCOLOR_NAMES, "captiontext", true), _defineProperty(_kCOLOR_NAMES, "graytext", true), _defineProperty(_kCOLOR_NAMES, "highlight", true), _defineProperty(_kCOLOR_NAMES, "highlighttext", true), _defineProperty(_kCOLOR_NAMES, "inactiveborder", true), _defineProperty(_kCOLOR_NAMES, "inactivecaption", true), _defineProperty(_kCOLOR_NAMES, "inactivecaptiontext", true), _defineProperty(_kCOLOR_NAMES, "infobackground", true), _defineProperty(_kCOLOR_NAMES, "infotext", true), _defineProperty(_kCOLOR_NAMES, "menu", true), _defineProperty(_kCOLOR_NAMES, "menutext", true), _defineProperty(_kCOLOR_NAMES, "scrollbar", true), _defineProperty(_kCOLOR_NAMES, "threeddarkshadow", true), _defineProperty(_kCOLOR_NAMES, "threedface", true), _defineProperty(_kCOLOR_NAMES, "threedhighlight", true), _defineProperty(_kCOLOR_NAMES, "threedlightshadow", true), _defineProperty(_kCOLOR_NAMES, "threedshadow", true), _defineProperty(_kCOLOR_NAMES, "window", true), _defineProperty(_kCOLOR_NAMES, "windowframe", true), _defineProperty(_kCOLOR_NAMES, "windowtext", true), _kCOLOR_NAMES), kLIST_STYLE_TYPE_NAMES: { "decimal": true, "decimal-leading-zero": true, "lower-roman": true, "upper-roman": true, "georgian": true, "armenian": true, "lower-latin": true, "lower-alpha": true, "upper-latin": true, "upper-alpha": true, "lower-greek": true, "disc": true, "circle": true, "square": true, "none": true, "box": true, "check": true, "diamond": true, "hyphen": true, "lower-armenian": true, "cjk-ideographic": true, "ethiopic-numeric": true, "hebrew": true, "japanese-formal": true, "japanese-informal": true, "simp-chinese-formal": true, "simp-chinese-informal": true, "syriac": true, "tamil": true, "trad-chinese-formal": true, "trad-chinese-informal": true, "upper-armenian": true, "arabic-indic": true, "binary": true, "bengali": true, "cambodian": true, "khmer": true, "devanagari": true, "gujarati": true, "gurmukhi": true, "kannada": true, "lower-hexadecimal": true, "lao": true, "malayalam": true, "mongolian": true, "myanmar": true, "octal": true, "oriya": true, "persian": true, "urdu": true, "telugu": true, "tibetan": true, "upper-hexadecimal": true, "afar": true, "ethiopic-halehame-aa-et": true, "ethiopic-halehame-am-et": true, "amharic-abegede": true, "ehiopic-abegede-am-et": true, "cjk-earthly-branch": true, "cjk-heavenly-stem": true, "ethiopic": true, "ethiopic-abegede": true, "ethiopic-abegede-gez": true, "hangul-consonant": true, "hangul": true, "hiragana-iroha": true, "hiragana": true, "katakana-iroha": true, "katakana": true, "lower-norwegian": true, "oromo": true, "ethiopic-halehame-om-et": true, "sidama": true, "ethiopic-halehame-sid-et": true, "somali": true, "ethiopic-halehame-so-et": true, "tigre": true, "ethiopic-halehame-tig": true, "tigrinya-er-abegede": true, "ethiopic-abegede-ti-er": true, "tigrinya-et": true, "ethiopic-halehame-ti-et": true, "upper-greek": true, "asterisks": true, "footnotes": true, "circled-decimal": true, "circled-lower-latin": true, "circled-upper-latin": true, "dotted-decimal": true, "double-circled-decimal": true, "filled-circled-decimal": true, "parenthesised-decimal": true, "parenthesised-lower-latin": true }, reportError: function reportError(aMsg) {
			this.mError = aMsg;
		}, consumeError: function consumeError() {
			var e = this.mError;this.mError = null;return e;
		}, currentToken: function currentToken() {
			return this.mToken;
		}, getHexValue: function getHexValue() {
			this.mToken = this.mScanner.nextHexValue();return this.mToken;
		}, getToken: function getToken(aSkipWS, aSkipComment) {
			if (this.mLookAhead) {
				this.mToken = this.mLookAhead;this.mLookAhead = null;return this.mToken;
			}this.mToken = this.mScanner.nextToken();while (this.mToken && (aSkipWS && this.mToken.isWhiteSpace() || aSkipComment && this.mToken.isComment())) {
				this.mToken = this.mScanner.nextToken();
			}return this.mToken;
		}, lookAhead: function lookAhead(aSkipWS, aSkipComment) {
			var preservedToken = this.mToken;this.mScanner.preserveState();var token = this.getToken(aSkipWS, aSkipComment);this.mScanner.restoreState();this.mToken = preservedToken;return token;
		}, ungetToken: function ungetToken() {
			this.mLookAhead = this.mToken;
		}, addUnknownAtRule: function addUnknownAtRule(aSheet, aString) {
			var currentLine = CountLF(this.mScanner.getAlreadyScanned());var blocks = [];var token = this.getToken(false, false);while (token.isNotNull()) {
				aString += token.value;if (token.isSymbol(";") && !blocks.length) break;else if (token.isSymbol("{") || token.isSymbol("(") || token.isSymbol("[") || token.type == "function") {
					blocks.push(token.isFunction() ? "(" : token.value);
				} else if (token.isSymbol("}") || token.isSymbol(")") || token.isSymbol("]")) {
					if (blocks.length) {
						var ontop = blocks[blocks.length - 1];if (token.isSymbol("}") && ontop == "{" || token.isSymbol(")") && ontop == "(" || token.isSymbol("]") && ontop == "[") {
							blocks.pop();if (!blocks.length && token.isSymbol("}")) break;
						}
					}
				}token = this.getToken(false, false);
			}this.addUnknownRule(aSheet, aString, currentLine);
		}, addUnknownRule: function addUnknownRule(aSheet, aString, aCurrentLine) {
			var errorMsg = this.consumeError();var rule = new jscsspErrorRule(errorMsg);rule.currentLine = aCurrentLine;rule.parsedCssText = aString;rule.parentStyleSheet = aSheet;aSheet.cssRules.push(rule);
		}, addWhitespace: function addWhitespace(aSheet, aString) {
			var rule = new jscsspWhitespace();rule.parsedCssText = aString;rule.parentStyleSheet = aSheet;aSheet.cssRules.push(rule);
		}, addComment: function addComment(aSheet, aString) {
			var rule = new jscsspComment();rule.parsedCssText = aString;rule.parentStyleSheet = aSheet;aSheet.cssRules.push(rule);
		}, parseCharsetRule: function parseCharsetRule(aToken, aSheet) {
			var s = aToken.value;var token = this.getToken(false, false);s += token.value;if (token.isWhiteSpace(" ")) {
				token = this.getToken(false, false);s += token.value;if (token.isString()) {
					var encoding = token.value;token = this.getToken(false, false);s += token.value;if (token.isSymbol(";")) {
						var rule = new jscsspCharsetRule();rule.encoding = encoding;rule.parsedCssText = s;rule.parentStyleSheet = aSheet;aSheet.cssRules.push(rule);return true;
					} else this.reportError(kCHARSET_RULE_MISSING_SEMICOLON);
				} else this.reportError(kCHARSET_RULE_CHARSET_IS_STRING);
			} else this.reportError(kCHARSET_RULE_MISSING_WS);this.addUnknownAtRule(aSheet, s);return false;
		}, parseImportRule: function parseImportRule(aToken, aSheet) {
			var currentLine = CountLF(this.mScanner.getAlreadyScanned());var s = aToken.value;this.preserveState();var token = this.getToken(true, true);var media = [];var href = "";if (token.isString()) {
				href = token.value;s += " " + href;
			} else if (token.isFunction("url(")) {
				token = this.getToken(true, true);var urlContent = this.parseURL(token);if (urlContent) {
					href = "url(" + urlContent;s += " " + href;
				}
			} else this.reportError(kIMPORT_RULE_MISSING_URL);if (href) {
				token = this.getToken(true, true);while (token.isIdent()) {
					s += " " + token.value;media.push(token.value);token = this.getToken(true, true);if (!token) break;if (token.isSymbol(",")) {
						s += ",";
					} else if (token.isSymbol(";")) {
						break;
					} else break;token = this.getToken(true, true);
				}if (!media.length) {
					media.push("all");
				}if (token.isSymbol(";")) {
					s += ";";this.forgetState();var rule = new jscsspImportRule();rule.currentLine = currentLine;rule.parsedCssText = s;rule.href = href;rule.media = media;rule.parentStyleSheet = aSheet;aSheet.cssRules.push(rule);return true;
				}
			}this.restoreState();this.addUnknownAtRule(aSheet, "@import");return false;
		}, parseVariablesRule: function parseVariablesRule(token, aSheet) {
			var currentLine = CountLF(this.mScanner.getAlreadyScanned());var s = token.value;var declarations = [];var valid = false;this.preserveState();token = this.getToken(true, true);var media = [];var foundMedia = false;while (token.isNotNull()) {
				if (token.isIdent()) {
					foundMedia = true;s += " " + token.value;media.push(token.value);token = this.getToken(true, true);if (token.isSymbol(",")) {
						s += ",";
					} else {
						if (token.isSymbol("{")) this.ungetToken();else {
							token.type = jscsspToken.NULL_TYPE;break;
						}
					}
				} else if (token.isSymbol("{")) break;else if (foundMedia) {
					token.type = jscsspToken.NULL_TYPE;break;
				}token = this.getToken(true, true);
			}if (token.isSymbol("{")) {
				s += " {";token = this.getToken(true, true);while (true) {
					if (!token.isNotNull()) {
						valid = true;break;
					}if (token.isSymbol("}")) {
						s += "}";valid = true;break;
					} else {
						var d = this.parseDeclaration(token, declarations, true, false, aSheet);s += (d && declarations.length ? " " : "") + d;
					}token = this.getToken(true, false);
				}
			}if (valid) {
				this.forgetState();var rule = new jscsspVariablesRule();rule.currentLine = currentLine;rule.parsedCssText = s;rule.declarations = declarations;rule.media = media;rule.parentStyleSheet = aSheet;aSheet.cssRules.push(rule);return true;
			}this.restoreState();return false;
		}, parseNamespaceRule: function parseNamespaceRule(aToken, aSheet) {
			var currentLine = CountLF(this.mScanner.getAlreadyScanned());var s = aToken.value;var valid = false;this.preserveState();var token = this.getToken(true, true);if (token.isNotNull()) {
				var prefix = "";var url = "";if (token.isIdent()) {
					prefix = token.value;s += " " + prefix;token = this.getToken(true, true);
				}if (token) {
					var foundURL = false;if (token.isString()) {
						foundURL = true;url = token.value;s += " " + url;
					} else if (token.isFunction("url(")) {
						token = this.getToken(true, true);var urlContent = this.parseURL(token);if (urlContent) {
							url += "url(" + urlContent;foundURL = true;s += " " + urlContent;
						}
					}
				}if (foundURL) {
					token = this.getToken(true, true);if (token.isSymbol(";")) {
						s += ";";this.forgetState();var rule = new jscsspNamespaceRule();rule.currentLine = currentLine;rule.parsedCssText = s;rule.prefix = prefix;rule.url = url;rule.parentStyleSheet = aSheet;aSheet.cssRules.push(rule);return true;
					}
				}
			}this.restoreState();this.addUnknownAtRule(aSheet, "@namespace");return false;
		}, parseFontFaceRule: function parseFontFaceRule(aToken, aSheet) {
			var currentLine = CountLF(this.mScanner.getAlreadyScanned());var s = aToken.value;var valid = false;var descriptors = [];this.preserveState();var token = this.getToken(true, true);if (token.isNotNull()) {
				if (token.isSymbol("{")) {
					s += " " + token.value;var token = this.getToken(true, false);while (true) {
						if (token.isSymbol("}")) {
							s += "}";valid = true;break;
						} else {
							var d = this.parseDeclaration(token, descriptors, false, false, aSheet);s += (d && descriptors.length ? " " : "") + d;
						}token = this.getToken(true, false);
					}
				}
			}if (valid) {
				this.forgetState();var rule = new jscsspFontFaceRule();rule.currentLine = currentLine;rule.parsedCssText = s;rule.descriptors = descriptors;rule.parentStyleSheet = aSheet;aSheet.cssRules.push(rule);return true;
			}this.restoreState();return false;
		}, parsePageRule: function parsePageRule(aToken, aSheet) {
			var currentLine = CountLF(this.mScanner.getAlreadyScanned());var s = aToken.value;var valid = false;var declarations = [];this.preserveState();var token = this.getToken(true, true);var pageSelector = "";if (token.isSymbol(":") || token.isIdent()) {
				if (token.isSymbol(":")) {
					pageSelector = ":";token = this.getToken(false, false);
				}if (token.isIdent()) {
					pageSelector += token.value;s += " " + pageSelector;token = this.getToken(true, true);
				}
			}if (token.isNotNull()) {
				if (token.isSymbol("{")) {
					s += " " + token.value;var token = this.getToken(true, false);while (true) {
						if (token.isSymbol("}")) {
							s += "}";valid = true;break;
						} else {
							var d = this.parseDeclaration(token, declarations, true, true, aSheet);s += (d && declarations.length ? " " : "") + d;
						}token = this.getToken(true, false);
					}
				}
			}if (valid) {
				this.forgetState();var rule = new jscsspPageRule();rule.currentLine = currentLine;rule.parsedCssText = s;rule.pageSelector = pageSelector;rule.declarations = declarations;rule.parentStyleSheet = aSheet;aSheet.cssRules.push(rule);return true;
			}this.restoreState();return false;
		}, parseDefaultPropertyValue: function parseDefaultPropertyValue(token, aDecl, aAcceptPriority, descriptor, aSheet) {
			var valueText = "";var blocks = [];var foundPriority = false;var values = [];while (token.isNotNull()) {
				if ((token.isSymbol(";") || token.isSymbol("}") || token.isSymbol("!")) && !blocks.length) {
					if (token.isSymbol("}")) this.ungetToken();break;
				}if (token.isIdent(this.kINHERIT)) {
					if (values.length) {
						return "";
					} else {
						valueText = this.kINHERIT;var value = new jscsspVariable(kJscsspINHERIT_VALUE, aSheet);values.push(value);token = this.getToken(true, true);break;
					}
				} else if (token.isSymbol("{") || token.isSymbol("(") || token.isSymbol("[")) {
					blocks.push(token.value);
				} else if (token.isSymbol("}") || token.isSymbol("]")) {
					if (blocks.length) {
						var ontop = blocks[blocks.length - 1];if (token.isSymbol("}") && ontop == "{" || token.isSymbol(")") && ontop == "(" || token.isSymbol("]") && ontop == "[") {
							blocks.pop();
						}
					}
				}if (token.isFunction()) {
					if (token.isFunction("var(")) {
						token = this.getToken(true, true);if (token.isIdent()) {
							var name = token.value;token = this.getToken(true, true);if (token.isSymbol(")")) {
								var value = new jscsspVariable(kJscsspVARIABLE_VALUE, aSheet);valueText += "var(" + name + ")";value.name = name;values.push(value);
							} else return "";
						} else return "";
					} else {
						var fn = token.value;token = this.getToken(false, true);var arg = this.parseFunctionArgument(token);if (arg) {
							valueText += fn + arg;var value = new jscsspVariable(kJscsspPRIMITIVE_VALUE, aSheet);value.value = fn + arg;values.push(value);
						} else return "";
					}
				} else if (token.isSymbol("#")) {
					var color = this.parseColor(token);if (color) {
						valueText += color;var value = new jscsspVariable(kJscsspPRIMITIVE_VALUE, aSheet);value.value = color;values.push(value);
					} else return "";
				} else if (!token.isWhiteSpace() && !token.isSymbol(",")) {
					var value = new jscsspVariable(kJscsspPRIMITIVE_VALUE, aSheet);value.value = token.value;values.push(value);valueText += token.value;
				} else valueText += token.value;token = this.getToken(false, true);
			}if (values.length && valueText) {
				this.forgetState();aDecl.push(this._createJscsspDeclarationFromValuesArray(descriptor, values, valueText));return valueText;
			}return "";
		}, parseMarginOrPaddingShorthand: function parseMarginOrPaddingShorthand(token, aDecl, aAcceptPriority, aProperty) {
			var top = null;var bottom = null;var left = null;var right = null;var values = [];while (true) {
				if (!token.isNotNull()) break;if (token.isSymbol(";") || aAcceptPriority && token.isSymbol("!") || token.isSymbol("}")) {
					if (token.isSymbol("}")) this.ungetToken();break;
				} else if (!values.length && token.isIdent(this.kINHERIT)) {
					values.push(token.value);token = this.getToken(true, true);break;
				} else if (token.isDimension() || token.isNumber("0") || token.isPercentage() || token.isIdent("auto")) {
					values.push(token.value);
				} else return "";token = this.getToken(true, true);
			}var count = values.length;switch (count) {case 1:
					top = values[0];bottom = top;left = top;right = top;break;case 2:
					top = values[0];bottom = top;left = values[1];right = left;break;case 3:
					top = values[0];left = values[1];right = left;bottom = values[2];break;case 4:
					top = values[0];right = values[1];bottom = values[2];left = values[3];break;default:
					return "";}this.forgetState();aDecl.push(this._createJscsspDeclarationFromValue(aProperty + "-top", top));aDecl.push(this._createJscsspDeclarationFromValue(aProperty + "-right", right));aDecl.push(this._createJscsspDeclarationFromValue(aProperty + "-bottom", bottom));aDecl.push(this._createJscsspDeclarationFromValue(aProperty + "-left", left));return top + " " + right + " " + bottom + " " + left;
		}, parseBorderColorShorthand: function parseBorderColorShorthand(token, aDecl, aAcceptPriority) {
			var top = null;var bottom = null;var left = null;var right = null;var values = [];while (true) {
				if (!token.isNotNull()) break;if (token.isSymbol(";") || aAcceptPriority && token.isSymbol("!") || token.isSymbol("}")) {
					if (token.isSymbol("}")) this.ungetToken();break;
				} else if (!values.length && token.isIdent(this.kINHERIT)) {
					values.push(token.value);token = this.getToken(true, true);break;
				} else {
					var color = this.parseColor(token);if (color) values.push(color);else return "";
				}token = this.getToken(true, true);
			}var count = values.length;switch (count) {case 1:
					top = values[0];bottom = top;left = top;right = top;break;case 2:
					top = values[0];bottom = top;left = values[1];right = left;break;case 3:
					top = values[0];left = values[1];right = left;bottom = values[2];break;case 4:
					top = values[0];right = values[1];bottom = values[2];left = values[3];break;default:
					return "";}this.forgetState();aDecl.push(this._createJscsspDeclarationFromValue("border-top-color", top));aDecl.push(this._createJscsspDeclarationFromValue("border-right-color", right));aDecl.push(this._createJscsspDeclarationFromValue("border-bottom-color", bottom));aDecl.push(this._createJscsspDeclarationFromValue("border-left-color", left));return top + " " + right + " " + bottom + " " + left;
		}, parseCueShorthand: function parseCueShorthand(token, declarations, aAcceptPriority) {
			var before = "";var after = "";var values = [];var values = [];while (true) {
				if (!token.isNotNull()) break;if (token.isSymbol(";") || aAcceptPriority && token.isSymbol("!") || token.isSymbol("}")) {
					if (token.isSymbol("}")) this.ungetToken();break;
				} else if (!values.length && token.isIdent(this.kINHERIT)) {
					values.push(token.value);
				} else if (token.isIdent("none")) values.push(token.value);else if (token.isFunction("url(")) {
					var token = this.getToken(true, true);var urlContent = this.parseURL(token);if (urlContent) values.push("url(" + urlContent);else return "";
				} else return "";token = this.getToken(true, true);
			}var count = values.length;switch (count) {case 1:
					before = values[0];after = before;break;case 2:
					before = values[0];after = values[1];break;default:
					return "";}this.forgetState();aDecl.push(this._createJscsspDeclarationFromValue("cue-before", before));aDecl.push(this._createJscsspDeclarationFromValue("cue-after", after));return before + " " + after;
		}, parsePauseShorthand: function parsePauseShorthand(token, declarations, aAcceptPriority) {
			var before = "";var after = "";var values = [];var values = [];while (true) {
				if (!token.isNotNull()) break;if (token.isSymbol(";") || aAcceptPriority && token.isSymbol("!") || token.isSymbol("}")) {
					if (token.isSymbol("}")) this.ungetToken();break;
				} else if (!values.length && token.isIdent(this.kINHERIT)) {
					values.push(token.value);
				} else if (token.isDimensionOfUnit("ms") || token.isDimensionOfUnit("s") || token.isPercentage() || token.isNumber("0")) values.push(token.value);else return "";token = this.getToken(true, true);
			}var count = values.length;switch (count) {case 1:
					before = values[0];after = before;break;case 2:
					before = values[0];after = values[1];break;default:
					return "";}this.forgetState();aDecl.push(this._createJscsspDeclarationFromValue("pause-before", before));aDecl.push(this._createJscsspDeclarationFromValue("pause-after", after));return before + " " + after;
		}, parseBorderWidthShorthand: function parseBorderWidthShorthand(token, aDecl, aAcceptPriority) {
			var top = null;var bottom = null;var left = null;var right = null;var values = [];while (true) {
				if (!token.isNotNull()) break;if (token.isSymbol(";") || aAcceptPriority && token.isSymbol("!") || token.isSymbol("}")) {
					if (token.isSymbol("}")) this.ungetToken();break;
				} else if (!values.length && token.isIdent(this.kINHERIT)) {
					values.push(token.value);
				} else if (token.isDimension() || token.isNumber("0") || token.isIdent() && token.value in this.kBORDER_WIDTH_NAMES) {
					values.push(token.value);
				} else return "";token = this.getToken(true, true);
			}var count = values.length;switch (count) {case 1:
					top = values[0];bottom = top;left = top;right = top;break;case 2:
					top = values[0];bottom = top;left = values[1];right = left;break;case 3:
					top = values[0];left = values[1];right = left;bottom = values[2];break;case 4:
					top = values[0];right = values[1];bottom = values[2];left = values[3];break;default:
					return "";}this.forgetState();aDecl.push(this._createJscsspDeclarationFromValue("border-top-width", top));aDecl.push(this._createJscsspDeclarationFromValue("border-right-width", right));aDecl.push(this._createJscsspDeclarationFromValue("border-bottom-width", bottom));aDecl.push(this._createJscsspDeclarationFromValue("border-left-width", left));return top + " " + right + " " + bottom + " " + left;
		}, parseBorderStyleShorthand: function parseBorderStyleShorthand(token, aDecl, aAcceptPriority) {
			var top = null;var bottom = null;var left = null;var right = null;var values = [];while (true) {
				if (!token.isNotNull()) break;if (token.isSymbol(";") || aAcceptPriority && token.isSymbol("!") || token.isSymbol("}")) {
					if (token.isSymbol("}")) this.ungetToken();break;
				} else if (!values.length && token.isIdent(this.kINHERIT)) {
					values.push(token.value);
				} else if (token.isIdent() && token.value in this.kBORDER_STYLE_NAMES) {
					values.push(token.value);
				} else return "";token = this.getToken(true, true);
			}var count = values.length;switch (count) {case 1:
					top = values[0];bottom = top;left = top;right = top;break;case 2:
					top = values[0];bottom = top;left = values[1];right = left;break;case 3:
					top = values[0];left = values[1];right = left;bottom = values[2];break;case 4:
					top = values[0];right = values[1];bottom = values[2];left = values[3];break;default:
					return "";}this.forgetState();aDecl.push(this._createJscsspDeclarationFromValue("border-top-style", top));aDecl.push(this._createJscsspDeclarationFromValue("border-right-style", right));aDecl.push(this._createJscsspDeclarationFromValue("border-bottom-style", bottom));aDecl.push(this._createJscsspDeclarationFromValue("border-left-style", left));return top + " " + right + " " + bottom + " " + left;
		}, parseBorderEdgeOrOutlineShorthand: function parseBorderEdgeOrOutlineShorthand(token, aDecl, aAcceptPriority, aProperty) {
			var bWidth = null;var bStyle = null;var bColor = null;while (true) {
				if (!token.isNotNull()) break;if (token.isSymbol(";") || aAcceptPriority && token.isSymbol("!") || token.isSymbol("}")) {
					if (token.isSymbol("}")) this.ungetToken();break;
				} else if (!bWidth && !bStyle && !bColor && token.isIdent(this.kINHERIT)) {
					bWidth = this.kINHERIT;bStyle = this.kINHERIT;bColor = this.kINHERIT;
				} else if (!bWidth && (token.isDimension() || token.isIdent() && token.value in this.kBORDER_WIDTH_NAMES || token.isNumber("0"))) {
					bWidth = token.value;
				} else if (!bStyle && token.isIdent() && token.value in this.kBORDER_STYLE_NAMES) {
					bStyle = token.value;
				} else {
					var color = aProperty == "outline" && token.isIdent("invert") ? "invert" : this.parseColor(token);if (!bColor && color) bColor = color;else return "";
				}token = this.getToken(true, true);
			}this.forgetState();bWidth = bWidth ? bWidth : "medium";bStyle = bStyle ? bStyle : "none";bColor = bColor ? bColor : "-moz-initial";function addPropertyToDecl(aSelf, aDecl, property, w, s, c) {
				aDecl.push(aSelf._createJscsspDeclarationFromValue(property + "-width", w));aDecl.push(aSelf._createJscsspDeclarationFromValue(property + "-style", s));aDecl.push(aSelf._createJscsspDeclarationFromValue(property + "-color", c));
			}if (aProperty == "border") {
				addPropertyToDecl(this, aDecl, "border-top", bWidth, bStyle, bColor);addPropertyToDecl(this, aDecl, "border-right", bWidth, bStyle, bColor);addPropertyToDecl(this, aDecl, "border-bottom", bWidth, bStyle, bColor);addPropertyToDecl(this, aDecl, "border-left", bWidth, bStyle, bColor);
			} else addPropertyToDecl(this, aDecl, aProperty, bWidth, bStyle, bColor);return bWidth + " " + bStyle + " " + bColor;
		}, parseBackgroundShorthand: function parseBackgroundShorthand(token, aDecl, aAcceptPriority) {
			var kHPos = { "left": true, "right": true };var kVPos = { "top": true, "bottom": true };var kPos = { "left": true, "right": true, "top": true, "bottom": true, "center": true };var bgColor = null;var bgRepeat = null;var bgAttachment = null;var bgImage = null;var bgPosition = null;while (true) {
				if (!token.isNotNull()) break;if (token.isSymbol(";") || aAcceptPriority && token.isSymbol("!") || token.isSymbol("}")) {
					if (token.isSymbol("}")) this.ungetToken();break;
				} else if (!bgColor && !bgRepeat && !bgAttachment && !bgImage && !bgPosition && token.isIdent(this.kINHERIT)) {
					bgColor = this.kINHERIT;bgRepeat = this.kINHERIT;bgAttachment = this.kINHERIT;bgImage = this.kINHERIT;bgPosition = this.kINHERIT;
				} else {
					if (!bgAttachment && (token.isIdent("scroll") || token.isIdent("fixed"))) {
						bgAttachment = token.value;
					} else if (!bgPosition && (token.isIdent() && token.value in kPos || token.isDimension() || token.isNumber("0") || token.isPercentage())) {
						bgPosition = token.value;token = this.getToken(true, true);if (token.isDimension() || token.isNumber("0") || token.isPercentage()) {
							bgPosition += " " + token.value;
						} else if (token.isIdent() && token.value in kPos) {
							if (bgPosition in kHPos && token.value in kHPos || bgPosition in kVPos && token.value in kVPos) return "";bgPosition += " " + token.value;
						} else {
							this.ungetToken();bgPosition += " center";
						}
					} else if (!bgRepeat && (token.isIdent("repeat") || token.isIdent("repeat-x") || token.isIdent("repeat-y") || token.isIdent("no-repeat"))) {
						bgRepeat = token.value;
					} else if (!bgImage && (token.isFunction("url(") || token.isIdent("none"))) {
						bgImage = token.value;if (token.isFunction("url(")) {
							token = this.getToken(true, true);var url = this.parseURL(token);if (url) bgImage += url;else return "";
						}
					} else if (!bgImage && (token.isFunction("-moz-linear-gradient(") || token.isFunction("-moz-radial-gradient(") || token.isFunction("-moz-repeating-linear-gradient(") || token.isFunction("-moz-repeating-radial-gradient("))) {
						var gradient = CssInspector.parseGradient(this, token);if (gradient) bgImage = CssInspector.serializeGradient(gradient);else return "";
					} else {
						var color = this.parseColor(token);if (!bgColor && color) bgColor = color;else return "";
					}
				}token = this.getToken(true, true);
			}this.forgetState();bgColor = bgColor ? bgColor : "transparent";bgImage = bgImage ? bgImage : "none";bgRepeat = bgRepeat ? bgRepeat : "repeat";bgAttachment = bgAttachment ? bgAttachment : "scroll";bgPosition = bgPosition ? bgPosition : "top left";aDecl.push(this._createJscsspDeclarationFromValue("background-color", bgColor));aDecl.push(this._createJscsspDeclarationFromValue("background-image", bgImage));aDecl.push(this._createJscsspDeclarationFromValue("background-repeat", bgRepeat));aDecl.push(this._createJscsspDeclarationFromValue("background-attachment", bgAttachment));aDecl.push(this._createJscsspDeclarationFromValue("background-position", bgPosition));return bgColor + " " + bgImage + " " + bgRepeat + " " + bgAttachment + " " + bgPosition;
		}, parseListStyleShorthand: function parseListStyleShorthand(token, aDecl, aAcceptPriority) {
			var kPosition = { "inside": true, "outside": true };var lType = null;var lPosition = null;var lImage = null;while (true) {
				if (!token.isNotNull()) break;if (token.isSymbol(";") || aAcceptPriority && token.isSymbol("!") || token.isSymbol("}")) {
					if (token.isSymbol("}")) this.ungetToken();break;
				} else if (!lType && !lPosition && !lImage && token.isIdent(this.kINHERIT)) {
					lType = this.kINHERIT;lPosition = this.kINHERIT;lImage = this.kINHERIT;
				} else if (!lType && token.isIdent() && token.value in this.kLIST_STYLE_TYPE_NAMES) {
					lType = token.value;
				} else if (!lPosition && token.isIdent() && token.value in kPosition) {
					lPosition = token.value;
				} else if (!lImage && token.isFunction("url")) {
					token = this.getToken(true, true);var urlContent = this.parseURL(token);if (urlContent) {
						lImage = "url(" + urlContent;
					} else return "";
				} else if (!token.isIdent("none")) return "";token = this.getToken(true, true);
			}this.forgetState();lType = lType ? lType : "none";lImage = lImage ? lImage : "none";lPosition = lPosition ? lPosition : "outside";aDecl.push(this._createJscsspDeclarationFromValue("list-style-type", lType));aDecl.push(this._createJscsspDeclarationFromValue("list-style-position", lPosition));aDecl.push(this._createJscsspDeclarationFromValue("list-style-image", lImage));return lType + " " + lPosition + " " + lImage;
		}, parseFontShorthand: function parseFontShorthand(token, aDecl, aAcceptPriority) {
			var kStyle = { "italic": true, "oblique": true };var kVariant = { "small-caps": true };var kWeight = { "bold": true, "bolder": true, "lighter": true, "100": true, "200": true, "300": true, "400": true, "500": true, "600": true, "700": true, "800": true, "900": true };var kSize = { "xx-small": true, "x-small": true, "small": true, "medium": true, "large": true, "x-large": true, "xx-large": true, "larger": true, "smaller": true };var kValues = { "caption": true, "icon": true, "menu": true, "message-box": true, "small-caption": true, "status-bar": true };var kFamily = { "serif": true, "sans-serif": true, "cursive": true, "fantasy": true, "monospace": true };var fStyle = null;var fVariant = null;var fWeight = null;var fSize = null;var fLineHeight = null;var fFamily = "";var fSystem = null;var fFamilyValues = [];var normalCount = 0;while (true) {
				if (!token.isNotNull()) break;if (token.isSymbol(";") || aAcceptPriority && token.isSymbol("!") || token.isSymbol("}")) {
					if (token.isSymbol("}")) this.ungetToken();break;
				} else if (!fStyle && !fVariant && !fWeight && !fSize && !fLineHeight && !fFamily && !fSystem && token.isIdent(this.kINHERIT)) {
					fStyle = this.kINHERIT;fVariant = this.kINHERIT;fWeight = this.kINHERIT;fSize = this.kINHERIT;fLineHeight = this.kINHERIT;fFamily = this.kINHERIT;fSystem = this.kINHERIT;
				} else {
					if (!fSystem && token.isIdent() && token.value in kValues) {
						fSystem = token.value;break;
					} else {
						if (!fStyle && token.isIdent() && token.value in kStyle) {
							fStyle = token.value;
						} else if (!fVariant && token.isIdent() && token.value in kVariant) {
							fVariant = token.value;
						} else if (!fWeight && (token.isIdent() || token.isNumber()) && token.value in kWeight) {
							fWeight = token.value;
						} else if (!fSize && (token.isIdent() && token.value in kSize || token.isDimension() || token.isPercentage())) {
							fSize = token.value;var token = this.getToken(false, false);if (token.isSymbol("/")) {
								token = this.getToken(false, false);if (!fLineHeight && (token.isDimension() || token.isNumber() || token.isPercentage())) {
									fLineHeight = token.value;
								} else return "";
							} else this.ungetToken();
						} else if (token.isIdent("normal")) {
							normalCount++;if (normalCount > 3) return "";
						} else if (!fFamily && (token.isString() || token.isIdent())) {
							var lastWasComma = false;while (true) {
								if (!token.isNotNull()) break;else if (token.isSymbol(";") || aAcceptPriority && token.isSymbol("!") || token.isSymbol("}")) {
									this.ungetToken();break;
								} else if (token.isIdent() && token.value in kFamily) {
									var value = new jscsspVariable(kJscsspPRIMITIVE_VALUE, null);value.value = token.value;fFamilyValues.push(value);fFamily += token.value;break;
								} else if (token.isString() || token.isIdent()) {
									var value = new jscsspVariable(kJscsspPRIMITIVE_VALUE, null);value.value = token.value;fFamilyValues.push(value);fFamily += token.value;lastWasComma = false;
								} else if (!lastWasComma && token.isSymbol(",")) {
									fFamily += ", ";lastWasComma = true;
								} else return "";token = this.getToken(true, true);
							}
						} else {
							return "";
						}
					}
				}token = this.getToken(true, true);
			}this.forgetState();if (fSystem) {
				aDecl.push(this._createJscsspDeclarationFromValue("font", fSystem));return fSystem;
			}fStyle = fStyle ? fStyle : "normal";fVariant = fVariant ? fVariant : "normal";fWeight = fWeight ? fWeight : "normal";fSize = fSize ? fSize : "medium";fLineHeight = fLineHeight ? fLineHeight : "normal";fFamily = fFamily ? fFamily : "-moz-initial";aDecl.push(this._createJscsspDeclarationFromValue("font-style", fStyle));aDecl.push(this._createJscsspDeclarationFromValue("font-variant", fVariant));aDecl.push(this._createJscsspDeclarationFromValue("font-weight", fWeight));aDecl.push(this._createJscsspDeclarationFromValue("font-size", fSize));aDecl.push(this._createJscsspDeclarationFromValue("line-height", fLineHeight));aDecl.push(this._createJscsspDeclarationFromValuesArray("font-family", fFamilyValues, fFamily));return fStyle + " " + fVariant + " " + fWeight + " " + fSize + "/" + fLineHeight + " " + fFamily;
		}, _createJscsspDeclaration: function _createJscsspDeclaration(property, value) {
			var decl = new jscsspDeclaration();decl.property = property;decl.value = this.trim11(value);decl.parsedCssText = property + ": " + value + ";";return decl;
		}, _createJscsspDeclarationFromValue: function _createJscsspDeclarationFromValue(property, valueText) {
			var decl = new jscsspDeclaration();decl.property = property;var value = new jscsspVariable(kJscsspPRIMITIVE_VALUE, null);value.value = valueText;decl.values = [value];decl.valueText = valueText;decl.parsedCssText = property + ": " + valueText + ";";return decl;
		}, _createJscsspDeclarationFromValuesArray: function _createJscsspDeclarationFromValuesArray(property, values, valueText) {
			var decl = new jscsspDeclaration();decl.property = property;decl.values = values;decl.valueText = valueText;decl.parsedCssText = property + ": " + valueText + ";";return decl;
		}, parseURL: function parseURL(token) {
			var value = "";if (token.isString()) {
				value += token.value;token = this.getToken(true, true);
			} else while (true) {
				if (!token.isNotNull()) {
					this.reportError(kURL_EOF);return "";
				}if (token.isWhiteSpace()) {
					nextToken = this.lookAhead(true, true);if (!nextToken.isSymbol(")")) {
						this.reportError(kURL_WS_INSIDE);token = this.currentToken();break;
					}
				}if (token.isSymbol(")")) {
					break;
				}value += token.value;token = this.getToken(false, false);
			}if (token.isSymbol(")")) {
				return value + ")";
			}return "";
		}, parseFunctionArgument: function parseFunctionArgument(token) {
			var value = "";if (token.isString()) {
				value += token.value;token = this.getToken(true, true);
			} else {
				var parenthesis = 1;while (true) {
					if (!token.isNotNull()) return "";if (token.isFunction() || token.isSymbol("(")) parenthesis++;if (token.isSymbol(")")) {
						parenthesis--;if (!parenthesis) break;
					}value += token.value;token = this.getToken(false, false);
				}
			}if (token.isSymbol(")")) return value + ")";return "";
		}, parseColor: function parseColor(token) {
			var color = "";if (token.isFunction("rgb(") || token.isFunction("rgba(")) {
				color = token.value;var isRgba = token.isFunction("rgba(");token = this.getToken(true, true);if (!token.isNumber() && !token.isPercentage()) return "";color += token.value;token = this.getToken(true, true);if (!token.isSymbol(",")) return "";color += ", ";token = this.getToken(true, true);if (!token.isNumber() && !token.isPercentage()) return "";color += token.value;token = this.getToken(true, true);if (!token.isSymbol(",")) return "";color += ", ";token = this.getToken(true, true);if (!token.isNumber() && !token.isPercentage()) return "";color += token.value;if (isRgba) {
					token = this.getToken(true, true);if (!token.isSymbol(",")) return "";color += ", ";token = this.getToken(true, true);if (!token.isNumber()) return "";color += token.value;
				}token = this.getToken(true, true);if (!token.isSymbol(")")) return "";color += token.value;
			} else if (token.isFunction("hsl(") || token.isFunction("hsla(")) {
				color = token.value;var isHsla = token.isFunction("hsla(");token = this.getToken(true, true);if (!token.isNumber()) return "";color += token.value;token = this.getToken(true, true);if (!token.isSymbol(",")) return "";color += ", ";token = this.getToken(true, true);if (!token.isPercentage()) return "";color += token.value;token = this.getToken(true, true);if (!token.isSymbol(",")) return "";color += ", ";token = this.getToken(true, true);if (!token.isPercentage()) return "";color += token.value;if (isHsla) {
					token = this.getToken(true, true);if (!token.isSymbol(",")) return "";color += ", ";token = this.getToken(true, true);if (!token.isNumber()) return "";color += token.value;
				}token = this.getToken(true, true);if (!token.isSymbol(")")) return "";color += token.value;
			} else if (token.isIdent() && token.value in this.kCOLOR_NAMES) color = token.value;else if (token.isSymbol("#")) {
				token = this.getHexValue();if (!token.isHex()) return "";var length = token.value.length;if (length != 3 && length != 6) return "";if (token.value.match(/[a-fA-F0-9]/g).length != length) return "";color = "#" + token.value;
			}return color;
		}, parseDeclaration: function parseDeclaration(aToken, aDecl, aAcceptPriority, aExpandShorthands, aSheet) {
			this.preserveState();var blocks = [];if (aToken.isIdent()) {
				var descriptor = aToken.value.toLowerCase();var token = this.getToken(true, true);if (token.isSymbol(":")) {
					var token = this.getToken(true, true);var value = "";var declarations = [];if (aExpandShorthands) switch (descriptor) {case "background":
							value = this.parseBackgroundShorthand(token, declarations, aAcceptPriority);break;case "margin":case "padding":
							value = this.parseMarginOrPaddingShorthand(token, declarations, aAcceptPriority, descriptor);break;case "border-color":
							value = this.parseBorderColorShorthand(token, declarations, aAcceptPriority);break;case "border-style":
							value = this.parseBorderStyleShorthand(token, declarations, aAcceptPriority);break;case "border-width":
							value = this.parseBorderWidthShorthand(token, declarations, aAcceptPriority);break;case "border-top":case "border-right":case "border-bottom":case "border-left":case "border":case "outline":
							value = this.parseBorderEdgeOrOutlineShorthand(token, declarations, aAcceptPriority, descriptor);break;case "cue":
							value = this.parseCueShorthand(token, declarations, aAcceptPriority);break;case "pause":
							value = this.parsePauseShorthand(token, declarations, aAcceptPriority);break;case "font":
							value = this.parseFontShorthand(token, declarations, aAcceptPriority);break;case "list-style":
							value = this.parseListStyleShorthand(token, declarations, aAcceptPriority);break;default:
							value = this.parseDefaultPropertyValue(token, declarations, aAcceptPriority, descriptor, aSheet);break;} else value = this.parseDefaultPropertyValue(token, declarations, aAcceptPriority, descriptor, aSheet);token = this.currentToken();if (value) {
						var priority = false;if (token.isSymbol("!")) {
							token = this.getToken(true, true);if (token.isIdent("important")) {
								priority = true;token = this.getToken(true, true);if (token.isSymbol(";") || token.isSymbol("}")) {
									if (token.isSymbol("}")) this.ungetToken();
								} else return "";
							} else return "";
						} else if (token.isNotNull() && !token.isSymbol(";") && !token.isSymbol("}")) return "";for (var i = 0; i < declarations.length; i++) {
							declarations[i].priority = priority;aDecl.push(declarations[i]);
						}return descriptor + ": " + value + ";";
					}
				}
			} else if (aToken.isComment()) {
				if (this.mPreserveComments) {
					this.forgetState();var comment = new jscsspComment();comment.parsedCssText = aToken.value;aDecl.push(comment);
				}return aToken.value;
			}this.restoreState();var s = aToken.value;blocks = [];var token = this.getToken(false, false);while (token.isNotNull()) {
				s += token.value;if ((token.isSymbol(";") || token.isSymbol("}")) && !blocks.length) {
					if (token.isSymbol("}")) this.ungetToken();break;
				} else if (token.isSymbol("{") || token.isSymbol("(") || token.isSymbol("[") || token.isFunction()) {
					blocks.push(token.isFunction() ? "(" : token.value);
				} else if (token.isSymbol("}") || token.isSymbol(")") || token.isSymbol("]")) {
					if (blocks.length) {
						var ontop = blocks[blocks.length - 1];if (token.isSymbol("}") && ontop == "{" || token.isSymbol(")") && ontop == "(" || token.isSymbol("]") && ontop == "[") {
							blocks.pop();
						}
					}
				}token = this.getToken(false, false);
			}return "";
		}, parseKeyframesRule: function parseKeyframesRule(aToken, aSheet) {
			var currentLine = CountLF(this.mScanner.getAlreadyScanned());var s = aToken.value;var valid = false;var keyframesRule = new jscsspKeyframesRule();keyframesRule.currentLine = currentLine;this.preserveState();var token = this.getToken(true, true);var foundName = false;while (token.isNotNull()) {
				if (token.isIdent()) {
					foundName = true;s += " " + token.value;keyframesRule.name = token.value;token = this.getToken(true, true);if (token.isSymbol("{")) this.ungetToken();else {
						token.type = jscsspToken.NULL_TYPE;break;
					}
				} else if (token.isSymbol("{")) {
					if (!foundName) {
						token.type = jscsspToken.NULL_TYPE;
					}break;
				} else {
					token.type = jscsspToken.NULL_TYPE;break;
				}token = this.getToken(true, true);
			}if (token.isSymbol("{") && keyframesRule.name) {
				s += " { ";token = this.getToken(true, false);while (token.isNotNull()) {
					if (token.isComment() && this.mPreserveComments) {
						s += " " + token.value;var comment = new jscsspComment();comment.parsedCssText = token.value;keyframesRule.cssRules.push(comment);
					} else if (token.isSymbol("}")) {
						valid = true;break;
					} else {
						var r = this.parseKeyframeRule(token, keyframesRule, true);if (r) s += r;
					}token = this.getToken(true, false);
				}
			}if (valid) {
				this.forgetState();keyframesRule.currentLine = currentLine;keyframesRule.parsedCssText = s;aSheet.cssRules.push(keyframesRule);return true;
			}this.restoreState();return false;
		}, parseKeyframeRule: function parseKeyframeRule(aToken, aOwner) {
			var currentLine = CountLF(this.mScanner.getAlreadyScanned());this.preserveState();var token = aToken;var key = "";while (token.isNotNull()) {
				if (token.isIdent() || token.isPercentage()) {
					if (token.isIdent() && !token.isIdent("from") && !token.isIdent("to")) {
						key = "";break;
					}key += token.value;token = this.getToken(true, true);if (token.isSymbol("{")) {
						this.ungetToken();break;
					} else if (token.isSymbol(",")) {
						key += ", ";
					} else {
						key = "";break;
					}
				} else {
					key = "";break;
				}token = this.getToken(true, true);
			}var valid = false;var declarations = [];if (key) {
				var s = key;token = this.getToken(true, true);if (token.isSymbol("{")) {
					s += " { ";token = this.getToken(true, false);while (true) {
						if (!token.isNotNull()) {
							valid = true;break;
						}if (token.isSymbol("}")) {
							s += "}";valid = true;break;
						} else {
							var d = this.parseDeclaration(token, declarations, true, true, aOwner);s += (d && declarations.length ? " " : "") + d;
						}token = this.getToken(true, false);
					}
				}
			} else {}if (valid) {
				var rule = new jscsspKeyframeRule();rule.currentLine = currentLine;rule.parsedCssText = s;rule.declarations = declarations;rule.keyText = key;rule.parentRule = aOwner;aOwner.cssRules.push(rule);return s;
			}this.restoreState();s = this.currentToken().value;this.addUnknownAtRule(aOwner, s);return "";
		}, parseMediaRule: function parseMediaRule(aToken, aSheet) {
			var currentLine = CountLF(this.mScanner.getAlreadyScanned());var s = aToken.value;var valid = false;var mediaRule = new jscsspMediaRule();mediaRule.currentLine = currentLine;this.preserveState();var token = this.getToken(true, true);var foundMedia = false;while (token.isNotNull()) {
				if (token.isIdent()) {
					foundMedia = true;s += " " + token.value;mediaRule.media.push(token.value);token = this.getToken(true, true);if (token.isSymbol(",")) {
						s += ",";
					} else {
						if (token.isSymbol("{")) this.ungetToken();else {
							token.type = jscsspToken.NULL_TYPE;break;
						}
					}
				} else if (token.isSymbol("{")) break;else if (foundMedia) {
					token.type = jscsspToken.NULL_TYPE;break;
				}token = this.getToken(true, true);
			}if (token.isSymbol("{") && mediaRule.media.length) {
				s += " { ";token = this.getToken(true, false);while (token.isNotNull()) {
					if (token.isComment() && this.mPreserveComments) {
						s += " " + token.value;var comment = new jscsspComment();comment.parsedCssText = token.value;mediaRule.cssRules.push(comment);
					} else if (token.isSymbol("}")) {
						valid = true;break;
					} else {
						var r = this.parseStyleRule(token, mediaRule, true);if (r) s += r;
					}token = this.getToken(true, false);
				}
			}if (valid) {
				this.forgetState();mediaRule.parsedCssText = s;aSheet.cssRules.push(mediaRule);return true;
			}this.restoreState();return false;
		}, trim11: function trim11(str) {
			str = str.replace(/^\s+/, '');for (var i = str.length - 1; i >= 0; i--) {
				if (/\S/.test(str.charAt(i))) {
					str = str.substring(0, i + 1);break;
				}
			}return str;
		}, parseStyleRule: function parseStyleRule(aToken, aOwner, aIsInsideMediaRule) {
			var currentLine = CountLF(this.mScanner.getAlreadyScanned());this.preserveState();var selector = this.parseSelector(aToken, false);var valid = false;var declarations = [];if (selector) {
				selector = this.trim11(selector.selector);var s = selector;var token = this.getToken(true, true);if (token.isSymbol("{")) {
					s += " { ";var token = this.getToken(true, false);while (true) {
						if (!token.isNotNull()) {
							valid = true;break;
						}if (token.isSymbol("}")) {
							s += "}";valid = true;break;
						} else {
							var d = this.parseDeclaration(token, declarations, true, true, aOwner);s += (d && declarations.length ? " " : "") + d;
						}token = this.getToken(true, false);
					}
				}
			} else {}if (valid) {
				var rule = new jscsspStyleRule();rule.currentLine = currentLine;rule.parsedCssText = s;rule.declarations = declarations;rule.mSelectorText = selector;if (aIsInsideMediaRule) rule.parentRule = aOwner;else rule.parentStyleSheet = aOwner;aOwner.cssRules.push(rule);return s;
			}this.restoreState();s = this.currentToken().value;this.addUnknownAtRule(aOwner, s);return "";
		}, parseSelector: function parseSelector(aToken, aParseSelectorOnly) {
			var s = "";var specificity = { a: 0, b: 0, c: 0, d: 0 };var isFirstInChain = true;var token = aToken;var valid = false;var combinatorFound = false;while (true) {
				if (!token.isNotNull()) {
					if (aParseSelectorOnly) return { selector: s, specificity: specificity };return "";
				}if (!aParseSelectorOnly && token.isSymbol("{")) {
					valid = !combinatorFound;if (valid) this.ungetToken();break;
				}if (token.isSymbol(",")) {
					s += token.value;isFirstInChain = true;combinatorFound = false;token = this.getToken(false, true);continue;
				} else if (!combinatorFound && (token.isWhiteSpace() || token.isSymbol(">") || token.isSymbol("+") || token.isSymbol("~"))) {
					if (token.isWhiteSpace()) {
						s += " ";var nextToken = this.lookAhead(true, true);if (!nextToken.isNotNull()) {
							if (aParseSelectorOnly) return { selector: s, specificity: specificity };return "";
						}if (nextToken.isSymbol(">") || nextToken.isSymbol("+") || nextToken.isSymbol("~")) {
							token = this.getToken(true, true);s += token.value + " ";combinatorFound = true;
						}
					} else {
						s += token.value;combinatorFound = true;
					}isFirstInChain = true;token = this.getToken(true, true);continue;
				} else {
					var simpleSelector = this.parseSimpleSelector(token, isFirstInChain, true);if (!simpleSelector) break;s += simpleSelector.selector;specificity.b += simpleSelector.specificity.b;specificity.c += simpleSelector.specificity.c;specificity.d += simpleSelector.specificity.d;isFirstInChain = false;combinatorFound = false;
				}token = this.getToken(false, true);
			}if (valid) {
				return { selector: s, specificity: specificity };
			}return "";
		}, isPseudoElement: function isPseudoElement(aIdent) {
			switch (aIdent) {case "first-letter":case "first-line":case "before":case "after":case "marker":
					return true;break;default:
					return false;break;}
		}, parseSimpleSelector: function parseSimpleSelector(token, isFirstInChain, canNegate) {
			var s = "";var specificity = { a: 0, b: 0, c: 0, d: 0 };if (isFirstInChain && (token.isSymbol("*") || token.isSymbol("|") || token.isIdent())) {
				if (token.isSymbol("*") || token.isIdent()) {
					s += token.value;var isIdent = token.isIdent();token = this.getToken(false, true);if (token.isSymbol("|")) {
						s += token.value;token = this.getToken(false, true);if (token.isIdent() || token.isSymbol("*")) {
							s += token.value;if (token.isIdent()) specificity.d++;
						} else return null;
					} else {
						this.ungetToken();if (isIdent) specificity.d++;
					}
				} else if (token.isSymbol("|")) {
					s += token.value;token = this.getToken(false, true);if (token.isIdent() || token.isSymbol("*")) {
						s += token.value;if (token.isIdent()) specificity.d++;
					} else return null;
				}
			} else if (token.isSymbol(".") || token.isSymbol("#")) {
				var isClass = token.isSymbol(".");s += token.value;token = this.getToken(false, true);if (token.isIdent()) {
					s += token.value;if (isClass) specificity.c++;else specificity.b++;
				} else return null;
			} else if (token.isSymbol(":")) {
				s += token.value;token = this.getToken(false, true);if (token.isSymbol(":")) {
					s += token.value;token = this.getToken(false, true);
				}if (token.isIdent()) {
					s += token.value;if (this.isPseudoElement(token.value)) specificity.d++;else specificity.c++;
				} else if (token.isFunction()) {
					s += token.value;if (token.isFunction(":not(")) {
						if (!canNegate) return null;token = this.getToken(true, true);var simpleSelector = this.parseSimpleSelector(token, isFirstInChain, false);if (!simpleSelector) return null;else {
							s += simpleSelector.selector;token = this.getToken(true, true);if (token.isSymbol(")")) s += ")";else return null;
						}specificity.c++;
					} else {
						while (true) {
							token = this.getToken(false, true);if (token.isSymbol(")")) {
								s += ")";break;
							} else s += token.value;
						}specificity.c++;
					}
				} else return null;
			} else if (token.isSymbol("[")) {
				s += "[";token = this.getToken(true, true);if (token.isIdent() || token.isSymbol("*")) {
					s += token.value;var nextToken = this.getToken(true, true);if (token.isSymbol("|")) {
						s += "|";token = this.getToken(true, true);if (token.isIdent()) s += token.value;else return null;
					} else this.ungetToken();
				} else if (token.isSymbol("|")) {
					s += "|";token = this.getToken(true, true);if (token.isIdent()) s += token.value;else return null;
				} else return null;token = this.getToken(true, true);if (token.isIncludes() || token.isDashmatch() || token.isBeginsmatch() || token.isEndsmatch() || token.isContainsmatch() || token.isSymbol("=")) {
					s += token.value;token = this.getToken(true, true);if (token.isString() || token.isIdent()) {
						s += token.value;token = this.getToken(true, true);
					} else return null;if (token.isSymbol("]")) {
						s += token.value;specificity.c++;
					} else return null;
				} else if (token.isSymbol("]")) {
					s += token.value;specificity.c++;
				} else return null;
			} else if (token.isWhiteSpace()) {
				var t = this.lookAhead(true, true);if (t.isSymbol('{')) return "";
			}if (s) return { selector: s, specificity: specificity };return null;
		}, preserveState: function preserveState() {
			this.mPreservedTokens.push(this.currentToken());this.mScanner.preserveState();
		}, restoreState: function restoreState() {
			if (this.mPreservedTokens.length) {
				this.mScanner.restoreState();this.mToken = this.mPreservedTokens.pop();
			}
		}, forgetState: function forgetState() {
			if (this.mPreservedTokens.length) {
				this.mScanner.forgetState();this.mPreservedTokens.pop();
			}
		}, parse: function parse(aString, aTryToPreserveWhitespaces, aTryToPreserveComments) {
			if (!aString) return null;this.mPreserveWS = aTryToPreserveWhitespaces;this.mPreserveComments = aTryToPreserveComments;this.mPreservedTokens = [];this.mScanner.init(aString);var sheet = new jscsspStylesheet();var token = this.getToken(false, false);if (!token.isNotNull()) return;if (token.isAtRule("@charset")) {
				this.parseCharsetRule(token, sheet);token = this.getToken(false, false);
			}var foundStyleRules = false;var foundImportRules = false;var foundNameSpaceRules = false;while (true) {
				if (!token.isNotNull()) break;if (token.isWhiteSpace()) {
					if (aTryToPreserveWhitespaces) this.addWhitespace(sheet, token.value);
				} else if (token.isComment()) {
					if (this.mPreserveComments) this.addComment(sheet, token.value);
				} else if (token.isAtRule()) {
					if (token.isAtRule("@variables")) {
						if (!foundImportRules && !foundStyleRules) this.parseVariablesRule(token, sheet);else {
							this.reportError(kVARIABLES_RULE_POSITION);this.addUnknownAtRule(sheet, token.value);
						}
					} else if (token.isAtRule("@import")) {
						if (!foundStyleRules && !foundNameSpaceRules) foundImportRules = this.parseImportRule(token, sheet);else {
							this.reportError(kIMPORT_RULE_POSITION);this.addUnknownAtRule(sheet, token.value);
						}
					} else if (token.isAtRule("@namespace")) {
						if (!foundStyleRules) foundNameSpaceRules = this.parseNamespaceRule(token, sheet);else {
							this.reportError(kNAMESPACE_RULE_POSITION);this.addUnknownAtRule(sheet, token.value);
						}
					} else if (token.isAtRule("@font-face")) {
						if (this.parseFontFaceRule(token, sheet)) foundStyleRules = true;else this.addUnknownAtRule(sheet, token.value);
					} else if (token.isAtRule("@page")) {
						if (this.parsePageRule(token, sheet)) foundStyleRules = true;else this.addUnknownAtRule(sheet, token.value);
					} else if (token.isAtRule("@media")) {
						if (this.parseMediaRule(token, sheet)) foundStyleRules = true;else this.addUnknownAtRule(sheet, token.value);
					} else if (token.isAtRule("@keyframes")) {
						if (!this.parseKeyframesRule(token, sheet)) this.addUnknownAtRule(sheet, token.value);
					} else if (token.isAtRule("@charset")) {
						this.reportError(kCHARSET_RULE_CHARSET_SOF);this.addUnknownAtRule(sheet, token.value);
					} else {
						this.reportError(kUNKNOWN_AT_RULE);this.addUnknownAtRule(sheet, token.value);
					}
				} else {
					var ruleText = this.parseStyleRule(token, sheet, false);if (ruleText) foundStyleRules = true;
				}token = this.getToken(false);
			}return sheet;
		} };function jscsspToken(aType, aValue, aUnit) {
		this.type = aType;this.value = aValue;this.unit = aUnit;
	}jscsspToken.NULL_TYPE = 0;jscsspToken.WHITESPACE_TYPE = 1;jscsspToken.STRING_TYPE = 2;jscsspToken.COMMENT_TYPE = 3;jscsspToken.NUMBER_TYPE = 4;jscsspToken.IDENT_TYPE = 5;jscsspToken.FUNCTION_TYPE = 6;jscsspToken.ATRULE_TYPE = 7;jscsspToken.INCLUDES_TYPE = 8;jscsspToken.DASHMATCH_TYPE = 9;jscsspToken.BEGINSMATCH_TYPE = 10;jscsspToken.ENDSMATCH_TYPE = 11;jscsspToken.CONTAINSMATCH_TYPE = 12;jscsspToken.SYMBOL_TYPE = 13;jscsspToken.DIMENSION_TYPE = 14;jscsspToken.PERCENTAGE_TYPE = 15;jscsspToken.HEX_TYPE = 16;jscsspToken.prototype = (_jscsspToken$prototyp = { isNotNull: function isNotNull() {
			return this.type;
		}, _isOfType: function _isOfType(aType, aValue) {
			return this.type == aType && (!aValue || this.value.toLowerCase() == aValue);
		}, isWhiteSpace: function isWhiteSpace(w) {
			return this._isOfType(jscsspToken.WHITESPACE_TYPE, w);
		}, isString: function isString() {
			return this._isOfType(jscsspToken.STRING_TYPE);
		}, isComment: function isComment() {
			return this._isOfType(jscsspToken.COMMENT_TYPE);
		}, isNumber: function isNumber(n) {
			return this._isOfType(jscsspToken.NUMBER_TYPE, n);
		}, isSymbol: function isSymbol(c) {
			return this._isOfType(jscsspToken.SYMBOL_TYPE, c);
		}, isIdent: function isIdent(i) {
			return this._isOfType(jscsspToken.IDENT_TYPE, i);
		}, isFunction: function isFunction(f) {
			return this._isOfType(jscsspToken.FUNCTION_TYPE, f);
		}, isAtRule: function isAtRule(a) {
			return this._isOfType(jscsspToken.ATRULE_TYPE, a);
		}, isIncludes: function isIncludes() {
			return this._isOfType(jscsspToken.INCLUDES_TYPE);
		}, isDashmatch: function isDashmatch() {
			return this._isOfType(jscsspToken.DASHMATCH_TYPE);
		}, isBeginsmatch: function isBeginsmatch() {
			return this._isOfType(jscsspToken.BEGINSMATCH_TYPE);
		}, isEndsmatch: function isEndsmatch() {
			return this._isOfType(jscsspToken.ENDSMATCH_TYPE);
		}, isContainsmatch: function isContainsmatch() {
			return this._isOfType(jscsspToken.CONTAINSMATCH_TYPE);
		} }, _defineProperty(_jscsspToken$prototyp, "isSymbol", function isSymbol(c) {
		return this._isOfType(jscsspToken.SYMBOL_TYPE, c);
	}), _defineProperty(_jscsspToken$prototyp, "isDimension", function isDimension() {
		return this._isOfType(jscsspToken.DIMENSION_TYPE);
	}), _defineProperty(_jscsspToken$prototyp, "isPercentage", function isPercentage() {
		return this._isOfType(jscsspToken.PERCENTAGE_TYPE);
	}), _defineProperty(_jscsspToken$prototyp, "isHex", function isHex() {
		return this._isOfType(jscsspToken.HEX_TYPE);
	}), _defineProperty(_jscsspToken$prototyp, "isDimensionOfUnit", function isDimensionOfUnit(aUnit) {
		return this.isDimension() && this.unit == aUnit;
	}), _defineProperty(_jscsspToken$prototyp, "isLength", function isLength() {
		return this.isPercentage() || this.isDimensionOfUnit("cm") || this.isDimensionOfUnit("mm") || this.isDimensionOfUnit("in") || this.isDimensionOfUnit("pc") || this.isDimensionOfUnit("px") || this.isDimensionOfUnit("em") || this.isDimensionOfUnit("ex") || this.isDimensionOfUnit("pt");
	}), _defineProperty(_jscsspToken$prototyp, "isAngle", function isAngle() {
		return this.isDimensionOfUnit("deg") || this.isDimensionOfUnit("rad") || this.isDimensionOfUnit("grad");
	}), _jscsspToken$prototyp);var kJscsspUNKNOWN_RULE = 0;var kJscsspSTYLE_RULE = 1;var kJscsspCHARSET_RULE = 2;var kJscsspIMPORT_RULE = 3;var kJscsspMEDIA_RULE = 4;var kJscsspFONT_FACE_RULE = 5;var kJscsspPAGE_RULE = 6;var kJscsspKEYFRAMES_RULE = 7;var kJscsspKEYFRAME_RULE = 8;var kJscsspNAMESPACE_RULE = 100;var kJscsspCOMMENT = 101;var kJscsspWHITE_SPACE = 102;var kJscsspVARIABLES_RULE = 200;var kJscsspSTYLE_DECLARATION = 1000;var gTABS = "";function jscsspStylesheet() {
		this.cssRules = [];this.variables = {};
	}jscsspStylesheet.prototype = { insertRule: function insertRule(aRule, aIndex) {
			try {
				this.cssRules.splice(aIndex, 1, aRule);
			} catch (e) {}
		}, deleteRule: function deleteRule(aIndex) {
			try {
				this.cssRules.splice(aIndex);
			} catch (e) {}
		}, cssText: function cssText() {
			var rv = "";for (var i = 0; i < this.cssRules.length; i++) {
				rv += this.cssRules[i].cssText() + "\n";
			}return rv;
		}, resolveVariables: function resolveVariables(aMedium) {
			function ItemFoundInArray(aArray, aItem) {
				for (var i = 0; i < aArray.length; i++) {
					if (aItem == aArray[i]) return true;
				}return false;
			}for (var i = 0; i < this.cssRules.length; i++) {
				var rule = this.cssRules[i];if (rule.type == kJscsspSTYLE_RULE || rule.type == kJscsspIMPORT_RULE) break;else if (rule.type == kJscsspVARIABLES_RULE && (!rule.media.length || ItemFoundInArray(rule.media, aMedium))) {
					for (var j = 0; j < rule.declarations.length; j++) {
						var valueText = "";for (var k = 0; k < rule.declarations[j].values.length; k++) {
							valueText += (k ? " " : "") + rule.declarations[j].values[k].value;
						}this.variables[rule.declarations[j].property] = valueText;
					}
				}
			}
		} };function jscsspCharsetRule() {
		this.type = kJscsspCHARSET_RULE;this.encoding = null;this.parsedCssText = null;this.parentStyleSheet = null;this.parentRule = null;
	}jscsspCharsetRule.prototype = { cssText: function cssText() {
			return "@charset " + this.encoding + ";";
		}, setCssText: function setCssText(val) {
			var sheet = { cssRules: [] };var parser = new CSSParser(val);var token = parser.getToken(false, false);if (token.isAtRule("@charset")) {
				if (parser.parseCharsetRule(token, sheet)) {
					var newRule = sheet.cssRules[0];this.encoding = newRule.encoding;this.parsedCssText = newRule.parsedCssText;return;
				}
			}throw DOMException.SYNTAX_ERR;
		} };function jscsspErrorRule(aErrorMsg) {
		this.error = aErrorMsg ? aErrorMsg : "INVALID";this.type = kJscsspUNKNOWN_RULE;this.parsedCssText = null;this.parentStyleSheet = null;this.parentRule = null;
	}jscsspErrorRule.prototype = { cssText: function cssText() {
			return this.parsedCssText;
		} };function jscsspComment() {
		this.type = kJscsspCOMMENT;this.parsedCssText = null;this.parentStyleSheet = null;this.parentRule = null;
	}jscsspComment.prototype = { cssText: function cssText() {
			return this.parsedCssText;
		}, setCssText: function setCssText(val) {
			var parser = new CSSParser(val);var token = parser.getToken(true, false);if (token.isComment()) this.parsedCssText = token.value;else throw DOMException.SYNTAX_ERR;
		} };function jscsspWhitespace() {
		this.type = kJscsspWHITE_SPACE;this.parsedCssText = null;this.parentStyleSheet = null;this.parentRule = null;
	}jscsspWhitespace.prototype = { cssText: function cssText() {
			return this.parsedCssText;
		} };function jscsspImportRule() {
		this.type = kJscsspIMPORT_RULE;this.parsedCssText = null;this.href = null;this.media = [];this.parentStyleSheet = null;this.parentRule = null;
	}jscsspImportRule.prototype = { cssText: function cssText() {
			var mediaString = this.media.join(", ");return "@import " + this.href + (mediaString && mediaString != "all" ? mediaString + " " : "") + ";";
		}, setCssText: function setCssText(val) {
			var sheet = { cssRules: [] };var parser = new CSSParser(val);var token = parser.getToken(true, true);if (token.isAtRule("@import")) {
				if (parser.parseImportRule(token, sheet)) {
					var newRule = sheet.cssRules[0];this.href = newRule.href;this.media = newRule.media;this.parsedCssText = newRule.parsedCssText;return;
				}
			}throw DOMException.SYNTAX_ERR;
		} };function jscsspNamespaceRule() {
		this.type = kJscsspNAMESPACE_RULE;this.parsedCssText = null;this.prefix = null;this.url = null;this.parentStyleSheet = null;this.parentRule = null;
	}jscsspNamespaceRule.prototype = { cssText: function cssText() {
			return "@namespace " + (this.prefix ? this.prefix + " " : "") + this.url + ";";
		}, setCssText: function setCssText(val) {
			var sheet = { cssRules: [] };var parser = new CSSParser(val);var token = parser.getToken(true, true);if (token.isAtRule("@namespace")) {
				if (parser.parseNamespaceRule(token, sheet)) {
					var newRule = sheet.cssRules[0];this.url = newRule.url;this.prefix = newRule.prefix;this.parsedCssText = newRule.parsedCssText;return;
				}
			}throw DOMException.SYNTAX_ERR;
		} };function jscsspDeclaration() {
		this.type = kJscsspSTYLE_DECLARATION;this.property = null;this.values = [];this.valueText = null;this.priority = null;this.parsedCssText = null;this.parentStyleSheet = null;this.parentRule = null;
	}jscsspDeclaration.prototype = { kCOMMA_SEPARATED: { "cursor": true, "font-family": true, "voice-family": true, "background-image": true }, kUNMODIFIED_COMMA_SEPARATED_PROPERTIES: { "text-shadow": true, "box-shadow": true, "-moz-transition": true, "-moz-transition-property": true, "-moz-transition-duration": true, "-moz-transition-timing-function": true, "-moz-transition-delay": true }, cssText: function cssText() {
			var prefixes = CssInspector.prefixesForProperty(this.property);if (this.property in this.kUNMODIFIED_COMMA_SEPARATED_PROPERTIES) {
				if (prefixes) {
					var rv = "";for (var propertyIndex = 0; propertyIndex < prefixes.length; propertyIndex++) {
						var property = prefixes[propertyIndex];rv += (propertyIndex ? gTABS : "") + property + ": ";rv += this.valueText + (this.priority ? " !important" : "") + ";";rv += prefixes.length > 1 && propertyIndex != prefixes.length - 1 ? "\n" : "";
					}return rv;
				}return this.property + ": " + this.valueText + (this.priority ? " !important" : "") + ";";
			}if (prefixes) {
				var rv = "";for (var propertyIndex = 0; propertyIndex < prefixes.length; propertyIndex++) {
					var property = prefixes[propertyIndex];rv += (propertyIndex ? gTABS : "") + property + ": ";var separator = property in this.kCOMMA_SEPARATED ? ", " : " ";for (var i = 0; i < this.values.length; i++) {
						if (this.values[i].cssText() != null) rv += (i ? separator : "") + this.values[i].cssText();else return null;
					}rv += (this.priority ? " !important" : "") + ";" + (prefixes.length > 1 && propertyIndex != prefixes.length - 1 ? "\n" : "");
				}return rv;
			}var rv = this.property + ": ";var separator = this.property in this.kCOMMA_SEPARATED ? ", " : " ";var extras = { "webkit": false, "presto": false, "trident": false, "generic": false };for (var i = 0; i < this.values.length; i++) {
				var v = this.values[i].cssText();if (v != null) {
					var paren = v.indexOf("(");var kwd = v;if (paren != -1) kwd = v.substr(0, paren);if (kwd in kCSS_VENDOR_VALUES) {
						for (var j in kCSS_VENDOR_VALUES[kwd]) {
							extras[j] = extras[j] || kCSS_VENDOR_VALUES[kwd][j] != "";
						}
					}rv += (i ? separator : "") + v;
				} else return null;
			}rv += (this.priority ? " !important" : "") + ";";for (var j in extras) {
				if (extras[j]) {
					var str = "\n" + gTABS + this.property + ": ";for (var i = 0; i < this.values.length; i++) {
						var v = this.values[i].cssText();if (v != null) {
							var paren = v.indexOf("(");var kwd = v;if (paren != -1) kwd = v.substr(0, paren);if (kwd in kCSS_VENDOR_VALUES) {
								functor = kCSS_VENDOR_VALUES[kwd][j];if (functor) {
									v = typeof functor == "string" ? functor : functor(v, j);if (!v) {
										str = null;break;
									}
								}
							}str += (i ? separator : "") + v;
						} else return null;
					}if (str) rv += str + ";";else rv += "\n" + gTABS + "/* Impossible to translate property " + this.property + " for " + j + " */";
				}
			}return rv;
		}, setCssText: function setCssText(val) {
			var declarations = [];var parser = new CSSParser(val);var token = parser.getToken(true, true);if (parser.parseDeclaration(token, declarations, true, true, null) && declarations.length && declarations[0].type == kJscsspSTYLE_DECLARATION) {
				var newDecl = declarations.cssRules[0];this.property = newDecl.property;this.value = newDecl.value;this.priority = newDecl.priority;this.parsedCssText = newRule.parsedCssText;return;
			}throw DOMException.SYNTAX_ERR;
		} };function jscsspFontFaceRule() {
		this.type = kJscsspFONT_FACE_RULE;this.parsedCssText = null;this.descriptors = [];this.parentStyleSheet = null;this.parentRule = null;
	}jscsspFontFaceRule.prototype = { cssText: function cssText() {
			var rv = gTABS + "@font-face {\n";var preservedGTABS = gTABS;gTABS += "  ";for (var i = 0; i < this.descriptors.length; i++) {
				rv += gTABS + this.descriptors[i].cssText() + "\n";
			}gTABS = preservedGTABS;return rv + gTABS + "}";
		}, setCssText: function setCssText(val) {
			var sheet = { cssRules: [] };var parser = new CSSParser(val);var token = parser.getToken(true, true);if (token.isAtRule("@font-face")) {
				if (parser.parseFontFaceRule(token, sheet)) {
					var newRule = sheet.cssRules[0];this.descriptors = newRule.descriptors;this.parsedCssText = newRule.parsedCssText;return;
				}
			}throw DOMException.SYNTAX_ERR;
		} };function jscsspKeyframesRule() {
		this.type = kJscsspKEYFRAMES_RULE;this.parsedCssText = null;this.cssRules = [];this.name = null;this.parentStyleSheet = null;this.parentRule = null;
	}jscsspKeyframesRule.prototype = { cssText: function cssText() {
			var rv = gTABS + "@keyframes " + this.name + " {\n";var preservedGTABS = gTABS;gTABS += "  ";for (var i = 0; i < this.cssRules.length; i++) {
				rv += gTABS + this.cssRules[i].cssText() + "\n";
			}gTABS = preservedGTABS;rv += gTABS + "}\n";return rv;
		}, setCssText: function setCssText(val) {
			var sheet = { cssRules: [] };var parser = new CSSParser(val);var token = parser.getToken(true, true);if (token.isAtRule("@keyframes")) {
				if (parser.parseKeyframesRule(token, sheet)) {
					var newRule = sheet.cssRules[0];this.cssRules = newRule.cssRules;this.name = newRule.name;this.parsedCssText = newRule.parsedCssText;return;
				}
			}throw DOMException.SYNTAX_ERR;
		} };function jscsspKeyframeRule() {
		this.type = kJscsspKEYFRAME_RULE;this.parsedCssText = null;this.declarations = [];this.keyText = null;this.parentStyleSheet = null;this.parentRule = null;
	}jscsspKeyframeRule.prototype = { cssText: function cssText() {
			var rv = this.keyText + " {\n";var preservedGTABS = gTABS;gTABS += "  ";for (var i = 0; i < this.declarations.length; i++) {
				var declText = this.declarations[i].cssText();if (declText) rv += gTABS + this.declarations[i].cssText() + "\n";
			}gTABS = preservedGTABS;return rv + gTABS + "}";
		}, setCssText: function setCssText(val) {
			var sheet = { cssRules: [] };var parser = new CSSParser(val);var token = parser.getToken(true, true);if (!token.isNotNull()) {
				if (parser.parseKeyframeRule(token, sheet, false)) {
					var newRule = sheet.cssRules[0];this.keyText = newRule.keyText;this.declarations = newRule.declarations;this.parsedCssText = newRule.parsedCssText;return;
				}
			}throw DOMException.SYNTAX_ERR;
		} };function jscsspMediaRule() {
		this.type = kJscsspMEDIA_RULE;this.parsedCssText = null;this.cssRules = [];this.media = [];this.parentStyleSheet = null;this.parentRule = null;
	}jscsspMediaRule.prototype = { cssText: function cssText() {
			var rv = gTABS + "@media " + this.media.join(", ") + " {\n";var preservedGTABS = gTABS;gTABS += "  ";for (var i = 0; i < this.cssRules.length; i++) {
				rv += gTABS + this.cssRules[i].cssText() + "\n";
			}gTABS = preservedGTABS;return rv + gTABS + "}";
		}, setCssText: function setCssText(val) {
			var sheet = { cssRules: [] };var parser = new CSSParser(val);var token = parser.getToken(true, true);if (token.isAtRule("@media")) {
				if (parser.parseMediaRule(token, sheet)) {
					var newRule = sheet.cssRules[0];this.cssRules = newRule.cssRules;this.media = newRule.media;this.parsedCssText = newRule.parsedCssText;return;
				}
			}throw DOMException.SYNTAX_ERR;
		} };function jscsspStyleRule() {
		this.type = kJscsspSTYLE_RULE;this.parsedCssText = null;this.declarations = [];this.mSelectorText = null;this.parentStyleSheet = null;this.parentRule = null;
	}jscsspStyleRule.prototype = { cssText: function cssText() {
			var rv = this.mSelectorText + " {\n";var preservedGTABS = gTABS;gTABS += "  ";for (var i = 0; i < this.declarations.length; i++) {
				var declText = this.declarations[i].cssText();if (declText) rv += gTABS + this.declarations[i].cssText() + "\n";
			}gTABS = preservedGTABS;return rv + gTABS + "}";
		}, setCssText: function setCssText(val) {
			var sheet = { cssRules: [] };var parser = new CSSParser(val);var token = parser.getToken(true, true);if (!token.isNotNull()) {
				if (parser.parseStyleRule(token, sheet, false)) {
					var newRule = sheet.cssRules[0];this.mSelectorText = newRule.mSelectorText;this.declarations = newRule.declarations;this.parsedCssText = newRule.parsedCssText;return;
				}
			}throw DOMException.SYNTAX_ERR;
		}, selectorText: function selectorText() {
			return this.mSelectorText;
		}, setSelectorText: function setSelectorText(val) {
			var parser = new CSSParser(val);var token = parser.getToken(true, true);if (!token.isNotNull()) {
				var s = parser.parseSelector(token, true);if (s) {
					this.mSelectorText = s.selector;return;
				}
			}throw DOMException.SYNTAX_ERR;
		} };function jscsspPageRule() {
		this.type = kJscsspPAGE_RULE;this.parsedCssText = null;this.pageSelector = null;this.declarations = [];this.parentStyleSheet = null;this.parentRule = null;
	}jscsspPageRule.prototype = { cssText: function cssText() {
			var rv = gTABS + "@page " + (this.pageSelector ? this.pageSelector + " " : "") + "{\n";var preservedGTABS = gTABS;gTABS += "  ";for (var i = 0; i < this.declarations.length; i++) {
				rv += gTABS + this.declarations[i].cssText() + "\n";
			}gTABS = preservedGTABS;return rv + gTABS + "}";
		}, setCssText: function setCssText(val) {
			var sheet = { cssRules: [] };var parser = new CSSParser(val);var token = parser.getToken(true, true);if (token.isAtRule("@page")) {
				if (parser.parsePageRule(token, sheet)) {
					var newRule = sheet.cssRules[0];this.pageSelector = newRule.pageSelector;this.declarations = newRule.declarations;this.parsedCssText = newRule.parsedCssText;return;
				}
			}throw DOMException.SYNTAX_ERR;
		} };function jscsspVariablesRule() {
		this.type = kJscsspVARIABLES_RULE;this.parsedCssText = null;this.declarations = [];this.parentStyleSheet = null;this.parentRule = null;this.media = null;
	}jscsspVariablesRule.prototype = { cssText: function cssText() {
			var rv = gTABS + "@variables " + (this.media.length ? this.media.join(", ") + " " : "") + "{\n";var preservedGTABS = gTABS;gTABS += "  ";for (var i = 0; i < this.declarations.length; i++) {
				rv += gTABS + this.declarations[i].cssText() + "\n";
			}gTABS = preservedGTABS;return rv + gTABS + "}";
		}, setCssText: function setCssText(val) {
			var sheet = { cssRules: [] };var parser = new CSSParser(val);var token = parser.getToken(true, true);if (token.isAtRule("@variables")) {
				if (parser.parseVariablesRule(token, sheet)) {
					var newRule = sheet.cssRules[0];this.declarations = newRule.declarations;this.parsedCssText = newRule.parsedCssText;return;
				}
			}throw DOMException.SYNTAX_ERR;
		} };var kJscsspINHERIT_VALUE = 0;var kJscsspPRIMITIVE_VALUE = 1;var kJscsspVARIABLE_VALUE = 4;function jscsspVariable(aType, aSheet) {
		this.value = "";this.type = aType;this.name = null;this.parentRule = null;this.parentStyleSheet = aSheet;
	}jscsspVariable.prototype = { cssText: function cssText() {
			if (this.type == kJscsspVARIABLE_VALUE) return this.resolveVariable(this.name, this.parentRule, this.parentStyleSheet);else return this.value;
		}, setCssText: function setCssText(val) {
			if (this.type == kJscsspVARIABLE_VALUE) throw DOMException.SYNTAX_ERR;else this.value = val;
		}, resolveVariable: function resolveVariable(aName, aRule, aSheet) {
			if (aName.toLowerCase() in aSheet.variables) return aSheet.variables[aName.toLowerCase()];return null;
		} };function ParseURL(buffer) {
		var result = {};result.protocol = "";result.user = "";result.password = "";result.host = "";result.port = "";result.path = "";result.query = "";var section = "PROTOCOL";var start = 0;var wasSlash = false;while (start < buffer.length) {
			if (section == "PROTOCOL") {
				if (buffer.charAt(start) == ':') {
					section = "AFTER_PROTOCOL";start++;
				} else if (buffer.charAt(start) == '/' && result.protocol.length() == 0) {
					section = PATH;
				} else {
					result.protocol += buffer.charAt(start++);
				}
			} else if (section == "AFTER_PROTOCOL") {
				if (buffer.charAt(start) == '/') {
					if (!wasSlash) {
						wasSlash = true;
					} else {
						wasSlash = false;section = "USER";
					}start++;
				} else {
					throw new ParseException("Protocol shell be separated with 2 slashes");
				}
			} else if (section == "USER") {
				if (buffer.charAt(start) == '/') {
					result.host = result.user;result.user = "";section = "PATH";
				} else if (buffer.charAt(start) == '?') {
					result.host = result.user;result.user = "";section = "QUERY";start++;
				} else if (buffer.charAt(start) == ':') {
					section = "PASSWORD";start++;
				} else if (buffer.charAt(start) == '@') {
					section = "HOST";start++;
				} else {
					result.user += buffer.charAt(start++);
				}
			} else if (section == "PASSWORD") {
				if (buffer.charAt(start) == '/') {
					result.host = result.user;result.port = result.password;result.user = "";result.password = "";section = "PATH";
				} else if (buffer.charAt(start) == '?') {
					result.host = result.user;result.port = result.password;result.user = "";result.password = "";section = "QUERY";start++;
				} else if (buffer.charAt(start) == '@') {
					section = "HOST";start++;
				} else {
					result.password += buffer.charAt(start++);
				}
			} else if (section == "HOST") {
				if (buffer.charAt(start) == '/') {
					section = "PATH";
				} else if (buffer.charAt(start) == ':') {
					section = "PORT";start++;
				} else if (buffer.charAt(start) == '?') {
					section = "QUERY";start++;
				} else {
					result.host += buffer.charAt(start++);
				}
			} else if (section == "PORT") {
				if (buffer.charAt(start) == '/') {
					section = "PATH";
				} else if (buffer.charAt(start) == '?') {
					section = "QUERY";start++;
				} else {
					result.port += buffer.charAt(start++);
				}
			} else if (section == "PATH") {
				if (buffer.charAt(start) == '?') {
					section = "QUERY";start++;
				} else {
					result.path += buffer.charAt(start++);
				}
			} else if (section == "QUERY") {
				result.query += buffer.charAt(start++);
			}
		}if (section == "PROTOCOL") {
			result.host = result.protocol;result.protocol = "http";
		} else if (section == "AFTER_PROTOCOL") {
			throw new ParseException("Invalid url");
		} else if (section == "USER") {
			result.host = result.user;result.user = "";
		} else if (section == "PASSWORD") {
			result.host = result.user;result.port = result.password;result.user = "";result.password = "";
		}return result;
	}function ParseException(description) {
		this.description = description;
	}function CountLF(s) {
		var nCR = s.match(/\n/g);return nCR ? nCR.length + 1 : 1;
	}function FilterLinearGradientForOutput(aValue, aEngine) {
		if (aEngine == "generic") return aValue.substr(5);if (aEngine == "webkit") return aValue.replace(/\-moz\-/g, "-webkit-");if (aEngine != "webkit20110101") return "";var g = CssInspector.parseBackgroundImages(aValue)[0];var cancelled = false;var str = "-webkit-gradient(linear, ";var position = "position" in g.value ? g.value.position.toLowerCase() : "";var angle = "angle" in g.value ? g.value.angle.toLowerCase() : "";if (angle) {
			var match = angle.match(/^([0-9\-\.\\+]+)([a-z]*)/);var angle = parseFloat(match[1]);var unit = match[2];switch (unit) {case "grad":
					angle = angle * 90 / 100;break;case "rad":
					angle = angle * 180 / Math.PI;break;default:
					break;}while (angle < 0) {
				angle += 360;
			}while (angle >= 360) {
				angle -= 360;
			}
		}var startpoint = [];var endpoint = [];if (position != "") {
			if (position == "center") position = "center center";startpoint = position.split(" ");if (angle == "" && angle != 0) {
				switch (startpoint[0]) {case "left":
						endpoint.push("right");break;case "center":
						endpoint.push("center");break;case "right":
						endpoint.push("left");break;default:
						{
							var match = startpoint[0].match(/^([0-9\-\.\\+]+)([a-z]*)/);var v = parseFloat(match[0]);var unit = match[1];if (unit == "%") {
								endpoint.push(100 - v + "%");
							} else cancelled = true;
						}break;}if (!cancelled) switch (startpoint[1]) {case "top":
						endpoint.push("bottom");break;case "center":
						endpoint.push("center");break;case "bottom":
						endpoint.push("top");break;default:
						{
							var match = startpoint[1].match(/^([0-9\-\.\\+]+)([a-z]*)/);var v = parseFloat(match[0]);var unit = match[1];if (unit == "%") {
								endpoint.push(100 - v + "%");
							} else cancelled = true;
						}break;}
			} else {
				switch (angle) {case 0:
						endpoint.push("right");endpoint.push(startpoint[1]);break;case 90:
						endpoint.push(startpoint[0]);endpoint.push("top");break;case 180:
						endpoint.push("left");endpoint.push(startpoint[1]);break;case 270:
						endpoint.push(startpoint[0]);endpoint.push("bottom");break;default:
						cancelled = true;break;}
			}
		} else {
			if (angle == "") angle = 270;switch (angle) {case 0:
					startpoint = ["left", "center"];endpoint = ["right", "center"];break;case 90:
					startpoint = ["center", "bottom"];endpoint = ["center", "top"];break;case 180:
					startpoint = ["right", "center"];endpoint = ["left", "center"];break;case 270:
					startpoint = ["center", "top"];endpoint = ["center", "bottom"];break;default:
					cancelled = true;break;}
		}if (cancelled) return "";str += startpoint.join(" ") + ", " + endpoint.join(" ");if (!g.value.stops[0].position) g.value.stops[0].position = "0%";if (!g.value.stops[g.value.stops.length - 1].position) g.value.stops[g.value.stops.length - 1].position = "100%";var current = 0;for (var i = 0; i < g.value.stops.length && !cancelled; i++) {
			var s = g.value.stops[i];if (s.position) {
				if (s.position.indexOf("%") == -1) {
					cancelled = true;break;
				}
			} else {
				var j = i + 1;while (j < g.value.stops.length && !g.value.stops[j].position) {
					j++;
				}var inc = parseFloat(g.value.stops[j].position) - current;for (var k = i; k < j; k++) {
					g.value.stops[k].position = current + inc * (k - i + 1) / (j - i + 1) + "%";
				}
			}current = parseFloat(s.position);str += ", color-stop(" + parseFloat(current) / 100 + ", " + s.color + ")";
		}if (cancelled) return "";return str + ")";
	}function FilterRadialGradientForOutput(aValue, aEngine) {
		if (aEngine == "generic") return aValue.substr(5);else if (aEngine == "webkit") return aValue.replace(/\-moz\-/g, "-webkit-");else if (aEngine != "webkit20110101") return "";var g = CssInspector.parseBackgroundImages(aValue)[0];var shape = "shape" in g.value ? g.value.shape : "";var size = "size" in g.value ? g.value.size : "";if (shape != "circle" || size != "farthest-corner" && size != "cover") return "";if (g.value.stops.length < 2 || !("position" in g.value.stops[0]) || !g.value.stops[g.value.stops.length - 1].position || !("position" in g.value.stops[0]) || !g.value.stops[g.value.stops.length - 1].position) return "";for (var i = 0; i < g.value.stops.length; i++) {
			var s = g.value.stops[i];if ("position" in s && s.position && s.position.indexOf("px") == -1) return "";
		}var str = "-webkit-gradient(radial, ";var position = "position" in g.value ? g.value.position : "center center";str += position + ", " + parseFloat(g.value.stops[0].position) + ", ";str += position + ", " + parseFloat(g.value.stops[g.value.stops.length - 1].position);var current = parseFloat(g.value.stops[0].position);for (var i = 0; i < g.value.stops.length; i++) {
			var s = g.value.stops[i];if (!("position" in s) || !s.position) {
				var j = i + 1;while (j < g.value.stops.length && !g.value.stops[j].position) {
					j++;
				}var inc = parseFloat(g.value.stops[j].position) - current;for (var k = i; k < j; k++) {
					g.value.stops[k].position = current + inc * (k - i + 1) / (j - i + 1) + "px";
				}
			}current = parseFloat(s.position);var c = (current - parseFloat(g.value.stops[0].position)) / (parseFloat(g.value.stops[g.value.stops.length - 1].position) - parseFloat(g.value.stops[0].position));str += ", color-stop(" + c + ", " + s.color + ")";
		}str += ")";return str;
	}function FilterRepeatingGradientForOutput(aValue, aEngine) {
		if (aEngine == "generic") return aValue.substr(5);else if (aEngine == "webkit") return aValue.replace(/\-moz\-/g, "-webkit-");return "";
	};

	/*
 
 JSONP EXPORT - JSCSS PLUGIN
 @clopez 20130612
 
 JSCSSP defines the "jscsspStylesheet" as window global
 This chunk adds a simplified method to ease export data management
 
 */

	jscsspStylesheet.prototype.getJSONP = function () {

		var jsonp = {};

		for (var i = 0; i < this.cssRules.length; i++) {

			var cssRule = this.cssRules[i];

			if (!jsonp[cssRule.mSelectorText]) jsonp[cssRule.mSelectorText] = {};

			for (var j = 0; j < cssRule.declarations.length; j++) {

				var declaration = cssRule.declarations[j];

				var value = declaration.priority ? '!' + declaration.valueText : declaration.valueText;

				jsonp[cssRule.mSelectorText][declaration.property] = declaration.valueText;
			}
		}

		return jsonp;
	};

	//expose to global

	global.CSSParser = CSSParser;
})(window);
//# sourceMappingURL=CSSParser.js.map
;'use strict';

////////////////////////////////
// smx plugin
// PROTOTYPE PARSER
// This plugins process all <prototype> nodes
// convert first level children nodes into meta-* attributes
// and apply those attributes to direct parent node


(function (global, Sizzle, smx) {

        //private aux debug system
        var DEBUG = true;var LOG = function LOG(str) {
                if (global.console && global.console.log && DEBUG) global.console.log('PROTOTYPE ' + str);
        };

        var PrototypeProcessor = {};

        PrototypeProcessor.parseXML = function (XML, opt) {

                //validate XML
                if (!XML) return;

                //normalize options
                var options = _.extend({
                        data: [],
                        propagate: true,
                        callback: function callback() {
                                return;
                        },
                        max_iterations: 1
                }, opt);

                // get all <prototype> nodes in given XML
                // <prototype> nodes will get removed after parse process
                var nodes = Sizzle('prototype', XML);

                LOG('PARSING PROTOTYPES... (' + nodes.length + ')');

                var iterations = 0;

                var i = 0;

                while (nodes.length && i < options.max_iterations) {

                        var node = nodes[i];

                        var proto = this.parseXMLNode(node);

                        options.data.push(proto);

                        i++;
                }

                //all nodes parsed?
                if (nodes.length) {

                        _.delay(_.bind(function () {
                                this.parseXML(XML, {
                                        data: options.data,
                                        propagate: options.propagate,
                                        callback: options.callback
                                });
                        }, this), 0);
                }
                //ok all nodes parsed!
                else {

                                LOG('PARSING PROTOTYPES... DONE!');

                                //reverse extracted prototypes...
                                //so we apply from outter to the inner
                                //so specific rules will overwrite global rules
                                options.data = options.data.reverse();

                                //APPLY EXTRACTED PROTOTYPES
                                if (options.propagate) for (var x = 0; x < options.data.length; x++) {
                                        this.applyPrototypes(XML, options.data[x]);
                                }LOG('APPLYING PROTOTYPES... DONE!');

                                LOG('COMPLETE!'); //' ('+ options.total +'/'+ options.total +') 100%' );

                                try {
                                        options.callback(XML, options.data);
                                } catch (e) {
                                        LOG('CALLBACK ERROR! ' + e.toString());
                                }
                        }

                return;
        };

        PrototypeProcessor.parseXMLNode = function (node) {

                //prototype node required...
                if (!node || node.nodeName !== 'prototype') return;

                var RULES = {};

                //get direct metadata parent node
                var parent = node.parentNode;

                //no parent node? wtf!!
                if (!parent) return;

                //get and remove <prototype> node from parent
                var proto = parent.removeChild(node);

                /* CSS PARSING */

                //get CSS text
                var source = proto.textContent || proto.firstChild.nodeValue; // "proto.firstChild.nodeValue" in IE8

                //Remove css comments, comments outside any rule could break CSSParser...
                //!!!WARNING, THIS IS NOT BULLETPROOF!!! empty comments like this -> /**/ wont be removed
                source = source.replace(/\s*(?!<\")\/\*[^\*]+\*\/(?!\")\s*/g, '');

                var parser = new CSSParser();
                var sheet = parser.parse(source, false, true);

                var rules = sheet.getJSONP();
                var keys = _.keys(rules);

                for (var i = 0; i < keys.length; i++) {

                        var key = keys[i];
                        var rule = rules[key];

                        //if key rule exists extend it
                        if (RULES[key]) _.extend(RULES[key], rule);

                        //else create key rule
                        else RULES[key] = rule;
                }

                return {
                        'id': parent.getAttribute('id'),
                        'rules': RULES
                };
        };

        PrototypeProcessor.applyPrototypes = function (xml, proto) {

                //get target node
                var node = Sizzle('#' + proto.id, xml)[0];

                var XML = node || xml;

                var RULES = proto.rules;

                var RESOLVED_PROTO_ATTRS = {};

                var applyProtoAttributes = function applyProtoAttributes(node, attrs) {

                        var id = node.getAttribute('id') || node.getAttribute('id');

                        _.each(attrs, function (value, key, list) {

                                //all values should/must be strings
                                if (!_.isString(value)) return;

                                //important flag? starting with '!'
                                //important values will overwrite node attribute values
                                if (value.indexOf('!') === 0) {

                                        //remove '!' so it does not apply to node attributes
                                        value = value.substr(1);

                                        //apply attr value into node using temp namespace
                                        node.setAttribute(key, value);
                                } else {

                                        //apply using temp namespace
                                        if (!RESOLVED_PROTO_ATTRS[id]) RESOLVED_PROTO_ATTRS[id] = {};

                                        RESOLVED_PROTO_ATTRS[id][key] = value;

                                        //node.setAttribute('temp-'+key,value);
                                }
                        });
                };

                //APPLY PROTOTYPES

                _.each(RULES, function (value, key, list) {

                        //get matching nodes
                        var nodes = Sizzle(key, XML);

                        //include document itself to nodes list
                        if (Sizzle.matchesSelector(XML, key)) nodes.unshift(XML);

                        //get proto attrs
                        var attrs = RULES[key];

                        //apply attrs to each matching node
                        if (nodes.length > 0 && attrs) {

                                _.each(nodes, function (item, index) {

                                        applyProtoAttributes(item, attrs);
                                });
                        }
                });

                //APPLY RESOLVED PROTOTYPES

                _.each(RESOLVED_PROTO_ATTRS, function (attrs, nodeId, collection) {

                        if (!_.isString(nodeId) || nodeId === "") return;

                        //var node = INDEX_CACHE[nodeId];
                        //var node = Sizzle.matchesSelector(XML,'#'+nodeId);
                        //var node = Sizzle.matchesSelector(XML.documentElement,'#'+nodeId);
                        //WARNING!!!!!!!! IE8 FAILS!!!!
                        //var node = XML.getElementById(nodeId);
                        //.getElementById is not supported for XML documents
                        var node = XML.getAttribute('id') === nodeId ? XML : Sizzle('#' + nodeId, XML)[0];

                        //node = node[0];

                        if (node) {
                                _.each(attrs, function (value, key, list) {

                                        if (_.isEmpty(node.getAttribute(key))) {

                                                node.setAttribute(key, value);
                                        }
                                });
                        }
                });

                return XML;
        };

        //expose into global smx namespace
        smx.proto = PrototypeProcessor;
})(window, window.Sizzle, window.smx);
//# sourceMappingURL=PrototypeParser.js.map
;'use strict';

////////////////////////////////
// smx plugin
// METADATA PARSER
// will transform all <metadata> nodes
// convert first level children nodes into meta-* attributes
// and apply those attributes to direct parent node

/**
 * SMX Metadata class
 * @class Metadata
 */

(function (global, Sizzle, smx) {

        //private aux debug system
        var DEBUG = true;var LOG = function LOG(str) {
                if (global.console && global.console.log && DEBUG) global.console.log('METADATA ' + str);
        };

        var MetadataParser = {};

        //local helper
        var escapeHtml = function escapeHtml(text) {
                var map = {
                        '&': '&amp;',
                        '<': '&lt;',
                        '>': '&gt;',
                        '"': '&quot;',
                        "'": '&#039;'
                };
                return text.replace(/[&<>"']/g, function (m) {
                        return map[m];
                });
        };

        MetadataParser.parseXML = function (xml, opt) {

                var XML = xml;

                //validate XML
                if (!XML) return;

                //normalize options
                var options = _.extend({
                        data: {},
                        callback: function callback() {
                                return;
                        },
                        total: 0,
                        nodes: null,
                        max_iterations: 100
                }, opt);

                // get all unparsed nodes based on flag attr
                // `metadata-processed` attribute is added while parsing process
                // nodes missing the flag attr are the nodes we need to parse
                var nodes;
                if (!options.nodes) {
                        /*
                        var selector = [];
                        selector.push('*'); //get all nodes as starting point
                        selector.push(':not(prototype)'); //ignore prototype elements
                        selector.push(':not(metadata *)'); //ignore contents of metadata elements
                        selector.push(':not([metadata-processed])'); //ignore already processed nodes
                        selector.push(':not([type] *)'); //ignore contents of nodes having type attribute
                        */
                        //using Sizzle.selectors.filters.meta.js
                        var selector = ['metadata,:meta'];
                        nodes = Sizzle(selector.join(''), XML);
                        //include root node itself to the list
                        nodes.unshift(XML);
                } else nodes = options.nodes;

                //calculate percent progress
                if (nodes.length > options.total) options.total = nodes.length;
                var percent = Math.floor(100 - nodes.length * 100 / options.total);

                LOG('PARSING... (' + (options.total - nodes.length) + '/' + options.total + ') ' + percent + '%');

                var i = 0;

                while (nodes.length && i < options.max_iterations) {

                        var node = nodes.shift();

                        var result;

                        if (node.nodeType == 1) {

                                result = node.nodeName == 'metadata' ? this.parseMetadataNode(node) : this.parseMetaAttributes(node);

                                if (result) {

                                        //create node data object if does not exists yet
                                        if (!options.data[result.id]) options.data[result.id] = {};

                                        //extend parent data object
                                        if (!_.isEmpty(result.data)) _.extend(options.data[result.id], result.data);
                                }
                        }

                        i++;
                }

                //more nodes to parse?
                if (nodes.length) {

                        _.delay(_.bind(function () {
                                this.parseXML(XML, {
                                        data: options.data,
                                        callback: options.callback,
                                        total: options.total,
                                        nodes: nodes
                                });
                        }, this), 0);
                }
                //complete! no more nodes to parse
                else {

                                //remove all existing metadata-processed attributes
                                LOG('REMOVING FLAGS...');
                                var flagged_nodes = Sizzle('[metadata-processed]', XML);
                                _.each(flagged_nodes, function (node) {
                                        node.removeAttribute('metadata-processed');
                                });

                                LOG('COMPLETE! (' + options.total + '/' + options.total + ') 100%');

                                try {

                                        options.callback(XML, options.data);
                                } catch (e) {

                                        LOG('CALLBACK ERROR! ' + e.toString());
                                }
                        }

                return;
        };

        MetadataParser.parseMetadataNode = function (node) {

                //metadata node is required...
                if (!node || node.nodeName !== 'metadata') return;

                //get direct metadata parent node
                var parent = node.parentNode;

                //no parent node? wtf!!
                if (!parent) return;

                //node id which to attach data parsed
                var id = parent.getAttribute('id');

                //instance returning data object
                var data = {};

                //get and remove metadata node from parent
                var md = parent.removeChild(node);

                for (var c = 0; c < md.childNodes.length; c++) {

                        var xmlNode = md.childNodes[c];

                        var key = xmlNode.nodeName;

                        var value;

                        if (xmlNode.innerHTML) {

                                //is <![CDATA ???
                                var is_cdata = (xmlNode.innerHTML + '').indexOf('<![CDATA') >= 0;

                                if (is_cdata) {

                                        var _chilNodes = xmlNode.childNodes;

                                        var _cdata,
                                            i = 0;

                                        while (!_cdata && i < _chilNodes.length) {

                                                var _node = _chilNodes[i];

                                                if (_node && _node.nodeType === 4) _cdata = _node;

                                                i++;
                                        }

                                        if (_node) value = escapeHtml(_cdata.textContent + '');else value = xmlNode.innerHTML;
                                } else {

                                        value = xmlNode.innerHTML;

                                        //trim unwanted trailing and leading whitespace
                                        value = (value + '').replace(/^\s+|\s+$/gm, '');
                                }
                        } else {

                                var childs = xmlNode.childNodes;

                                var str = '';

                                if (childs.length) {
                                        _.each(childs, function (item, index) {
                                                str += item.xml || new XMLSerializer().serializeToString(item);
                                        });
                                }

                                value = str;

                                //trim unwanted trailing and leading whitespace
                                value = (value + '').replace(/^\s+|\s+$/gm, '');
                        }

                        //ignore text nodes, comment nodes, ...
                        if (xmlNode.nodeType == 1) data[key] = value;
                }

                return {
                        'data': data,
                        'id': id
                };
        };

        MetadataParser.parseMetaAttributes = function (node) {

                if (!node) return;

                //instance the resultant data object
                var data = {};

                //node id which to attach data parsed
                var id = node.getAttribute('id');

                //get data from node attributes
                var attrs = node.attributes;

                var names = _.map(attrs, 'name');
                var values = _.map(attrs, 'value');

                var len = attrs.length;

                for (var i = 0; i < len; i++) {
                        var name = names[i];
                        var value = values[i];
                        if (name.indexOf("meta-") == 0) {

                                //remove meta- preffix
                                name = name.substr(5);

                                //trim unwanted trailing and leading whitespace
                                value = (value + '').replace(/^\s+|\s+$/gm, '');

                                //set new data entry
                                data[name] = value;

                                //remove the attribute
                                node.removeAttribute("meta-" + name);
                        }
                }

                //flag node with "metadata-processed" attr
                node.setAttribute('metadata-processed', 'true');

                return {
                        'data': data,
                        'id': id
                };
        };

        //expose into global smx namespace
        smx.meta = MetadataParser;
})(window, window.Sizzle, window.smx);
//# sourceMappingURL=MetadataParser.js.map
;"use strict";

/**
 * Extends SMXNode with utility attribute getters
 * @module Node/Metadata
 */

(function (global, smx) {

            if (!smx.fn) smx.fn = {};

            smx.fn.MetadataInterface = {

                        /**
                         * Gets the metadata field value for the given associated to the node
                         *
                         * @method meta
                         * @param {String} key - key name of meta field
                         * @param {String=} lang - langcode
                         * @return {String}
                         */
                        meta: function meta(key, lang) {

                                    var value;

                                    try {

                                                value = $meta[this.id][key];
                                    } catch (e) {}

                                    return value;
                        },

                        /**
                         * This method is like `meta` but will return an interpolated version
                         * using the node as interpolation context object.
                         *
                         * @method interpolate
                         * @param {String} key - key name of meta field
                         * @param {String=} lang - langcode
                         * @return {String}
                         */
                        interpolate: function interpolate(key, lang) {

                                    var str = this.meta(key, lang);

                                    if (!_.isString(str)) return;

                                    var settings = { interpolate: /\{\{(.+?)\}\}/g };

                                    var result;

                                    try {
                                                result = _.template(str, this, settings);
                                    } catch (e) {}

                                    return result;
                        }

            };
})(window, window.smx);
//# sourceMappingURL=MetadataInterface.js.map
;'use strict';

Sizzle.selectors.filters.meta = function (elem, i, match) {
    var preffix = 'meta-';
    var regex = new RegExp('\\s*' + preffix + '\\w*="', 'ig');
    var attrs = elem.attributes;
    var str = [];
    str.push('<' + elem.nodeName);
    for (var i = 0; i < attrs.length; i++) {
        str.push(attrs[i].nodeName + '="' + attrs[i].nodeValue + '"');
    }
    str.push('>');
    str = str.join(' ');

    return regex.test(str);
};
//# sourceMappingURL=Sizzle.selectors.filters.meta.js.map
;'use strict';

(function (global, _, smx) {

    var methods = {

        /**
        * get collection of node's tags
        * @return {Array.<String>}
        */
        tags: function tags(namespace) {

            //default result is an empty array
            var results = [];

            //get comma separetd array from tags attribute
            var values = this.dsv('tags', ',');

            //namespace filter
            if (_.isString(namespace) && namespace.length > 1) {
                var ns = namespace;
                results = _.filter(results, function (r) {
                    return (r + '').indexOf(ns + '-') === 0;
                });
            }

            return results;
        },

        /**
        * get collection of categories
        * @return {Array.<String>}
        */
        categories: function categories(namespace) {

            //default result is an empty array
            var results = [];

            //get comma separetd array from tags attribute
            var values = this.dsv('categories', ',');

            //namespace filter
            if (_.isString(namespace) && namespace.length > 1) {
                var ns = namespace;
                results = _.filter(results, function (r) {
                    return (r + '').indexOf(ns + '-') === 0;
                });
            }

            return results;
        },

        /**
        * get collection of node's branches
        * @return {Array.<String>}
        */
        branches: function branches() {

            //default result is an empty array
            var results = [];

            //get comma separetd array from tags attribute
            var ids = this.dsv('branches', ',');

            //get parent document
            var doc = this.root();

            //maps ids into nodes
            results = _.map(values, doc.gid);

            //remove not found ids from results
            results = _.compact(results);

            return results;
        }

    };

    //expose to global
    smx.fn = _.extend(smx.fn, { TaxonomyAttrInterface: methods });
})(window, window._, window.smx);
//# sourceMappingURL=TaxonomyInterface.js.map
;'use strict';

(function (global, _, Sizzle, smx) {

    /**
     * Placeholder namespace to contain Node extensions
     * @namespace fn
     * @memberof smx
     */

    var fn = {};

    ////////////////////////////////
    // UI ATTRIBUTES INTERFACE
    // shortcut for UIAttrController.get
    // definend in smx/document/UIAttrController.js

    /**
     * UserInterface Methods
     * @module Node/UI
     */

    fn.UIAttrInterface = {

        /**
        *   @method ui
        */
        ui: function ui(key, type) {

            return smx.UIAttrController.get(this, key, type);
        }

    };

    ////////////////////////////////
    // TIME INTERFACE
    // 'time' attributes namespace
    // definend in smx/document/TimeAttrController.js

    /**
     * Time Interface Methods
     * @module Node/Time
     */
    fn.TimeInterface = {

        /**
        *   @method time
        */
        time: function time(key) {

            return smx.TimeAttrController.get(this, key);
        },

        /**
        *   @method synchronize
        */
        synchronize: function synchronize() {

            /*
            //get 'timing' attribute value
            var is_timed = this.time('timed');
            var is_timeline = this.time('timeline');
              //check if node need to be sync
            if (!is_timed && !is_timeline){
                  this.duration=0;
                this.start=0;
                  //do not use 'sync' attribute so flag it with 'is-sync'
                this[0].setAttribute('is-sync','true');
                  return;
            }
            */

            //update sync values (start, duration)
            var force_sync = true;
            var duration = this.time('duration', force_sync);
            var start = this.time('start', force_sync);

            return;
        }

    };

    //extends smx fn methods
    smx.fn = !smx.fn ? fn : Object.assign(smx.fn, fn);
})(window, window._, window.Sizzle, window.smx);
//# sourceMappingURL=fn.js.map
;'use strict';

(function (global, _, Sizzle, smx) {

    /**
     * Extends SMXNode with core methods
     * @mixin Core
     * @memberof smx.fn
     */

    var Core = {

        /**
         * Gets the index position in parent's children. If node has no parent,
         * will return 0. When using the optional parameter `selector`, the
         * resultant index is calculated based only in the sibling nodes matching
         * the given selector, if node does not match the selector itself will
         * return -1.
         *
         * @memberof smx.fn.Core
         * @param {String=} selector - filter selector
         * @return {Integer}
         */
        getIndex: function getIndex(selector) {

            //0 by default
            var index = 0;

            //no parent? its kind of root so it has no sibling nodes
            if (!this.parent) return index;

            //get sibling nodes
            var siblings = this.parent.children;

            //filter siblings collection with a css selector if its defined
            if (selector) siblings = siblings.filter(function (s) {
                return Sizzle.matchesSelector(s[0], selector);
            });

            //get position in siblings collection
            index = siblings.indexOf(this);

            return index;
        },

        /**
         * Gets the text content.
         *
         * @memberof smx.fn.Core
         * @return {String}
         */
        getText: function getText() {

            return this[0].text || this[0].textContent || '';
        },

        /**
         * Gets the html content.
         *
         * @memberof smx.fn.Core
         * @return {String}
         */
        getHTML: function getHTML() {

            //get raw children XMLNodes
            var children = this[0].childNodes;

            //defaults to empty string
            var str = '';

            for (var i = 0, len = children.length; i < len; i++) {
                str += children[i].xml || new XMLSerializer().serializeToString(children[i]);
            }return str;
        },

        /**
         * Gets the string representation.
         *
         * @memberof smx.fn.Core
         * @return {String}
         */
        toString: function toString() {

            return ('<' + this.name + ' id="' + this.id + '">').trim();
        },

        /**
         * Gets the JSON representation. NOT IMPLEMENTED
         * @method toJSON
         * @memberof smx.fn.Core
         * @return {Object}
         */
        toJSON: function toJSON() {
            return {}; //not implemented...
        }

    };

    //extends smx fn methods
    smx.fn = !smx.fn ? { Core: Core } : Object.assign(smx.fn, { Core: Core });
})(window, window._, window.Sizzle, window.smx);
//# sourceMappingURL=Node.Core.js.map
;'use strict';

(function (global, Sizzle, smx) {

    /**
     * Extends SMXNode with utility attribute getters
     * @mixin AttributeGetters
     * @memberof smx.fn
     */

    var AttributeGetters = {

        /**
         * Gets the value for the given attribute name.
         *
         * @memberof smx.fn.AttributeGetters
         * @param {String} name - attribute name
         * @return {String} value
         * @example
         * <movie tags="sci-fi, horror, adventures" />
         * @example
         * $movie.attr('tags')
         * // => "sci-fi, horror, adventures"
         */
        attr: function attr(name) {

            return this[0].getAttribute(name);
        },

        /**
         * This method is like `attr` but will use an attribute parser if there is
         * one predefined for the given attribute name.
         *
         * @memberof smx.fn.AttributeGetters
         * @param {String} name - attribute name
         * @param {Object=} opt - options to pass into attribute parser
         * @return {String} value
         */
        get: function get(name, opt) {

            //get an existing attribute parser for the given name
            var parser = smx.AttributeParsers[name];

            //no parser? return the raw attribute
            if (!parser) return this.attr(name);

            //else use the parser with the given options
            else return parser(name, opt);
        },

        /**
         * Checks if node has or not an attribute with the given name
         * @method has
         * @memberof smx.fn.AttributeGetters
         * @param {String} name - attribute name
         * @return {Boolean}
         */
        has: function has(name) {
            //return this[0].hasAttribute(name);
            //IE8 does not support XMLNode.hasAttribute, so...
            return this[0].getAttribute(name) !== null;
        },

        /**
         * Gets Delimiter Separated Value
         * An utility method converts given attribute value into dsv array
         * @method dsv
         * @memberof smx.fn.AttributeGetters
         * @param name {String} the name of the attribute
         * @param delimiter {String=} delimiter string
         * @return {Array.<String>}
         * @example
         * <movie tags="sci-fi, horror, adventures">
         * @example
         * $movie.dsv('tags',',')
         * // => ["sci-fi", "horror", "adventures"]
         */
        dsv: function dsv(name, delimiter) {

            //ignore undefined attributes
            if (!this.has(name)) return;

            //get attr's value by name
            var value = this.attr(name);

            //resolve delimiter, defaults to space
            var d = delimiter || ' ';

            //if attribute exists value must be String
            if (typeof value != 'string') return [];

            //split value by delimiter
            var list = value.split(delimiter);

            //trim spaces nicely handling multiple spaced values
            list = list.map(function (str) {

                //convert multiple spaces, tabs, newlines, etc, to single spaces
                str = str.replace(/^\s+/, '');

                //trim leading and trailing whitespaces
                str = str.replace(/(^\s+|\s+$)/g, '');

                return str;
            });

            //remove empty like values
            list = list.filter(function (str) {
                return value !== '' && value !== ' ';
            });

            return list;
        }

    };

    //extend smx fn methods
    smx.fn = !smx.fn ? { AttributeGetters: AttributeGetters } : Object.assign(smx.fn, { AttributeGetters: AttributeGetters });
})(window, window.Sizzle, window.smx);
//# sourceMappingURL=Node.AttributeGetters.js.map
;'use strict';

(function (global, _, Sizzle, smx) {

  /**
   * Extends SMXNode with utility tree node methods
   * @mixin TreeNode
   * @memberof smx.fn
   */

  var TreeNode = {

    // PARENT RELATED OPERATIONS

    /**
     * Gets a list of parent nodes up to root
     * @method parents
     * @memberof smx.fn.TreeNode
     * @return {SMXNode[]}
     */
    getAncestors: function getAncestors(selector) {

      if (!selector) return this.ancestors;
      if (!this[0].parentNode) return [];else {
        var parent = this.parent();
        var parents = [parent];
        while (parent && parent.parent()) {
          parent = parent.parent();
          if (parent) parents.unshift(parent);
        }
        return $smx(parents);
      }
    },

    // EXTRA - PARENT RELATED OPERATIONS

    /**
     * Checks if node is a parent of another
     * @method isParentOf
     * @memberof smx.fn.TreeNode
     * @param {SMXNode} node - reference node
     * @return {Boolean}
     */
    isParentOf: function isParentOf(node) {

      //validate given node (smx node required)
      if (!node.parents) return false;

      var parentsId = _.map(node.parents(), 'id');
      if (_.includes(parentsId, this.id)) return true;else return false;
    },

    // CHILD RELATED OPERATIONS

    /**
     * get node by identifier
     * @method getNodeById
     * @memberof smx.fn.TreeNode
     * @alias gid
     * @return {SMXNode}
     */
    getNodeById: function getNodeById(id) {

      //is nodes cache array?
      if ($smx.cache[id]) return $smx.cache[id];

      //search in document
      var node = Sizzle('#' + id, this[0]);
      if (node.length > 0) return $smx(node[0]);

      //not found
      return;
    },

    gid: function gid(id) {
      return this.getNodeById(id);
    },

    /**
     * Checks if node matches the given selector
     * @method isMatch
     * @memberof smx.fn.TreeNode
     * @param {String} selector - css selector to match
     * @return {Boolean}
     */
    isMatch: function isMatch(selector) {

      return Sizzle.matchesSelector(this[0], selector);
    },

    /**
     * Finds all descendant nodes matching the given selector
     * @method find
     * @memberof smx.fn.TreeNode
     * @param {String} selector - search selector
     * @return {Array.<Node>}
     */
    find: function find(selector) {

      if (!this.children.length) return [];
      if (!selector) return [];
      var nodes = Sizzle(selector, this[0]);
      if (nodes.length) nodes = _.uniqBy(nodes, 'id');
      return $smx(nodes);
    },

    /**
     * This method is like `find` but returns only the first result
     * @method one
     * @memberof smx.fn.TreeNode
     * @param {String} selector - search selector
     * @return {SMXNode}
     */
    one: function one(selector) {

      return this.find(selector)[0];
    },

    /**
     * get child nodes
     * @method getChildren
     * @memberof smx.fn.TreeNode
     * @param {String=} selector
     * @return {Array.<Node>}
     */
    getChildren: function getChildren(selector) {

      if (!selector) return this.children;

      return this.children.map(function (n) {
        return Sizzle.matchesSelector(n, selector);
      });
    },

    /**
     * Get the first child node
     * @method getFirst
     * @memberof smx.fn.TreeNode
     * @param {String=} selector
     * @return {SMXNode}
     */
    getFirst: function getFirst(selector) {

      if (!selector) return this.first;

      var children = this.children;
      var i = 0,
          len = children.length,
          result;
      while (i < len && !result) {
        if (Sizzle.matchesSelector(children[i], selector)) result = children[i];
        i++;
      }
    },

    /**
     * Gets the last child node
     * @method getLast
     * @memberof smx.fn.TreeNode
     * @param {String=} selector
     * @return {SMXNode}
     */
    getLast: function getLast(selector) {

      if (!selector) return this.last;

      var children = this.children.reverse();
      var i = 0,
          len = children.length,
          result;
      while (i < len && !result) {
        if (Sizzle.matchesSelector(children[i], selector)) result = children[i];
        i++;
      }
    },

    // EXTRA - CHILD RELATED OPERATIONS

    /**
     * Gets child node at given index
     * @method getChildAt
     * @memberof smx.fn.TreeNode
     * @param {Integer} index - index position
     * @return {SMXNode}
     */
    getChildAt: function getChildAt(index) {

      return this.children[index];
    },

    /**
     * Checks if a node is child of another
     * @method isDescendantOf
     * @memberof smx.fn.TreeNode
     * @param {SMXNode} node - reference node
     * @return {Boolean}
     */
    isDescendantOf: function isDescendantOf(node) {

      //validate given node (smx node required)
      if (!node.parent) return false;

      var parentsId = _.map(this.ancestors, 'id');
      if (_.includes(parentsId, node.id)) return true;else return false;
    },

    // SIBLING RELATED OPERATIONS


    /**
     * Gets next sibling node
     * @method next
     * @memberof smx.fn.TreeNode
     * @param {String=} selector - filter selector
     * @return {SMXNode}
     */
    getNext: function getNext(selector) {
      var el = this[0].nextElementSibling || this[0].nextSibling;
      return selector ? Sizzle.matchesSelector(el, selector) ? $smx(el) : undefined : $smx(el);
    },

    /**
     * Gets previous sibling node
     * @method previous
     * @memberof smx.fn.TreeNode
     * @param {String=} selector - filter selector
     * @return {SMXNode}
     */
    getPrevious: function getPrevious(selector) {
      var el = this[0].previousElementSibling || this[0].previousSibling;
      return selector ? Sizzle.matchesSelector(el, selector) ? $smx(el) : undefined : $smx(el);
    }

    // FLAT TREE SIBLINGS

    /**
     * Gets previous node in a flat tree
     * @method getStepBack
     * @memberof smx.fn.TreeNode
     * @return {SMXNode}
     
    stepBack: function(){
         //previousSibling?
        var _prev_sibling_node = this.previous();
        if(_prev_sibling_node) return $smx(_prev_sibling_node);
         //parentNode?
        var _parent_node = this.parent();
        if(_parent_node) return $smx(_parent_node);
         //nothing found...
        return;
     },
    */

    /**
     * get next node in a flat tree
     * @method getStepForward
     * @memberof smx.fn.TreeNode
     * @return {SMXNode}
    
    stepForward: function(from_last_child){
         //in recursive calls indicate if last recursion come from lastChild of its parent
        var _from_last_child = (from_last_child)? from_last_child : false;
         // 1. use children, trying to get deep inside node
        // if (_from_last_child) means we arleady searched on childNodes and avoid it
        // we avoid children when content is not smx
        if (!_from_last_child && this.get('type')==='smx' && !this.time('timed')){
             var _first_childnode = this.first();
             if (_first_childnode.get('type')==='smx' ){
                return $smx(_first_childnode);
            }
        }
         //2. search nextSibling:
        var _next_sibling_node = this.next();
        if(_next_sibling_node) return $smx(_next_sibling_node);
         //3. search on parentNode
        var _parent_node = this.parent();
        if(_parent_node) return $smx(_parent_node.stepForward(true));
         //4. nothing found: return null!!
        return;
     }
    */
  };

  //extends smx fn methods
  smx.fn = !smx.fn ? { TreeNode: TreeNode } : Object.assign(smx.fn, { TreeNode: TreeNode });
})(window, window._, window.Sizzle, window.smx);
//# sourceMappingURL=Node.TreeNode.js.map
;'use strict';

(function (smx) {

    /**
     *  TIME ATTR CONTROLLER
     *  Plugin Controller for attributes namespace with 'ui'
     *  @module TimeAttrController
     */

    var TimeAttrController = {

        'getters': {

            'timeline': function timeline(node) {
                return node.attr('timeline') === 'true';
            },

            'timed': function timed(node) {

                var is_in_timeline = false;
                var is_timeline = this.timeline(node);

                if (is_timeline) return false;else {
                    var parent = node.parent;
                    while (parent && !this.timeline(parent)) {
                        parent = parent.parent;
                    }

                    if (!parent) return false;else if (this.timeline(parent)) return true;else return false;
                }
            },

            'timing': function timing(node) {
                return node.attr('timing') === 'absolute' ? 'absolute' : 'relative';
            },

            'duration': function duration(node, force_sync) {

                //use local value if already exists...
                if (!force_sync && _.isNumber(node.duration)) return node.duration;

                //has duration attribute?
                var duration = parseInt(node.attr('duration'));
                if (_.isNaN(duration) || duration < 0) duration = NaN;

                //sync start for
                var start = this.start(node);

                //try child summatory
                if (_.isNaN(duration)) {
                    var childs = node.children;
                    childs = childs.reverse();
                    if (childs.length > 0) {
                        // childs will define duration using
                        // the child with the highest offset+duration value
                        var max = 0;
                        for (var n = 0; n < childs.length; n++) {
                            var child = childs[n];
                            var sum = this.offset(child) + this.duration(child, force_sync);
                            if (sum > max) max = sum;
                        }
                        duration = max;
                    } else if (!node.next && !node.previous) {
                        duration = 0;
                    }
                }

                //check next sibling dependencies
                if (_.isNaN(duration) && this.timed(node)) {

                    //get parent
                    var parent = node.parent;

                    if (parent && _.isNumber(parent.duration)) {

                        //get next sibling with absolute timing
                        var next = node.next;
                        var target = null;
                        while (next && !target) {
                            if (this.timing(next) == 'absolute') target = next;else next = next.next;
                        }

                        if (target) {
                            if (_.isNumber(target.start) && _.isNumber(node.start)) {
                                duration = parseInt(this.offset(next) - node.start);
                                if (_.isNaN(duration) || duration < 0) duration = NaN;
                            }
                        } else {
                            duration = parseInt(this.duration(parent) - node.start);
                            if (_.isNaN(duration) || duration < 0) duration = NaN;
                        }
                    } else {
                        duration = NaN;
                    }
                }

                if (_.isNaN(duration) && !this.timed(node)) {
                    duration = 0;
                }

                //could not determine duration? set to 0
                if (_.isNaN(duration)) {
                    duration = 0;
                } else {
                    //create sync flag attribute
                    node[0].setAttribute('is-sync', 'true');
                }

                //set local value
                node.duration = duration;

                //return local value
                return node.duration;
            },

            'start': function start(node, force_sync) {

                var start;

                //bool flag use or not local value if exists
                if (!force_sync) {

                    //has local value?
                    start = node.attr('start');
                    if (_.isNumber(start)) return start;
                }

                //get it from attribute
                start = parseInt(node.attr('start'));
                if (_.isNaN(start) || start < 0) start = 0;

                //set local value
                node.start = start;

                //return local value
                return start;
            },

            'offset': function offset(node, from) {

                var offset = 0;
                var timing = this.timing(node);

                var start = this.start(node);

                if (timing == 'absolute') {
                    //absolute timing
                    //depends on parent node

                    offset = start;
                } else {
                    //relative timing
                    //depends on previous sibling node

                    var prev = node.previous;

                    if (prev) offset = this.offset(prev) + this.duration(prev) + start;else offset = start;
                }

                if (!from) return offset;

                if (!from.isParentOf(node)) offset = -1;else {

                    var parent = node.parent;
                    if (!parent) offset = -1;
                    /////????????????????????????
                    else if (parent != from) offset = this.offset(parent, from) + offset;
                }

                return offset;
            },

            'end': function end(node) {
                return this.start(node) + this.duration(node);
            }

        },

        'get': function get(node, key) {

            if (_.isFunction(this.getters[key])) {
                return this.getters[key](node);
            } else return;
        }

    };

    //expose into global smx namespace
    smx.TimeAttrController = TimeAttrController;
})(window.smx);
//# sourceMappingURL=smx.TimeAttrController.js.map
;'use strict';

(function (smx) {

    /**
     *  UI ATTR CONTROLLER
     *  Plugin Controller for attributes namespaced with 'ui-'
     *  @module UIAttrController
     */

    var UIAttrController = {

        'MEDIA_TYPES': ['screen', 'print', 'tv'],

        'get': function get(node, key, media_type) {

            //resolve 'media' value
            media_type = this.normalizeMediaType(media_type);

            //get 'ui-type-key' attr
            var asset = node.attr('ui-' + media_type + '-' + key);

            //no typed key? use generic 'ui-key'
            if (_.isEmpty(asset)) asset = node.attr('ui-' + key);

            //resolve asset url
            if (!_.isEmpty(asset)) return this.resolveURL(node, asset);

            return;
        },

        'normalizeMediaType': function normalizeMediaType(type) {

            if (_.isEmpty(type)) return this.MEDIA_TYPES[0];

            if (_.includes(this.MEDIA_TYPES, type)) return type;else return this.MEDIA_TYPES[0];
        },

        'resolveURL': function resolveURL(node, asset) {

            //starts with '$/' means package root
            if (asset.substr(0, 2) == '$/') asset = node.root().get('url') + asset.substr(2);
            //starts with './' means app root
            else if (asset.substr(0, 2) == './') asset = asset.substr(2);
                //else is relative to node
                else asset = node.get('url') + asset;

            return asset;
        }

    };

    //expose into global smx namespace
    smx.UIAttrController = UIAttrController;
})(window.smx);
//# sourceMappingURL=smx.UIAttrController.js.map
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (global, smx) {

    /**
     * SMX Node Class
     * @memberof smx
     * @mixes smx.fn.Core
     * @mixes smx.fn.TreeNode
     */
    var Node = function () {

        /**
         * @param {XMLNode} xmlNode
         */
        function Node(xmlNode) {
            _classCallCheck(this, Node);

            /**
             * Original XMLNode for reference
             * @type {XMLNode}
             * @readonly
             */
            this[0] = xmlNode;
        }

        /**
         * Direct access to XMLNode.id
         * @type {String}
         * @readonly
         */


        _createClass(Node, [{
            key: 'id',
            get: function get() {
                return this[0].id;
            }

            /**
             * Direct access to XMLNode name
             * @type {String}
             * @readonly
             */

        }, {
            key: 'name',
            get: function get() {
                return this[0].nodeName;
            }

            /**
             * Gets node name based on inner XMLNode.nodeName,
             * default is `smx`, posible values are `txt`, `md`, `html`, ...
             * @type {String}
             * @readonly
             */

        }, {
            key: 'type',
            get: function get() {
                return this[0].getAttribute('type') || 'smx';
            }

            /**
             * Gets node className based on inner XMLNode class attribute
             * @type {String}
             * @readonly
             */

        }, {
            key: 'className',
            get: function get() {
                return this[0].getAttribute('class');
            }

            /**
             * Gets browser url hash
             * @type {String}
             * @readonly
             */

        }, {
            key: 'hash',
            get: function get() {
                return '#!/' + this.uri;
            }

            /**
             * Gets Uniform Resource Identifier.
             * Concatenation of id values from parent nodes up to document root
             * @type {String}
             * @readonly
             */

        }, {
            key: 'uri',
            get: function get() {
                var hash = this.id + '/';
                if (this.parent) return this.parent.uri + hash;else return hash;
            }

            /**
             * Gets Uniform Resource Locator
             * Concatenation of path values from parent nodes up to document root
             * @type {String}
             * @readonly
             */

        }, {
            key: 'url',
            get: function get() {
                var path = this.attr('path');
                var result;
                if (this.parent) {
                    if (!path) result = this.parent.url;else {
                        //add trail slash
                        var trail = path.substr(-1);
                        if (trail != '/') path += '/';
                        result = this.parent.url + path;
                    }
                } else {
                    if (path) {
                        //add trail slash
                        var _trail = path.substr(-1);
                        if (_trail != '/') path += '/';
                        result = path;
                    }
                }
                if (result) result = result.replace(/\/\/+/g, '/');
                return result;
            }

            /**
             * Gets source file url for this node
             * @type {String}
             * @readonly
             */

        }, {
            key: 'src',
            get: function get() {

                var result = '';
                var file = this.attr('file');

                if (!file) result = this.parent ? this.parent.src : undefined;else result = this.url + file;

                if (result) result = result.replace(/\/\/+/g, '/');

                return result;
            }

            /**
             * Direct access to XMLNode.ownerDocument
             * @type {XMLDocument}
             * @readonly
             */

        }, {
            key: 'document',
            get: function get() {
                return this[0].ownerDocument;
            }

            /**
             * Gets parent node
             * @type {SMXNode}
             * @readonly
             */

        }, {
            key: 'parent',
            get: function get() {
                return $smx(this[0].parentNode);
            }

            /**
             * Gets ancestors nodes
             * @type {SMXNode[]}
             * @readonly
             */

        }, {
            key: 'ancestors',
            get: function get() {
                var a = [];
                var p = this;
                while (p.parent) {
                    p = p.parent;
                    a.push(p);
                }
                return a;
            }

            /**
             * Gets root node
             * @type {SMXNode}
             * @readonly
             */

        }, {
            key: 'root',
            get: function get() {
                return this.ancestors[0];
            }

            /**
             * Gets children nodes
             * @type {SMXNode[]}
             * @readonly
             */

        }, {
            key: 'children',
            get: function get() {
                //non smx nodes should have no children
                if (this.type !== 'smx') return [];
                return $smx(this[0].childNodes);
            }

            /**
             * Gets first child node
             * @type {SMXNode}
             * @readonly
             */

        }, {
            key: 'first',
            get: function get() {
                return this.children.shift();
            }

            /**
             * Gets last child node
             * @type {SMXNode}
             * @readonly
             */

        }, {
            key: 'last',
            get: function get() {
                return this.children.pop();
            }

            /**
             * Gets previous sibling node
             * @type {SMXNode}
             * @readonly
             */

        }, {
            key: 'previous',
            get: function get() {
                return $smx(this[0].previousElementSibling || this[0].previousSibling);
            }

            /**
             * Gets next sibling node
             * @type {SMXNode}
             * @readonly
             */

        }, {
            key: 'next',
            get: function get() {
                return $smx(this[0].nextElementSibling || this[0].nextSibling);
            }
        }]);

        return Node;
    }();

    //Object.defineProperty(Node.prototype, 'duration', { get: function() { return this.time('duration'); } });

    //extend Node prototype

    for (var key in smx.fn) {
        Object.assign(Node.prototype, smx.fn[key]);
    }

    //expose
    smx.Node = Node;
})(window, window.smx);
//# sourceMappingURL=Node.js.map
;"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

(function (global, smx) {

  /**
   * SMX Document Class
   * @extends smx.Node
   * @memberof smx
   */
  var Document = function (_smx$Node) {
    _inherits(Document, _smx$Node);

    /**
     * @param {XMLNode} xmlNode
     */
    function Document(xmlNode) {
      _classCallCheck(this, Document);

      return _possibleConstructorReturn(this, (Document.__proto__ || Object.getPrototypeOf(Document)).call(this, xmlNode));

      /**
       * playhead controller
       * @type {Playhead}
       */
      //this.playhead = new smx.Playhead(this);

      /**
       * tracking controller
       * @type {Tracking}
       */
      //this.tracking = new smx.Tracking(this);
    }

    return Document;
  }(smx.Node);

  //expose


  smx.Document = Document;
})(window, window.smx);
//# sourceMappingURL=Document.js.map
