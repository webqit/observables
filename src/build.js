
/**
 * @imports
 */
import _merge from '@webqit/util/obj/merge.js';
import _isObject from '@webqit/util/js/isObject.js';

/**
 * #var Object
 */
const Observables = {};
export {
    Observables as default,
};

/**
 * The collection of Observables
 *
 * @param String|Object name
 * @param Object        Observable
 * 
 * #return Object
 */
export function build(name, Observable = null) {
    if (_isObject(name)) {
        _merge(Observables, name);
    } else {
        Observables[name] = Observable;
    }
    return Observables;
};
