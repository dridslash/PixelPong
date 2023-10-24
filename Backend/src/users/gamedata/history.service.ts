// import { StatsUncheckedUpdateInput } from '@prisma/client';
import {Injectable} from '@nestjs/common';
import { Type } from '@prisma/client';
import { PrismaService } from 'src/auth/prisma.service';
import { achievementService } from './acheievement.service';






@Injectable()
export class HistoryService {
    constructor(private readonly prisma: PrismaService,
        private readonly achiev: achievementService){
    }

async addMatchHistory(userId:string){
    let stats = null;
    const find = await this.prisma.stats.findFirst({
        where: {
            userId: userId,
        }
    });
        const newMatchHistory = await this.prisma.matchHistory.create({
            data: {
                user: {
                    connect: {
                        id: userId,
                    },
                },
            },
        });
        if(!find)
        {
        stats = await this.prisma.stats.create({
            data: {
                user: {
                    connect: {
                        id: userId,
                    },
                },
            },
        }); 
    } 
    else
        stats = find;
    return {newMatchHistory, stats};
}
 async updateMatchHistory(winnerId:string, loserId:string){
    const winner = await this.prisma.user.findUnique({
        where: {
            id: winnerId,
        },
    })
    const loser = await this.prisma.user.findUnique({
        where: {
            id: loserId,
        },
    });
    await this.prisma.$transaction([
        this.prisma.matchHistory.updateMany({
            where: {
                userId: winnerId,
            },
            data: {
                message: `You won against ${loser.username}!`,
            },
        }),
        this.prisma.stats.updateMany({
            where: {
                userId: winnerId,
            },
            data: {
                wins: {
                    increment: 1,
                },
                numberOfMatches:{
                    increment: 1,
                }
            },
        }),
        this.prisma.matchHistory.updateMany({
            where: {
                userId: loserId,
            },
            data: {
                message: `You lost against ${winner.username}!`,
            },
        }),
        this.prisma.stats.updateMany({
            where: {
                userId: loserId,
            },
            data: {
                loses: {  
                    increment: 1,
                },
                numberOfMatches:{
                    increment: 1,
                }
            },
        }),
    ])
    await this.achiev.updateAchievement(winnerId, null);
    await this.achiev.updateAchievement(loserId, null);
}
async getMatchHistory(userId:string){
    const matchHistory = await this.prisma.matchHistory.findFirst({
        where: {
            userId: userId,
        },
    });
    return matchHistory;
}
// async getSoloStats(userId:string){
//     const stats = await this.prisma.stats.findUnique({
//         where: {
//             userId: userId,
//         },
//     });
//     return stats;
// }
}