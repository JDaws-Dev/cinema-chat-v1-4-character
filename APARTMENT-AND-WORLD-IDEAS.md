# Apartment And World Ideas

This note captures the new direction discussed after the current VHS/state work.

## Apartment Direction

- Add a player apartment above the laundromat, not above Pizza Palace.
- Keep the title/load state focused on the store exterior so the game still opens by inviting the player into Friday Night Video.
- Use the apartment as the after-hours / between-nights space rather than the default spawn.
- Move the collectible/trophy display out of the store and into the apartment so rewards feel personal instead of commercial.

## Apartment Purpose

- Home base after checkout.
- Place to watch rentals.
- Place to rewind tapes.
- Place to display unlocked props/trophies.
- Place to bridge nights without losing the “storefront invitation” tone of the main menu/start state.

## Rewinding

- Rewinding should be a real mechanic, not just flavor text.
- Rented tapes should track `rewound` state.
- A TV/VCR or dedicated rewinder in the apartment should let the player rewind tapes.
- Returning unrewound tapes should have a mild penalty or reduced reward.
- Returning rewound tapes should avoid the penalty and potentially give a small bonus.

## Rental Flow Vision

- Browse and rent in the store.
- Checkout transitions to the apartment.
- Apartment holds the rented tapes and the rewinding/watch loop.
- On the next return trip, the player brings those rentals back to the store.
- The return bin and recent-returns pile become part of that loop.

## World Layout

- Add side streets on either side of the strip mall.
- Left side street should sit beyond Pizza Palace.
- Right side street should sit beyond the laundromat.
- Those side streets mark the edge of the world and make the strip mall feel bounded and intentional.

## Tone / Feel

- Keep the store as the public fantasy space.
- Make the apartment the cozy private space.
- The apartment should feel nostalgic, clean, and lived-in without feeling gross or shabby.
- The view/state flow should preserve the current storefront hook while adding a stronger “movie night at home” payoff.

## Recommended Implementation Order

1. Finish the current canonical VHS slot-state work first.
2. Add persistent rented-tape state and rewind state.
3. Add apartment scene above the laundromat as a secondary gameplay space.
4. Move trophy display into the apartment.
5. Add checkout -> apartment transition.
6. Add next-day / return-trip loop.
7. Add side streets and extra exterior edge dressing.
