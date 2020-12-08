
/**
 * @imports
 */
import matchRect from '@webqit/browser-pie/src/apis/matchRect.js';
import Observer from '@webqit/observer';

/**
 * ---------------------------
 * The Observable media query
 * ---------------------------
 *
 * This is an Observable wrapper onver the window.matchMedia API,
 * and PlayUI's matchRect() API.
 */
			
export function matchMedia(query, target = null) {
    var mediaMatchResult, observable = {matches: mediaMatchResult.matches};
    if (target instanceof window.Element) {
        mediaMatchResult = matchRect(target, query);
    } else if (!target || target.matchMedia) {
        mediaMatchResult = window.matchMedia(query);
    } else {
        throw new Error('Target must be window or an element.');
    }
    mediaMatchResult.addEventListener('change', e => {
        Observer.set(observable, 'matches', e.matches);
    });
    return observable;
};