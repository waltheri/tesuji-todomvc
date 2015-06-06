/** Tests of observables. */

var chai = require("chai");
var assert = require('chai').assert;

var Model = require('../src/Model');
var events = require('../src/utils/events');
var typeOf = require('../src/utils/Type').typeOf;

var genericTest = function(barFunction) {
	return function() {
		var bar;
		
		beforeEach(function(){
			bar = barFunction();
		});
		
		it('Properties have correct values.', function() {
			assert(Object.keys(bar).length == 8);
			
			assert(bar.a === 10);
			assert(bar.b === "Hello");
			assert.deepEqual(bar.c, {val: 20});
			assert.deepEqual(bar.d, [1,2,3]);
			assert(bar.e.toString() === (function(x){}).toString());
			assert(bar.f === true);
			assert(bar.g === false);
			assert(bar.h === null);
		});
		
		it('Properties can be changed.', function() {
			bar.a += 10;
			bar.b += " World";
			bar.c = {newval: 30};
			bar.d = [10,20,30];
			bar.e = function(z){};
			bar.f = false;
			bar.g = true;
			bar.h = {};
			
			assert(bar.a === 20);
			assert(bar.b === "Hello World");
			assert.deepEqual(bar.c, {newval: 30});
			assert.deepEqual(bar.d, [10,20,30]);
			assert(bar.e.toString() === (function(z){}).toString());
			assert(bar.f === false);
			assert(bar.g === true);
			assert.deepEqual(bar.h, {});
		});
		
		it('Object is sealed and inner objects are frozen.', function() {
			bar.x = 100;
			delete bar.a;
			bar.c.val = 30;
			bar.d[0] = 40;
			
			assert.isUndefined(bar.x);
			assert(bar.a === 10);
			assert(bar.c.val === 20);
			assert(bar.d[0] === 1);
		});
		
		it('You can subscribe properties and object.', function() {
			var t1 = false;
			var t2 = false;
			var t3 = false;
			
			bar.subscribe("a", function(value) {
				assert(value === 11);
				t1 = true;
			});
			bar.b += " Wolrd";
			bar.a++;
			assert(t1 === true);
			
			bar.subscribe("h", function(value) {
				assert(value === "Yellow");
				t2 = true;
			});
			bar.subscribe(function(o) {
				assert(o.h === "Yellow");
				t3 = true;
			});
			
			bar.h = "Yellow";
			assert(t2 === true);
			assert(t3 === true);
		});
		
		it('You can unsubscribe properties.', function() {
			var t1 = false;
			var t2 = false;
			var t3 = false;
			
			var fn1 = function(value) {
				assert(value === 50);
				t1 = true;
			};
			var fn2 = function(o) {
				assert(o.a === 50);
				t2 = true;
			};
			var fn3 = function(value) {
				t3 = true;
			};
			
			bar.subscribe("a", fn1);
			bar.subscribe("a", fn1); // shoudn't do anything
			bar.subscribe("a", fn3);
			bar.subscribe(fn2);
			bar.a = 50;
			assert(t1 === true);
			assert(t2 === true);
			assert(t3 === true);
			
			bar.unsubscribe("a", fn1);
			bar.unsubscribe(fn2);
			bar.unsubscribe(fn3); // shoudn't do anything
			
			t1 = false;
			t2 = false;
			t3 = false;
			bar.a = 100;
			assert(t1 === false);
			assert(t2 === false);
			assert(t3 === true);
		});
		
		it('Subscribe dependent variable', function() {
			var dependent;
			
			// dependent function
			var fn = function() {
				dependent = bar.a;
			}
			
			var getterEvent = function(value, parent, key) {
				parent.subscribe(key, fn);
			}
			
			events.on("observable.get", getterEvent);
			fn();
			
			assert(dependent == bar.a);
			bar.a = 20;
			assert(dependent == bar.a);
		});
	}
}

describe('observableObject', function() {
	describe('(1) object instance', genericTest(function() {
		return new Model({
			a: 10,
			b: "Hello",
			c: {val: 20},
			d: [1,2,3],
			e: function(x){},
			f: true,
			g: false,
			h: null,
		});
	}));
	
	describe('(2) object instance advanced', function() {
		it('Observing of custom class instance.', function() {
			var Cls = function() {
				this.a = 10;
			}
			Cls.prototype.fn = function(b) {
				this.a = b;
			}
			
			var foo = new Model(new Cls());
			
			assert(Object.keys(foo).length == 1);
			assert(foo.hasOwnProperty("a") === true);
			assert(foo.a === 10);
			assert(foo.hasOwnProperty("fn") === false);
			assert.isFunction(foo.fn);
			
			var t = false;
			
			foo.subscribe("a", function(value){
				assert(value === 100);
				t = true;
			});
			foo.fn(100);
			assert(t === true);
			assert(foo.a === 100);
		});
	});
	
	describe('(3) class', genericTest(function() {
		var Foo = function() {
			this.a = 10;
			this.b = "Hello";
			this.c = {val: 20};
			this.d = [1,2,3];
			this.e = function(x){};
			this.f = true;
			this.g = false;
			this.h = null;
		}		
		var Bar = Model.extend(Foo);
		return new Bar();
	}));
	
	describe('(4) class advanced', function() {
		var Parent, Child, instance;
		
		beforeEach(function() {
			Parent = function(x, y, z) {
				this.set(x, y);
				this.z = z;
			}
			Parent.prototype.set = function(x, y) {
				this.x = x;
				this.y = y;
			}
			Parent.prototype.get = function() {
				return this.z
			}
			Child = Model.extend(Parent);
			instance = new Child(10, "Hello", {val: 20});
		});
		
		it('Methods are properly inherited', function() {
			assert.instanceOf(instance, Child);
			assert.instanceOf(instance, Parent);
			
			assert(instance.hasOwnProperty("get") === false);
			assert(instance.hasOwnProperty("set") === false);
			assert(Object.keys(instance).length === 3);
			
			assert(instance.x === 10);
			assert(instance.y === "Hello");
			assert.deepEqual(instance.get(), {val: 20});
			
			instance.set(20, "World");
			assert(instance.x === 20);
			assert(instance.y === "World");
		});
		
		it('Nested classes also work', function() {
			var Parent2 = function(z) {
				this.z = z;
				this.a = ":-)";
				this.set(10, 20);
			}
			Parent2.prototype = Object.create(Parent.prototype);
			Parent2.prototype.special = function() {
				
			}
			
			var Child2 = Model.extend(Parent2);
			var instance2 = new Child2(100);
			
			assert.instanceOf(instance2, Child2);
			assert.instanceOf(instance2, Parent2);
			assert.instanceOf(instance2, Parent);
			assert(Object.keys(instance2).length == 4);
			
			assert(instance2.a === ":-)");
			assert(instance2.x === 10);
			assert(instance2.y === 20);
			assert.deepEqual(instance2.get(), 100);
			
			instance2.special();
		});
	});
	
	describe('(5) condition variables', function() {
		var foo, bar;
		
		beforeEach(function() {
			foo = {
				a: typeOf(Number, 10),
				b: typeOf(String, "Hello"),
				c: typeOf(Boolean, false),
				d: typeOf(Object, {a: 20}),
			};
			
			bar = new Model(foo);
		});
		
		it('Their values are correct.', function() {
			assert(bar.a === 10);
			assert(bar.b === "Hello");
			assert(bar.c === false);
			assert.deepEqual(bar.d, {a: 20});
		});
		
		it('Properties can be changed, if a type is correct.', function() {
			bar.a += 20;
			bar.b += " World";
			bar.c = true;
			bar.d = {b: 40};
			
			assert(bar.a === 30);
			assert(bar.b === "Hello World");
			assert(bar.c === true);
			assert.deepEqual(bar.d, {b: 40});
		});
		
		it('Assigning of invalid values throws an exception', function() {
			var f1 = function() {
				bar.a = "string";
			}
			var f2 = function() {
				bar.b = 50;
			}
			var f3 = function() {
				bar.c = {};
			}
			var f4 = function() {
				bar.d = "string";
			}
			
			assert.throws(f1, TypeError);
			assert.throws(f2, TypeError);
			assert.throws(f3, TypeError);
			assert.throws(f4, TypeError);

			assert(bar.a === 10);
			assert(bar.b === "Hello");
			assert(bar.c === false);
			assert.deepEqual(bar.d, {a: 20});
		});
	});
	
	describe('(6) array', function() {
		var foo, bar;
		
		beforeEach(function() {
			foo = [10, "Something", {val: 2}];
			bar = new Model.Array(foo);
		});
		
		it('Values are preserved from original array', function() {
			assert(bar.length === 3);
			assert(bar[0] === 10);
			assert(bar[1] === "Something");
			assert.deepEqual(bar[2], {val: 2});
			assert.instanceOf(bar, Array);
		});
		
		it('Array operations.', function() {
			// ["pop", "push", "reverse", "shift", "unshift", "splice", "sort"];
			
			assert.deepEqual(bar.pop(), {val: 2});
			assert(bar.length === 2);
			assert.isUndefined(bar[2]);
			
			assert.deepEqual(bar.push(12), 3);
			assert(bar[2] === 12);
			
			bar.reverse();
			assert(bar[0] === 12);
			assert(bar[1] === "Something");
			assert(bar[2] === 10);
			
			assert(bar.shift() === 12);
			assert(bar.length === 2);
			assert(bar[0] == "Something");
			assert(bar[1] == 10);
			
			assert(bar.unshift(20,30) === 4);
			assert(bar[0] === 20);
			assert(bar[3] === 10);
			
			bar.splice(2, 1, 7);
			assert(bar[2] === 7);
			
			bar[2] = 0;
			bar.sort();
			assert(bar[0] === 0);
			assert(bar[1] === 10);
			assert(bar[2] === 20);
			assert(bar[3] === 30);
		});
		
		it('Array notifications.', function() {
			var t1 = false;
			var t2 = false;			
			var f1 = function() {
				assert(bar[3] === null);
				t1 = true;
			}
			var f2 = function(val) {
				assert(bar === val);
				t2 = true;
			}
			
			bar.subscribe(f1);
			bar.push(null);
			assert(t1 === true);
			
			bar.subscribe(f2);
			t1 = false;
			bar.splice(0,1,789);
			assert(t1 === true);
			assert(t2 === true);
			
			t1 = false;
			t2 = false;
			bar.unsubscribe(f1);
			bar.sort();
			assert(t1 === false);
			assert(t2 === true);
		});
	});
});
