
/**
 * @imports
 */
import Observer from '@webqit/observer';
import _isArray from '@webqit/util/js/isArray.js';
import _isObject from '@webqit/util/js/isObject.js';
import _isNumeric from '@webqit/util/js/isNumeric.js';
import _arrFirst from '@webqit/util/arr/first.js';
import _arrLast from '@webqit/util/arr/last.js';
import _arrRand from '@webqit/util/arr/rand.js';
import _following from '@webqit/util/arr/following.js';
import _preceding from '@webqit/util/arr/preceding.js';
import _between from '@webqit/util/arr/between.js';
import _min from '@webqit/util/arr/min.js';
import _max from '@webqit/util/arr/max.js';
import _mid from '@webqit/util/arr/mid.js';
import _intersect from '@webqit/util/arr/intersect.js';
import _difference from '@webqit/util/arr/difference.js';

/**
 * ---------------------------
 * The Collection class
 * ---------------------------
 */
			
export default class Collection {

	/**
	 * Instantiates a new collection.
	 *
	 * @param array				items
	 * @param object			params
	 *
	 * @return void
	 */
	constructor(items = [], params = {}) {
		if (!_isArray(items)) {
			throw new Error('"items" must be an array.');
		}
		if (!_isObject(params)) {
			throw new Error('"params" must be an object.');
		}
		if (params.itemStates && !_isArray(params.itemStates)) {
			throw new Error('"params.itemStates" must be an array.');
		}
		Observer.set(this, 'items', []);
		Observer.set(this, 'state', {});
		Observer.set(this, 'now', {});
		Observer.set(this, 'prev', {});
		this.params = params;
		// ----------------
		// Adder/Remover
		// ----------------
		const stateAdd = (name, key) => {
			if (this.params.itemStates && !this.params.itemStates.includes(name)) {
				return;
			}
			if (!this.state[name]) {
				var _array = new _Array();
				// The "_source" object should not be auto observed
				Object.defineProperty(_array, '_source', {value: this.items, enumerable: false});
				Observer.set(this.state, name, _array);
			}
			if (!this.state[name].includes(key)) {
				if (this._beforeSetState) {
					this._beforeSetState(name, key);
				}
				Observer.proxy(this.state[name]).push(key);
				Observer.set(this.now, name, key);
				if (this._afterSetState) {
					this._afterSetState(name, key);
				}
			}
		};
		const stateRemove = (name, key) => {
			if ((this.state[name] || []).includes(key)) {
				if (this._beforeUnsetState) {
					this._beforeUnsetState(name, key);
				}
				var index = this.state[name].indexOf(key);
				Observer.proxy(this.state[name]).splice(index, 1);
				Observer.set(this.prev, name, key);
				if (this._afterUnsetState) {
					this._afterUnsetState(name, key);
				}
			}
		};
		// ----------------
		// Observe all item entry/exit
		// ----------------
		Observer.intercept(this.items, ['set', 'deleteProperty'], (e, recieved, next) => {
			if (e.name === 'length') {
				return next();
			}
			if (e.type === 'set') {
				
				if (!_isNumeric(e.name)) {
					throw new Error('Named items cannot be set on a collection.');
				}
				if (!_isObject(e.value)) {
					throw new Error('Only items of type object are allowed in a collection.');
				}

				// -------------
				// Unpublish inactive states BEFORE/AFTER active states
				// -------------

				var activesStates = [], inactiveStates = [];
				Object.keys(e.value).forEach(state => {
					if (!this.params.boolishStateTest || e.value[state]) {
						// Only now can we...
						activesStates.push(state);
					}
				});
				if (e.isUpdate) {
					// -------------------
					// Something like this.items.unshift() can scatter indexes,
					// or a certain item can just be updated in-place
					// Update state indexes
					inactiveStates = _difference(Object.keys(e.oldValue), activesStates);
				}

				// -------------------
				
				if (this.params.onBadState !== 'clear_last') {
					inactiveStates.forEach(state => {
						stateRemove(state, e.name);
					});
				}
				activesStates.forEach(state => {
					stateAdd(state, e.name);
				});
				if (this.params.onBadState === 'clear_last') {
					inactiveStates.forEach(state => {
						stateRemove(state, e.name);
					});
				}

				// -------------------
				// Start watching new entry
				// -------------------

				Observer.intercept(e.value, ['set', 'deleteProperty'], (e2, recieved, next) => {
					var shouldAdd = this.params.boolishStateTest ? e2.value : e2.type === 'set';
					var shouldRemove = this.params.boolishStateTest ? !e2.value : e2.type === 'deleteProperty';
					if (shouldAdd) {
						stateAdd(e2.name, e.name);
					} else if (shouldRemove) {
						stateRemove(e2.name, e.name);
					}
					return next();
				}, {
					unique: 'replace'/* the current index is unique to this binding */,
					tags: [this, 'state-change-interception'],
				});
				if (e.isUpdate) {
					// -------------------
					// Only unset if the item was discarded.
					// this.items.unshift() would otherwise have relocated it.
					// -------------------
					if (!this.items.includes(e.oldValue)) {
						Observer.unintercept(e.oldValue, ['set', 'deleteProperty'], null, {tags: [this, 'state-change-interception']});
					}
				}

			} else if (e.type === 'deleteProperty') {
				// -------------------
				Observer.unintercept(e.oldValue, ['set', 'deleteProperty'], null, {tags: [this, 'state-change-interception']});
				// -------------------
				Object.keys(e.oldValue || {}).forEach(state => {
					stateRemove(state, e.name);
				});
			}
			return next();
		});
		// Fill collection
		this.push(...items);
	}

	/**
	 * -----------
	 * Setters
	 * -----------
	 */
	
	/**
	 * Returns all items in the collection in an observed proxy.
	 *
	 * @return Proxy
	 */
	proxy() {
		return Observer.proxy(this.items);
	}

	/**
	 * Adds items to the collections.
	 *
	 * @param array ...items
	 *
	 * @return void
	 */
	push(...items) {
		Observer.proxy(this.items).push(...items);
	}

	/**
	 * Adds items to the collections.
	 *
	 * @param array ...items
	 *
	 * @return void
	 */
	unshift(...items) {
		Observer.proxy(this.items).unshift(...items);
	}

	/**
	 * Removes items from the collections.
	 *
	 * @param array ...items
	 *
	 * @return void
	 */
	remove(...items) {
		items.reduce((buffer, item, i) => {
			var key = this.indexOf(item);
			if (key === -1) {
				return buffer;
			}
			// 
			if (buffer.length) {
				// Keep building buffer
				if (parseInt(_arrLast(buffer)) + 1 === key) {
					return buffer.concat(key);
				}
			} else if (i < items.length - 1) {
				// We can still build
				return [key];
			}
			// Empty buffer
			Observer.proxy(this.items).splice(buffer[0], buffer.length);
			return [];
		}, []);
	}

	/**
	 * -----------
	 * Getters
	 * -----------
	 */
	
	/**
	 * Returns the first item in the collections.
	 *
	 * @return any
	 */
	first() {
		return _arrFirst(this.items);
	}
	
	/**
	 * Returns the last item in the collections.
	 *
	 * @return any
	 */
	last() {
		return _arrLast(this.items);
	}
	
	/**
	 * Returns a random item from the collections.
	 *
	 * @return any
	 */
	rand() {
		return _arrRand(this.items);
	}

	/**
	 * Returns the middle item(s) in the collections.
	 *
	 * @return any
	 */
	mid(...args) {
		return _mid(this.items, ...args);
	}

	/**
	 * Returns the item(s) preceding the given item(s).
	 *
	 * @param array	...args
	 *
	 * @return array|any
	 */
	preceding(...args) {
		return _preceding(this.items, ...args);
	}
	
	/**
	 * Returns the item(s) following the given item(s).
	 *
	 * @param array	...args
	 *
	 * @return array|any
	 */
	following(...args) {
		return _following(this.items, ...args);
	}
	
	/**
	 * Returns the item(s) between the given item(s).
	 *
	 * @param array	...args
	 *
	 * @return array|any
	 */
	between(...args) {
		return _between(this.items, ...args);
	}
};

/**
 * Sub Array Type
 */
class _Array extends Array {
	first() { return this._source[_arrFirst(this)]; }
	last() { return this._source[_arrLast(this)]; }
	rand() { return this._source[_arrRand(this)]; }
	min() { return this._source[_min(this)]; }
	max() { return this._source[_max(this)]; }
	mid(...args) {
		var mid = _mid(this, ...args);
		return _isArray(mid) 
			? mid.map(i => this._source[i])
			: this._source[mid];
	}
	preceding(...args) {
		var preceding = _preceding(this, ...args);
		return _isArray(preceding) 
			? preceding.map(i => this._source[i])
			: this._source[preceding];
	}
	following(...args) {
		var following = _following(this, ...args);
		return _isArray(following) 
			? following.map(i => this._source[i])
			: this._source[following];
	}
	between(...args) {
		var between = _between(this, ...args);
		return _isArray(between) 
			? between.map(i => this._source[i])
			: this._source[between];
	}
	intersect(...args) { return _intersect(this, ...args).map(i => this._source[i]); }
	difference(...args) { return _difference(this, ...args).map(i => this._source[i]); }
};