function toy(name) {

  let instance = toy.toys[name];
  if (!instance) {
    console.log(`toy: ${name} created`);
    instance = new Toy(name);
    toy.toys[name] = instance;
    return instance;
  }
  return instance;


  function Toy(name) {

    this.name = name;
    this.value = null;
    this.defaultValue = 0;
    this.options = {
      ui : toy.ui.controls.text
    };

    const setDefaultValue = (defaultValue) => {
      this.defaultValue = defaultValue;
      
      // check for ui selector
      for(const sel of toy.uiselectors){
        if(sel.test(defaultValue)) {
          this.options.selector = sel;
          this.ui(sel.ui);
        }
      }
    }

    this.get = function (defaultValue) {

      if (!this.defaultValue) {
        setDefaultValue(defaultValue);
      }

      return this.value ?? this.defaultValue;
    };

    this.set = function (value) {

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
      return this.ui(toy.ui.controls.range);
    }

    this.bind = function (defered, callback, defaultValue) {
      setDefaultValue(defaultValue);
      defered.binds.push(() => callback(this.get()));
      callback(defaultValue);
      return this;
    }

    this.ui = function (control) {
      this.options.ui = control;
      return this;
    }
  }

}

toy.toys = {};
toy.uiselectors = [];

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

toy.uiselector = function(selector) {
  toy.uiselectors.push(selector);
};

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

  const names = Reflect.ownKeys(toy.toys);
  for (let name of names) {
      const t = toy.toys[name];

      const li = ul.create("li");
      li.create("div").cls("toy-name").text(this.name);

      // get the control
      let control = t.options.ui || t.ui.controls.text;
      let writefn;
      let value;
      
      if(t.options.selector) { 
        writefn = val => t.set(t.options.selector.fromUi(val));
        value = t.options.selector.toUi(t.get());
      } else {
        writefn = val => t.set(val);
        value = t.get(); 
      }
        

      control(t.options, li, value, writefn)
  }

  return divRoot.toDom();
}

toy.ui.controls = [];
toy.ui.controls.range = (options, parent, value, writefn) =>
  parent.create("input").value(value)
    .attr("type", "range")
    .attr("min", options.range.min)
    .attr("max", options.range.max)
    .attr("step", options.range.step)
    .addEventListener("input", event => writefn(event.target.value));

toy.ui.controls.color = (options, parent, value, writefn) =>
  parent.create("input")
    .attr("type", "color")
    .value(value)
    .addEventListener("input", event => writefn(event.target.value));

toy.ui.controls.text = (options, parent, value, writefn) =>
  parent.create("input")
    .value(value)
    .addEventListener("keyup", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        writefn(event.target.value);
      }
    });

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

// extend for THREE.js types 
if (typeof THREE != 'undefined') {

  toy.uiselector({
    test : value => value.constructor == THREE.Color,
    ui : toy.ui.controls.color,
    toUi : color =>  "#" + color.getHexString(),
    fromUi : input => new THREE.Color(Number.parseInt(input.substr(1), 16))
  });

}