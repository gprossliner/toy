(function () {

    let toys = {};
    let uiselectors = [];
    let observers = [];

    function toy(label) {

        let instance = toys[label];
        if (instance) return instance;

        instance = createToy(label);
        toys[label] = instance;

        console.log(`toy: ${label} created`);
        return instance;

        function createToy(label) {

            const self = function Toy(defaultValue) {

                // perform initialization
                if (self.defaultValue === null) {
                    self.defaultValue = defaultValue;

                    // check for datatypes
                    if (defaultValue.constructor == Boolean) {
                        self.ui(toy.ui.controls.checkbox)
                    }

                    // check for ui selector
                    for (const sel of uiselectors) {
                        if (sel.test(defaultValue)) {
                            self.options.selector = sel;
                            self.ui(sel.ui);
                        }
                    }

                    // run notifiers
                    for (const observer of observers) {
                        observer(self);
                    }
                }

                return self.value ?? self.defaultValue;
            }

            self.label = label;
            self.value = null;
            self.defaultValue = null;
            self.options = {
                ui: toy.ui.controls.text
            };

            self.set = function (value) {
                self.value = value;
                return self;
            };

            self.range = function (min, max, step = 0) {

                // if step is not configured, use 100 steps
                step ||= (max - min) / 100;
                self.options.range = { min, max, step };
                self.ui(toy.ui.controls.range);
                return self;
            }

            self.ui = function (control) {
                self.options.ui = control;
                return self;
            }

            return self;
        }

    }

    toy.util = {};

    toy.util.observe = {
        toys: observer => {
            observers.push(observer);

            // notifiy about existing toys
            for (const label of Reflect.ownKeys(toys)) {
                observer(toys[label]);
            }
        }
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
            .text("TOYGUI")

        const divContent = divRoot
            .create("div")
            .cls("toy-collapsible-content")
            .create("div")
            .cls("toy-content-inner")

        toy.util.observe.toys(toy => {

            const container = divContent.create("div")
                .cls("toy-container")

            const label = container.create("label").cls("toy-label").text(toy.label);

            let oninput = val => toy.set(val);
            let value = toy();

            if (toy.options.selector) {
                oninput = val => toy.set(toy.options.selector.fromUi(val));
                value = toy.options.selector.toUi(toy());
            }

            let toyui = toy.options.ui({
                options: toy.options,
                value,
                oninput
            });

            label.append(toyui);
        });

        return divRoot.toDom();
    }

    toy.ui.selector = function (selector) {

        selector.fromUi ||= v => v;
        selector.toUi ||= v => v;

        uiselectors.push(selector);
    };

    toy.ui.controls = [];

    toy.ui.controls.range = args => {

        let container = $dom.create("span");

        const update = value => {
            input.value(value);
            slider.value(value);
            args.oninput(value);
        };

        // slider
        const slider = container.create("input").value(args.value)
            .attr("type", "range")
            .attr("min", args.options.range.min)
            .attr("max", args.options.range.max)
            .attr("step", args.options.range.step)
            .addEventListener("input", event => update(Number(event.target.value)));

        // input
        const input = container.create("input").value(args.value)
            .attr("type", "number")
            .attr("min", args.options.range.min)
            .attr("max", args.options.range.max)
            .attr("step", args.options.range.step)
            .cls("toy-sliderinput")
            .addEventListener("input", event => update(Number(event.target.value)));

        return container;
    }

    toy.ui.controls.checkbox = args =>
        $dom.create("input").attr("checked", args.value)
            .attr("type", "checkbox")
            .addEventListener("input", event => args.oninput(event.target.checked));

    toy.ui.controls.color = args =>
        $dom.create("input")
            .attr("type", "color")
            .value(args.value)
            .addEventListener("input", event => args.oninput(event.target.value));

    toy.ui.controls.text = args =>
        $dom.create("input")
            .value(args.value)
            .addEventListener("keyup", event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    args.oninput(event.target.value);
                }
            });

    /**
     * Fluent DOM Manipulation
     * https://tmont.com/blargh/2009/11/fluent-dom-manipulation-in-javascript
     * @author  Tommy Montgomery <http://tommymontgomery.com/>
     * @license http://sam.zoy.org/wtfpl/
     */

    // I removed creating $dom and FluentDom in window scope
    $dom = toy.util.dom = (function () {
        var FluentDom = function (node) {
            if(node.fluentDom) return node;
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

        toy.ui.selector({
            test: value => value.constructor == THREE.Color,
            ui: toy.ui.controls.color,
            toUi: color => "#" + color.getHexString(),
            fromUi: input => new THREE.Color(Number.parseInt(input.substr(1), 16))
        });

        // support the following types:

        // THREE:Vector3: .scale, .position
        toy.ui.controls.vec3 = args => {

            let val = args.value;

            const inputFn = (component, value) => {
                val[component] = value;
                args.oninput(val);
            }

            const container = $dom.create("div");

            const component = c =>
                container.create("label")
                    .cls("toy-sublabel")
                    .append($dom.create("div").text(`${c}:`))
                    .append(toy.ui.controls.range({
                        options: args.options,
                        value: args.value[c],
                        oninput: val => inputFn(c, val)
                    }));

            component('x');
            component('y');
            component('z');

            return container;

        }

        toy.ui.selector({
            test: value => value.constructor == THREE.Vector3,
            ui: toy.ui.controls.vec3
        });

        // THREE.Euler: .rotation
        // because the THREE.Euler also has xyz, we can use the vec3 ui!
        toy.ui.selector({
            test: value => value.constructor == THREE.Euler,
            ui: toy.ui.controls.vec3
        });


        // Matrix3: / 4
    }

    window.toy = toy;

})(window);
