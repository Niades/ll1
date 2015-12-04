(function(window) {
	function LexicalAnalyzer(input) {
		this.input = input;
		this.prevIndex = 0;
		this.index = 0;
		this.length = input.length;
		this.lineCount = this.input.split('\n').length;
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
				regex: /^([a-z_()\+-\/\*,\.]+)$/,
				name: 'Term'
			},
			{
				regex: /^=>$/,
				name: 'Product'
			},
			{
				regex: /^\n$/,
				name: 'Separator'
			}
		];
	}

	LexicalAnalyzer.prototype.getState = function() {
		var lastLineStartIndex = this.input.lastIndexOf('\n', this.index) + 1;
		var columnNo = this.prevIndex - lastLineStartIndex + 1;
		var lineNo = this.input.substring(0, lastLineStartIndex).split('\n').length;
		return {
			lineNo: lineNo,
			columnNo: columnNo
		};
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
		this.prevIndex = this.index;
		var nextToken = null;
		while(this.length != this.index) {
			var prevStr = str;
			var str = this.input.substring(start, this.index);
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
		_.each(this.lexemes, function(lexeme) {
			if(lexemeStates[lexeme.name]) {
				if(nextToken === null){
					nextToken = {
						text: lexeme.regex.exec(str)[0],
						name: lexeme.name
					};
				}
			}
		});
		return nextToken;
	}

	window.LexicalAnalyzer = LexicalAnalyzer;
})(window);