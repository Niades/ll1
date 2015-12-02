(function() {
	'use strict';
	var g;
	function parseGrammar() {
		function except(msg) {
			alert('Error! ' + msg);
			throw new Error(msg);
		}
		var analyzer = new LexicalAnalyzer(document.querySelector('textarea').value);
		console.info('Lexical analyzer initialized.');
		var firstDone = false;
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
			if(firstDone) {
				var rule = new Product(head, result);
			} else {
				var rule = new Product(head, result, true);
			}
			rules.push(rule);
		}
		g = new Grammar(rules);
		console.info('Parsing completed.');
	}

	function render() {
		var all = g.getAllNTs();
		var $firstSelect = $('.first-select');
		$firstSelect.html('<option value="">--</option>');
		_.each(all, function(symbol) {
			$firstSelect.append('<option value="' + symbol.name + '">' + symbol.name + '</option>');
		});
		var $followSelect = $('.follow-select');
		$followSelect.html('<option value="">--</option>');
		_.each(all, function(symbol) {
			$followSelect.append('<option value="' + symbol.name + '">' + symbol.name + '</option>');
		});
		var terms = g.getAllTs();
		var nterms = g.getAllNTs();
		var table = g.getTable();
		var $table = $('.parse-table');
		var tableHtml = '<tr><th></th>'
		_.each(terms, function(t) {
			tableHtml += '<th>' + t.name + '</th>';
		});
		tableHtml += '</tr>';
		_.each(nterms, function(nt) {
			tableHtml += '<tr>';
			tableHtml += '<td><b>' + nt.name + '</b></td>';
			_.each(terms, function(t) {
				tableHtml += '<td>'; 
				if(table[nt.name]){
					if(table[nt.name][t.name]) {
						tableHtml += table[nt.name][t.name].toString();
					}
				}
				tableHtml += '</td>';
			});
		});
		$table.html(tableHtml);
	}

	function attachDomEventHandlers() {
		$('.first-select').on('change', function() {
			var f = g.first(new NonTerm($(this).val()));
			$('.first-result').html(f.map(function(s){return s.name}).join(', '));
		});
		$('.follow-select').on('change', function() {
			var f = g.follow(new NonTerm($(this).val()));
			$('.follow-result').html(f.map(function(s){return s.name}).join(', '));
		});
	}

	$('#do-parse').on('click', function() {
		parseGrammar();
		render();
	});
	$(document).ready(function() {
		parseGrammar();
		attachDomEventHandlers();
		render();
	});
})();