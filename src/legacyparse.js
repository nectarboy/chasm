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
					args = args.slice (1); // Remove prefix

					if (args.length > op.length)
						return throwError (getErrors.args_exceeded ())
					if (args.length < op.length)
						return throwError (getErrors.expected_args ())

					console.log (args);

					var nums = [];
					args.forEach (arg => {
						nums.push (getArgNum (arg));
					});

					var opcode = op (...nums);

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
				else {
					var args = getArgsKeyword (currline, 'data');
					if (!args [0])
						return throwError (getErrors.expected_data ());

					for (var i = 0; i < args.length; i ++) {
						var num = getArgNum (args [i]);
						pc += 1 + num > 0xff;
					}
				}
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