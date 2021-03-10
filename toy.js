// the root singleton
//  by using a toy, you create an instance of the toy in this object
const toys = {};
const applyList = [];

function toyinstance(name) {
  this.name = name;
  this.value = null;
  this.defaultValue = 0;

  console.log(`toy: you can change the variable ${name} in console`);

  this.get = function () {
    return this.value ?? this.defaultValue;
  };

  this.set = function (value) {
    this.value = value;
    return this;
  };

  this.apply = function(callback) {
    applyList.push(callback)
    return this;
  }

  this.default = function(defaultValue) {
    this.defaultValue = defaultValue;
    return this;
  }
}

const internals = {
  $domElement: buildUI,
  $all: (function () {
    return toys;
  })(),
  $apply: () => {
    for(let i=0; i<applyList.length; i++){
      applyList[i]();
    }
  }
};

const proxyhandler = {
  // entrypoint for toy.<property>
  get(target, property) {
    if (property[0] == "$") {
      return internals[property];
    }

    let instance = toys[property];
    if (!instance) {
      console.log(`toy: ${property} created`);
      instance = new toyinstance(property);
      toys[property] = instance;
      return instance;
    }
    return instance;
  },
};

const toy = new Proxy(toys, proxyhandler);

if (!window.toy) window.toy = toy;

if (typeof module != 'undefined') {
  module.exports = toy;
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

    div.root {
      position: fixed;
      color: white;
      font-family: Arial, Helvetica, sans-serif;
      padding: 15px;
    }

  `;

  const divRoot = elroot("div", {
    class: "root",
    id: "root",
  });
  const ul = el(divRoot, "ul");

  const names = Object.getOwnPropertyNames(toys);
  for (let i = 0; i < names.length; i++) {
    const toy = toys[names[i]];
    const li = el(ul, "li");
    const divName = el(li, "div", { class: "name" });
    divName.innerText = toy.name;

    const input = el(ul, "input", { type: "text", value: toy.defaultValue});
    input.toy = toy;

    input.addEventListener("keyup", function (event) {
      if (event.keyCode === 13) {
        event.preventDefault();
        const text = input.value;
        toy.set(eval(text))
      }
    });
  }

  return divRoot;
}
