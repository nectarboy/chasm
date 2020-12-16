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
	function getArgsKeyword (currline, keyword) {
		return (currline.slice (keyword.length + 1)).split (' ');
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
		if (defines [arg])
			return defines [arg];
		else if (labels [arg])
			return labels [arg];

		var prefix = arg [0] + arg [1];
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
			return throwError (getErrors.inv_val (arg));
		else
			return num;
	}

	function hasWhiteSpace (s) {
		return /\s/g.test (s);
	}

	// Opcode Getter Function Thingies //
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

	// Keywords //
	var keywords = {
		'data': function (currline) {
			var args = getArgsKeyword (currline, 'data');
			if (!args [0])
				return throwError (getErrors.expected_data ());

			for (var i = 0; i < args.length; i ++) {
				var num = getArgNum (args [i]);

				if (num > 0xff)
					push16 (num);
				else
					push8 (num);
			}
		},
		'define': function (currline) {
			var args = getArgsKeyword (currline, 'define');
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

			if (defines [key])
				return throwError (getErrors.existing_keyword (key));
			defines [key] = num;
		}
	};

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

	// Interpret Source //
	function interpretLine () {
		var currline = asmlines [line].trimEnd ();
		if (!currline || currline.trim ().startsWith ('#'))
			return line += 1;

		if (hasWhiteSpace (currline [0])) {

			currline = currline.trim ();

			if (currline.startsWith ('.')) {
				currline = currline.slice (1); // Discard '.'

				var keyword = keywords [currline.split (' ') [0]] // Get keyword
				if (!keyword)
					return throwError (getErrors.undefined_keyword ());
				if (keyword === keywords.data)
					keyword (currline);
			}
			else {

				currline = currline.trim (); // Discard whitespace at beggining

				var args = currline.split (' ');
				var op = ins [args [0]];

				if (op) {
					args.slice (1); // Remove prefix

					if (args.length - 1 > op.length)
						return throwError (getErrors.args_exceeded ())
					if (args.length - 1 < op.length)
						return throwError (getErrors.expected_args ())

					console.log (args);

					var opcode = op (args);

					console.log (opcode.toString (16));
					push16 (opcode);
				}
				else {
					return throwError (getErrors.undefined_ins ());
				}

			}

		}

		line += 1;
	}

	function parseKeywords () {
		var currline = asmlines [line].trimEnd ();
		if (!currline || currline.trim ().startsWith ('#'))
			return line += 1;

		if (!hasWhiteSpace (currline [0])) {

			// Push label
			var label = currline.split (' ');
			if (label.length > 1 || !label [0].endsWith (':'))
				return throwError (getErrors.syntax_error ());

			pushLabel (label [0].slice (0, -1));

		}
		else {

			currline = currline.trim (); // Discard whitespace at beggining

			// Check for keywords
			if (currline.startsWith ('.')) {
				currline = currline.slice (1); // Discard '.'

				var keyword = keywords [currline.split (' ') [0]] // Get keyword
				if (!keyword)
					return throwError (getErrors.undefined_keyword ());
				if (keyword === keywords.define)
					keyword (currline);
			}

		}

		line += 1;
	}

	for (var i = 0, l = asmlines.length; i < l; i ++) {
		parseKeywords ();
	}
	line = 0;
	for (var i = 0, l = asmlines.length; i < l; i ++) {
		interpretLine ();
	}

	// Done ! //
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