function toy(name) {

  let instance = toy.toys[name];
  if (!instance) {
    console.log(`toy: ${name} created`);
    instance = Toy(name);
    toy.toys[name] = instance;
    return instance;
  }
  return instance;

  function Toy(label) {

    const self = function Toy(defaultValue) {
      if (self.defaultValue === null) {
        setDefaultValue(defaultValue);
      }

      return self.value ?? self.defaultValue;
    }
    
    self.label = label;
    self.value = null;
    self.defaultValue = null;
    self.options = {
      ui : toy.ui.controls.text
    };

    const setDefaultValue = (defaultValue) => {
      self.defaultValue = defaultValue;
      
      // check for datatypes
      if(defaultValue.constructor == Boolean) {
        self.ui(toy.ui.controls.checkbox)
      }
      
      // check for ui selector
      for(const sel of toy.uiselectors){
        if(sel.test(defaultValue)) {
          self.options.selector = sel;
          self.ui(sel.ui);
        }
      }

      // run notifiers
      for(let n of toy.notifiers) {
        n(self);
      }
    }

    self.set = function (value) {

      // value by be converted, so we check the type of the default-value
      if (self.defaultValue.constructor != value.constructor) {
        let converted = self.defaultValue.constructor(value);
        value = converted;
      }

      self.value = value;
      return self;
    };

    self.range = function (min, max, step = 0) {

      // if step is not configured, use 100 steps
      if (!step) {
        step = (max - min) / 100;
      }
      self.options.range = { min, max, step };
      return self.ui(toy.ui.controls.range);
    }

    self.bind = function (defered, callback, defaultValue) {
      setDefaultValue(defaultValue);
      defered.binds.push(() => callback(self()));
      callback(defaultValue);
      return self;
    }

    self.ui = function (control) {
      self.options.ui = control;
      return self;
    }

    return self;
  }

}

toy.toys = {};
toy.uiselectors = [];
toy.notifiers = [];

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

  selector.fromUi ||= v=>v;
  selector.toUi ||= v=>v;

  toy.uiselectors.push(selector);
};

toy.notifier = function(notifier) {
  toy.notifiers.push(notifier);

  // notifiy about existing toys
  const names = Reflect.ownKeys(toy.toys);
  for (let name of names) {
      const t = toy.toys[name];
      notifier(t);
  }
}

if (!window.toy) window.toy = toys;

if (typeof module != 'undefined') {
  module.exports = toys;
}

toy.ui = function (parent) {

  // this will contain the css from toy.css
  // for now we use the toy.css for better editing
  // const stylesheet = `    
  // `;
  // $dom(parent).create("style")
  //   .attr("type", "text/css")
  //   .text(stylesheet);

  //<link rel="stylesheet" type="text/css" media="screen" href="main.css"></link>
  $dom(parent).create("link")
    .attr("rel", "stylesheet")
    .attr("type", "text/css")
    .attr("media", "screen")
    .attr("href", "toy.css")

  const divRoot = $dom(parent).create("div")
    .cls("toy-root")
    .id("toy-root");

  // collapsible (https://codepen.io/gprossliner/pen/gOLZoOJ)
  divRoot.create("input")
    .id("toy-collapsible")
    .cls("toy-toggle")
    .attr("type", "checkbox")
    .attr("checked", true)

  divRoot.create("label")
    .attr("for", "toy-collapsible")
    .cls("toy-lbl-toggle")
    .text("toy-ui")

  const divContent = divRoot
    .create("div")
      .cls("toy-collapsible-content")
      .create("div")
        .cls("toy-content-inner")

  const buildToy = t => {

      const container = divContent.create("div")
        .cls("toy-container")

      container.create("div").cls("toy-label").text(t.label);

      let writefn = val => t.set(val);
      let value = t(); 
      
      if(t.options.selector) { 
        writefn = val => t.set(t.options.selector.fromUi(val));
        value = t.options.selector.toUi(t());      
      }

      t.options.ui(t.options, container, value, writefn)
  }

  toy.notifier(buildToy);

  return divRoot.toDom();
}

toy.ui.controls = [];

toy.ui.controls.range = (options, parent, value, writefn) => {

  let container = parent.create("span");

  const update = value => {
    input.value(value);
    slider.value(value);
    writefn(value);
  };

  // slider
  const slider = container.create("input").value(value)
    .attr("type", "range")
    .attr("min", options.range.min)
    .attr("max", options.range.max)
    .attr("step", options.range.step)
    .addEventListener("input", event => update(Number(event.target.value)));

  // input
  const input = container.create("input").value(value)
    .attr("type", "number")  
    .attr("min", options.range.min)
    .attr("max", options.range.max)
    .attr("step", options.range.step)
    .cls("toy-sliderinput")
    .addEventListener("input", event => update(Number(event.target.value)));
  
  return container;
}

toy.ui.controls.checkbox = (options, parent, value, writefn) =>
  parent.create("input").attr("checked", value)
    .attr("type", "checkbox")    
    .addEventListener("input", event => writefn(event.target.checked));

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

  // support the following types:

  // THREE:Vector3: .scale, .position
  toy.ui.controls.vec3 = (options, parent, value, writefn) => {    

    let val = value;

    const inputFn = (component, value) => {
      val[component] = value;
      writefn(val);
    }

    const component = c => {
      parent.create("div")
        .append(`${c}: `)
        .append(toy.ui.controls.range(options, parent, value[c], val=>inputFn(c, val)));
    }

    component('x');
    component('y');
    component('z');

  }

  toy.uiselector({
    test : value => value.constructor == THREE.Vector3,
    ui : toy.ui.controls.vec3
  });

  // THREE.Euler: .rotation
  // because the THREE.Euler also has xyz, we can use the vec3 ui!
  toy.uiselector({
    test : value => value.constructor == THREE.Euler,
    ui : toy.ui.controls.vec3
  });


  // Matrix3: / 4
}
