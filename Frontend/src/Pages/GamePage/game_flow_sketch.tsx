import React, { useContext, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import p5Types from "p5";
import { isConstructorDeclaration } from 'typescript';
import { P5CanvasInstance, ReactP5Wrapper, Sketch } from "react-p5-wrapper";
// import { ContextSocket, socket } from './socket_setup/client-connect';
import { Paddle } from './game-classes/paddle.class';
// import { id_player } from './components/render_game_sketch_components';
import { Ball } from './game-classes/Ball.class';


//h-             WORKING IMPORTS
//y------------------------------------------

import gifMatch from './assets/rescaled_tv.gif';
import f from "./assets/cubecavern_memesbruh03.ttf";
// import jwt_decode from "jwt-decode";
// import loading from "./assets/loading.gif";
import over_g from "./assets/wdS.gif";
import Win from "./assets/Win.png";
import Lose from "./assets/Lose.jpeg";
import { Socket, io } from 'socket.io-client';
// import axios from 'axios';
// import { Cookies } from 'react-cookie';
// import { socket } from './socket_setup/client-connect';
// import { id_player } from './components/render_game_sketch_components';

//y------------------------------------------
//h-   -------------------------------------



let canvas : p5Types.Renderer;
// export let screen_width = 1050;
// export let screen_height = 500;
let id_player : any;
export let socket_gm : Socket;
// let canvasDiv : any;
export let width : any;
export let height : any;

// export let inGame : boolean;
// export let user_id : string;



function SettingUpBackWithFront(socket : Socket , Frontroom : any , p5_ob : any,Screen_display : string){
  socket?.on("PlayersOfRoom",(Backroom : any)=>{
    console.log("Im -->" + socket.id);
    console.log(Backroom);
    
    if (!Frontroom){
      console.log("creating room ...!!");
      Frontroom = {client_count : "",Player1:{Paddle:"",Ball:"",Health_points:0,username:""},Player2:{Paddle:"",Ball:"",Health_points:0,username:""},GameBall:""};
      Frontroom.GameBall = Backroom.GameBall;
      Frontroom.client_count = Backroom.client_count;

      if (Backroom.Player1){
      Frontroom.Player1 = Backroom.Player1;
      Frontroom.Player1.Health_points = Backroom.Player1.Health_points;
      Frontroom.Player1.username = Backroom.Player1.username;
      Frontroom.Player1.Paddle = new Paddle(Frontroom.Player1.x,Frontroom.Player1.y,
        Frontroom.Player1.width,Frontroom.Player1.height,p5_ob,"#FFFA37");
      
      Frontroom.Player1.Ball = new Ball(Backroom.GameBall?.x,Backroom.GameBall?.y,
          Backroom.GameBall?.diameter,p5_ob,Backroom.GameBall?.ball_speed_x,Backroom.GameBall?.ball_speed_y);
      }
      if (Backroom.Player2){
        Frontroom.Player2 = Backroom.Player2;
        Frontroom.Player2.Health_points = Backroom.Player2.Health_points;
        Frontroom.Player2.username = Backroom.Player2.username;
        Frontroom.Player2.Paddle = new Paddle(Frontroom.Player2.x,Frontroom.Player2.y,
          Frontroom.Player2.width,Frontroom.Player2.height,p5_ob,"#FFFA37");

        Frontroom.Player2.Ball = new Ball(Backroom.GameBall?.x,Backroom.GameBall?.y,
            Backroom.GameBall?.diameter,p5_ob,Backroom.GameBall?.ball_speed_x,Backroom.GameBall?.ball_speed_y);
      }
      Screen_display = "on_going";
    }
    else{
      Frontroom.client_count = Backroom.client_count;
      if (!Frontroom.Player1 && Backroom.Player1){
        Frontroom.Player1 = Backroom.Player1;
        Frontroom.Player1.Health_points = Backroom.Player1.Health_points;
        Frontroom.Player1.username = Backroom.Player1.username;
        Frontroom.Player1.Paddle = new Paddle(Frontroom.Player1.x,Frontroom.Player1.y,
          Frontroom.Player1.width,Frontroom.Player1.height,p5_ob,"#FFFA37");

          Frontroom.Player1.Ball = new Ball(Backroom.GameBall?.x,Backroom.GameBall?.y,
              Backroom.GameBall?.diameter,p5_ob,Backroom.GameBall?.ball_speed_x,Backroom.GameBall.ball_speed_y);
        }
        if (!Frontroom.Player2 && Backroom.Player2){
          Frontroom.Player2 = Backroom.Player2;
          Frontroom.Player2.Health_points = Backroom.Player2.Health_points;
          Frontroom.Player2.username = Backroom.Player2.username;
          Frontroom.Player2.Paddle = new Paddle(Frontroom.Player2.x,Frontroom.Player2.y,
            Frontroom.Player2.width,Frontroom.Player2.height,p5_ob,"#FFFA37");

          Frontroom.Player2.Ball = new Ball(Backroom.GameBall?.x,Backroom.GameBall?.y,
              Backroom.GameBall?.diameter,p5_ob,Backroom.GameBall?.ball_speed_x,Backroom.GameBall.ball_speed_y);
        }
    }


    //y- Handling disconnect of Player in frontend


    // for(const id in Frontroom){
      if (!Backroom?.Player1){
          console.log("Player 1 disconnected or doesn't exist in room ->" + Backroom?.id);
          delete Frontroom.Player1;
      }
      if (!Backroom?.Player2){
        console.log("Player 2 disconnected or doesn't exist in room ->" + Backroom?.id);
        delete Frontroom.Player2;
      }
    // }
  //y---------------------------------------------
  

  console.log("client_count--->"+Frontroom.client_count);
  console.log(Frontroom);

  });
}

export const Game_instance = () =>{


  // const [newsocket, setScoket] = useState<Socket>();
  // const [isConnected , setConnected] = useState<boolean>(false);
  // const [Infos, SetInfo] = useState<any>({});

  // socket = io("ws://localhost:3000/game" , {withCredentials: true , transports: ["websocket"] });

  const socketRef = useRef<Socket | null >(null);


  useEffect(()=>{
    if (socketRef.current == null){
      socketRef.current = io("ws://localhost:3000/game", {withCredentials: true, transports: ["websocket"] });
      socket_gm = socketRef.current;
    }
    
    socket_gm?.on("connect",() =>{
      id_player = socket_gm.id;
      width = document.getElementById('child')?.offsetWidth;
      height = document.getElementById('child')?.offsetHeight;
      socket_gm?.emit("PlayerEntered",{s_w : width , s_h : height});
    });
    return () => {
      socket_gm?.off("connect");
      socket_gm?.off("UpdatePlayerPos");
      socket_gm?.off("PlayerLeave");
      socket_gm?.off("PlayersOfRoom");
      socket_gm?.off("UpdateBallPos");
      // setConnected(false);
    }
    
  },[]);
  
const sketch : Sketch = (p5_ob : P5CanvasInstance) => {
    const Frontroom : any = {};
    let MatchmakingPage : p5Types.Image;
    let font : p5Types.Font;
    let ovp : p5Types.Image;
    let win : p5Types.Image;
    let lose : p5Types.Image;
    let Screen_display :string = "on_going";
    let FrontCountDown : number = 6;
    
    // console.log(Infos);
    
    //o- Getting Room Full of Players 1 and 2 and setting up the frontend Player
        SettingUpBackWithFront(socket_gm, Frontroom, p5_ob,Screen_display);
    //o--------------------------------------------------------------------------
  
        //r- Getting Position of player form Backend
  
        socket_gm?.on("UpdatePlayerPos",(Backroom : any)=>{
            // for(const id in Frontroom){
              if(Frontroom.Player1){
                  Frontroom.Player1.Paddle.pos.x = Backroom.Player1?.x;
                  Frontroom.Player1.Paddle.pos.y = Backroom.Player1?.y;
                  Frontroom.Player1.Health_points = Backroom.Player1?.Health_points;
                  Frontroom.Player1.username = Backroom.Player1.username;
              }
              if (Frontroom.Player2){
                Frontroom.Player2.Paddle.pos.x = Backroom.Player2?.x;
                Frontroom.Player2.Paddle.pos.y = Backroom.Player2?.y;
                Frontroom.Player2.Health_points = Backroom.Player2?.Health_points;
                Frontroom.Player2.username = Backroom.Player2.username;
              }
            // }
        });
        //r-------------------------------------------
  
        //r- Getting Position of Ball from Backend
  
        socket_gm?.on("UpdateBallPos",(Backroom : any)=> {
          let reverse_ball_x = width - Backroom.GameBall_x;
  
          // for(const id in Frontroom){
            if (Frontroom.Player1 && socket_gm.id == Frontroom.Player1?.id){
              Frontroom.Player1.Ball.pos.x = Backroom.GameBall_x;
              Frontroom.Player1.Ball.pos.y = Backroom.GameBall_y;
            }else if (Frontroom.Player2 && socket_gm.id == Frontroom.Player2?.id){
              Frontroom.Player2.Ball.pos.x = reverse_ball_x;
              Frontroom.Player2.Ball.pos.y = Backroom.GameBall_y;
            }
          // }
        });


        //r--------------------------------------------
  
        //r- Loading Images
p5_ob.preload = () =>{

          MatchmakingPage = p5_ob.loadImage(gifMatch);
          font = p5_ob.loadFont(f);
          ovp = p5_ob.loadImage(over_g);
          win = p5_ob.loadImage(Win);
          lose = p5_ob.loadImage(Lose);
}
        //r------------------
  
  
        socket_gm?.on("PlayerLeave",(Result)=>{
          console.log("You won by Forfait --->" + socket_gm?.id);
          socket_gm?.disconnect();
          Screen_display = Result.Result;
          // p5_ob.background("#000000");
          // p5_ob.image(ovp,170,0,750,550);
        });

        socket_gm?.on("MatchEnded",(Result)=>{
          console.log("Match Ended By --->" + Result.Result);
          socket_gm?.disconnect();
          Screen_display = Result.Result;
          // p5_ob.background("#000000");
          // p5_ob.image(ovp,170,0,750,550);
        });
  
p5_ob.setup = () => {

        // socket_gm?.on("IminGame",(Player_Info) => {
        //     inGame = Player_Info?.inGame;
        //     user_id = Player_Info?.user_id;
        // });
        let scaled_width = ((80 / 100) * window.innerWidth);
        let scaled_height = ((50 / 100) * scaled_width);
        p5_ob.frameRate(120);
        // canvasDiv = document.getElementById('child');
        // width = document.getElementById('child')?.offsetWidth;
        // height = document.getElementById('child')?.offsetHeight;

          console.log(window.innerWidth);
          console.log(window.innerHeight);
          // console.log("Player Database Id -->" + JSON.stringify(Infos.id) +"\n" 
          // + "Player Database username -->" + JSON.stringify(Infos.username));
        
        canvas = p5_ob.createCanvas(scaled_width,scaled_height);

        // canvas = p5_ob.createCanvas(screen_width,screen_height);
        const canvas_x = (window.innerWidth - p5_ob.width) / 2;
        const canvas_y = (window.innerHeight - p5_ob.height) / 2;
        canvas.position(canvas_x,canvas_y);
        p5_ob.textFont(font);
        p5_ob.textSize(5 / 100 * p5_ob.width);
        p5_ob.textAlign(p5_ob.CENTER, p5_ob.CENTER);
}


      socket_gm?.on("CountDown",(C_T)=>{
      
      FrontCountDown = C_T.CountDown;
      console.log("Counting From Frontend -->" + C_T.CountDown);
      })
      
p5_ob.draw = () =>{

        console.log("FrontCountDown -->" + FrontCountDown);

        if (Screen_display == "Win"){
          p5_ob.background(win);
          console.log("You Won");
        }
        else if (Screen_display == "Lose"){
          p5_ob.background(lose);
          console.log("You Lost");
        }
        else{
        if (Screen_display === "on_going"){

          // for(const id in Frontroom){
            p5_ob.background("#FA9200");
            const id_of_player1 = Frontroom.Player1?.id;
            const id_of_player2 = Frontroom.Player2?.id;
            const Player1 = Frontroom.Player1?.Paddle;
            const Player2 = Frontroom.Player2?.Paddle;
            console.log(Frontroom.Player1?.username + ": My Health points are ---> " + Frontroom.Player1?.Health_points);
            console.log(Frontroom.Player2?.username + ": My Health points are ---> " + Frontroom.Player2?.Health_points);
      
        if (Frontroom.Player1 && Frontroom.Player2){
          if (FrontCountDown > 0){
              p5_ob.fill("#e0e3ba");
              p5_ob.textSize(150);
              p5_ob.text(FrontCountDown, width / 2, height / 2);
            }
            else{
                    if (id_of_player1 == id_player){
                      Player1?.update_Player_pos(canvas);
                      if (Player2 && id_of_player2 != id_player){
                        Player2.pos.x = width - Player2.paddle_width;
                        Player2?.update_Player_pos(canvas);
                      }
                    }
                    else if (id_of_player2 == id_player){
                      
                      Player2?.update_Player_pos(canvas);
                      if (Player1 && id_of_player1 != id_player){
                        Player1.pos.x = width - Player1.paddle_width;
                        Player1?.update_Player_pos(canvas);
                      }
                    }
    
                    if (id_of_player1 == id_player)
                      Frontroom.Player1?.Ball.update_pos(Frontroom.Player1?.Paddle,Frontroom.Player2?.Paddle,width,height);
                    else if (id_of_player2 == id_player)
                    Frontroom.Player2?.Ball.update_pos(Frontroom.Player1?.Paddle,Frontroom.Player2?.Paddle,width,height);
                    // console.log(Player1.pos.x); 
            }
        }
        else{
              p5_ob.background(MatchmakingPage);
              // p5_ob.image(MatchmakingPage,170,0,750,550);
              p5_ob.fill("#e0e3ba");
              p5_ob.text("MatchMaking ...",p5_ob.width / 2 -  25 ,p5_ob.height/2);
          }
        // }
      }
      else if (Screen_display == "Forfait"){
          console.log("Game  Over someone forfaited");
          p5_ob.background(ovp);
          // p5_ob.image(ovp,250,0,600,550);
      }
    }
}
  
    p5_ob.windowResized = () =>{
      // canvasDiv = document.getElementById('child');
      let scaled_width = ((80 / 100) * window.innerWidth);
        let scaled_height = ((50 / 100) * scaled_width);
      console.log("resize--> " + window.innerWidth);
      console.log("resize--> " + window.innerHeight);
      if (p5_ob){
        // socket_gm?.emit("UpdateScreenmetrics",{s_w : width , s_h : height});
        p5_ob.resizeCanvas(scaled_width,scaled_height);
        canvas = p5_ob.createCanvas(scaled_width,scaled_height);
        const canvas_x = (window.innerWidth - p5_ob.width) / 2;
        const canvas_y = (window.innerHeight - p5_ob.height) / 2;
        canvas.position(canvas_x,canvas_y);
        p5_ob.textSize(5 / 100 * p5_ob.width);
        }
    }
  }

  return (
    <ReactP5Wrapper sketch={sketch}/>
  )
}


















        // canvasDiv = document.querySelector('#child_canvas');
      // width = canvasDiv?.offsetWidth;
      //- height = canvasDiv?.offsetHeight;












        //       console.log("A player is missing");
        //       // image(img, 0, 0, width, height, 0, 0, img.width, img.height, COVER);
        //       // p5_ob.image(load,0,0);
              // p5_ob.strokeWeight(4);
              // p5_ob.stroke(51);
              // p5_ob.background("#fcba03");








        //       // p5_ob.text("...",190,100);
        //       // if (id_of_player1 == id_player){
        //       //   // Frontroom[id].Player1.Ball.pos.x = screen_width / 2;
        //       //   // Frontroom[id].Player1.Ball.pos.y = screen_height / 2;
        //       //   // Frontroom[id].Player1.Ball.draw_the_ball("#e9ed09");
        //       }
              
        //     //   //b- ----------------------
      
        //     //   // else if (id_of_player2 == id_player)
        //     //   //   Frontroom[id].Player1.Ball.pos.x = screen_width / 2;
        //     //   //   Frontroom[id].Player1.Ball.pos.y = screen_height / 2;
        //     //   //   Frontroom[id].Player2.Ball.draw_the_ball("#e9ed09");
        //     // }
      
        //     //y----------------------------------








          // console.log("I got Coords");
          // console.log(Backroom.Player1?.y);




   // console.log("My Player ID --> "+ id_player);
      // console.log("ID of Player --->" + id_player);
      //   frontendPlayers[id_player]?.update_Player_pos(canvas);





 // socket?.on("UpdatePlayerPos",)
  // for(const id in backendPlayers) {
  //   const backendplayer = backendPlayers[id];
  //   if(!frontendPlayers[id]){
        // frontendPlayers[BackroomPlayer.id] = new Paddle(BackroomPlayer.x,BackroomPlayer.y, BackroomPlayer.width , BackroomPlayer.height , p5_ob,"#FFFA37");
  //   }else{
  //     frontendPlayers[id].pos.x = backendplayer.x;
  //     frontendPlayers[id].pos.y = backendplayer.y;
  //   }
  // }


  // for(const id in frontendPlayers) {
  //   if(!backendPlayers[id]){
  //     delete frontendPlayers[id];
  //   }
  // }  

  // //     console.log(data.msg);
  // //     // players[data.Players.id] = new Paddle(data.Players.x,20,80,data.Players.y,p5_ob);
  // //     // players[data.Players] = new Paddle()
  // //     // socket?.emit("populate-toserver",{Player:data.Players});
  // //     // console.log(players);
  //   // console.log(frontendPlayers[socket.id]);
  //   // console.log(socket.id);
  //   // console.log(frontendPlayers[socket.id]);
  // })




  // try{
      //   axios.get(`http://localhost:3000/users/${token.id}`,{ withCredentials: true })
      //       .then(Resp => SetInfo(Resp.data))
      //       .catch(error => console.error(error));
      //   }catch(error){
      //     console.error(error);
      //   }
        
      // try{
      //   axios.patch(`http://localhost:3000/users/statingame`,{ingame : true},{ withCredentials: true })
      //   .then(Resp => console.log("Patched"))
      //   .catch(error => console.error(error));
      // }catch(error){
      //   console.log(error);
      // }


      // const GetUserInfo = async (token : any) =>{
//   try{
//     const Resp = await axios.get(`http://localhost:3000/users/${token.id}`,{ withCredentials: true });
//     console.log(Resp);
//   }catch (error){
//     console.error(error);
//   }
// }


  // const cookies = new Cookies();
  // const jwt = cookies.get('jwt');
  // const token : any = jwt_decode(jwt);


      // console.log(Infos);
    // console.log("token Game--->" + JSON.stringify(token));
    // axios.get(`http://localhost:3000/users/${token.id}`,{ withCredentials: true })
    // .then(response => console.log(response));


              // try{
          //   axios.patch(`http://localhost:3000/users/statingame`,{ingame : false},{ withCredentials: true })
          //   .then(Resp => console.log("Patched"))
          //   .catch(error => console.error(error));
          // }catch(error){
          //   console.log(error);
          // }