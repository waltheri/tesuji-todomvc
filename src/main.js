/**
 * TodoMVC App in tesuji.js
 */
 
var tesuji = require("tesuji");

var ElementAttributeBinding = require("tesuji/src/attributes/ElementAttributeBinding"); // somehow remove src
var attributeHandlers = require("tesuji/src/attributes/attributeHandlers"); // somehow remove src

var Model = tesuji.Model;
var Type = tesuji.Type;

var FocusBinding = ElementAttributeBinding.extend({
	read: function(value) {
		if(value) this.context.domElement.focus();
	}
}, 'focus');

attributeHandlers.push(FocusBinding);

var TodoAppModel = Model.extend(function(){
	this.todos = new Model.Array([]);
	this.newTodo = "";
	this.page = Type.string("all");
	this.filteredTodos = Model.computed(function(){
		return this.todos.filter(this.filters[this.page]);
	}, null, this);
});

TodoAppModel.prototype.addTodo = function() {
	this.todos.push(new TodoModel(this.newTodo, this));
	this.newTodo = "";
}

TodoAppModel.prototype.removeTodo = function(todo) {
	this.todos.splice(this.todos.indexOf(todo), 1);
}

TodoAppModel.prototype.getIncompleteCount = function() {
	var c = 0;
	for(var i = 0; i < this.todos.length; i++) {
		if(!this.todos[i].isCompleted) c++;
	}
	return c;
}

TodoAppModel.prototype.toggleAll = function() {
	if(this.getIncompleteCount() == 0) {
		for(var i = 0; i < this.todos.length; i++) {
			this.todos[i].isCompleted = false;
		}
	}
	else {
		for(var i = 0; i < this.todos.length; i++) {
			this.todos[i].isCompleted = true;
		}
	}
}

TodoAppModel.prototype.removeCompleted = function() {
	for(var i = this.todos.length-1; 0 <= i; i--) {
		if(this.todos[i].isCompleted) this.removeTodo(this.todos[i]);
	}
}

TodoAppModel.prototype.setPage = function(page) {
	this.page = page;
}

TodoAppModel.prototype.filters = {
	'all': function() {return true},
	'completed': function(todo) {return todo.isCompleted},
	'active': function(todo) {return !todo.isCompleted}
}

var TodoModel = Model.extend(function(label, parent){
	this.isCompleted = false;
	this.isEditing = false;
	this.text = label;
	this.parent = Model.computed(function() {
		return parent;
	});
});

TodoModel.prototype.edit = function(b) {
	this.isEditing = b;
	if(this.isEditing) {
		this.input.focus();
	}
} 

window.todo = new TodoAppModel

var mainComponent = new tesuji.Component.FixedComponent(document.body);
mainComponent.setModel(window.todo);
