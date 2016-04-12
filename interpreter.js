function is_array(potential_array) {
    return potential_array.constructor === Array;
}

class Interpreter {
    constructor(code, init_func) {
        this.syntax_tree = Parser.parse(code);
        this._paused = false;
        this.UNDEFINED = this.create_primitive(undefined);
        this._init_function = init_func;
        let scope = this.create_scope();
        this.state_stack = [{
            node: this.syntax_tree,
            scope: scope,
            this_expression: scope
        }];
    }

    step() {
        if (!is_array(this.state_stack))
            return false;
        else if (this._paused)
            return true;
        let state = this.state_stack[0];
        this['step_' + state.node.type]();
        return true;
    }

    run() {
        while (!this._paused) {
            if (!this.step()) break;
        }
        return this._paused;
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
        self.set_property(scope, 'isNaN', this.create_native_function(wrapper));
        // isFinite
        wrapper = function(num) {
            num = num || self.UNDEFINED;
            return self.create_primitive(isFinite(num.toNumber()));
        };
        self.set_property(scope, 'isFinite', this.create_native_function(wrapper));
        // parseFloat
        wrapper = function(str) {
            str = str || self.UNDEFINED;
            return self.create_primitive(parseFloat(str.toString()));
        };
        self.set_property(scope, 'parseFloat', this.create_native_function(wrapper));
        // parseInt
        wrapper = function(str, radix) {
            str = str || self.UNDEFINED;
            return self.create_primitive(parseInt(str.toString(), radix.toNumber()));
        };
        self.set_property(scope, 'parseInt', this.create_native_function(wrapper));
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
            new_func.parent_scope = self.state_stack[self.state_stack.length - 1].scope;
            let syntax_tree = Parser.parse('$ = function(' + args + ') {' + code + '};');
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
        this.set_property(this.FUNCTION.properties.prototype, 'toString', this.create_native_function(wrapper), false, true);
        this.set_property(this.FUNCTION, 'toString', this.create_native_function(wrapper), false, true);
        wrapper = function() {
            return self.create_primitive(this.valueOf());
        };
        this.set_property(this.FUNCTION.properties.prototype, 'valueOf', this.create_native_function(wrapper), false, true);
        this.set_property(this.FUNCTION, 'valueOf', this.create_native_function(wrapper), false, true);
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
        this.OBJECT = this.create_native_function(wrapper);
        this.set_property(scope, 'Object', this.OBJECT);

        // toString, valueOf
        wrapper = function() {
            return self.create_primitive(this.toString());
        };
        this.set_property(this.OBJECT.properties.prototype, 'toString', this.create_native_function(wrapper), false, true);
        wrapper = function() {
            return self.create_primitive(this.valueOf());
        };
        this.set_property(this.OBJECT.properties.prototype, 'valueOf', this.create_native_function(wrapper), false, true);
        // hasOwnProperty
        wrapper = function(property) {
            for (let key in this.properties) {
                if (key == property)
                    return self.create_primitive(true);
            }
            return self.create_primitive(false);
        };
        this.set_property(this.OBJECT.properties.prototype, 'hasOwnProperty', this.create_native_function(wrapper), false, true);
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
        this.set_property(this.OBJECT, 'keys', this.create_native_function(wrapper));
    }

    init_number() {
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
        this.NUMBER = this.create_native_function(wrapper);
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
        this.set_property(this.NUMBER.properties.prototype, 'toExponential', this.create_native_function(wrapper), false, true);
        // toPrecision
        wrapper = function(precision) {
            precision = precision ? precision.toNumber() : undefined;
            let n = this.toNumber();
            return self.create_primitive(n.toPrecision(precision));
        };
        this.set_property(this.NUMBER.properties.prototype, 'toPrecision', this.create_native_function(wrapper), false, true);
        // toString
        wrapper = function(radix) {
            radix = radix ? radix.toNumber() : 10;
            let n = this.toNumber();
            return self.create_primitive(n.toString(radix));
        };
        this.set_property(this.NUMBER.properties.prototype, 'toString', this.create_native_function(wrapper), false, true);
    }

    init_boolean(scope) {
        let self = this;
        let wrapper;
        // constructor
        wrapper = function(value) {
            value = value ? value.toBoolean() : false;
            if (this.parent == self.STRING) {
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
        this.BOOLEAN = this.create_native_function(wrapper);
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
        this.STRING = this.create_native_function(wrapper);
        this.set_property(scope, 'String', this.STRING);
        // charCodeAt
        wrapper = function(num) {
            let str = this.toString();
            num = (num || thisInterpreter.UNDEFINED).toNumber();
            return self.create_primitive(str.charCodeAt(num));
        };
        this.set_property(this.STRING.properties.prototype, 'charCodeAt', this.create_native_function(wrapper), false, true);
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
        this.ARRAY = this.create_native_function(wrapper);
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
        this.set_property(this.ARRAY.properties.prototype, 'pop', this.create_native_function(wrapper), false, true);
        // push
        wrapper = function(var_args) {
            for (let i = 0; i < arguments.length; i++) {
                this.properties[this.length] = arguments[i];
                this.length++;
            }
            return self.create_primitive(this.length);
        };
        this.set_property(this.ARRAY.properties.prototype, 'push', this.create_native_function(wrapper), false, true);
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
        this.set_property(this.ARRAY.properties.prototype, 'shift', this.create_native_function(wrapper), false, true);
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
        this.set_property(this.ARRAY.properties.prototype, 'unshift', this.create_native_function(wrapper), false, true);
        // reverse
        wrapper = function() {
            for (let i = 0; i < this.length / 2; i++) {
                let tmp = this.properties[this.length - i - 1];
                this.properties[this.length - i - 1] = this.properties[i];
                this.properties[i] = tmp;
            }
            return self.UNDEFINED;
        };
        this.set_property(this.ARRAY.properties.prototype, 'reverse', this.create_native_function(wrapper), false, true);
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
            // Delete superfluous properties.
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
        this.set_property(this.ARRAY.properties.prototype, 'splice', this.create_native_function(wrapper), false, true);
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
        this.set_property(this.ARRAY.properties.prototype, 'slice', this.create_native_function(wrapper), false, true);
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
        this.set_property(this.ARRAY.properties.prototype, 'join', this.create_native_function(wrapper), false, true);
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
        this.set_property(this.ARRAY.properties.prototype, 'concat', this.create_native_function(wrapper), false, true);
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
        this.set_property(this.ARRAY.properties.prototype, 'indexOf', this.create_native_function(wrapper), false, true);
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
        this.set_property(this.ARRAY.properties.prototype, 'lastIndexOf', this.create_native_function(wrapper), false, true);
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
        this.set_property(this.ARRAY.properties.prototype, 'sort', this.create_native_function(wrapper), false, true);
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
            this.set_property(math_obj, num_functions[i], this.create_native_function(wrapper));
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

    create_native_function(native_func) {
        let func = this.create_object(this.FUNCTION);
        func.native_func = native_func;
        this.set_property(func, 'length', this.create_primitive(native_func.length), true);
        return func;
    }

    is_instance_of(child, parent) {
        if (!child && !parent) {
            return false;
        } else if (child.parent == parent) {
            return true;
        } else if (!child.parent || !child.parent.prototype) {
            return false;
        }
        return this.is_instance_of(child.parent.prototype, parent);
    }

    comp(a, b) {
        if (a.is_primitive && a.type == 'number' && isNaN(a.data) || b.is_primitive && b.type == 'number' && isNaN(b.data)) {
            return NaN;
        }
        if (a.is_primitive && b.is_primitive) {
            a = a.data;
            b = b.data;
        } else {
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

    
}
