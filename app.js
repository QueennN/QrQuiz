var mdb=require('./mdb.js')
var express= require('express')
var app =express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs=require('fs')


//----cfg---
app.use('/public',express.static('public'))



class Oyuncu{
    constructor(name){
        this.puan=0
        this.name=name
        this.ready=false
        this.gameid=null
    }
}

class Game{
    constructor(gameid){
    this.id=gameid
    this.toplamready=0
    this.sorular=new mdb()
    this.oyuncular=new mdb()
    }

    oyuncu_ekle(oyuncu){
        oyuncular.save(oyuncu)
    
    }
    ready(oyuncuid){
        this.ready++
        if(this.ready==oyuncular.length){
            baslat()
        }
    }
    baslat(){
        
    }

    sorugonder(){
        var sorulr=this.sorular.mdb
        var rnd=Math.random() * sorulr.length
        return sorulr[rnd]
    }

    cevapal(oyuncu_id,soru_index,cevap){
        var sorulr=this.sorular.mdb
        var oyunculr=this.oyuncular.mdb
        if(sorulr[soru_index].cevap==cevap){
            oyunculr[oyuncu_id].puan++
        }
    }

    bitir(){

    }


}

var oyun=new Game('deneme')

app.get('/',(req,res)=>{
    fs.readFile('./public/index.html',(err,data)=>{
        if(!err){
            res.writeHead(200)
            res.end(data)
            
        }
    })
})



io.on('connection',(socket)=>{
    console.log('giriş yapıldı')
    socket.on('login',(oyuncu_verisi)=>{
        var oyuncu= new Oyuncu()
    })
    socket.on('cevapla',()=>{
        console.log('cevap geldi')
    })
    socket.on('disconnect',()=>{

    })
})

http.listen(3000, function(){
    console.log('listening on *:3000');
  });