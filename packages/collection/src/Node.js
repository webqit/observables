
/**
 * @imports
 */
import Observer from '@webqit/observer';
import Collection from './Collection.js';

/**
 * ---------------------------
 * The Node class
 * ---------------------------
 */
			
export default class Node {

    /**
     * Constructs a new Node instance.
     * 
     * @param Object props
     * @param Object params
     * 
     * @return this
     */
    constructor(props = {}, params = {}) {

        var propagatedSates = {};
        const subtreeKey = params.subtreeKey || 'collection';
        Observer.intercept(this, ['set', 'del'], (e, recieved, next) => {

            if (e.name === subtreeKey) {

                if (e.type === 'set') {
                    if (!(e.value instanceof Collection)) {
                        throw new Error('Subtrees must be instances of Collection.');
                    }

                    var newStates = {};
                    Object.keys(e.value.state).forEach(state => {
                        newStates[state] = e.value.state[state].length / e.value.items.length;
                        // This state should be unset on sutree removal
                        propagatedSates[state] = true;
                    });
                    if (e.isUpdate) {
                        Object.keys(e.oldValue.state).forEach(state => {
                            if (!(state in newStates)) {
                                newStates[state] = 0;
                            }
                        });
                    }
                    Observer.set(this, newStates);

                } else if (e.type === 'del') {

                    var oldStates = {};
                    Object.keys(e.oldValue.state).forEach(state => {
                        if (propagatedSates[state] && e.oldValue.state[state].length > 0) {
                            oldStates[state] = 0;
                        }
                    });
                    Observer.set(this, oldStates);

                }

            } else {

                // This state should NOT be unset on sutree removal
                propagatedSates[e.name] = false;

            }

            return next();

        }, {tags: [this, 'self-interception']});

        // ------------------

        Observer.observe(this, [subtreeKey, 'state', '', 'length'], delta => {
            var [ , , stateName ] = delta.path;
            if (delta.value > 0) {
                Observer.set(this, stateName, delta.value / this[subtreeKey].items.length);
                propagatedSates[stateName] = true;
            } else if (propagatedSates[stateName]) {
                Observer.set(this, stateName, 0);
            }
        });

        Observer.set(this, props);
    }
};