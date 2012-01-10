var components		= [];
var effects		= [];
var processors		= [];
var generators		= [];
var controls		= [];
var classes		= [];
var markdown		= typeof Showdown === 'undefined' ? null : new Showdown.converter;

function FuncToString(){
	return this.assignName;
}

// Fix HTML stuff (lol)
function fh(str){
	return str.replace(/[<>]/g, function(a){return a==='<'?'&lt;':'&gt;'});
}

function parseText(text){
	return (!markdown ? fh(text.split('\n').join('<br/>')) : markdown.makeHtml(text)).replace(/\[\[([^\]]+)\]\]/g, function(a, b){
		return '<a href="' + b + '">' + b + '</a>';
	});
}

documentation.forEach(function(func){
	if (!func.assignName && !func.class) return;
	func.effect && effects.push(func);
	func.processor && processors.push(func);
	func.generator && generators.push(func);
	func.control && controls.push(func);
	func.class && classes.push(func);
	func.toString = FuncToString;
});

[effects, processors, generators, controls].forEach(function(func){
	func.sort();
});

components = components.concat(effects, processors, generators, controls, classes);

function findByParam(arr, name, value) {
	return arr.filter(function(obj){
		return obj[name] === value;
	});
}

// Just orphans.
var methods = [];

documentation.forEach(function(func){
	if (!func.method) return;
	var parent = func.methodOf && findByParam(components, 'name', func.methodOf)[0];
	if (parent) {
		parent.methods = parent.methods || [];
		parent.methods.push(func);
	} else {
		methods.push(func);
	}
});

var	content	= document.querySelector('div.content');
var	nav	= document.querySelector('nav');
function addNav(name, href) {
	var elem	= document.createElement('a');
	elem.href	= href || name;
	elem.innerHTML	= name;
	nav.appendChild(elem);
}

components.forEach(function(func){
	var elem = document.createElement('section');
	elem.classList.add('component');
	func.effect && elem.classList.add('effect');
	func.processor && elem.classList.add('processor');
	func.generator && elem.classList.add('generator');
	func.control && elem.classList.add('control');

	var html = '<h2>' + (func.static ? func.methodOf + '.' : '') + (func.assignName || func.name) + '</h2>';
	html += '<p>' + parseText(func.text) + '</p>';

	if (func.arglist) {
		html += '<h3>Arguments</h3>';
		html += '<ul class="arglist">';
		func.arglist.forEach(function(arg){
			var info = arg.assignsToClass ? findByParam(func.params, 'name', arg.name)[0] || arg : arg;
			html += '<li';
			var k;
			for (k in info) {
				if (typeof info[k] === 'string') {
					html += ' data-' + k + '="' + info[k] + '"'
				}
			}
			html += '>';
			if (arg.optional) html += '<span class="optional">Optional</span> ';
			if (info.type) html += '<span class="type">' + fh(info.type) + '</span> ';
			html += '<span class="name">' + info.name + '</span> ';
			html += '<span class="description">' + parseText(info.description) + '</span> ';
		});
		html += '</ul>';
	}

	if (func.methods) {
		html += '<h3>Methods</h3>';
		func.methods.forEach(function(method){
			html += '<div class="method"><h4>';
			if (method.static) {
				html += '<span class="static">(Static)</span> ';
			}
			html += method.name + '(';
			if (method.arglist) {
				html += method.arglist.map(function(a){ return a.name }).join(', ');
			}
			html += ')</h4><p>' + method.text + '</p>';
			if (method.arglist) {
				html += '<h5>Arguments</h5>';
				html += '<ul class="arglist">';
				method.arglist.forEach(function(arg){
					var info = arg.assignsToClass ? findByParam(func.params, 'name', arg.name)[0] || arg : arg;
					html += '<li';
					var k;
					for (k in info) {
						if (typeof info[k] === 'string') {
							html += ' data-' + k + '="' + info[k] + '"'
						}
					}
					html += '>';
					if (arg.optional) html += '<span class="optional">Optional</span> ';
					if (info.type) html += '<span class="type">' + fh(info.type) + '</span> ';
					html += '<span class="name">' + info.name + '</span> ';
					html += '<span class="description">' + parseText(info.description) + '</span> ';
				});
				html += '</ul>';
			}

			if (method.returns) {
				html += '<h5>Returns</h5>';
				html += '<div class="return">';
				if (method.returns.type) html += '<span class="type">' + fh(method.returns.type) + '</span> ';
				html += '<span class="description">' + parseText(method.returns.description) + '</span> ';
				html += '</div>';
			}
			html += '</div>';
		});
	}

	var groups = [];
	['effect', 'processor', 'generator', 'control'].forEach(function(name){
		func[name] && groups.push(name);
		func['sub' + name] && groups.push('sub' + name);
	});
	if (groups.length) html += '<h3>Groups</h3><ul class="groups"><li>' + groups.join('</li><li>') + '</li></ul>';

	if (func.generator || func.control) {
		html += '<div class="inherits">Inherits <a href="Generator">Generator</a>.';
	}

	if (func.effect || func.processor) {
		html += '<div class="inherits">Inherits <a href="Effect">Effect</a>.';
	}

	elem.innerHTML = html;

	func.elem = elem;
	content.appendChild(elem);

	addNav((func.static ? func.methodOf + '.' : '') + (func.assignName || func.name), func.assignName || func.name);
});

var searchbox = document.getElementById('search');
searchbox.oninput = function(){
	var src = this.value.toLowerCase();
	components.forEach(function(c){
		if (!src) { c.elem.classList.remove('hidden'); return; }
		if ((c.assignName || c.name).toLowerCase().indexOf(src) !== -1) {
			c.elem.classList.remove('hidden');
		} else {
			c.elem.classList.add('hidden');
		}
	});
	content.scrollTop = 0;
};

var title = document.title;

function navigate(name, addState){
	searchbox.value = name;
	components.forEach(function(c){
		if ((c.assignName || c.name) === name) {
			c.elem.classList.remove('hidden');
		} else {
			c.elem.classList.add('hidden');
		}
	});
	content.scrollTop = 0;
	searchbox.focus();
	searchbox.select();
	addState && history.pushState({component: name}, title + ' : ' + name, name);
}

function readURL(){
	var name = /\/([a-z0-9_$]+)$/i.exec(location.href);
	return name && name[1];
}

var anchors = [].slice.call(document.getElementsByTagName('a'));
anchors.forEach(function(a){
	var component = a.getAttribute('href');
	if (!/^[a-z0-9_$]+$/i.exec(component)) return;

	a.onclick = function(e){
		e && e.preventDefault && e.preventDefault();
		navigate(component, true);
	};
});

window.onpopstate = function(e){
	var component = readURL();
	component && navigate(component);
};

(function(component){
	component && navigate(component);
}(readURL()));

var	infoBox	= document.createElement('div');
infoBox.classList.add('infobox', 'hidden');
document.body.appendChild(infoBox);

[].slice.call(document.querySelectorAll('ul.arglist>li')).forEach(function(li){
	//TODO: Add a mouseover infobox for this, it should explain the min and max values, etc.
});
