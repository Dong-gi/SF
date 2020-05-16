if (!String.prototype.hashCode) {
    String.prototype.hashCode = function () {
        let hash = 0, i, chr;
        if (this.length === 0) return hash;
        for (i = 0; i < this.length; i++) {
            chr = this.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; /* 32bit */
        }
        return hash;
    };
}
String.prototype.asSF = function () {
    let temp = document.createElement('template');
    temp.insertAdjacentHTML('afterbegin', this);
    switch (temp.childElementCount) {
        case 0: return null;
        case 1: return SF.asSF(temp.firstChild);
        default: return SF.asSFarr(temp.children);
    }
};
class SF {
    static build(root) {
        if (!root)
            root = document.querySelector('[sf]');
        root.__isRoot = true;
        let app = this.asSF(root);
        app.newTemplate = function (templateName, htmlMaker) {
            let template = ((htmlMaker) => new Proxy(SF.__placeholder, {
                apply: function (target, thisArg, argumentsList) {
                    let node = htmlMaker().asSF();
                    if (argumentsList.length == 1)
                        argumentsList[0](node);
                    else if (argumentsList.length > 1)
                        argumentsList[0](node, ...argumentsList.slice(1));
                    return node;
                }
            }))(htmlMaker);
            SF.__templates[templateName] = template;
            return template;
        }
        app.asTemplate = function (templateName, element) {
            return this.newTemplate(templateName, (e => () => e.outerHTML)(element));
        }
        return app;
    }
    static asSF(element) {
        if (!element) return element;
        if (element.__key && SF.__map[element.__key])
            return SF.__map[element.__key];
        else
            element.__key = `${new Date().getTime()}__${Math.random()}`.replace('.', '').hashCode();
        SF.__map[element.__key] = new Proxy(element, {
            set(o, prop, value) {
                if (o.hasAttribute(prop))
                    return o.setAttribute(prop, value);
                if (o.hasOwnProperty(prop))
                    return o[prop] = value;
                return o[prop] = value;
            },
            get(o, prop) {
                switch (prop) {
                    case '$':
                        return o;
                    case 'after': case 'before': case 'firstChild': case 'lastChild': case 'firstElementChild': case 'lastElementChild': case 'parentElement': case 'parentNode':
                        return SF.asSF(o[prop]);
                    case 'children': case 'childNodes':
                        return SF.asSFarr(o[prop]);
                    case 'text':
                        return SF.asSFarr(Array.from(o.childNodes).filter(x => x.nodeName == '#text'))
                }
                if (prop.startsWith('$'))
                    return SF.asSFarr(o.querySelectorAll(prop.substr(1)));
                if (o.hasAttribute(prop))
                    return o.getAttribute(prop);
                if (o.hasOwnProperty(prop))
                    return o[prop];
                if (o[prop] != undefined && o[prop] != null)
                    return o[prop];
                if (o.__isRoot && document.getElementById(prop))
                    return SF.asSF(document.getElementById(prop));
                let children = Array.from(o.childNodes).filter(x => x.nodeName == prop.toUpperCase());
                if (children.length > 0)
                    return SF.asSFarr(children);
                return SF.asSFarr(o.querySelectorAll(prop));
            }
        });
        return SF.__map[element.__key];
    }
    static asSFarr(elements) {
        let arr = [];
        if (!elements) return arr;
        for (let e of elements) {
            arr.push(SF.asSF(e));
        }
        return arr.length == 1? arr[0] : arr;
    }
}
SF.__map = SF.__map || new Map();
SF.__templates = SF.__templates || new Map();
SF.__placeholder = SF.__placeholder || function () { };