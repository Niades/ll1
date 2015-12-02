(function() {
	'use strict';
	var analyzer = new LexicalAnalyzer(document.querySelector('textarea').value);
	console.info('Initialized');
	var token = analyzer.getNextToken();
	while(token != null) {
		console.log(token);
		token = analyzer.getNextToken();
	}
})();