import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { ConvertHourStringToMinutes } from './utils/convert-hour-string-to-minutes';
import { ConvertMinutesHourString } from './utils/convert-minutes-hour-string';

const app = express();

const prisma = new PrismaClient({
  log: ['query']
});

app.use(express.json());
app.use(cors());

app.get('/games', async (request, response) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true
        }
      }
    }
  })

  return response.json(games);
});

app.get('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id;

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      hourStart: true,
      hourEnd: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      weekDays: true,
    }, where: {
      gameId
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return response.json(ads.map(ad => {
    return {
      ...ad,
      weekDays: ad.weekDays.split(','),
      hourStart: ConvertMinutesHourString(ad.hourStart),
      hourEnd: ConvertMinutesHourString(ad.hourEnd)

    }
  }))
});

app.post('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id;

  const {
    hourEnd,
    hourStart,
    name,
    useVoiceChannel,
    yearsPlaying,
    weekDays,
    discord
  } = request.body;

  const ad = await prisma.ad.create({
    data: {
      gameId,
      name,
      yearsPlaying,
      discord,
      weekDays: weekDays.join(','),
      hourStart: ConvertHourStringToMinutes(hourStart),
      hourEnd: ConvertHourStringToMinutes(hourEnd),
      useVoiceChannel
    }
  })

  return response.json(ad);
});

app.get('/ads/:id/discord', async (request, response) => {
  const adId = request.params.id;

  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true
    },
    where: {
      id: adId
    }
  });

  return response.json({
    discord: ad.discord
  })
});

app.listen(3333, () => {
  console.log('Server is running! 🚀');
});