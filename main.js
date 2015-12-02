(function() {
	'use strict';
	function except(msg) {
		throw new Error(msg);
	}
	var analyzer = new LexicalAnalyzer(document.querySelector('textarea').value);
	console.info('Initialized');
	var rules = [];
	while(true) {
		var token = analyzer.getNextToken();
		if(token === null)
			break;
		if(token.name != 'NonTerm') {
			except('Expected NonTerm');
		}
		var head = new NonTerm(token.text);
		token = analyzer.getNextToken();
		if(token.name != 'Product') {
			except('Expected Product Sign');
		}
		token = analyzer.getNextToken();
		if(token.name != 'Term' && token.name != 'NonTerm' && token.name != 'Epsilon') {
			console.log(token.name)
			except('Rule cannot have an empty body');
		}
		var result = [];
		while(token !== null && token.name != 'Separator') {
			if(token.name == 'Term') {
				result.push(new Term(token.text));
			} else if(token.name == 'NonTerm') {
				result.push(new NonTerm(token.text));
			} else if(token.name == 'Epsilon') {
				result.push(EPSILON);
			} else {
				except('Rule contains neither term nor nonterm nor epsilon');
			}
			token = analyzer.getNextToken();
		}
		var rule = new Product(head, result);
		rules.push(rule);
	}
	var g = new Grammar(rules);
	console.info('Parsing completed.');
	console.log('FIRST(GOAL)=');
	console.log(g.first(new NonTerm('GOAL')));
})();