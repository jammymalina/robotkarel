function is_array(potential_array) {
    return potential_array.constructor === Array;
}

function parse(code) {
    return acorn.parse(code);
}

class Interpreter {
    constructor(code, init_func) {
        this.syntax_tree = parse(code);
        this.paused = false;
        this.UNDEFINED = this.create_primitive(undefined);
        this._init_function = init_func;
        let scope = this.create_scope(this.syntax_tree, null);
        this.execution_stack = [{
            node: this.syntax_tree,
            scope: scope,
            this_expression: scope
        }];
    }

    step() {
        if (!is_array(this.execution_stack) || this.execution_stack.length <= 0)
            return false;
        else if (this.paused)
            return true;
        let state = this.execution_stack[0];
        if (this['step_' + state.node.type]) {
            this['step_' + state.node.type]();
        } else {
            throw new Error('No such step: ' + state.node.type);
        }
        return true;
    }

    run() {
        while (!this.paused) {
            if (!this.step()) break;
        }
        return this.paused;
    }

    init_global_scope(scope) {
        this.set_property(scope, 'Infinity', this.create_primitive(Infinity), true);
        this.set_property(scope, 'NaN', this.create_primitive(NaN), true);
        this.set_property(scope, 'undefined', this.UNDEFINED, true);
        this.set_property(scope, 'window', scope, true);
        this.set_property(scope, 'self', scope, false);

        this.init_global_function(scope);
        this.init_global_object(scope);

        scope.parent = this.OBJECT;

        this.init_number(scope);
        this.init_boolean(scope);
        this.init_math(scope);
        this.init_array(scope);
        this.init_string(scope);

        let self = this;
        let wrapper;
        // isNaN
        wrapper = function(num) {
            num = num || self.UNDEFINED;
            return self.create_primitive(isNaN(num.toNumber()));
        };
        self.set_property(scope, 'isNaN', this.to_basic_js_function(wrapper));
        // isFinite
        wrapper = function(num) {
            num = num || self.UNDEFINED;
            return self.create_primitive(isFinite(num.toNumber()));
        };
        self.set_property(scope, 'isFinite', this.to_basic_js_function(wrapper));
        // parseFloat
        wrapper = function(str) {
            str = str || self.UNDEFINED;
            return self.create_primitive(parseFloat(str.toString()));
        };
        self.set_property(scope, 'parseFloat', this.to_basic_js_function(wrapper));
        // parseInt
        wrapper = function(str, radix) {
            str = str || self.UNDEFINED;
            return self.create_primitive(parseInt(str.toString(), radix.toNumber()));
        };
        self.set_property(scope, 'parseInt', this.to_basic_js_function(wrapper));
        // length, eval
        let func = this.create_object(this.FUNCTION);
        func.eval = true;
        this.set_property(func, 'length', this.create_primitive(1), true);
        this.set_property(scope, 'eval', func);
        // user defined init function
        if (this._init_function) {
            this._init_function(this, scope);
        }
    }

    init_global_function(scope) {
        let self = this;
        let wrapper;
        // constructor
        wrapper = function(var_args) {
            let new_func, code;
            if (this.parent == self.FUNCTION) {
                new_func = this;
            } else {
                new_func = self.create_object(self.FUNCTION);
            }
            if (arguments.length) {
                code = arguments[arguments.length - 1].toString();
            } else {
                code = '';
            }
            let args = [];
            for (let i = 0; i < arguments.length; i++) {
                args.push(arguments[i].toString());
            }
            args = args.join(', ');
            if (args.indexOf(')') != -1) {
                throw new SyntaxError('Function argument string contains ")".');
            }
            new_func.parent_scope = self.execution_stack[self.execution_stack.length - 1].scope;
            let syntax_tree = parse('$ = function(' + args + ') {' + code + '};');
            new_func.node = syntax_tree.body[0].expression.right;
            self.set_property(newFunc, 'length', self.create_primitive(newFunc.node.length), true);
            return new_func;
        };
        this.FUNCTION = this.create_object(null);
        this.set_property(scope, 'Function', this.FUNCTION);
        this.FUNCTION.type = 'function';
        this.set_property(this.FUNCTION, 'prototype', this.create_object(null));
        this.FUNCTION.native_function = wrapper;
        // apply, call
        let node = {
            type: 'function_apply',
            params: [],
            id: null,
            body: null,
            start: 0,
            end: 0
        };
        this.set_property(this.FUNCTION.properties.prototype, 'apply', this.create_function(node, {}), false, true);
        node = {
            type: 'function_call',
            params: [],
            id: null,
            body: null,
            start: 0,
            end: 0
        };
        this.set_property(this.FUNCTION.properties.prototype, 'call', this.create_function(node, {}), false, true);
        // toString, valueOf
        wrapper = function() {
            return self.create_primitive(this.toString());
        };
        this.set_property(this.FUNCTION.properties.prototype, 'toString', this.to_basic_js_function(wrapper), false, true);
        this.set_property(this.FUNCTION, 'toString', this.to_basic_js_function(wrapper), false, true);
        wrapper = function() {
            return self.create_primitive(this.valueOf());
        };
        this.set_property(this.FUNCTION.properties.prototype, 'valueOf', this.to_basic_js_function(wrapper), false, true);
        this.set_property(this.FUNCTION, 'valueOf', this.to_basic_js_function(wrapper), false, true);
    }

    init_global_object(scope) {
        let self = this;
        let wrapper;
        // constructor
        wrapper = function(var_args) {
            let new_obj;
            if (this.parent == self.OBJECT) {
                new_obj = this;
            } else {
                new_obj = self.create_object(self.OBJECT);
            }
            return new_obj;
        };
        this.OBJECT = this.to_basic_js_function(wrapper);
        this.set_property(scope, 'Object', this.OBJECT);

        // toString, valueOf
        wrapper = function() {
            return self.create_primitive(this.toString());
        };
        this.set_property(this.OBJECT.properties.prototype, 'toString', this.to_basic_js_function(wrapper), false, true);
        wrapper = function() {
            return self.create_primitive(this.valueOf());
        };
        this.set_property(this.OBJECT.properties.prototype, 'valueOf', this.to_basic_js_function(wrapper), false, true);
        // hasOwnProperty
        wrapper = function(property) {
            for (let key in this.properties) {
                if (key == property)
                    return self.create_primitive(true);
            }
            return self.create_primitive(false);
        };
        this.set_property(this.OBJECT.properties.prototype, 'hasOwnProperty', this.to_basic_js_function(wrapper), false, true);
        // keys
        wrapper = function(obj) {
            let list = self.create_object(self.ARRAY);
            let i = 0;
            for (let key in obj.properties) {
                self.set_property(list, i, self.create_primitive(key));
                i++;
            }
            return list;
        };
        this.set_property(this.OBJECT, 'keys', this.to_basic_js_function(wrapper));
    }

    init_number(scope) {
        let self = this;
        let wrapper;
        // constructor
        wrapper = function(value) {
            value = value ? value.toNumber() : 0;
            if (this.parent == self.NUMBER) {
                // !! - casts to boolean
                this.toBoolean = function() {
                    return !!value;
                };
                this.toNumber = function() {
                    return value;
                };
                this.toString = function() {
                    return String(value);
                };
            } else {
                return self.create_primitive(value);
            }
        };
        this.NUMBER = this.to_basic_js_function(wrapper);
        this.set_property(scope, 'Number', this.NUMBER);
        // numerical constants
        let numerical_constants = ['MAX_VALUE', 'MIN_VALUE', 'NaN', 'NEGATIVE_INFINITY', 'POSITIVE_INFINITY'];
        for (let i = 0; i < numerical_constants.length; i++) {
            this.set_property(this.NUMBER, numerical_constants[i], this.create_primitive(Number[numerical_constants[i]]));
        }
        // toExponential
        wrapper = function(x) {
            x = x ? x.toNumber() : undefined;
            let n = this.toNumber();
            return self.create_primitive(n.toExponential(x));
        };
        this.set_property(this.NUMBER.properties.prototype, 'toExponential', this.to_basic_js_function(wrapper), false, true);
        // toPrecision
        wrapper = function(precision) {
            precision = precision ? precision.toNumber() : undefined;
            let n = this.toNumber();
            return self.create_primitive(n.toPrecision(precision));
        };
        this.set_property(this.NUMBER.properties.prototype, 'toPrecision', this.to_basic_js_function(wrapper), false, true);
        // toString
        wrapper = function(radix) {
            radix = radix ? radix.toNumber() : 10;
            let n = this.toNumber();
            return self.create_primitive(n.toString(radix));
        };
        this.set_property(this.NUMBER.properties.prototype, 'toString', this.to_basic_js_function(wrapper), false, true);
    }

    init_boolean(scope) {
        let self = this;
        let wrapper;
        // constructor
        wrapper = function(value) {
            value = value ? value.toBoolean() : false;
            if (this.parent == self.BOOLEAN) {
                this.toBoolean = function() {
                    return value;
                };
                this.toNumber = function() {
                    return Number(value);
                };
                this.toString = function() {
                    return String(value);
                };
                this.valueOf = function() {
                    return value;
                };
                return undefined;
            }
            return self.create_primitive(value);
        };
        this.BOOLEAN = this.to_basic_js_function(wrapper);
        this.set_property(scope, 'Boolean', this.BOOLEAN);
    }

    init_string(scope) {
        let self = this;
        let wrapper;
        // constructor
        wrapper = function(value) {
            value = (value || self.UNDEFINED).toString();
            if (this.parent == self.STRING) {
                this.toBoolean = function() {
                    return !!value;
                };
                this.toNumber = function() {
                    return Number(value);
                };
                this.toString = function() {
                    return value;
                };
                this.valueOf = function() {
                    return value;
                };
                this.data = value;
                return undefined;
            } else {
                return self.create_primitive(value);
            }
        };
        this.STRING = this.to_basic_js_function(wrapper);
        this.set_property(scope, 'String', this.STRING);
        // charCodeAt
        wrapper = function(num) {
            let str = this.toString();
            num = (num || thisInterpreter.UNDEFINED).toNumber();
            return self.create_primitive(str.charCodeAt(num));
        };
        this.set_property(this.STRING.properties.prototype, 'charCodeAt', this.to_basic_js_function(wrapper), false, true);
    }

    init_array(scope) {
        let self = this;
        let get_int = function(obj, def) {
            let n = obj ? Math.floor(obj.toNumber()) : def;
            if (isNaN(n)) {
                return def;
            }
            return n;
        };
        let wrapper;
        // constructor
        wrapper = function(var_args) {
            let new_array;
            if (this.parent == self.ARRAY) {
                new_array = this;
            } else {
                new_array = self.create_object(self.ARRAY);
            }
            let first = arguments[0];
            if (first && first.type == 'number') {
                if (isNaN(self.array_index(first))) {
                    throw new RangeError('Invalid array length.');
                }
                new_array.length = first.data;
            } else {
                for (let i = 0; i < arguments.length; i++) {
                    new_array.properties[i] = arguments[i];
                }
                new_array.length = arguments.length;
            }
            return new_array;
        };
        this.ARRAY = this.to_basic_js_function(wrapper);
        this.set_property(scope, 'Array', this.ARRAY);
        // pop
        wrapper = function() {
            let value;
            if (this.length) {
                value = this.properties[this.length - 1];
                delete this.properties[this.length - 1];
                this.length--;
            } else {
                value = self.UNDEFINED;
            }
            return value;
        };
        this.set_property(this.ARRAY.properties.prototype, 'pop', this.to_basic_js_function(wrapper), false, true);
        // push
        wrapper = function(var_args) {
            for (let i = 0; i < arguments.length; i++) {
                this.properties[this.length] = arguments[i];
                this.length++;
            }
            return self.create_primitive(this.length);
        };
        this.set_property(this.ARRAY.properties.prototype, 'push', this.to_basic_js_function(wrapper), false, true);
        // shift
        wrapper = function() {
            let value;
            if (this.length) {
                value = this.properties[0];
                for (let i = 1; i < this.length; i++) {
                    this.properties[i - 1] = this.properties[i];
                }
                this.length--;
                delete this.properties[this.length];
            } else {
                value = self.UNDEFINED;
            }
            return value;
        };
        this.set_property(this.ARRAY.properties.prototype, 'shift', this.to_basic_js_function(wrapper), false, true);
        // unshift
        wrapper = function(var_args) {
            for (let i = this.length - 1; i >= 0; i--) {
                this.properties[i + arguments.length] = this.properties[i];
            }
            this.length += arguments.length;
            for (let i = 0; i < arguments.length; i++) {
                this.properties[i] = arguments[i];
            }
            return self.create_primitive(this.length);
        };
        this.set_property(this.ARRAY.properties.prototype, 'unshift', this.to_basic_js_function(wrapper), false, true);
        // reverse
        wrapper = function() {
            for (let i = 0; i < this.length / 2; i++) {
                let tmp = this.properties[this.length - i - 1];
                this.properties[this.length - i - 1] = this.properties[i];
                this.properties[i] = tmp;
            }
            return self.UNDEFINED;
        };
        this.set_property(this.ARRAY.properties.prototype, 'reverse', this.to_basic_js_function(wrapper), false, true);
        // splice
        wrapper = function(index, howmany, var_args) {
            index = get_int(index, 0);
            if (index < 0) {
                index = Math.max(this.length + index, 0);
            } else {
                index = Math.min(index, this.length);
            }
            howmany = get_int(howmany, Infinity);
            howmany = Math.min(howmany, this.length - index);
            let removed = self.create_object(self.ARRAY);
            // remove elements
            for (let i = index; i < index + howmany; i++) {
                removed.properties[removed.length++] = this.properties[i];
                this.properties[i] = this.properties[i + howmany];
            }
            // shift other elements
            for (let i = index + howmany; i < this.length - howmany; i++) {
                this.properties[i] = this.properties[i + howmany];
            }
            // delete properties
            for (let i = this.length - howmany; i < this.length; i++) {
                delete this.properties[i];
            }
            this.length -= howmany;
            // insert
            for (let i = this.length - 1; i >= index; i--) {
                this.properties[i + arguments.length - 2] = this.properties[i];
            }
            this.length += arguments.length - 2;
            for (let i = 2; i < arguments.length; i++) {
                this.properties[index + i - 2] = arguments[i];
            }
            return removed;
        };
        this.set_property(this.ARRAY.properties.prototype, 'splice', this.to_basic_js_function(wrapper), false, true);
        // slice
        wrapper = function(start_arr, end_arr) {
            let list = self.create_object(self.ARRAY);
            let begin = get_int(start_arr, 0);
            if (begin < 0) {
                begin = this.length + begin;
            }
            begin = Math.max(0, Math.min(begin, this.length));
            let end = get_int(end_arr, this.length);
            if (end < 0) {
                end = this.length + end;
            }
            end = Math.max(0, Math.min(end, this.length));
            let length = 0;
            for (let i = begin; i < end; i++) {
                let element = self.get_property(this, i);
                self.set_property(list, length++, element);
            }
            return list;
        };
        this.set_property(this.ARRAY.properties.prototype, 'slice', this.to_basic_js_function(wrapper), false, true);
        // join
        wrapper = function(separator) {
            let sep;
            if (!separator || separator.data === undefined) {
                sep = undefined;
            } else {
                sep = separator.toString();
            }
            let text = [];
            for (let i = 0; i < this.length; i++) {
                text[i] = this.properties[i];
            }
            return self.create_primitive(text.join(sep));
        };
        this.set_property(this.ARRAY.properties.prototype, 'join', this.to_basic_js_function(wrapper), false, true);
        // concat
        wrapper = function(var_args) {
            let list = self.create_object(self.ARRAY);
            let length = 0;
            // copy
            for (let i = 0; i < this.length; i++) {
                let element = self.get_property(this, i);
                self.set_property(list, length++, element);
            }
            // copy other array
            for (let i = 0; i < arguments.length; i++) {
                let value = arguments[i];
                if (self.is_instance_of(value, self.ARRAY)) {
                    for (let j = 0; j < value.length; j++) {
                        let element = self.get_property(value, j);
                        self.set_property(list, length++, element);
                    }
                } else {
                    self.set_property(list, length++, value);
                }
            }
            return list;
        };
        this.set_property(this.ARRAY.properties.prototype, 'concat', this.to_basic_js_function(wrapper), false, true);
        // indexOf
        wrapper = function(search_element, from_index_arr) {
            search_element = search_element || self.UNDEFINED;
            let from_index = get_int(from_index_arr, 0);
            if (from_index < 0) {
                from_index = this.length + from_index;
            }
            from_index = Math.max(0, Math.min(from_index, this.length));
            for (let i = from_index; i < this.length; i++) {
                let element = self.get_property(this, i);
                if (self.comp(element, search_element) === 0) {
                    return self.create_primitive(i);
                }
            }
            return self.create_primitive(-1);
        };
        this.set_property(this.ARRAY.properties.prototype, 'indexOf', this.to_basic_js_function(wrapper), false, true);
        // last index of
        wrapper = function(search_element, from_index_arr) {
            search_element = search_element || self.UNDEFINED;
            let from_index = get_int(from_index_arr, this.length);
            if (from_index < 0) {
                from_index = this.length + from_index;
            }
            from_index = Math.max(0, Math.min(from_index, this.length));
            for (let i = from_index; i >= 0; i--) {
                let element = self.get_property(this, i);
                if (self.comp(element, search_element) === 0) {
                    return self.create_primitive(i);
                }
            }
            return self.create_primitive(-1);
        };
        this.set_property(this.ARRAY.properties.prototype, 'lastIndexOf', this.to_basic_js_function(wrapper), false, true);
        // sort
        wrapper = function(comp_func) {
            let list = [];
            for (let i = 0; i < this.length; i++) {
                list[i] = this.properties[i];
            }
            list.sort(comp_func);
            for (let i = 0; i < list.length; i++) {
                self.set_property(this, i, list[i]);
            }
            return this;
        };
        this.set_property(this.ARRAY.properties.prototype, 'sort', this.to_basic_js_function(wrapper), false, true);
    }

    init_math(scope) {
        let self = this;
        let wrapper;
        let math_obj = this.create_object(this.OBJECT);
        this.set_property(scope, 'Math', math_obj);
        let math_constants = ['E', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'PI', 'SQRT1_2', 'SQRT2'];

        for (let i = 0; i < math_constants.length; i++) {
            this.set_property(math_obj, math_constants[i], this.create_primitive(Math[math_constants[i]]));
        }
        let num_functions = ['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp',
            'floor', 'log', 'max', 'min', 'pow', 'random', 'round', 'sin', 'sqrt', 'tan'
        ];
        for (let i = 0; i < num_functions.length; i++) {
            wrapper = (function(native_func) {
                return function() {
                    for (let j = 0; j < arguments.length; j++) {
                        arguments[j] = arguments[j].toNumber();
                    }
                    return self.create_primitive(native_func.apply(Math, arguments));
                };
            })(Math[num_functions[i]]);
            this.set_property(math_obj, num_functions[i], this.to_basic_js_function(wrapper));
        }

    }

    create_primitive(data) {
        if (data === undefined && this.UNDEFINED) {
            return this.UNDEFINED;
        }
        let type = typeof data;
        let obj = {
            data: data,
            is_primitive: true,
            type: type,
            toBoolean: function() {
                return Boolean(this.data);
            },
            toNumber: function() {
                return Number(this.data);
            },
            toString: function() {
                return String(this.data);
            },
            valueOf: function() {
                return this.data;
            },
        };
        if (type == 'number') {
            obj.parent = this.NUMBER;
        } else if (type == 'string') {
            obj.parent = this.STRING;
        } else if (type == 'boolean') {
            obj.parent = this.BOOLEAN;
        }
        return obj;
    }

    create_object(parent) {
        let obj = {
            is_primitive: false,
            type: 'object',
            parent: parent,
            fixed: Object.create(null),
            nonenumerable: Object.create(null),
            properties: Object.create(null),
            toBoolean: function() {
                return true;
            },
            toNumber: function() {
                return NaN;
            },
            toString: function() {
                return '[' + this.type + ']';
            },
            valueOf: function() {
                return this;
            }
        };
        if (this.is_instance_of(obj, this.FUNCTION)) {
            obj.type = 'function';
            this.set_property(obj, 'prototype', this.create_object(this.OBJECT || null));
        }
        if (this.is_instance_of(obj, this.ARRAY)) {
            obj.length = 0;
            // prazdne pole je 0
            obj.toNumber = function() {
                return 0;
            };
            obj.toString = function() {
                let str = [];
                for (let i = 0; i < this.length; i++) {
                    str[i] = this.properties[i].toString();
                }
                return str.join(',');
            };
        }
        return obj;
    }

    create_function(node, scope) {
        let func = this.create_object(this.FUNCTION);
        func.parent_scope = scope || this.get_scope();
        func.node = node;
        this.set_property(func, 'length', this.create_primitive(func.node.params.length), true);
        return func;
    }

    to_basic_js_function(native_func) {
        let func = this.create_object(this.FUNCTION);
        func.native_func = native_func;
        this.set_property(func, 'length', this.create_primitive(native_func.length), true);
        return func;
    }

    is_instance_of(child, parent) {
        if (!child || !parent) {
            return false;
        } else if (child.parent == parent) {
            return true;
        } else if (!child.parent || !child.parent.prototype) {
            return false;
        }
        return this.is_instance_of(child.parent.prototype, parent);
    }

    comp(a, b, comp_func) {
        if (a.is_primitive && a.type == 'number' && isNaN(a.data) || b.is_primitive && b.type == 'number' && isNaN(b.data)) {
            return NaN;
        }
        if (a.is_primitive && b.is_primitive) {
            a = a.data;
            b = b.data;
        } else {
            if (comp_func) {
                let result = comp_func(a.data, b.data);
                return isNaN(result) ? NaN : result;
            }
            return NaN;
        }
        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        }
        return 0;
    }

    array_index(n) {
        n = Number(n);
        if (!isFinite(n) || n != Math.floor(n) || n < 0) {
            return NaN;
        }
        return n;
    }

    get_property(obj, prop_name) {
        if (obj.is_primitive) {
            throw new TypeError('Primitive has no properties.');
        }
        prop_name = prop_name.toString();
        if (this.is_instance_of(obj, this.STRING)) {
            if (prop_name == 'length') {
                return this.create_primitive(obj.data.length);
            }
            let n = this.array_index(prop_name);
            if (!isNaN(n) && n < obj.data.length) {
                return this.create_primitive(obj.data[n]);
            }
        } else if (this.is_instance_of(obj, this.ARRAY) && prop_name == 'length') {
            return this.create_primitive(obj.length);
        }

        while (true) {
            if (obj.properties && prop_name in obj.properties) {
                return obj.properties[prop_name];
            }
            if (obj.parent && obj.parent.properties && obj.parent.properties.prototype) {
                obj = obj.parent.properties.prototype;
            } else {
                break;
            }
        }
        return this.UNDEFINED;
    }

    has_property(obj, prop_name) {
        if (obj.is_primitive) {
            throw new TypeError('Primitive has no properties.');
        }
        prop_name = prop_name.toString();
        if (prop_name == 'length' && (this.is_instance_of(obj, this.STRING) || this.is_instance_of(this.ARRAY))) {
            return true;
        }
        if (this.is_instance_of(obj, this.STRING)) {
            let n = this.array_index(prop_name);
            if (!isNaN(n) && n < obj.data.length) {
                return true;
            }
        }
        while (true) {
            if (obj.properties && prop_name in obj.properties) {
                return true;
            }
            if (obj.parent && obj.parent.properties && obj.parent.properties.prototype) {
                obj = obj.parent.properties.prototype;
            } else {
                break;
            }
        }
        return false;
    }

    set_property(obj, prop_name, value, fixed, nonenumerable) {
        if (obj.is_primitive) {
            throw new TypeError('Primitive has no properties.');
        }
        prop_name = prop_name.toString();
        if (obj.fixed[prop_name]) {
            return;
        }

        if (this.is_instance_of(obj, this.STRING)) {
            let n = this.array_index(prop_name);
            if (prop_name == 'length' || (!isNaN(n) && n < obj.data.length)) {
                return;
            }
        }
        if (this.is_instance_of(obj, this.ARRAY)) {
            if (prop_name == 'length') {
                let new_length = this.array_index(value.toNumber());
                if (isNaN(new_length)) {
                    throw new TypeError('Invalid array length.');
                }
                if (new_length < obj.length) {
                    for (let i in obj.properties) {
                        let j = this.array_index(i);
                        if (!isNaN(j) && new_length <= j) {
                            delete obj.properties[j];
                        }
                    }
                }
                obj.length = new_length;
                return;
            } else {
                let i = this.array_index(prop_name);
                if (!isNaN(i)) {
                    obj.length = Math.max(obj.length, i + 1);
                }
            }
        }
        obj.properties[prop_name] = value;
        if (fixed) {
            obj.fixed[prop_name] = true;
        }
        if (nonenumerable) {
            obj.nonenumerable[prop_name] = true;
        }
    }

    delete_property(obj, prop_name) {
        if (obj.is_primitive) {
            throw new TypeError('Primitive has no properties.');
        }
        prop_name = prop_name.toString();
        if (obj.fixed[prop_name]) {
            return false;
        }
        if (prop_name == 'length' && this.is_instance_of(obj, this.ARRAY)) {
            return false;
        }
        return delete obj.properties[prop_name];
    }

    get_scope() {
        for (let i = 0; i < this.execution_stack.length; i++) {
            if (this.execution_stack[i].scope) {
                return this.execution_stack[i].scope;
            }
        }
        throw new Error('No scope found.');
    }

    create_scope(node, parent_scope) {
        let scope = this.create_object(null);
        scope.parent_scope = parent_scope;
        if (!parent_scope) {
            this.init_global_scope(scope);
        }
        this.populate_scope(node, scope);
        scope.strict = false;
        if (parent_scope && parent_scope.strict) {
            scope.strict = true;
        } else {
            let first_node = node.body && node.body[0];
            if (first_node && first_node.expression) {
                if (first_node.expression.type == 'Literal' && first_node.expression.value == 'use strict') {
                    scope.strict = true;
                }
            }
        }
        return scope;
    }

    get_scope_value(name, value) {
        let scope = this.get_scope();
        name = name.toString();
        while (scope) {
            if (this.has_property(scope, name)) {
                return this.get_property(scope, name);
            }
            scope = scope.parent_scope;
        }
        throw new Error('Unknown identifier: ' + name);
    }

    set_scope_value(name, value) {
        let scope = this.get_scope();
        let strict = scope.strict;
        name = name.toString();
        while (scope) {
            if (this.has_property(scope, name) || (!strict && !scope.parent_scope)) {
                return this.set_property(scope, name, value);
            }
            scope = scope.parent_scope;
        }
        throw new Error('Unknown identifier: ' + name);
    }

    populate_scope(node, scope) {
        if (node.type == 'VariableDeclaration') {
            for (let i = 0; i < node.declarations.length; i++) {
                this.set_property(scope, node.declarations[i].id.name, this.UNDEFINED);
            }
        } else if (node.type == 'FunctionDeclaration') {
            this.set_property(scope, node.id.name, this.create_function(node, scope));
            return;
        } else if (node.type == 'FunctionExpression') {
            return;
        }
        let self = this;

        function recurse(child) {
            if (child.constructor == self.syntax_tree.constructor) {
                self.populate_scope(child, scope);
            }
        }

        for (let prop_name in node) {
            let prop = node[prop_name];
            if (prop && typeof prop == 'object') {
                if (is_array(prop)) {
                    for (let i = 0; i < prop.length; i++) {
                        recurse(prop[i]);
                    }
                } else {
                    recurse(prop);
                }
            }
        }
    }

    get_value(obj_or_scope) {
        if (obj_or_scope.length) {
            let obj = obj_or_scope[0];
            let prop = obj_or_scope[1];
            return this.get_property(obj, prop);
        } else {
            return this.get_scope_value(obj_or_scope);
        }
    }

    set_value(obj_or_scope, value) {
        if (obj_or_scope.length) {
            let obj = obj_or_scope[0];
            let prop = obj_or_scope[1];
            return this.set_property(obj, prop, value);
        } else {
            return this.set_scope_value(obj_or_scope, value);
        }
    }

    // node types
    step_ArrayExpression() {
        let state = this.execution_stack[0];
        let node = state.node;
        let n = state.n || 0;
        if (!state.array) {
            state.array = this.create_object(this.ARRAY);
        } else {
            this.set_property(state.array, n - 1, state.value);
        }
        if (node.elements[n]) {
            state.n = n + 1;
            this.execution_stack.unshift({
                node: node.elements[n]
            });
        } else {
            state.array.length = state.n || 0;
            this.execution_stack.shift();
            this.execution_stack[0].value = state.array;
        }
    }

    step_AssignmentExpression() {
        let state = this.execution_stack[0];
        let node = state.node;
        if (!state.done_left) {
            state.done_left = true;
            this.execution_stack.unshift({
                node: node.left,
                components: true
            });
        } else if (!state.done_right) {
            state.done_right = true;
            state.left_side = state.value;
            this.execution_stack.unshift({
                node: node.right
            });
        } else {
            this.execution_stack.shift();
            let left_side = state.left_side;
            let right_side = state.value;
            let value;
            if (node.operator == '=') {
                value = right_side;
            } else {
                let left_value = this.get_value(left_side);
                let right_value = right_side;
                if (left_value.type == 'string' || right_value.type == 'string') {
                    left_value = left_value.toString();
                    right_value = right_value.toString();
                } else {
                    left_value = left_value.toNumber();
                    right_value = right_value.toNumber();
                }
                if (node.operator == '+=') {
                    value = left_value + right_value;
                } else if (node.operator == '-=') {
                    value = left_value - right_value;
                } else if (node.operator == '*=') {
                    value = left_value * right_value;
                } else if (node.operator == '/=') {
                    value = left_value / right_value;
                } else if (node.operator == '%=') {
                    value = left_value % right_value;
                } else if (node.operator == '&=') {
                    value = left_value & right_value;
                } else if (node.operator == '|=') {
                    value = left_value | right_value;
                } else {
                    throw new Error('Unknow assignment operator: ' + node.operator + ', (supporting only: =, +=, -=, /=, *=, %=, &=, |=)');
                }
                value = this.create_primitive(value);
            }
            this.set_value(left_side, value);
            this.execution_stack[0].value = value;
        }
    }

    step_BinaryExpression() {
        let state = this.execution_stack[0];
        let node = state.node;
        if (!state.done_left) {
            state.done_left = true;
            this.execution_stack.unshift({
                node: node.left
            });
        } else if (!state.done_right) {
            state.done_right = true;
            state.left_side = state.value;
            this.execution_stack.unshift({
                node: node.right
            });
        } else {
            this.execution_stack.shift();
            let left_side = state.left_side;
            let right_side = state.value;
            let comp_result = this.comp(left_side, right_side);
            let value;
            if (node.operator == '==') {
                value = comp_result === 0;
            } else if (node.operator == '!=') {
                value = comp_result !== 0;
            } else if (node.operator == '===') {
                if (left_side.is_primitive && right_side.is_primitive) {
                    value = left_side.data === right_side.data;
                } else {
                    value = left_side === right_side;
                }
            } else if (node.operator == '!==') {
                if (left_side.is_primitive && right_side.is_primitive) {
                    value = left_side.data !== right_side.data;
                } else {
                    value = left_side !== right_side;
                }
            } else if (node.operator == '>') {
                value = comp_result == 1;
            } else if (node.operator == '>=') {
                value = comp_result == 1 || comp_result === 0;
            } else if (node.operator == '<') {
                value = comp_result == -1;
            } else if (node.operator == '<=') {
                value = comp_result == -1 || comp_result === 0;
            } else if (node.operator == '+') {
                let left_value;
                let right_value;
                if (left_side.type == 'string' || right_side.type == 'string') {
                    left_value = left_side.toString();
                    right_value = right_side.toString();
                } else {
                    left_value = left_side.toNumber();
                    right_value = right_side.toNumber();
                }
                value = left_value + right_value;
            } else if (node.operator == 'in') {
                value = this.has_property(right_side, left_side);
            } else {
                let left_value = left_side.toNumber();
                let right_value = right_side.toNumber();
                if (node.operator == '-') {
                    value = left_value - right_value;
                } else if (node.operator == '*') {
                    value = left_value * right_value;
                } else if (node.operator == '/') {
                    value = left_value / right_value;
                } else if (node.operator == '%') {
                    value = left_value % right_value;
                } else if (node.operator == '&') {
                    value = left_value & right_value;
                } else if (node.operator == '|') {
                    value = left_value | right_value;
                } else {
                    throw new Error('Unknown binary operator: ' + node.operator);
                }
            }
            this.execution_stack[0].value = this.create_primitive(value);
        }
    }

    step_DoWhileStatement() {
        let state = this.execution_stack[0];
        state.is_loop = true;
        if (state.node.type == 'DoWhileStatement' && state.test === undefined) {
            state.value = this.create_primitive(true);
            state.test = true;
        }
        if (!state.test) {
            state.test = true;
            this.execution_stack.unshift({
                node: state.node.test
            });
        } else {
            state.test = false;
            if (!state.value.toBoolean()) {
                this.execution_stack.shift();
            } else if (state.node.body) {
                this.execution_stack.unshift({
                    node: state.node.body
                });
            }
        }
    }

    step_WhileStatement() {
        this.step_DoWhileStatement();
    }

    step_ForStatement() {
        let state = this.execution_stack[0];
        state.is_loop = true;
        let node = state.node;
        let mode = state.mode || 0;
        switch (mode) {
            case 0:
                state.mode = 1;
                if (node.init) {
                    this.execution_stack.unshift({
                        node: node.init
                    });
                }
                break;
            case 1:
                state.mode = 2;
                if (node.test) {
                    this.execution_stack.unshift({
                        node: node.test
                    });
                }
                break;
            case 2:
                state.mode = 3;
                if (state.value && !state.value.toBoolean()) {
                    this.execution_stack.shift();
                } else if (node.body) {
                    this.execution_stack.unshift({
                        node: node.body
                    });
                }
                break;
            case 3:
                state.mode = 1;
                if (node.update) {
                    this.execution_stack.unshift({
                        node: node.update
                    });
                }
                break;
        }
    }

    step_ForInStatement() {
        let state = this.execution_stack[0];
        state.is_loop = true;
        let node = state.node;
        if (!state.done_variable) {
            state.done_variable = true;
            let left = node.left;
            if (left.type == 'VariableDeclaration') {
                left = left.declarations[0].id;
            }
            this.execution_stack.unshift({
                node: left,
                components: true
            });
        } else if (!state.done_object) {
            state.done_object = true;
            state.variable = state.value;
            this.execution_stack.unshift({
                node: node.right
            });
        } else {
            if (typeof state.iterator == 'undefined') {
                state.object = state.value;
                state.iterator = 0;
            }
            let name = null;
            outer_loop:
                do {
                    let i = state.iterator;
                    for (let prop in state.object.properties) {
                        if (prop in state.object.nonenumerable) {
                            continue;
                        }
                        if (i === 0) {
                            name = prop;
                            break outer_loop;
                        }
                        i--;
                    }
                    state.object = state.object.parent && state.object.parent.properties.prototype;
                    state.iterator = 0;
                } while (state.object);
            state.iterator++;
            if (name === null) {
                this.execution_stack.shift();
            } else {
                this.set_scope_value(state.variable, this.create_primitive(name));
                if (node.body) {
                    this.execution_stack.unshift({
                        node: node.body
                    });
                }
            }
        }
    }

    step_BreakStatement() {
        let state = this.execution_stack.shift();
        let node = state.node;
        let label = null;
        if (node.label) {
            label = node.label.name;
        }
        state = this.execution_stack.shift();
        while (state && state.node.type != 'CallExpression') {
            if ((label && label == state.label) || (state.is_loop || state.is_switch)) {
                return;
            }
            state = this.execution_stack.shift();
        }
        throw new Error('Faulty break statement.');
    }

    step_ContinueStatemet() {
        let node = this.execution_stack[0].node;
        let label = null;
        if (node.label) {
            label = node.label.name;
        }
        let state = this.execution_stack[0];
        while (state && state.node.type != 'CallExpression') {
            if (state.isLoop) {
                if (!label || (label == state.label)) {
                    return;
                }
            }
            this.execution_stack.shift();
            state = this.execution_stack[0];
        }
        throw new Error('Faulty continue statement');
    }

    step_BlockStatement() {
        let state = this.execution_stack[0];
        let node = state.node;
        let n = state.n || 0;
        if (node.body[n]) {
            state.n = n + 1;
            this.execution_stack.unshift({
                node: node.body[n]
            });
        } else {
            this.execution_stack.shift();
        }
    }

    step_Program() {
        this.step_BlockStatement();
    }

    step_ExpressionStatement() {
        let state = this.execution_stack[0];
        if (!state.done) {
            state.done = true;
            this.execution_stack.unshift({
                node: state.node.expression
            });
        } else {
            this.execution_stack.shift();
            this.value = state.value;
        }
    }

    step_CallExpression() {
        let state = this.execution_stack[0];
        let node = state.node;
        if (!state.done_call_expression) {
            state.done_call_expression = true;
            this.execution_stack.unshift({
                node: node.callee,
                components: true
            });
        } else {
            let n;
            if (!state.func) {
                if (state.value.type == 'function') {
                    state.func = state.value;
                } else {
                    state.member = state.value[0];
                    state.func = this.get_value(state.value);
                    if (!state.func || state.func.type != 'function') {
                        throw new TypeError(state.func + ' is not a function');
                    }
                }
                if (state.node.type == 'NewExpression') {
                    state.func_this = this.create_object(state.func);
                    state.is_constructor = true;
                } else if (state.value.length) {
                    state.func_this = state.value[0];
                } else {
                    state.func_this = this.execution_stack[this.execution_stack.length - 1].this_expression;
                }
                state.arguments = [];
                n = 0;
            } else {
                n = state.n;
                if (state.arguments.length != node.arguments.length) {
                    state.arguments[n - 1] = state.value;
                }
            }
            if (node.arguments[n]) {
                state.n = n + 1;
                this.execution_stack.unshift({
                    node: node.arguments[n]
                });
            } else if (!state.done_exec) {
                state.done_exec = true;
                if (state.func.node && (state.func.node.type == 'function_apply' || state.func.node.type == 'function_call')) {
                    state.func_this = state.arguments.shift();
                    if (state.func.node.type == 'function_apply') {
                        state.arguments = [];
                        let args_list = state.arguments.shift();
                        if (args_list && this.is_instance_of(args_list, this.ARRAY)) {
                            for (let i = 0; i < args_list.length; i++) {
                                state.arguments.push(this.get_property(args_list, i));
                            }
                        }
                    }
                    state.func = state.member;
                }
                if (state.func.node) {
                    let scope = this.create_scope(state.func.node.body, state.func.parent_scope);
                    for (let i = 0; i < state.func.node.params.length; i++) {
                        let param_name = this.create_primitive(state.func.node.params[i].name);
                        let param_val = i < state.arguments.length ? state.arguments[i] : this.UNDEFINED;
                        this.set_property(scope, param_name, param_val);
                    }
                    let args_list = this.create_object(this.ARRAY);
                    for (let i = 0; i < state.arguments.length; i++) {
                        this.set_property(args_list, this.create_primitive(i), state.arguments[i]);
                    }
                    this.set_property(scope, 'arguments', args_list);
                    let func_state = {
                        node: state.func.node.body,
                        scope: scope,
                        this_expression: state.func._this
                    };
                    this.execution_stack.unshift(func_state);
                    state.value = this.UNDEFINED;
                } else if (state.func.native_func) {
                    state.value = state.func.native_func.apply(state.func_this, state.arguments);
                } else if (state.func.eval) {
                    let code = state.arguments[0];
                    if (!code) {
                        state.value = this.UNDEFINED;
                    } else if (!code.is_primitive) {
                        state.value = code;
                    } else {
                        let eval_interpreter = new Interpreter(code.toString());
                        eval_interpreter.execution_stack[0].scope.parent_scope = this.get_scope();
                        state = {
                            node: {
                                type: 'Eval',
                            },
                            interpreter: eval_interpreter
                        };
                        this.execution_stack.unshift(state);
                    }
                } else {
                    throw new Error('Problem with a function interpretation.');
                }
            } else {
                this.execution_stack.shift();
                this.execution_stack[0].value = state.is_constructor ? state.func_this : state.value;
            }
        }
    }

    step_NewExpression() {
        this.step_CallExpression();
    }

    step_UnaryExpression() {
        let state = this.execution_stack[0];
        let node = state.node;
        if (!state.done) {
            state.done = true;
            let next_state = {
                node: node.argument
            };
            if (node.operator == 'delete') {
                next_state.components = true;
            }
            this.execution_stack.unshift(next_state);
        } else {
            this.execution_stack.shift();
            let value;
            if (node.operator == '-') {
                value = -state.value.toNumber();
            } else if (node.operator == '+') {
                value = state.value.toNumber();
            } else if (node.operator == '!') {
                value = !state.value.toBoolean();
            } else if (node.operator == '~') {
                value = ~state.value.toNumber();
            } else if (node.operator == 'typeof') {
                value = state.value.type;
            } else if (node.operator == 'delete') {
                let obj, name;
                if (state.value.length) {
                    obj = state.value[0];
                    name = state.value[1];
                } else {
                    obj = this.get_scope();
                    name = state.value;
                }
                value = this.delete_property(obj, name);
            } else if (node.operator == 'void') {
                value = undefined;
            } else {
                throw new Error('Unknown unary operator: ' + node.operator);
            }
            this.execution_stack[0].value = this.create_primitive(value);
        }
    }

    step_UpdateExpression() {
        let state = this.execution_stack[0];
        let node = state.node;
        if (!state.done) {
            state.done = true;
            this.execution_stack.unshift({
                node: node.argument,
                components: true
            });
        } else {
            this.execution_stack.shift();
            let left_side = state.value;
            let left_value = this.get_value(left_side).toNumber();
            let value;
            if (node.operator == '++') {
                value = this.create_primitive(left_value + 1);
            } else if (node.operator == '--') {
                value = this.create_primitive(left_value - 1);
            } else {
                throw new Error('Unknown update expression: ' + node.operator);
            }
            this.set_value(left_side, value);
            this.execution_stack[0].value = node.prefix ? value : this.create_primitive(left_value);
        }
    }

    step_ReturnStatement() {
        let state = this.execution_stack[0];
        let node = state.node;
        if (node.argument && !state.done) {
            state.done = true;
            this.execution_stack.unshift({
                node: node.argument
            });
        } else {
            let value = state.value || this.UNDEFINED;
            do {
                this.execution_stack.shift();
                if (this.execution_stack.length === 0) {
                    throw new SyntaxError('Illegal return statement');
                }
                state = this.execution_stack[0];
            } while (state.node.type != 'CallExpression');
            state.value = value;
        }
    }

    step_SequenceExpression() {
        let state = this.execution_stack[0];
        let node = state.node;
        let n = state.n || 0;
        if (node.expressions[n]) {
            state.n = n + 1;
            this.execution_stack.unshift({
                node: node.expressions[n]
            });
        } else {
            this.execution_stack.shift();
            this.execution_stack[0].value = state.value;
        }
    }

    step_ThisExpression() {
        this.execution_stack.shift();
        for (var i = 0; i < this.execution_stack.length; i++) {
            if (this.execution_stack[i].this_expression) {
                this.execution_stack[0].value = this.execution_stack[i].this_expression;
                return;
            }
        }
        throw new Error('Couldn\'t find this');
    }

    step_ConditionalExpression() {
        let state = this.execution_stack[0];
        if (!state.done) {
            if (!state.test) {
                state.test = true;
                this.execution_stack.unshift({
                    node: state.node.test
                });
            } else {
                state.done = true;
                if (state.value.toBoolean() && state.node.consequent) {
                    this.execution_stack.unshift({
                        node: state.node.consequent
                    });
                } else if (!state.value.toBoolean() && state.node.alternate) {
                    this.execution_stack.unshift({
                        node: state.node.alternate
                    });
                }
            }
        } else {
            this.execution_stack.shift();
            if (state.node.type == 'ConditionalExpression') {
                this.execution_stack[0].value = state.value;
            }
        }
    }

    step_IfStatement() {
        this.step_ConditionalExpression();
    }

    step_SwitchStatement() {
        let state = this.execution_stack[0];
        state.checked = state.checked || [];
        state.is_switch = true;

        if (!state.test) {
            state.test = true;
            this.execution_stack.unshift({
                node: state.node.discriminant
            });
        } else {
            if (!state.switch_value) {
                state.switch_value = state.value;
            }
            let index = state.index || 0;
            let current_case = state.node.cases[index];
            if (current_case) {
                if (!state.done && !state.checked[index] && current_case.test) {
                    state.checked[index] = true;
                    this.execution_stack.unshift({
                        node: current_case.test
                    });
                } else {
                    if (state.done || !current_case.test || this.comp(state.value, state.switch_value) === 0) {
                        state.done = true;
                        let n = state.n || 0;
                        if (current_case.consequent[n]) {
                            this.execution_stack.unshift({
                                node: current_case.consequent[n]
                            });
                            state.n = n + 1;
                            return;
                        }
                    }
                    state.n = 0;
                    state.index = index + 1;
                }
            } else {
                this.execution_stack.shift();
            }
        }
    }

    step_EmptyStatement() {
        this.execution_stack.shift();
    }

    step_VariableDeclaration() {
        let state = this.execution_stack[0];
        let node = state.node;
        let n = state.n || 0;
        if (node.declarations[n]) {
            state.n = n + 1;
            this.execution_stack.unshift({
                node: node.declarations[n]
            });
        } else {
            this.execution_stack.shift();
        }
    }

    step_VariableDeclarator() {
        let state = this.execution_stack[0];
        let node = state.node;
        if (node.init && !state.done) {
            state.done = true;
            this.execution_stack.unshift({
                node: node.init
            });
        } else {
            if (!this.has_property(this, node.id.name) || node.init) {
                let value = node.init ? state.value : this.UNDEFINED;
                this.set_value(this.create_primitive(node.id.name), value);
            }
            this.execution_stack.shift();
        }
    }

    step_FunctionDeclaration() {
        this.execution_stack.shift();
    }

    step_FunctionExpression() {
        let state = this.execution_stack[0];
        this.execution_stack.shift();
        this.execution_stack[0].value = this.create_function(state.node);
    }

    step_Identifier() {
        let state = this.execution_stack[0];
        this.execution_stack.shift();
        let name = this.create_primitive(state.node.name);
        this.execution_stack[0].value = state.components ? name : this.get_scope_value(name);
    }

    step_LabeledStatement() {
        let state = this.execution_stack.shift();
        this.execution_stack.unshift({
            node: state.node.body,
            label: state.node.label.name
        });
    }

    step_Literal() {
        let state = this.execution_stack[0];
        this.execution_stack.shift();
        this.execution_stack[0].value = this.create_primitive(state.node.value);
    }

    step_LogicalExpression() {
        let state = this.execution_stack[0];
        let node = state.node;
        if (node.operator != '&&' && node.operator != '||') {
            throw new Error('Unknown logical operator: ' + node.operator);
        }
        if (!state.done_left) {
            state.done_left = true;
            this.execution_stack.unshift({
                node: node.left
            });
        } else if (!state.done_right) {
            if ((node.operator == '&&' && !state.value.toBoolean()) || (node.operator == '||' && state.value.toBoolean())) {
                this.execution_stack.shift();
                this.execution_stack[0].value = state.value;
            } else {
                state.done_right = true;
                this.execution_stack.unshift({
                    node: node.right
                });
            }
        } else {
            this.execution_stack.shift();
            this.execution_stack[0].value = state.value;
        }
    }

    step_MemberExpression() {
        let state = this.execution_stack[0];
        let node = state.node;
        if (!state.done_object) {
            state.done_object = true;
            this.execution_stack.unshift({
                node: node.object
            });
        } else if (!state.done_prop) {
            state.done_prop = true;
            state.object = state.value;
            this.execution_stack.unshift({
                node: node.property,
                components: !node.computed
            });
        } else {
            this.execution_stack.shift();
            if (state.components) {
                this.execution_stack[0].value = [state.object, state.value];
            } else {
                this.execution_stack[0].value = this.get_property(state.object, state.value);
            }
        }
    }

    step_ObjectExpression() {
        let state = this.execution_stack[0];
        let node = state.node;
        let value_t = state.value_t;
        let n = state.n || 0;
        if (!state.object) {
            state.object = this.create_object(this.OBJECT);
        } else {
            if (value_t) {
                state.key = state.value;
            } else {
                this.set_property(state.object, state.key, state.value);
            }
        }
        if (node.properties[n]) {
            if (value_t) {
                state.n = n + 1;
                this.execution_stack.unshift({
                    node: node.properties[n].value
                });
            } else {
                this.execution_stack.unshift({
                    node: node.properties[n].key,
                    components: true
                });
            }
            state.value_t = !value_t;
        } else {
            this.execution_stack.shift();
            this.execution_stack[0].value = state.object;
        }
    }

    step_Eval() {
        let state = this.execution_stack[0];
        if (!state.interpreter.step()) {
            this.execution_stack.shift();
            this.execution_stack[0].value = state.interpreter.value || this.UNDEFINED;
        }
    }
}
