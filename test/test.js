var path = require( 'path' );
var assert = require( 'assert' );
var utils = require( '..' );

describe( 'rollup-pluginutils', function () {
	describe( 'createFilter', function () {
		var createFilter = utils.createFilter;

		it( 'includes by default', function () {
			var filter = createFilter();
			assert.ok( filter( path.resolve( 'x' ) ) );
		});

		it( 'excludes IDs that are not included, if include.length > 0', function () {
			var filter = createFilter([ 'y' ]);
			assert.ok( !filter( path.resolve( 'x' ) ) );
			assert.ok( filter( path.resolve( 'y' ) ) );
		});

		it( 'excludes IDs explicitly', function () {
			var filter = createFilter( null, [ 'y' ]);
			assert.ok( filter( path.resolve( 'x' ) ) );
			assert.ok( !filter( path.resolve( 'y' ) ) );
		});

		it( 'handles non-array arguments', function () {
			var filter = createFilter( 'foo/*', 'foo/baz' );
			assert.ok( filter( path.resolve( 'foo/bar' ) ) );
			assert.ok( !filter( path.resolve( 'foo/baz' ) ) );
		});

		it( 'negation patterns', function () {
			var filter = createFilter([ 'a/!(b)/c' ]);
			assert.ok( filter( path.resolve( 'a/d/c' ) ) );
			assert.ok( !filter( path.resolve( 'a/b/c' ) ) );
		});

		it( 'excludes non-string IDs', function () {
			var filter = createFilter( null, null );
			assert.ok( !filter({}) );
		});

		it( 'excludes strings beginning with NUL', function () {
			var filter = createFilter( null, null );
			assert.ok( !filter( '\0someid' ) );
		});

		it( 'includes with regexp', function () {
			var filter = createFilter(['a/!(b)/c' , /\.js$/ ]);
			assert.ok( filter( path.resolve( 'a/d/c' ) ) );
			assert.ok( !filter( path.resolve( 'a/b/c' ) ) );
			assert.ok( filter( path.resolve( 'a.js' ) ) );
			assert.ok( filter( path.resolve( 'a/b.js' ) ) );
			assert.ok( !filter( path.resolve( 'a/b.jsx' ) ) );
		});

		it ('excludes with regexp', function () {
			var filter = createFilter(['a/!(b)/c' , /\.js$/ ], /\.js$/);
			assert.ok( filter( path.resolve( 'a/d/c' ) ) );
			assert.ok( !filter( path.resolve( 'a/b/c' ) ) );
			assert.ok( !filter( path.resolve( 'a.js' ) ) );
			assert.ok( !filter( path.resolve( 'a/b.js' ) ) );
			assert.ok( !filter( path.resolve( 'a/b.jsx' ) ) );
		});
	});

	describe( 'addExtension', function () {
		var addExtension = utils.addExtension;

		it( 'adds .js to an ID without an extension', function () {
			assert.equal( addExtension( 'foo' ), 'foo.js' );
		});

		it( 'ignores file with existing extension', function () {
			assert.equal( addExtension( 'foo.js' ), 'foo.js' );
			assert.equal( addExtension( 'foo.json' ), 'foo.json' );
		});

		it( 'ignores file with trailing dot', function () {
			assert.equal( addExtension( 'foo.' ), 'foo.' );
		});

		it( 'ignores leading .', function () {
			assert.equal( addExtension( './foo' ), './foo.js' );
			assert.equal( addExtension( './foo.js' ), './foo.js' );
		});

		it( 'adds a custom extension', function () {
			assert.equal( addExtension( 'foo', '.wut' ), 'foo.wut' );
			assert.equal( addExtension( 'foo.lol', '.wut' ), 'foo.lol' );
		});
	});

	describe( 'attachScopes', function () {
		var attachScopes = utils.attachScopes;

		it( 'attaches a scope to the top level', function () {
			var ast = {
				'type': 'Program',
				'start': 0,
				'end': 8,
				'body': [
					{
						'type': 'VariableDeclaration',
						'start': 0,
						'end': 8,
						'declarations': [
							{
								'type': 'VariableDeclarator',
								'start': 4,
								'end': 7,
								'id': {
									'type': 'Identifier',
									'start': 4,
									'end': 7,
									'name': 'foo'
								},
								'init': null
							}
						],
						'kind': 'var'
					}
				],
				'sourceType': 'module'
			};

			var scope = attachScopes( ast, 'scope' );
			assert.ok( scope.contains( 'foo' ) );
			assert.ok( !scope.contains( 'bar' ) );
		});

		it( 'adds multiple declarators from a single var declaration', function () {
			var ast = {
				'type': 'Program',
				'start': 0,
				'end': 13,
				'body': [
					{
						'type': 'VariableDeclaration',
						'start': 0,
						'end': 13,
						'declarations': [
							{
								'type': 'VariableDeclarator',
								'start': 4,
								'end': 7,
								'id': {
									'type': 'Identifier',
									'start': 4,
									'end': 7,
									'name': 'foo'
								},
								'init': null
							},

							{
								'type': 'VariableDeclarator',
								'start': 9,
								'end': 12,
								'id': {
									'type': 'Identifier',
									'start': 9,
									'end': 12,
									'name': 'bar'
								},
								'init': null
							}
						],
						'kind': 'var'
					}
				],
				'sourceType': 'module'
			};

			var scope = attachScopes( ast, 'scope' );
			assert.ok( scope.contains( 'foo' ) );
			assert.ok( scope.contains( 'bar' ) );
		});

		it('adds named declarators from a deconstructed declaration', function () {
			var ast = {
				'type': 'Program',
				'start': 0,
				'end': 13,
				'body': [
					{
						'type': 'VariableDeclaration',
						'start': 0,
						'end': 42,
						'declarations': [
							{
								'type': 'VariableDeclarator',
								'start': 4,
								'end': 41,
								'id': {
									'type': 'ObjectPattern',
									'start': 4,
									'end': 15,
									'properties': [
										{
											'type': 'Property',
											'start': 6,
											'end': 10,
											'method': false,
											'shorthand': false,
											'computed': false,
											'key': {
												'type': 'Literal',
												'start': 6,
												'end': 7,
												'value': 1,
												'raw': '1'
											},
											'value': {
												'type': 'Identifier',
												'start': 9,
												'end': 10,
												'name': 'a'
											},
											'kind': 'init'
										},
										{
											'type': 'Property',
											'start': 12,
											'end': 13,
											'method': false,
											'shorthand': true,
											'computed': false,
											'key': {
												'type': 'Identifier',
												'start': 12,
												'end': 13,
												'name': 'b'
											},
											'kind': 'init',
											'value': {
												'type': 'Identifier',
												'start': 12,
												'end': 13,
												'name': 'b'
											}
										}
									]},
								'init': {
									'type': 'ObjectExpression',
									'start': 18,
									'end': 41,
									'properties': [
										{
											'type': 'Property',
											'start': 22,
											'end': 28,
											'method': false,
											'shorthand': false,
											'computed': false,
											'key': {
												'type': 'Literal',
												'start': 22,
												'end': 23,
												'value': 1,
												'raw': '1'
											},
											'value': {
												'type': 'Literal',
												'start': 25,
												'end': 28,
												'value': 'a',
												'raw': '\'a\''
											},
											'kind': 'init'
										},
										{
											'type': 'Property',
											'start': 32,
											'end': 38,
											'method': false,
											'shorthand': false,
											'computed': false,
											'key': {
												'type': 'Identifier',
												'start': 32,
												'end': 33,
												'name': 'b'
											},
											'value': {
												'type': 'Literal',
												'start': 35,
												'end': 38,
												'value': 'b',
												'raw': '\'b\''
											},
											'kind': 'init'
										}
									]
								}
							}
						],
						'kind': 'var'
					}
				],
				'sourceType': 'module'
			};

			var scope = attachScopes(ast, 'scope');
			assert.ok(scope.contains('a'));
			assert.ok(scope.contains('b'));
		});

		it( 'adds rest elements from a deconstructed object declaration', function () {
			var ast = {
				'type': 'Program',
				'start': 0,
				'end': 66,
				'body': [
					{
						'type': 'VariableDeclaration',
						'start': 0,
						'end': 66,
						'declarations': [
							{
								'type': 'VariableDeclarator',
								'start': 6,
								'end': 66,
								'id': {
									'type': 'ObjectPattern',
									'start': 6,
									'end': 26,
									'properties': [
										{
											'type': 'Property',
											'start': 8,
											'end': 9,
											'method': false,
											'shorthand': true,
											'computed': false,
											'key': {
												'type': 'Identifier',
												'start': 8,
												'end': 9,
												'name': 'x'
											},
											'kind': 'init',
											'value': {
												'type': 'Identifier',
												'start': 8,
												'end': 9,
												'name': 'x'
											}
										},
										{
											'type': 'Property',
											'start': 11,
											'end': 15,
											'method': false,
											'shorthand': false,
											'computed': false,
											'key': {
												'type': 'Identifier',
												'start': 11,
												'end': 12,
												'name': 'y'
											},
											'value': {
												'type': 'Identifier',
												'start': 14,
												'end': 15,
												'name': 'z'
											},
											'kind': 'init'
										},
										{
											'type': 'RestElement',
											'start': 17,
											'end': 24,
											'argument': {
												'type': 'Identifier',
												'start': 20,
												'end': 24,
												'name': 'rest'
											}
										}
									]
								},
								'init': {
									'type': 'ObjectExpression',
									'start': 29,
									'end': 66,
									'properties': [
										{
											'type': 'Property',
											'start': 31,
											'end': 36,
											'method': false,
											'shorthand': false,
											'computed': false,
											'key': {
												'type': 'Identifier',
												'start': 31,
												'end': 32,
												'name': 'x'
											},
											'value': {
												'type': 'Literal',
												'start': 34,
												'end': 36,
												'value': 10,
												'raw': '10'
											},
											'kind': 'init'
										},
										{
											'type': 'Property',
											'start': 38,
											'end': 43,
											'method': false,
											'shorthand': false,
											'computed': false,
											'key': {
												'type': 'Identifier',
												'start': 38,
												'end': 39,
												'name': 'y'
											},
											'value': {
												'type': 'Literal',
												'start': 41,
												'end': 43,
												'value': 20,
												'raw': '20'
											},
											'kind': 'init'
										},
										{
											'type': 'Property',
											'start': 45,
											'end': 50,
											'method': false,
											'shorthand': false,
											'computed': false,
											'key': {
												'type': 'Identifier',
												'start': 45,
												'end': 46,
												'name': 'z'
											},
											'value': {
												'type': 'Literal',
												'start': 48,
												'end': 50,
												'value': 30,
												'raw': '30'
											},
											'kind': 'init'
										},
										{
											'type': 'Property',
											'start': 52,
											'end': 57,
											'method': false,
											'shorthand': false,
											'computed': false,
											'key': {
												'type': 'Identifier',
												'start': 52,
												'end': 53,
												'name': 'w'
											},
											'value': {
												'type': 'Literal',
												'start': 55,
												'end': 57,
												'value': 40,
												'raw': '40'
											},
											'kind': 'init'
										},
										{
											'type': 'Property',
											'start': 59,
											'end': 64,
											'method': false,
											'shorthand': false,
											'computed': false,
											'key': {
												'type': 'Identifier',
												'start': 59,
												'end': 60,
												'name': 'k'
											},
											'value': {
												'type': 'Literal',
												'start': 62,
												'end': 64,
												'value': 50,
												'raw': '50'
											},
											'kind': 'init'
										}
									]
								}
							}
						],
						'kind': 'const'
					}
				],
				'sourceType': 'module'
			};

			var scope = attachScopes(ast, 'scope');
			assert.ok(scope.contains('x'));
			assert.ok(!scope.contains('y'));
			assert.ok(scope.contains('z'));
			assert.ok(scope.contains('rest'));
		});

		it('adds nested declarators from a deconstructed declaration', function () {
			var ast = {
				'type': 'Program',
				'start': 0,
				'end': 40,
				'body': [{
					'type': 'VariableDeclaration',
					'start': 0,
					'end': 40,
					'declarations': [{
						'type': 'VariableDeclarator',
						'start': 4,
						'end': 39,
						'id': {
							'type': 'ObjectPattern',
							'start': 4,
							'end': 19,
							'properties': [{
								'type': 'Property',
								'start': 6,
								'end': 17,
								'method': false,
								'shorthand': false,
								'computed': false,
								'key': {
									'type': 'Identifier',
									'start': 6,
									'end': 7,
									'name': 'a'
								},
								'value': {
									'type': 'ObjectPattern',
									'start': 9,
									'end': 17,
									'properties': [{
										'type': 'Property',
										'start': 11,
										'end': 15,
										'method': false,
										'shorthand': false,
										'computed': false,
										'key': {
											'type': 'Identifier',
											'start': 11,
											'end': 12,
											'name': 'b'
										},
										'value': {
											'type': 'Identifier',
											'start': 14,
											'end': 15,
											'name': 'c'
										},
										'kind': 'init'
									}]
								},
								'kind': 'init'
							}]
						},
						'init': {
							'type': 'ObjectExpression',
							'start': 22,
							'end': 39,
							'properties': [{
								'type': 'Property',
								'start': 24,
								'end': 37,
								'method': false,
								'shorthand': false,
								'computed': false,
								'key': {
									'type': 'Identifier',
									'start': 24,
									'end': 25,
									'name': 'a'
								},
								'value': {
									'type': 'ObjectExpression',
									'start': 27,
									'end': 37,
									'properties': [{
										'type': 'Property',
										'start': 29,
										'end': 35,
										'method': false,
										'shorthand': false,
										'computed': false,
										'key': {
											'type': 'Identifier',
											'start': 29,
											'end': 30,
											'name': 'b'
										},
										'value': {
											'type': 'Literal',
											'start': 32,
											'end': 35,
											'value': 'b',
											'raw': '\'b\''
										},
										'kind': 'init'
									}]
								},
								'kind': 'init'
							}]
						}
					}],
					'kind': 'let'
				}],
				'sourceType': 'module'
			};

			var scope = attachScopes(ast, 'scope');
			assert.ok(!scope.contains('a'));
			assert.ok(!scope.contains('b'));
			assert.ok(scope.contains('c'));
		});

		it( 'supports FunctionDeclarations without id', function () {
			var ast = {
				'type': 'Program',
				'start': 0,
				'end': 33,
				'body': [
				    {
						'type': 'ExportDefaultDeclaration',
						'start': 0,
						'end': 32,
						'declaration': {
							'type': 'FunctionDeclaration',
							'start': 15,
							'end': 32,
							'id': null,
							'generator': false,
							'expression': false,
							'async': false,
							'params': [],
							'body': {
								'type': 'BlockStatement',
								'start': 26,
								'end': 32,
								'body': []
							}
						}
					}
				],
				'sourceType': 'module'
			  };

			attachScopes( ast, 'scope' );
			// does not throw
		});

		// TODO more tests
	});

	describe( 'makeLegalIdentifier', function () {
		var makeLegalIdentifier = utils.makeLegalIdentifier;

		it( 'camel-cases names', function () {
			assert.equal( makeLegalIdentifier( 'foo-bar' ), 'fooBar' );
		});

		it( 'replaces keywords', function () {
			assert.equal( makeLegalIdentifier( 'typeof' ), '_typeof' );
		});

		it( 'blacklists arguments (https://github.com/rollup/rollup/issues/871)', function () {
			assert.equal( makeLegalIdentifier( 'arguments' ), '_arguments' );
		});
	});

	describe( 'dataToEsm', function () {
		var dataToEsm = utils.dataToEsm;

		it( 'outputs treeshakable data', function () {
			assert.equal( dataToEsm( { some: 'data', another: 'data' } ), 'export var some = "data";\nexport var another = "data";\nexport default {\n\tsome: some,\n\tanother: another\n};\n' );
		});

		it( 'handles illegal identifiers, object shorthand, preferConst', function () {
			assert.equal( dataToEsm( { '1': 'data', 'default': 'data' }, { objectShorthand: true, preferConst: true } ), 'export default {\n\t"1": "data",\n\t"default": "data"\n};\n' );
		});

		it( 'supports non-JSON data', function () {
			var date = new Date();
			assert.equal( dataToEsm( { inf: Infinity, date: date, number: NaN, regexp: /.*/ } ), 'export var inf = Infinity;\nexport var date = new Date(' + date.getTime() + ');\nexport var number = NaN;\nexport var regexp = /.*/;\nexport default {\n\tinf: inf,\n\tdate: date,\n\tnumber: number,\n\tregexp: regexp\n};\n' );
		});

		it( 'supports a compact argument', function () {
			assert.equal( dataToEsm( { some: 'data', another: 'data' }, { compact: true, objectShorthand: true } ), 'export var some="data";export var another="data";export default{some,another};' );
			assert.equal( dataToEsm( { some: { deep: { object: 'definition', here: 'here' } }, another: 'data' }, { compact: true, objectShorthand: false } ), 'export var some={deep:{object:"definition",here:"here"}};export var another="data";export default{some:some,another:another};' );
		});

		it( 'supports nested objects', function () {
			var obj = { a: { b: 'c', d: ['e', 'f'] } };
			assert.equal( dataToEsm( { obj: obj } ), 'export var obj = {\n\ta: {\n\t\tb: "c",\n\t\td: [\n\t\t\t"e",\n\t\t\t"f"\n\t\t]\n\t}\n};\nexport default {\n\tobj: obj\n};\n' );
		});

		it ( 'supports nested arrays', function () {
			var arr = ['a', 'b'];
			assert.equal( dataToEsm( { arr: arr } ), 'export var arr = [\n\t"a",\n\t"b"\n];\nexport default {\n\tarr: arr\n};\n' );
		});

		it ( 'supports null serialize', function () {
			assert.equal( dataToEsm( { null: null } ), 'export default {\n\t"null": null\n};\n' );
		});

		it ( 'supports default only', function () {
			var arr = ['a', 'b'];
			assert.equal( dataToEsm( { arr: arr }, { namedExports: false } ), 'export default {\n\tarr: [\n\t\t"a",\n\t\t"b"\n\t]\n};' );
		});

		it ( 'default only for non-objects', function () {
			var arr = ['a', 'b'];
			assert.equal( dataToEsm( arr ), 'export default [\n\t"a",\n\t"b"\n];' );
		});
	});
});
