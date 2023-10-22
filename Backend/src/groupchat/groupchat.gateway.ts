import { Body, Get, Logger, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer , WsResponse } from '@nestjs/websockets';
import { decode } from 'jsonwebtoken';
import {Server , Socket } from 'socket.io'
import { JwtGuard } from 'src/guards/jwt.guards';
import { PrismaService } from 'src/auth/prisma.service';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { use } from 'passport';
import { emit } from 'process';

let map = new Map <any , any>();
let mapclient = new Map <any , any>();


@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
  namespace: 'groupchat',
})

export class GroupchatGateway implements OnGatewayInit , OnGatewayConnection, OnGatewayDisconnect{
  constructor(private readonly prisma: PrismaService,private readonly Jwt:JwtService) {}
  @WebSocketServer() server : Server;
  private logger : Logger = new  Logger('gorupChatGateway');

  ////////////////////////////////// -----dis-- ////////////////////////////////
  async handleDisconnect(client: Socket, ...args: any[]) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const user = await this.getUser(client);
    if(user)
    {
     
      mapclient.delete( user.id);
    }
  } 

  async handleConnection(client: any, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    const user = await this.getUser(client);
    if(user)
    {
      console.log("in user cond ", user.id+ "   "+ client.id)
      mapclient.set(user.id,client.id);
    }
  }
  afterInit(server: any) {
    this.logger.log("initialized");
  }

  async getUser(client: Socket)  {
    const session = client.handshake.headers.cookie;
    if (session) {
      const jwt = session.split('=')[1];
      const t = decode(jwt);
      if (session && jwt) {
        try{
          const user = await this.Jwt.verifyAsync(jwt,{secret:'THISISMYJWTSECRET'});
          return user;
        }catch(err){
          return null; 
        }
      }
    }
    return null;
  }
  ////////////////////////////////// -----ROOM-- ////////////////////////////////

  //socket.emit('joinRoom', {room : ${roomid}})
  @SubscribeMessage('joinRoom')
  async handlenJoinRoom(client : Socket , data : any)
  {
      const user = await this.getUser(client);
      const inroom = await this.prisma.groupchat.findMany({
        where: {
          AND: [
            { id : data.roomid },
            { usersgb : {some : {id : user.id}}}
          ],
        },
      });
      if(inroom.length != 0){
        if(map.get(`${data.roomid}${user.id}`) != client.id)
        { 
          map.set(data.roomid + user.id , client.id)
          console.log("user join ==" , user.id, " room   :: ", data.roomid , "get room: ",map.get(data.roomid+user.id));
          // console.log("map ==> " ,map);
          client.join(data.roomid);
        }
      }
  }



  //socker.emit('msgToRoom', {room : $roomid , message : "hello"})
  //socket.on('msgToclient' , (res) =>{ })
  @SubscribeMessage('msgToRoom')
  async handleMessageRoom(client : Socket, body : any) {
    const user = await this.getUser(client);
    // get usermuted of a groupchat
    const usermuted = await this.prisma.groupchat.findUnique({
      where: { id: body.roomid },
      select: {
        usersmute: true,
      },
    });
    //check if user is muted
    if(usermuted.usersmute.some((usermute) => usermute.id == user.id)){
      console.log("user is muted");
      return ;
    }
    const inroom = await this.prisma.groupchat.findMany({
      where: {
        AND: [
          { id : body.roomid },
          { usersgb : {some : {id : user.id}}}
        ],
      },
    });

    if(inroom.length != 0){
      await this.prisma.messagegb.create({
        data: {
          sender: {connect: {id: user.id}},
          groupchat: {connect: {id: body.roomid}},
          message : body.message
        },
      });
      console.log("========++++++=======");
      const blocked =  await this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          blocked: true,
        },
      });

      const allsocket = await this.server.in(body.roomid).fetchSockets();
      allsocket.forEach((socket) => {
        blocked.blocked.forEach((block) => {
          if (socket.id == map.get(body.roomid + block.id)) {
            socket.leave(body.roomid);
          }
        });
      });


      this.server.to(body.roomid).emit(body.roomid, {
        roomid: body.roomid,
        timestamp: body.timestamp,
        side: body.side,
        messageid: body.messageId,
        message: body.message,
        idsender: user.id,
        username: user.username,
        pic: user.image,

      });
      

      allsocket.forEach((socket) => {
        blocked.blocked.forEach((block) => {
          if (socket.id == map.get(body.roomid + block.id)) {
            socket.join(body.roomid);
          }
        });
      });

    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(client : Socket, data : any)
  {
    const user = await this.getUser(client);
    const inroom = await this.prisma.groupchat.findMany({
      where: {
        AND: [
          { id : data.roomid },
          { usersgb : {some : {id : user.id}}}
        ],
      },
    });
    if(inroom.length != 0){
      client.leave(data.roomid);
    }
  }


  async sendrequest(id : string , idsender : string){
    console.log("map  :: ", mapclient);
    //check if user in groupchat
    const inroom = await this.prisma.groupchat.findMany({
      where: {
        AND: [
          { id : id },
          { usersgb : {some : {id : idsender}}}
        ],
      },
    });
    if(inroom.length != 0){
      console.log("user in groupchat");
      return;
    }
    //get userban of a groupchat
    const userban = await this.prisma.groupchat.findUnique({
      where: { id: id },
      select: {
        usersblock: true,
      },
    });
    //check if user is ban
    if(userban.usersblock.some((user) => user.id == idsender)){
      console.log("user is ban");
      return ;
    }
    //get superadmin of a groupchat
    const superadmin = await this.prisma.groupchat.findUnique({
      where: { id: id },
      select: {
        superadmin: true,
      },
    });
    //check if notification already exist
    const notification = await this.prisma.requestjoingroup.findMany({
      where: {
        AND: [
          { senderId : idsender },
          { receiverId : superadmin.superadmin.id }
        ],
      },
    });
    if(notification.length != 0){
      return;
    }
    //create notification in database
    await this.prisma.requestjoingroup.create({
      data: {
        sender: {connect: {id: idsender}},
        receiver: {connect: {id: superadmin.superadmin.id}},
      },
    });

    //get user 
    const user = await this.prisma.user.findUnique({
      where: { id: idsender },
    });
    this.server.emit('notificationgrp', {
      userId: idsender,
      type: 'join groupchat',
      photo: user.profileImage,
      message: `${user.username} sent you a friend request`,
      from: superadmin.superadmin.id,
      username: user.username,
    });
  }
}
