import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { INestApplication, Logger } from '@nestjs/common';
import { RummyModule } from '../src/rummy/rummy.module';

describe('E2E Test', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [RummyModule],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('AppController', () => {
    it(`GET /`, () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect({ 'status': 'ok' });
    });
  });


  describe('RummyController', () => {
    it(`LIST /rummy/tables`, () => {
      return request(app.getHttpServer())
        .get('/rummy/tables')
        .expect(200)
        .expect([]);
    });

    it(`Test Game - 3 Players`, async () => {
      const httpServer = app.getHttpServer();

      // Create Table with P1
      let response = await request(httpServer)
        .post('/rummy/table')
        .send({minPlayers: 2, maxPlayers: 8, playerName: 'P1' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');

      const tableId = response.body.id;

      // List players
      response = await request(httpServer)
        .get(`/rummy/${tableId}/players`)
        .set('Accept', 'application/json');

      expect(response.body.players.length).toEqual(1);
      expect(response.body.players[0]).toEqual('P1');
      expect(response.body.enoughPlayersToStart).toEqual(false);

      // Add player with P2
      response = await request(httpServer)
        .post(`/rummy/${tableId}/addPlayer`)
        .send({ name: 'P2' })
        .set('Accept', 'application/json');

      expect(response.body.players.length).toEqual(2);
      expect(response.body.players[0]).toEqual('P1');
      expect(response.body.players[1]).toEqual('P2');
      expect(response.body.enoughPlayersToStart).toEqual(true);

      // Add player with P3
      response = await request(httpServer)
        .post(`/rummy/${tableId}/addPlayer`)
        .send({ name: 'P3' })
        .set('Accept', 'application/json');

      expect(response.body.players.length).toEqual(3);
      expect(response.body.players[0]).toEqual('P1');
      expect(response.body.players[1]).toEqual('P2');
      expect(response.body.players[2]).toEqual('P3');
      expect(response.body.enoughPlayersToStart).toEqual(true);

      const players = response.body.players;

      // List players
      response = await request(httpServer)
        .get(`/rummy/${tableId}/players`)
        .set('Accept', 'application/json');

      expect(response.body.players.length).toEqual(3);
      expect(response.body.players[0]).toEqual(players[0]);
      expect(response.body.players[1]).toEqual(players[1]);
      expect(response.body.players[2]).toEqual(players[2]);
      expect(response.body.enoughPlayersToStart).toEqual(true);

      //Deal
      response = await request(httpServer)
        .get(`/rummy/${tableId}/deal`)
        .set('Accept', 'application/json');

      //Next Turn
      response = await request(httpServer)
        .get(`/rummy/${tableId}/nextTurn`)
        .set('Accept', 'application/json');

      //drawFromStock
      response = await request(httpServer)
        .get(`/rummy/${tableId}/drawFromStock`)
        .set('Accept', 'application/json');

      //discard
      response = await request(httpServer)
        .post(`/rummy/${tableId}/discard`)
        .send({"suit": "diamonds", "value": 4 })
        .set('Accept', 'application/json');

      //Next Turn
      response = await request(httpServer)
        .get(`/rummy/${tableId}/nextTurn`)
        .set('Accept', 'application/json');

      //drawFromDiscard
      response = await request(httpServer)
        .get(`/rummy/${tableId}/drawFromDiscard`)
        .set('Accept', 'application/json');

      //discard
      response = await request(httpServer)
        .post(`/rummy/${tableId}/discard`)
        .send({"suit": "diamonds", "value": 7 })
        .set('Accept', 'application/json');

      //playMeld
      response = await request(httpServer)
        .post(`/rummy/${tableId}/playMeld`)
        .send([{"suit": "diamonds", "value": 6 },
               {"suit": "diamonds", "value": 7 },
               {"suit": "diamonds", "value": 8 } ])
        .set('Accept', 'application/json');

      //Score
      response = await request(httpServer)
        .get(`/rummy/${tableId}/score`)
        .set('Accept', 'application/json');  
    });
  });

  afterAll(async () => {
    await app.close();
  });

});
