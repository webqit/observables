
/**
 * @imports
 */
import Observer from '@webqit/observer';
import Collection from './Collection.js';

/**
 * ---------------------------
 * The List class
 * ---------------------------
 */
			
export default class List extends Collection {

    /**
     * Intercepts stateSet() operation.
     * Uses this medium to apply defined rules.
     * 
     * @param String stateName 
     * @param String key 
     * 
     * @return void
     */
    _beforeSetState(stateName, key) {
        // Multiplicity
        if ((this.params.multiplicity || {})[stateName] && this.state[stateName].length >= this.params.multiplicity[stateName]) {
            var item = this.items[this.state[stateName][0]];
            if (this.params.boolishStateTest) {
                Observer.set(item, stateName, false);
            } else {
                Observer.del(item, stateName);
            }
        }
    }
};