var Jenshi = {
    directiveProcessingOrder_list: ['py:def', 'py:match', 'py:when', 'py:otherwise', 'py:for', 'py:if', 'py:choose', 'py:with', 'py:replace', 'py:content', 'py:attrs', 'py:strip'],
    directiveAttributes: {
        'py:def': 'function',
        'py:match': 'path',
        'py:when': 'test',
        'py:otherwise': '',
        'py:for': 'each',
        'py:if': 'test',
        'py:choose': 'test',
        'py:with': 'vars',
        'py:replace': 'value',
        'py:content': '',
        'py:attrs': '',
        'py:strip': ''
    },
    directiveFunctions: {
        'py:def': function(node, directive_code, data) { return true; },
        'py:match': function(node, directive_code, data) { return true; },
        'py:when': function(node, directive_code, data) { return true; },
        'py:otherwise': function(node, directive_code, data) { return true; },
        'py:for': function(node, directive_code, data) { return true; },
        'py:if': function(node, directive_code, data) { return true; },
        'py:choose': function(node, directive_code, data) { return true; },
        'py:with': function(node, directive_code, data) { return true; },
        'py:replace': function(node, directive_code, data) { return true; },
        'py:content': function(node, directive_code, data) { return true; },
        'py:attrs': function(node, directive_code, data) { return true; },
        'py:strip': function(node, directive_code, data) { return true; }
    },

    data_prototype: {},

    generate: function(node, data) {},
    _generate_node: function(node, data) {},
    _generate_text: function(text, data) {},
};

Jenshi.generate = function(orig_node, data) {
    if (data == null) {
        data = {};
    }
    var node = orig_node.cloneNode(true);
    Jenshi._generate_node(node, data);
    return node;
};

Jenshi._generate_node = function(node, data) {
    var attr_name;
    var attr_value;
    var i;

    if (node.nodeType == 3) { // TEXT_NODE
        node.nodeValue = Jenshi._generate_text(node.nodeValue, data);
    }
    else if (node.nodeType == 1) {
        for (var i in Jenshi.directiveProcessingOrder_list) {
            var directive = Jenshi.directiveProcessingOrder_list[i];
            attr_value = null;

            if (node.tagName == directive) {
                attr_name = Jenshi.directiveAttributes[directive];

                if (directive != 'py:strip' && node.getAttribute('py:strip') == null) {
                    node.setAttribute('py:strip', '');
                }
            }
            else {
                attr_name = directive;
            }

            if (attr_name != '') {
                attr_value = node.getAttribute(attr_name);
                node.removeAttribute(attr_name);
            }

            if (attr_value != null) {
                //alert(directive + ': ' + attr_value + '\n' + node + '\n' + node.nodeName + '\n' + node.nodeType + '\n' + node.nodeValue + '\n' + data.x);
                var parent = node.parentNode;
                var stopGeneration = Jenshi.directiveFunctions[directive](node, attr_value, data);
                if (stopGeneration) { return; }
                if (node.parentNode != parent) { return; }

                //if (control == 'return') { return; }
                //if (control == 'break') { break; }
            }
        }

        // Now we re-purpose attr_name
        for (i = 0; i < node.attributes.length; i++) {
            attr_name = node.attributes[i].nodeName;
            attr_value = node.getAttribute(attr_name);
            //alert(attr_name + ' ' + attr_value)

            if (attr_value) {
                node.setAttribute(attr_name, Jenshi._generate_text(node.getAttribute(attr_name), data));
            }
        }

        // We do it like this since generation will change node.childNodes
        var node_list = []
        for (i in node.childNodes) {
            node_list[node_list.length] = node.childNodes[i];
        }

        for (i in node_list) {
            Jenshi._generate_node(node_list[i], data);
        }
    }
};

Jenshi._generate_text = function(t, data) {
    return t.replace(/(\$\{[^{}]\})|(\$\$)/g, function(s) {
                if (s == '$$') { return '$'; }
                s = s.replace(/^\$\{/, '').replace(/\}$/, '');
                //alertdump(data);
                //with (data) alert("eval('" + s + "'): " + eval(s));
                with (data) return '' + eval(s);
            });
}


// Directives start here
// for
Jenshi.directiveFunctions['py:for'] = function(node, directive_code, data) {
    var var_str = directive_code.replace(/^(var )?([^ ])+ in (.*)$/g, '$2');
    var data_str = directive_code.replace(/^(var )?([^ ])+ in (.*)$/g, '$3');

    var _for = function (i) {
        // This will pollute data; not sure if that's right or not.
        //alert ('setting data[' + var_str + '] = ' + i + ' ' + data_str);
        data[var_str] = i
        //var loop_node = Jenshi.generate(node, data);
        var loop_node = node.cloneNode(true);
        node.parentNode.insertBefore(loop_node, node);
        Jenshi._generate_node(loop_node, data);
    };

    with (data) eval('for (var ' + var_str + ' in ' + data_str + ') { _for(' + var_str + '); }');

    node.parentNode.removeChild(node);

    // We return false becuase *this* node is done; any further processing
    // happened on the loop nodes.
    //return true;
};

// if
Jenshi.directiveFunctions['py:if'] = function(node, directive_code, data) {
    with (data) var test = eval(directive_code);

    if (!test) {
        node.parentNode.removeChild(node);
    }

    //alert ('py:if false x:' + data.x + '\n' + directive_code)

    //return true;
};

// attrs
Jenshi.directiveFunctions['py:attrs'] = function(node, directive_code, data) {
    with (data) var attrs = eval(directive_code);

    for (attr_name in attrs) {
        node.setAttribute(attr_name, attrs[attr_name]);
    }
};

// with
Jenshi.directiveFunctions['py:with'] = function(node, directive_code, data) {
    with (data) var vars = eval(directive_code);

    alertdump(data);
};

// replace
Jenshi.directiveFunctions['py:replace'] = function(node, directive_code, data) {
    Jenshi.directiveFunctions['py:content'](node, directive_code, data)
    node.setAttribute('py:strip', '')
};

// content
Jenshi.directiveFunctions['py:content'] = function(node, directive_code, data) {
    with (data) var content = eval(directive_code);

    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }

    // FIXME: may need to handle typeof content == 'string' with a special case?
    node.appendChild(content);
};

// strip
Jenshi.directiveFunctions['py:strip'] = function(node, directive_code, data) {
    with (data) var test = eval(directive_code || 'true');

    if (test && node.parentNode) {
        alert(node.parentNode.insertBefore)

        for (i in node.childNodes) {
            var child = node.childNodes[i]; //.cloneNode(true);
            node.parentNode.insertBefore(child, node);
            Jenshi._generate_node(child, data);
        }

        node.parentNode.removeChild(node);
    }

    //return true;
};
// Directives end here

function alertdump(obj) {
    var s = '{';
    var x = '';
    for (i in obj) {
        s += x + i + ':' + obj[i];
        x = ', ';
    }
    alert(s + '}');
}

test_xml = '<?xml version="1.0" encoding="iso-8859-1"?>\
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\
<html xmlns="http://www.w3.org/1999/xhtml"\
      xmlns:xi="http://www.w3.org/2001/XInclude"\
      xmlns:py="http://genshi.edgewall.org/"\
      py:strip="false"\
    >\
    <py:with vars="a = [3, 4, 5, 6]; b=1.9">\
        <div py:for="var x in a" py:if="x > 3" class="${x}">${x}</div>\
    </py:with>\
</html>'

