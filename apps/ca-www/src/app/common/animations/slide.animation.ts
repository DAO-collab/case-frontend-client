import {
  AnimationTriggerMetadata,
  trigger,
  transition,
  style,
  animate,
  group,
  query,
  animateChild
} from '@angular/animations';

/**
 * Slide animation.
 */
export const slideAnimation: AnimationTriggerMetadata = trigger('slideAnimation', [
  transition(
    ':increment',
    group([
      query(':enter', [
        style({ transform: 'translateX(100%)', position: 'absolute' }),
        animate('0.5s ease', style({ transform: 'translateX(0%)' })),
        animateChild()
      ]),
      query(':leave', [animate('0.5s ease', style({ transform: 'translateX(-100%)' })), animateChild()])
    ])
  ),
  transition(
    ':decrement',
    group([
      query(':enter', [
        style({ transform: 'translateX(-100%)', position: 'absolute' }),
        animate('0.5s ease', style({ transform: 'translateX(0%)' })),
        animateChild()
      ]),
      query(':leave', [animate('0.5s ease', style({ transform: 'translateX(100%)' })), animateChild()])
    ])
  )
]);
