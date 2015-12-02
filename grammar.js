(function(window) {
	function LexicalAnalyzer(input) {
		this.input = input;
		this.index = 0;
		this.length = input.length;

		this.lexemes = [
			{
				regex: /^([A-Z][A-Za-z]*)$/,
				name: 'NonTerm'
			},
			{
				regex: /^([a-z][A-Za-z]*)$/,
				name: 'Term'
			},
			{
				regex: /^->$/,
				name: 'Product'
			},
			{
				regex: /^\n$/,
				name: 'Separator'
			}
		];
	}

	LexicalAnalyzer.prototype.skipSpaces = function() {
		var spaces = [
			' ',
			'\r',
			'\t'
		];
		while(_.indexOf(spaces, this.input[this.index]) != -1 && this.length != this.index) {
			this.index++;
		}
	}

	LexicalAnalyzer.prototype.getNextToken = function() {
		this.skipSpaces();
		var start = this.index;
		while(this.length != this.index) {
			var str = this.input.substring(start, this.index);
			for(var i in this.lexemes) {
				var lexeme = this.lexemes[i];
				if(typeof(lexeme) == 'object') {
					var result = lexeme.regex.exec(str);
					if(result !== null) {
						return {
							text: result[0],
							name: lexeme.name
						};
					}
				}
			}
			this.index++;
		}
		return null;
	}

	window.LexicalAnalyzer = LexicalAnalyzer;
})(window);

