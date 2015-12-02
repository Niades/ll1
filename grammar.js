(function(window) {
	function NonTerm(name) {
		this.name = name;
	}

	function Term(name) {
		this.name = name;
	}

	var EPSILON = new Epsilon();
	function Epsilon() {
		return EPSILON;
	}

	function Product(head, result) {
		this.head = head;
		this.result = result;
	}

	function Grammar(products) {
		this.products = products;
	}

	Grammar.prototype.first = function(symbol) {
		if(symbol instanceof Term) {
			return [symbol];
		}
		var self = this;
		var result = [];
		_.each(this.products, function(product) {
			if(product.head.name == symbol.name) {
				// If the rule produces EPSILON
				if(_.indexOf(product.result, EPSILON) > -1) {
					result.push(EPSILON);
				} else {
					var includeNext = true;
					_.each(product.result, function(r) {
						if(includeNext) {
							if(r.name != product.head.name) {
								var firstr = self.first(r);
								if(_.indexOf(firstr, EPSILON) == -1) {
									includeNext = false;
								}
								result = _.union(result, firstr);
							} else {
								console.info('Avoided recursion.');
							}
						}
					});
				}
			}
		});
		return result;
	}

	Grammar.prototype.follow = function(symbol) {
		_.each(this.products, function(product) {

		});
	}

	function TermParser() {

	}

	window.Term = Term;
	window.NonTerm = NonTerm;
	window.Product = Product;
	window.Grammar = Grammar;
	window.EPSILON = EPSILON;
})(window);

