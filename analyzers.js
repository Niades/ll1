(function(window) {
	function LexicalAnalyzer(input) {
		this.input = input;
		this.index = 0;
		this.length = input.length;

		this.lexemes = [
			{
				regex: /^epsilon$/,
				name: 'Epsilon'
			},
			{
				regex: /^([A-Z][A-Za-z0-9_]*)$/,
				name: 'NonTerm'
			},
			{
				regex: /^([a-z][A-Za-z_]*)$/,
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
		var self = this;
		this.skipSpaces();
		var lexemeStates = {};
		_.each(this.lexemes, function(lexeme) {
			lexemeStates[lexeme.name] = false;
		});
		var start = this.index;
		while(this.length != this.index) {
			var prevStr = str;
			var str = this.input.substring(start, this.index);
			var nextToken = null;
			_.each(this.lexemes, function(lexeme) {
				if(nextToken === null) {
					var result = lexeme.regex.exec(str);
					if(result !== null) {
						lexemeStates[lexeme.name] = true;
					} else {
						if(lexemeStates[lexeme.name] == true) {
							nextToken = {
								text: lexeme.regex.exec(prevStr)[0],
								name: lexeme.name
							};
							self.index--;
						}
					}
				}
			});		
			if(nextToken != null) {
				return nextToken;
			}
			this.index++;
		}
		return null;
	}

	window.LexicalAnalyzer = LexicalAnalyzer;
})(window);