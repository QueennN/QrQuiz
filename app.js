var express= require('express')
var app =express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs=require('fs')
var sorular=require('./sorular')

//-------------cfg--------------
app.use('/public',express.static('public'))


class Oyuncu{
    constructor(name,id){
        this.id=id
        this.puan=100
        this.name=name
        this.ready=false
        this.index=-1
    }
}

class Game{
    constructor(){
        this.beklemesirasi=[]
        this.oyuncular=[]
        this.basladimi=false
    }


    oyuncu_ekle(name,id){ 
        
        if(this.basladimi==false){
            this.oyuncular[id]=new Oyuncu(name,id)
            console.log('oyuncuid: ' + id+' oyuna eklendi')
        }
        else{
            this.beklemesirasi[id]=new Oyuncu(name,id)
            console.log('oyuncuid: ' + id+' bekleme sırasında"')
        }          
    }
    isim_ekle(id,isim){
        console.log('isim ekle')
        if(this.basladimi==false){
            this.oyuncular[id].name=isim
        }
    }
    ready(id){
        if(this.basladimi==false & this.oyuncular[id].ready!=undefined){
            var oyunculr=this.oyuncular
                oyunculr[id].ready=true
                console.log(oyunculr[id].id+' hazır')
                var flag
                flag=0
               
                for(var x in oyunculr){
                    if(oyunculr[x].ready==false & this.oyuncular[id].ready!=undefined){
                        flag++
                        break
                    }
                }

                if(flag==0){
                    console.log('herkes tamam')
                    for(var i in oyunculr){
                        console.log('Bağlılar->'+oyunculr[i].id)
                    }
                    this.baslat()
                    return true
                }
                else{
                    return false
                }
            
        }else{
            console.log('ready veremezsin-> ' + id)
            return false
        }
        
    }

    baslat(){
        if(this.basladimi==false){  
            console.log('oyun başladı')
            this.basladimi=true
            setTimeout(() => {
                this.bitir()
          
            }, 1000*60);
        } 
    }

    bitir(){
        console.log('bitti')
        this.basladimi=false
        //Puanları ve oyuncu isimlerini bir listeye at rP
        var rP=[]
        for(var x in this.oyuncular){
            rP.push({
                'name':this.oyuncular[x].name,
                'puan':this.oyuncular[x].puan,
            }) 
            this.oyuncular[x].puan=100
        }

        //oyunculara bittiğini ve puanları bildir.
        for(var x in this.oyuncular){
            console.log(this.oyuncular[x].name+'->'+this.oyuncular[x].puan)
            this.oyuncular[x].ready=false
            io.sockets.connected[this.oyuncular[x].id].emit('bitti',rP)
        }
        //beklemesırasını oyuna dahil et
        for(var x in this.beklemesirasi){
            this.oyuncular[x]=this.beklemesirasi[x]
            console.log(this.beklemesirasi[x]+'->'+this.oyuncular[x])
        } 
        this.beklemesirasi=[]
    }
}


//--------App
var games=[]
 games['0']=new Game()
 games['1']=new Game()
 games['2']=new Game()
 games['3']=new Game()
 games['4']=new Game()
 games['5']=new Game()
 games['6']=new Game()
 games['7']=new Game()
 games['8']=new Game()
 games['9']=new Game()


 io.sockets.on('connection',(socket)=>{
    socket.on('oyuncu_ekle',(oyuncu)=>{
        if(games[oyuncu.qr]){
            games[oyuncu.qr].oyuncu_ekle(oyuncu.name,socket.id)
        }
        
    })

    socket.on('isim_ekle',(oyuncu)=>{
        console.log(oyuncu)
        console.log(socket.id)
            games[oyuncu.qr].isim_ekle(socket.id,oyuncu.name)
    })

    socket.on('ready',(qr)=>{
        if(games[qr].basladimi==true){
            io.sockets.connected[socket.id].emit('ready','Oyun zaten başladı')
        }else{
            var kontrol=games[qr].ready(socket.id)//true dönerse herkes hazır demek
            if(kontrol==true){
                for(var x in games[qr].oyuncular){
                    io.sockets.connected[games[qr].oyuncular[x].id].emit('ready','basladi')//her bir kullanıcı için   
                    console.log('başladı bilgisi gönderildi-> '+games[qr].oyuncular[x].id)
                }
            } 
        }  
    })

        
       socket.on('soru',(s_obj)=>{
        if(games[s_obj.qr].basladimi){
            var o=games[s_obj.qr].oyuncular[socket.id]//oyuncu
            if(o.index!=-1 ){
                if(sorular[o.index].cevap==s_obj.cvp){
                    games[s_obj.qr].oyuncular[socket.id].puan++
                }
                else{
                    games[s_obj.qr].oyuncular[socket.id].puan--
                }
                
            }
            else{
            }
            var rnd=Math.floor(Math.random()*(sorular.length))
            var sObj={
                soru:sorular[rnd].soru,
                s0:sorular[rnd].s0,
                s1:sorular[rnd].s1,
                s2:sorular[rnd].s2,
                s3:sorular[rnd].s3,
                puan:games[s_obj.qr].oyuncular[socket.id].puan,
            }
            games[s_obj.qr].oyuncular[socket.id].index=rnd
            io.sockets.connected[socket.id].emit('soru',sObj)
        }
    })        



    socket.on('disconnect',()=>{
        var rO=[]
        for(var x in games){
            if(games[x].oyuncular[socket.id]){//eğer varsa undefied yap dogru qr bul
                games[x].oyuncular[socket.id]=undefined
                console.log('qr->'+x+' '+socket.id+' çıkış yaptı')

                for(var y in games[x].oyuncular){//undefined olanları yeni lisiteye almıyoruz.
                    if(games[x].oyuncular[y]!=undefined){
                        rO[y]=games[x].oyuncular[y]
                    }
                }
                console.log("geriye kalanlar->")
                console.log(rO)
                games[x].oyuncular=rO//yeni listeyi ata
                break
            }
        }
        
        
    })
})

app.get('/',(req,res)=>{
    console.log("qr bilgisi "+req.query.qr)
    fs.readFile('./public/index.html',(err,data)=>{
        if(!err & req.query.qr!=undefined){
            res.writeHead(200)
            res.end(data)    
        }
        else{
            res.end('Qr olmadan giremezsin.')
        }
    })
})

http.listen(80, function(){
    console.log('DENEME listening on *:80');
  });