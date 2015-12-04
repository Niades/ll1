(function(window) {
	function NonTerm(name) {
		this.name = name;
	}

	function Term(name) {
		this.name = name;
	}

	function Epsilon() {
		this.name = "ε";
	}
	Epsilon.prototype = Object.create(Term.prototype);
	var EPSILON = new Epsilon();
	function Eof() {
		this.name = "$";
	}
	Eof.prototype = Object.create(Term.prototype);
	var EOF = new Eof();

	function Product(head, result, start) {
		this.head = head;
		this.result = result;
		if(start === undefined) {
			this.start = false;
		} else {
			this.start = start;
		}
	}

	Product.prototype.toHtml = function() {
		return '<span class="non-term">' +
				this.head.name +
			   '</span>' +  
			   ' <span class="product-sign">=></span> ' +
			   (this.result
			   		.map(
						function(r) {
							var klass;
							if(r instanceof Term) {
								klass = 'term';
							} else if(r instanceof NonTerm) {
								klass = 'non-term';
							}
							console.log(klass);
							return ('<span class="' + klass + '">' + r.name + '</span>');
						}
					)
					.join(' ')
				);
	}

	function Grammar(products) {
		this.products = products;
	}

	Grammar.prototype.first = function(symbol) {
		var self = this;
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
					var f = self.first(_.slice(product.result, ntIndex + 1));
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

	Grammar.prototype.getTable = function() {
		var self = this;
		var result = {};
		_.each(this.products, function(product) {
			var containsEps = false;
			_.each(self.first(product.result), function(r) {
				if(r == EPSILON) {
					containsEps = true;
				}
				if(result[product.head.name] === undefined) {
					result[product.head.name] = {};
				}
				result[product.head.name][r.name] = product;
			});
			if(containsEps) {
				_.each(self.follow(product.head), function(r) {
					if(result[product.head.name] === undefined) {
						result[product.head.name] = {};
					}
					result[product.head.name][r.name] = product;
				});
			}
		});
		return result;
	}

	Grammar.prototype.getStartNt = function() {
		return _.find(this.products, function(p) {return p.start}).head;
	}

	Grammar.prototype.getAllSymbols = function() {
		var result = [];
		_.each(this.products, function(p) {
			result.push(p.head);
			_.each(p.result, function(r) {
				result.push(r);
			});
		});
		return _.uniq(result, 'name');
	}

	Grammar.prototype.getAllNTs = function() {
		return _.uniq(_.map(this.products, function(p) { return p.head }), 'name');
	}

	Grammar.prototype.getAllTs = function() {
		return _.union(_.filter(this.getAllSymbols(), function(s){ return s instanceof Term && s!==EPSILON && s !== EOF; }), [EOF]);
	}

	window.Term = Term;
	window.NonTerm = NonTerm;
	window.EPSILON = EPSILON;
	window.Product = Product;
	window.Grammar = Grammar;
})(window);

