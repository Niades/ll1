(function(window) {
	function NonTerm(name) {
		this.name = name;
	}

	function Term(name) {
		this.name = name;
	}

	var EPSILON = new Epsilon();
	function Epsilon() {
		this.name = "Epsilon";
	}
	var EOF = new Eof();
	function Eof() {
		this.name = "EOF";
	}

	function Product(head, result, start) {
		this.head = head;
		this.result = result;
		if(start === undefined) {
			this.start = false;
		} else {
			this.start = start;
		}
	}

	function Grammar(products) {
		this.products = products;
	}

	Grammar.prototype.first = function(symbol) {
		if(_.isArray(symbol)){
			var includeNext = true;
			_.each(symbol, function(r) {
				if(includeNext) {
					var firstr = self.first(r);
					if(_.indexOf(firstr, EPSILON) == -1) {
						includeNext = false;
					}
					result = _.union(result, firstr);
				}
			});
			return result;
		} else {
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
		}
		return result;
	}

	Grammar.prototype.follow = function(symbol) {
		var self = this;
		var result = [];
		if(symbol.name == this.getStartNt().name) {
			return [EOF];
		}
		_.each(this.products, function(product) {
			// I'm assuming that the non-term only occurs once
			// in this production
			// I'm also assuming that due to name equality, type
			// will also be the same (that's true because of the
			// way grammar is parsed, but will not be true outside
			// this particular case)
			var ntIndex = _.findIndex(product.result, function(r) { return r.name == symbol.name; });
			if(ntIndex !== -1) {
				if(product.head.name == product.result[ntIndex].name) {
					return [];
				}
				if(ntIndex == product.result.length - 1) {
					// This is the very last non-term in product
					result = _.union(result, self.follow(product.head));
				} else if(ntIndex < product.result.length - 1) {
					// It is not the last
					// Adding first of the first element
					var f = self.first(product.result[ntIndex + 1]);
					// If first contains epsilon
					if(_.indexOf(f, EPSILON) >= -1) {
						result = _.union(result, self.follow(product.head));
					}
					result = _.union(result, _.difference(f, [EPSILON]));
				}
			} else {
				// It is not in the product at all
				// Do nothing
			}
		});
		return result;
	}

	Grammar.prototype.getStartNt = function() {
		return _.find(this.products, function(p) {return p.start}).head;
	}

	function TermParser() {

	}

	window.Term = Term;
	window.NonTerm = NonTerm;
	window.Product = Product;
	window.Grammar = Grammar;
	window.EPSILON = EPSILON;
})(window);

