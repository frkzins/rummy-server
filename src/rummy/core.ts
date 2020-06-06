const { fromJS } = require('immutable');
const { Map } = require('immutable');
const { List } = require('immutable');
const { Stack } = require('immutable');
var events = require('events');

export function Table(minPlayers, maxPlayers) {
  this.minPlayers = minPlayers;
  this.maxPlayers = maxPlayers;
  this.players = [];
  this.dealer = 0; //Track the dealer position between games
  this.playersToRemove = [];
  this.playersToAdd = [];
  this.eventEmitter = new events.EventEmitter();
  this.gameWinners = [];
  this.gameLosers = [];

  //Validate acceptable value ranges.
  var err;
  if (minPlayers < 2) { //require at least two players to start a game.
      err = new Error('Parameter [minPlayers] must be a postive integer of a minimum value of 2.');
  } else if (maxPlayers > 10) { //hard limit of 10 players at a table.
      err = new Error('Parameter [maxPlayers] must be a positive integer less than or equal to 10.');
  } else if (minPlayers > maxPlayers) { //Without this we can never start a game!
      err = new Error('Parameter [minPlayers] must be less than or equal to [maxPlayers].');
  }

  if (err) {
      return err;
  }
}

export function Player(playerName, table) {
  this.playerName = playerName;
  this.folded = false;
  this.table = table; //Circular reference to allow reference back to parent object.
  this.cards = [];
}

Table.prototype.AddPlayer = function (playerName) {
  var player = new Player(playerName, this);
  this.playersToAdd.push(player);
  return true
};

Table.prototype.RemovePlayer = function (playerName) {
  for (var i in this.players) {
      if (this.players[i].playerName === playerName) {
          this.playersToRemove.push(i);
      }
  }
  for (var i in this.playersToAdd) {
      if (this.playersToAdd[i].playerName === playerName) {
          this.playersToAdd.splice(i, 1);
      }
  }
}

export function createDeck() {
  const deck = [];
  const suits = ['diamonds', 'hearts', 'clubs', 'spades'];
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

  suits.forEach((suit) => {
    values.forEach((value) => {
      deck.push({ suit: suit, value: value });
      deck.push({ suit: suit, value: value });
      deck.push({ suit: suit, value: value });
    });
  });
  deck.push({ suit: 'Any', value: 0 });
  deck.push({ suit: 'Any', value: 0 });
  deck.push({ suit: 'Any', value: 0 });

  return deck;
}

export function setDeck(state, deck) {
  return state.set('deck', fromJS(deck));
}

export function shuffle(state) {
  const deck = state.get('deck');
  return state.update('deck', () => deck.sort(() => Math.random()));
}

export function deal(state) {
  const players = state.get('players');

  var hands = Map();
  var deck = state.get('deck');
  //JOKER
  const joker = deck.take(1);
  deck = deck.skip(1);
  if ( joker.get('value')==0 ){
    joker.set('suit', "diamonds");
    joker.set('value', 2);
  }
  //Open Card
  const openCard = deck.take(1);
  deck = deck.skip(1);

  players.forEach((player) => {
    const cards = deck.take(13);
    deck = deck.skip(13);
    hands = hands.set(player, cards);
  });

  state =  state.merge({
    deck: deck,
    hands : hands,
    joker : joker.get(0) 
  });
  return state.update(
    'discardPile',
    Stack(),
    pile => pile.unshift(openCard.get(0))
  );

}

export function drawFromStock(state, player) {
  const stock = state.get('deck');
  const nextState = addToHand(state, player, stock.take(1));

  return nextState.update('deck', deck => deck.skip(1));
}

export function drawFromDiscard(state) {
  const card = state.get('discardPile').take(1);
  const player = state.get('currentPlayer');
  const nextState = state.update(
    'discardPile',
    Stack(),
    pile => pile.shift()
  );

  return addToHand(nextState, player, card);
}

export function playMeld(state, cards) {
  if (isValidMeld(cards, state.get('joker'))) {
    const player = state.get('currentPlayer');
    const meldCards = cards.map((card) => {
      return card.set('owner', player);
    });

    const meld = Map({
      cards: meldCards,
      type: isSet(cards,state.get('joker')) ? 'set' : 'run'
    });
  
    const nextState = removeFromHand(state, player, cards);
   
    return nextState.update(
      'melds',
      List(),
      melds => melds.push(meld)
    );
  }

  return state;
}

export function layoff(state, targetMeld, card) {
  if(isValidLayoff(targetMeld, card,state.get('joker'))) {
    const player = state.get('currentPlayer'),
          newCard = card.set('owner', player),
          meldKey = state.get('melds').findKey((meld) => { return meld.get('cards').equals(targetMeld); });

    const nextState = removeFromHand(state, player, card);

    return nextState.updateIn(
      ['melds', meldKey, 'cards'],
      List(),
      cards => cards.push(newCard)
    );
  }
  
  return state;
}

export function discard(state, card) {
  const player = state.get('currentPlayer');
  const nextState = removeFromHand(state, player, card);

  // if (nextState.getIn(['hands', player]).size === 0) {
  //   return score(state);
  // }

  return nextState.update(
    'discardPile',
    Stack(),
    pile => pile.unshift(card)
  );
}

export function nextTurn(state) {
  if (state.has('currentPlayer')) {
    const players = state.get('players')
    const currentPlayer = state.get('currentPlayer');
    const nextPlayerIndex = players.findIndex(player => player === currentPlayer) + 1;

    if (nextPlayerIndex > (players.size - 1)) {
      return state.set('currentPlayer', players.first());
    } else {
      return state.set('currentPlayer', players.get(nextPlayerIndex));
    }

  } else {
    return state.set('currentPlayer', state.get('players').first());
  }
}

export function score(state) {
  
  var score = Map();
  const hands = state.get('hands');
  var points = 0;

  hands.forEach((hand, player) => {
    hand.forEach((card) => {
      score = score.update(player, 0, points => points + scoreCard(card, state.get('joker')))
    });
  });

  return state.merge({
    score: score,
    winner: getWinner(score)
  })  
}

/****************************************
           Private Methods
*****************************************/

function removeFromHand(state, player, cards) {
  const hand = state.getIn(['hands', player]);
  var flag = 0; 
  var cardExcluded = List();

  const culledHand = hand.filter((cardInHand) => {
    if (List.isList(cards)) {
      if (cards.includes(cardInHand)){
        if (cardExcluded.includes(cardInHand)){
          return true;
        }else{
          cardExcluded = cardExcluded.push(cardInHand);
          return false;
        }   
      }else{
        return true;
      }
    } else {
      if (cards.equals(cardInHand) && flag == 0){
        flag = 1;
        return false;
      }else{
        return true;
      }
    }
  });

  return state.updateIn(
    ['hands', player],
    List(),
    hand => culledHand
  );
}

function addToHand(state, player, cards) {
  return state.updateIn(
    ['hands', player],
    List(),
    hand => hand.concat(cards)
  );
}

function isValidLayoff(meld,card,joker) {
  return isValidMeld(meld.push(card), joker);
}

function isValidMeld(cards, joker) {
  if (cards.size >= 3) {
    const cardsSorted = sortCardsByValue(cards);
    return isSet(cardsSorted, joker) || isRun(cardsSorted, joker);
  }
  return false;
}

function isSet(cards,joker) {

  var cardArr = cards.toArray();

  for (var i = 0; i < cardArr.length; i++){
    if ( isJoker(cardArr[i], joker ) ) {
      cardArr.splice(i,1);
      i--;
    }
  }

  if (cardArr.length <= 1 ){ 
    return true; 
  }

  const allEqual = arr => arr.every( v => v === arr[0] );
  const valueArr = cardArr.map( x => x.get('value'));
  const suitArr = cardArr.map( x => x.get('suit'));

  if ( !allEqual(valueArr) || suitArr.some((val, i) => suitArr.indexOf(val) !== i)) {
    return false;
  }

  return true;
}

function isRun(cards,joker) {

  var cardArr = cards.toArray();
  var jokerCount = 0;

  for (var i = 0; i < cardArr.length; i++){
    if ( isJoker(cardArr[i], joker ) ) {
      cardArr.splice(i,1);
      jokerCount++;
      i--;
    }
  }

  if (cardArr.length <= 1 ){ 
    return true; 
  }

  const allEqual = arr => arr.every( v => v === arr[0] );
  const valueArr = cardArr.map( x => x.get('value'));
  const suitArr = cardArr.map( x => x.get('suit'));

  if ( allEqual(suitArr) && allEqual(suitArr) ){
    return true;
  }
  
  if ( !allEqual(suitArr) ){
    return false;
  }

  if ( cardArr[0].get('value') == 1 && cardArr[1].get('value') !== 2 ){
    cardArr.push(cardArr[0]);
    cardArr.splice(0,1);
  }

  var includedA = false;
  for (var j = 1, diff = 1; j < cardArr.length; j++, diff++) {
    if ( (cardArr[j].get('value') - cardArr[0].get('value')) !== diff ){
      if ( cardArr[j].get('value') !== 1 && !includedA ){
        if ( jokerCount > 0 ){
            jokerCount--;
            j--;
        }else{
          return false;
        }
      }else{
        includedA = true;
      }
    }
  }
  return true;
}

function scoreCard(card,joker) {
  const value = card.get('value');
  if ( !isJoker(card, joker) ) {
    if (value === 1 || value === 11 || value === 12 || value === 13) {
      return 10;
    } else {
      return value;
    }
  }
  return 0;
}

function getWinner(score) {
  return score.keyOf(score.min());
}

function sortCardsByValue(cards) {
  return cards.sortBy((card) => card.get('value'));
}

function isSameSuit(actualSuit, expectedSuit) {
  return actualSuit.get('suit') === expectedSuit;
}

function isSequential(currentCard, previousCard,) {
  return currentCard.get('value') === previousCard.get('value') + 1;
}

function isJoker(card, joker) {
  return ( card.get('value') == joker.get('value') || card.get('value') == 0 );
}
