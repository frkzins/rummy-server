
export class CreateTableDto {
    minPlayers: Number;
    maxPlayers: Number;
    playerName: string;
}

export class AddPlayerDto {
    name: string;
}

export class Card {
    suit: string;
    value: Number;
}

export class Meld {
    cards: Array<Card>;
}