(function() {
	'use strict';
	var g;
	var errors = [];
	function parseGrammar() {
		errors = [];
		function except(msg) {
			errors.push({
				pos: analyzer.getState(),
				msg: msg
			});
		}
		var analyzer = new LexicalAnalyzer(document.querySelector('textarea').value);
		var firstDone = false;
		var rules = [];
		while(true) {
			var token = analyzer.getNextToken();
			if(token === null)
				break;
			if(token.name != 'NonTerm') {
				except('Ожидался нетерминал');
			}
			var head = new NonTerm(token.text);
			token = analyzer.getNextToken();
			if(token && token.name != 'Product') {
				except('Ожидался знак продукции');
			}
			token = analyzer.getNextToken();
			if(token && token.name != 'Term' && token.name != 'NonTerm' && token.name != 'Epsilon') {
				except('Тело продукции не может быть пустым');
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
					except('Продукция может содержать только нетерминалы и терминалы');
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
		if(errors.length == 0) {
			g = new Grammar(rules);
		}
	}

	function render() {
		if(errors.length > 0) {
			var $errors = $('.errors');
			$errors.html('');
			_.each(errors, function(error) {
				$errors.append('<div>' + error.msg + ':' + error.pos.columnNo + ':' + error.pos.lineNo + '</div>');
			});
		} else {
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
			$('.errors').html('');
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
		$('textarea').on('keyup', function() {
			parseGrammar();
			location.hash = LZString.compressToEncodedURIComponent($('textarea').val());
			$('.grammar-link').val(location.toString());
			render();
		});
	}

	$(document).ready(function() {
		if(location.hash !== "") {
			$('textarea').val(LZString.decompressFromEncodedURIComponent(location.hash.substr(1)));
			$('.grammar-link').val(location.toString());
		}
		parseGrammar();
		attachDomEventHandlers();
		render();
	});
})();