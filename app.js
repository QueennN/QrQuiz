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
        if(io.sockets.connected.length!=0){
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
var st=[]//socketlere göre qr

 io.sockets.on('connection',(socket)=>{
     console.log('baglandi')
    var o_qr=st[socket.id]
     st[socket.id]=''
    socket.on('oyuncu_ekle',(qr)=>{
        o_qr=qr
        if(games[o_qr]){
            console.log('Qr bulundu')
            games[o_qr].oyuncu_ekle('',socket.id)
            console.log('oyuncu eklendi : '+socket.id+' qr: '+o_qr )
            socket.on('isim_ekle',(name)=>{
                console.log('İsim eklendi'+name)
                
                console.log(socket.id)
                games[o_qr].isim_ekle(socket.id,name)
                
                socket.on('ready',()=>{
                    if(games[o_qr].basladimi==true){
                        io.sockets.connected[socket.id].emit('ready','Oyun zaten başladı')
                    }else{
                        var kontrol=games[o_qr].ready(socket.id)//true dönerse herkes hazır demek
                        if(kontrol==true){
                            for(var x in games[o_qr].oyuncular){
                                io.sockets.connected[games[o_qr].oyuncular[x].id].emit('ready','basladi')//her bir kullanıcı için   
                                console.log('başladı bilgisi gönderildi-> '+games[o_qr].oyuncular[x].id)
                                  
                            }
                            socket.on('soru',(s_obj)=>{
                                if(games[o_qr].basladimi){
                                    var o=games[o_qr].oyuncular[socket.id]//oyuncu
                                    if(o.index!=-1 ){
                                        if(sorular[o.index].cevap==s_obj.cvp){
                                            games[o_qr].oyuncular[socket.id].puan++
                                        }
                                        else{
                                            games[o_qr].oyuncular[socket.id].puan--
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
                                        puan:games[o_qr].oyuncular[socket.id].puan,
                                    }
                                    games[o_qr].oyuncular[socket.id].index=rnd
                                    io.sockets.connected[socket.id].emit('soru',sObj)
                                }
                            })      
                        } 
                    }  
                })
            })
        }
        
    })
    socket.on('disconnect',()=>{
        var rO=[]
        var dqr=st[socket.id]//qr
        if(games[dqr]){
            games[dqr].oyuncular[socket.id]=undefined
            console.log('qr->'+dqr+' '+socket.id+' çıkış yaptı')

            for(var y in games[dqr].oyuncular){//undefined olanları yeni lisiteye almıyoruz.
                if(games[dqr].oyuncular[y]!=undefined){
                    rO[y]=games[dqr].oyuncular[y]
                }
            }
            console.log("geriye kalanlar->")
            console.log(rO)
            games[dqr].oyuncular=rO//yeni listeyi ata
        }
        

    })
})

app.get('/',(req,res)=>{
    console.log("qr : "+req.query.qr + "\tip : " + req.ip)
    fs.readFile('./public/index.html',(err,data)=>{
        if(!err & req.query.qr!=undefined){
            res.writeHead(200)
            res.end(data)    
        }
        else{
            res.end('Etrafınızda bir QrQuiz qrı bulup girmeyi deneyin..')
        }
    })
})

http.listen(80, function(){
    console.log('DENEME listening on *:80');
  });