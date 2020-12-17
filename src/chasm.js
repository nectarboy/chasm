const _Assemble = function _Assemble (asm, hexout) {

	// Program Properties //
	var pc = 0x200; // Used to keep track of labels and such

	var labels = {};
	var defines = {};

	var line = 0; // Current line of program

	// Assembly Properties
	var binary = [];
	var asmlines = asm.split ('\n');

	// Debug //
	function throwError (error) {
		hexout.innerHTML = `ERROR: ${error}\nline ${line + 1}`;
		throw (error);
	};

	var getErrors = {
		syntax_error: () => 'Syntax Error !',
		illegal_label: label => 'Illegal Label "' + label + '" !',
		illegal_define: define => 'Illegal Define Name "' + define + '" !',
		inv_val: val => 'Invalid Value "' + val + '" !',
		existing_keyword: name => 'Label / Define "' + name + '" Already Exists !',
		undefined_keyword: () => 'Undefined Keyword !',
		undefined_ins: () => 'Undefined Instruction !',
		expected_data: () => 'Expected Data Values !',
		expected_num: () => 'Expected Number Value !',
		expected_define_name: () => 'Expected Define Name !',
		expected_args: () => 'Expected Arguments !',
		args_exceeded: () => 'Arguments Exceeded !',
	};

	// Basic Functions //
	function getArgs (sentence) {
		return (sentence.split (' ').slice (1));
	}

	function push8 (byte) {
		binary.push (byte & 0xff);

		pc = (pc + 1) & 0xffff;
	}
	function push16 (chunk) {
		binary.push ((chunk & 0xff00) >> 8);	// Hi byte
		binary.push (chunk & 0xff);				// Lo byte

		pc = (pc + 2) & 0xffff;
	}

	function pushLabel (label) {
		if (labels [label] || defines [label])
			return throwError (getErrors.existing_keyword (label));
		if (!isNaN (label [0]))
			return throwError (getErrors.illegal_label (label));

		labels [label] = pc;

		// pc = (pc + 1) & 0xffff;
	}

	function getArgNum (arg) {
		// Check if reffering to define
		if (defines [arg] !== undefined)
			return defines [arg];
		else if (labels [arg] !== undefined)
			return labels [arg];

		var prefix = arg.slice (0, 2);
		var num;

		switch (prefix) {
			// Hex
			case '0x': {
				num = parseInt (arg.slice (2), 16);
				break;
			}
			// Binary
			case '0b': {
				num = parseInt (arg.slice (2), 2);
				break;
			}
			default: {
				num = parseInt (arg);
				break;
			}
		}

		if (isNaN (num))
			return false;
		else
			return num;
	}

	function hasWhiteSpace (s) {
		return /\s/g.test (s);
	}

	function isInvalidVal (n) {
		return n === false;
	}

	// Keywords //
	var keywords = {
		'data': function (sentence) {
			var args = getArgs (sentence);
			if (!args [0])
				return throwError (getErrors.expected_data ());

			for (var i = 0; i < args.length; i ++) {
				var num = getArgNum (args [i]);
				if (isInvalidVal (num))
					return throwError (getErrors.inv_val (args [i]));

				if (num > 0xff)
					push16 (num);
				else
					push8 (num);
			}
		},
		'define': function (sentence) {
			var args = getArgs (sentence);
			var key = args [0];

			if (!key)
				return throwError (getErrors.expected_define_name ());
			if (!isNaN (key [0]))
				return throwError (getErrors.illegal_define (key));
			if (!args [1])
				return throwError (getErrors.expected_num ());
			if (args.length > 2)
				return throwError (getErrors.args_exceeded ());

			var num = getArgNum (args [1]);
			if (isInvalidVal (num))
					return throwError (getErrors.inv_val (args [1]));

			if (defines [key] || labels [key])
				return throwError (getErrors.existing_keyword (key));
			defines [key] = num;
		}
	};

	// Instructions //
	function getX (x) {
		return (x & 0xf) << 8;
	}
	function getY (y) {
		return (y & 0xf) << 4;
	}
	function getHinib (nib) {
		return (nib & 0xf) << 12;
	}
	function getLonib (nib) {
		return (nib & 0xf);
	}
	function getNNN (nnn) {
		return (nnn & 0xfff);
	}
	function getKK (kk) {
		return (kk & 0xff);
	}

	var ins = {
		cls: () => 0x00e0,
		ret: () => 0x00ee,
		sys: (nnn) => 0x0000 | getNNN (nnn),

		jmp: (nnn) => 0x1000 | getNNN (nnn),
		call: (nnn) => 0x2000 | getNNN (nnn),

		seq_xkk: (x, kk) => 0x3000 | getX (x) | getKK (kk),
		sne_xkk: (x, kk) => 0x4000 | getX (x) | getKK (kk),

		seq: (x, y) => 0x5000 | getX (x) | getY (y),

		ld_xkk: (x, kk) => 0x6000 | getX (x) | getKK (kk),
		add_xkk: (x, kk) => 0x7000 | getX (x) | getKK (kk),

		ld: (x, y) => 0x8000 | getX (x) | getY (y) | getLonib (0x0),
		or: (x, y) => 0x8000 | getX (x) | getY (y) | getLonib (0x1),
		and: (x, y) => 0x8000 | getX (x) | getY (y) | getLonib (0x2),
		xor: (x, y) => 0x8000 | getX (x) | getY (y) | getLonib (0x3),
		add: (x, y) => 0x8000 | getX (x) | getY (y) | getLonib (0x4),
		sub: (x, y) => 0x8000 | getX (x) | getY (y) | getLonib (0x5),
		shr: (x, y) => 0x8000 | getX (x) | getY (y) | getLonib (0x6),
		subn: (x, y) => 0x8000 | getX (x) | getY (y) | getLonib (0x7),
		shl: (x, y) => 0x8000 | getX (x) | getY (y) | getLonib (0xe),

		sne: (x, y) => 0x9000 | getX (x) | getY (y),

		ldi: (nnn) => 0xa000 | getNNN (nnn),

		jmp_v0: (nnn) => 0xb000 | getNNN (nnn),

		rnd: (x, kk) => 0xc000 | getX (x) | getKK (kk),

		draw: (x, y, lonib) => 0xd000 | getX (x) | getY (y) | getLonib (lonib),

		skp: (x) => 0xe000 | getX (x) | getKK (0x9e),
		sknp: (x) => 0xe000 | getX (x) | getKK (0xa1),

		ld_xdel: (x) => 0xf000 | getX (x) | getKK (0x07),
		halt: (x) => 0xf000 | getX (x) | getKK (0x0a),
		ld_delx: (x) => 0xf000 | getX (x) | getKK (0x15),
		ld_sndx: (x) => 0xf000 | getX (x) | getKK (0x18),
		add_ix: (x) => 0xf000 | getX (x) | getKK (0x1e),
		ld_font: (x) => 0xf000 | getX (x) | getKK (0x29),
		ld_bx: (x) => 0xf000 | getX (x) | getKK (0x33),
		ld_ix: (x) => 0xf000 | getX (x) | getKK (0x55),
		ld_xi: (x) => 0xf000 | getX (x) | getKK (0x65)
	};

	// Chars
	var commentchar = '#';
	var kwchar = '.';
	var labelchar = ':';

	// Interpret Source //
	function checkForIgnore (sentence) {
		return (!sentence || sentence.trim ().startsWith (commentchar));
	}

	function ResetPC () {
		pc = 0x200;
	}

	function getKeyword (sentence) {
		kw = keywords [sentence.split (' ') [0]];
		if (!kw)
			return throwError (getErrors.undefined_keyword ());
		return kw;
	}

	function getOp (sentence) {
		var op = ins [sentence.split (' ') [0]];
		if (!op)
			return throwError (getErrors.undefined_ins ());
		return op;
	}

	// Parsing Functions

	function parseLabels () {
		for (line = 0; line < asmlines.length; line ++) {

			var currline = asmlines [line].trimEnd ();

			if (checkForIgnore (currline))
				continue;

			// Whitespace present - check for data keyword
			if (hasWhiteSpace (currline [0])) {
				currline = currline.trim (); // Remove whitespace

				// Keyword case
				if (currline [0] === kwchar) {

					currline = currline.slice (1); // Remove keyword start
					var kw = getKeyword (currline);

					if (kw === keywords.data) {
						var args = getArgs (currline);
						if (!args [0])
							return throwError (getErrors.expected_data ());

						for (var i = 0; i < args.length; i ++) {
							var num = getArgNum (args [i]);
							if (isInvalidVal (num))
								continue;
							pc += 1 + (num > 0xff);
						}
					}
					else if (kw === keywords.define) {
						kw (currline);
					}

				}
				// Instruction case
				else {
					var op = getOp (currline);
					/*var args = getArgs (currline);

					var nums = [];
					args.forEach (arg => {
						var num = getArgNum (arg);
						if (isInvalidVal (num))
							continue; // Continue parsing scope - not argument scope
						nums.push (num);
					});*/

					pc += 2;
				}

			}
			// No whitespace present - check for label
			else {
				// Check for syntax errors
				if (!currline.endsWith (labelchar) || currline.split (' ').length > 1)
					return throwError (getErrors.syntax_error ());
				pushLabel (currline.slice (0, -1));
			}

		}
	}

	function parseOps () {
		for (line = 0; line < asmlines.length; line ++) {

			var currline = asmlines [line].trimEnd ();

			if (checkForIgnore (currline))
				continue;
			if (!hasWhiteSpace (currline [0]))
				continue;

			currline = currline.trim (); // Remove whitespace

			// Case keywords
			if (currline.startsWith (kwchar)) {

				currline = currline.slice (1); // Remove keyword start
				var kw = getKeyword (currline);

				if (kw !== keywords.data)
					continue;

				kw (currline);

			}
			// Case instructions
			else {

				var op = getOp (currline);
				var args = getArgs (currline);

				// Check if length errors
				if (args.length > op.length)
					return throwError (getErrors.args_exceeded ());
				if (args.length < op.length)
					return throwError (getErrors.expected_args ());

				var nums = [];
				args.forEach (arg => {
					var num = getArgNum (arg);
					if (isInvalidVal (num))
						return throwError (getErrors.inv_val (arg));

					nums.push (num);
				});

				push16 (op (nums [0], nums [1], nums [2]));

			}

		}
	}

	// Begin Parsing
	parseLabels ();
	parseOps ();

	// Done ! //
	console.log ('l:', labels, '\nd:', defines);
	hexout.innerHTML = 'Done !';
	return binary;

};

const _GetHexdump = function _GetHexdump (bin) {
	var str = '';

	for (var i = 0, l = bin.length; i < l; i ++) {
		if (i % 16 === 0)
			str += '\n';

		str += bin [i].toString (16) + ' ';
	}
	return str.slice (1); // Remove excess newline
};

const _GetBinString = function (bin) {
	var str = '';

	for (var i = 0, l = bin.length; i < l; i ++) {
		str += String.fromCharCode (bin [i]);
	}
	return str;
};