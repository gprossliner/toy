const toys = {};
const converters = [];

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

function Toy(name) {

  this.name = name;
  this.value = null;
  this.defaultValue = 0;
  this.options = {};
  this.converter = null;

  const setDefaultValue = (defaultValue) => {
    this.defaultValue = defaultValue;
    this.converter = toy.converters.get(defaultValue.constructor);

    if(this.converter){
      this.converter.init(this);
    }
  }

  this.get = function (defaultValue) {

    if (!this.defaultValue) {
      setDefaultValue(defaultValue);
    }

    return this.value ?? this.defaultValue;
  };

  this.getConverted = function () {
    let value = this.value ?? this.defaultValue;
    if (this.converter)
      value = this.converter.get(value);

    return value;
  }

  this.set = function (value) {

    // check for conversion
    if (this.converter) {
      value = this.converter.set(value);
    }

    // value by be converted, so we check the type of the default-value
    if (this.defaultValue.constructor != value.constructor) {
      let converted = this.defaultValue.constructor(value);
      value = converted;
    }

    this.value = value;
    return this;
  };

  this.range = function (min, max, step = 0) {

    // if step is not configured, use 100 steps
    if (!step) {
      step = (max - min) / 100;
    }
    this.options.range = { min, max, step };
    return this;
  }

  this.bind = function (defered, callback, defaultValue) {
    setDefaultValue(defaultValue);
    defered.binds.push(() => callback(this.get()));
    callback(defaultValue);
    return this;
  }

  this.hint = function (hint) {
    this.options.hint = hint;
    return this;
  }
}

toy.defered = function () {

  const binds = [];
  const ret = function () {
    for (let i = 0; i < this.length; i++) {
      let bind = this[i];
      bind();
    }
  }.bind(binds)

  ret.binds = binds;
  return ret;

}

toy.converters = {

  define: function (converter) {
    converters.push(converter)
  },

  get: function (constructor) {
    return converters
      .filter(c => c.constructor == constructor)
    [0] || null;
  },

}

// add converters for THREE classes
if (typeof THREE != 'undefined') {
  toy.converters.define({
    constructor: THREE.Color,
    get: color => color.getHex(),
    set: value => new THREE.Color(value),
    init: toy => toy.hint("color")
  });
}

if (!window.toy) window.toy = toys;

if (typeof module != 'undefined') {
  module.exports = toys;
}


toy.ui = function (parent) {

  const stylesheet = `

    div.toy-root {
      position: fixed;
      color: white;
      background-color: grey;
      font-family: Arial, Helvetica, sans-serif;
      padding: 15px;
    }

  `;

  $dom(parent).create("style")
    .attr("type", "text/css")
    .text(stylesheet);

  const divRoot = $dom(parent).create("div")
    .cls("toy-root")
    .id("toy-root");

  const ul = divRoot.create("ul");

  const names = Object.getOwnPropertyNames(toys);
  for (let i = 0; i < names.length; i++) {
    const toy = toys[names[i]];


    const li = ul.create("li");

    li.create("div").cls("toy-name").text(toy.name);
    const input = li.create("input").value(toy.getConverted());

    if (toy.options.range) {
      input
        .attr("type", "range")
        .attr("min", toy.options.range.min)
        .attr("max", toy.options.range.max)
        .attr("step", toy.options.range.step)
        .addEventListener("input", event => toy.set(event.target.value));
    } else if(toy.options.hint == "color") {
      input
        .attr("type", "color")
        .value("#" + toy.getConverted().toString(16).padStart(6, '0'))
        .addEventListener("input", event => toy.set(event.target.value));
    } else {
      input.addEventListener("keyup", event => {
        if (event.key === "Enter") {
          event.preventDefault();
          const text = event.target.value;
          toy.set(text)
        }
      });
    }


  }

  return divRoot.toDom();
}

/**
 * Fluent DOM Manipulation
 * https://tmont.com/blargh/2009/11/fluent-dom-manipulation-in-javascript
 * @author  Tommy Montgomery <http://tommymontgomery.com/>
 * @license http://sam.zoy.org/wtfpl/
 */

// I removed creating $dom and FluentDom in window scope
$dom = (function () {
  var FluentDom = function (node) {
    return new FluentDomInternal(node);
  }

  FluentDom.create = function (tagName) {
    return new FluentDomInternal(document.createElement(tagName));
  }

  var FluentDomInternal = function (node) {
    var root = node || null;

    this.fluentDom = "1.0";

    this.append = function (obj) {
      if (!root || !root.appendChild) {
        throw new Error("Cannot append to a non-element");
      }

      var type = typeof (obj);
      if (type === "object") {
        if (obj.fluentDom) {
          root.appendChild(obj.toDom());
        } else if (obj.nodeType) {
          root.appendChild(obj);
        } else {
          throw new Error("Invalid argument: not a DOM element or a FluentDom object");
        }
      } else if (type === "string" || type === "number") {
        root.appendChild(document.createTextNode(obj));
      } else {
        throw new Error("Invalid argument: not an object (you gave me a " + typeof (obj) + ")");
      }

      return this;
    }

    // create a new tag, appends it to this, and returns the new dom-element
    this.create = function (tagMame) {
      const child = FluentDom.create(tagMame);
      this.append(child);
      return child;
    }

    this.attr = function (name, value) {
      if (!root || !root.setAttribute) {
        throw new Error("Cannot set an attribute on a non-element");
      }

      root.setAttribute(name, value);
      return this;
    }

    this.text = function (text) {
      return this.append(text);
    }

    this.id = function (value) {
      return this.attr("id", value);
    }

    this.title = function (value) {
      return this.attr("title", value);
    }

    this.cls = function (value) {
      return this.attr("class", value);
    }

    this.clear = function () {
      root = null;
      return this;
    }

    this.toDom = function () {
      return root;
    }

    this.href = function (link) {
      return this.attr("href", link);
    }

    // ADDED BY gprossliner
    this.addEventListener = function (type, listener) {
      this.toDom().addEventListener(type, listener);
      return this;
    }

    this.value = function (value) {
      return this.attr("value", value);
    }

  };

  return FluentDom

})();