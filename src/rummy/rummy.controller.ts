import { Controller, Get, Post, Body, Param, Logger, Put, Res, HttpStatus, Delete } from '@nestjs/common';
import { RummyService } from './rummy.service';
import { CreateTableDto, AddPlayerDto, Card, Meld } from './rummy.dto';

@Controller('rummy')
export class RummyController {
    constructor(private rummyService: RummyService) { }

    @Get('tables')
    async listTables(): Promise<string[]> {
        return this.rummyService.listTables();
    }
    
    @Post('table')
    async createTable(@Body() createTableDto: CreateTableDto): Promise<any>{
        const tableId = this.rummyService.createTable(
            +createTableDto.minPlayers,
            +createTableDto.maxPlayers,
            createTableDto.playerName
        );
        Logger.log(`createTable result: ${tableId}`);
        return { id: tableId };
    }

    @Get(':tableId/players')
    async listPlayers(@Param('tableId') tableId: string): Promise<any> {
        const players = this.rummyService.getPlayers(tableId);
        Logger.log(`listPlayers result: ${JSON.stringify(players)}`);
        return players;
    }

    @Post(':tableId/addPlayer')
    async addPlayer(@Param('tableId') tableId: string, @Body() addPlayerDto: AddPlayerDto): Promise<string[]> {
        const result = this.rummyService.addPlayer(tableId, addPlayerDto.name);
        Logger.log(`addPlayer result: ${JSON.stringify(result)}`);
        return this.rummyService.getPlayers(tableId);
    }

    @Delete(':tableId/deletePlayer/:playerName')
    async deletePlayer(@Param('tableId') tableId: string, @Param('playerName') playerName: string): Promise<string[]> {
        const result = this.rummyService.removePlayer(tableId, playerName);
        Logger.log(`deletePlayer result: ${JSON.stringify(result)}`);
        return this.rummyService.getPlayers(tableId);
    }

    @Get(':tableId/deal')
    async deal(@Param('tableId') tableId: string): Promise<any> {
        const result = this.rummyService.deal(tableId);
        Logger.log(`Deal result: ${result}`);
        return result;
    }

    @Get(':tableId/nextTurn')
    async nextTurn(@Param('tableId') tableId: string): Promise<any> {
        const result = this.rummyService.nextTurn(tableId);
        Logger.log(`nextTurn result: ${result}`);
        return result;
    }

    @Get(':tableId/drawFromStock')
    async drawFromStock(@Param('tableId') tableId: string): Promise<any> {
        const result = this.rummyService.drawFromStock(tableId);
        Logger.log(`drawFromStock result: ${result}`);
        return result;
    }

    @Get(':tableId/drawFromDiscard')
    async drawFromDiscard(@Param('tableId') tableId: string): Promise<any> {
        const result = this.rummyService.drawFromDiscard(tableId);
        Logger.log(`drawFromDiscard result: ${result}`);
        return result;
    }

    @Post(':tableId/discard')
    async discard(@Param('tableId') tableId: string, @Body() card: Card): Promise<any> {
        const result = this.rummyService.discard(tableId, card);
        Logger.log(`Discard result: ${JSON.stringify(result)}`);
        return result;
    }

    @Post(':tableId/playMeld')
    async playMeld(@Param('tableId') tableId: string, @Body() meld: Meld): Promise<any> {
        const result = this.rummyService.playMeld(tableId, meld);
        Logger.log(`playMeld result: ${JSON.stringify(result)}`);
        return result;
    }

    @Get(':tableId/score')
    async score(@Param('tableId') tableId: string): Promise<any> {
        const result = this.rummyService.score(tableId);
        Logger.log(`score result: ${result}`);
        return result;
    }
}