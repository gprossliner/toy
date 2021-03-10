const toys = { };

function toy(name) {
  
  let instance = toys[name];
  if (!instance) {
    console.log(`toy: ${name} created`);
    instance = new Toy(name);
    toys[name] = instance;
    return instance;
  }
  return instance;
}

toy.domElement = buildUI;

function Toy(name) {
  this.name = name;
  this.value = null;
  this.defaultValue = 0;
  this.binds = [];

  this.get = function (defaultValue) {
    if(!this.defaultValue) this.defaultValue = defaultValue;
    return this.value ?? this.defaultValue;
  };

  this.set = function (value) {
    this.value = value;
    return this;
  };

  this.bind = function(callback, defaultValue) {
    this.binds.push(callback)
    this.defaultValue = defaultValue;
    callback(defaultValue);
    return this;
  }

  this.call = function() {
    for(let i=0; i<this.binds.length; i++){
      let bind = this.binds[i];
      bind(this.get());
    }

    return this;
  }

}

if (!window.toy) window.toy = toys;

if (typeof module != 'undefined') {
  module.exports = toys;
}


function buildUI() {
  function elroot(tag, att) {
    return el(document.body, tag, att);
  }

  function el(parent, tag, attributes) {
    const element = document.createElement(tag);
    parent.appendChild(element);

    if (attributes) {
      const names = Object.getOwnPropertyNames(attributes);
      for (let i = 0; i < names.length; i++) {
        element.setAttribute(names[i], attributes[names[i]]);
      }
    }

    return element;
  }

  var stylesheet = elroot("style", {
    type: "text/css",
  });

  stylesheet.innerHTML = `

    div.toy-root {
      position: fixed;
      color: white;
      background-color: grey;
      font-family: Arial, Helvetica, sans-serif;
      padding: 15px;
    }

  `;

  const divRoot = elroot("div", {
    class: "toy-root",

    // by define a css definition for #toy-root, the style can be customized externally
    id: "toy-root",
  });
  const ul = el(divRoot, "ul");

  const names = Object.getOwnPropertyNames(toys);
  for (let i = 0; i < names.length; i++) {
    const toy = toys[names[i]];
    const li = el(ul, "li");
    const divName = el(li, "div", { class: "name" });
    divName.innerText = toy.name;

    const input = el(ul, "input", { type: "text", value: toy.get()});
    input.toy = toy;

    input.addEventListener("keyup", function (event) {
      if (event.keyCode === 13) {
        event.preventDefault();
        const text = input.value;
        toy.set(text)
      }
    });
  }

  return divRoot;
}
