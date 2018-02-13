/*!
 * Sizzle CSS Selector Engine v2.3.3
 * https://sizzlejs.com/
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2016-08-08
 */
(function( window ) {

var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + 1 * new Date(),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf as it's faster than native
	// https://jsperf.com/thor-indexof-vs-for/5
	indexOf = function( list, elem ) {
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {
			if ( list[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",

	// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +
		// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
		"*\\]",

	pseudos = ":(" + identifier + ")(?:\\((" +
		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rwhitespace = new RegExp( whitespace + "+", "g" ),
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + identifier + ")" ),
		"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
		"TAG": new RegExp( "^(" + identifier + "|[*])" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,

	// CSS escapes
	// http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	},

	// CSS string/identifier serialization
	// https://drafts.csswg.org/cssom/#common-serializing-idioms
	rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
	fcssescape = function( ch, asCodePoint ) {
		if ( asCodePoint ) {

			// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
			if ( ch === "\0" ) {
				return "\uFFFD";
			}

			// Control characters and (dependent upon position) numbers get escaped as code points
			return ch.slice( 0, -1 ) + "\\" + ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
		}

		// Other potentially-special ASCII characters get backslash-escaped
		return "\\" + ch;
	},

	// Used for iframes
	// See setDocument()
	// Removing the function wrapper causes a "Permission Denied"
	// error in IE
	unloadHandler = function() {
		setDocument();
	},

	disabledAncestor = addCombinator(
		function( elem ) {
			return elem.disabled === true && ("form" in elem || "label" in elem);
		},
		{ dir: "parentNode", next: "legend" }
	);

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var m, i, elem, nid, match, groups, newSelector,
		newContext = context && context.ownerDocument,

		// nodeType defaults to 9, since context defaults to document
		nodeType = context ? context.nodeType : 9;

	results = results || [];

	// Return early from calls with invalid selector or context
	if ( typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

		return results;
	}

	// Try to shortcut find operations (as opposed to filters) in HTML documents
	if ( !seed ) {

		if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
			setDocument( context );
		}
		context = context || document;

		if ( documentIsHTML ) {

			// If the selector is sufficiently simple, try using a "get*By*" DOM method
			// (excepting DocumentFragment context, where the methods don't exist)
			if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {

				// ID selector
				if ( (m = match[1]) ) {

					// Document context
					if ( nodeType === 9 ) {
						if ( (elem = context.getElementById( m )) ) {

							// Support: IE, Opera, Webkit
							// TODO: identify versions
							// getElementById can match elements by name instead of ID
							if ( elem.id === m ) {
								results.push( elem );
								return results;
							}
						} else {
							return results;
						}

					// Element context
					} else {

						// Support: IE, Opera, Webkit
						// TODO: identify versions
						// getElementById can match elements by name instead of ID
						if ( newContext && (elem = newContext.getElementById( m )) &&
							contains( context, elem ) &&
							elem.id === m ) {

							results.push( elem );
							return results;
						}
					}

				// Type selector
				} else if ( match[2] ) {
					push.apply( results, context.getElementsByTagName( selector ) );
					return results;

				// Class selector
				} else if ( (m = match[3]) && support.getElementsByClassName &&
					context.getElementsByClassName ) {

					push.apply( results, context.getElementsByClassName( m ) );
					return results;
				}
			}

			// Take advantage of querySelectorAll
			if ( support.qsa &&
				!compilerCache[ selector + " " ] &&
				(!rbuggyQSA || !rbuggyQSA.test( selector )) ) {

				if ( nodeType !== 1 ) {
					newContext = context;
					newSelector = selector;

				// qSA looks outside Element context, which is not what we want
				// Thanks to Andrew Dupont for this workaround technique
				// Support: IE <=8
				// Exclude object elements
				} else if ( context.nodeName.toLowerCase() !== "object" ) {

					// Capture the context ID, setting it first if necessary
					if ( (nid = context.getAttribute( "id" )) ) {
						nid = nid.replace( rcssescape, fcssescape );
					} else {
						context.setAttribute( "id", (nid = expando) );
					}

					// Prefix every selector in the list
					groups = tokenize( selector );
					i = groups.length;
					while ( i-- ) {
						groups[i] = "#" + nid + " " + toSelector( groups[i] );
					}
					newSelector = groups.join( "," );

					// Expand context for sibling selectors
					newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
						context;
				}

				if ( newSelector ) {
					try {
						push.apply( results,
							newContext.querySelectorAll( newSelector )
						);
						return results;
					} catch ( qsaError ) {
					} finally {
						if ( nid === expando ) {
							context.removeAttribute( "id" );
						}
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {function(string, object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created element and returns a boolean result
 */
function assert( fn ) {
	var el = document.createElement("fieldset");

	try {
		return !!fn( el );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( el.parentNode ) {
			el.parentNode.removeChild( el );
		}
		// release memory in IE
		el = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = arr.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			a.sourceIndex - b.sourceIndex;

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for :enabled/:disabled
 * @param {Boolean} disabled true for :disabled; false for :enabled
 */
function createDisabledPseudo( disabled ) {

	// Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
	return function( elem ) {

		// Only certain elements can match :enabled or :disabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
		if ( "form" in elem ) {

			// Check for inherited disabledness on relevant non-disabled elements:
			// * listed form-associated elements in a disabled fieldset
			//   https://html.spec.whatwg.org/multipage/forms.html#category-listed
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
			// * option elements in a disabled optgroup
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
			// All such elements have a "form" property.
			if ( elem.parentNode && elem.disabled === false ) {

				// Option elements defer to a parent optgroup if present
				if ( "label" in elem ) {
					if ( "label" in elem.parentNode ) {
						return elem.parentNode.disabled === disabled;
					} else {
						return elem.disabled === disabled;
					}
				}

				// Support: IE 6 - 11
				// Use the isDisabled shortcut property to check for disabled fieldset ancestors
				return elem.isDisabled === disabled ||

					// Where there is no isDisabled, check manually
					/* jshint -W018 */
					elem.isDisabled !== !disabled &&
						disabledAncestor( elem ) === disabled;
			}

			return elem.disabled === disabled;

		// Try to winnow out elements that can't be disabled before trusting the disabled property.
		// Some victims get caught in our net (label, legend, menu, track), but it shouldn't
		// even exist on them, let alone have a boolean value.
		} else if ( "label" in elem ) {
			return elem.disabled === disabled;
		}

		// Remaining elements are neither :enabled nor :disabled
		return false;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
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
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare, subWindow,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// Return early if doc is invalid or already selected
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Update global variables
	document = doc;
	docElem = document.documentElement;
	documentIsHTML = !isXML( document );

	// Support: IE 9-11, Edge
	// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
	if ( preferredDoc !== document &&
		(subWindow = document.defaultView) && subWindow.top !== subWindow ) {

		// Support: IE 11, Edge
		if ( subWindow.addEventListener ) {
			subWindow.addEventListener( "unload", unloadHandler, false );

		// Support: IE 9 - 10 only
		} else if ( subWindow.attachEvent ) {
			subWindow.attachEvent( "onunload", unloadHandler );
		}
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties
	// (excepting IE8 booleans)
	support.attributes = assert(function( el ) {
		el.className = "i";
		return !el.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( el ) {
		el.appendChild( document.createComment("") );
		return !el.getElementsByTagName("*").length;
	});

	// Support: IE<9
	support.getElementsByClassName = rnative.test( document.getElementsByClassName );

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programmatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( el ) {
		docElem.appendChild( el ).id = expando;
		return !document.getElementsByName || !document.getElementsByName( expando ).length;
	});

	// ID filter and find
	if ( support.getById ) {
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var elem = context.getElementById( id );
				return elem ? [ elem ] : [];
			}
		};
	} else {
		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== "undefined" &&
					elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};

		// Support: IE 6 - 7 only
		// getElementById is not reliable as a find shortcut
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var node, i, elems,
					elem = context.getElementById( id );

				if ( elem ) {

					// Verify the id attribute
					node = elem.getAttributeNode("id");
					if ( node && node.value === id ) {
						return [ elem ];
					}

					// Fall back on getElementsByName
					elems = context.getElementsByName( id );
					i = 0;
					while ( (elem = elems[i++]) ) {
						node = elem.getAttributeNode("id");
						if ( node && node.value === id ) {
							return [ elem ];
						}
					}
				}

				return [];
			}
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( tag );

			// DocumentFragment nodes don't have gEBTN
			} else if ( support.qsa ) {
				return context.querySelectorAll( tag );
			}
		} :

		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See https://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( document.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( el ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// https://bugs.jquery.com/ticket/12359
			docElem.appendChild( el ).innerHTML = "<a id='" + expando + "'></a>" +
				"<select id='" + expando + "-\r\\' msallowcapture=''>" +
				"<option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( el.querySelectorAll("[msallowcapture^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !el.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
			if ( !el.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
				rbuggyQSA.push("~=");
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !el.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}

			// Support: Safari 8+, iOS 8+
			// https://bugs.webkit.org/show_bug.cgi?id=136851
			// In-page `selector#id sibling-combinator selector` fails
			if ( !el.querySelectorAll( "a#" + expando + "+*" ).length ) {
				rbuggyQSA.push(".#.+[+~]");
			}
		});

		assert(function( el ) {
			el.innerHTML = "<a href='' disabled='disabled'></a>" +
				"<select disabled='disabled'><option/></select>";

			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = document.createElement("input");
			input.setAttribute( "type", "hidden" );
			el.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( el.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( el.querySelectorAll(":enabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Support: IE9-11+
			// IE's :disabled selector does not pick up the children of disabled fieldsets
			docElem.appendChild( el ).disabled = true;
			if ( el.querySelectorAll(":disabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			el.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( el ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( el, "*" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( el, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully self-exclusive
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === document ? -1 :
				b === document ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return document;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		!compilerCache[ expr + " " ] &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch (e) {}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.escape = function( sel ) {
	return (sel + "").replace( rcssescape, fcssescape );
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
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

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
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

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[6] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] ) {
				match[2] = match[4] || match[5] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, uniqueCache, outerCache, node, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType,
						diff = false;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) {

										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {

							// Seek `elem` from a previously-cached index

							// ...in a gzip-friendly way
							node = parent;
							outerCache = node[ expando ] || (node[ expando ] = {});

							// Support: IE <9 only
							// Defend against cloned attroperties (jQuery gh-1709)
							uniqueCache = outerCache[ node.uniqueID ] ||
								(outerCache[ node.uniqueID ] = {});

							cache = uniqueCache[ type ] || [];
							nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
							diff = nodeIndex && cache[ 2 ];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						} else {
							// Use previously-cached element index if available
							if ( useCache ) {
								// ...in a gzip-friendly way
								node = elem;
								outerCache = node[ expando ] || (node[ expando ] = {});

								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[ node.uniqueID ] ||
									(outerCache[ node.uniqueID ] = {});

								cache = uniqueCache[ type ] || [];
								nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
								diff = nodeIndex;
							}

							// xml :nth-child(...)
							// or :nth-last-child(...) or :nth(-last)?-of-type(...)
							if ( diff === false ) {
								// Use the same loop as above to seek `elem` from the start
								while ( (node = ++nodeIndex && node && node[ dir ] ||
									(diff = nodeIndex = 0) || start.pop()) ) {

									if ( ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) &&
										++diff ) {

										// Cache the index of each encountered element
										if ( useCache ) {
											outerCache = node[ expando ] || (node[ expando ] = {});

											// Support: IE <9 only
											// Defend against cloned attroperties (jQuery gh-1709)
											uniqueCache = outerCache[ node.uniqueID ] ||
												(outerCache[ node.uniqueID ] = {});

											uniqueCache[ type ] = [ dirruns, diff ];
										}

										if ( node === elem ) {
											break;
										}
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					// Don't keep the element (issue #299)
					input[0] = null;
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			text = text.replace( runescape, funescape );
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": createDisabledPseudo( false ),
		"disabled": createDisabledPseudo( true ),

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		skip = combinator.next,
		key = skip || dir,
		checkNonElements = base && key === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
			return false;
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, uniqueCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});

						// Support: IE <9 only
						// Defend against cloned attroperties (jQuery gh-1709)
						uniqueCache = outerCache[ elem.uniqueID ] || (outerCache[ elem.uniqueID ] = {});

						if ( skip && skip === elem.nodeName.toLowerCase() ) {
							elem = elem[ dir ] || elem;
						} else if ( (oldCache = uniqueCache[ key ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							uniqueCache[ key ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
			return false;
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
			// Avoid hanging onto element (issue #299)
			checkContext = null;
			return ret;
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context === document || context || outermost;
			}

			// Add elements passing elementMatchers directly to results
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					if ( !context && elem.ownerDocument !== document ) {
						setDocument( elem );
						xml = !documentIsHTML;
					}
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context || document, xml) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// `i` is now the count of elements visited above, and adding it to `matchedCount`
			// makes the latter nonnegative.
			matchedCount += i;

			// Apply set filters to unmatched elements
			// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
			// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
			// no element matchers and no seed.
			// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
			// case, which will result in a "00" `matchedCount` that differs from `i` but is also
			// numerically zero.
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( (selector = compiled.selector || selector) );

	results = results || [];

	// Try to minimize operations if there is only one selector in the list and no seed
	// (the latter of which guarantees us context)
	if ( match.length === 1 ) {

		// Reduce context if the leading compound selector is an ID
		tokens = match[0] = match[0].slice( 0 );
		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				context.nodeType === 9 && documentIsHTML && Expr.relative[ tokens[1].type ] ) {

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( el ) {
	// Should return 1, but returns 4 (following)
	return el.compareDocumentPosition( document.createElement("fieldset") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( el ) {
	el.innerHTML = "<a href='#'></a>";
	return el.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( el ) {
	el.innerHTML = "<input/>";
	el.firstChild.setAttribute( "value", "" );
	return el.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( el ) {
	return el.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

// EXPOSE
var _sizzle = window.Sizzle;

Sizzle.noConflict = function() {
	if ( window.Sizzle === Sizzle ) {
		window.Sizzle = _sizzle;
	}

	return Sizzle;
};

if ( typeof define === "function" && define.amd ) {
	define(function() { return Sizzle; });
// Sizzle requires that there be a global window in Common-JS like environments
} else if ( typeof module !== "undefined" && module.exports ) {
	module.exports = Sizzle;
} else {
	window.Sizzle = Sizzle;
}
// EXPOSE

})( window );
;'use strict';

(function (global) {

  /**
   * Global namespace to hold all framework classes and modules.
   * @namespace smx
   */
  var smx = function smx() {
    return _smx_wrapper.apply(smx, arguments);
  };

  /**
   * Gets current framework version
   * @memberof smx
   * @type {String}
   */
  smx.version = '0.8.14';

  /**
   * Currently active document.
   * @memberof smx
   * @type {SMXDocument}
   */
  smx.document = null;

  /**
   * Array of loaded documents.
   * @memberof smx
   * @type {SMXDocument[]}
   */
  smx.documents = [];

  /**
   * Namespace for SMXNode extended mixin methods.
   * @memberof smx
   * @type {Object}
   */
  smx.fn = {};

  smx.parsers = [];

  /**
   * Namescape for custom attribute parsers.
   * Attribute parsers are used during XML transpilation to process original
   * nodes attributes in different ways.
   * @memberof smx
   * @type {Array}
   */
  smx.AttributeParsers = [];

  /**
   * Namespace for custom node parsers.
   * Tag parsers are used during XML transpilation to transform original nodes
   * in different ways.
   * @memberof smx
   * @type {Array}
   */
  smx.NodeParsers = [];

  /**
  * Global node wrapper.
  * @method smx
  * @param {String|SMXNode|SMXNode[]} s - selector, node or node collection
  * @return {SMXNode|SMXNodes[]}
  * @memberof smx
  */
  var _smx_wrapper = function _smx_wrapper(s) {

    //require an active document
    if (!smx.document) return;

    //no arguments? do nothing...
    if (!s) return;

    //string? should be a selector search
    if (typeof s === 'string') {

      //require an active document instance
      if (!smx.document) return [];

      //use given selector to find in active document
      return smx.document.find(s);
    }

    return smx.document.wrap(s);
  };

  //expose globals
  global.smx = smx;
})(window);
//# sourceMappingURL=smx.js.map
;'use strict';

(function (global, Sizzle, smx, LOG) {

	var DATA;
	var PARSER_INDEX;

	/**
  * Loads a new smx document.
  * @memberof smx
  * @param {String} url
  * @param {smx~onLoadSuccess} onSuccess
  * @param {smx~onLoadError} onError
  * @async
  */
	smx.load = function (data, success, error) {

		if (!data) return;

		//conditional loading should check for multiple data source types
		//from url file as xml or json file... from xmlNode... from json object...
		//for now just proceed assuming an url for an xml file
		SUCCESS_CALLBACK = success || function () {};
		ERROR_CALLBACK = error || function () {};

		DATA = {};
		PARSER_INDEX = 0;

		if (typeof data === 'string') LOAD_SMX_DOCUMENT(data);else LOAD_SMX_DOCUMENT_FROM_JSON(data);
	};

	/**
  * Callback function when loading completes succefully.
  * @callback smx~onLoadSuccess
  * @param {SMXDocument} document - Just loaded document
  */
	var SUCCESS_CALLBACK = function SUCCESS_CALLBACK(document) {};

	/**
  * Callback function used loading throws an error.
  * @callback smx~onLoadError
  * @param {Error} error - Error object
  */
	var ERROR_CALLBACK = function ERROR_CALLBACK(e) {};

	var LOAD_SMX_DOCUMENT = function LOAD_SMX_DOCUMENT(url) {
		var loader = new smx.Loader();
		loader.on('complete', APPLY_PARSERS);
		loader.on('error', LOAD_SMX_ERROR);
		loader.loadDocument(url);
	};

	var LOAD_SMX_DOCUMENT_FROM_JSON = function LOAD_SMX_DOCUMENT_FROM_JSON(data) {
		var x2js = new X2JS();
		var xmlDocument = x2js.json2xml(data);
		APPLY_PARSERS(xmlDocument);
	};

	var APPLY_PARSERS = function APPLY_PARSERS(xmlDocument) {
		var xml = xmlDocument;
		var parser = smx.parsers[PARSER_INDEX];
		if (parser) {
			parser(xml, function (data) {
				if (data) Object.assign(DATA, data);
				PARSER_INDEX = PARSER_INDEX + 1;
				APPLY_PARSERS(xml);
			});
		} else {
			CLEAN_TEXT_NODES(xml);
		}
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

		CREATE_SMX_DOCUMENT(xml);
	};

	var CREATE_SMX_DOCUMENT = function CREATE_SMX_DOCUMENT(xml) {

		LOG('smx load complete!');

		var d = new smx.Document(xml);

		Object.assign(d, DATA);

		smx.documents.push(d);

		//set it as active document if its empty
		if (!smx.document) smx.document = d;

		SUCCESS_CALLBACK(d);
	};

	var LOAD_SMX_COMPLETE = function LOAD_SMX_COMPLETE(smxDocument) {

		SUCCESS_CALLBACK(d);

		return;
	};

	var LOAD_SMX_ERROR = function LOAD_SMX_ERROR(e) {

		LOG('smx load error: ' + e);

		ERROR_CALLBACK(e);

		return;
	};
})(window, window.Sizzle, window.smx, window.log);
//# sourceMappingURL=smx.load.js.map
;'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function (global, Sizzle, _, smx, LOG) {

  /**
   * SMX Loader Class
   * @class Loader
   * @memberof smx
   */

  var Loader = function Loader() {

    //extended with custom events
    _.extend(this, Backbone.Events);

    // XML Document Object
    this.xmlDocument = null;

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
      var is_root = !this.xmlDocument ? true : false;

      if (is_root) {

        //set xml root document
        this.xmlDocument = xhr.responseXML;

        //ignore XMLDocument and other unwanted nodes like comments, text, ...
        //get just the root XMLElement as lastChild in document
        var node = this.xmlDocument.lastChild;

        resolvePathFileAttributes(node, xhr.responseURL);
      } else {

        //get 1st <include> found in current XMLDocument
        var include = Sizzle('include[loading="true"]', this.xmlDocument)[0];

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
          new_node = createDataNode(this.xmlDocument, nodeName, data, type);
        }

        //resolve 'path' and 'file' attributes from 'src'
        resolvePathFileAttributes(new_node, include.getAttribute('src'));

        //copy attributes from include node to the new node
        copyAttributes(include, new_node);

        //replace include node with the new node
        include.parentNode.replaceChild(new_node, include);
      }

      var inc = parseIncludes(this.xmlDocument);

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

      //get defined parsers from smx ns
      var parsers = smx.AttributeParsers;

      //do parsing one by one
      for (var i = 0, len = parsers.length; i < len; i++) {
        parsers[i].parse(this.xmlDocument);
      } //trigger complete event
      this.trigger('complete', this.xmlDocument);

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

      var xml = null;

      if (global.ActiveXObject) {

        xml = new ActiveXObject('Microsoft.XMLDOM');
        xml.async = 'false';
        xml.loadXML(str);
      } else {

        var parser = new DOMParser();
        xml = parser.parseFromString(str, 'text/xml');
      }

      return xml;
    };

    return this;
  };

  //
  //  PRIVATE HELPER METHODS
  //

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

  var resolvePathFileAttributes = function resolvePathFileAttributes(xmlNode, url) {

    //get src string from xmlNode attribute or given url
    var src = url ? url : xmlNode.getAttribute('src');

    //declare resultant attribute values
    var path, file;

    //no src string? just ignore..
    if (!src) return xmlNode;

    //split by slashes
    src = src.split('/');

    //if multipart, last is file
    if (src.length > 0) file = src.pop();

    //join path parts
    path = src.join('/') + '/';

    //set inlcuded xmlNode core attributes
    if (path) xmlNode.setAttribute('path', path);
    if (file) xmlNode.setAttribute('file', file);

    return xmlNode;
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

  //expose
  smx.Loader = Loader;
})(window, window.Sizzle, window._, window.smx, window.log);
//# sourceMappingURL=Loader.js.map
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
     * @protected
     * @type {String}
     */
    name: 'Id',

    /**
     * Selector used to find nodes having matching attributes to be parsed
     * @protected
     * @type {String}
     */
    selector: ':not([id])',

    /**
     * Parser function
     * @static
     * @param {XMLDocument} xmlDocument
     * @return {XMLDocument}
     */
    parse: function parse(xmlDocument) {

      //get ids already in use inside xmlDocument
      var nodes_with_id_attr = Sizzle('[id]', xmlDocument);
      var ids_in_use = nodes_with_id_attr.map(function (n) {
        return n.id;
      });

      //get nodes matching the parser selector
      var nodes = Sizzle(this.selector, xmlDocument);

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

      return xmlDocument;
    }

  };

  //expose to smx namespace
  smx.AttributeParsers.push(IdAttributeParser);
})(window, window.smx, window.Sizzle, window.log);
//# sourceMappingURL=IdAttributeParser.js.map
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
     * @param {SMXDocument} document - The document to navigate through
     */
				function Playhead(doc) {
						_classCallCheck(this, Playhead);

						//document is required
						if (!doc) return;

						//extend with events on, off, trigger
						_.extend(this, Backbone.Events);

						/**
       * The document to navigate through
       * @type {SMXDocument}
       * @private
       */
						this._document = doc;

						/**
       * Contains all currently selected nodes ordered from outter to inner.
       * @type {SMXNode[]}
       * @private
       */
						this._selection = [];
				}

				/**
     * Gets the associated document
     * @type {SMXDocument}
     * @readonly
     */


				_createClass(Playhead, [{
						key: 'reset',


						/**
       * Navigates to document's root node.
       */
						value: function reset() {
								return this.navigate(this.document.root);
						}

						/**
       * Performs play action
       * @param {(String|SMXNode)=} ref target reference
       */

				}, {
						key: 'play',
						value: function play(ref) {

								//no reference? just do a forward
								if (!ref) return this.forward();

								//resolve target node
								var tnode = ref.id ? ref : this.document.getNodeById(ref);

								//not found? ignore...
								if (tnode) return this.navigate(tnode, {});

								//else ignore
								return;
						}

						/**
       * Navigates inside head's node.
       */

				}, {
						key: 'enter',
						value: function enter() {

								//get current node
								var cnode = this.head;if (!cnode) return;

								//get children nodes
								var children = cnode.children;

								//no children?
								if (!children.length) return;

								//get first child
								var tnode = children[0];

								//go to child node using known swap type and passing recived params
								return this.navigate(tnode, { 'type': 'inside' });
						}

						/**
       * Navigates outside head's node.
       */

				}, {
						key: 'exit',
						value: function exit() {

								//get current node
								var cnode = this.head;if (!cnode) return;

								//has parent node?
								if (!cnode.parent) return;

								//get parent node
								var tnode = cnode.parent;

								//go to child node using known swap type and passing recived params
								return this.navigate(tnode, { 'type': 'outside' });
						}

						/**
       * Navigates to head's next node.
       */

				}, {
						key: 'next',
						value: function next() {

								//get current node
								var cnode = this.head;if (!cnode) return;

								//get next node
								var tnode = cnode.next;if (!tnode) return;

								//go to next node using known swap type
								return this.navigate(tnode, { 'type': 'next' });
						}

						/**
       * Navigates to head's previous node.
       */

				}, {
						key: 'previous',
						value: function previous() {

								//get current node
								var cnode = this.head;if (!cnode) return;

								//get previous node
								var tnode = cnode.previous;if (!tnode) return;

								//go to previous node using known swap type and passing recived params
								return this.navigate(tnode, { 'type': 'previous' });
						}

						/**
       * Navigates to head's next node in flat tree mode.
       */

				}, {
						key: 'forward',
						value: function forward() {

								var tnode = void 0,
								    cnode = void 0,
								    children = void 0;

								//get current node
								cnode = this.head;

								//no current node? ignore
								if (!cnode) return;

								tnode = cnode.first || cnode.next;

								if (!tnode) {

										var parent = cnode.parent;
										while (parent && !tnode) {
												tnode = parent.next;
												parent = parent.parent;
										}
								}

								return tnode ? this.navigate(tnode) : null;
						}

						/**
        * Navigates to head's previous node in flat tree mode.
       */

				}, {
						key: 'backward',
						value: function backward() {

								if (!this.head) return;
								var tnode = this.head.previous || this.head.parent;
								return tnode ? this.navigate(tnode) : null;
						}

						/**
       * Executes a playhead action by keyword.
        * @param {String} keyword
       */

				}, {
						key: 'exec',
						value: function exec(keyword) {

								//define valid keywords mapping existing methods
								var keywords = ['reset', 'play', 'next', 'previous', 'enter', 'exit', 'forward', 'backward'];

								//resolve for a valid keyword
								var isValidKeyword = keywords.indexOf(keyword) >= 0;

								//not valid keyword? error!
								if (!isValidKeyword) throw new Error('UNKNOWN KEYWORD "!"' + keyword + '"');

								//try-catched execution
								try {
										return this[keyword]();
								} catch (e) {
										throw new Error('Playhead Error: Keyword exec "!' + keyword + '"', e);
								}
						}

						/**
       * Navigates to given node using optional configuration.
        * @param {String} target
       */

				}, {
						key: 'navigate',
						value: function navigate(target) {

								//check for a keyword, must be '!' preffixed string
								var isKeyword = typeof target === 'string' && target.indexOf('!') === 0;

								//keyword? resolve by exec unpreffixed reference
								if (isKeyword) return this.exec(target.substr(1));

								//resolve target node by reference
								//assuming having and id property means SMXNode...
								var tnode = target.id ? target : this.document.getNodeById(target);

								//no target found? error!
								if (!tnode) throw new Error('Playhead Error: Invalid target ' + target);

								//get current node
								var cnode = this.head;

								//no need to move...
								if (tnode === cnode) return cnode;

								//--> ASYNC ATTR CONDITIONAL NAVIGATION WAS HERE...
								//see leagacy playhead implementations for more info

								//resets private navigation registry
								var selected = [],
								    deselected = [];

								if (!cnode) {
										cnode = this.document.root;
										selected.push(cnode);
								}

								/* trying a better approach */

								var isDescendant = cnode.isAncestorOf(tnode);
								var isAncestor = tnode.isAncestorOf(cnode);

								//aux filter fn for later use
								var isNodeOrAncestorOf = function isNodeOrAncestorOf(n) {
										return n == tnode || n.isAncestorOf(tnode);
								};

								var r = cnode;
								if (cnode === tnode) {
										//..
								} else if (isDescendant) {
										while (r != tnode) {
												r = r.children.filter(isNodeOrAncestorOf)[0];
												selected.push(r);
										}
								} else if (isAncestor) {
										while (r != tnode) {
												deselected.push(r);
												r = r.parent;
										}
								} else {
										while (!r.isAncestorOf(cnode) || !r.isAncestorOf(tnode)) {
												deselected.push(r);
												r = r.parent;
										}
										while (r != tnode) {
												r = r.children.filter(isNodeOrAncestorOf)[0];
												selected.push(r);
										}
								}

								//update path
								for (var i = 0; i < deselected.length; i++) {
										this._selection.pop();
								}
								for (var i = 0; i < selected.length; i++) {
										this._selection.push(selected[i]);
								}

								this.trigger('change', {
										selected: selected,
										deselected: deselected,
										path: this._selection,
										origin: cnode,
										target: tnode
								});

								/*
        //FIRE EVENTS
          
        //FIRE 'LEAVE' EVENT
        if(cnode){
            
        	//fire generic 'leave' event in resulting current node
        	this.trigger('leave', cnode);
        	
        	//fire specific node 'leave' event
        	this.trigger('leave:'+cnode.id, cnode);
        	
        }
          
        //--> NOSTOP ATTRIBUTE CONDITIONAL NAVIGATION WAS HERE...
          //see leagacy playhead implementations for more info
          
        //fire generic 'stay' event in resulting current node
        this.trigger('stay',tnode);
        
        //fire specific node 'stay' event
        this.trigger('stay:'+tnode.id,tnode);
          
        //notify node navigation completed
        this.trigger('ready',tnode);
          
          //return head node
        return this.head;
        
        */
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

				}, {
						key: 'document',
						get: function get() {
								return this._document;
						}

						/**
       * Gets all currently selected nodes ordered from outter to inner.
       * @type {SMXNode}
       * @readonly
       */

				}, {
						key: 'selection',
						get: function get() {
								return this._selection;
						}

						/**
       * Gets the head node, which is the last node in the path.
       * @type {SMXNode}
       * @readonly
       */

				}, {
						key: 'head',
						get: function get() {
								return this._selection[this._selection.length - 1];
						}

						/**
       * Gets the root node, which is the first node in the path.
       * @type {SMXNode}
       * @readonly
       */

				}, {
						key: 'root',
						get: function get() {
								return this._selection[0];
						}
				}]);

				return Playhead;
		}();

		//expose to global


		smx.Playhead = Playhead;
})(window, window._, window.Backbone, window.smx);
//# sourceMappingURL=Playhead.js.map
;'use strict';

(function (global, _, Sizzle, smx) {

    /**
     * Extends SMXNode with core methods
     * @mixin Node-Core
     */

    var NodeCoreMethods = {

        /**
         * Gets the index position in parent's children. If node has no parent,
         * will return 0. When using the optional parameter `selector`, the
         * resultant index is calculated based only in the sibling nodes matching
         * the given selector, if node does not match the selector itself will
         * return -1.
         *
         * @memberof Node-Core
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
         * @memberof Node-Core
         * @return {String}
         */
        getText: function getText() {

            return this[0].text || this[0].textContent || '';
        },

        /**
         * Gets the html content.
         *
         * @memberof Node-Core
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
         * Gets the inner data content formatted according to node type.
         *
         * @memberof Node-Core
         * @return {String}
         */
        getData: function getData() {

            //get raw text data
            var data = this.getText();

            //get data type
            var type = this.type;
            switch (this.type) {
                case 'json':
                    try {
                        data = JSON.parse(data);
                    } catch (e) {}
                    break;
                default:
                    break;
            }

            return data;
        },

        /**
         * Gets the string representation.
         *
         * @memberof Node-Core
         * @return {String}
         */
        toString: function toString() {

            return ('<' + this.name + ' id="' + this.id + '">').trim();
        },

        /**
         * Gets the JSON representation. NOT IMPLEMENTED
         * @method toJSON
         * @memberof Node-Core
         * @return {Object}
         */
        toJSON: function toJSON() {
            return {}; //not implemented...
        }

    };

    //extends smx fn methods
    smx.fn = smx.fn || {};
    smx.fn = Object.assign(smx.fn, NodeCoreMethods);
})(window, window._, window.Sizzle, window.smx);
//# sourceMappingURL=Node.Core.js.map
;'use strict';

(function (global, Sizzle, smx) {

    /**
     * Extends SMXNode with utility attribute getters
     * @mixin Node-AttributeGetters
     */

    var NodeAttributeGetters = {

        /**
         * Gets the value for the given attribute name.
         *
         * @memberof Node-AttributeGetters
         * @param {String} name - attribute name
         * @return {String} value
         * @example
         * <movie tags="sci-fi, horror, adventures" />
         * @example
         * $movie.attr('tags')
         * // => "sci-fi, horror, adventures"
         */
        attr: function attr(name) {

            return this[0].getAttribute ? this[0].getAttribute(name) : undefined;
        },

        /**
         * This method is like `attr` but will use an attribute parser if there is
         * one predefined for the given attribute name.
         *
         * @memberof Node-AttributeGetters
         * @param {String} name - attribute name
         * @param {Object=} opt - options to pass into attribute parser
         * @return {String} value
         */
        get: function get(name, opt) {

            if (!this[0].getAttribute) return undefined;

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
         * @memberof Node-AttributeGetters
         * @param {String} name - attribute name
         * @return {Boolean}
         */
        has: function has(name) {
            if (!this[0].getAttribute) return false;
            //return this[0].hasAttribute(name);
            //IE8 does not support XMLNode.hasAttribute, so...
            return this[0].getAttribute(name) !== null;
        },

        /**
         * Gets Delimiter Separated Value
         * An utility method converts given attribute value into dsv array
         * @method dsv
         * @memberof Node-AttributeGetters
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

    //extends smx fn methods
    smx.fn = smx.fn || {};
    smx.fn = Object.assign(smx.fn, NodeAttributeGetters);
})(window, window.Sizzle, window.smx);
//# sourceMappingURL=Node.AttributeGetters.js.map
;"use strict";

(function (global, _, Sizzle, smx) {

  /**
   * Extends SMXNode with utility tree node methods
   * @mixin Node-TreeNode
   */

  var TreeNodeInterface = {

    // PARENT RELATED OPERATIONS

    /**
     * Gets a list of parent nodes up to root, ordered from outer to inner.
     * @memberof Node-TreeNode
     * @return {SMXNode[]}
     */
    getAncestors: function getAncestors(selector) {

      if (!selector) return this.ancestors;
      return this.ancestors.filter(function (n) {
        return n.isMatch(selector);
      });
    },

    // EXTRA - PARENT RELATED OPERATIONS

    /**
     * Checks if node is an ancestor of another.
     * @memberof Node-TreeNode
     * @param {SMXNode} node - reference node
     * @return {Boolean}
     */
    isAncestorOf: function isAncestorOf(node) {

      if (!node.parent) return false;
      var ancestorsId = node.ancestors.map(function (n) {
        return n.id;
      });
      if (ancestorsId.indexOf(this.id) > -1) return true;else return false;
    },

    /**
     * Checks if node matches the given selector.
     * @memberof Node-TreeNode
     * @param {String} selector - css selector to match
     * @return {Boolean}
     */
    isMatch: function isMatch(selector) {

      return Sizzle.matchesSelector(this[0], selector);
    },

    // CHILD RELATED OPERATIONS

    /**
     * Finds all descendant nodes matching the given selector.
     * @memberof Node-TreeNode
     * @param {String} selector - search selector
     * @return {Array.<Node>}
     */
    find: function find(selector) {

      if (!selector) return [];
      if (!this.children.length) return [];

      return this.document.find(selector, this);
    },

    /**
     * This method is like `find` but returns only the first result.
     * @memberof Node-TreeNode
     * @param {String} selector - search selector
     * @return {SMXNode}
     */
    one: function one(selector) {

      return this.find(selector)[0];
    },

    /**
     * Gets the children nodes matching the given selector.
     * @memberof Node-TreeNode
     * @param {String=} selector
     * @return {Array.<Node>}
     */
    getChildren: function getChildren(selector) {

      if (!selector) return this.children;

      return this.children.filter(function (n) {
        return n.isMatch(selector);
      });
    },

    /**
     * Gets the first child node matching the given selector.
     * @memberof Node-TreeNode
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
        if (children[i].isMatch(selector)) result = children[i];
        i++;
      }

      return result;
    },

    /**
     * Gets the last child node matching the given selector.
     * @memberof Node-TreeNode
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
        if (children[i].isMatch(selector)) result = children[i];
        i++;
      }

      return result;
    },

    // EXTRA - CHILD RELATED OPERATIONS

    /**
     * Gets child node at given index
     * @memberof Node-TreeNode
     * @param {Integer} index - index position
     * @return {SMXNode}
     */
    getChildAt: function getChildAt(index) {

      return this.children[index];
    },

    /**
     * Checks if a node is child of another
     * @memberof Node-TreeNode
     * @param {SMXNode} node - reference node
     * @return {Boolean}
     */
    isDescendantOf: function isDescendantOf(node) {

      if (!node.parent) return false;
      var ancestorsId = this.ancestors.map(function (n) {
        return n.id;
      });
      if (ancestorsId.indexOf(node.id) > -1) return true;else return false;
    },

    // SIBLING RELATED OPERATIONS


    /**
     * Gets the next sibling node matching the given selector.
     * @memberof Node-TreeNode
     * @param {String=} selector - filter selector
     * @return {SMXNode}
     */
    getNext: function getNext(selector) {

      if (!selector) return this.next;else {
        var n = this.next;
        var isMatch = false;
        while (!isMatch && n) {
          if (n.isMatch(selector)) isMatch = true;else n = n.next;
        }
        return isMatch ? n : undefined;
      }
    },

    /**
     * Gets all next sibling nodes matching the given selector.
     * @memberof Node-TreeNode
     * @param {String=} selector - filter selector
     * @return {SMXNode[]}
     */
    getAllNext: function getAllNext(selector) {

      if (!this.next) return [];else {
        //fill up nodes array walking all next nodes
        var n = this.next;
        var nodes = [n];
        while (n && n.next) {
          n = n.next;
          nodes.push(n);
        }
        if (!selector) return nodes;else //return filtered by selector
          return nodes.filter(function (n) {
            return n.isMatch(selector);
          });
      }
    },

    /**
     * Gets the previous sibling node matching the given selector.
     * @memberof Node-TreeNode
     * @param {String=} selector - filter selector
     * @return {SMXNode}
     */
    getPrevious: function getPrevious(selector) {

      if (!selector) return this.previous;else {
        var n = this.previous;
        var isMatch = false;
        while (!isMatch && n) {
          if (n.isMatch(selector)) isMatch = true;else n = n.previous;
        }
        return isMatch ? n : undefined;
      }
    },

    /**
     * Gets all previous sibling nodes matching the given selector.
     * @memberof Node-TreeNode
     * @param {String=} selector - filter selector
     * @return {SMXNode[]}
     */
    getAllPrevious: function getAllPrevious(selector) {

      if (!this.previous) return [];else {
        //fill up nodes array walking all previous nodes
        var n = this.previous;
        var nodes = [n];
        while (n && n.previous) {
          n = n.previous;
          nodes.unshift(n);
        }
        if (!selector) return nodes;else //return filtered by selector
          return nodes.filter(function (n) {
            return n.isMatch(selector);
          });
      }
    }

  };

  //extends smx fn methods
  smx.fn = smx.fn || {};
  smx.fn = Object.assign(smx.fn, TreeNodeInterface);
})(window, window._, window.Sizzle, window.smx);
//# sourceMappingURL=Node.TreeNode.js.map
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

      //require nodeType === 1 --> Node.ELEMENT_NODE
      if (xmlNode.nodeType !== 1) throw new Error('Node constructor requires ELEMENT_NODE');

      /**
       * Original XMLNode for reference
       * @type {XMLNode}
       * @protected
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
        if (this[0].getAttribute) return this[0].getAttribute('type') || 'smx';else return 'smx';
      }

      /**
       * Gets node className based on inner XMLNode class attribute
       * @type {String}
       * @readonly
       */

    }, {
      key: 'className',
      get: function get() {
        if (this[0].getAttribute) return this[0].getAttribute('class');else return '';
      }

      /**
       * Gets the owner SMXDoxument
       * @type {SMXDocument}
       * @readonly
       */

    }, {
      key: 'document',
      get: function get() {
        return this._document;
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

        var path = this[0].getAttribute('path');
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

        //remove double slashes
        if (result) result = result.replace(/(https?:\/\/)|(\/)+/g, "$1$2");

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
        var file = this[0].getAttribute('file');

        if (!file) result = this.parent ? this.parent.src : undefined;else result = this.url + file;

        //remove double slashes
        if (result) result = result.replace(/(https?:\/\/)|(\/)+/g, "$1$2");

        return result;
      }

      /**
       * Gets parent node
       * @type {SMXNode}
       * @readonly
       */

    }, {
      key: 'parent',
      get: function get() {
        return this.document.wrap(this[0].parentNode);
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
        return this.ancestors[0] || this;
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
        if (this.type !== 'smx') return [];else return this.document.wrap(this[0].childNodes);
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
        return this.document.wrap(this[0].previousElementSibling || this[0].previousSibling);
      }

      /**
       * Gets next sibling node
       * @type {SMXNode}
       * @readonly
       */

    }, {
      key: 'next',
      get: function get() {
        return this.document.wrap(this[0].nextElementSibling || this[0].nextSibling);
      }
    }]);

    return Node;
  }();

  //inline property getter definition
  //Object.defineProperty(Node.prototype, 'duration', { get: function() { return this.time('duration'); } });

  //extends Node prototype


  Object.assign(Node.prototype, smx.fn);

  //expose
  smx.Node = Node;
})(window, window.smx);
//# sourceMappingURL=Node.js.map
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (global, smx, Sizzle) {

  /**
   * SMX Document Class
   * @memberof smx
   */
  var Document = function () {

    /**
     * @param {XMLDocument}
     */
    function Document(xmlDocument) {
      _classCallCheck(this, Document);

      //requires DOCUMENT_NODE
      if (xmlDocument.nodeType !== 9) throw new Error('Document constructor requires DOCUMENT_NODE');

      /**
       * Original XMLDocument for reference
       * @type {XMLDocument}
       * @protected
       */
      this[0] = xmlDocument;

      /**
       * Contains an id &rarr; key map of all processed nodes for easy acccess.
       * @type {Object}
       * @private
       */
      this._cache = {};
    }

    /**
     * Gets Uniform Resource Locator
     * Concatenation of path values from parent nodes up to document root
     * @type {String}
     * @readonly
     */


    _createClass(Document, [{
      key: 'getNodeById',


      /**
       * Gets the node with the given identifier.
       * @param {String} id
       * @return {SMXNode}
       */
      value: function getNodeById(id) {

        //cached id?
        if (this._cache[id]) return this._cache[id];

        //search in document
        var xmlNode = this[0].getElementById(id);

        //not found
        return this.wrap(xmlNode);
      }

      //gid(id){ return this.getNodeById(id) }

      /**
       * Finds all nodes matching the given selector.
       * @param {String} selector - search selector
       * @param {SMXNode=} context - node context to find inside
       * @return {Array.<SMXNode>}
       */

    }, {
      key: 'find',
      value: function find(selector, ctxNode) {

        if (!selector) return [];
        var nodes = Sizzle(selector, (ctxNode || this)[0]);
        return this.wrap(nodes);
      }

      /**
       * Wraps an existing node or nodes in smx paradigm.
       * @param {XMLNode|XMLNode[]}
       * @return {SMXNode|SMXNode[]}
       */

    }, {
      key: 'wrap',
      value: function wrap(s) {

        if (!s) return;

        var _this = this;
        var _wrapNode = function _wrapNode(xmlNode) {

          var id;

          try {
            id = xmlNode.getAttribute('id');
          } catch (e) {}

          //id attr is required!
          if (!id) return;

          //ensure using the active document
          if (xmlNode.ownerDocument !== _this[0]) return;

          //Does already exists a node with this id?
          //prevent duplicated nodes and return existing one
          if (_this._cache[id]) return _this._cache[id];

          //create new Node from given XMLNode
          var node = new smx.Node(xmlNode);

          //reference node owner document
          node._document = _this;

          //adds wrapped node in cache
          _this._cache[id] = node;

          //return wrapped node
          return node;
        };

        var isArray = s.constructor.name === 'Array';
        var isNodeList = s.constructor.name === 'NodeList';
        if (isArray || isNodeList) {
          //NodeList does not allow .map
          //force array so we can do the mapping
          //s = Array.prototype.slice.call(s);
          return [].map.call(s, function (n) {
            return n[0] ? n : _wrapNode(n);
          });
        } else {
          return s[0] ? s : _wrapNode(s);
        }
      }
    }, {
      key: 'path',
      get: function get() {
        var path = this[0].URL.split('/');
        path.pop();return path.join('/');
      }

      /**
       * Gets the source file url for this document.
       * @type {String}
       * @readonly
       */

    }, {
      key: 'src',
      get: function get() {
        return this[0].URL;
      }

      /**
       * Gets the root node.
       * @type {SMXNode}
       * @readonly
       */

    }, {
      key: 'root',
      get: function get() {
        return this.wrap(this[0].lastChild);
      }
    }]);

    return Document;
  }();

  //expose


  smx.Document = Document;
})(window, window.smx, window.Sizzle);
//# sourceMappingURL=Document.js.map
