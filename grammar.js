(function(window) {
	_.deepIndexOf = function(array, object) {
		var index = -1;
		_.each(array, function(el, i) { if(_.eq(el, object)) { index = i; return false; } });
		return index;
	}

	_.deepContains = function(array, object) {
		return _.deepIndexOf(array, object) > -1;
	}

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

	Product.prototype.toString = function() {
		return this.head.name + ' => ' + _.map(this.result, function(item) {return item.name}).join(' ');
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
							return ('<span class="' + klass + '">' + r.name + '</span>');
						}
					)
					.join(' ')
				);
	}

	function Item(product, dotPos) {
		this.product = product;
		this.dotPos = dotPos;
	}

	Item.prototype.getFollowingSymbol = function() {
		return this.product.result[this.dotPos];
	}

	Item.prototype.toString = function() {
		var dotPos = this.dotPos;
		var productStr = this.product.toString();
		var parts = productStr.split(' => ');
		var results = parts[1].split(' ');
		results = _
			.map(results, function(r, i) {
				if(i == dotPos)
					r = "•" + r;
				return r;
			})
			.join(' ');
		if(results.indexOf("•") == -1) {
			results += "•";
		}
		return parts[0] + " => " + results;
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
			console.log('FIRST(' + symbol.name + ')');
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
		console.log('Getting FOLLOW(' + symbol.name + ')');
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
					console.log('#3, adding FOLLOW(' + product.head.name + ')');
					result = _.union(result, self.follow(product.head));
				} else if(ntIndex < product.result.length - 1) {
					// It is not the last
					var tail = _.slice(product.result, ntIndex + 1);
					console.log(tail);
					console.log('#1, adding FIRST(' + tail.map(function(a){return a.name}).join(" ") + ')');
					var f = self.first(tail);
					// If first contains epsilon
					if(_.indexOf(f, EPSILON) > -1) {
						console.log('#4, adding FOLLOW(' + product.head.name + ')');
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

	Grammar.prototype.closure = function(item) {
		var self = this;
		var result = [];
		if(!_.isArray(item)) {
			item = [item];
		}
		result = _.union(item, result);
		var len = 0;
		do {
			len = result.length;
			_.each(result, function(item) {
				var followingSymbol = item.getFollowingSymbol();
				if(followingSymbol == undefined)
					return;
				_.each(self.products, function(product) {
					if(product.head.name == followingSymbol.name) {
						var item = new Item(product, 0);
						if(_.deepIndexOf(result, item) == -1)
							result.push(new Item(product, 0));
					}
				});
			});
		} while(result.length != len);
		return result;
	}

	Grammar.prototype.goto = function(items, symbol) {
		var result = [];
		_.each(
			_.filter(items, function(item) 
				{ 
					var next = item.getFollowingSymbol();
					return next && next.name == symbol.name;
				}),
			function(item) {
				result.push(new Item(item.product, item.dotPos + 1));
			}
		)
		return this.closure(result);
	}

	Grammar.prototype.gotoNoClosure = function(items, symbol) {
		var result = [];
		_.each(
			_.filter(items, function(item) 
				{ 
					var next = item.getFollowingSymbol();
					return next && next.name == symbol.name;
				}),
			function(item) {
				result.push(new Item(item.product, item.dotPos + 1));
			}
		)
		return result;
	}

	Grammar.prototype.getAllTransitionSymbols = function(from, to) {
		var self = this;
		var symbols = this.getAllSymbols();
		var result = [];
		_.each(symbols, function(symbol) {
			_.each(self.gotoNoClosure(from, symbol), function(item) {
				if(_.deepContains(to, item)) {
					if(!_.deepContains(result, symbol)) {
						result.push(symbol);
					}
				}
			});
		});
		return result;
	}

	Grammar.prototype.canonicalSet = function() {
		var self = this;
		var result = [];
		var symbols = this.getAllSymbols();
		var startProduct = this.products[0];
		var startItem = new Item(startProduct, 0);
		result.push(this.closure(startItem));
		var trans = [];
		var hasChanged = false;
		do {
			hasChanged = false;
			var length = result.length;
			_.each(result, function(set, i) {
				_.each(symbols, function(symbol) {
					var g = self.goto(set, symbol);
					if(g.length > 0 && _.deepIndexOf(result, g) == -1) {
						result.push(g);
						_.each(result, function(set, j) {
							_.each(self.getAllTransitionSymbols(g, set), function(symbol) {
								trans.push({
									from: length,
									by: symbol.name,
									to: j
								});
							});
						});
						trans.push({
							from: i,
							by: symbol.name,
							to: length
						});
						length++;
						hasChanged = true;	
					}
				});
			});
		} while(hasChanged);
		result.transitions = trans;
		return result;
	}

	Grammar.prototype.getCanonicalSetTransitions = function() {
		var self = this;
		var symbols = this.getAllSymbols();
		var set = this.canonicalSet();
		var result = [];
		_.each(set, function(items1, i) {
			_.each(symbols, function(symbol) {
				_.each(self.gotoNoClosure(items1, symbol), function(item) {
					_.each(set, function(items2, j) {
						if(_.deepContains(items2, item)) {
							var transition = {
								from: i,
								by: symbol,
								to: j
							};
							if(!_.deepContains(result, transition)) {					
								console.log('I' + j + ' contains ', item.toString());
								console.log('which is reachable from I' + i + ' by ' + symbol.name);
								result.push(transition);
							}
						}
					});
				});
			});
		});
		return result;
	}

	Grammar.prototype.getSLRTable = function() {
		var set = this.canonicalSet();

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
	window.Item = Item;
	window.EPSILON = EPSILON;
	window.Product = Product;
	window.Grammar = Grammar;
})(window);

