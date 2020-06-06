import {fromJS, List, Map} from 'immutable';
import { Injectable, Logger } from '@nestjs/common';
import * as Table from './core';
import * as _ from 'lodash';
import { CreateTableDto, AddPlayerDto, Card, Meld } from './rummy.dto';

@Injectable()
export class RummyService {
    private tables = [];

    createTable(minPlayers: Number, maxPlayers: Number, playerName: string) {
        var table: any = new (Table.Table as any)(
            minPlayers,
            maxPlayers,
        );
        const val = Math.floor(1000 + Math.random() * 9000);
        const id: string = `${val}`;
        Logger.log(`Creating Room with id: ${id}`)
        this.tables.push({
            id,
            creator: playerName,
            handle: table,
            state : {}
        });
        table.AddPlayer(playerName);
        return id;
    }

    listTables() {
        return _.map(this.tables, t => t.id);
    }

    getTable(tableId: string) {
        return _.find(this.tables, t => { return (t.id === tableId) });
    }

    getPlayers(tableId: string): any {
        const table = this.getTable(tableId);
        const allPlayers = _.flatten(_.concat(
            _.map(table.handle.players, p => p.playerName),
            _.map(table.handle.playersToAdd, p => p.playerName),
            _.map(table.handle.playersToRemove, p => p.playerName)));

        if (!_.isNil(table)) {
            return {
                'players': allPlayers,
                'enoughPlayersToStart': (allPlayers.length >= table.handle.minPlayers) && (allPlayers.length <= table.handle.maxPlayers)
            };
        }
        return null;
    }

    addPlayer(tableId: string, playerName: string): boolean {
        const table = this.getTable(tableId);
        if (!_.isNil(table)) {
            return table.handle.AddPlayer(playerName);
        }
        return false;
    }

    removePlayer(tableId: string, playerName: string): boolean {
        const table = this.getTable(tableId);
        if (!_.isNil(table)) {
            table.handle.RemovePlayer(playerName);
        }
        return false;
    }

    deal(tableId: string): any {
        var table = this.getTable(tableId);
        if (!_.isNil(table)) {
            var state = fromJS({
                deck : Table.createDeck(),
                players: this.getPlayers(tableId)['players']
              });
            table.state = Table.nextTurn(Table.deal(state));
            return table.state;
        }
        return null;
    }

    nextTurn(tableId: string): any {
        var table = this.getTable(tableId);
        if (!_.isNil(table)) {
            table.state  = Table.nextTurn(table.state);
            return table.state;
        }
        return null;
    }

    drawFromStock(tableId: string): any {
        var table = this.getTable(tableId);
        if (!_.isNil(table)) {
            table.state  = Table.drawFromStock(table.state, table.state.get('currentPlayer'));
            return table.state;
        }
        return null;
    }

    drawFromDiscard(tableId: string): any {
        var table = this.getTable(tableId);
        if (!_.isNil(table)) {
            table.state  = Table.drawFromDiscard(table.state);
            return table.state;
        }
        return null;
    }
    
    discard(tableId: string, card: any ): any {
        var table = this.getTable(tableId);
        if (!_.isNil(table)) {
            table.state  = Table.nextTurn(Table.discard(table.state, Map(card)));
            return table.state;
        }
        return null;
    }

    playMeld(tableId: string, meldCards: any ): any {
        var table = this.getTable(tableId);
        if (!_.isNil(table)) {
            var meld = meldCards.map( v => Map(v));
            table.state  = Table.playMeld(table.state, List(meld));
            return table.state;
        }
        return null;
    }

    score(tableId: string): any {
        var table = this.getTable(tableId);
        if (!_.isNil(table)) {
            table.state  = Table.score(table.state);
            return table.state;
        }
        return null;
    }

}